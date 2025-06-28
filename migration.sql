-- Database Migration: Add is_system_role column to roles table
-- This script adds the missing is_system_role column and updates existing system roles

-- Check if column exists (PostgreSQL specific)
DO $$
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roles' AND column_name = 'is_system_role'
    ) THEN
        -- Add the column
        ALTER TABLE roles ADD COLUMN is_system_role BOOLEAN DEFAULT FALSE;
        
        -- Update existing system roles
        UPDATE roles SET is_system_role = TRUE WHERE name IN ('superadmin', 'admin', 'user');
        
        -- Log the changes
        RAISE NOTICE 'Column is_system_role added to roles table and system roles updated';
    ELSE
        RAISE NOTICE 'Column is_system_role already exists in roles table';
    END IF;
END $$;

