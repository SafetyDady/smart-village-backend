from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt, verify_jwt_in_request
)
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta
import uuid

from src.models.user import db
from src.models.user_model import User, Role, Permission

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('remember_me', False)
        
        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Check if account is active
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 403
        
        # Verify password
        if not user.check_password(password):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Create tokens
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(days=30) if remember_me else timedelta(hours=1)
        )
        refresh_token = create_refresh_token(identity=str(user.id))
        
        db.session.commit()
        
        # Get user permissions from roles
        user_permissions = []
        for role in user.roles:
            for permission in role.permissions:
                if permission.name not in user_permissions:
                    user_permissions.append(permission.name)
        
        # Return user info and tokens
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'roles': [role.name for role in user.roles],
                'permissions': user_permissions
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint"""
    try:
        current_user_id = get_jwt_identity()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'message': f'Logout failed: {str(e)}'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        
        # Convert string UUID to UUID object if needed
        if isinstance(current_user_id, str):
            import uuid
            current_user_id = uuid.UUID(current_user_id)
        
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get user permissions from roles
        user_permissions = []
        for role in user.roles:
            for permission in role.permissions:
                if permission.name not in user_permissions:
                    user_permissions.append(permission.name)
        
        return jsonify({
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'is_verified': user.is_verified,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat(),
                'roles': [role.name for role in user.roles],
                'permissions': user_permissions
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get profile: {str(e)}'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_active:
            return jsonify({'message': 'User not found or inactive'}), 404
        
        new_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'access_token': new_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Token refresh failed: {str(e)}'}), 500

@auth_bp.route('/health', methods=['GET'])
def auth_health():
    """Authentication service health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Authentication Service',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

