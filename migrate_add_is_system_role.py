#!/usr/bin/env python3
"""
Database Migration Script: Add is_system_role column to roles table

This script adds the missing is_system_role column to the roles table
in the production PostgreSQL database.
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from urllib.parse import urlparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL from environment variables"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        # Fallback to Railway environment variables
        db_host = os.environ.get('PGHOST')
        db_port = os.environ.get('PGPORT', '5432')
        db_name = os.environ.get('PGDATABASE')
        db_user = os.environ.get('PGUSER')
        db_password = os.environ.get('PGPASSWORD')
        
        if all([db_host, db_name, db_user, db_password]):
            database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        else:
            raise ValueError("No database connection information found in environment variables")
    
    return database_url

def parse_database_url(database_url):
    """Parse database URL and return connection parameters"""
    # Handle postgres:// URLs (convert to postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    parsed = urlparse(database_url)
    
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],  # Remove leading slash
        'user': parsed.username,
        'password': parsed.password
    }

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        );
    """, (table_name, column_name))
    
    return cursor.fetchone()[0]

def add_is_system_role_column(cursor):
    """Add is_system_role column to roles table"""
    logger.info("Adding is_system_role column to roles table...")
    
    # Add the column with default value
    cursor.execute("""
        ALTER TABLE roles 
        ADD COLUMN is_system_role BOOLEAN DEFAULT FALSE;
    """)
    
    logger.info("Column added successfully")
    
    # Update existing system roles
    logger.info("Updating existing system roles...")
    
    system_roles = ['superadmin', 'admin', 'user']
    for role_name in system_roles:
        cursor.execute("""
            UPDATE roles 
            SET is_system_role = TRUE 
            WHERE name = %s;
        """, (role_name,))
        
        if cursor.rowcount > 0:
            logger.info(f"Updated role '{role_name}' as system role")
    
    logger.info("System roles updated successfully")

def main():
    """Main migration function"""
    try:
        # Get database connection
        database_url = get_database_url()
        db_params = parse_database_url(database_url)
        
        logger.info(f"Connecting to database: {db_params['host']}:{db_params['port']}/{db_params['database']}")
        
        # Connect to database
        conn = psycopg2.connect(**db_params)
        conn.autocommit = False  # Use transactions
        
        with conn.cursor() as cursor:
            # Check if column already exists
            if check_column_exists(cursor, 'roles', 'is_system_role'):
                logger.info("Column 'is_system_role' already exists in roles table")
                return
            
            # Start transaction
            logger.info("Starting migration transaction...")
            
            # Add the column
            add_is_system_role_column(cursor)
            
            # Commit transaction
            conn.commit()
            logger.info("Migration completed successfully!")
            
    except psycopg2.Error as e:
        logger.error(f"Database error: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)
        
    finally:
        if 'conn' in locals():
            conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    main()

