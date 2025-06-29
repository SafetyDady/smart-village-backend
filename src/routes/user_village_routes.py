"""
User-Village Assignment API Routes
Smart Village Management System
"""

from flask import Blueprint, request, jsonify, current_app
from src.models.user import db
from src.models.village import Village
from src.models.user_village import UserVillage
from src.models.user_model import User, Role
from src.routes.auth_routes import require_permission, get_current_user
from datetime import datetime
import uuid

user_village_bp = Blueprint('user_villages', __name__, url_prefix='/api/admin')

@user_village_bp.route('/users/<user_id>/villages', methods=['GET'])
@require_permission('users.read')
def get_user_villages(user_id):
    """Get villages assigned to specific user"""
    try:
        current_user = get_current_user()
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Non-super admins can only view their own villages
        if not current_user.has_role('superadmin') and str(current_user.id) != user_id:
            return jsonify({
                'error': 'Access denied',
                'code': 'INSUFFICIENT_PERMISSION'
            }), 403
        
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        # Get user's village assignments
        assignments = UserVillage.get_user_villages(user_id, active_only=active_only)
        
        villages_data = []
        for assignment in assignments:
            village_data = assignment.village.to_summary()
            village_data['assignment'] = assignment.to_dict(include_assigner=current_user.has_role('superadmin'))
            villages_data.append(village_data)
        
        return jsonify({
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            },
            'villages': villages_data,
            'total': len(villages_data)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting user villages {user_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/users/<user_id>/assign-villages', methods=['POST'])
@require_permission('users.assign_village')
def assign_user_villages(user_id):
    """Assign villages to user (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can assign villages
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can assign villages to users',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        village_ids = data.get('village_ids', [])
        if not village_ids:
            return jsonify({'error': 'village_ids is required'}), 400
        
        # Validate village IDs
        villages = Village.query.filter(
            Village.id.in_(village_ids),
            Village.is_active == True
        ).all()
        
        if len(villages) != len(village_ids):
            return jsonify({'error': 'One or more villages not found or inactive'}), 400
        
        # Get permission settings
        permissions = {
            'can_manage_properties': data.get('permissions', {}).get('can_manage_properties', True),
            'can_manage_residents': data.get('permissions', {}).get('can_manage_residents', True),
            'can_manage_finances': data.get('permissions', {}).get('can_manage_finances', True),
            'can_view_reports': data.get('permissions', {}).get('can_view_reports', True)
        }
        
        # Create assignments
        assignments = UserVillage.bulk_assign_villages(
            user_id=user_id,
            village_ids=village_ids,
            assigned_by_id=current_user.id,
            assignment_type=data.get('assignment_type', 'manual'),
            **permissions
        )
        
        # Set primary village if specified
        set_primary = data.get('set_primary')
        if set_primary and set_primary in village_ids:
            for assignment in assignments:
                if str(assignment.village_id) == set_primary:
                    assignment.set_as_primary()
                    break
        
        db.session.commit()
        
        # Prepare response
        assignments_data = []
        for assignment in assignments:
            assignment_data = assignment.to_dict(include_village=True)
            assignments_data.append(assignment_data)
        
        return jsonify({
            'assignments': assignments_data,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'full_name': user.full_name
            },
            'message': f'Successfully assigned {len(assignments)} villages to user'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error assigning villages to user {user_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/users/<user_id>/villages/<village_id>', methods=['PUT'])
@require_permission('users.assign_village')
def update_user_village_assignment(user_id, village_id):
    """Update user-village assignment permissions"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can update assignments
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can update village assignments',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        # Find assignment
        assignment = UserVillage.query.filter_by(
            user_id=user_id,
            village_id=village_id
        ).first()
        
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update permissions
        permissions = data.get('permissions', {})
        assignment.update_permissions(**permissions)
        
        # Update primary status
        if 'is_primary' in data:
            if data['is_primary']:
                assignment.set_as_primary()
            else:
                assignment.is_primary = False
        
        # Update active status
        if 'is_active' in data:
            if data['is_active']:
                assignment.activate()
            else:
                assignment.deactivate()
        
        db.session.commit()
        
        return jsonify({
            'assignment': assignment.to_dict(include_village=True, include_user=True),
            'message': 'Assignment updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating assignment {user_id}-{village_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/users/<user_id>/villages/<village_id>', methods=['DELETE'])
@require_permission('users.assign_village')
def remove_user_village_assignment(user_id, village_id):
    """Remove user from village (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can remove assignments
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can remove village assignments',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        # Find assignment
        assignment = UserVillage.query.filter_by(
            user_id=user_id,
            village_id=village_id
        ).first()
        
        if not assignment:
            return jsonify({'error': 'Assignment not found'}), 404
        
        # Get village and user info for response
        village = assignment.village
        user = assignment.user
        
        # Deactivate assignment
        assignment.deactivate()
        db.session.commit()
        
        return jsonify({
            'message': 'Village assignment removed successfully',
            'removed_assignment': {
                'user_id': str(user.id),
                'user_name': user.full_name,
                'village_id': str(village.id),
                'village_name': village.name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error removing assignment {user_id}-{village_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/users', methods=['POST'])
@require_permission('users.create')
def create_village_admin():
    """Create new Village Admin user (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can create users
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can create users',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if username or email already exists
        existing_user = User.query.filter(
            db.or_(
                User.username == data['username'],
                User.email == data['email']
            )
        ).first()
        
        if existing_user:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            address=data.get('address'),
            is_verified=True  # Auto-verify admin-created users
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Assign role
        role_name = data.get('role', 'village_admin')
        role = Role.query.filter_by(name=role_name).first()
        if role:
            user.roles.append(role)
        
        # Assign villages if provided
        village_ids = data.get('villages', [])
        assignments = []
        
        if village_ids:
            # Validate villages
            villages = Village.query.filter(
                Village.id.in_(village_ids),
                Village.is_active == True
            ).all()
            
            if len(villages) != len(village_ids):
                db.session.rollback()
                return jsonify({'error': 'One or more villages not found or inactive'}), 400
            
            # Create assignments
            permissions = data.get('permissions', {
                'can_manage_properties': True,
                'can_manage_residents': True,
                'can_manage_finances': True,
                'can_view_reports': True
            })
            
            assignments = UserVillage.bulk_assign_villages(
                user_id=user.id,
                village_ids=village_ids,
                assigned_by_id=current_user.id,
                **permissions
            )
        
        db.session.commit()
        
        # Prepare response
        user_data = user.to_dict()
        user_data['role'] = role_name
        
        villages_data = []
        for assignment in assignments:
            village_data = assignment.village.to_summary()
            village_data['assignment'] = assignment.to_dict()
            villages_data.append(village_data)
        
        user_data['villages'] = villages_data
        
        # Send welcome email if requested
        if data.get('send_welcome_email', False):
            # This would be implemented with email service
            pass
        
        return jsonify({
            'user': user_data,
            'message': 'Village Admin created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating village admin: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/users/<user_id>/role', methods=['PUT'])
@require_permission('users.assign_role')
def update_user_role(user_id):
    """Update user role (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can change roles
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can change user roles',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        new_role_name = data.get('role')
        if not new_role_name:
            return jsonify({'error': 'role is required'}), 400
        
        # Get new role
        new_role = Role.query.filter_by(name=new_role_name).first()
        if not new_role:
            return jsonify({'error': 'Role not found'}), 404
        
        # Get current role for logging
        current_roles = user.get_roles()
        previous_role = current_roles[0].name if current_roles else None
        
        # Clear existing roles and assign new role
        user.roles.clear()
        user.roles.append(new_role)
        
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict(),
            'previous_role': previous_role,
            'new_role': new_role_name,
            'message': 'User role updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating user role {user_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/assignments', methods=['GET'])
@require_permission('users.read')
def get_all_assignments():
    """Get all user-village assignments (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can view all assignments
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can view all assignments',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        village_id = request.args.get('village_id')
        user_id = request.args.get('user_id')
        
        # Build query
        query = UserVillage.query
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        if village_id:
            query = query.filter_by(village_id=village_id)
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        query = query.order_by(UserVillage.assigned_at.desc())
        
        # Paginate
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        assignments = []
        for assignment in pagination.items:
            assignment_data = assignment.to_dict(
                include_user=True,
                include_village=True,
                include_assigner=True
            )
            assignments.append(assignment_data)
        
        return jsonify({
            'assignments': assignments,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting all assignments: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_village_bp.route('/assignments/statistics', methods=['GET'])
@require_permission('reports.system')
def get_assignment_statistics():
    """Get assignment statistics (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can view statistics
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can view assignment statistics',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        # Total assignments
        total_assignments = UserVillage.query.count()
        active_assignments = UserVillage.query.filter_by(is_active=True).count()
        
        # Assignments by village
        village_stats = db.session.query(
            Village.name,
            Village.code,
            db.func.count(UserVillage.id).label('assignment_count')
        ).join(UserVillage).filter(
            UserVillage.is_active == True
        ).group_by(Village.id, Village.name, Village.code).all()
        
        # Assignments by user role
        role_stats = db.session.query(
            Role.name,
            db.func.count(UserVillage.id).label('assignment_count')
        ).join(User.roles).join(User, UserVillage.user_id == User.id).filter(
            UserVillage.is_active == True
        ).group_by(Role.name).all()
        
        # Recent assignments (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_assignments = UserVillage.query.filter(
            UserVillage.assigned_at >= thirty_days_ago
        ).count()
        
        return jsonify({
            'total_assignments': total_assignments,
            'active_assignments': active_assignments,
            'inactive_assignments': total_assignments - active_assignments,
            'recent_assignments_30_days': recent_assignments,
            'village_breakdown': [
                {
                    'village_name': stat[0],
                    'village_code': stat[1],
                    'assignment_count': stat[2]
                }
                for stat in village_stats
            ],
            'role_breakdown': [
                {
                    'role': stat[0],
                    'assignment_count': stat[1]
                }
                for stat in role_stats
            ]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting assignment statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

