-- FreeSWITCH PBX Database Initialization Script
-- This script creates the necessary tables for the PBX system

-- Create CDR table for FreeSWITCH call detail records
CREATE TABLE IF NOT EXISTS cdr (
    id SERIAL PRIMARY KEY,
    local_ip_v4 VARCHAR(15),
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
    uuid VARCHAR(255) UNIQUE,
    bleg_uuid VARCHAR(255),
    accountcode VARCHAR(255),
    read_codec VARCHAR(255),
    write_codec VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cdr_uuid ON cdr(uuid);
CREATE INDEX IF NOT EXISTS idx_cdr_start_stamp ON cdr(start_stamp);
CREATE INDEX IF NOT EXISTS idx_cdr_caller_id_number ON cdr(caller_id_number);
CREATE INDEX IF NOT EXISTS idx_cdr_destination_number ON cdr(destination_number);
CREATE INDEX IF NOT EXISTS idx_cdr_hangup_cause ON cdr(hangup_cause);

-- Create users table for PBX user management
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    extension VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_extension ON users(extension);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create extensions table for SIP extensions
CREATE TABLE IF NOT EXISTS extensions (
    id SERIAL PRIMARY KEY,
    extension VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) DEFAULT 'localhost',
    is_active BOOLEAN DEFAULT true,
    max_calls INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for extensions table
CREATE INDEX IF NOT EXISTS idx_extensions_extension ON extensions(extension);
CREATE INDEX IF NOT EXISTS idx_extensions_user_id ON extensions(user_id);
CREATE INDEX IF NOT EXISTS idx_extensions_domain ON extensions(domain);

-- Create call_sessions table for active call tracking
CREATE TABLE IF NOT EXISTS call_sessions (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    caller_id_number VARCHAR(255),
    destination_number VARCHAR(255),
    context VARCHAR(255),
    state VARCHAR(50) DEFAULT 'created',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answer_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for call_sessions table
CREATE INDEX IF NOT EXISTS idx_call_sessions_uuid ON call_sessions(uuid);
CREATE INDEX IF NOT EXISTS idx_call_sessions_state ON call_sessions(state);
CREATE INDEX IF NOT EXISTS idx_call_sessions_start_time ON call_sessions(start_time);

-- Create system_config table for application configuration
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for system_config table
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES (
    'admin', 
    'admin@localhost', 
    '$2b$10$rQZ8vQZ8vQZ8vQZ8vQZ8vOZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQ', -- admin123
    'System', 
    'Administrator', 
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert default user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, extension) 
VALUES (
    'user1', 
    'user1@localhost', 
    '$2b$10$rQZ8vQZ8vQZ8vQZ8vQZ8vOZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQZ8vQ', -- user123
    'Test', 
    'User', 
    'user',
    '1001'
) ON CONFLICT (username) DO NOTHING;

-- Insert default extensions
INSERT INTO extensions (extension, password, user_id, domain) 
VALUES 
    ('1001', 'ext1001pass', (SELECT id FROM users WHERE username = 'user1'), 'localhost'),
    ('1002', 'ext1002pass', NULL, 'localhost'),
    ('1003', 'ext1003pass', NULL, 'localhost')
ON CONFLICT (extension) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
    ('pbx_domain', 'localhost', 'Default PBX domain'),
    ('max_call_duration', '3600', 'Maximum call duration in seconds'),
    ('recording_enabled', 'false', 'Enable call recording'),
    ('voicemail_enabled', 'true', 'Enable voicemail system')
ON CONFLICT (config_key) DO NOTHING;

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

CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON extensions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_sessions_updated_at BEFORE UPDATE ON call_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pbx_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pbx_user;
