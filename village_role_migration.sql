-- Village Role Management Migration
-- Smart Village Management System
-- Date: 2025-06-29

-- ===================================
-- 1. CREATE VILLAGES TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    
    -- Geographic Information
    province VARCHAR(50),
    district VARCHAR(50),
    sub_district VARCHAR(50),
    postal_code VARCHAR(10),
    
    -- Contact Information
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    total_properties INTEGER DEFAULT 0,
    total_residents INTEGER DEFAULT 0,
    established_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for Villages
CREATE INDEX IF NOT EXISTS idx_villages_code ON villages(code);
CREATE INDEX IF NOT EXISTS idx_villages_active ON villages(is_active);
CREATE INDEX IF NOT EXISTS idx_villages_province ON villages(province);
CREATE INDEX IF NOT EXISTS idx_villages_created_by ON villages(created_by);

-- ===================================
-- 2. CREATE USER-VILLAGE ASSIGNMENTS TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS user_villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assigned_by UUID NOT NULL REFERENCES users(id),
    assignment_type VARCHAR(20) DEFAULT 'manual', -- manual, invitation, bulk
    
    -- Permissions Scope
    can_manage_properties BOOLEAN DEFAULT true,
    can_manage_residents BOOLEAN DEFAULT true,
    can_manage_finances BOOLEAN DEFAULT true,
    can_view_reports BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false, -- Primary village for the user
    
    -- Timestamps
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, village_id),
    CHECK (assigned_at <= COALESCE(activated_at, CURRENT_TIMESTAMP)),
    CHECK (activated_at <= COALESCE(deactivated_at, CURRENT_TIMESTAMP))
);

-- Indexes for User-Villages
CREATE INDEX IF NOT EXISTS idx_user_villages_user ON user_villages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_villages_village ON user_villages(village_id);
CREATE INDEX IF NOT EXISTS idx_user_villages_active ON user_villages(is_active);
CREATE INDEX IF NOT EXISTS idx_user_villages_primary ON user_villages(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_villages_assigned_by ON user_villages(assigned_by);

-- ===================================
-- 3. CREATE EMERGENCY OVERRIDES TABLE
-- ===================================

CREATE TABLE IF NOT EXISTS emergency_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    target_resource VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Override Details
    original_permission VARCHAR(100),
    override_granted BOOLEAN DEFAULT true,
    
    -- Approval (for future use)
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indexes for Emergency Overrides
CREATE INDEX IF NOT EXISTS idx_emergency_overrides_user ON emergency_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_overrides_active ON emergency_overrides(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_emergency_overrides_resource ON emergency_overrides(target_resource, target_id);

-- ===================================
-- 4. INSERT ENHANCED PERMISSIONS
-- ===================================

-- Village Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('villages.create', 'Create new villages', 'villages', 'create'),
('villages.read', 'View village information', 'villages', 'read'),
('villages.update', 'Update village information', 'villages', 'update'),
('villages.delete', 'Delete villages', 'villages', 'delete'),
('villages.assign', 'Assign users to villages', 'villages', 'assign')
ON CONFLICT (name) DO NOTHING;

-- Enhanced User Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('users.assign_village', 'Assign villages to users', 'users', 'assign_village'),
('users.assign_role', 'Assign roles to users', 'users', 'assign_role'),
('users.reset_password', 'Reset user passwords', 'users', 'reset_password'),
('users.lock_account', 'Lock/unlock user accounts', 'users', 'lock_account')
ON CONFLICT (name) DO NOTHING;

-- Financial Management Permissions (Enhanced)
INSERT INTO permissions (name, description, resource, action) VALUES
('invoices.create', 'Create invoices', 'invoices', 'create'),
('invoices.read', 'View invoices', 'invoices', 'read'),
('invoices.update', 'Update invoices', 'invoices', 'update'),
('invoices.delete', 'Delete invoices', 'invoices', 'delete'),
('invoices.approve', 'Approve invoices', 'invoices', 'approve'),
('invoices.send', 'Send invoices to residents', 'invoices', 'send'),

('payments.create', 'Record payments', 'payments', 'create'),
('payments.read', 'View payments', 'payments', 'read'),
('payments.update', 'Update payments', 'payments', 'update'),
('payments.approve', 'Approve payments', 'payments', 'approve'),
('payments.refund', 'Process refunds', 'payments', 'refund'),

('fees.configure', 'Configure fee structures', 'fees', 'configure'),
('fees.collect', 'Collect fees', 'fees', 'collect'),
('fees.read', 'View fee information', 'fees', 'read'),
('fees.update', 'Update fee information', 'fees', 'update')
ON CONFLICT (name) DO NOTHING;

-- Property Management Permissions (Enhanced)
INSERT INTO permissions (name, description, resource, action) VALUES
('properties.create', 'Create properties', 'properties', 'create'),
('properties.read', 'View properties', 'properties', 'read'),
('properties.update', 'Update properties', 'properties', 'update'),
('properties.delete', 'Delete properties', 'properties', 'delete'),
('properties.assign_resident', 'Assign residents to properties', 'properties', 'assign_resident')
ON CONFLICT (name) DO NOTHING;

-- Resident Management Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('residents.create', 'Create resident records', 'residents', 'create'),
('residents.read', 'View resident information', 'residents', 'read'),
('residents.update', 'Update resident information', 'residents', 'update'),
('residents.delete', 'Delete resident records', 'residents', 'delete')
ON CONFLICT (name) DO NOTHING;

-- System Administration Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('system.configure', 'Configure system settings', 'system', 'configure'),
('system.monitor', 'Monitor system performance', 'system', 'monitor'),
('system.backup', 'Create system backups', 'system', 'backup'),
('system.restore', 'Restore from backups', 'system', 'restore'),
('system.maintenance', 'Perform system maintenance', 'system', 'maintenance')
ON CONFLICT (name) DO NOTHING;

-- Audit & Reporting Permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('audit.read', 'View audit logs', 'audit', 'read'),
('audit.export', 'Export audit data', 'audit', 'export'),
('audit.delete', 'Delete audit logs', 'audit', 'delete'),
('audit.emergency_override', 'Emergency override with audit', 'audit', 'emergency_override'),

('reports.financial', 'Generate financial reports', 'reports', 'financial'),
('reports.property', 'Generate property reports', 'reports', 'property'),
('reports.resident', 'Generate resident reports', 'reports', 'resident'),
('reports.system', 'Generate system reports', 'reports', 'system'),
('reports.export', 'Export reports', 'reports', 'export')
ON CONFLICT (name) DO NOTHING;

-- ===================================
-- 5. CREATE/UPDATE ROLES
-- ===================================

-- Create Super Admin Role
INSERT INTO roles (name, description, is_system_role) VALUES 
('superadmin', 'System Super Administrator with full access', true)
ON CONFLICT (name) DO NOTHING;

-- Create Village Admin Role
INSERT INTO roles (name, description, is_system_role) VALUES 
('village_admin', 'Village Administrator with village-scoped access', true)
ON CONFLICT (name) DO NOTHING;

-- Create Village User Role (for future)
INSERT INTO roles (name, description, is_system_role) VALUES 
('village_user', 'Village User with limited read access', true)
ON CONFLICT (name) DO NOTHING;

-- ===================================
-- 6. ASSIGN PERMISSIONS TO ROLES
-- ===================================

-- Super Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'superadmin'),
    id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Village Admin gets scoped permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'village_admin'),
    id
FROM permissions 
WHERE name IN (
    -- Property Management
    'properties.create', 'properties.read', 'properties.update', 'properties.delete',
    'properties.assign_resident',
    
    -- Resident Management
    'residents.create', 'residents.read', 'residents.update', 'residents.delete',
    
    -- Financial Management
    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.send',
    'payments.create', 'payments.read', 'payments.approve',
    'fees.read', 'fees.collect',
    
    -- Reports (Village-scoped)
    'reports.financial', 'reports.property', 'reports.resident', 'reports.export',
    
    -- Limited User Management
    'users.read',
    
    -- Village Information
    'villages.read', 'villages.update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Village User gets read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'village_user'),
    id
FROM permissions 
WHERE name IN (
    'properties.read',
    'residents.read',
    'invoices.read',
    'payments.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ===================================
-- 7. CREATE SAMPLE DATA
-- ===================================

-- Insert sample villages
INSERT INTO villages (name, code, description, province, district, contact_person, contact_phone) VALUES
('หมู่บ้านสมบูรณ์', 'VIL001', 'หมู่บ้านตัวอย่างสำหรับทดสอบระบบ', 'กรุงเทพมหานคร', 'บางกะปิ', 'นายสมชาย ใจดี', '02-123-4567'),
('หมู่บ้านสุขสันต์', 'VIL002', 'หมู่บ้านตัวอย่างที่สอง', 'กรุงเทพมหานคร', 'ลาดพร้าว', 'นางสมศรี สุขใส', '02-234-5678')
ON CONFLICT (code) DO NOTHING;

-- ===================================
-- 8. UPDATE EXISTING SUPERADMIN USER
-- ===================================

-- Update existing superadmin user to have superadmin role
UPDATE users 
SET updated_at = CURRENT_TIMESTAMP
WHERE username = 'superadmin';

-- Ensure superadmin user has superadmin role
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id,
    r.id
FROM users u, roles r
WHERE u.username = 'superadmin' 
AND r.name = 'superadmin'
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- ===================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ===================================

-- Trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to villages table
DROP TRIGGER IF EXISTS update_villages_updated_at ON villages;
CREATE TRIGGER update_villages_updated_at
    BEFORE UPDATE ON villages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 10. VERIFICATION QUERIES
-- ===================================

-- Verify tables were created
SELECT 'Villages table created' as status, count(*) as count FROM villages;
SELECT 'User-Villages table created' as status, count(*) as count FROM user_villages;
SELECT 'Emergency Overrides table created' as status, count(*) as count FROM emergency_overrides;

-- Verify permissions were added
SELECT 'Total permissions' as status, count(*) as count FROM permissions;
SELECT 'Village permissions' as status, count(*) as count FROM permissions WHERE resource = 'villages';
SELECT 'Financial permissions' as status, count(*) as count FROM permissions WHERE resource IN ('invoices', 'payments', 'fees');

-- Verify roles were created
SELECT 'Total roles' as status, count(*) as count FROM roles;
SELECT 'System roles' as status, count(*) as count FROM roles WHERE is_system_role = true;

-- Verify role permissions
SELECT r.name as role, count(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name IN ('superadmin', 'village_admin', 'village_user')
GROUP BY r.name
ORDER BY r.name;

-- Migration completed successfully
SELECT 'Migration completed successfully at ' || CURRENT_TIMESTAMP as status;

