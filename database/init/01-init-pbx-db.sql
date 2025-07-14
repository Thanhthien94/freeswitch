-- FreeSWITCH PBX Database Initialization Script
-- This script creates the complete database schema matching current production

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE permission_action_enum AS ENUM (
    'read', 'create', 'update', 'delete', 'execute', 'manage'
);

CREATE TYPE permission_category_enum AS ENUM (
    'system', 'user', 'call', 'recording', 'report', 'configuration'
);

CREATE TYPE permission_resource_enum AS ENUM (
    'users', 'roles', 'permissions', 'calls', 'recordings', 'reports',
    'system_config', 'domains', 'extensions', 'call_detail_records'
);

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    domain_id VARCHAR(255) REFERENCES domains(id),
    parent_role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (matching current schema)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    domain_id VARCHAR(255) REFERENCES domains(id) DEFAULT 'localhost',
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    display_name VARCHAR(255),
    extension VARCHAR(20),
    department_id INTEGER,
    team_id INTEGER,
    manager_id INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255) NOT NULL
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    action permission_action_enum NOT NULL,
    resource permission_resource_enum NOT NULL,
    category permission_category_enum NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Create user_attributes table
CREATE TABLE IF NOT EXISTS user_attributes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, attribute_name)
);

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_detail_records table (CDR)
CREATE TABLE IF NOT EXISTS call_detail_records (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    caller_id_name VARCHAR(255),
    caller_id_number VARCHAR(255),
    destination_number VARCHAR(255),
    context VARCHAR(255),
    start_stamp TIMESTAMP WITH TIME ZONE,
    answer_stamp TIMESTAMP WITH TIME ZONE,
    end_stamp TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    billsec INTEGER,
    hangup_cause VARCHAR(255),
    bleg_uuid VARCHAR(255),
    accountcode VARCHAR(255),
    read_codec VARCHAR(255),
    write_codec VARCHAR(255),
    local_ip_v4 VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_recordings table
CREATE TABLE IF NOT EXISTS call_recordings (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    call_uuid VARCHAR(255) REFERENCES call_detail_records(uuid),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration INTEGER,
    format VARCHAR(50) DEFAULT 'wav',
    sample_rate INTEGER DEFAULT 8000,
    channels INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_events table
CREATE TABLE IF NOT EXISTS call_events (
    id SERIAL PRIMARY KEY,
    call_uuid VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_participants table
CREATE TABLE IF NOT EXISTS call_participants (
    id SERIAL PRIMARY KEY,
    call_uuid VARCHAR(255),
    participant_number VARCHAR(255),
    participant_name VARCHAR(255),
    role VARCHAR(50), -- 'caller', 'callee', 'transfer', etc.
    join_time TIMESTAMP WITH TIME ZONE,
    leave_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recording_tags table
CREATE TABLE IF NOT EXISTS recording_tags (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES call_recordings(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_value VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recording_access_logs table
CREATE TABLE IF NOT EXISTS recording_access_logs (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER REFERENCES call_recordings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    access_type VARCHAR(50) NOT NULL, -- 'play', 'download', 'view'
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id);
CREATE INDEX IF NOT EXISTS idx_users_extension ON users(extension);

CREATE INDEX IF NOT EXISTS idx_cdr_uuid ON call_detail_records(uuid);
CREATE INDEX IF NOT EXISTS idx_cdr_start_stamp ON call_detail_records(start_stamp);
CREATE INDEX IF NOT EXISTS idx_cdr_caller_id_number ON call_detail_records(caller_id_number);
CREATE INDEX IF NOT EXISTS idx_cdr_destination_number ON call_detail_records(destination_number);
CREATE INDEX IF NOT EXISTS idx_cdr_hangup_cause ON call_detail_records(hangup_cause);

CREATE INDEX IF NOT EXISTS idx_recordings_call_uuid ON call_recordings(call_uuid);
CREATE INDEX IF NOT EXISTS idx_recordings_filename ON call_recordings(filename);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON call_recordings(created_at);

CREATE INDEX IF NOT EXISTS idx_call_events_call_uuid ON call_events(call_uuid);
CREATE INDEX IF NOT EXISTS idx_call_events_event_type ON call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_call_events_timestamp ON call_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default domain
INSERT INTO domains (id, name, description, is_active) VALUES
    ('localhost', 'Localhost Domain', 'Default localhost domain for development', true)
ON CONFLICT (id) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, domain_id, is_active) VALUES
    ('superadmin', 'Super Administrator with full system access', 'localhost', true),
    ('admin', 'Domain Administrator', 'localhost', true),
    ('manager', 'Manager with limited administrative access', 'localhost', true),
    ('agent', 'Agent with basic access', 'localhost', true),
    ('user', 'Basic user access', 'localhost', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, action, resource, category, description) VALUES
    ('read_users', 'read', 'users', 'user', 'Read user information'),
    ('create_users', 'create', 'users', 'user', 'Create new users'),
    ('update_users', 'update', 'users', 'user', 'Update user information'),
    ('delete_users', 'delete', 'users', 'user', 'Delete users'),
    ('manage_users', 'manage', 'users', 'user', 'Full user management'),

    ('read_calls', 'read', 'calls', 'call', 'View call information'),
    ('manage_calls', 'manage', 'calls', 'call', 'Manage calls'),

    ('read_recordings', 'read', 'recordings', 'recording', 'Listen to recordings'),
    ('create_recordings', 'create', 'recordings', 'recording', 'Create recordings'),
    ('delete_recordings', 'delete', 'recordings', 'recording', 'Delete recordings'),
    ('manage_recordings', 'manage', 'recordings', 'recording', 'Full recording management'),

    ('read_reports', 'read', 'reports', 'report', 'View reports'),
    ('create_reports', 'create', 'reports', 'report', 'Create reports'),

    ('read_system_config', 'read', 'system_config', 'configuration', 'View system configuration'),
    ('update_system_config', 'update', 'system_config', 'configuration', 'Update system configuration'),
    ('manage_system', 'manage', 'system_config', 'system', 'Full system management')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'superadmin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN (
    'read_users', 'create_users', 'update_users', 'manage_users',
    'read_calls', 'manage_calls',
    'read_recordings', 'create_recordings', 'manage_recordings',
    'read_reports', 'create_reports',
    'read_system_config', 'update_system_config'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name IN (
    'read_users', 'update_users',
    'read_calls',
    'read_recordings', 'create_recordings',
    'read_reports', 'create_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'agent' AND p.name IN (
    'read_users',
    'read_calls',
    'read_recordings',
    'read_reports'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert default users (matching current production data)
INSERT INTO users (username, email, domain_id, first_name, last_name, display_name, is_active, password_hash) VALUES
    ('admin', 'admin@localhost', 'localhost', 'System', 'Administrator', 'System Administrator', true, '$2b$10$6RUEQZXBgdXZ7/kfJIOR7eLuV/1apXApNVV930Xv9f5NFABDqnieG'),
    ('manager', 'manager@localhost', 'localhost', 'John', 'Manager', 'John Manager', true, '$2b$10$K7L/8Y3TAFHy.E4PdNn8aeUi.aZc0.cswxg6RGAGiYMu2Wt.Oq9S2'),
    ('agent', 'agent@localhost', 'localhost', 'Bob', 'Agent', 'Bob Agent', true, '$2b$10$K7L/8Y3TAFHy.E4PdNn8aeUi.aZc0.cswxg6RGAGiYMu2Wt.Oq9S2')
ON CONFLICT (username) DO NOTHING;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT u.id, r.id, 1, true
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'superadmin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT u.id, r.id, 1, true
FROM users u, roles r
WHERE u.username = 'manager' AND r.name = 'manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
SELECT u.id, r.id, 1, true
FROM users u, roles r
WHERE u.username = 'agent' AND r.name = 'agent'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_attributes_updated_at BEFORE UPDATE ON user_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_detail_records_updated_at BEFORE UPDATE ON call_detail_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_recordings_updated_at BEFORE UPDATE ON call_recordings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to pbx_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pbx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pbx_user;
GRANT USAGE ON SCHEMA public TO pbx_user;

-- Grant permissions to postgres (for admin tasks)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
