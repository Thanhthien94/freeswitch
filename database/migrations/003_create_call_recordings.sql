-- Migration: Create call recordings tables
-- Description: Database schema for call recording management and metadata

-- Call Recordings Table
CREATE TABLE IF NOT EXISTS call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Call Information
    call_uuid VARCHAR(255) NOT NULL UNIQUE,
    caller_number VARCHAR(50) NOT NULL,
    callee_number VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
    
    -- Recording File Information
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_format VARCHAR(10) DEFAULT 'wav',
    duration_seconds INTEGER,
    
    -- Recording Metadata
    recording_started_at TIMESTAMP WITH TIME ZONE,
    recording_ended_at TIMESTAMP WITH TIME ZONE,
    recording_quality VARCHAR(20) DEFAULT 'standard',
    is_stereo BOOLEAN DEFAULT true,
    
    -- Call Metadata
    call_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    call_answered_at TIMESTAMP WITH TIME ZONE,
    call_ended_at TIMESTAMP WITH TIME ZONE,
    hangup_cause VARCHAR(50),
    
    -- Business Information
    domain_name VARCHAR(100),
    context VARCHAR(50) DEFAULT 'default',
    
    -- Status and Flags
    recording_status VARCHAR(20) DEFAULT 'completed' CHECK (recording_status IN ('recording', 'completed', 'failed', 'processing')),
    is_archived BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    -- Indexes
    CONSTRAINT unique_call_recording UNIQUE (call_uuid, file_path)
);

-- Recording Access Logs Table
CREATE TABLE IF NOT EXISTS recording_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    
    -- Access Information
    accessed_by VARCHAR(100) NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'play', 'delete')),
    access_method VARCHAR(20) DEFAULT 'web' CHECK (access_method IN ('web', 'api', 'system')),
    
    -- Client Information
    ip_address INET,
    user_agent TEXT,
    
    -- Audit
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recording Tags Table (for categorization)
CREATE TABLE IF NOT EXISTS recording_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    
    tag_name VARCHAR(50) NOT NULL,
    tag_value VARCHAR(100),
    tag_type VARCHAR(20) DEFAULT 'custom' CHECK (tag_type IN ('system', 'custom', 'business')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    CONSTRAINT unique_recording_tag UNIQUE (recording_id, tag_name)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_uuid ON call_recordings(call_uuid);
CREATE INDEX IF NOT EXISTS idx_call_recordings_caller ON call_recordings(caller_number);
CREATE INDEX IF NOT EXISTS idx_call_recordings_callee ON call_recordings(callee_number);
CREATE INDEX IF NOT EXISTS idx_call_recordings_date ON call_recordings(call_started_at);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(recording_status);
CREATE INDEX IF NOT EXISTS idx_call_recordings_domain ON call_recordings(domain_name);

CREATE INDEX IF NOT EXISTS idx_access_logs_recording ON recording_access_logs(recording_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON recording_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON recording_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_recording_tags_recording ON recording_tags(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_tags_name ON recording_tags(tag_name);

-- Create Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_call_recordings_updated_at 
    BEFORE UPDATE ON call_recordings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial system tags
INSERT INTO recording_tags (recording_id, tag_name, tag_value, tag_type, created_by) 
SELECT 
    id, 
    'system_version', 
    '1.0.0', 
    'system', 
    'migration'
FROM call_recordings 
WHERE NOT EXISTS (
    SELECT 1 FROM recording_tags 
    WHERE recording_id = call_recordings.id 
    AND tag_name = 'system_version'
) LIMIT 0; -- This will not insert anything but creates the structure

-- Comments for documentation
COMMENT ON TABLE call_recordings IS 'Stores metadata and information about call recordings';
COMMENT ON TABLE recording_access_logs IS 'Logs all access to call recordings for audit purposes';
COMMENT ON TABLE recording_tags IS 'Flexible tagging system for categorizing recordings';

COMMENT ON COLUMN call_recordings.call_uuid IS 'FreeSWITCH call UUID for correlation';
COMMENT ON COLUMN call_recordings.file_path IS 'Full path to the recording file';
COMMENT ON COLUMN call_recordings.recording_status IS 'Current status of the recording process';
COMMENT ON COLUMN call_recordings.is_archived IS 'Whether the recording has been archived for long-term storage';
