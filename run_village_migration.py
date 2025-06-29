#!/usr/bin/env python3
"""
Village Role Management Migration Script
Smart Village Management System
Date: 2025-06-29
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_database_url():
    """Get database URL from environment variables"""
    # Try Railway environment variables first
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url
    
    # Try individual components
    host = os.getenv('PGHOST', 'localhost')
    port = os.getenv('PGPORT', '5432')
    database = os.getenv('PGDATABASE', 'smart_village')
    user = os.getenv('PGUSER', 'postgres')
    password = os.getenv('PGPASSWORD', '')
    
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"

def run_migration():
    """Run the village role management migration"""
    print("🚀 Starting Village Role Management Migration...")
    print(f"⏰ Started at: {datetime.now()}")
    
    try:
        # Get database connection
        database_url = get_database_url()
        print(f"📡 Connecting to database...")
        
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("✅ Database connection established")
        
        # Read migration SQL file
        migration_file = 'village_role_migration.sql'
        if not os.path.exists(migration_file):
            raise FileNotFoundError(f"Migration file {migration_file} not found")
        
        print(f"📖 Reading migration file: {migration_file}")
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Execute migration
        print("🔧 Executing migration...")
        cursor.execute(migration_sql)
        
        print("✅ Migration executed successfully")
        
        # Fetch and display verification results
        print("\n📊 Migration Verification Results:")
        print("=" * 50)
        
        # Get verification results
        verification_queries = [
            "SELECT 'Villages table' as item, count(*) as count FROM villages",
            "SELECT 'User-Villages table' as item, count(*) as count FROM user_villages", 
            "SELECT 'Emergency Overrides table' as item, count(*) as count FROM emergency_overrides",
            "SELECT 'Total permissions' as item, count(*) as count FROM permissions",
            "SELECT 'Total roles' as item, count(*) as count FROM roles",
            """
            SELECT 'Role: ' || r.name as item, count(rp.permission_id) as count
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            WHERE r.name IN ('superadmin', 'village_admin', 'village_user')
            GROUP BY r.name
            ORDER BY r.name
            """
        ]
        
        for query in verification_queries:
            cursor.execute(query)
            results = cursor.fetchall()
            for row in results:
                print(f"  {row['item']}: {row['count']}")
        
        # Check sample data
        print("\n🏘️ Sample Villages:")
        cursor.execute("SELECT name, code, province, district FROM villages ORDER BY code")
        villages = cursor.fetchall()
        for village in villages:
            print(f"  {village['code']}: {village['name']} ({village['province']}, {village['district']})")
        
        # Check superadmin user
        print("\n👤 Superadmin User Status:")
        cursor.execute("""
            SELECT u.username, u.email, r.name as role
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE u.username = 'superadmin'
        """)
        superadmin = cursor.fetchone()
        if superadmin:
            print(f"  Username: {superadmin['username']}")
            print(f"  Email: {superadmin['email']}")
            print(f"  Role: {superadmin['role']}")
        else:
            print("  ⚠️ Superadmin user not found or not assigned to superadmin role")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 Migration completed successfully!")
        print(f"⏰ Completed at: {datetime.now()}")
        
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except FileNotFoundError as e:
        print(f"❌ File error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def check_prerequisites():
    """Check if prerequisites are met"""
    print("🔍 Checking prerequisites...")
    
    # Check if migration file exists
    if not os.path.exists('village_role_migration.sql'):
        print("❌ Migration file 'village_role_migration.sql' not found")
        return False
    
    # Check database connection
    try:
        database_url = get_database_url()
        conn = psycopg2.connect(database_url)
        conn.close()
        print("✅ Database connection test passed")
        return True
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("🏘️ SMART VILLAGE MANAGEMENT SYSTEM")
    print("📋 Village Role Management Migration")
    print("=" * 60)
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites check failed. Please fix the issues and try again.")
        sys.exit(1)
    
    # Confirm before running
    print("\n⚠️ This migration will:")
    print("  • Create villages, user_villages, and emergency_overrides tables")
    print("  • Add 40+ new permissions")
    print("  • Create superadmin, village_admin, and village_user roles")
    print("  • Assign permissions to roles")
    print("  • Insert sample village data")
    print("  • Update superadmin user role")
    
    confirm = input("\n❓ Do you want to proceed? (y/N): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("❌ Migration cancelled by user")
        sys.exit(0)
    
    # Run migration
    success = run_migration()
    
    if success:
        print("\n🎊 All done! The Village Role Management system is now ready.")
        print("\n📝 Next steps:")
        print("  1. Test the new API endpoints")
        print("  2. Create Village Admin users")
        print("  3. Assign villages to Village Admins")
        print("  4. Update frontend to use new permissions")
        sys.exit(0)
    else:
        print("\n💥 Migration failed. Please check the errors above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()

