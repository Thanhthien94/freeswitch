-- Simple ABAC/RBAC Database Setup
-- Run this directly in PostgreSQL to create basic auth tables

-- 1. Create domains table
CREATE TABLE IF NOT EXISTS domains (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'custom',
    level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    domain_id VARCHAR(255),
    parent_role_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- 4. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id VARCHAR(255) NOT NULL,
    permission_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(255),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- 5. Update users table (add new columns)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS domain_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS extension VARCHAR(50),
ADD COLUMN IF NOT EXISTS department_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS team_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS manager_id INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add foreign key for domain
ALTER TABLE users 
ADD CONSTRAINT fk_users_domain 
FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;

-- Add foreign key for manager (self-reference)
ALTER TABLE users 
ADD CONSTRAINT fk_users_manager 
FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- 6. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role_id VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(255),
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE(user_id, role_id)
);

-- 7. Create user_attributes table
CREATE TABLE IF NOT EXISTS user_attributes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    attribute_name VARCHAR(255) NOT NULL,
    attribute_value TEXT,
    category VARCHAR(100) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, attribute_name)
);

-- 8. Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'abac',
    status VARCHAR(50) DEFAULT 'active',
    priority INTEGER DEFAULT 100,
    conditions JSONB DEFAULT '{}',
    effect VARCHAR(20) DEFAULT 'allow',
    domain_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- 9. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    result VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'low',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    domain_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_policies_domain_id ON policies(domain_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

-- Insert default data
INSERT INTO domains (id, name, display_name, description) VALUES 
('localhost', 'localhost', 'Local Development Domain', 'Default domain for local development')
ON CONFLICT (id) DO NOTHING;

-- Insert basic permissions
INSERT INTO permissions (id, name, resource, action, description) VALUES 
('users:read', 'users:read', 'users', 'read', 'Read user information'),
('users:create', 'users:create', 'users', 'create', 'Create new users'),
('users:update', 'users:update', 'users', 'update', 'Update user information'),
('users:delete', 'users:delete', 'users', 'delete', 'Delete users'),
('calls:read', 'calls:read', 'calls', 'read', 'View call information'),
('calls:execute', 'calls:execute', 'calls', 'execute', 'Make and manage calls'),
('cdr:read', 'cdr:read', 'cdr', 'read', 'View call detail records'),
('recordings:read', 'recordings:read', 'recordings', 'read', 'View call recordings'),
('system:manage', 'system:manage', 'system', 'manage', 'Full system management')
ON CONFLICT (id) DO NOTHING;

-- Insert basic roles
INSERT INTO roles (id, name, display_name, description, level, domain_id) VALUES 
('superadmin', 'SuperAdmin', 'System Super Administrator', 'Full system access', 100, NULL),
('admin', 'Admin', 'Domain Administrator', 'Domain administration', 90, 'localhost'),
('manager', 'Manager', 'Department Manager', 'Department management', 70, 'localhost'),
('agent', 'Agent', 'Call Center Agent', 'Basic call operations', 30, 'localhost'),
('user', 'User', 'Basic User', 'Basic system access', 10, 'localhost')
ON CONFLICT (id) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id) VALUES 
('superadmin', 'system:manage'),
('admin', 'users:read'),
('admin', 'users:create'),
('admin', 'users:update'),
('admin', 'cdr:read'),
('manager', 'users:read'),
('manager', 'calls:read'),
('manager', 'cdr:read'),
('agent', 'calls:read'),
('agent', 'calls:execute'),
('user', 'calls:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create demo users
INSERT INTO users (username, email, password_hash, first_name, last_name, display_name, domain_id, is_active) VALUES 
('admin', 'admin@localhost', '$2b$10$example.hash.for.admin123', 'System', 'Administrator', 'System Administrator', 'localhost', true),
('manager', 'manager@localhost', '$2b$10$example.hash.for.manager123', 'John', 'Manager', 'John Manager', 'localhost', true),
('agent', 'agent@localhost', '$2b$10$example.hash.for.agent123', 'Bob', 'Agent', 'Bob Agent', 'localhost', true)
ON CONFLICT (username) DO NOTHING;

-- Assign roles to demo users
INSERT INTO user_roles (user_id, role_id, is_primary) VALUES 
((SELECT id FROM users WHERE username = 'admin'), 'superadmin', true),
((SELECT id FROM users WHERE username = 'manager'), 'manager', true),
((SELECT id FROM users WHERE username = 'agent'), 'agent', true)
ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
