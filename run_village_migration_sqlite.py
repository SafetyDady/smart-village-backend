#!/usr/bin/env python3
"""
Village Role Management Migration for SQLite
Smart Village Management System
"""

import os
import sys
import sqlite3
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

def get_sqlite_connection():
    """Get SQLite database connection"""
    db_path = os.path.join(os.path.dirname(__file__), 'src', 'database', 'app.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return sqlite3.connect(db_path)

def run_migration():
    """Run the village role management migration"""
    print("=" * 60)
    print("🏘️ SMART VILLAGE MANAGEMENT SYSTEM")
    print("📋 Village Role Management Migration (SQLite)")
    print("=" * 60)
    
    try:
        # Connect to database
        print("🔗 Connecting to SQLite database...")
        conn = get_sqlite_connection()
        cursor = conn.cursor()
        
        print("✅ Connected to SQLite database successfully!")
        
        # Read and execute migration SQL
        print("📄 Reading migration SQL...")
        sql_file = os.path.join(os.path.dirname(__file__), 'village_role_migration.sql')
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Split SQL into individual statements and execute
        print("🚀 Executing migration...")
        
        # Remove PostgreSQL-specific syntax and adapt for SQLite
        sql_content = sql_content.replace('UUID', 'TEXT')
        sql_content = sql_content.replace('INET', 'TEXT')
        sql_content = sql_content.replace('uuid_generate_v4()', "lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-' || '4' || substr(hex(randomblob(2)), 2) || '-' || substr('AB89', 1 + (abs(random()) % 4), 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))")
        sql_content = sql_content.replace('CURRENT_TIMESTAMP', 'datetime("now")')
        sql_content = sql_content.replace('NOW()', 'datetime("now")')
        
        # Execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements, 1):
            if statement:
                try:
                    print(f"   Executing statement {i}/{len(statements)}...")
                    cursor.execute(statement)
                except sqlite3.Error as e:
                    if "already exists" in str(e).lower():
                        print(f"   ⚠️  Table/column already exists, skipping...")
                    else:
                        print(f"   ❌ Error in statement {i}: {e}")
                        print(f"   Statement: {statement[:100]}...")
        
        # Commit changes
        conn.commit()
        print("✅ Migration executed successfully!")
        
        # Insert sample data
        print("📊 Inserting sample data...")
        
        # Insert sample villages
        sample_villages = [
            ("หมู่บ้านสมาร์ทวิลเลจ 1", "SV001", "หมู่บ้านต้นแบบสมาร์ทวิลเลจ", "123 ถนนสมาร์ท", "กรุงเทพมหานคร", "เขตบางรัก", "แขวงสีลม", "10500"),
            ("หมู่บ้านเทคโนโลยี", "SV002", "หมู่บ้านที่ใช้เทคโนโลยีสมัยใหม่", "456 ถนนเทคโนโลยี", "เชียงใหม่", "เมืองเชียงใหม่", "ตำบลสุเทพ", "50200"),
            ("หมู่บ้านอีโค", "SV003", "หมู่บ้านเป็นมิตรกับสิ่งแวดล้อม", "789 ถนนธรรมชาติ", "ภูเก็ต", "เมืองภูเก็ต", "ตำบลรัษฎา", "83000")
        ]
        
        for village_data in sample_villages:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO villages 
                    (id, name, code, description, address, province, district, sub_district, postal_code, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                """, (
                    f"village-{village_data[1].lower()}",
                    village_data[0], village_data[1], village_data[2], village_data[3],
                    village_data[4], village_data[5], village_data[6], village_data[7]
                ))
            except sqlite3.Error as e:
                print(f"   ⚠️  Error inserting village {village_data[1]}: {e}")
        
        # Insert enhanced permissions
        enhanced_permissions = [
            # Village Management
            ("villages.create", "Create new villages"),
            ("villages.read", "View village information"),
            ("villages.update", "Update village information"),
            ("villages.delete", "Delete villages"),
            ("villages.assign_users", "Assign users to villages"),
            
            # User-Village Management
            ("users.assign_village", "Assign villages to users"),
            ("users.remove_village", "Remove villages from users"),
            ("users.view_assignments", "View user village assignments"),
            
            # Financial Management
            ("finances.create_invoice", "Create invoices"),
            ("finances.approve_payment", "Approve payments"),
            ("finances.view_reports", "View financial reports"),
            ("finances.manage_fees", "Manage fees and charges"),
            
            # Property Management (Enhanced)
            ("properties.bulk_import", "Bulk import properties"),
            ("properties.export", "Export property data"),
            ("properties.transfer", "Transfer property ownership"),
            
            # Resident Management
            ("residents.create", "Add new residents"),
            ("residents.update", "Update resident information"),
            ("residents.delete", "Remove residents"),
            ("residents.view_history", "View resident history"),
            
            # Reports and Analytics
            ("reports.village", "Generate village reports"),
            ("reports.financial", "Generate financial reports"),
            ("reports.property", "Generate property reports"),
            ("reports.system", "Generate system reports"),
            
            # Emergency Override
            ("audit.emergency_override", "Create emergency overrides"),
            ("audit.read", "View audit logs"),
            ("audit.export", "Export audit data"),
            
            # System Administration
            ("system.maintenance", "Perform system maintenance"),
            ("system.backup", "Create system backups"),
            ("system.settings", "Manage system settings")
        ]
        
        for perm_data in enhanced_permissions:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO permissions (id, name, description, created_at)
                    VALUES (?, ?, ?, datetime('now'))
                """, (f"perm-{perm_data[0].replace('.', '-')}", perm_data[0], perm_data[1]))
            except sqlite3.Error as e:
                print(f"   ⚠️  Error inserting permission {perm_data[0]}: {e}")
        
        conn.commit()
        print("✅ Sample data inserted successfully!")
        
        # Show summary
        print("\n📊 Migration Summary:")
        
        # Count tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%village%'")
        village_tables = cursor.fetchall()
        print(f"   📋 Village-related tables: {len(village_tables)}")
        for table in village_tables:
            print(f"      - {table[0]}")
        
        # Count villages
        cursor.execute("SELECT COUNT(*) FROM villages")
        village_count = cursor.fetchone()[0]
        print(f"   🏘️  Sample villages: {village_count}")
        
        # Count permissions
        cursor.execute("SELECT COUNT(*) FROM permissions")
        permission_count = cursor.fetchone()[0]
        print(f"   🔐 Total permissions: {permission_count}")
        
        print("\n🎉 Village Role Management Migration completed successfully!")
        print("🚀 You can now start the Smart Village backend server.")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    
    finally:
        if 'conn' in locals():
            conn.close()
    
    return True

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)

