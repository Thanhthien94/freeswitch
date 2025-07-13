-- Migration: Setup RBAC Data
-- Create default roles, permissions, and assignments

-- Insert default permissions
INSERT INTO permissions (id, name, description, resource, action, category, is_active, is_system) VALUES
-- System permissions
('perm-system-manage', 'system:manage', 'Full system management', 'system', 'manage', 'system', true, true),
('perm-system-read', 'system:read', 'Read system information', 'system', 'read', 'system', true, true),

-- Domain permissions
('perm-domain-manage', 'domain:manage', 'Full domain management', 'domain', 'manage', 'domain', true, true),
('perm-domain-read', 'domain:read', 'Read domain information', 'domain', 'read', 'domain', true, false),
('perm-domain-create', 'domain:create', 'Create new domains', 'domain', 'create', 'domain', true, true),
('perm-domain-update', 'domain:update', 'Update domain settings', 'domain', 'update', 'domain', true, false),
('perm-domain-delete', 'domain:delete', 'Delete domains', 'domain', 'delete', 'domain', true, true),

-- User permissions
('perm-users-manage', 'users:manage', 'Full user management', 'users', 'manage', 'users', true, false),
('perm-users-read', 'users:read', 'Read user information', 'users', 'read', 'users', true, false),
('perm-users-create', 'users:create', 'Create new users', 'users', 'create', 'users', true, false),
('perm-users-update', 'users:update', 'Update user information', 'users', 'update', 'users', true, false),
('perm-users-delete', 'users:delete', 'Delete users', 'users', 'delete', 'users', true, false),

-- Call permissions
('perm-calls-manage', 'calls:manage', 'Full call management', 'calls', 'manage', 'calls', true, false),
('perm-calls-read', 'calls:read', 'View call information', 'calls', 'read', 'calls', true, false),
('perm-calls-execute', 'calls:execute', 'Make and control calls', 'calls', 'execute', 'calls', true, false),

-- Extension permissions
('perm-extensions-manage', 'extensions:manage', 'Full extension management', 'extensions', 'manage', 'extensions', true, false),
('perm-extensions-read', 'extensions:read', 'View extension information', 'extensions', 'read', 'extensions', true, false),
('perm-extensions-create', 'extensions:create', 'Create new extensions', 'extensions', 'create', 'extensions', true, false),
('perm-extensions-update', 'extensions:update', 'Update extension settings', 'extensions', 'update', 'extensions', true, false),
('perm-extensions-delete', 'extensions:delete', 'Delete extensions', 'extensions', 'delete', 'extensions', true, false),

-- CDR permissions
('perm-cdr-manage', 'cdr:manage', 'Full CDR management', 'cdr', 'manage', 'cdr', true, false),
('perm-cdr-read', 'cdr:read', 'View call detail records', 'cdr', 'read', 'cdr', true, false),
('perm-cdr-delete', 'cdr:delete', 'Delete call records', 'cdr', 'delete', 'cdr', true, false),

-- Recording permissions
('perm-recordings-manage', 'recordings:manage', 'Full recording management', 'recordings', 'manage', 'recordings', true, false),
('perm-recordings-read', 'recordings:read', 'Listen to recordings', 'recordings', 'read', 'recordings', true, false),
('perm-recordings-create', 'recordings:create', 'Create recordings', 'recordings', 'create', 'recordings', true, false),
('perm-recordings-delete', 'recordings:delete', 'Delete recordings', 'recordings', 'delete', 'recordings', true, false),

-- Config permissions
('perm-config-manage', 'config:manage', 'Full configuration management', 'config', 'manage', 'config', true, false),
('perm-config-read', 'config:read', 'View configuration', 'config', 'read', 'config', true, false),
('perm-config-update', 'config:update', 'Update configuration', 'config', 'update', 'config', true, false),

-- Reports permissions
('perm-reports-read', 'reports:read', 'View reports', 'reports', 'read', 'reports', true, false),
('perm-reports-create', 'reports:create', 'Generate reports', 'reports', 'create', 'reports', true, false),

-- Security permissions
('perm-security-manage', 'security:manage', 'Full security management', 'security', 'manage', 'security', true, true),
('perm-security-read', 'security:read', 'View security information', 'security', 'read', 'security', true, false)

ON CONFLICT (id) DO NOTHING;

-- Get localhost domain ID
DO $$
DECLARE
    localhost_domain_id VARCHAR(255);
BEGIN
    SELECT id INTO localhost_domain_id FROM domains WHERE name = 'localhost';
    
    -- Insert default roles
    INSERT INTO roles (id, name, display_name, description, type, level, is_active, is_system, is_default, domain_id) VALUES
    -- Global system roles
    ('role-superadmin', 'superadmin', 'Super Administrator', 'Super Administrator - Full system access', 'global', 0, true, true, false, NULL),
    ('role-system-admin', 'system_admin', 'System Administrator', 'System Administrator - System management', 'global', 10, true, true, false, NULL),

    -- Domain roles for localhost
    ('role-domain-admin', 'domain_admin', 'Domain Administrator', 'Domain Administrator - Full domain access', 'domain', 20, true, false, false, localhost_domain_id),
    ('role-manager', 'manager', 'Manager', 'Manager - Department management', 'domain', 30, true, false, false, localhost_domain_id),
    ('role-supervisor', 'supervisor', 'Supervisor', 'Supervisor - Team supervision', 'domain', 50, true, false, false, localhost_domain_id),
    ('role-agent', 'agent', 'Agent', 'Agent - Call handling', 'domain', 70, true, false, true, localhost_domain_id),
    ('role-user', 'user', 'User', 'User - Basic access', 'domain', 80, true, false, false, localhost_domain_id)
    
    ON CONFLICT (id) DO NOTHING;

    -- Assign permissions to roles
    -- Superadmin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'role-superadmin', id FROM permissions
    ON CONFLICT DO NOTHING;

    -- System Admin gets system and domain management permissions
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-system-admin', 'perm-system-read'),
    ('role-system-admin', 'perm-domain-manage'),
    ('role-system-admin', 'perm-users-manage'),
    ('role-system-admin', 'perm-config-manage'),
    ('role-system-admin', 'perm-security-manage'),
    ('role-system-admin', 'perm-reports-read'),
    ('role-system-admin', 'perm-reports-create')
    ON CONFLICT DO NOTHING;

    -- Domain Admin gets domain-level permissions
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-domain-admin', 'perm-domain-read'),
    ('role-domain-admin', 'perm-domain-update'),
    ('role-domain-admin', 'perm-users-manage'),
    ('role-domain-admin', 'perm-calls-manage'),
    ('role-domain-admin', 'perm-extensions-manage'),
    ('role-domain-admin', 'perm-cdr-manage'),
    ('role-domain-admin', 'perm-recordings-manage'),
    ('role-domain-admin', 'perm-config-read'),
    ('role-domain-admin', 'perm-config-update'),
    ('role-domain-admin', 'perm-reports-read'),
    ('role-domain-admin', 'perm-reports-create'),
    ('role-domain-admin', 'perm-security-read')
    ON CONFLICT DO NOTHING;

    -- Manager gets user and call management permissions
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-manager', 'perm-users-read'),
    ('role-manager', 'perm-users-create'),
    ('role-manager', 'perm-users-update'),
    ('role-manager', 'perm-calls-manage'),
    ('role-manager', 'perm-extensions-read'),
    ('role-manager', 'perm-extensions-create'),
    ('role-manager', 'perm-extensions-update'),
    ('role-manager', 'perm-cdr-read'),
    ('role-manager', 'perm-recordings-read'),
    ('role-manager', 'perm-reports-read')
    ON CONFLICT DO NOTHING;

    -- Supervisor gets monitoring and basic management permissions
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-supervisor', 'perm-users-read'),
    ('role-supervisor', 'perm-calls-read'),
    ('role-supervisor', 'perm-calls-execute'),
    ('role-supervisor', 'perm-extensions-read'),
    ('role-supervisor', 'perm-cdr-read'),
    ('role-supervisor', 'perm-recordings-read'),
    ('role-supervisor', 'perm-reports-read')
    ON CONFLICT DO NOTHING;

    -- Agent gets call handling permissions
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-agent', 'perm-calls-read'),
    ('role-agent', 'perm-calls-execute'),
    ('role-agent', 'perm-extensions-read'),
    ('role-agent', 'perm-cdr-read'),
    ('role-agent', 'perm-recordings-read')
    ON CONFLICT DO NOTHING;

    -- User gets basic read permissions
    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('role-user', 'perm-calls-read'),
    ('role-user', 'perm-extensions-read'),
    ('role-user', 'perm-cdr-read')
    ON CONFLICT DO NOTHING;

    -- Assign superadmin role to admin user
    INSERT INTO user_roles (user_id, role_id, is_active, is_primary, granted_by, grant_reason)
    SELECT 1, 'role-superadmin', true, true, 'system', 'Initial setup'
    WHERE EXISTS (SELECT 1 FROM users WHERE id = 1 AND username = 'admin')
    ON CONFLICT (user_id, role_id) DO NOTHING;

END $$;
