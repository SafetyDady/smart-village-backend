"""
Emergency Override API Routes
Smart Village Management System
"""

from flask import Blueprint, request, jsonify, current_app
from src.models.user import db
from src.models.emergency_override import EmergencyOverride
from src.models.user_model import User
from src.routes.auth_routes import require_permission, get_current_user
from datetime import datetime, timedelta
import uuid

emergency_bp = Blueprint('emergency_override', __name__, url_prefix='/api/emergency-override')

def get_client_info():
    """Get client IP and User Agent for audit purposes"""
    return {
        'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        'user_agent': request.headers.get('User-Agent', '')
    }

@emergency_bp.route('', methods=['POST'])
@require_permission('audit.emergency_override')
def create_emergency_override():
    """Create emergency override (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Double-check Super Admin role
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can create emergency overrides',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['target_resource', 'action', 'reason']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate reason length
        reason = data['reason'].strip()
        if len(reason) < 10:
            return jsonify({'error': 'Reason must be at least 10 characters long'}), 400
        
        # Get client info for audit
        client_info = get_client_info()
        
        # Create override
        hours = data.get('expires_in_hours', 1)
        if hours < 0.1 or hours > 24:  # Min 6 minutes, Max 24 hours
            return jsonify({'error': 'expires_in_hours must be between 0.1 and 24'}), 400
        
        override = EmergencyOverride.create_override(
            user_id=current_user.id,
            target_resource=data['target_resource'],
            action=data['action'],
            reason=reason,
            target_id=data.get('target_id'),
            hours=hours,
            ip_address=client_info['ip_address'],
            user_agent=client_info['user_agent']
        )
        
        db.session.commit()
        
        # Log the creation
        current_app.logger.warning(
            f"Emergency Override Created: User {current_user.username} "
            f"created override for {data['target_resource']}.{data['action']} "
            f"(Target: {data.get('target_id', 'N/A')}) - Reason: {reason}"
        )
        
        return jsonify({
            'override': override.to_dict(include_user=True),
            'message': 'Emergency override created successfully',
            'warning': 'This override will expire automatically. Use responsibly.'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating emergency override: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('s', methods=['GET'])  # /api/emergency-overrides
@require_permission('audit.emergency_override')
def get_emergency_overrides():
    """Get emergency overrides (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can view overrides
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can view emergency overrides',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status', 'active')  # active, expired, all
        resource = request.args.get('resource', '').strip()
        user_id = request.args.get('user_id', '').strip()
        
        # Build query
        query = EmergencyOverride.query
        
        if status == 'active':
            query = query.filter(
                EmergencyOverride.is_active == True,
                EmergencyOverride.expires_at > datetime.utcnow()
            )
        elif status == 'expired':
            query = query.filter(
                db.or_(
                    EmergencyOverride.is_active == False,
                    EmergencyOverride.expires_at <= datetime.utcnow()
                )
            )
        # 'all' - no additional filter
        
        if resource:
            query = query.filter(EmergencyOverride.target_resource == resource)
        
        if user_id:
            query = query.filter(EmergencyOverride.user_id == user_id)
        
        query = query.order_by(EmergencyOverride.created_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        overrides = []
        for override in pagination.items:
            override_data = override.to_dict(include_user=True)
            overrides.append(override_data)
        
        return jsonify({
            'overrides': overrides,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'filters': {
                'status': status,
                'resource': resource,
                'user_id': user_id
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting emergency overrides: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('s/<override_id>', methods=['DELETE'])  # /api/emergency-overrides/{id}
@require_permission('audit.emergency_override')
def revoke_emergency_override(override_id):
    """Revoke emergency override (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can revoke overrides
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can revoke emergency overrides',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        override = EmergencyOverride.query.get(override_id)
        if not override:
            return jsonify({'error': 'Emergency override not found'}), 404
        
        # Check if already revoked or expired
        if not override.is_valid:
            return jsonify({
                'error': 'Override is already revoked or expired',
                'code': 'OVERRIDE_INVALID'
            }), 400
        
        # Revoke the override
        override.revoke()
        db.session.commit()
        
        # Log the revocation
        current_app.logger.warning(
            f"Emergency Override Revoked: User {current_user.username} "
            f"revoked override {override_id} for {override.target_resource}.{override.action}"
        )
        
        return jsonify({
            'message': 'Emergency override revoked successfully',
            'override': override.to_dict(include_user=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error revoking emergency override {override_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('s/<override_id>/extend', methods=['PUT'])  # /api/emergency-overrides/{id}/extend
@require_permission('audit.emergency_override')
def extend_emergency_override(override_id):
    """Extend emergency override expiry (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can extend overrides
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can extend emergency overrides',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        override = EmergencyOverride.query.get(override_id)
        if not override:
            return jsonify({'error': 'Emergency override not found'}), 404
        
        # Check if already revoked
        if not override.is_active:
            return jsonify({
                'error': 'Cannot extend revoked override',
                'code': 'OVERRIDE_REVOKED'
            }), 400
        
        data = request.get_json()
        hours = data.get('hours', 1) if data else 1
        
        if hours < 0.1 or hours > 12:  # Max 12 hours extension
            return jsonify({'error': 'Extension hours must be between 0.1 and 12'}), 400
        
        # Extend the override
        override.extend_expiry(hours=hours)
        db.session.commit()
        
        # Log the extension
        current_app.logger.warning(
            f"Emergency Override Extended: User {current_user.username} "
            f"extended override {override_id} by {hours} hours"
        )
        
        return jsonify({
            'message': f'Emergency override extended by {hours} hours',
            'override': override.to_dict(include_user=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error extending emergency override {override_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('s/history', methods=['GET'])  # /api/emergency-overrides/history
@require_permission('audit.read')
def get_override_history():
    """Get emergency override history"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can view full history
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can view override history',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        days = request.args.get('days', 30, type=int)
        if days > 365:  # Max 1 year
            days = 365
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 100)
        resource = request.args.get('resource', '').strip()
        user_id = request.args.get('user_id', '').strip()
        
        # Get history
        overrides = EmergencyOverride.get_override_history(
            user_id=user_id if user_id else None,
            resource=resource if resource else None,
            days=days
        )
        
        # Manual pagination for history
        total = len(overrides)
        start = (page - 1) * per_page
        end = start + per_page
        page_overrides = overrides[start:end]
        
        history_data = []
        for override in page_overrides:
            override_data = override.to_dict(include_user=True)
            history_data.append(override_data)
        
        return jsonify({
            'history': history_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page,
                'has_next': end < total,
                'has_prev': page > 1
            },
            'filters': {
                'days': days,
                'resource': resource,
                'user_id': user_id
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting override history: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('s/statistics', methods=['GET'])  # /api/emergency-overrides/statistics
@require_permission('audit.read')
def get_override_statistics():
    """Get emergency override usage statistics"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can view statistics
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can view override statistics',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        days = request.args.get('days', 30, type=int)
        if days > 365:  # Max 1 year
            days = 365
        
        # Get statistics
        stats = EmergencyOverride.get_statistics(days=days)
        
        # Add current active overrides
        active_overrides = EmergencyOverride.get_active_overrides()
        stats['current_active_overrides'] = len(active_overrides)
        
        # Add most recent overrides
        recent_overrides = EmergencyOverride.query.order_by(
            EmergencyOverride.created_at.desc()
        ).limit(5).all()
        
        stats['recent_overrides'] = [
            {
                'id': str(override.id),
                'resource': override.target_resource,
                'action': override.action,
                'user': override.user.username,
                'created_at': override.created_at.isoformat(),
                'is_valid': override.is_valid
            }
            for override in recent_overrides
        ]
        
        # Add time period info
        stats['time_period'] = {
            'days': days,
            'start_date': (datetime.utcnow() - timedelta(days=days)).isoformat(),
            'end_date': datetime.utcnow().isoformat()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting override statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('/check', methods=['POST'])
@require_permission('audit.emergency_override')
def check_override():
    """Check if user has valid override for specific action"""
    try:
        current_user = get_current_user()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['target_resource', 'action']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check for valid override
        override = EmergencyOverride.check_override(
            user_id=current_user.id,
            resource=data['target_resource'],
            target_id=data.get('target_id'),
            action=data['action']
        )
        
        if override:
            return jsonify({
                'has_override': True,
                'override': override.to_dict(),
                'message': 'Valid emergency override found'
            }), 200
        else:
            return jsonify({
                'has_override': False,
                'message': 'No valid emergency override found'
            }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error checking override: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@emergency_bp.route('/cleanup', methods=['POST'])
@require_permission('system.maintenance')
def cleanup_expired_overrides():
    """Cleanup expired overrides (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can run cleanup
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can run override cleanup',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        # Run cleanup
        cleaned_count = EmergencyOverride.cleanup_expired()
        
        # Log the cleanup
        current_app.logger.info(
            f"Emergency Override Cleanup: User {current_user.username} "
            f"cleaned up {cleaned_count} expired overrides"
        )
        
        return jsonify({
            'message': f'Cleanup completed successfully',
            'cleaned_overrides': cleaned_count
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error during override cleanup: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

# Helper function for other routes to check emergency overrides
def check_emergency_override_permission(user, resource, target_id, action):
    """
    Helper function to check if user has emergency override for specific action
    This can be imported and used by other route modules
    """
    if not user.has_role('superadmin'):
        return False
    
    override = EmergencyOverride.check_override(
        user_id=user.id,
        resource=resource,
        target_id=target_id,
        action=action
    )
    
    return override is not None

