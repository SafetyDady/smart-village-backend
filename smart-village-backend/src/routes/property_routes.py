from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import db
from src.models.property_model import Property
from src.models.property_type_model import PropertyType
from src.models.property_status_model import PropertyStatus
from src.models.user_model import User
from functools import wraps
from sqlalchemy import or_, and_

property_bp = Blueprint('property', __name__)

def property_access_required(f):
    """Decorator to require property access permissions"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Check if user has property permissions
        has_property_permission = False
        for role in user.roles:
            for permission in role.permissions:
                if permission.resource == 'properties' or permission.name == 'system.admin':
                    has_property_permission = True
                    break
            if has_property_permission:
                break
        
        if not has_property_permission:
            return jsonify({'message': 'Property access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def property_write_required(f):
    """Decorator to require property write permissions"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Check if user has property write permissions
        has_write_permission = False
        for role in user.roles:
            for permission in role.permissions:
                if (permission.resource == 'properties' and permission.action in ['create', 'update', 'delete']) or permission.name == 'system.admin':
                    has_write_permission = True
                    break
            if has_write_permission:
                break
        
        if not has_write_permission:
            return jsonify({'message': 'Property write access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

# Property CRUD Routes
@property_bp.route('/properties', methods=['GET'])
@property_access_required
def get_properties():
    """Get all properties with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # Max 100 per page
        search = request.args.get('search', '').strip()
        property_type_id = request.args.get('type_id', type=int)
        property_status_id = request.args.get('status_id', type=int)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = Property.query
        
        # Apply filters
        if search:
            query = query.filter(Property.address.contains(search))
        
        if property_type_id:
            query = query.filter(Property.property_type_id == property_type_id)
        
        if property_status_id:
            query = query.filter(Property.property_status_id == property_status_id)
        
        # Apply sorting
        if sort_by == 'address':
            order_column = Property.address
        elif sort_by == 'created_at':
            order_column = Property.created_at
        elif sort_by == 'updated_at':
            order_column = Property.updated_at
        else:
            order_column = Property.created_at
        
        if sort_order == 'asc':
            query = query.order_by(order_column.asc())
        else:
            query = query.order_by(order_column.desc())
        
        # Execute pagination
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        properties = pagination.items
        
        return jsonify({
            'success': True,
            'data': [prop.to_dict_simple() for prop in properties],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching properties: {str(e)}'
        }), 500

@property_bp.route('/properties/<int:property_id>', methods=['GET'])
@property_access_required
def get_property(property_id):
    """Get a specific property"""
    try:
        property_obj = Property.query.get(property_id)
        
        if not property_obj:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': property_obj.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property: {str(e)}'
        }), 500

@property_bp.route('/properties', methods=['POST'])
@property_write_required
def create_property():
    """Create a new property"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate required fields
        address = data.get('address', '').strip()
        property_type_id = data.get('property_type_id')
        property_status_id = data.get('property_status_id')
        
        if not address:
            return jsonify({
                'success': False,
                'message': 'Property address is required'
            }), 400
        
        if not property_type_id:
            return jsonify({
                'success': False,
                'message': 'Property type is required'
            }), 400
        
        if not property_status_id:
            return jsonify({
                'success': False,
                'message': 'Property status is required'
            }), 400
        
        # Validate property type exists and is active
        property_type = PropertyType.query.filter_by(id=property_type_id, is_active=True).first()
        if not property_type:
            return jsonify({
                'success': False,
                'message': 'Invalid or inactive property type'
            }), 400
        
        # Validate property status exists and is active
        property_status = PropertyStatus.query.filter_by(id=property_status_id, is_active=True).first()
        if not property_status:
            return jsonify({
                'success': False,
                'message': 'Invalid or inactive property status'
            }), 400
        
        # Get optional fields
        bedrooms = data.get('bedrooms')
        bathrooms = data.get('bathrooms')
        description = data.get('description', '').strip()
        
        # Validate numeric fields
        if bedrooms is not None and (not isinstance(bedrooms, int) or bedrooms < 0):
            return jsonify({
                'success': False,
                'message': 'Bedrooms must be a non-negative integer'
            }), 400
        
        if bathrooms is not None and (not isinstance(bathrooms, int) or bathrooms < 0):
            return jsonify({
                'success': False,
                'message': 'Bathrooms must be a non-negative integer'
            }), 400
        
        # Create new property
        property_obj = Property(
            address=address,
            property_type_id=property_type_id,
            property_status_id=property_status_id,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            description=description if description else None
        )
        
        db.session.add(property_obj)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property created successfully',
            'data': property_obj.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating property: {str(e)}'
        }), 500

@property_bp.route('/properties/<int:property_id>', methods=['PUT'])
@property_write_required
def update_property(property_id):
    """Update a property"""
    try:
        property_obj = Property.query.get(property_id)
        
        if not property_obj:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Validate and update fields
        update_data = {}
        
        # Address
        if 'address' in data:
            address = data['address'].strip()
            if not address:
                return jsonify({
                    'success': False,
                    'message': 'Property address cannot be empty'
                }), 400
            update_data['address'] = address
        
        # Property type
        if 'property_type_id' in data:
            property_type_id = data['property_type_id']
            if property_type_id:
                property_type = PropertyType.query.filter_by(id=property_type_id, is_active=True).first()
                if not property_type:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid or inactive property type'
                    }), 400
                update_data['property_type_id'] = property_type_id
        
        # Property status
        if 'property_status_id' in data:
            property_status_id = data['property_status_id']
            if property_status_id:
                property_status = PropertyStatus.query.filter_by(id=property_status_id, is_active=True).first()
                if not property_status:
                    return jsonify({
                        'success': False,
                        'message': 'Invalid or inactive property status'
                    }), 400
                update_data['property_status_id'] = property_status_id
        
        # Bedrooms
        if 'bedrooms' in data:
            bedrooms = data['bedrooms']
            if bedrooms is not None and (not isinstance(bedrooms, int) or bedrooms < 0):
                return jsonify({
                    'success': False,
                    'message': 'Bedrooms must be a non-negative integer'
                }), 400
            update_data['bedrooms'] = bedrooms
        
        # Bathrooms
        if 'bathrooms' in data:
            bathrooms = data['bathrooms']
            if bathrooms is not None and (not isinstance(bathrooms, int) or bathrooms < 0):
                return jsonify({
                    'success': False,
                    'message': 'Bathrooms must be a non-negative integer'
                }), 400
            update_data['bathrooms'] = bathrooms
        
        # Description
        if 'description' in data:
            description = data['description'].strip() if data['description'] else None
            update_data['description'] = description
        
        # Update property
        property_obj.update(**update_data)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Property updated successfully',
            'data': property_obj.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating property: {str(e)}'
        }), 500

@property_bp.route('/properties/<int:property_id>', methods=['DELETE'])
@property_write_required
def delete_property(property_id):
    """Delete a property"""
    try:
        property_obj = Property.query.get(property_id)
        
        if not property_obj:
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Store property info for response
        property_address = property_obj.address
        
        # Delete property
        db.session.delete(property_obj)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Property "{property_address}" deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting property: {str(e)}'
        }), 500

# Property Statistics and Dashboard Routes
@property_bp.route('/properties/statistics', methods=['GET'])
@property_access_required
def get_property_statistics():
    """Get property statistics"""
    try:
        stats = Property.get_statistics()
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property statistics: {str(e)}'
        }), 500

@property_bp.route('/properties/recent', methods=['GET'])
@property_access_required
def get_recent_properties():
    """Get recent properties for dashboard"""
    try:
        limit = min(request.args.get('limit', 10, type=int), 50)  # Max 50
        
        recent_properties = Property.query\
            .order_by(Property.created_at.desc())\
            .limit(limit)\
            .all()
        
        return jsonify({
            'success': True,
            'data': [prop.to_dict_simple() for prop in recent_properties],
            'total': len(recent_properties)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching recent properties: {str(e)}'
        }), 500

# Property Types and Statuses for Dropdowns
@property_bp.route('/property-types', methods=['GET'])
@property_access_required
def get_property_types_for_dropdown():
    """Get active property types for dropdown selection"""
    try:
        property_types = PropertyType.get_active_types()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'id': pt.id,
                    'name': pt.name,
                    'description': pt.description
                }
                for pt in property_types
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property types: {str(e)}'
        }), 500

@property_bp.route('/property-statuses', methods=['GET'])
@property_access_required
def get_property_statuses_for_dropdown():
    """Get active property statuses for dropdown selection"""
    try:
        property_statuses = PropertyStatus.get_active_statuses()
        
        return jsonify({
            'success': True,
            'data': [
                {
                    'id': ps.id,
                    'name': ps.name,
                    'color': ps.color,
                    'description': ps.description
                }
                for ps in property_statuses
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching property statuses: {str(e)}'
        }), 500

