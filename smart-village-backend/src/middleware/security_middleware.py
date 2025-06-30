"""
Security Middleware for Smart Village Management System
Handles permission checking, village scope validation, and emergency overrides
"""

from functools import wraps
from flask import request, jsonify, current_app, g
from src.models.user_model import User
from src.models.user_village import UserVillage
from src.models.emergency_override import EmergencyOverride
from src.routes.auth_routes import get_current_user
import time
from collections import defaultdict
from datetime import datetime, timedelta

# Rate limiting storage (in production, use Redis)
rate_limit_storage = defaultdict(list)

def rate_limit(max_requests=100, window_minutes=15):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client identifier
            client_id = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            current_user = get_current_user()
            if current_user:
                client_id = f"user_{current_user.id}"
            
            # Clean old entries
            cutoff_time = time.time() - (window_minutes * 60)
            rate_limit_storage[client_id] = [
                timestamp for timestamp in rate_limit_storage[client_id]
                if timestamp > cutoff_time
            ]
            
            # Check rate limit
            if len(rate_limit_storage[client_id]) >= max_requests:
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'code': 'RATE_LIMIT_EXCEEDED',
                    'retry_after': window_minutes * 60
                }), 429
            
            # Add current request
            rate_limit_storage[client_id].append(time.time())
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_village_scope(permission, allow_emergency_override=True):
    """
    Enhanced permission decorator with village scope and emergency override support
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get village_id from various sources
            village_id = (
                kwargs.get('village_id') or 
                request.view_args.get('village_id') or
                request.json.get('village_id') if request.json else None or
                request.args.get('village_id')
            )
            
            # Super Admin bypasses all checks (except emergency override logging)
            if current_user.has_role('superadmin'):
                # Log Super Admin access for audit
                if village_id:
                    current_app.logger.info(
                        f"Super Admin Access: {current_user.username} "
                        f"accessed {permission} for village {village_id}"
                    )
                return f(*args, **kwargs)
            
            # Check basic permission
            if not current_user.has_permission(permission):
                # Check for emergency override if allowed
                if allow_emergency_override and village_id:
                    resource = permission.split('.')[0]  # e.g., 'villages' from 'villages.read'
                    action = permission.split('.')[1]    # e.g., 'read' from 'villages.read'
                    
                    override = EmergencyOverride.check_override(
                        user_id=current_user.id,
                        resource=resource,
                        target_id=village_id,
                        action=action
                    )
                    
                    if override:
                        # Log emergency override usage
                        current_app.logger.warning(
                            f"Emergency Override Used: {current_user.username} "
                            f"used override {override.id} for {permission} on village {village_id}"
                        )
                        
                        # Add override info to request context
                        g.emergency_override_used = override
                        return f(*args, **kwargs)
                
                return jsonify({
                    'error': f'Permission {permission} required',
                    'code': 'PERMISSION_DENIED'
                }), 403
            
            # Check village scope for non-super admins
            if village_id and not current_user.has_village_access(village_id):
                # Check for emergency override
                if allow_emergency_override:
                    resource = permission.split('.')[0]
                    action = permission.split('.')[1]
                    
                    override = EmergencyOverride.check_override(
                        user_id=current_user.id,
                        resource=resource,
                        target_id=village_id,
                        action=action
                    )
                    
                    if override:
                        # Log emergency override usage
                        current_app.logger.warning(
                            f"Emergency Override Used: {current_user.username} "
                            f"used override {override.id} for village access to {village_id}"
                        )
                        
                        g.emergency_override_used = override
                        return f(*args, **kwargs)
                
                return jsonify({
                    'error': 'Access denied to this village',
                    'code': 'VILLAGE_ACCESS_DENIED',
                    'village_id': village_id
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_resource_permission(resource, action, allow_emergency_override=True):
    """
    Generic resource permission decorator with emergency override support
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            permission = f"{resource}.{action}"
            
            # Get target_id from various sources
            target_id = (
                kwargs.get('id') or
                kwargs.get(f'{resource}_id') or
                request.view_args.get('id') or
                request.view_args.get(f'{resource}_id') or
                request.json.get('id') if request.json else None or
                request.args.get('id')
            )
            
            # Super Admin bypasses permission checks
            if current_user.has_role('superadmin'):
                return f(*args, **kwargs)
            
            # Check basic permission
            if not current_user.has_permission(permission):
                # Check for emergency override if allowed
                if allow_emergency_override and target_id:
                    override = EmergencyOverride.check_override(
                        user_id=current_user.id,
                        resource=resource,
                        target_id=str(target_id),
                        action=action
                    )
                    
                    if override:
                        # Log emergency override usage
                        current_app.logger.warning(
                            f"Emergency Override Used: {current_user.username} "
                            f"used override {override.id} for {permission} on {resource} {target_id}"
                        )
                        
                        g.emergency_override_used = override
                        return f(*args, **kwargs)
                
                return jsonify({
                    'error': f'Permission {permission} required',
                    'code': 'PERMISSION_DENIED'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def audit_log(action_type, resource=None, target_id=None, details=None):
    """
    Audit logging decorator
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            start_time = time.time()
            
            # Execute the function
            try:
                result = f(*args, **kwargs)
                status = 'SUCCESS'
                
                # Extract status code from response
                if isinstance(result, tuple) and len(result) >= 2:
                    status_code = result[1]
                    if status_code >= 400:
                        status = 'FAILED'
                else:
                    status_code = 200
                
            except Exception as e:
                status = 'ERROR'
                status_code = 500
                raise
            
            finally:
                # Log the action
                duration = time.time() - start_time
                
                # Get client info
                client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
                user_agent = request.headers.get('User-Agent', '')
                
                # Determine resource and target_id if not provided
                if not resource:
                    resource = request.endpoint.split('.')[-1] if request.endpoint else 'unknown'
                
                if not target_id:
                    target_id = (
                        kwargs.get('id') or
                        request.view_args.get('id') if request.view_args else None
                    )
                
                # Check if emergency override was used
                emergency_override_id = None
                if hasattr(g, 'emergency_override_used'):
                    emergency_override_id = str(g.emergency_override_used.id)
                
                # Create audit log entry
                audit_entry = {
                    'timestamp': datetime.utcnow().isoformat(),
                    'user_id': str(current_user.id) if current_user else None,
                    'username': current_user.username if current_user else None,
                    'action_type': action_type,
                    'resource': resource,
                    'target_id': str(target_id) if target_id else None,
                    'status': status,
                    'status_code': status_code,
                    'duration_ms': round(duration * 1000, 2),
                    'client_ip': client_ip,
                    'user_agent': user_agent,
                    'emergency_override_id': emergency_override_id,
                    'details': details
                }
                
                # Log to application logger
                log_level = 'WARNING' if emergency_override_id else 'INFO'
                log_message = (
                    f"AUDIT: {action_type} by {current_user.username if current_user else 'Anonymous'} "
                    f"on {resource} {target_id or ''} - {status} ({status_code}) "
                    f"in {duration*1000:.2f}ms"
                )
                
                if emergency_override_id:
                    log_message += f" [EMERGENCY OVERRIDE: {emergency_override_id}]"
                
                if log_level == 'WARNING':
                    current_app.logger.warning(log_message)
                else:
                    current_app.logger.info(log_message)
                
                # In production, this would also be sent to a dedicated audit log system
                # audit_logger.log(audit_entry)
            
            return result
        return decorated_function
    return decorator

def validate_village_assignment(f):
    """
    Decorator to validate that user has active village assignment
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_current_user()
        if not current_user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Super Admin bypasses this check
        if current_user.has_role('superadmin'):
            return f(*args, **kwargs)
        
        # Check if user has any active village assignments
        active_assignments = current_user.get_village_assignments(active_only=True)
        if not active_assignments:
            return jsonify({
                'error': 'No active village assignments found',
                'code': 'NO_VILLAGE_ASSIGNMENT',
                'message': 'Contact your administrator to assign you to a village'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

def check_village_permission(village_id, permission_type):
    """
    Helper function to check village-specific permissions
    """
    current_user = get_current_user()
    if not current_user:
        return False
    
    # Super Admin has all permissions
    if current_user.has_role('superadmin'):
        return True
    
    # Check village assignment and permission
    assignment = UserVillage.query.filter_by(
        user_id=current_user.id,
        village_id=village_id,
        is_active=True
    ).first()
    
    if not assignment:
        return False
    
    return assignment.has_village_permission(permission_type)

def get_user_villages_scope():
    """
    Helper function to get villages that current user can access
    Returns list of village IDs or None for Super Admin (all villages)
    """
    current_user = get_current_user()
    if not current_user:
        return []
    
    # Super Admin can access all villages
    if current_user.has_role('superadmin'):
        return None  # None means all villages
    
    # Get assigned village IDs
    assignments = current_user.get_village_assignments(active_only=True)
    return [str(assignment.village_id) for assignment in assignments]

def require_same_user_or_admin(user_id_param='user_id'):
    """
    Decorator to ensure user can only access their own data or is admin
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            # Get target user ID
            target_user_id = kwargs.get(user_id_param)
            
            # Super Admin can access any user
            if current_user.has_role('superadmin'):
                return f(*args, **kwargs)
            
            # User can access their own data
            if str(current_user.id) == str(target_user_id):
                return f(*args, **kwargs)
            
            return jsonify({
                'error': 'Access denied',
                'code': 'INSUFFICIENT_PERMISSION'
            }), 403
        
        return decorated_function
    return decorator

# Middleware to add security headers
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Function to register middleware with Flask app
def register_security_middleware(app):
    """Register security middleware with Flask app"""
    
    @app.after_request
    def after_request(response):
        return add_security_headers(response)
    
    @app.before_request
    def before_request():
        # Clean up expired emergency overrides periodically
        # This could be moved to a background task in production
        if hasattr(g, 'override_cleanup_done'):
            return
        
        # Run cleanup once per request cycle (not efficient, but works for demo)
        try:
            EmergencyOverride.cleanup_expired()
            g.override_cleanup_done = True
        except Exception as e:
            current_app.logger.error(f"Error during automatic override cleanup: {str(e)}")
    
    return app

