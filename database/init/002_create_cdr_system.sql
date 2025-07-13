-- Migration: Create comprehensive CDR (Call Detail Records) system
-- Description: Complete call lifecycle tracking with business intelligence capabilities

-- Main CDR Table
CREATE TABLE IF NOT EXISTS call_detail_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Call Identification
    call_uuid VARCHAR(255) NOT NULL UNIQUE,
    call_session_id VARCHAR(255),
    parent_call_uuid VARCHAR(255), -- For transferred calls
    
    -- Call Participants
    caller_id_number VARCHAR(50) NOT NULL,
    caller_id_name VARCHAR(100),
    destination_number VARCHAR(50) NOT NULL,
    destination_name VARCHAR(100),
    
    -- Call Direction & Context
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal', 'transfer')),
    is_billing_leg BOOLEAN DEFAULT FALSE, -- B-leg billing flag for agent billing
    context VARCHAR(50) DEFAULT 'default',
    domain_name VARCHAR(100),
    
    -- Call Timestamps (all in UTC)
    call_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    call_ringing_at TIMESTAMP WITH TIME ZONE,
    call_answered_at TIMESTAMP WITH TIME ZONE,
    call_bridged_at TIMESTAMP WITH TIME ZONE,
    call_ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Call Duration (in seconds)
    ring_duration INTEGER DEFAULT 0,
    talk_duration INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    billable_duration INTEGER DEFAULT 0,
    
    -- Call Status & Results
    call_status VARCHAR(20) DEFAULT 'completed' CHECK (call_status IN ('ringing', 'answered', 'completed', 'failed', 'abandoned')),
    hangup_cause VARCHAR(50),
    hangup_disposition VARCHAR(50),
    answer_disposition VARCHAR(50),
    
    -- Network & Technical Info
    caller_ip_address INET,
    callee_ip_address INET,
    sip_user_agent TEXT,
    codec_used VARCHAR(20),
    
    -- Routing Information
    gateway_used VARCHAR(100),
    route_used VARCHAR(100),
    trunk_used VARCHAR(100),
    
    -- Quality Metrics
    audio_quality_score DECIMAL(5,2), -- 0.00 to 999.99
    packet_loss_percent DECIMAL(5,2),
    jitter_ms DECIMAL(8,2),
    latency_ms DECIMAL(8,2),
    
    -- Business Information (billing details will be in separate billing tables)
    billing_account VARCHAR(100),
    
    -- Call Features Used
    recording_enabled BOOLEAN DEFAULT false,
    recording_file_path VARCHAR(500),
    transfer_occurred BOOLEAN DEFAULT false,
    conference_used BOOLEAN DEFAULT false,
    voicemail_used BOOLEAN DEFAULT false,
    
    -- Custom Fields
    custom_field_1 VARCHAR(255),
    custom_field_2 VARCHAR(255),
    custom_field_3 VARCHAR(255),
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_duration CHECK (total_duration >= 0)
);

-- Call Events Table (for detailed call flow tracking)
CREATE TABLE IF NOT EXISTS call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cdr_id UUID NOT NULL REFERENCES call_detail_records(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    event_subtype VARCHAR(50),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Event Details
    event_data JSONB,
    event_source VARCHAR(50) DEFAULT 'freeswitch',
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Call Participants Table (for multi-party calls)
CREATE TABLE IF NOT EXISTS call_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cdr_id UUID NOT NULL REFERENCES call_detail_records(id) ON DELETE CASCADE,
    
    -- Participant Info
    participant_number VARCHAR(50) NOT NULL,
    participant_name VARCHAR(100),
    participant_type VARCHAR(20) CHECK (participant_type IN ('caller', 'callee', 'transfer_target', 'conference_member')),
    
    -- Participation Timeline
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    
    -- Technical Info
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_cdr_call_uuid ON call_detail_records(call_uuid);
CREATE INDEX IF NOT EXISTS idx_cdr_caller_number ON call_detail_records(caller_id_number);
CREATE INDEX IF NOT EXISTS idx_cdr_destination_number ON call_detail_records(destination_number);
CREATE INDEX IF NOT EXISTS idx_cdr_created_at ON call_detail_records(call_created_at);
CREATE INDEX IF NOT EXISTS idx_cdr_answered_at ON call_detail_records(call_answered_at);
CREATE INDEX IF NOT EXISTS idx_cdr_ended_at ON call_detail_records(call_ended_at);
CREATE INDEX IF NOT EXISTS idx_cdr_direction ON call_detail_records(direction);
CREATE INDEX IF NOT EXISTS idx_cdr_billing_leg ON call_detail_records(is_billing_leg);
CREATE INDEX IF NOT EXISTS idx_cdr_billing_leg_date ON call_detail_records(is_billing_leg, call_created_at);
CREATE INDEX IF NOT EXISTS idx_cdr_billing_agent ON call_detail_records(is_billing_leg, destination_number, call_created_at);
CREATE INDEX IF NOT EXISTS idx_cdr_status ON call_detail_records(call_status);
CREATE INDEX IF NOT EXISTS idx_cdr_hangup_cause ON call_detail_records(hangup_cause);
CREATE INDEX IF NOT EXISTS idx_cdr_domain ON call_detail_records(domain_name);


-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cdr_caller_date ON call_detail_records(caller_id_number, call_created_at);
CREATE INDEX IF NOT EXISTS idx_cdr_destination_date ON call_detail_records(destination_number, call_created_at);
CREATE INDEX IF NOT EXISTS idx_cdr_date_status ON call_detail_records(call_created_at, call_status);

-- Event table indexes
CREATE INDEX IF NOT EXISTS idx_call_events_cdr_id ON call_events(cdr_id);
CREATE INDEX IF NOT EXISTS idx_call_events_type ON call_events(event_type);
CREATE INDEX IF NOT EXISTS idx_call_events_timestamp ON call_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_call_events_processed ON call_events(processed);

-- Participants table indexes
CREATE INDEX IF NOT EXISTS idx_call_participants_cdr_id ON call_participants(cdr_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_number ON call_participants(participant_number);
CREATE INDEX IF NOT EXISTS idx_call_participants_type ON call_participants(participant_type);

-- Create Updated At Trigger
CREATE TRIGGER update_cdr_updated_at 
    BEFORE UPDATE ON call_detail_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Views for Common Queries
CREATE OR REPLACE VIEW v_call_summary AS
SELECT 
    id,
    call_uuid,
    caller_id_number,
    destination_number,
    direction,
    call_created_at,
    call_answered_at,
    call_ended_at,
    total_duration,
    talk_duration,
    call_status,
    hangup_cause,
    recording_enabled,
    CASE
        WHEN call_answered_at IS NOT NULL THEN 'answered'
        WHEN call_status = 'ringing' THEN 'ringing'
        ELSE 'missed'
    END as call_result
FROM call_detail_records
WHERE call_ended_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE call_detail_records IS 'Complete call detail records with business intelligence capabilities';
COMMENT ON TABLE call_events IS 'Detailed call flow events for debugging and analysis';
COMMENT ON TABLE call_participants IS 'Multi-party call participant tracking';

COMMENT ON COLUMN call_detail_records.call_uuid IS 'FreeSWITCH call UUID for correlation';
COMMENT ON COLUMN call_detail_records.billable_duration IS 'Duration used for billing calculations';
COMMENT ON COLUMN call_detail_records.audio_quality_score IS 'Calculated audio quality score (0-5)';
COMMENT ON COLUMN call_detail_records.recording_file_path IS 'Path to associated recording file if any';
