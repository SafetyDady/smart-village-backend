from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.property_type_model import PropertyType
from src.models.user_model import User
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator to require admin permissions"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Check if user has admin permissions
        has_admin_permission = False
        for role in user.roles:
            for permission in role.permissions:
                if permission.resource == 'admin' or permission.name == 'system.admin':
                    has_admin_permission = True
                    break
            if has_admin_permission:
                break
        
        if not has_admin_permission:
            return jsonify({'message': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

# Property Types Management Routes
@admin_bp.route('/property-types', methods=['GET'])
@admin_required
def get_property_types():
    """Get all property types"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            property_types = PropertyType.query.order_by(PropertyType.name).all()
        else:
            property_types = PropertyType.get_active_types()
        
        return jsonify({
            'success': True,
            'data': [pt.to_dict() for pt in property_types],
            'total': len(property_types)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property types: {str(e)}'
        }), 500

@admin_bp.route('/property-types', methods=['POST'])
@admin_required
def create_property_type():
    """Create a new property type"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        is_active = data.get('is_active', True)
        
        if not name:
            return jsonify({
                'success': False,
                'message': 'Property type name is required'
            }), 400
        
        # Check if property type already exists
        existing_type = PropertyType.get_by_name(name)
        if existing_type:
            return jsonify({
                'success': False,
                'message': f'Property type "{name}" already exists'
            }), 409
        
        # Create new property type
        property_type = PropertyType(
            name=name,
            description=description if description else None,
            is_active=is_active
        )
        
        db.session.add(property_type)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property type created successfully',
            'data': property_type.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating property type: {str(e)}'
        }), 500

@admin_bp.route('/property-types/<int:type_id>', methods=['GET'])
@admin_required
def get_property_type(type_id):
    """Get a specific property type"""
    try:
        property_type = PropertyType.query.get(type_id)
        
        if not property_type:
            return jsonify({
                'success': False,
                'message': 'Property type not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': property_type.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property type: {str(e)}'
        }), 500

@admin_bp.route('/property-types/<int:type_id>', methods=['PUT'])
@admin_required
def update_property_type(type_id):
    """Update a property type"""
    try:
        property_type = PropertyType.query.get(type_id)
        
        if not property_type:
            return jsonify({
                'success': False,
                'message': 'Property type not found'
            }), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Check if name is being changed and if it conflicts
        new_name = data.get('name', '').strip()
        if new_name and new_name != property_type.name:
            existing_type = PropertyType.get_by_name(new_name)
            if existing_type:
                return jsonify({
                    'success': False,
                    'message': f'Property type "{new_name}" already exists'
                }), 409
        
        # Update property type
        update_data = {}
        if new_name:
            update_data['name'] = new_name
        if 'description' in data:
            update_data['description'] = data['description'].strip() if data['description'] else None
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
        
        property_type.update(**update_data)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property type updated successfully',
            'data': property_type.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating property type: {str(e)}'
        }), 500

@admin_bp.route('/property-types/<int:type_id>', methods=['DELETE'])
@admin_required
def delete_property_type(type_id):
    """Delete a property type (soft delete by setting inactive)"""
    try:
        property_type = PropertyType.query.get(type_id)
        
        if not property_type:
            return jsonify({
                'success': False,
                'message': 'Property type not found'
            }), 404
        
        # Check if property type is being used by any properties
        if property_type.properties:
            active_properties = [p for p in property_type.properties]
            if active_properties:
                return jsonify({
                    'success': False,
                    'message': f'Cannot delete property type. It is currently used by {len(active_properties)} properties.',
                    'property_count': len(active_properties)
                }), 409
        
        # Soft delete by setting inactive
        property_type.update(is_active=False)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property type deactivated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting property type: {str(e)}'
        }), 500

@admin_bp.route('/property-types/<int:type_id>/toggle-status', methods=['PATCH'])
@admin_required
def toggle_property_type_status(type_id):
    """Toggle property type active status"""
    try:
        property_type = PropertyType.query.get(type_id)
        
        if not property_type:
            return jsonify({
                'success': False,
                'message': 'Property type not found'
            }), 404
        
        # Toggle status
        property_type.update(is_active=not property_type.is_active)
        db.session.commit()
        
        status = 'activated' if property_type.is_active else 'deactivated'
        
        return jsonify({
            'success': True,
            'message': f'Property type {status} successfully',
            'data': property_type.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error toggling property type status: {str(e)}'
        }), 500


# Property Status Management Routes
from src.models.property_status_model import PropertyStatus

@admin_bp.route('/property-statuses', methods=['GET'])
@admin_required
def get_property_statuses():
    """Get all property statuses"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            property_statuses = PropertyStatus.query.order_by(PropertyStatus.name).all()
        else:
            property_statuses = PropertyStatus.get_active_statuses()
        
        return jsonify({
            'success': True,
            'data': [ps.to_dict() for ps in property_statuses],
            'total': len(property_statuses)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property statuses: {str(e)}'
        }), 500

@admin_bp.route('/property-statuses', methods=['POST'])
@admin_required
def create_property_status():
    """Create a new property status"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        name = data.get('name', '').strip()
        color = data.get('color', '#3B82F6').strip()
        description = data.get('description', '').strip()
        is_active = data.get('is_active', True)
        
        if not name:
            return jsonify({
                'success': False,
                'message': 'Property status name is required'
            }), 400
        
        # Validate color format (hex color)
        if not color.startswith('#') or len(color) != 7:
            return jsonify({
                'success': False,
                'message': 'Color must be a valid hex color code (e.g., #3B82F6)'
            }), 400
        
        # Check if property status already exists
        existing_status = PropertyStatus.get_by_name(name)
        if existing_status:
            return jsonify({
                'success': False,
                'message': f'Property status "{name}" already exists'
            }), 409
        
        # Create new property status
        property_status = PropertyStatus(
            name=name,
            color=color,
            description=description if description else None,
            is_active=is_active
        )
        
        db.session.add(property_status)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property status created successfully',
            'data': property_status.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating property status: {str(e)}'
        }), 500

@admin_bp.route('/property-statuses/<int:status_id>', methods=['GET'])
@admin_required
def get_property_status(status_id):
    """Get a specific property status"""
    try:
        property_status = PropertyStatus.query.get(status_id)
        
        if not property_status:
            return jsonify({
                'success': False,
                'message': 'Property status not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': property_status.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property status: {str(e)}'
        }), 500

@admin_bp.route('/property-statuses/<int:status_id>', methods=['PUT'])
@admin_required
def update_property_status(status_id):
    """Update a property status"""
    try:
        property_status = PropertyStatus.query.get(status_id)
        
        if not property_status:
            return jsonify({
                'success': False,
                'message': 'Property status not found'
            }), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Check if name is being changed and if it conflicts
        new_name = data.get('name', '').strip()
        if new_name and new_name != property_status.name:
            existing_status = PropertyStatus.get_by_name(new_name)
            if existing_status:
                return jsonify({
                    'success': False,
                    'message': f'Property status "{new_name}" already exists'
                }), 409
        
        # Validate color if provided
        new_color = data.get('color', '').strip()
        if new_color and (not new_color.startswith('#') or len(new_color) != 7):
            return jsonify({
                'success': False,
                'message': 'Color must be a valid hex color code (e.g., #3B82F6)'
            }), 400
        
        # Update property status
        update_data = {}
        if new_name:
            update_data['name'] = new_name
        if new_color:
            update_data['color'] = new_color
        if 'description' in data:
            update_data['description'] = data['description'].strip() if data['description'] else None
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']
        
        property_status.update(**update_data)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property status updated successfully',
            'data': property_status.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating property status: {str(e)}'
        }), 500

@admin_bp.route('/property-statuses/<int:status_id>', methods=['DELETE'])
@admin_required
def delete_property_status(status_id):
    """Delete a property status (soft delete by setting inactive)"""
    try:
        property_status = PropertyStatus.query.get(status_id)
        
        if not property_status:
            return jsonify({
                'success': False,
                'message': 'Property status not found'
            }), 404
        
        # Check if property status is being used by any properties
        if property_status.properties:
            active_properties = [p for p in property_status.properties]
            if active_properties:
                return jsonify({
                    'success': False,
                    'message': f'Cannot delete property status. It is currently used by {len(active_properties)} properties.',
                    'property_count': len(active_properties)
                }), 409
        
        # Soft delete by setting inactive
        property_status.update(is_active=False)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property status deactivated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting property status: {str(e)}'
        }), 500

@admin_bp.route('/property-statuses/<int:status_id>/toggle-status', methods=['PATCH'])
@admin_required
def toggle_property_status_status(status_id):
    """Toggle property status active status"""
    try:
        property_status = PropertyStatus.query.get(status_id)
        
        if not property_status:
            return jsonify({
                'success': False,
                'message': 'Property status not found'
            }), 404
        
        # Toggle status
        property_status.update(is_active=not property_status.is_active)
        db.session.commit()
        
        status = 'activated' if property_status.is_active else 'deactivated'
        
        return jsonify({
            'success': True,
            'message': f'Property status {status} successfully',
            'data': property_status.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error toggling property status: {str(e)}'
        }), 500

# Admin Dashboard Statistics Route
@admin_bp.route('/dashboard/statistics', methods=['GET'])
@admin_required
def get_admin_dashboard_statistics():
    """Get statistics for admin dashboard"""
    try:
        from src.models.property_model import Property
        
        # Get property statistics
        property_stats = Property.get_statistics()
        
        # Get property type counts
        property_type_counts = db.session.query(
            PropertyType.name,
            db.func.count(Property.id).label('count')
        ).outerjoin(Property, PropertyType.id == Property.property_type_id)\
         .filter(PropertyType.is_active == True)\
         .group_by(PropertyType.id, PropertyType.name)\
         .all()
        
        # Get active counts
        active_property_types = PropertyType.query.filter_by(is_active=True).count()
        active_property_statuses = PropertyStatus.query.filter_by(is_active=True).count()
        
        return jsonify({
            'success': True,
            'data': {
                'properties': property_stats,
                'property_types': {
                    'total': active_property_types,
                    'by_type': [
                        {
                            'type': pt.name,
                            'count': pt.count
                        }
                        for pt in property_type_counts
                    ]
                },
                'property_statuses': {
                    'total': active_property_statuses
                },
                'system_health': 'Good'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching dashboard statistics: {str(e)}'
        }), 500

