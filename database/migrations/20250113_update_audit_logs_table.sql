-- Migration: Update audit_logs table to match new AuditLog entity
-- Date: 2025-01-13
-- Description: Update audit_logs table structure to support comprehensive audit logging

BEGIN;

-- Drop existing table and recreate with new structure
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create audit_logs table with new comprehensive structure
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and session info
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    username VARCHAR(100),
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    result VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    
    -- Resource information
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    
    -- Context information
    domain_id VARCHAR(255) REFERENCES domains(id) ON DELETE SET NULL,
    client_ip INET,
    user_agent VARCHAR(500),
    request_id VARCHAR(255),
    
    -- Risk and security
    risk_level VARCHAR(50) DEFAULT 'low',
    risk_score DECIMAL(5,2),
    threat_indicators TEXT[],
    
    -- Policy and authorization details
    policies_evaluated TEXT[],
    permissions_checked TEXT[],
    roles_involved TEXT[],
    
    -- Additional data
    metadata JSONB,
    error_message VARCHAR(1000),
    stack_trace TEXT,
    
    -- Timing
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    
    -- Compliance and retention
    compliance_tags TEXT[],
    retention_until TIMESTAMPTZ,
    is_sensitive BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_result ON audit_logs(result);
CREATE INDEX idx_audit_logs_risk_level ON audit_logs(risk_level);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_domain_id ON audit_logs(domain_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX idx_audit_logs_client_ip ON audit_logs(client_ip);

-- Create partial indexes for high-risk events
CREATE INDEX idx_audit_logs_high_risk ON audit_logs(timestamp) 
WHERE risk_level IN ('high', 'critical');

-- Create partial indexes for failures
CREATE INDEX idx_audit_logs_failures ON audit_logs(timestamp) 
WHERE result IN ('failure', 'error');

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit logging for security and compliance';
COMMENT ON COLUMN audit_logs.risk_level IS 'Risk level: low, medium, high, critical';
COMMENT ON COLUMN audit_logs.result IS 'Result: success, failure, error, warning';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data in JSON format';
COMMENT ON COLUMN audit_logs.threat_indicators IS 'Array of security threat indicators';

COMMIT;
