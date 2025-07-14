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
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.audit_logs (id, user_id, session_id, username, action, result, description, resource_type, resource_id, resource_name, domain_id, client_ip, user_agent, request_id, risk_level, risk_score, threat_indicators, policies_evaluated, permissions_checked, roles_involved, metadata, error_message, stack_trace, "timestamp", duration_ms, compliance_tags, retention_until, is_sensitive) FROM stdin;
41ad2d49-812a-4560-97fd-289b0c031d16	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "mq873o2uwxifmgwr0etgi", "userAgent": "curl/8.7.1"}	\N	\N	2025-07-13 21:57:09.507746+00	\N	\N	\N	f
6d5bfb1c-02d0-4c81-b18f-27664ca88b6d	\N	\N	admin	login	failure	Login failed: Invalid password	\N	\N	\N	\N	185.199.108.133	curl/8.7.1	\N	medium	\N	\N	\N	\N	\N	{"reason": "Invalid password", "identifier": "admin"}	\N	\N	2025-07-13 21:57:27.614279+00	\N	\N	\N	f
a23d88b6-6fcd-4520-ab58-0993cfbf8b8b	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "eqmhk4nekai49zgwkfpggx", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 21:58:05.781424+00	\N	\N	\N	f
ff8f6ca6-fa77-4d11-915e-24e55c625991	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "ib8g7o8om7fngq7ephwvpi", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 21:58:08.548373+00	\N	\N	\N	f
4177ddcc-79f2-4e55-8cf3-93a6eca5df97	\N	\N	test@test.com	login	failure	Login failed: User not found	\N	\N	\N	\N	185.199.108.133	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	\N	medium	\N	\N	\N	\N	\N	{"reason": "User not found", "identifier": "test@test.com"}	\N	\N	2025-07-13 22:00:44.389712+00	\N	\N	\N	f
a88a48ee-25ce-46e4-8f78-fb346e4dbfaf	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "vrw17kem79oadkrogs06d7", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 22:00:55.622923+00	\N	\N	\N	f
2282201a-8554-4be5-8412-56955cf640e9	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "4xp6nnrz26w6450fnttvp", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 22:01:03.281423+00	\N	\N	\N	f
ee45384c-9425-4e1b-91b3-df953572ce22	\N	\N	\N	logout	success	User logged out successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{}	\N	\N	2025-07-13 22:22:03.359354+00	\N	\N	\N	f
d8e00f5a-3676-49cf-8e7f-9d07bbcf8712	\N	\N	test@test.com	login	failure	Login failed: User not found	\N	\N	\N	\N	185.199.108.133	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	\N	medium	\N	\N	\N	\N	\N	{"reason": "User not found", "identifier": "test@test.com"}	\N	\N	2025-07-13 22:22:08.986184+00	\N	\N	\N	f
b67708f4-2be9-497c-8859-f49397e7956e	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "lypkipbqpgsalx89j6zpj", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 22:22:11.548548+00	\N	\N	\N	f
e82f3ae5-a00d-46c2-ac92-8b2fd36dc886	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "6df7cjny5prtx5uuxcnh1a", "userAgent": "curl/8.7.1"}	\N	\N	2025-07-13 22:29:16.300225+00	\N	\N	\N	f
740f19a7-3726-4d9b-a6cb-0ee61575970c	\N	\N	test@test.com	login	failure	Login failed: User not found	\N	\N	\N	\N	185.199.108.133	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	\N	medium	\N	\N	\N	\N	\N	{"reason": "User not found", "identifier": "test@test.com"}	\N	\N	2025-07-13 22:29:54.736765+00	\N	\N	\N	f
11c87c53-4192-4fd5-bc3e-21d00acf9ee4	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "v7a35q5iqn65qvrdy9hys", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 22:30:00.2092+00	\N	\N	\N	f
f616033c-f9de-475f-8fbc-eb12785aad25	1	\N	\N	login	success	User logged in successfully	\N	\N	\N	\N	\N	\N	\N	low	\N	\N	\N	\N	\N	{"clientIp": "185.199.108.133", "domainId": "localhost", "username": "admin", "sessionId": "zaxqz4ge3jnr0zuo2yzhmd", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"}	\N	\N	2025-07-13 22:30:07.934907+00	\N	\N	\N	f
\.


--
-- Data for Name: call_detail_records; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.call_detail_records (id, call_uuid, call_session_id, parent_call_uuid, caller_id_number, caller_id_name, destination_number, destination_name, direction, is_billing_leg, context, domain_name, call_created_at, call_ringing_at, call_answered_at, call_bridged_at, call_ended_at, ring_duration, talk_duration, total_duration, billable_duration, call_status, hangup_cause, hangup_disposition, answer_disposition, caller_ip_address, callee_ip_address, sip_user_agent, codec_used, gateway_used, route_used, trunk_used, audio_quality_score, packet_loss_percent, jitter_ms, latency_ms, billing_account, recording_enabled, recording_file_path, transfer_occurred, conference_used, voicemail_used, custom_field_1, custom_field_2, custom_field_3, created_at, updated_at, processed_at) FROM stdin;
d198131a-0f63-4af2-a79f-16389d7f995a	bf25c690-0ec8-4f3f-875f-abf69769b873	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 12:08:51.455+00	\N	2025-07-13 12:08:53.013+00	\N	2025-07-13 12:09:17.733+00	1	24	26	24	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	20.03	20.02	\N	t	20250713-120851_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 12:08:51.461169+00	2025-07-13 12:09:17.748391+00	2025-07-13 12:09:17.745+00
ef4e2da6-109f-4e00-82cf-c563cdd4b521	a80f6036-b339-4fa1-ac14-2d107b810b58	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 05:14:30.35+00	\N	2025-07-13 05:14:33.469+00	\N	2025-07-13 05:14:53.051+00	3	19	22	19	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.48	\N	32.00	20.48	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:14:30.386108+00	2025-07-13 05:14:53.0873+00	2025-07-13 05:14:53.084+00
9934aca7-5cf5-45fe-8d0e-8f6e4f2dacac	f259483b-9f6e-4e55-bfd9-92d77ca5c230	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 05:14:30.294+00	\N	2025-07-13 05:14:33.494+00	\N	2025-07-13 05:14:53.07+00	3	19	22	19	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	8.00	20.01	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:14:30.356009+00	2025-07-13 05:14:53.105516+00	2025-07-13 05:14:53.103+00
ee0fdb31-a1e2-43c2-baac-95e6ca4d0e76	94e37cbb-0796-4399-9dae-5c1dfc15bfa9	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 05:25:06.093+00	\N	2025-07-13 05:25:10.492+00	\N	2025-07-13 05:25:16.71+00	4	6	10	6	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.36	\N	0.20	20.43	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:25:06.159296+00	2025-07-13 05:25:16.732089+00	2025-07-13 05:25:16.726+00
37477546-f745-404d-8846-9be6cba6c386	2289a269-3b01-4040-9a12-bd75b80e97e6	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 05:25:06.093+00	\N	2025-07-13 05:25:10.492+00	\N	2025-07-13 05:25:16.71+00	4	6	10	6	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	4.92	\N	0.42	20.01	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:25:06.120632+00	2025-07-13 05:25:16.732516+00	2025-07-13 05:25:16.729+00
b8e8dd7b-2d26-4d67-8233-a169f45921d5	d4a2f14f-0a2d-441b-990d-27285b06fdab	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 05:49:52.272+00	\N	\N	\N	2025-07-13 05:50:22.053+00	0	0	29	0	completed	NO_ANSWER	\N	\N	185.199.108.133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:49:52.317201+00	2025-07-13 05:50:22.105398+00	2025-07-13 05:50:22.101+00
4008aed6-3217-4ea3-a7bc-707cdfed67f5	086815a3-4ed6-461d-82d2-226a6507426c	\N	\N	1001	\N	voicemail	\N	outbound	f	default	\N	2025-07-13 05:50:23.072+00	\N	\N	\N	2025-07-13 05:50:23.452+00	0	0	0	0	completed	NORMAL_CLEARING	\N	\N	185.199.108.133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:50:23.098038+00	2025-07-13 05:50:23.481065+00	2025-07-13 05:50:23.477+00
aebad4c4-d30a-44ed-9624-ef8fa2803087	d945fdcc-5ddb-46aa-8662-25c5f48f31db	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 05:49:52.252+00	\N	2025-07-13 05:50:22.072+00	\N	2025-07-13 05:50:23.476+00	29	1	31	1	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	107.85	21.03	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:49:52.276836+00	2025-07-13 05:50:23.510455+00	2025-07-13 05:50:23.505+00
23c12445-e82c-4a78-82e4-cefb2102d61b	6ae7cacb-dbe9-47a5-a4f7-ea3c89c63569	\N	\N	1001	\N	voicemail	\N	outbound	f	default	\N	2025-07-13 05:50:23.072+00	\N	\N	\N	2025-07-13 05:50:23.476+00	0	0	0	0	completed	NORMAL_CLEARING	\N	\N	185.199.108.133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:50:23.097934+00	2025-07-13 05:50:23.511375+00	2025-07-13 05:50:23.507+00
71faa6af-c43d-423a-9959-fb7e3ce47db6	85254a8e-720c-4ee7-8ddb-38d2e8da6a23	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 05:51:12.993+00	\N	2025-07-13 05:51:17.256+00	\N	2025-07-13 05:51:27.095+00	4	9	14	9	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	4.50	20.25	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:51:13.034563+00	2025-07-13 05:51:27.138744+00	2025-07-13 05:51:27.134+00
d789d214-6228-4ee0-b3d5-31c73f19b6eb	6727802d-7041-421f-9543-d96cb422d9fc	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 05:51:12.993+00	\N	2025-07-13 05:51:17.292+00	\N	2025-07-13 05:51:27.095+00	4	9	14	9	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	3.00	19.99	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 05:51:13.007039+00	2025-07-13 05:51:27.139902+00	2025-07-13 05:51:27.136+00
87d3b53d-24de-4bdf-a074-fe758ec4c630	10b8ad4c-4b2c-43bc-8e48-cbf3e060f658	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 08:55:36.933+00	\N	2025-07-13 08:55:39.076+00	\N	2025-07-13 08:57:37.177+00	2	118	120	118	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	0.25	19.99	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:04:32.30746+00	2025-07-13 11:06:32.571354+00	2025-07-13 11:06:32.566+00
510bcab9-5d51-445d-ba08-459cf4198523	e4710b25-5b75-4250-8b4c-1a9dd05b7f40	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 08:55:36.953+00	\N	2025-07-13 08:55:39.076+00	\N	2025-07-13 08:57:37.177+00	2	118	120	118	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	0.33	20.13	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:04:32.320854+00	2025-07-13 11:06:32.572278+00	2025-07-13 11:06:32.568+00
5f13b4bd-8670-4d63-b965-f5e3c8420aab	a7af0d3b-10bd-40e0-ac48-a57eb3d70e40	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:29:43.973+00	\N	2025-07-13 11:29:46.474+00	\N	2025-07-13 11:29:56.534+00	2	10	12	10	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.80	\N	244.40	20.10	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:29:44.01292+00	2025-07-13 11:29:56.565385+00	2025-07-13 11:29:56.562+00
0a0abbf3-7db7-4e85-9e6e-54c06fe397f5	afcefe82-6ada-46d8-ad51-bf07a2e5aee0	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:29:43.953+00	\N	2025-07-13 11:29:46.474+00	\N	2025-07-13 11:29:56.534+00	2	10	12	10	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	40.13	20.06	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:29:43.990291+00	2025-07-13 11:29:56.581721+00	2025-07-13 11:29:56.579+00
7aa24b34-81ae-4243-8467-997afce8ab01	03570beb-66b6-40df-82a5-1ab2e2052e31	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:32:34.979+00	\N	2025-07-13 11:32:36.736+00	\N	2025-07-13 11:32:49.3+00	1	12	14	12	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.92	\N	104.04	20.07	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:32:35.031855+00	2025-07-13 11:32:49.375927+00	2025-07-13 11:32:49.373+00
91c120d9-d1e3-4f3c-a824-3225c358ce9d	0b9becf6-b47f-47cd-a588-d36df4aa8b5c	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:32:34.936+00	\N	2025-07-13 11:32:36.756+00	\N	2025-07-13 11:32:49.337+00	1	12	14	12	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	153.51	20.09	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:32:35.000679+00	2025-07-13 11:32:49.376359+00	2025-07-13 11:32:49.374+00
320ca184-32d3-48d4-a687-926268ccae4a	92de9707-9a1c-4520-8077-4578b95f2053	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:35:34.363+00	\N	2025-07-13 11:35:35.943+00	\N	2025-07-13 11:35:45.241+00	1	9	10	9	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.96	\N	0.50	20.10	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:35:34.413929+00	2025-07-13 11:35:45.295179+00	2025-07-13 11:35:45.289+00
06dfddd4-5d0a-4c29-bff7-f2c193c5c518	b4975436-e743-4504-8c0b-4130c63d4f33	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:35:34.323+00	\N	2025-07-13 11:35:35.943+00	\N	2025-07-13 11:35:45.241+00	1	9	10	9	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	0.06	19.97	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:35:34.381986+00	2025-07-13 11:35:45.295697+00	2025-07-13 11:35:45.292+00
8b536f66-207c-4f55-85fe-77b92ff0ce61	3d2fc6cf-07cf-4ae4-93cc-d136a3e10860	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:37:45.493+00	\N	\N	\N	2025-07-13 11:37:52.133+00	0	0	6	0	completed	ORIGINATOR_CANCEL	\N	\N	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:37:45.54417+00	2025-07-13 11:37:52.164749+00	2025-07-13 11:37:52.16+00
582ac511-2b3b-46e6-9691-3c05616d980f	d61bc407-c5f6-43d3-a9c6-51388c60232d	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:37:45.513+00	\N	\N	\N	2025-07-13 11:37:52.133+00	0	0	6	0	completed	ORIGINATOR_CANCEL	\N	\N	185.199.108.133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:37:45.571138+00	2025-07-13 11:37:52.166669+00	2025-07-13 11:37:52.162+00
39871220-2c4e-4817-8322-73be6a77bb18	e4780ea0-b791-4eaf-a323-ae49b8d200cc	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:37:55.333+00	\N	\N	\N	2025-07-13 11:38:07.433+00	0	0	12	0	completed	ORIGINATOR_CANCEL	\N	\N	185.199.108.133	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:37:55.366642+00	2025-07-13 11:38:07.474523+00	2025-07-13 11:38:07.471+00
cd8e1310-d146-4387-b643-55a1aa49b2f9	3f3bf4a3-4733-4612-9706-ff1406fa01b7	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:37:55.313+00	\N	\N	\N	2025-07-13 11:38:07.433+00	0	0	12	0	completed	ORIGINATOR_CANCEL	\N	\N	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:37:55.345743+00	2025-07-13 11:38:07.474939+00	2025-07-13 11:38:07.473+00
c833cb92-e655-40d9-ad6a-c125303849b3	cbb115b6-dbe1-4444-a021-dd821ecb2a88	\N	\N	1002	\N	1001	\N	internal	t	default	\N	2025-07-13 11:41:11.393+00	\N	2025-07-13 11:41:14.993+00	\N	2025-07-13 11:41:20.693+00	3	5	9	5	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	5.00	\N	0.20	20.00	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:41:11.435128+00	2025-07-13 11:41:20.736426+00	2025-07-13 11:41:20.733+00
726980fb-7a65-40eb-973d-6bb3fe3fd83a	7d85ef89-ac21-4545-b565-5baed4a48511	\N	\N	1002	\N	1001	\N	internal	f	default	localhost	2025-07-13 11:41:11.393+00	\N	2025-07-13 11:41:15.013+00	\N	2025-07-13 11:41:20.693+00	3	5	9	5	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Zoiper v2.10.20.6	\N	\N	\N	\N	4.96	\N	0.13	20.10	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:41:11.421255+00	2025-07-13 11:41:20.737127+00	2025-07-13 11:41:20.734+00
44feaca3-f8fd-4ede-8c0d-f81f212d87e2	71a2542a-4022-47dc-a53b-d7ec07a8d19a	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:46:25.913+00	\N	2025-07-13 11:46:27.153+00	\N	2025-07-13 11:46:34.634+00	1	7	8	7	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	14.93	20.13	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:46:25.978902+00	2025-07-13 11:46:34.673536+00	2025-07-13 11:46:34.671+00
035c3831-443a-4ab8-8dd7-f700d45e6bf8	8d6ce40d-c852-4f4d-b9c7-1ccfe4ee429f	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:46:25.876+00	\N	2025-07-13 11:46:27.173+00	\N	2025-07-13 11:46:34.634+00	1	7	8	7	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	0.30	20.00	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:46:25.94474+00	2025-07-13 11:46:34.691543+00	2025-07-13 11:46:34.689+00
5c7c2471-8047-43e1-9845-b98691c19b04	90b98d3a-49c5-4ab1-8a2c-f734e5ea75d5	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:49:06.713+00	\N	2025-07-13 11:49:09.253+00	\N	2025-07-13 11:49:17.393+00	2	8	10	8	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	76.26	20.23	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:49:06.803239+00	2025-07-13 11:49:17.445729+00	2025-07-13 11:49:17.441+00
436a0ac7-f364-410b-9052-c006fd37c0c5	d549b18e-d08c-4920-be0b-bc905126c41c	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:49:06.693+00	\N	2025-07-13 11:49:09.253+00	\N	2025-07-13 11:49:17.393+00	2	8	10	8	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	0.06	20.00	\N	f	\N	f	f	f	\N	\N	\N	2025-07-13 11:49:06.749668+00	2025-07-13 11:49:17.446326+00	2025-07-13 11:49:17.443+00
4d97fade-92cb-4646-97ff-e72d07887bda	301745c4-9361-4e7b-a674-c3b38d69cecd	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:55:10.833+00	\N	2025-07-13 11:55:12.333+00	\N	2025-07-13 11:55:20.073+00	1	7	9	7	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	89.64	20.13	\N	t	20250713-115510_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 11:55:10.885885+00	2025-07-13 11:55:20.084368+00	2025-07-13 11:55:20.08+00
bd5c2a40-6453-43f1-83ab-b9475725a85b	7544108a-2c85-47b4-b66c-2dc4044d2635	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 11:57:25.093+00	\N	2025-07-13 11:57:26.573+00	\N	2025-07-13 11:57:32.533+00	1	5	7	5	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	162.71	20.00	\N	t	20250713-115725_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 11:57:25.113107+00	2025-07-13 11:57:32.545199+00	2025-07-13 11:57:32.542+00
935cca90-516e-4b04-b7b1-a782685f7cac	5343fcce-43e8-4bd8-8a83-10296f62cde0	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 12:08:51.473+00	\N	2025-07-13 12:08:53.013+00	\N	2025-07-13 12:09:17.733+00	1	24	26	24	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	66.96	20.14	\N	t	20250713-120851_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 12:08:51.494485+00	2025-07-13 12:09:17.72091+00	2025-07-13 12:09:17.718+00
3bab9962-08cf-4d9a-bafe-044636bcc2f0	08b0c3d5-7e90-4e70-959b-069b1e32f32d	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 22:21:14.042+00	\N	2025-07-13 22:21:16.165+00	\N	2025-07-13 22:21:26.643+00	2	10	12	10	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.92	\N	1.08	20.12	\N	t	20250713-222114_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 22:37:50.351294+00	2025-07-13 22:38:02.967503+00	2025-07-13 22:38:02.964+00
6f7911b0-4c88-4abe-bb8d-158b83f68161	65118f76-01e2-4027-9a87-df40b97efbef	\N	\N	1001	\N	1002	\N	internal	t	default	\N	2025-07-13 22:59:42.21+00	\N	2025-07-13 22:59:49.789+00	\N	2025-07-13 23:00:00.89+00	7	11	18	11	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	\N	\N	\N	\N	\N	4.88	\N	3.00	20.17	\N	t	20250713-225942_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 22:59:42.253418+00	2025-07-13 23:00:00.933468+00	2025-07-13 23:00:00.928+00
e8f5ad69-975b-476a-afa8-437c7653625a	3d42bd4b-c5ed-429b-a058-1376632a9e0f	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:55:10.833+00	\N	2025-07-13 11:55:12.353+00	\N	2025-07-13 11:55:20.073+00	1	7	9	7	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	0.11	19.95	\N	t	20250713-115510_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 11:55:10.85345+00	2025-07-13 11:55:20.084946+00	2025-07-13 11:55:20.081+00
3d013563-ec65-44ee-ab75-e83bbc3c54b1	320f02e3-6386-4b67-9b22-5feaae9d354e	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 22:21:14.006+00	\N	2025-07-13 22:21:16.165+00	\N	2025-07-13 22:21:26.662+00	2	10	12	10	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	5.33	19.96	\N	t	20250713-222114_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 22:37:50.321979+00	2025-07-13 22:38:02.98191+00	2025-07-13 22:38:02.979+00
4a7438e9-80ff-4ed7-ac6b-c5018aeba4c6	e79bbcf9-7a3f-49f3-9968-018ef662fff1	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 11:57:25.073+00	\N	2025-07-13 11:57:26.573+00	\N	2025-07-13 11:57:32.533+00	1	5	7	5	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	0.25	20.00	\N	t	20250713-115725_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 11:57:25.094527+00	2025-07-13 11:57:32.55929+00	2025-07-13 11:57:32.557+00
36ceb8ba-2d1b-4269-b2c4-ab7dfbf5cba2	d444ff58-2459-49c2-9636-231a760e095f	\N	\N	1001	\N	1002	\N	internal	f	default	localhost	2025-07-13 22:59:42.17+00	\N	2025-07-13 22:59:49.789+00	\N	2025-07-13 23:00:00.89+00	7	11	18	11	completed	NORMAL_CLEARING	\N	answered	185.199.108.133	\N	Z 5.6.9 v2.10.20.8	\N	\N	\N	\N	5.00	\N	4.50	19.90	\N	t	20250713-225942_1001_1002.wav	f	f	f	\N	\N	\N	2025-07-13 22:59:42.232486+00	2025-07-13 23:00:00.93388+00	2025-07-13 23:00:00.931+00
\.


--
-- Data for Name: call_events; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.call_events (id, cdr_id, event_type, event_subtype, event_timestamp, event_data, event_source, processed, created_at) FROM stdin;
\.


--
-- Data for Name: call_participants; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.call_participants (id, cdr_id, participant_number, participant_name, participant_type, joined_at, left_at, duration_seconds, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: call_recordings; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.call_recordings (id, call_uuid, caller_number, callee_number, direction, file_path, file_name, file_size, file_format, duration_seconds, recording_started_at, recording_ended_at, recording_quality, is_stereo, call_started_at, call_answered_at, call_ended_at, hangup_cause, domain_name, context, recording_status, is_archived, is_deleted, created_at, updated_at, created_by) FROM stdin;
\.


--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.domains (id, name, display_name, description, is_active, settings, created_at, updated_at, max_users, max_extensions, billing_plan, cost_center, admin_email, admin_phone, created_by) FROM stdin;
localhost	localhost	Local Development Domain	Default domain for local development	t	{}	2025-07-13 15:07:27.093819+00	2025-07-13 15:07:27.093819+00	1000	1000	enterprise	\N	admin@localhost	\N	\N
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.permissions (id, name, resource, action, description, is_active, created_at, updated_at, category, is_system, conditions, constraints) FROM stdin;
perm-system-manage	system:manage	system	manage	Full system management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	system	t	\N	\N
perm-system-read	system:read	system	read	Read system information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	system	t	\N	\N
perm-domain-manage	domain:manage	domain	manage	Full domain management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	domain	t	\N	\N
perm-domain-read	domain:read	domain	read	Read domain information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	domain	f	\N	\N
perm-domain-create	domain:create	domain	create	Create new domains	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	domain	t	\N	\N
perm-domain-update	domain:update	domain	update	Update domain settings	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	domain	f	\N	\N
perm-domain-delete	domain:delete	domain	delete	Delete domains	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	domain	t	\N	\N
perm-users-manage	users:manage	users	manage	Full user management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	users	f	\N	\N
perm-users-read	users:read	users	read	Read user information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	users	f	\N	\N
perm-users-create	users:create	users	create	Create new users	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	users	f	\N	\N
perm-users-update	users:update	users	update	Update user information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	users	f	\N	\N
perm-users-delete	users:delete	users	delete	Delete users	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	users	f	\N	\N
perm-calls-manage	calls:manage	calls	manage	Full call management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	calls	f	\N	\N
perm-calls-read	calls:read	calls	read	View call information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	calls	f	\N	\N
perm-calls-execute	calls:execute	calls	execute	Make and control calls	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	calls	f	\N	\N
perm-extensions-manage	extensions:manage	extensions	manage	Full extension management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	extensions	f	\N	\N
perm-extensions-read	extensions:read	extensions	read	View extension information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	extensions	f	\N	\N
perm-extensions-create	extensions:create	extensions	create	Create new extensions	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	extensions	f	\N	\N
perm-extensions-update	extensions:update	extensions	update	Update extension settings	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	extensions	f	\N	\N
perm-extensions-delete	extensions:delete	extensions	delete	Delete extensions	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	extensions	f	\N	\N
perm-cdr-manage	cdr:manage	cdr	manage	Full CDR management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	cdr	f	\N	\N
perm-cdr-read	cdr:read	cdr	read	View call detail records	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	cdr	f	\N	\N
perm-cdr-delete	cdr:delete	cdr	delete	Delete call records	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	cdr	f	\N	\N
perm-recordings-manage	recordings:manage	recordings	manage	Full recording management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	recordings	f	\N	\N
perm-recordings-read	recordings:read	recordings	read	Listen to recordings	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	recordings	f	\N	\N
perm-recordings-create	recordings:create	recordings	create	Create recordings	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	recordings	f	\N	\N
perm-recordings-delete	recordings:delete	recordings	delete	Delete recordings	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	recordings	f	\N	\N
perm-config-manage	config:manage	config	manage	Full configuration management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	config	f	\N	\N
perm-config-read	config:read	config	read	View configuration	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	config	f	\N	\N
perm-config-update	config:update	config	update	Update configuration	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	config	f	\N	\N
perm-reports-read	reports:read	reports	read	View reports	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	reports	f	\N	\N
perm-reports-create	reports:create	reports	create	Generate reports	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	reports	f	\N	\N
perm-security-manage	security:manage	security	manage	Full security management	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	security	t	\N	\N
perm-security-read	security:read	security	read	View security information	t	2025-07-13 21:36:58.932997+00	2025-07-13 21:36:58.932997+00	security	f	\N	\N
\.


--
-- Data for Name: policies; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.policies (id, name, description, type, status, priority, conditions, effect, domain_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recording_access_logs; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.recording_access_logs (id, recording_id, accessed_by, access_type, access_method, ip_address, user_agent, accessed_at) FROM stdin;
\.


--
-- Data for Name: recording_tags; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.recording_tags (id, recording_id, tag_name, tag_value, tag_type, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.role_permissions (id, role_id, permission_id, is_active, granted_at, granted_by) FROM stdin;
39	role-superadmin	perm-system-manage	t	2025-07-13 21:36:58.936417	\N
40	role-superadmin	perm-system-read	t	2025-07-13 21:36:58.936417	\N
41	role-superadmin	perm-domain-manage	t	2025-07-13 21:36:58.936417	\N
42	role-superadmin	perm-domain-read	t	2025-07-13 21:36:58.936417	\N
43	role-superadmin	perm-domain-create	t	2025-07-13 21:36:58.936417	\N
44	role-superadmin	perm-domain-update	t	2025-07-13 21:36:58.936417	\N
45	role-superadmin	perm-domain-delete	t	2025-07-13 21:36:58.936417	\N
46	role-superadmin	perm-users-manage	t	2025-07-13 21:36:58.936417	\N
47	role-superadmin	perm-users-read	t	2025-07-13 21:36:58.936417	\N
48	role-superadmin	perm-users-create	t	2025-07-13 21:36:58.936417	\N
49	role-superadmin	perm-users-update	t	2025-07-13 21:36:58.936417	\N
50	role-superadmin	perm-users-delete	t	2025-07-13 21:36:58.936417	\N
51	role-superadmin	perm-calls-manage	t	2025-07-13 21:36:58.936417	\N
52	role-superadmin	perm-calls-read	t	2025-07-13 21:36:58.936417	\N
53	role-superadmin	perm-calls-execute	t	2025-07-13 21:36:58.936417	\N
54	role-superadmin	perm-extensions-manage	t	2025-07-13 21:36:58.936417	\N
55	role-superadmin	perm-extensions-read	t	2025-07-13 21:36:58.936417	\N
56	role-superadmin	perm-extensions-create	t	2025-07-13 21:36:58.936417	\N
57	role-superadmin	perm-extensions-update	t	2025-07-13 21:36:58.936417	\N
58	role-superadmin	perm-extensions-delete	t	2025-07-13 21:36:58.936417	\N
59	role-superadmin	perm-cdr-manage	t	2025-07-13 21:36:58.936417	\N
60	role-superadmin	perm-cdr-read	t	2025-07-13 21:36:58.936417	\N
61	role-superadmin	perm-cdr-delete	t	2025-07-13 21:36:58.936417	\N
62	role-superadmin	perm-recordings-manage	t	2025-07-13 21:36:58.936417	\N
63	role-superadmin	perm-recordings-read	t	2025-07-13 21:36:58.936417	\N
64	role-superadmin	perm-recordings-create	t	2025-07-13 21:36:58.936417	\N
65	role-superadmin	perm-recordings-delete	t	2025-07-13 21:36:58.936417	\N
66	role-superadmin	perm-config-manage	t	2025-07-13 21:36:58.936417	\N
67	role-superadmin	perm-config-read	t	2025-07-13 21:36:58.936417	\N
68	role-superadmin	perm-config-update	t	2025-07-13 21:36:58.936417	\N
69	role-superadmin	perm-reports-read	t	2025-07-13 21:36:58.936417	\N
70	role-superadmin	perm-reports-create	t	2025-07-13 21:36:58.936417	\N
71	role-superadmin	perm-security-manage	t	2025-07-13 21:36:58.936417	\N
72	role-superadmin	perm-security-read	t	2025-07-13 21:36:58.936417	\N
73	role-system-admin	perm-system-read	t	2025-07-13 21:36:58.936417	\N
74	role-system-admin	perm-domain-manage	t	2025-07-13 21:36:58.936417	\N
75	role-system-admin	perm-users-manage	t	2025-07-13 21:36:58.936417	\N
76	role-system-admin	perm-config-manage	t	2025-07-13 21:36:58.936417	\N
77	role-system-admin	perm-security-manage	t	2025-07-13 21:36:58.936417	\N
78	role-system-admin	perm-reports-read	t	2025-07-13 21:36:58.936417	\N
79	role-system-admin	perm-reports-create	t	2025-07-13 21:36:58.936417	\N
80	role-domain-admin	perm-domain-read	t	2025-07-13 21:36:58.936417	\N
81	role-domain-admin	perm-domain-update	t	2025-07-13 21:36:58.936417	\N
82	role-domain-admin	perm-users-manage	t	2025-07-13 21:36:58.936417	\N
83	role-domain-admin	perm-calls-manage	t	2025-07-13 21:36:58.936417	\N
84	role-domain-admin	perm-extensions-manage	t	2025-07-13 21:36:58.936417	\N
85	role-domain-admin	perm-cdr-manage	t	2025-07-13 21:36:58.936417	\N
86	role-domain-admin	perm-recordings-manage	t	2025-07-13 21:36:58.936417	\N
87	role-domain-admin	perm-config-read	t	2025-07-13 21:36:58.936417	\N
88	role-domain-admin	perm-config-update	t	2025-07-13 21:36:58.936417	\N
89	role-domain-admin	perm-reports-read	t	2025-07-13 21:36:58.936417	\N
90	role-domain-admin	perm-reports-create	t	2025-07-13 21:36:58.936417	\N
91	role-domain-admin	perm-security-read	t	2025-07-13 21:36:58.936417	\N
92	role-manager	perm-users-read	t	2025-07-13 21:36:58.936417	\N
93	role-manager	perm-users-create	t	2025-07-13 21:36:58.936417	\N
94	role-manager	perm-users-update	t	2025-07-13 21:36:58.936417	\N
95	role-manager	perm-calls-manage	t	2025-07-13 21:36:58.936417	\N
96	role-manager	perm-extensions-read	t	2025-07-13 21:36:58.936417	\N
97	role-manager	perm-extensions-create	t	2025-07-13 21:36:58.936417	\N
98	role-manager	perm-extensions-update	t	2025-07-13 21:36:58.936417	\N
99	role-manager	perm-cdr-read	t	2025-07-13 21:36:58.936417	\N
100	role-manager	perm-recordings-read	t	2025-07-13 21:36:58.936417	\N
101	role-manager	perm-reports-read	t	2025-07-13 21:36:58.936417	\N
102	role-supervisor	perm-users-read	t	2025-07-13 21:36:58.936417	\N
103	role-supervisor	perm-calls-read	t	2025-07-13 21:36:58.936417	\N
104	role-supervisor	perm-calls-execute	t	2025-07-13 21:36:58.936417	\N
105	role-supervisor	perm-extensions-read	t	2025-07-13 21:36:58.936417	\N
106	role-supervisor	perm-cdr-read	t	2025-07-13 21:36:58.936417	\N
107	role-supervisor	perm-recordings-read	t	2025-07-13 21:36:58.936417	\N
108	role-supervisor	perm-reports-read	t	2025-07-13 21:36:58.936417	\N
109	role-agent	perm-calls-read	t	2025-07-13 21:36:58.936417	\N
110	role-agent	perm-calls-execute	t	2025-07-13 21:36:58.936417	\N
111	role-agent	perm-extensions-read	t	2025-07-13 21:36:58.936417	\N
112	role-agent	perm-cdr-read	t	2025-07-13 21:36:58.936417	\N
113	role-agent	perm-recordings-read	t	2025-07-13 21:36:58.936417	\N
114	role-user	perm-calls-read	t	2025-07-13 21:36:58.936417	\N
115	role-user	perm-extensions-read	t	2025-07-13 21:36:58.936417	\N
116	role-user	perm-cdr-read	t	2025-07-13 21:36:58.936417	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.roles (id, name, display_name, description, type, level, is_active, domain_id, parent_role_id, created_at, updated_at, is_system, is_default, settings, constraints, created_by) FROM stdin;
role-superadmin	superadmin	Super Administrator	Super Administrator - Full system access	global	0	t	\N	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	t	f	{}	{}	\N
role-system-admin	system_admin	System Administrator	System Administrator - System management	global	10	t	\N	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	t	f	{}	{}	\N
role-domain-admin	domain_admin	Domain Administrator	Domain Administrator - Full domain access	domain	20	t	localhost	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	f	f	{}	{}	\N
role-manager	manager	Manager	Manager - Department management	domain	30	t	localhost	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	f	f	{}	{}	\N
role-supervisor	supervisor	Supervisor	Supervisor - Team supervision	domain	50	t	localhost	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	f	f	{}	{}	\N
role-agent	agent	Agent	Agent - Call handling	domain	70	t	localhost	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	f	t	{}	{}	\N
role-user	user	User	User - Basic access	domain	80	t	localhost	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	f	f	{}	{}	\N
\.


--
-- Data for Name: user_attributes; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.user_attributes (id, user_id, attribute_name, attribute_value, category, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.user_roles (id, user_id, role_id, is_active, is_primary, expires_at, granted_at, granted_by, grant_reason, constraints, context, created_at, updated_at, revoked_at, revoked_by, revoke_reason) FROM stdin;
4	1	role-superadmin	t	t	\N	2025-07-13 21:36:58.936417+00	system	Initial setup	\N	\N	2025-07-13 21:36:58.936417+00	2025-07-13 21:36:58.936417+00	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: pbx_user
--

COPY public.users (id, username, email, created_at, updated_at, domain_id, first_name, last_name, display_name, extension, department_id, team_id, manager_id, is_active, last_login, password_hash) FROM stdin;
2	manager	manager@localhost	2025-07-13 15:07:44.085781	2025-07-13 15:07:44.085781	localhost	John	Manager	John Manager	\N	\N	\N	\N	t	\N	$2b$10$K7L/8Y3TAFHy.E4PdNn8aeUi.aZc0.cswxg6RGAGiYMu2Wt.Oq9S2
3	agent	agent@localhost	2025-07-13 15:07:44.085781	2025-07-13 15:07:44.085781	localhost	Bob	Agent	Bob Agent	\N	\N	\N	\N	t	\N	$2b$10$K7L/8Y3TAFHy.E4PdNn8aeUi.aZc0.cswxg6RGAGiYMu2Wt.Oq9S2
1	admin	admin@localhost	2025-07-13 15:07:44.085781	2025-07-13 15:07:44.085781	localhost	System	Administrator	System Administrator	\N	\N	\N	\N	t	\N	$2b$10$6RUEQZXBgdXZ7/kfJIOR7eLuV/1apXApNVV930Xv9f5NFABDqnieG
\.


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 116, true);


--
-- Name: user_attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.user_attributes_id_seq', 1, false);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: pbx_user
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


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

