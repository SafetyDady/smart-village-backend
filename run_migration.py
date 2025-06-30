#!/usr/bin/env python3
"""
Simple migration runner for Railway deployment

This script can be run on Railway to execute database migrations.
Usage: python run_migration.py
"""

import subprocess
import sys
import os

def main():
    """Run the migration script"""
    print("🔄 Starting database migration...")
    print("📋 Migration: Add is_system_role column to roles table")
    
    try:
        # Run the migration script
        result = subprocess.run([
            sys.executable, 
            'migrate_add_is_system_role.py'
        ], capture_output=True, text=True, check=True)
        
        print("✅ Migration completed successfully!")
        print("📄 Migration output:")
        print(result.stdout)
        
        if result.stderr:
            print("⚠️  Migration warnings:")
            print(result.stderr)
            
    except subprocess.CalledProcessError as e:
        print("❌ Migration failed!")
        print(f"Exit code: {e.returncode}")
        print("Error output:")
        print(e.stderr)
        print("Standard output:")
        print(e.stdout)
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

