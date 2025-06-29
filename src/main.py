import os
import sys
from datetime import timedelta

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.user import db
from src.models.user_model import User, Role, Permission
from src.models.property_type_model import PropertyType
from src.models.property_status_model import PropertyStatus
from src.models.property_model import Property
from src.routes.user import user_bp
from src.routes.auth_routes import auth_bp
from src.routes.admin_routes import admin_bp
from src.routes.property_routes import property_bp

# Import new models and routes
from src.models.village import Village
from src.models.user_village import UserVillage
from src.models.emergency_override import EmergencyOverride
from src.routes.village_routes import village_bp
from src.routes.user_village_routes import user_village_bp
from src.routes.emergency_override_routes import emergency_bp
from src.middleware.security_middleware import register_security_middleware

def create_app():
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'SmartVillage2025!SecretKey')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'SmartVillage2025!JWTSecret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    
    # Database configuration - Support both PostgreSQL and SQLite
    if os.environ.get('DATABASE_URL'):
        # Production: Use PostgreSQL from Railway
        database_url = os.environ.get('DATABASE_URL')
        # Handle Railway's postgres:// URL format
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        # Development: Use SQLite
        database_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{database_path}"
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Enable CORS for all routes including Railway domains and Manus deployment
    cors_origins = [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'https://*.railway.app',
        'https://*.vercel.app',
        'https://rcunvfsi.manus.space',
        'https://bmoicqdp.manus.space',
        'https://hsghpiar.manus.space',
        'https://eaffjwji.manus.space',
        'https://ktlacgbd.manus.space',
        'https://rpsrvjvk.manus.space'
    ]
    CORS(app, origins=cors_origins, supports_credentials=True)
    
    # Register existing blueprints
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(property_bp, url_prefix='/api')
    
    # Register new blueprints
    app.register_blueprint(village_bp)
    app.register_blueprint(user_village_bp)
    app.register_blueprint(emergency_bp)
    
    # Register security middleware
    register_security_middleware(app)
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Smart Village API',
            'version': '1.0.0'
        })
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        return jsonify({
            'name': 'Smart Village Management API',
            'version': '1.0.0',
            'description': 'API for Smart Village Management System',
            'endpoints': {
                'auth': '/api/auth',
                'users': '/api/users',
                'admin': '/api/admin',
                'properties': '/api/properties',
                'villages': '/api/villages',
                'emergency_override': '/api/emergency-override',
                'health': '/health'
            }
        })
    
    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Authorization token is required'}), 401
    
    # Create database tables and default data
    with app.app_context():
        db.create_all()
        create_default_data()
    
    # Serve frontend files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return "index.html not found", 404
    
    return app

def create_default_data():
    """Create default roles, permissions, superadmin user, and property data"""
    try:
        # Create default permissions with resource and action
        permissions_data = [
            {'name': 'user.create', 'resource': 'users', 'action': 'create', 'description': 'Create new users'},
            {'name': 'user.read', 'resource': 'users', 'action': 'read', 'description': 'View user information'},
            {'name': 'user.update', 'resource': 'users', 'action': 'update', 'description': 'Update user information'},
            {'name': 'user.delete', 'resource': 'users', 'action': 'delete', 'description': 'Delete users'},
            {'name': 'property.create', 'resource': 'properties', 'action': 'create', 'description': 'Create new properties'},
            {'name': 'property.read', 'resource': 'properties', 'action': 'read', 'description': 'View property information'},
            {'name': 'property.update', 'resource': 'properties', 'action': 'update', 'description': 'Update property information'},
            {'name': 'property.delete', 'resource': 'properties', 'action': 'delete', 'description': 'Delete properties'},
            {'name': 'admin.property_types', 'resource': 'admin', 'action': 'property_types', 'description': 'Manage property types'},
            {'name': 'admin.property_statuses', 'resource': 'admin', 'action': 'property_statuses', 'description': 'Manage property statuses'},
            {'name': 'finance.create', 'resource': 'finance', 'action': 'create', 'description': 'Create financial records'},
            {'name': 'finance.read', 'resource': 'finance', 'action': 'read', 'description': 'View financial information'},
            {'name': 'finance.update', 'resource': 'finance', 'action': 'update', 'description': 'Update financial records'},
            {'name': 'finance.delete', 'resource': 'finance', 'action': 'delete', 'description': 'Delete financial records'},
            {'name': 'report.read', 'resource': 'reports', 'action': 'read', 'description': 'View reports'},
            {'name': 'report.create', 'resource': 'reports', 'action': 'create', 'description': 'Generate reports'},
            {'name': 'system.admin', 'resource': 'system', 'action': 'admin', 'description': 'System administration access'},
            
            # New village and role management permissions
            {'name': 'villages.create', 'resource': 'villages', 'action': 'create', 'description': 'Create new villages'},
            {'name': 'villages.read', 'resource': 'villages', 'action': 'read', 'description': 'View village information'},
            {'name': 'villages.update', 'resource': 'villages', 'action': 'update', 'description': 'Update village information'},
            {'name': 'villages.delete', 'resource': 'villages', 'action': 'delete', 'description': 'Delete villages'},
            {'name': 'users.assign_village', 'resource': 'users', 'action': 'assign_village', 'description': 'Assign villages to users'},
            {'name': 'users.assign_role', 'resource': 'users', 'action': 'assign_role', 'description': 'Assign roles to users'},
            {'name': 'audit.emergency_override', 'resource': 'audit', 'action': 'emergency_override', 'description': 'Create emergency overrides'},
            {'name': 'audit.read', 'resource': 'audit', 'action': 'read', 'description': 'View audit logs'},
            {'name': 'system.maintenance', 'resource': 'system', 'action': 'maintenance', 'description': 'Perform system maintenance'}
        ]
        
        for perm_data in permissions_data:
            if not Permission.query.filter_by(name=perm_data['name']).first():
                permission = Permission(
                    name=perm_data['name'], 
                    resource=perm_data['resource'],
                    action=perm_data['action'],
                    description=perm_data['description']
                )
                db.session.add(permission)
        
        # Create default roles
        roles_data = [
            {
                'name': 'superadmin',
                'description': 'Super Administrator with full access',
                'permissions': [p['name'] for p in permissions_data]
            },
            {
                'name': 'village_admin',
                'description': 'Village Administrator with village-scoped access',
                'permissions': [
                    'villages.read', 'villages.update',
                    'user.read', 'user.update',
                    'property.create', 'property.read', 'property.update', 'property.delete',
                    'finance.create', 'finance.read', 'finance.update',
                    'report.read', 'report.create'
                ]
            },
            {
                'name': 'village_user',
                'description': 'Village User with read-only access',
                'permissions': ['property.read', 'finance.read', 'report.read']
            }
        ]
        
        for role_data in roles_data:
            if not Role.query.filter_by(name=role_data['name']).first():
                role = Role(name=role_data['name'], description=role_data['description'])
                
                # Add role to session first to avoid autoflush conflicts
                db.session.add(role)
                
                # Add permissions to role
                for perm_name in role_data['permissions']:
                    permission = Permission.query.filter_by(name=perm_name).first()
                    if permission:
                        role.permissions.append(permission)
        
        # Create superadmin user
        if not User.query.filter_by(username='superadmin').first():
            superadmin_role = Role.query.filter_by(name='superadmin').first()
            superadmin = User(
                username='superadmin',
                email='admin@smartvillage.com',
                first_name='Super',
                last_name='Administrator',
                is_active=True,
                is_verified=True
            )
            superadmin.set_password('admin123')
            
            if superadmin_role:
                superadmin.roles.append(superadmin_role)
            
            db.session.add(superadmin)
        
        # Create default property types
        property_types_data = [
            {'name': 'House', 'description': 'Single family house'},
            {'name': 'Apartment', 'description': 'Apartment unit'},
            {'name': 'Townhouse', 'description': 'Townhouse or row house'},
            {'name': 'Commercial', 'description': 'Commercial property'}
        ]
        
        for type_data in property_types_data:
            if not PropertyType.query.filter_by(name=type_data['name']).first():
                property_type = PropertyType(
                    name=type_data['name'],
                    description=type_data['description']
                )
                db.session.add(property_type)
        
        # Create default property statuses
        property_statuses_data = [
            {'name': 'Available', 'color': '#3B82F6', 'description': 'Property is available'},
            {'name': 'Occupied', 'color': '#6B7280', 'description': 'Property is currently occupied'},
            {'name': 'Maintenance', 'color': '#F59E0B', 'description': 'Property is under maintenance'}
        ]
        
        for status_data in property_statuses_data:
            if not PropertyStatus.query.filter_by(name=status_data['name']).first():
                property_status = PropertyStatus(
                    name=status_data['color'],
                    color=status_data['color'],
                    description=status_data['description']
                )
                db.session.add(property_status)
        
        # Commit all changes
        db.session.commit()
        
        # Create sample properties
        if Property.query.count() == 0:
            house_type = PropertyType.query.filter_by(name='House').first()
            apartment_type = PropertyType.query.filter_by(name='Apartment').first()
            townhouse_type = PropertyType.query.filter_by(name='Townhouse').first()
            
            available_status = PropertyStatus.query.filter_by(name='Available').first()
            occupied_status = PropertyStatus.query.filter_by(name='Occupied').first()
            maintenance_status = PropertyStatus.query.filter_by(name='Maintenance').first()
            
            sample_properties = [
                {'address': '123 Main Street, Smart Village', 'type': house_type, 'status': available_status, 'bedrooms': 3, 'bathrooms': 2},
                {'address': '456 Oak Avenue, Smart Village', 'type': apartment_type, 'status': occupied_status, 'bedrooms': 2, 'bathrooms': 1},
                {'address': '789 Pine Road, Smart Village', 'type': townhouse_type, 'status': occupied_status, 'bedrooms': 4, 'bathrooms': 3},
                {'address': '321 Elm Street, Smart Village', 'type': house_type, 'status': maintenance_status, 'bedrooms': 2, 'bathrooms': 1},
                {'address': '654 Maple Drive, Smart Village', 'type': apartment_type, 'status': available_status, 'bedrooms': 1, 'bathrooms': 1},
            ]
            
            for prop_data in sample_properties:
                if prop_data['type'] and prop_data['status']:
                    property_obj = Property(
                        address=prop_data['address'],
                        property_type_id=prop_data['type'].id,
                        property_status_id=prop_data['status'].id,
                        bedrooms=prop_data['bedrooms'],
                        bathrooms=prop_data['bathrooms'],
                        description=f"Sample {prop_data['type'].name.lower()} property"
                    )
                    db.session.add(property_obj)
        
        db.session.commit()
        print("✅ Default data created successfully")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating default data: {e}")

# Create the app instance
app = create_app()

if __name__ == '__main__':
    # Use PORT environment variable for Railway deployment
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=False, host='0.0.0.0', port=port)

