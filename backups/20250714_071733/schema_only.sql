--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: permission_action_enum; Type: TYPE; Schema: public; Owner: pbx_user
--

CREATE TYPE public.permission_action_enum AS ENUM (
    'read',
    'create',
    'update',
    'delete',
    'execute',
    'manage'
);


ALTER TYPE public.permission_action_enum OWNER TO pbx_user;

--
-- Name: permission_category_enum; Type: TYPE; Schema: public; Owner: pbx_user
--

CREATE TYPE public.permission_category_enum AS ENUM (
    'system',
    'domain',
    'users',
    'calls',
    'extensions',
    'cdr',
    'recordings',
    'billing',
    'reports',
    'analytics',
    'config',
    'security',
    'monitoring'
);


ALTER TYPE public.permission_category_enum OWNER TO pbx_user;

--
-- Name: role_type_enum; Type: TYPE; Schema: public; Owner: pbx_user
--

CREATE TYPE public.role_type_enum AS ENUM (
    'global',
    'domain',
    'department',
    'team'
);


ALTER TYPE public.role_type_enum OWNER TO pbx_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: pbx_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO pbx_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    session_id character varying(255),
    username character varying(100),
    action character varying(50) NOT NULL,
    result character varying(50) NOT NULL,
    description character varying(500),
    resource_type character varying(100),
    resource_id character varying(255),
    resource_name character varying(255),
    domain_id character varying(255),
    client_ip inet,
    user_agent character varying(500),
    request_id character varying(255),
    risk_level character varying(50) DEFAULT 'low'::character varying,
    risk_score numeric(5,2),
    threat_indicators text[],
    policies_evaluated text[],
    permissions_checked text[],
    roles_involved text[],
    metadata jsonb,
    error_message character varying(1000),
    stack_trace text,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    duration_ms integer,
    compliance_tags text[],
    retention_until timestamp with time zone,
    is_sensitive boolean DEFAULT false
);


ALTER TABLE public.audit_logs OWNER TO pbx_user;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit logging for security and compliance';


--
-- Name: COLUMN audit_logs.result; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.audit_logs.result IS 'Result: success, failure, error, warning';


--
-- Name: COLUMN audit_logs.risk_level; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.audit_logs.risk_level IS 'Risk level: low, medium, high, critical';


--
-- Name: COLUMN audit_logs.threat_indicators; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.audit_logs.threat_indicators IS 'Array of security threat indicators';


--
-- Name: COLUMN audit_logs.metadata; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context data in JSON format';


--
-- Name: call_detail_records; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.call_detail_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_uuid character varying(255) NOT NULL,
    call_session_id character varying(255),
    parent_call_uuid character varying(255),
    caller_id_number character varying(50) NOT NULL,
    caller_id_name character varying(100),
    destination_number character varying(50) NOT NULL,
    destination_name character varying(100),
    direction character varying(20) NOT NULL,
    is_billing_leg boolean DEFAULT false,
    context character varying(50) DEFAULT 'default'::character varying,
    domain_name character varying(100),
    call_created_at timestamp with time zone NOT NULL,
    call_ringing_at timestamp with time zone,
    call_answered_at timestamp with time zone,
    call_bridged_at timestamp with time zone,
    call_ended_at timestamp with time zone,
    ring_duration integer DEFAULT 0,
    talk_duration integer DEFAULT 0,
    total_duration integer DEFAULT 0,
    billable_duration integer DEFAULT 0,
    call_status character varying(20) DEFAULT 'completed'::character varying,
    hangup_cause character varying(50),
    hangup_disposition character varying(50),
    answer_disposition character varying(50),
    caller_ip_address inet,
    callee_ip_address inet,
    sip_user_agent text,
    codec_used character varying(20),
    gateway_used character varying(100),
    route_used character varying(100),
    trunk_used character varying(100),
    audio_quality_score numeric(5,2),
    packet_loss_percent numeric(5,2),
    jitter_ms numeric(8,2),
    latency_ms numeric(8,2),
    billing_account character varying(100),
    recording_enabled boolean DEFAULT false,
    recording_file_path character varying(500),
    transfer_occurred boolean DEFAULT false,
    conference_used boolean DEFAULT false,
    voicemail_used boolean DEFAULT false,
    custom_field_1 character varying(255),
    custom_field_2 character varying(255),
    custom_field_3 character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    CONSTRAINT call_detail_records_call_status_check CHECK (((call_status)::text = ANY ((ARRAY['ringing'::character varying, 'answered'::character varying, 'completed'::character varying, 'failed'::character varying, 'abandoned'::character varying])::text[]))),
    CONSTRAINT call_detail_records_direction_check CHECK (((direction)::text = ANY ((ARRAY['inbound'::character varying, 'outbound'::character varying, 'internal'::character varying, 'transfer'::character varying])::text[]))),
    CONSTRAINT valid_duration CHECK ((total_duration >= 0))
);


ALTER TABLE public.call_detail_records OWNER TO pbx_user;

--
-- Name: TABLE call_detail_records; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.call_detail_records IS 'Complete call detail records with business intelligence capabilities';


--
-- Name: COLUMN call_detail_records.call_uuid; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_detail_records.call_uuid IS 'FreeSWITCH call UUID for correlation';


--
-- Name: COLUMN call_detail_records.billable_duration; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_detail_records.billable_duration IS 'Duration used for billing calculations';


--
-- Name: COLUMN call_detail_records.audio_quality_score; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_detail_records.audio_quality_score IS 'Calculated audio quality score (0-5)';


--
-- Name: COLUMN call_detail_records.recording_file_path; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_detail_records.recording_file_path IS 'Path to associated recording file if any';


--
-- Name: call_events; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.call_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cdr_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    event_subtype character varying(50),
    event_timestamp timestamp with time zone NOT NULL,
    event_data jsonb,
    event_source character varying(50) DEFAULT 'freeswitch'::character varying,
    processed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.call_events OWNER TO pbx_user;

--
-- Name: TABLE call_events; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.call_events IS 'Detailed call flow events for debugging and analysis';


--
-- Name: call_participants; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.call_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cdr_id uuid NOT NULL,
    participant_number character varying(50) NOT NULL,
    participant_name character varying(100),
    participant_type character varying(20),
    joined_at timestamp with time zone,
    left_at timestamp with time zone,
    duration_seconds integer DEFAULT 0,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT call_participants_participant_type_check CHECK (((participant_type)::text = ANY ((ARRAY['caller'::character varying, 'callee'::character varying, 'transfer_target'::character varying, 'conference_member'::character varying])::text[])))
);


ALTER TABLE public.call_participants OWNER TO pbx_user;

--
-- Name: TABLE call_participants; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.call_participants IS 'Multi-party call participant tracking';


--
-- Name: call_recordings; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.call_recordings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    call_uuid character varying(255) NOT NULL,
    caller_number character varying(50) NOT NULL,
    callee_number character varying(50) NOT NULL,
    direction character varying(20) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint,
    file_format character varying(10) DEFAULT 'wav'::character varying,
    duration_seconds integer,
    recording_started_at timestamp with time zone,
    recording_ended_at timestamp with time zone,
    recording_quality character varying(20) DEFAULT 'standard'::character varying,
    is_stereo boolean DEFAULT true,
    call_started_at timestamp with time zone NOT NULL,
    call_answered_at timestamp with time zone,
    call_ended_at timestamp with time zone,
    hangup_cause character varying(50),
    domain_name character varying(100),
    context character varying(50) DEFAULT 'default'::character varying,
    recording_status character varying(20) DEFAULT 'completed'::character varying,
    is_archived boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100),
    CONSTRAINT call_recordings_direction_check CHECK (((direction)::text = ANY ((ARRAY['inbound'::character varying, 'outbound'::character varying, 'internal'::character varying])::text[]))),
    CONSTRAINT call_recordings_recording_status_check CHECK (((recording_status)::text = ANY ((ARRAY['recording'::character varying, 'completed'::character varying, 'failed'::character varying, 'processing'::character varying])::text[])))
);


ALTER TABLE public.call_recordings OWNER TO pbx_user;

--
-- Name: TABLE call_recordings; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.call_recordings IS 'Stores metadata and information about call recordings';


--
-- Name: COLUMN call_recordings.call_uuid; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_recordings.call_uuid IS 'FreeSWITCH call UUID for correlation';


--
-- Name: COLUMN call_recordings.file_path; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_recordings.file_path IS 'Full path to the recording file';


--
-- Name: COLUMN call_recordings.recording_status; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_recordings.recording_status IS 'Current status of the recording process';


--
-- Name: COLUMN call_recordings.is_archived; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON COLUMN public.call_recordings.is_archived IS 'Whether the recording has been archived for long-term storage';


--
-- Name: domains; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.domains (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    max_users integer DEFAULT 1000,
    max_extensions integer DEFAULT 1000,
    billing_plan character varying(50) DEFAULT 'basic'::character varying,
    cost_center character varying(100),
    admin_email character varying(255),
    admin_phone character varying(50),
    created_by character varying(255)
);


ALTER TABLE public.domains OWNER TO pbx_user;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.permissions (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    resource character varying(100) NOT NULL,
    action public.permission_action_enum NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category public.permission_category_enum,
    is_system boolean DEFAULT false,
    conditions jsonb,
    constraints jsonb
);


ALTER TABLE public.permissions OWNER TO pbx_user;

--
-- Name: policies; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.policies (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) DEFAULT 'abac'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    priority integer DEFAULT 100,
    conditions jsonb DEFAULT '{}'::jsonb,
    effect character varying(20) DEFAULT 'allow'::character varying,
    domain_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.policies OWNER TO pbx_user;

--
-- Name: recording_access_logs; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.recording_access_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recording_id uuid NOT NULL,
    accessed_by character varying(100) NOT NULL,
    access_type character varying(20) NOT NULL,
    access_method character varying(20) DEFAULT 'web'::character varying,
    ip_address inet,
    user_agent text,
    accessed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recording_access_logs_access_method_check CHECK (((access_method)::text = ANY ((ARRAY['web'::character varying, 'api'::character varying, 'system'::character varying])::text[]))),
    CONSTRAINT recording_access_logs_access_type_check CHECK (((access_type)::text = ANY ((ARRAY['view'::character varying, 'download'::character varying, 'play'::character varying, 'delete'::character varying])::text[])))
);


ALTER TABLE public.recording_access_logs OWNER TO pbx_user;

--
-- Name: TABLE recording_access_logs; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.recording_access_logs IS 'Logs all access to call recordings for audit purposes';


--
-- Name: recording_tags; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.recording_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recording_id uuid NOT NULL,
    tag_name character varying(50) NOT NULL,
    tag_value character varying(100),
    tag_type character varying(20) DEFAULT 'custom'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100),
    CONSTRAINT recording_tags_tag_type_check CHECK (((tag_type)::text = ANY ((ARRAY['system'::character varying, 'custom'::character varying, 'business'::character varying])::text[])))
);


ALTER TABLE public.recording_tags OWNER TO pbx_user;

--
-- Name: TABLE recording_tags; Type: COMMENT; Schema: public; Owner: pbx_user
--

COMMENT ON TABLE public.recording_tags IS 'Flexible tagging system for categorizing recordings';


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id character varying(255) NOT NULL,
    permission_id character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    granted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    granted_by character varying(255)
);


ALTER TABLE public.role_permissions OWNER TO pbx_user;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: pbx_user
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_id_seq OWNER TO pbx_user;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pbx_user
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.roles (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    type public.role_type_enum DEFAULT 'domain'::public.role_type_enum,
    level integer DEFAULT 0,
    is_active boolean DEFAULT true,
    domain_id character varying(255),
    parent_role_id character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_system boolean DEFAULT false,
    is_default boolean DEFAULT false,
    settings jsonb DEFAULT '{}'::jsonb,
    constraints jsonb DEFAULT '{}'::jsonb,
    created_by character varying(255)
);


ALTER TABLE public.roles OWNER TO pbx_user;

--
-- Name: user_attributes; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.user_attributes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    attribute_name character varying(255) NOT NULL,
    attribute_value text,
    category character varying(100) DEFAULT 'general'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_attributes OWNER TO pbx_user;

--
-- Name: user_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: pbx_user
--

CREATE SEQUENCE public.user_attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_attributes_id_seq OWNER TO pbx_user;

--
-- Name: user_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pbx_user
--

ALTER SEQUENCE public.user_attributes_id_seq OWNED BY public.user_attributes.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    role_id character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    is_primary boolean DEFAULT false,
    expires_at timestamp without time zone,
    granted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    granted_by character varying(255),
    grant_reason character varying(255),
    constraints jsonb,
    context jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    revoked_at timestamp with time zone,
    revoked_by character varying(255),
    revoke_reason character varying(255)
);


ALTER TABLE public.user_roles OWNER TO pbx_user;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: pbx_user
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_roles_id_seq OWNER TO pbx_user;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pbx_user
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: pbx_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    domain_id character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    display_name character varying(255),
    extension character varying(50),
    department_id character varying(255),
    team_id character varying(255),
    manager_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    password_hash character varying(255)
);


ALTER TABLE public.users OWNER TO pbx_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: pbx_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO pbx_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: pbx_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_call_summary; Type: VIEW; Schema: public; Owner: pbx_user
--

CREATE VIEW public.v_call_summary AS
 SELECT call_detail_records.id,
    call_detail_records.call_uuid,
    call_detail_records.caller_id_number,
    call_detail_records.destination_number,
    call_detail_records.direction,
    call_detail_records.call_created_at,
    call_detail_records.call_answered_at,
    call_detail_records.call_ended_at,
    call_detail_records.total_duration,
    call_detail_records.talk_duration,
    call_detail_records.call_status,
    call_detail_records.hangup_cause,
    call_detail_records.recording_enabled,
        CASE
            WHEN (call_detail_records.call_answered_at IS NOT NULL) THEN 'answered'::text
            WHEN ((call_detail_records.call_status)::text = 'ringing'::text) THEN 'ringing'::text
            ELSE 'missed'::text
        END AS call_result
   FROM public.call_detail_records
  WHERE (call_detail_records.call_ended_at IS NOT NULL);


ALTER TABLE public.v_call_summary OWNER TO pbx_user;

--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: user_attributes id; Type: DEFAULT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_attributes ALTER COLUMN id SET DEFAULT nextval('public.user_attributes_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: call_detail_records call_detail_records_call_uuid_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_detail_records
    ADD CONSTRAINT call_detail_records_call_uuid_key UNIQUE (call_uuid);


--
-- Name: call_detail_records call_detail_records_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_detail_records
    ADD CONSTRAINT call_detail_records_pkey PRIMARY KEY (id);


--
-- Name: call_events call_events_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_events
    ADD CONSTRAINT call_events_pkey PRIMARY KEY (id);


--
-- Name: call_participants call_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_pkey PRIMARY KEY (id);


--
-- Name: call_recordings call_recordings_call_uuid_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_call_uuid_key UNIQUE (call_uuid);


--
-- Name: call_recordings call_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_pkey PRIMARY KEY (id);


--
-- Name: domains domains_name_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_name_key UNIQUE (name);


--
-- Name: domains domains_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_name_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_key UNIQUE (name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: recording_access_logs recording_access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.recording_access_logs
    ADD CONSTRAINT recording_access_logs_pkey PRIMARY KEY (id);


--
-- Name: recording_tags recording_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.recording_tags
    ADD CONSTRAINT recording_tags_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: call_recordings unique_call_recording; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT unique_call_recording UNIQUE (call_uuid, file_path);


--
-- Name: recording_tags unique_recording_tag; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.recording_tags
    ADD CONSTRAINT unique_recording_tag UNIQUE (recording_id, tag_name);


--
-- Name: user_attributes user_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_attributes
    ADD CONSTRAINT user_attributes_pkey PRIMARY KEY (id);


--
-- Name: user_attributes user_attributes_user_id_attribute_name_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_attributes
    ADD CONSTRAINT user_attributes_user_id_attribute_name_key UNIQUE (user_id, attribute_name);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_access_logs_date; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_access_logs_date ON public.recording_access_logs USING btree (accessed_at);


--
-- Name: idx_access_logs_recording; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_access_logs_recording ON public.recording_access_logs USING btree (recording_id);


--
-- Name: idx_access_logs_user; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_access_logs_user ON public.recording_access_logs USING btree (accessed_by);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_client_ip; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_client_ip ON public.audit_logs USING btree (client_ip);


--
-- Name: idx_audit_logs_domain_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_domain_id ON public.audit_logs USING btree (domain_id);


--
-- Name: idx_audit_logs_failures; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_failures ON public.audit_logs USING btree ("timestamp") WHERE ((result)::text = ANY ((ARRAY['failure'::character varying, 'error'::character varying])::text[]));


--
-- Name: idx_audit_logs_high_risk; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_high_risk ON public.audit_logs USING btree ("timestamp") WHERE ((risk_level)::text = ANY ((ARRAY['high'::character varying, 'critical'::character varying])::text[]));


--
-- Name: idx_audit_logs_resource; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_audit_logs_result; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_result ON public.audit_logs USING btree (result);


--
-- Name: idx_audit_logs_risk_level; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_risk_level ON public.audit_logs USING btree (risk_level);


--
-- Name: idx_audit_logs_session_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_session_id ON public.audit_logs USING btree (session_id);


--
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_call_events_cdr_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_events_cdr_id ON public.call_events USING btree (cdr_id);


--
-- Name: idx_call_events_processed; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_events_processed ON public.call_events USING btree (processed);


--
-- Name: idx_call_events_timestamp; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_events_timestamp ON public.call_events USING btree (event_timestamp);


--
-- Name: idx_call_events_type; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_events_type ON public.call_events USING btree (event_type);


--
-- Name: idx_call_participants_cdr_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_participants_cdr_id ON public.call_participants USING btree (cdr_id);


--
-- Name: idx_call_participants_number; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_participants_number ON public.call_participants USING btree (participant_number);


--
-- Name: idx_call_participants_type; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_participants_type ON public.call_participants USING btree (participant_type);


--
-- Name: idx_call_recordings_call_uuid; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_recordings_call_uuid ON public.call_recordings USING btree (call_uuid);


--
-- Name: idx_call_recordings_callee; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_recordings_callee ON public.call_recordings USING btree (callee_number);


--
-- Name: idx_call_recordings_caller; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_recordings_caller ON public.call_recordings USING btree (caller_number);


--
-- Name: idx_call_recordings_date; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_recordings_date ON public.call_recordings USING btree (call_started_at);


--
-- Name: idx_call_recordings_domain; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_recordings_domain ON public.call_recordings USING btree (domain_name);


--
-- Name: idx_call_recordings_status; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_call_recordings_status ON public.call_recordings USING btree (recording_status);


--
-- Name: idx_cdr_answered_at; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_answered_at ON public.call_detail_records USING btree (call_answered_at);


--
-- Name: idx_cdr_billing_agent; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_billing_agent ON public.call_detail_records USING btree (is_billing_leg, destination_number, call_created_at);


--
-- Name: idx_cdr_billing_leg; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_billing_leg ON public.call_detail_records USING btree (is_billing_leg);


--
-- Name: idx_cdr_billing_leg_date; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_billing_leg_date ON public.call_detail_records USING btree (is_billing_leg, call_created_at);


--
-- Name: idx_cdr_call_uuid; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_call_uuid ON public.call_detail_records USING btree (call_uuid);


--
-- Name: idx_cdr_caller_date; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_caller_date ON public.call_detail_records USING btree (caller_id_number, call_created_at);


--
-- Name: idx_cdr_caller_number; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_caller_number ON public.call_detail_records USING btree (caller_id_number);


--
-- Name: idx_cdr_created_at; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_created_at ON public.call_detail_records USING btree (call_created_at);


--
-- Name: idx_cdr_date_status; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_date_status ON public.call_detail_records USING btree (call_created_at, call_status);


--
-- Name: idx_cdr_destination_date; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_destination_date ON public.call_detail_records USING btree (destination_number, call_created_at);


--
-- Name: idx_cdr_destination_number; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_destination_number ON public.call_detail_records USING btree (destination_number);


--
-- Name: idx_cdr_direction; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_direction ON public.call_detail_records USING btree (direction);


--
-- Name: idx_cdr_domain; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_domain ON public.call_detail_records USING btree (domain_name);


--
-- Name: idx_cdr_ended_at; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_ended_at ON public.call_detail_records USING btree (call_ended_at);


--
-- Name: idx_cdr_hangup_cause; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_hangup_cause ON public.call_detail_records USING btree (hangup_cause);


--
-- Name: idx_cdr_status; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_cdr_status ON public.call_detail_records USING btree (call_status);


--
-- Name: idx_domains_billing_plan; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_domains_billing_plan ON public.domains USING btree (billing_plan);


--
-- Name: idx_domains_created_by; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_domains_created_by ON public.domains USING btree (created_by);


--
-- Name: idx_domains_is_active; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_domains_is_active ON public.domains USING btree (is_active);


--
-- Name: idx_permissions_category; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_permissions_category ON public.permissions USING btree (category);


--
-- Name: idx_permissions_is_active; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_permissions_is_active ON public.permissions USING btree (is_active);


--
-- Name: idx_permissions_is_system; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_permissions_is_system ON public.permissions USING btree (is_system);


--
-- Name: idx_permissions_resource_action; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_permissions_resource_action ON public.permissions USING btree (resource, action);


--
-- Name: idx_policies_domain_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_policies_domain_id ON public.policies USING btree (domain_id);


--
-- Name: idx_policies_status; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_policies_status ON public.policies USING btree (status);


--
-- Name: idx_recording_tags_name; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_recording_tags_name ON public.recording_tags USING btree (tag_name);


--
-- Name: idx_recording_tags_recording; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_recording_tags_recording ON public.recording_tags USING btree (recording_id);


--
-- Name: idx_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);


--
-- Name: idx_role_permissions_role_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id);


--
-- Name: idx_roles_created_by; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_roles_created_by ON public.roles USING btree (created_by);


--
-- Name: idx_roles_domain_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_roles_domain_id ON public.roles USING btree (domain_id);


--
-- Name: idx_roles_is_active; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_roles_is_active ON public.roles USING btree (is_active);


--
-- Name: idx_roles_is_system; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_roles_is_system ON public.roles USING btree (is_system);


--
-- Name: idx_roles_level; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_roles_level ON public.roles USING btree (level);


--
-- Name: idx_roles_type; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_roles_type ON public.roles USING btree (type);


--
-- Name: idx_user_roles_expires_at; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_user_roles_expires_at ON public.user_roles USING btree (expires_at);


--
-- Name: idx_user_roles_granted_at; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_user_roles_granted_at ON public.user_roles USING btree (granted_at);


--
-- Name: idx_user_roles_is_active; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_user_roles_is_active ON public.user_roles USING btree (is_active);


--
-- Name: idx_user_roles_revoked_at; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_user_roles_revoked_at ON public.user_roles USING btree (revoked_at);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_domain_id; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_users_domain_id ON public.users USING btree (domain_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: pbx_user
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: call_recordings update_call_recordings_updated_at; Type: TRIGGER; Schema: public; Owner: pbx_user
--

CREATE TRIGGER update_call_recordings_updated_at BEFORE UPDATE ON public.call_recordings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: call_detail_records update_cdr_updated_at; Type: TRIGGER; Schema: public; Owner: pbx_user
--

CREATE TRIGGER update_cdr_updated_at BEFORE UPDATE ON public.call_detail_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: call_events call_events_cdr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_events
    ADD CONSTRAINT call_events_cdr_id_fkey FOREIGN KEY (cdr_id) REFERENCES public.call_detail_records(id) ON DELETE CASCADE;


--
-- Name: call_participants call_participants_cdr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.call_participants
    ADD CONSTRAINT call_participants_cdr_id_fkey FOREIGN KEY (cdr_id) REFERENCES public.call_detail_records(id) ON DELETE CASCADE;


--
-- Name: users fk_users_domain; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_domain FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE SET NULL;


--
-- Name: users fk_users_manager; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: policies policies_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE SET NULL;


--
-- Name: recording_access_logs recording_access_logs_recording_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.recording_access_logs
    ADD CONSTRAINT recording_access_logs_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.call_recordings(id) ON DELETE CASCADE;


--
-- Name: recording_tags recording_tags_recording_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.recording_tags
    ADD CONSTRAINT recording_tags_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.call_recordings(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: roles roles_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE SET NULL;


--
-- Name: roles roles_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: user_attributes user_attributes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_attributes
    ADD CONSTRAINT user_attributes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pbx_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

