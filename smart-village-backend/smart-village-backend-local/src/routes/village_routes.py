"""
Village Management API Routes
Smart Village Management System
"""

from flask import Blueprint, request, jsonify, current_app
from src.models.user import db
from src.models.village import Village
from src.models.user_village import UserVillage
from src.models.user_model import User
from src.routes.auth_routes import require_permission, get_current_user
from datetime import datetime
import uuid

village_bp = Blueprint('villages', __name__, url_prefix='/api/villages')

def require_village_permission(permission):
    """Decorator to check village-scoped permissions"""
    def decorator(f):
        from functools import wraps
        @wraps(f)
        def decorated_function(*args, **kwargs):
            current_user = get_current_user()
            if not current_user:
                return jsonify({'error': 'Authentication required'}), 401
            
            village_id = kwargs.get('village_id') or request.view_args.get('village_id')
            
            # Super Admin bypasses village scope
            if current_user.has_role('superadmin'):
                return f(*args, **kwargs)
            
            # Check basic permission
            if not current_user.has_permission(permission):
                return jsonify({
                    'error': f'Permission {permission} required',
                    'code': 'PERMISSION_DENIED'
                }), 403
            
            # Check village scope for non-super admins
            if village_id and not current_user.has_village_access(village_id):
                return jsonify({
                    'error': 'Access denied to this village',
                    'code': 'VILLAGE_ACCESS_DENIED'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@village_bp.route('', methods=['GET'])
@require_permission('villages.read')
def get_villages():
    """Get villages (all for Super Admin, assigned for Village Admin)"""
    try:
        current_user = get_current_user()
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '').strip()
        province = request.args.get('province', '').strip()
        district = request.args.get('district', '').strip()
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        # Super Admin gets all villages
        if current_user.has_role('superadmin'):
            query = Village.query
            
            if active_only:
                query = query.filter(Village.is_active == True)
            
            if search:
                query = query.filter(
                    db.or_(
                        Village.name.ilike(f'%{search}%'),
                        Village.code.ilike(f'%{search}%')
                    )
                )
            
            if province:
                query = query.filter(Village.province == province)
            
            if district:
                query = query.filter(Village.district == district)
            
            query = query.order_by(Village.name)
            
        else:
            # Village Admin gets only assigned villages
            query = db.session.query(Village).join(UserVillage).filter(
                UserVillage.user_id == current_user.id,
                UserVillage.is_active == True
            )
            
            if active_only:
                query = query.filter(Village.is_active == True)
            
            if search:
                query = query.filter(
                    db.or_(
                        Village.name.ilike(f'%{search}%'),
                        Village.code.ilike(f'%{search}%')
                    )
                )
            
            query = query.order_by(Village.name)
        
        # Paginate results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        villages = []
        for village in pagination.items:
            village_data = village.to_dict()
            
            # Add assignment info for Village Admin
            if not current_user.has_role('superadmin'):
                assignment = UserVillage.query.filter_by(
                    user_id=current_user.id,
                    village_id=village.id,
                    is_active=True
                ).first()
                
                if assignment:
                    village_data['assignment'] = assignment.to_dict()
            
            villages.append(village_data)
        
        return jsonify({
            'villages': villages,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            },
            'user_role': current_user.roles[0].name if current_user.roles else None,
            'access_scope': 'all' if current_user.has_role('superadmin') else 'assigned_only'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting villages: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('', methods=['POST'])
@require_permission('villages.create')
def create_village():
    """Create new village (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can create villages
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can create villages',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if village code already exists (if provided)
        if data.get('code'):
            existing = Village.query.filter_by(code=data['code']).first()
            if existing:
                return jsonify({'error': 'Village code already exists'}), 400
        
        # Create village
        village = Village(
            name=data['name'],
            code=data.get('code'),  # Will auto-generate if not provided
            description=data.get('description'),
            address=data.get('address'),
            province=data.get('province'),
            district=data.get('district'),
            sub_district=data.get('sub_district'),
            postal_code=data.get('postal_code'),
            contact_person=data.get('contact_person'),
            contact_phone=data.get('contact_phone'),
            contact_email=data.get('contact_email'),
            established_date=datetime.strptime(data['established_date'], '%Y-%m-%d').date() if data.get('established_date') else None,
            created_by=current_user.id
        )
        
        db.session.add(village)
        db.session.commit()
        
        return jsonify({
            'village': village.to_dict(include_sensitive=True),
            'message': 'Village created successfully'
        }), 201
        
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating village: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/<village_id>', methods=['GET'])
@require_village_permission('villages.read')
def get_village(village_id):
    """Get specific village details"""
    try:
        current_user = get_current_user()
        
        village = Village.query.get(village_id)
        if not village:
            return jsonify({'error': 'Village not found'}), 404
        
        village_data = village.to_dict(include_sensitive=current_user.has_role('superadmin'))
        
        # Add assignment info for Village Admin
        if not current_user.has_role('superadmin'):
            assignment = UserVillage.query.filter_by(
                user_id=current_user.id,
                village_id=village.id,
                is_active=True
            ).first()
            
            if assignment:
                village_data['assignment'] = assignment.to_dict()
        
        # Add statistics for authorized users
        if current_user.has_permission('reports.property') or current_user.has_role('superadmin'):
            # This would be implemented when property/resident models are available
            village_data['statistics'] = {
                'total_properties': village.total_properties,
                'total_residents': village.total_residents,
                'active_admins': len(village.get_village_admins())
            }
        
        return jsonify({'village': village_data}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting village {village_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/<village_id>', methods=['PUT'])
@require_village_permission('villages.update')
def update_village(village_id):
    """Update village information"""
    try:
        current_user = get_current_user()
        
        village = Village.query.get(village_id)
        if not village:
            return jsonify({'error': 'Village not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Check if village code is being changed and if it already exists
        if data.get('code') and data['code'] != village.code:
            existing = Village.query.filter_by(code=data['code']).first()
            if existing:
                return jsonify({'error': 'Village code already exists'}), 400
        
        # Update fields
        updatable_fields = [
            'name', 'code', 'description', 'address', 'province', 'district',
            'sub_district', 'postal_code', 'contact_person', 'contact_phone',
            'contact_email', 'is_verified'
        ]
        
        # Super Admin can update additional fields
        if current_user.has_role('superadmin'):
            updatable_fields.extend(['is_active', 'total_properties', 'total_residents'])
        
        for field in updatable_fields:
            if field in data:
                if field == 'established_date' and data[field]:
                    setattr(village, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(village, field, data[field])
        
        village.updated_by = current_user.id
        village.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'village': village.to_dict(include_sensitive=current_user.has_role('superadmin')),
            'message': 'Village updated successfully'
        }), 200
        
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating village {village_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/<village_id>', methods=['DELETE'])
@require_permission('villages.delete')
def delete_village(village_id):
    """Delete village (Super Admin only)"""
    try:
        current_user = get_current_user()
        
        # Only Super Admin can delete villages
        if not current_user.has_role('superadmin'):
            return jsonify({
                'error': 'Only Super Admin can delete villages',
                'code': 'INSUFFICIENT_ROLE'
            }), 403
        
        village = Village.query.get(village_id)
        if not village:
            return jsonify({'error': 'Village not found'}), 404
        
        # Check if village has active assignments
        active_assignments = UserVillage.query.filter_by(
            village_id=village_id,
            is_active=True
        ).count()
        
        if active_assignments > 0:
            return jsonify({
                'error': f'Cannot delete village with {active_assignments} active user assignments',
                'code': 'VILLAGE_HAS_ASSIGNMENTS'
            }), 400
        
        # Soft delete (mark as inactive)
        village.is_active = False
        village.updated_by = current_user.id
        village.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Village deleted successfully',
            'village_id': village_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting village {village_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/<village_id>/users', methods=['GET'])
@require_village_permission('users.read')
def get_village_users(village_id):
    """Get users assigned to village"""
    try:
        current_user = get_current_user()
        
        village = Village.query.get(village_id)
        if not village:
            return jsonify({'error': 'Village not found'}), 404
        
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        active_only = request.args.get('active_only', 'true').lower() == 'true'
        
        # Get user assignments for this village
        query = UserVillage.query.filter_by(village_id=village_id)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        query = query.order_by(UserVillage.assigned_at.desc())
        
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        assignments = []
        for assignment in pagination.items:
            assignment_data = assignment.to_dict(
                include_user=True,
                include_assigner=current_user.has_role('superadmin')
            )
            assignments.append(assignment_data)
        
        return jsonify({
            'assignments': assignments,
            'village': village.to_summary(),
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
        current_app.logger.error(f"Error getting village users {village_id}: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/search', methods=['GET'])
@require_permission('villages.read')
def search_villages():
    """Search villages by name, code, or location"""
    try:
        current_user = get_current_user()
        
        query = request.args.get('q', '').strip()
        province = request.args.get('province', '').strip()
        district = request.args.get('district', '').strip()
        limit = min(request.args.get('limit', 10, type=int), 50)
        
        if not query and not province and not district:
            return jsonify({'villages': []}), 200
        
        # Super Admin searches all villages
        if current_user.has_role('superadmin'):
            villages = Village.search_villages(
                query=query,
                province=province,
                district=district
            )[:limit]
        else:
            # Village Admin searches only assigned villages
            village_ids = [a.village_id for a in current_user.get_village_assignments()]
            
            search_query = Village.query.filter(
                Village.id.in_(village_ids),
                Village.is_active == True
            )
            
            if query:
                search_query = search_query.filter(
                    db.or_(
                        Village.name.ilike(f'%{query}%'),
                        Village.code.ilike(f'%{query}%')
                    )
                )
            
            if province:
                search_query = search_query.filter(Village.province == province)
            
            if district:
                search_query = search_query.filter(Village.district == district)
            
            villages = search_query.order_by(Village.name).limit(limit).all()
        
        return jsonify({
            'villages': [village.to_summary() for village in villages],
            'total': len(villages),
            'query': query
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error searching villages: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/provinces', methods=['GET'])
@require_permission('villages.read')
def get_provinces():
    """Get list of provinces with villages"""
    try:
        current_user = get_current_user()
        
        if current_user.has_role('superadmin'):
            # Super Admin sees all provinces
            provinces = db.session.query(Village.province).filter(
                Village.province.isnot(None),
                Village.is_active == True
            ).distinct().order_by(Village.province).all()
        else:
            # Village Admin sees provinces of assigned villages only
            village_ids = [a.village_id for a in current_user.get_village_assignments()]
            provinces = db.session.query(Village.province).filter(
                Village.id.in_(village_ids),
                Village.province.isnot(None),
                Village.is_active == True
            ).distinct().order_by(Village.province).all()
        
        return jsonify({
            'provinces': [p[0] for p in provinces]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting provinces: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@village_bp.route('/districts', methods=['GET'])
@require_permission('villages.read')
def get_districts():
    """Get list of districts for a province"""
    try:
        current_user = get_current_user()
        province = request.args.get('province')
        
        if not province:
            return jsonify({'error': 'Province parameter required'}), 400
        
        if current_user.has_role('superadmin'):
            # Super Admin sees all districts in province
            districts = db.session.query(Village.district).filter(
                Village.province == province,
                Village.district.isnot(None),
                Village.is_active == True
            ).distinct().order_by(Village.district).all()
        else:
            # Village Admin sees districts of assigned villages only
            village_ids = [a.village_id for a in current_user.get_village_assignments()]
            districts = db.session.query(Village.district).filter(
                Village.id.in_(village_ids),
                Village.province == province,
                Village.district.isnot(None),
                Village.is_active == True
            ).distinct().order_by(Village.district).all()
        
        return jsonify({
            'districts': [d[0] for d in districts],
            'province': province
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting districts: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

