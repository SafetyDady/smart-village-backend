"""
JWT Authentication Utility for Auth Service Tokens
Smart Village Management System
"""

import jwt
import os
from flask import request, jsonify, current_app
from functools import wraps
from src.models.user_model import User
import uuid

def verify_auth_service_token():
    """Verify JWT token from Auth Service"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None, 'No authorization header'
        
        # Extract token from "Bearer <token>"
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return None, 'Invalid authorization header format'
        
        # Get JWT secret from environment
        jwt_secret = os.getenv('JWT_SECRET_KEY', 'SmartVillage2025!AuthJWTSecret')
        
        # Decode token
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            return payload, None
        except jwt.ExpiredSignatureError:
            return None, 'Token has expired'
        except jwt.InvalidTokenError:
            return None, 'Invalid token'
            
    except Exception as e:
        current_app.logger.error(f"JWT verification error: {str(e)}")
        return None, f'Token verification failed: {str(e)}'

def get_current_user_from_auth_service():
    """Get current user from Auth Service JWT token"""
    try:
        payload, error = verify_auth_service_token()
        if error:
            current_app.logger.warning(f"Auth verification failed: {error}")
            return None
        
        # Create a user object from JWT payload directly
        class TokenUser:
            def __init__(self, payload):
                self.id = payload.get('id')
                self.username = payload.get('username')
                self.email = payload.get('email')
                self.role = payload.get('role')
                self.roles = [self.role] if self.role else []  # Add roles attribute
                self.permissions_data = payload.get('permissions', {})
                self.is_active = True  # Assume active if token is valid
            
            def has_role(self, role_name):
                """Check if user has specific role"""
                return self.role == role_name
            
            def has_permission(self, permission_name):
                """Check if user has specific permission"""
                if self.role == 'superadmin':
                    return True  # Super admin has all permissions
                
                # Parse permission format: "category.action"
                try:
                    category, action = permission_name.split('.')
                    category_permissions = self.permissions_data.get(category, [])
                    return action in category_permissions
                except (ValueError, AttributeError):
                    return False
        
        # Create user object from token payload
        user = TokenUser(payload)
        
        current_app.logger.info(f"Successfully authenticated user from token: {user.username}")
        return user
        
    except Exception as e:
        current_app.logger.error(f"Error getting current user: {str(e)}")
        return None

def require_auth_service_permission(permission_name):
    """Decorator to require specific permission using Auth Service JWT"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                current_user = get_current_user_from_auth_service()
                
                if not current_user:
                    return jsonify({'error': 'Authentication failed'}), 401
                
                if not current_user.has_permission(permission_name):
                    return jsonify({
                        'error': f'Permission {permission_name} required',
                        'code': 'PERMISSION_DENIED'
                    }), 403
                
                # Add current_user to kwargs for use in route function
                kwargs['current_user'] = current_user
                return f(*args, **kwargs)
                
            except Exception as e:
                current_app.logger.error(f"Permission check error: {str(e)}")
                return jsonify({'error': 'Authentication failed'}), 401
                
        return decorated_function
    return decorator

def require_auth_service_login():
    """Decorator to require authentication using Auth Service JWT"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                current_user = get_current_user_from_auth_service()
                
                if not current_user:
                    return jsonify({'error': 'Authentication failed'}), 401
                
                # Add current_user to kwargs for use in route function
                kwargs['current_user'] = current_user
                return f(*args, **kwargs)
                
            except Exception as e:
                current_app.logger.error(f"Authentication error: {str(e)}")
                return jsonify({'error': 'Authentication failed'}), 401
                
        return decorated_function
    return decorator

