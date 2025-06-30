# Railway Database Migration Instructions

## Problem
The production database is missing the `is_system_role` column in the `roles` table, causing this error:
```
column roles.is_system_role does not exist
```

## Solution
Run the database migration script to add the missing column.

## Steps to Execute Migration on Railway

### Method 1: Using Railway CLI (Recommended)
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Connect to project: `railway link`
4. Run migration: `railway run python run_migration.py`

### Method 2: Using Railway Console
1. Go to Railway Dashboard
2. Open the smart-village-backend service
3. Go to "Deploy" tab
4. Click "View Logs" and then "Console"
5. Run: `python run_migration.py`

### Method 3: Direct Migration Script
```bash
python migrate_add_is_system_role.py
```

## Expected Output
```
🔄 Starting database migration...
📋 Migration: Add is_system_role column to roles table
✅ Migration completed successfully!
```

## Verification
After running the migration, the backend should start without the database error.

## Migration Details
- Adds `is_system_role BOOLEAN DEFAULT FALSE` column to `roles` table
- Updates existing system roles (superadmin, admin, user) to `is_system_role = TRUE`
- Uses transactions for safety
- Checks if column exists before adding (safe to run multiple times)

## Rollback (if needed)
If you need to rollback the migration:
```sql
ALTER TABLE roles DROP COLUMN is_system_role;
```

