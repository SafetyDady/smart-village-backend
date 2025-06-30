#!/usr/bin/env python3
"""
Create database tables using SQLAlchemy
Smart Village Management System
"""

import os
import sys
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

from src.main import create_app
from src.models.user import db
from src.models.user_model import User, Role, Permission
from src.models.village import Village
from src.models.user_village import UserVillage
from src.models.emergency_override import EmergencyOverride

def create_tables():
    """Create all database tables"""
    print("=" * 60)
    print("🏘️ SMART VILLAGE MANAGEMENT SYSTEM")
    print("📋 Creating Database Tables")
    print("=" * 60)
    
    try:
        # Create Flask app
        app = create_app()
        
        with app.app_context():
            print("🔗 Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            print("✅ Database tables created successfully!")
            
            # Insert sample data
            print("📊 Inserting sample data...")
            
            # Check if we already have data
            if Role.query.count() == 0:
                print("   Creating roles...")
                
                # Create roles
                superadmin_role = Role(
                    name='superadmin',
                    description='Super Administrator with full system access',
                    is_system_role=True
                )
                
                village_admin_role = Role(
                    name='village_admin',
                    description='Village Administrator with village-scoped access',
                    is_system_role=True
                )
                
                village_user_role = Role(
                    name='village_user',
                    description='Village User with read-only access',
                    is_system_role=True
                )
                
                db.session.add_all([superadmin_role, village_admin_role, village_user_role])
                db.session.commit()
                
                print("   ✅ Roles created")
            
            if Permission.query.count() == 0:
                print("   Creating permissions...")
                
                # Create permissions
                permissions_data = [
                    # Village Management
                    ("villages.create", "Create new villages", "villages", "create"),
                    ("villages.read", "View village information", "villages", "read"),
                    ("villages.update", "Update village information", "villages", "update"),
                    ("villages.delete", "Delete villages", "villages", "delete"),
                    
                    # User Management
                    ("users.create", "Create new users", "users", "create"),
                    ("users.read", "View user information", "users", "read"),
                    ("users.update", "Update user information", "users", "update"),
                    ("users.delete", "Delete users", "users", "delete"),
                    ("users.assign_village", "Assign villages to users", "users", "assign_village"),
                    ("users.assign_role", "Assign roles to users", "users", "assign_role"),
                    
                    # Property Management
                    ("properties.create", "Create properties", "properties", "create"),
                    ("properties.read", "View properties", "properties", "read"),
                    ("properties.update", "Update properties", "properties", "update"),
                    ("properties.delete", "Delete properties", "properties", "delete"),
                    
                    # Financial Management
                    ("finances.create_invoice", "Create invoices", "finances", "create_invoice"),
                    ("finances.approve_payment", "Approve payments", "finances", "approve_payment"),
                    ("finances.view_reports", "View financial reports", "finances", "view_reports"),
                    
                    # Reports
                    ("reports.village", "Generate village reports", "reports", "village"),
                    ("reports.financial", "Generate financial reports", "reports", "financial"),
                    ("reports.property", "Generate property reports", "reports", "property"),
                    ("reports.system", "Generate system reports", "reports", "system"),
                    
                    # Emergency Override
                    ("audit.emergency_override", "Create emergency overrides", "audit", "emergency_override"),
                    ("audit.read", "View audit logs", "audit", "read"),
                    
                    # System
                    ("system.maintenance", "Perform system maintenance", "system", "maintenance"),
                ]
                
                for perm_data in permissions_data:
                    permission = Permission(
                        name=perm_data[0],
                        description=perm_data[1],
                        resource=perm_data[2],
                        action=perm_data[3]
                    )
                    db.session.add(permission)
                
                db.session.commit()
                print("   ✅ Permissions created")
                
                # Assign permissions to roles
                print("   Assigning permissions to roles...")
                
                superadmin_role = Role.query.filter_by(name='superadmin').first()
                village_admin_role = Role.query.filter_by(name='village_admin').first()
                
                # Super Admin gets all permissions
                all_permissions = Permission.query.all()
                for permission in all_permissions:
                    superadmin_role.permissions.append(permission)
                
                # Village Admin gets specific permissions
                village_admin_permissions = [
                    "villages.read", "villages.update",
                    "users.read", "users.update",
                    "properties.create", "properties.read", "properties.update", "properties.delete",
                    "finances.create_invoice", "finances.approve_payment", "finances.view_reports",
                    "reports.village", "reports.financial", "reports.property"
                ]
                
                for perm_name in village_admin_permissions:
                    permission = Permission.query.filter_by(name=perm_name).first()
                    if permission:
                        village_admin_role.permissions.append(permission)
                
                db.session.commit()
                print("   ✅ Permissions assigned to roles")
            
            if Village.query.count() == 0:
                print("   Creating sample villages...")
                
                # Create sample villages
                villages_data = [
                    {
                        "name": "หมู่บ้านสมาร์ทวิลเลจ 1",
                        "code": "SV001",
                        "description": "หมู่บ้านต้นแบบสมาร์ทวิลเลจ",
                        "address": "123 ถนนสมาร์ท",
                        "province": "กรุงเทพมหานคร",
                        "district": "เขตบางรัก",
                        "sub_district": "แขวงสีลม",
                        "postal_code": "10500"
                    },
                    {
                        "name": "หมู่บ้านเทคโนโลยี",
                        "code": "SV002", 
                        "description": "หมู่บ้านที่ใช้เทคโนโลยีสมัยใหม่",
                        "address": "456 ถนนเทคโนโลยี",
                        "province": "เชียงใหม่",
                        "district": "เมืองเชียงใหม่",
                        "sub_district": "ตำบลสุเทพ",
                        "postal_code": "50200"
                    },
                    {
                        "name": "หมู่บ้านอีโค",
                        "code": "SV003",
                        "description": "หมู่บ้านเป็นมิตรกับสิ่งแวดล้อม",
                        "address": "789 ถนนธรรมชาติ",
                        "province": "ภูเก็ต",
                        "district": "เมืองภูเก็ต",
                        "sub_district": "ตำบลรัษฎา",
                        "postal_code": "83000"
                    }
                ]
                
                for village_data in villages_data:
                    village = Village(**village_data)
                    db.session.add(village)
                
                db.session.commit()
                print("   ✅ Sample villages created")
            
            if User.query.filter_by(username='superadmin').first() is None:
                print("   Creating super admin user...")
                
                # Create super admin user
                superadmin = User(
                    username='superadmin',
                    email='admin@smartvillage.com',
                    first_name='Super',
                    last_name='Administrator',
                    is_verified=True
                )
                superadmin.set_password('SmartVillage2025!')
                
                # Assign super admin role
                superadmin_role = Role.query.filter_by(name='superadmin').first()
                superadmin.roles.append(superadmin_role)
                
                db.session.add(superadmin)
                db.session.commit()
                
                print("   ✅ Super admin user created")
                print("      Username: superadmin")
                print("      Password: SmartVillage2025!")
                print("      Email: admin@smartvillage.com")
            
            # Show summary
            print("\n📊 Database Summary:")
            print(f"   👥 Users: {User.query.count()}")
            print(f"   🏘️  Villages: {Village.query.count()}")
            print(f"   🔐 Roles: {Role.query.count()}")
            print(f"   🔑 Permissions: {Permission.query.count()}")
            print(f"   🔗 User-Village Assignments: {UserVillage.query.count()}")
            print(f"   🚨 Emergency Overrides: {EmergencyOverride.query.count()}")
            
            print("\n🎉 Database setup completed successfully!")
            print("🚀 You can now start the Smart Village backend server.")
            
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = create_tables()
    sys.exit(0 if success else 1)

