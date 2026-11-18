--
-- PostgreSQL database dump
--

-- Dumped from database version 15.19
-- Dumped by pg_dump version 17.5

-- Started on 2026-11-18 15:32:22 IST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 115434)
-- Name: ipeot; Type: SCHEMA; Schema: -; Owner: digi_user
--

CREATE SCHEMA ipeot;


ALTER SCHEMA ipeot OWNER TO digi_user;

--
-- TOC entry 971 (class 1247 OID 115500)
-- Name: assignment_scope; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.assignment_scope AS ENUM (
    'global',
    'department',
    'work_centre'
);


ALTER TYPE ipeot.assignment_scope OWNER TO digi_user;

--
-- TOC entry 974 (class 1247 OID 115508)
-- Name: awp_status; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.awp_status AS ENUM (
    'draft',
    'open',
    'closed'
);


ALTER TYPE ipeot.awp_status OWNER TO digi_user;

--
-- TOC entry 968 (class 1247 OID 115492)
-- Name: iso_doc_type; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.iso_doc_type AS ENUM (
    'PDS',
    'PAS',
    'PCR'
);


ALTER TYPE ipeot.iso_doc_type OWNER TO digi_user;

--
-- TOC entry 956 (class 1247 OID 115436)
-- Name: project_category; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.project_category AS ENUM (
    'scheduled',
    'unscheduled',
    'short_term'
);


ALTER TYPE ipeot.project_category OWNER TO digi_user;

--
-- TOC entry 959 (class 1247 OID 115444)
-- Name: project_status; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.project_status AS ENUM (
    'draft',
    'submitted',
    'in_review',
    'scope_modification',
    'endorsed',
    'authorized',
    'authorized_pending_wbs',
    'in_progress',
    'report_review',
    'closed',
    'rejected',
    'cancelled',
    'routed',
    'department_review',
    'clarification',
    'incharge_review',
    'plan_scheduled',
    'plan_unscheduled',
    'hod_endorsed',
    'pcc_consolidation',
    'hoi_review',
    'tac_review',
    'director_approved',
    'published',
    'removed',
    'short_term_closed',
    'in_year_approved'
);


ALTER TYPE ipeot.project_status OWNER TO digi_user;

--
-- TOC entry 965 (class 1247 OID 115482)
-- Name: task_status; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.task_status AS ENUM (
    'pending',
    'completed',
    'cancelled',
    'escalated'
);


ALTER TYPE ipeot.task_status OWNER TO digi_user;

--
-- TOC entry 977 (class 1247 OID 115516)
-- Name: virus_scan_status; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.virus_scan_status AS ENUM (
    'pending',
    'clean',
    'infected',
    'skipped'
);


ALTER TYPE ipeot.virus_scan_status OWNER TO digi_user;

--
-- TOC entry 962 (class 1247 OID 115470)
-- Name: workflow_action; Type: TYPE; Schema: ipeot; Owner: digi_user
--

CREATE TYPE ipeot.workflow_action AS ENUM (
    'accept',
    'modify',
    'reject',
    'endorse',
    'authorize',
    'route',
    'clarify',
    'schedule',
    'return',
    'complete_work',
    'revise',
    'publish'
);


ALTER TYPE ipeot.workflow_action OWNER TO digi_user;

--
-- TOC entry 332 (class 1255 OID 115526)
-- Name: prevent_audit_mutation(); Type: FUNCTION; Schema: ipeot; Owner: digi_user
--

CREATE FUNCTION ipeot.prevent_audit_mutation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;


ALTER FUNCTION ipeot.prevent_audit_mutation() OWNER TO digi_user;

--
-- TOC entry 333 (class 1255 OID 116589)
-- Name: session_principal(bigint); Type: FUNCTION; Schema: ipeot; Owner: digi_user
--

CREATE FUNCTION ipeot.session_principal(p_user_id bigint) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  WITH direct_roles AS (
    SELECT r.id AS role_id, r.code, r.name, a.scope::text AS scope,
           a.department_id, a.work_centre_id, NULL::bigint AS delegated_from, false AS delegated
    FROM ipeot.user_role_assignments a
    JOIN ipeot.roles r ON r.id = a.role_id
    WHERE a.user_id = p_user_id AND a.active
  ),
  delegated_specific AS (
    SELECT r.id, r.code, r.name, 'global'::text, NULL::bigint, NULL::bigint, d.from_user_id, true
    FROM ipeot.role_delegations d
    JOIN ipeot.roles r ON r.id = d.role_id
    WHERE d.to_user_id = p_user_id AND d.active AND d.role_id IS NOT NULL
      AND now() BETWEEN d.starts_at AND d.ends_at
  ),
  delegated_all AS (
    SELECT r.id, r.code, r.name, a.scope::text, a.department_id, a.work_centre_id, d.from_user_id, true
    FROM ipeot.role_delegations d
    JOIN ipeot.user_role_assignments a ON a.user_id = d.from_user_id AND a.active
    JOIN ipeot.roles r ON r.id = a.role_id
    WHERE d.to_user_id = p_user_id AND d.active AND d.role_id IS NULL
      AND now() BETWEEN d.starts_at AND d.ends_at
  ),
  roles AS (
    SELECT * FROM direct_roles
    UNION ALL SELECT * FROM delegated_specific
    UNION ALL SELECT * FROM delegated_all
  )
  SELECT jsonb_build_object(
    'id', u.id,
    'cpf', u.cpf,
    'name', u.name,
    'email', u.email,
    'departmentId', u.department_id,
    'workCentreId', u.work_centre_id,
    'roles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'code', code, 'name', name, 'scope', scope,
        'departmentId', department_id, 'workCentreId', work_centre_id,
        'delegated', delegated, 'delegatedFrom', delegated_from
      ) ORDER BY code)
      FROM roles
    ), '[]'::jsonb),
    'permissions', COALESCE((
      SELECT jsonb_agg(code ORDER BY code)
      FROM (
        SELECT DISTINCT p.code
        FROM roles
        JOIN ipeot.role_permissions rp ON rp.role_id = roles.role_id
        JOIN ipeot.permissions p ON p.id = rp.permission_id
      ) perms
    ), '[]'::jsonb)
  )
  FROM ipeot.users u
  WHERE u.id = p_user_id AND u.active;
$$;


ALTER FUNCTION ipeot.session_principal(p_user_id bigint) OWNER TO digi_user;

--
-- TOC entry 331 (class 1255 OID 115525)
-- Name: touch_updated_at(); Type: FUNCTION; Schema: ipeot; Owner: digi_user
--

CREATE FUNCTION ipeot.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION ipeot.touch_updated_at() OWNER TO digi_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 233 (class 1259 OID 115692)
-- Name: approval_matrix; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.approval_matrix (
    id bigint NOT NULL,
    project_category ipeot.project_category NOT NULL,
    department_id bigint,
    stage_code text NOT NULL,
    stage_name text NOT NULL,
    stage_order integer NOT NULL,
    assignee_role_code text NOT NULL,
    applies_to text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT approval_matrix_applies_to_check CHECK ((applies_to = ANY (ARRAY['proposal'::text, 'report'::text]))),
    CONSTRAINT approval_matrix_stage_order_check CHECK ((stage_order > 0))
);


ALTER TABLE ipeot.approval_matrix OWNER TO digi_user;

--
-- TOC entry 232 (class 1259 OID 115691)
-- Name: approval_matrix_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.approval_matrix ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.approval_matrix_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 306 (class 1259 OID 116431)
-- Name: audit_log; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
)
PARTITION BY RANGE (created_at);


ALTER TABLE ipeot.audit_log OWNER TO digi_user;

--
-- TOC entry 4388 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE audit_log; Type: COMMENT; Schema: ipeot; Owner: digi_user
--

COMMENT ON TABLE ipeot.audit_log IS 'Append-only. Yearly partitions cover the 7-year retention window.';


--
-- TOC entry 307 (class 1259 OID 116438)
-- Name: audit_log_2026; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2026 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2026 OWNER TO digi_user;

--
-- TOC entry 308 (class 1259 OID 116447)
-- Name: audit_log_2027; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2027 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2027 OWNER TO digi_user;

--
-- TOC entry 309 (class 1259 OID 116456)
-- Name: audit_log_2028; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2028 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2028 OWNER TO digi_user;

--
-- TOC entry 310 (class 1259 OID 116465)
-- Name: audit_log_2029; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2029 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2029 OWNER TO digi_user;

--
-- TOC entry 311 (class 1259 OID 116474)
-- Name: audit_log_2030; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2030 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2030 OWNER TO digi_user;

--
-- TOC entry 312 (class 1259 OID 116483)
-- Name: audit_log_2031; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2031 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2031 OWNER TO digi_user;

--
-- TOC entry 313 (class 1259 OID 116492)
-- Name: audit_log_2032; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2032 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2032 OWNER TO digi_user;

--
-- TOC entry 314 (class 1259 OID 116501)
-- Name: audit_log_2033; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_2033 (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_2033 OWNER TO digi_user;

--
-- TOC entry 315 (class 1259 OID 116510)
-- Name: audit_log_default; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.audit_log_default (
    id bigint NOT NULL,
    entity text NOT NULL,
    entity_id text,
    action text NOT NULL,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.audit_log_default OWNER TO digi_user;

--
-- TOC entry 305 (class 1259 OID 116430)
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.audit_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 115749)
-- Name: awp_cycles; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.awp_cycles (
    id bigint NOT NULL,
    year integer NOT NULL,
    title text NOT NULL,
    window_open timestamp with time zone,
    window_close timestamp with time zone,
    status ipeot.awp_status DEFAULT 'draft'::ipeot.awp_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    masters_updated_at timestamp with time zone,
    invitation_sent_at timestamp with time zone,
    package_status text,
    consolidated_body text,
    disha_payload jsonb,
    published_at timestamp with time zone,
    reminder_offsets integer[] DEFAULT '{7,3,1}'::integer[] NOT NULL
);


ALTER TABLE ipeot.awp_cycles OWNER TO digi_user;

--
-- TOC entry 238 (class 1259 OID 115748)
-- Name: awp_cycles_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.awp_cycles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.awp_cycles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 330 (class 1259 OID 135774)
-- Name: awp_package_tasks; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.awp_package_tasks (
    id bigint NOT NULL,
    awp_cycle_id bigint NOT NULL,
    stage_code text NOT NULL,
    stage_name text NOT NULL,
    assignee_role_code text NOT NULL,
    status ipeot.task_status DEFAULT 'pending'::ipeot.task_status NOT NULL,
    action ipeot.workflow_action,
    remarks text,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    completed_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.awp_package_tasks OWNER TO digi_user;

--
-- TOC entry 329 (class 1259 OID 135773)
-- Name: awp_package_tasks_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.awp_package_tasks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.awp_package_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 328 (class 1259 OID 135762)
-- Name: awp_reminder_log; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.awp_reminder_log (
    awp_cycle_id bigint NOT NULL,
    offset_days integer NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.awp_reminder_log OWNER TO digi_user;

--
-- TOC entry 247 (class 1259 OID 115849)
-- Name: awp_submissions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.awp_submissions (
    id bigint NOT NULL,
    awp_cycle_id bigint NOT NULL,
    proposal_id bigint NOT NULL,
    submitted_by bigint,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.awp_submissions OWNER TO digi_user;

--
-- TOC entry 246 (class 1259 OID 115848)
-- Name: awp_submissions_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.awp_submissions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.awp_submissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 275 (class 1259 OID 116114)
-- Name: calibrations; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.calibrations (
    id bigint NOT NULL,
    instrument_id bigint NOT NULL,
    calibrated_at timestamp with time zone NOT NULL,
    valid_until timestamp with time zone,
    certificate_file_id bigint,
    notes text
);


ALTER TABLE ipeot.calibrations OWNER TO digi_user;

--
-- TOC entry 274 (class 1259 OID 116113)
-- Name: calibrations_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.calibrations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.calibrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 283 (class 1259 OID 116213)
-- Name: consumables; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.consumables (
    id bigint NOT NULL,
    name text NOT NULL,
    sku text,
    quantity numeric DEFAULT 0 NOT NULL,
    unit text,
    lab_location_id bigint
);


ALTER TABLE ipeot.consumables OWNER TO digi_user;

--
-- TOC entry 282 (class 1259 OID 116212)
-- Name: consumables_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.consumables ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.consumables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 216 (class 1259 OID 115528)
-- Name: departments; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.departments (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.departments OWNER TO digi_user;

--
-- TOC entry 215 (class 1259 OID 115527)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.departments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.departments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 295 (class 1259 OID 116331)
-- Name: distribution_log; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.distribution_log (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    audience text NOT NULL,
    recipient text,
    channel text,
    sent_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.distribution_log OWNER TO digi_user;

--
-- TOC entry 294 (class 1259 OID 116330)
-- Name: distribution_log_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.distribution_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.distribution_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 261 (class 1259 OID 115985)
-- Name: files; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.files (
    id bigint NOT NULL,
    storage_key text NOT NULL,
    original_name text NOT NULL,
    mime text,
    size_bytes bigint DEFAULT 0 NOT NULL,
    virus_scan_status ipeot.virus_scan_status DEFAULT 'pending'::ipeot.virus_scan_status NOT NULL,
    uploaded_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.files OWNER TO digi_user;

--
-- TOC entry 260 (class 1259 OID 115984)
-- Name: files_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.files ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 293 (class 1259 OID 116310)
-- Name: final_reports; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.final_reports (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    file_id bigint,
    locked_at timestamp with time zone,
    signature jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.final_reports OWNER TO digi_user;

--
-- TOC entry 292 (class 1259 OID 116309)
-- Name: final_reports_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.final_reports ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.final_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 115559)
-- Name: installations; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.installations (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    work_centre_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.installations OWNER TO digi_user;

--
-- TOC entry 219 (class 1259 OID 115558)
-- Name: installations_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.installations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.installations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 273 (class 1259 OID 116098)
-- Name: instruments; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.instruments (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    lab_location_id bigint,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE ipeot.instruments OWNER TO digi_user;

--
-- TOC entry 272 (class 1259 OID 116097)
-- Name: instruments_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.instruments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.instruments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 304 (class 1259 OID 116420)
-- Name: integration_outbox; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.integration_outbox (
    id bigint NOT NULL,
    kind text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone
);


ALTER TABLE ipeot.integration_outbox OWNER TO digi_user;

--
-- TOC entry 303 (class 1259 OID 116419)
-- Name: integration_outbox_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.integration_outbox ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.integration_outbox_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 265 (class 1259 OID 116021)
-- Name: iso_document_versions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.iso_document_versions (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    version_no integer NOT NULL,
    content jsonb,
    file_id bigint,
    approved_by bigint,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.iso_document_versions OWNER TO digi_user;

--
-- TOC entry 264 (class 1259 OID 116020)
-- Name: iso_document_versions_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.iso_document_versions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.iso_document_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 263 (class 1259 OID 116003)
-- Name: iso_documents; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.iso_documents (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    doc_type ipeot.iso_doc_type NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.iso_documents OWNER TO digi_user;

--
-- TOC entry 262 (class 1259 OID 116002)
-- Name: iso_documents_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.iso_documents ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.iso_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 269 (class 1259 OID 116072)
-- Name: lab_locations; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.lab_locations (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    department_id bigint,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE ipeot.lab_locations OWNER TO digi_user;

--
-- TOC entry 268 (class 1259 OID 116071)
-- Name: lab_locations_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.lab_locations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.lab_locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 285 (class 1259 OID 116227)
-- Name: maintenance_tickets; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.maintenance_tickets (
    id bigint NOT NULL,
    instrument_id bigint,
    title text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    opened_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.maintenance_tickets OWNER TO digi_user;

--
-- TOC entry 284 (class 1259 OID 116226)
-- Name: maintenance_tickets_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.maintenance_tickets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.maintenance_tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 267 (class 1259 OID 116052)
-- Name: milestones; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.milestones (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    title text NOT NULL,
    due_at date,
    completed_at timestamp with time zone,
    pas_document_id bigint,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.milestones OWNER TO digi_user;

--
-- TOC entry 266 (class 1259 OID 116051)
-- Name: milestones_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.milestones ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.milestones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 300 (class 1259 OID 116385)
-- Name: notification_preferences; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.notification_preferences (
    user_id bigint NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    digest text DEFAULT 'daily'::text NOT NULL
);


ALTER TABLE ipeot.notification_preferences OWNER TO digi_user;

--
-- TOC entry 299 (class 1259 OID 116369)
-- Name: notifications; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    title text NOT NULL,
    body text,
    channel text DEFAULT 'in_app'::text NOT NULL,
    read_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.notifications OWNER TO digi_user;

--
-- TOC entry 298 (class 1259 OID 116368)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.notifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 327 (class 1259 OID 135744)
-- Name: outbound_mail; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.outbound_mail (
    id bigint NOT NULL,
    awp_cycle_id bigint,
    kind text NOT NULL,
    recipient_user_id bigint,
    recipient_email text,
    subject text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.outbound_mail OWNER TO digi_user;

--
-- TOC entry 326 (class 1259 OID 135743)
-- Name: outbound_mail_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.outbound_mail ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.outbound_mail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 115610)
-- Name: permissions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.permissions (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE ipeot.permissions OWNER TO digi_user;

--
-- TOC entry 225 (class 1259 OID 115609)
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.permissions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 323 (class 1259 OID 135709)
-- Name: project_routes; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.project_routes (
    project_id bigint NOT NULL,
    department_id bigint NOT NULL
);


ALTER TABLE ipeot.project_routes OWNER TO digi_user;

--
-- TOC entry 259 (class 1259 OID 115959)
-- Name: project_team; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.project_team (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_on_project text NOT NULL,
    allotted_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.project_team OWNER TO digi_user;

--
-- TOC entry 258 (class 1259 OID 115958)
-- Name: project_team_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.project_team ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.project_team_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 115726)
-- Name: project_types; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.project_types (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    department_id bigint,
    work_centre_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.project_types OWNER TO digi_user;

--
-- TOC entry 236 (class 1259 OID 115725)
-- Name: project_types_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.project_types ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.project_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 115762)
-- Name: projects; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.projects (
    id bigint NOT NULL,
    project_category ipeot.project_category NOT NULL,
    department_id bigint NOT NULL,
    work_centre_id bigint,
    project_type_id bigint,
    title text NOT NULL,
    status ipeot.project_status DEFAULT 'draft'::ipeot.project_status NOT NULL,
    wbs_number text,
    accession_number text,
    awp_cycle_id bigint,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    priority smallint,
    preferred_quarter text,
    final_quarter text,
    schedule_decision text,
    dependency_note text,
    intake text DEFAULT 'awp'::text NOT NULL,
    rejection_reason text,
    removal_reason text,
    scope_note text,
    job_tags text,
    parent_department_id bigint,
    short_term_outcome text,
    short_term_effort text
);


ALTER TABLE ipeot.projects OWNER TO digi_user;

--
-- TOC entry 240 (class 1259 OID 115761)
-- Name: projects_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.projects ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 325 (class 1259 OID 135725)
-- Name: proposal_files; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.proposal_files (
    id bigint NOT NULL,
    proposal_id bigint NOT NULL,
    file_name text NOT NULL,
    mime text,
    size_bytes integer NOT NULL,
    content bytea NOT NULL,
    uploaded_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.proposal_files OWNER TO digi_user;

--
-- TOC entry 324 (class 1259 OID 135724)
-- Name: proposal_files_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.proposal_files ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.proposal_files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 318 (class 1259 OID 116620)
-- Name: proposal_number_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

CREATE SEQUENCE ipeot.proposal_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE ipeot.proposal_number_seq OWNER TO digi_user;

--
-- TOC entry 245 (class 1259 OID 115828)
-- Name: proposal_versions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.proposal_versions (
    id bigint NOT NULL,
    proposal_id bigint NOT NULL,
    version_no integer NOT NULL,
    snapshot jsonb NOT NULL,
    reason text,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.proposal_versions OWNER TO digi_user;

--
-- TOC entry 244 (class 1259 OID 115827)
-- Name: proposal_versions_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.proposal_versions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.proposal_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 243 (class 1259 OID 115802)
-- Name: proposals; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.proposals (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    proposal_number text,
    form jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_version integer DEFAULT 1 NOT NULL,
    submitted_at timestamp with time zone,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.proposals OWNER TO digi_user;

--
-- TOC entry 242 (class 1259 OID 115801)
-- Name: proposals_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.proposals ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.proposals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 291 (class 1259 OID 116291)
-- Name: report_approvals; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.report_approvals (
    id bigint NOT NULL,
    version_id bigint NOT NULL,
    stage_code text NOT NULL,
    action text NOT NULL,
    actor_id bigint,
    remarks text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.report_approvals OWNER TO digi_user;

--
-- TOC entry 290 (class 1259 OID 116290)
-- Name: report_approvals_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.report_approvals ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.report_approvals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 287 (class 1259 OID 116247)
-- Name: report_drafts; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.report_drafts (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    ai_generated boolean DEFAULT false NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.report_drafts OWNER TO digi_user;

--
-- TOC entry 286 (class 1259 OID 116246)
-- Name: report_drafts_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.report_drafts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.report_drafts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 289 (class 1259 OID 116270)
-- Name: report_versions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.report_versions (
    id bigint NOT NULL,
    draft_id bigint NOT NULL,
    version_no integer NOT NULL,
    snapshot jsonb NOT NULL,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.report_versions OWNER TO digi_user;

--
-- TOC entry 288 (class 1259 OID 116269)
-- Name: report_versions_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.report_versions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.report_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 115666)
-- Name: role_delegations; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.role_delegations (
    id bigint NOT NULL,
    from_user_id bigint NOT NULL,
    to_user_id bigint NOT NULL,
    role_id bigint,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    reason text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT role_delegations_window CHECK ((ends_at > starts_at))
);


ALTER TABLE ipeot.role_delegations OWNER TO digi_user;

--
-- TOC entry 230 (class 1259 OID 115665)
-- Name: role_delegations_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.role_delegations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.role_delegations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 115619)
-- Name: role_permissions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.role_permissions (
    role_id bigint NOT NULL,
    permission_id bigint NOT NULL
);


ALTER TABLE ipeot.role_permissions OWNER TO digi_user;

--
-- TOC entry 224 (class 1259 OID 115599)
-- Name: roles; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.roles (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.roles OWNER TO digi_user;

--
-- TOC entry 223 (class 1259 OID 115598)
-- Name: roles_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 322 (class 1259 OID 135688)
-- Name: routing_rules; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.routing_rules (
    id bigint NOT NULL,
    project_type_id bigint NOT NULL,
    department_id bigint NOT NULL,
    tag text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.routing_rules OWNER TO digi_user;

--
-- TOC entry 321 (class 1259 OID 135687)
-- Name: routing_rules_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.routing_rules ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.routing_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 277 (class 1259 OID 116132)
-- Name: samples; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.samples (
    id bigint NOT NULL,
    sample_code text NOT NULL,
    barcode text,
    project_id bigint,
    received_at timestamp with time zone,
    custody jsonb DEFAULT '[]'::jsonb NOT NULL,
    status text DEFAULT 'received'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.samples OWNER TO digi_user;

--
-- TOC entry 276 (class 1259 OID 116131)
-- Name: samples_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.samples ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.samples_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 302 (class 1259 OID 116401)
-- Name: sap_wbs_jobs; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.sap_wbs_jobs (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    request jsonb DEFAULT '{}'::jsonb NOT NULL,
    response jsonb,
    status text DEFAULT 'queued'::text NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    manual_pcc_flag boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.sap_wbs_jobs OWNER TO digi_user;

--
-- TOC entry 301 (class 1259 OID 116400)
-- Name: sap_wbs_jobs_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.sap_wbs_jobs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.sap_wbs_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 115712)
-- Name: sla_rules; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.sla_rules (
    id bigint NOT NULL,
    stage_code text NOT NULL,
    project_category ipeot.project_category,
    target_days integer NOT NULL,
    reminder_offsets_days integer[] DEFAULT '{2,1}'::integer[] NOT NULL,
    escalation_role_code text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sla_rules_target_days_check CHECK ((target_days > 0))
);


ALTER TABLE ipeot.sla_rules OWNER TO digi_user;

--
-- TOC entry 234 (class 1259 OID 115711)
-- Name: sla_rules_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.sla_rules ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.sla_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 320 (class 1259 OID 135669)
-- Name: stakeholder_units; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.stakeholder_units (
    id bigint NOT NULL,
    kind text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    coordinator_user_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT stakeholder_units_kind_check CHECK ((kind = ANY (ARRAY['asset'::text, 'plant'::text, 'service'::text, 'institute'::text])))
);


ALTER TABLE ipeot.stakeholder_units OWNER TO digi_user;

--
-- TOC entry 319 (class 1259 OID 135668)
-- Name: stakeholder_units_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.stakeholder_units ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.stakeholder_units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 317 (class 1259 OID 116602)
-- Name: study_catalogue; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.study_catalogue (
    project_type_code text NOT NULL,
    sample_report text,
    inputs jsonb DEFAULT '[]'::jsonb NOT NULL,
    specimens jsonb DEFAULT '[]'::jsonb NOT NULL,
    equipment jsonb DEFAULT '[]'::jsonb NOT NULL,
    tests jsonb DEFAULT '[]'::jsonb NOT NULL,
    software jsonb DEFAULT '[]'::jsonb NOT NULL,
    form_schema jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.study_catalogue OWNER TO digi_user;

--
-- TOC entry 255 (class 1259 OID 115923)
-- Name: tac_agenda_items; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.tac_agenda_items (
    id bigint NOT NULL,
    meeting_id bigint NOT NULL,
    project_id bigint NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE ipeot.tac_agenda_items OWNER TO digi_user;

--
-- TOC entry 254 (class 1259 OID 115922)
-- Name: tac_agenda_items_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.tac_agenda_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.tac_agenda_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 257 (class 1259 OID 115940)
-- Name: tac_decisions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.tac_decisions (
    id bigint NOT NULL,
    agenda_item_id bigint NOT NULL,
    decision text NOT NULL,
    remarks text,
    decided_by bigint,
    decided_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.tac_decisions OWNER TO digi_user;

--
-- TOC entry 256 (class 1259 OID 115939)
-- Name: tac_decisions_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.tac_decisions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.tac_decisions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 253 (class 1259 OID 115913)
-- Name: tac_meetings; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.tac_meetings (
    id bigint NOT NULL,
    title text NOT NULL,
    scheduled_at timestamp with time zone,
    status text DEFAULT 'scheduled'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.tac_meetings OWNER TO digi_user;

--
-- TOC entry 252 (class 1259 OID 115912)
-- Name: tac_meetings_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.tac_meetings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.tac_meetings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 271 (class 1259 OID 116088)
-- Name: test_methods; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.test_methods (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE ipeot.test_methods OWNER TO digi_user;

--
-- TOC entry 270 (class 1259 OID 116087)
-- Name: test_methods_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.test_methods ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.test_methods_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 279 (class 1259 OID 116152)
-- Name: test_requests; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.test_requests (
    id bigint NOT NULL,
    sample_id bigint NOT NULL,
    method_id bigint,
    requested_by bigint,
    status text DEFAULT 'requested'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.test_requests OWNER TO digi_user;

--
-- TOC entry 278 (class 1259 OID 116151)
-- Name: test_requests_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.test_requests ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.test_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 281 (class 1259 OID 116177)
-- Name: test_results; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.test_results (
    id bigint NOT NULL,
    request_id bigint NOT NULL,
    analyst_id bigint,
    instrument_id bigint,
    result jsonb DEFAULT '{}'::jsonb NOT NULL,
    file_id bigint,
    approval_state text DEFAULT 'draft'::text NOT NULL,
    approved_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.test_results OWNER TO digi_user;

--
-- TOC entry 280 (class 1259 OID 116176)
-- Name: test_results_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.test_results ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.test_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 229 (class 1259 OID 115635)
-- Name: user_role_assignments; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.user_role_assignments (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_id bigint NOT NULL,
    scope ipeot.assignment_scope DEFAULT 'global'::ipeot.assignment_scope NOT NULL,
    department_id bigint,
    work_centre_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.user_role_assignments OWNER TO digi_user;

--
-- TOC entry 228 (class 1259 OID 115634)
-- Name: user_role_assignments_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.user_role_assignments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.user_role_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 316 (class 1259 OID 116581)
-- Name: user_sessions; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.user_sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE ipeot.user_sessions OWNER TO digi_user;

--
-- TOC entry 222 (class 1259 OID 115576)
-- Name: users; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.users (
    id bigint NOT NULL,
    cpf text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    password_hash text,
    active boolean DEFAULT true NOT NULL,
    department_id bigint,
    work_centre_id bigint,
    ad_dn text,
    sap_employee_id text,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.users OWNER TO digi_user;

--
-- TOC entry 221 (class 1259 OID 115575)
-- Name: users_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 297 (class 1259 OID 116345)
-- Name: work_centre_feedback; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.work_centre_feedback (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    work_centre_id bigint,
    rating integer,
    comments text,
    submitted_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.work_centre_feedback OWNER TO digi_user;

--
-- TOC entry 296 (class 1259 OID 116344)
-- Name: work_centre_feedback_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.work_centre_feedback ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.work_centre_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 115541)
-- Name: work_centres; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.work_centres (
    id bigint NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    department_id bigint,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE ipeot.work_centres OWNER TO digi_user;

--
-- TOC entry 217 (class 1259 OID 115540)
-- Name: work_centres_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.work_centres ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.work_centres_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 249 (class 1259 OID 115873)
-- Name: workflow_instances; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.workflow_instances (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    applies_to text DEFAULT 'proposal'::text NOT NULL,
    current_stage text,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT workflow_instances_applies_to_check CHECK ((applies_to = ANY (ARRAY['proposal'::text, 'report'::text]))),
    CONSTRAINT workflow_instances_status_check CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE ipeot.workflow_instances OWNER TO digi_user;

--
-- TOC entry 248 (class 1259 OID 115872)
-- Name: workflow_instances_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.workflow_instances ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.workflow_instances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 251 (class 1259 OID 115891)
-- Name: workflow_tasks; Type: TABLE; Schema: ipeot; Owner: digi_user
--

CREATE TABLE ipeot.workflow_tasks (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    stage_code text NOT NULL,
    stage_order integer NOT NULL,
    assignee_role_code text,
    assignee_user_id bigint,
    status ipeot.task_status DEFAULT 'pending'::ipeot.task_status NOT NULL,
    action ipeot.workflow_action,
    remarks text,
    due_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_by bigint
);


ALTER TABLE ipeot.workflow_tasks OWNER TO digi_user;

--
-- TOC entry 250 (class 1259 OID 115890)
-- Name: workflow_tasks_id_seq; Type: SEQUENCE; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.workflow_tasks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME ipeot.workflow_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 3631 (class 0 OID 0)
-- Name: audit_log_2026; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2026 FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');


--
-- TOC entry 3632 (class 0 OID 0)
-- Name: audit_log_2027; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2027 FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2028-01-01 00:00:00+00');


--
-- TOC entry 3633 (class 0 OID 0)
-- Name: audit_log_2028; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2028 FOR VALUES FROM ('2028-01-01 00:00:00+00') TO ('2029-01-01 00:00:00+00');


--
-- TOC entry 3634 (class 0 OID 0)
-- Name: audit_log_2029; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2029 FOR VALUES FROM ('2029-01-01 00:00:00+00') TO ('2030-01-01 00:00:00+00');


--
-- TOC entry 3635 (class 0 OID 0)
-- Name: audit_log_2030; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2030 FOR VALUES FROM ('2030-01-01 00:00:00+00') TO ('2031-01-01 00:00:00+00');


--
-- TOC entry 3636 (class 0 OID 0)
-- Name: audit_log_2031; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2031 FOR VALUES FROM ('2031-01-01 00:00:00+00') TO ('2032-01-01 00:00:00+00');


--
-- TOC entry 3637 (class 0 OID 0)
-- Name: audit_log_2032; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2032 FOR VALUES FROM ('2032-01-01 00:00:00+00') TO ('2033-01-01 00:00:00+00');


--
-- TOC entry 3638 (class 0 OID 0)
-- Name: audit_log_2033; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_2033 FOR VALUES FROM ('2033-01-01 00:00:00+00') TO ('2034-01-01 00:00:00+00');


--
-- TOC entry 3639 (class 0 OID 0)
-- Name: audit_log_default; Type: TABLE ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log ATTACH PARTITION ipeot.audit_log_default DEFAULT;


--
-- TOC entry 4286 (class 0 OID 115692)
-- Dependencies: 233
-- Data for Name: approval_matrix; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.approval_matrix (id, project_category, department_id, stage_code, stage_name, stage_order, assignee_role_code, applies_to, active, created_at, updated_at) FROM stdin;
19	scheduled	\N	ic_review	In-charge report review	1	IC	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
20	scheduled	\N	hod_endorse	HOD report endorsement	2	HOD	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
21	scheduled	\N	hoi_authorize	HOI report authorization	3	HOI	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
22	unscheduled	\N	ic_review	In-charge report review	1	IC	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
23	unscheduled	\N	hod_endorse	HOD report endorsement	2	HOD	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
24	unscheduled	\N	hoi_authorize	HOI report authorization	3	HOI	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
25	short_term	\N	ic_review	In-charge report review	1	IC	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
26	short_term	\N	hod_endorse	HOD report endorsement	2	HOD	report	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
27	scheduled	\N	pcc_route	PCC routes to department	1	PCC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
28	scheduled	\N	dept_review	Department review	2	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
29	scheduled	\N	incharge_review	In-charge review	3	IC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
30	scheduled	\N	hod_endorse	HOD endorsement	4	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
31	scheduled	\N	pcc_consolidation	PCC consolidation	5	PCC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
32	scheduled	\N	hoi_review	HOI review of the AWP	6	HOI	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
33	scheduled	\N	tac	TAC	7	TAC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
34	scheduled	\N	director	Director approval	8	DIRECTOR	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
35	scheduled	\N	publish	Publish the AWP	9	PCC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
36	unscheduled	\N	pcc_route	PCC routes the in-year request	1	PCC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
37	unscheduled	\N	dept_review	Department assessment	2	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
38	unscheduled	\N	in_year_hod	HOD approval	3	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
39	short_term	\N	pcc_route	PCC routes short-term work	1	PCC	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
40	short_term	\N	dept_review	Department checks the short-term test	2	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
41	short_term	\N	short_term_hod	HOD approval	3	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
42	short_term	\N	short_term_close	Record outcome and effort	4	HOD	proposal	t	2026-11-18 07:01:57.211615+00	2026-11-18 07:01:57.211615+00
\.


--
-- TOC entry 4359 (class 0 OID 116438)
-- Dependencies: 307
-- Data for Name: audit_log_2026; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2026 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
1	user	7	login	7	{"method": "local"}	2026-10-26 16:33:31.959832+00
2	user	\N	login_failed	\N	{"cpf": "100001", "method": "local"}	2026-10-26 16:33:32.135255+00
3	department	7	create	7	{"id": 7, "code": "D7", "name": "Department VII", "active": true}	2026-10-26 16:33:32.15756+00
4	user	7	login	7	{"method": "local"}	2026-10-26 16:39:00.47206+00
5	user	2	login	2	{"method": "local"}	2026-10-26 16:41:08.239993+00
6	user	6	login	6	{"method": "local"}	2026-10-26 16:41:21.171932+00
7	user	7	login	7	{"method": "local"}	2026-10-26 16:42:32.428773+00
8	user	7	logout	7	{}	2026-10-26 16:45:25.084044+00
9	user	6	login	6	{"method": "local"}	2026-10-26 16:45:38.23063+00
10	user	6	logout	6	{}	2026-10-26 16:45:49.435499+00
11	user	5	login	5	{"method": "local"}	2026-10-26 16:45:56.839838+00
12	user	5	logout	5	{}	2026-10-26 16:46:07.104156+00
13	user	2	login	2	{"method": "local"}	2026-10-26 16:46:13.281203+00
14	user	2	logout	2	{}	2026-10-26 16:46:27.459348+00
15	user	4	login	4	{"method": "local"}	2026-10-26 16:46:33.211702+00
16	user	4	logout	4	{}	2026-10-26 16:46:39.070223+00
17	user	1	login	1	{"method": "local"}	2026-10-26 16:46:44.377865+00
18	user	1	logout	1	{}	2026-10-26 16:46:56.109628+00
19	user	3	login	3	{"method": "local"}	2026-10-26 16:47:02.718941+00
20	user	3	logout	3	{}	2026-10-26 16:47:09.693692+00
21	user	7	login	7	{"method": "local"}	2026-10-26 16:47:48.439504+00
22	user	7	logout	7	{}	2026-10-26 16:48:51.347797+00
23	user	7	login	7	{"method": "local"}	2026-10-26 16:51:06.130174+00
24	user	2	login	2	{"method": "local"}	2026-10-26 17:02:12.421632+00
25	proposal	1	create	7	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0001"}	2026-10-26 17:04:05.911224+00
26	user	7	logout	7	{}	2026-10-26 17:05:10.94554+00
27	user	2	login	2	{"method": "local"}	2026-10-26 17:05:39.65578+00
28	proposal	1	submit	2	{"role": "COORDINATOR", "stage": "coordinator"}	2026-10-26 17:08:53.657663+00
29	user	2	logout	2	{}	2026-10-26 17:08:59.168469+00
30	user	4	login	4	{"method": "local"}	2026-10-26 17:09:06.336218+00
31	user	4	logout	4	{}	2026-10-26 17:09:21.048544+00
32	user	4	login	4	{"method": "local"}	2026-10-26 17:09:25.787415+00
33	user	4	logout	4	{}	2026-10-26 17:09:34.625428+00
34	user	1	login	1	{"method": "local"}	2026-10-26 17:09:39.035448+00
35	user	1	logout	1	{}	2026-10-26 17:09:50.547016+00
36	user	3	login	3	{"method": "local"}	2026-10-26 17:09:58.034658+00
37	user	3	logout	3	{}	2026-10-26 17:10:13.028458+00
38	user	5	login	5	{"method": "local"}	2026-10-26 17:10:17.408905+00
39	user	5	logout	5	{}	2026-10-26 17:11:11.063627+00
40	user	6	login	6	{"method": "local"}	2026-10-26 17:11:19.143141+00
41	user	6	logout	6	{}	2026-10-26 17:12:28.055876+00
42	user	5	login	5	{"method": "local"}	2026-10-26 17:14:09.877355+00
43	user	7	logout	7	{}	2026-10-26 17:17:06.384001+00
44	user	5	login	5	{"method": "local"}	2026-10-26 17:17:31.897245+00
45	workflow_task	1	accept	5	{"remarks": "ok", "nextStage": "pcc", "projectId": 1}	2026-10-26 17:20:53.034611+00
46	user	5	logout	5	{}	2026-10-26 17:21:04.056584+00
47	user	2	login	2	{"method": "local"}	2026-10-26 17:21:14.326789+00
48	user	2	logout	2	{}	2026-10-26 17:21:32.07454+00
49	user	6	login	6	{"method": "local"}	2026-10-26 17:21:47.358974+00
50	workflow_task	2	accept	6	{"remarks": "ok", "nextStage": "ic_review", "projectId": 1}	2026-10-26 17:22:01.577704+00
51	user	6	logout	6	{}	2026-10-26 17:22:13.13601+00
52	user	\N	login_failed	\N	{"cpf": "100005", "method": "local"}	2026-10-26 17:28:54.673089+00
53	user	4	login	4	{"method": "local"}	2026-10-26 17:29:06.63349+00
54	workflow_task	3	accept	4	{"remarks": "", "nextStage": "hod_endorse", "projectId": 1}	2026-10-26 17:47:17.572489+00
55	user	4	logout	4	{}	2026-10-26 17:47:35.661315+00
56	user	1	login	1	{"method": "local"}	2026-10-26 17:47:51.364668+00
57	workflow_task	4	endorse	1	{"remarks": "ok", "nextStage": "hoi_authorize", "projectId": 1}	2026-10-26 17:48:36.106446+00
58	user	1	logout	1	{}	2026-10-26 17:53:23.578361+00
59	user	1	login	1	{"method": "local"}	2026-10-26 17:53:32.377206+00
60	user	1	logout	1	{}	2026-10-26 17:53:38.195844+00
61	user	3	login	3	{"method": "local"}	2026-10-26 17:53:48.63662+00
62	workflow_task	5	authorize	3	{"remarks": "", "nextStage": "tac", "projectId": 1}	2026-10-26 17:53:58.522502+00
63	user	3	logout	3	{}	2026-10-26 17:54:39.547932+00
64	user	2	login	2	{"method": "local"}	2026-10-26 17:54:44.652882+00
65	user	2	logout	2	{}	2026-10-26 17:56:30.668667+00
66	user	7	login	7	{"method": "local"}	2026-10-26 17:56:35.801944+00
67	user	7	logout	7	{}	2026-10-26 18:02:13.266461+00
68	user	6	login	6	{"method": "local"}	2026-10-26 18:02:17.968277+00
69	user	6	logout	6	{}	2026-10-26 18:03:20.371885+00
70	user	5	logout	5	{}	2026-10-26 18:04:22.687614+00
71	user	6	login	6	{"method": "local"}	2026-10-26 18:05:19.678272+00
72	awp_cycle	1	open	6	{"year": 2026, "title": "Annual work programme 2026", "status": "open"}	2026-10-26 18:05:52.246393+00
73	user	6	login	6	{"method": "local"}	2026-10-26 18:06:22.022959+00
74	user	6	logout	6	{}	2026-10-26 18:10:26.719261+00
75	user	2	login	2	{"method": "local"}	2026-10-27 09:52:35.079856+00
76	proposal	2	create	2	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0002"}	2026-10-27 09:52:35.265944+00
77	proposal	3	create	2	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0003"}	2026-10-27 09:52:35.324766+00
78	proposal	3	submit	2	{"role": "COORDINATOR", "stage": "coordinator", "awpCycleId": null}	2026-10-27 09:52:35.369538+00
79	proposal	4	create	2	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0004"}	2026-10-27 09:52:42.786359+00
80	proposal	4	submit	2	{"role": "COORDINATOR", "stage": "coordinator", "awpCycleId": 1}	2026-10-27 09:52:42.825617+00
81	user	6	logout	6	{}	2026-10-27 09:53:24.772989+00
82	user	3	login	3	{"method": "local"}	2026-10-27 09:53:45.060103+00
83	user	3	logout	3	{}	2026-10-27 09:54:10.063802+00
84	user	8	login	8	{"method": "local"}	2026-10-27 09:54:24.862697+00
85	workflow_task	6	authorize	8	{"remarks": "Authorized", "nextStage": "director", "projectId": 1}	2026-10-27 09:55:24.463429+00
86	user	8	logout	8	{}	2026-10-27 09:55:46.742878+00
87	user	9	login	9	{"method": "local"}	2026-10-27 09:56:27.09109+00
88	workflow_task	9	authorize	9	{"remarks": "Authorized", "nextStage": null, "projectId": 1}	2026-10-27 09:57:04.997369+00
89	user	9	logout	9	{}	2026-10-27 09:57:29.607584+00
90	user	6	login	6	{"method": "local"}	2026-10-27 09:57:54.838842+00
91	awp_cycle	1	closed	6	{"status": "closed"}	2026-10-27 09:58:07.357473+00
92	awp_cycle	1	open	6	{"status": "open"}	2026-10-27 09:58:16.997646+00
93	user	6	login	6	{"method": "local"}	2026-10-27 09:59:05.835955+00
94	user	6	logout	6	{}	2026-10-27 09:59:39.112696+00
95	user	5	login	5	{"method": "local"}	2026-10-27 09:59:45.781765+00
96	user	5	logout	5	{}	2026-10-27 10:00:24.192521+00
97	user	7	login	7	{"method": "local"}	2026-10-27 10:00:26.500242+00
98	user	7	logout	7	{}	2026-10-27 10:02:09.95115+00
99	user	7	login	7	{"method": "local"}	2026-10-27 10:13:32.318831+00
100	user	7	logout	7	{}	2026-10-27 10:13:34.60558+00
101	user	7	login	7	{"method": "local"}	2026-10-27 10:17:10.192095+00
102	proposal	5	create	7	{"typeCode": "D2-FLOW", "proposalNumber": "P-2026-0002"}	2026-10-27 10:22:47.853747+00
103	awp_cycle	1	closed	7	{"status": "closed"}	2026-10-27 10:23:52.287436+00
104	awp_cycle	1	open	7	{"status": "open"}	2026-10-27 10:23:53.566478+00
105	awp_cycle	1	closed	7	{"status": "closed"}	2026-10-27 10:24:01.204444+00
106	awp_cycle	1	open	7	{"status": "open"}	2026-10-27 10:24:04.908956+00
107	awp_cycle	1	closed	7	{"status": "closed"}	2026-10-27 10:24:06.430066+00
108	awp_cycle	1	open	7	{"status": "open"}	2026-10-27 10:24:06.641376+00
109	awp_cycle	1	closed	7	{"status": "closed"}	2026-10-27 10:24:06.834598+00
110	awp_cycle	1	open	7	{"status": "open"}	2026-10-27 10:24:10.061254+00
111	awp_cycle	1	closed	7	{"status": "closed"}	2026-10-27 10:24:13.035014+00
112	awp_cycle	1	open	7	{"status": "open"}	2026-10-27 10:24:14.050416+00
113	awp_cycle	1	closed	7	{"status": "closed"}	2026-10-27 10:24:52.518714+00
114	user	7	logout	7	{}	2026-10-27 10:42:24.390582+00
115	user	6	login	6	{"method": "local"}	2026-10-27 10:42:26.803666+00
116	user	6	logout	6	{}	2026-10-27 10:42:35.947097+00
117	user	2	login	2	{"method": "local"}	2026-10-27 10:42:40.175971+00
118	user	6	login	6	{"method": "local"}	2026-10-28 03:59:30.328347+00
119	user	6	logout	6	{}	2026-10-28 03:59:33.224479+00
120	user	2	login	2	{"method": "local"}	2026-10-28 07:30:42.412871+00
121	user	2	logout	2	{}	2026-10-28 07:32:52.015265+00
122	user	7	login	7	{"method": "local"}	2026-10-28 07:32:56.973261+00
123	user	6	login	6	{"method": "local"}	2026-11-02 04:25:23.386333+00
124	user	6	login	6	{"method": "local"}	2026-11-02 04:25:43.198833+00
125	user	6	login	6	{"method": "local"}	2026-11-02 04:27:26.855868+00
126	user	6	login	6	{"method": "local"}	2026-11-02 16:01:31.481927+00
127	user	6	logout	6	{}	2026-11-02 16:11:37.919932+00
128	user	6	login	6	{"method": "local"}	2026-11-02 16:11:39.903661+00
129	user	6	login	6	{"method": "local"}	2026-11-02 16:18:48.270419+00
130	user	7	login	7	{"method": "local"}	2026-11-18 06:32:20.99387+00
131	awp_cycle	1	open	7	{"status": "open"}	2026-11-18 06:37:35.231936+00
132	awp_cycle	1	closed	7	{"status": "closed"}	2026-11-18 06:37:36.24116+00
133	awp_cycle	1	open	7	{"status": "open"}	2026-11-18 06:37:38.798407+00
134	awp_cycle	1	closed	7	{"status": "closed"}	2026-11-18 06:37:40.301901+00
135	user	6	login	6	{"method": "local"}	2026-11-18 07:03:38.954236+00
136	awp_cycle	5	open	6	{"year": 2027, "title": "Annual work plan phase 1 check", "status": "open"}	2026-11-18 07:03:39.005113+00
137	user	5	login	5	{"method": "local"}	2026-11-18 07:03:39.070166+00
138	proposal	6	create	5	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0003"}	2026-11-18 07:03:39.10237+00
139	proposal	6	submit	5	{"role": "PCC", "stage": "pcc_route", "awpCycleId": 5}	2026-11-18 07:03:39.118491+00
140	user	6	login	6	{"method": "local"}	2026-11-18 07:03:39.192103+00
141	user	6	login	6	{"method": "local"}	2026-11-18 07:04:23.410424+00
142	user	6	login	6	{"method": "local"}	2026-11-18 07:04:23.479443+00
143	workflow_task	10	route	6	{"remarks": "", "nextStage": "dept_review", "projectId": 6}	2026-11-18 07:04:23.526628+00
144	user	1	login	1	{"method": "local"}	2026-11-18 07:04:23.597261+00
145	workflow_task	11	accept	1	{"remarks": "", "nextStage": "incharge_review", "projectId": 6}	2026-11-18 07:04:23.610835+00
146	user	4	login	4	{"method": "local"}	2026-11-18 07:04:23.67822+00
147	workflow_task	12	schedule	4	{"remarks": "after the monsoon window", "nextStage": "hod_endorse", "projectId": 6}	2026-11-18 07:04:23.692133+00
148	user	1	login	1	{"method": "local"}	2026-11-18 07:04:23.75592+00
149	workflow_task	13	endorse	1	{"remarks": "", "nextStage": null, "projectId": 6}	2026-11-18 07:04:23.772044+00
150	user	3	login	3	{"method": "local"}	2026-11-18 07:04:23.841315+00
151	user	8	login	8	{"method": "local"}	2026-11-18 07:04:23.927276+00
152	user	9	login	9	{"method": "local"}	2026-11-18 07:04:24.015038+00
153	user	6	login	6	{"method": "local"}	2026-11-18 07:04:24.110095+00
154	user	5	login	5	{"method": "local"}	2026-11-18 07:04:24.195277+00
155	user	5	login	5	{"method": "local"}	2026-11-18 07:04:33.113134+00
156	proposal	7	create	5	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0004"}	2026-11-18 07:04:33.129696+00
157	proposal	7	submit	5	{"role": "PCC", "stage": "pcc_route", "awpCycleId": null}	2026-11-18 07:04:33.139309+00
158	user	6	login	6	{"method": "local"}	2026-11-18 07:04:33.202028+00
159	workflow_task	14	route	6	{"remarks": "", "nextStage": "dept_review", "projectId": 7}	2026-11-18 07:04:33.220701+00
160	user	1	login	1	{"method": "local"}	2026-11-18 07:04:33.279462+00
161	workflow_task	15	accept	1	{"remarks": "", "nextStage": "in_year_hod", "projectId": 7}	2026-11-18 07:04:33.290219+00
162	user	1	login	1	{"method": "local"}	2026-11-18 07:04:33.352158+00
163	workflow_task	16	endorse	1	{"remarks": "", "nextStage": null, "projectId": 7}	2026-11-18 07:04:33.363263+00
166	proposal	8	submit	5	{"role": "PCC", "stage": "pcc_route", "awpCycleId": null}	2026-11-18 07:04:33.438576+00
168	workflow_task	17	route	6	{"remarks": "", "nextStage": "dept_review", "projectId": 8}	2026-11-18 07:04:33.520898+00
170	workflow_task	18	accept	1	{"remarks": "", "nextStage": "short_term_hod", "projectId": 8}	2026-11-18 07:04:33.591409+00
172	workflow_task	19	endorse	1	{"remarks": "", "nextStage": "short_term_close", "projectId": 8}	2026-11-18 07:04:33.666999+00
174	workflow_task	20	complete_work	1	{"remarks": "", "nextStage": null, "projectId": 8}	2026-11-18 07:04:33.740054+00
164	user	5	login	5	{"method": "local"}	2026-11-18 07:04:33.424263+00
167	user	6	login	6	{"method": "local"}	2026-11-18 07:04:33.509976+00
169	user	1	login	1	{"method": "local"}	2026-11-18 07:04:33.579732+00
171	user	1	login	1	{"method": "local"}	2026-11-18 07:04:33.654279+00
173	user	1	login	1	{"method": "local"}	2026-11-18 07:04:33.727322+00
175	user	7	login	7	{"method": "local"}	2026-11-18 07:04:33.80189+00
176	user	6	login	6	{"method": "local"}	2026-11-18 07:04:33.87487+00
165	proposal	8	create	5	{"typeCode": "D1-ACID", "proposalNumber": "P-2026-0005"}	2026-11-18 07:04:33.432097+00
177	user	7	logout	7	{}	2026-11-18 09:56:28.452885+00
\.


--
-- TOC entry 4360 (class 0 OID 116447)
-- Dependencies: 308
-- Data for Name: audit_log_2027; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2027 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4361 (class 0 OID 116456)
-- Dependencies: 309
-- Data for Name: audit_log_2028; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2028 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4362 (class 0 OID 116465)
-- Dependencies: 310
-- Data for Name: audit_log_2029; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2029 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4363 (class 0 OID 116474)
-- Dependencies: 311
-- Data for Name: audit_log_2030; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2030 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4364 (class 0 OID 116483)
-- Dependencies: 312
-- Data for Name: audit_log_2031; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2031 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4365 (class 0 OID 116492)
-- Dependencies: 313
-- Data for Name: audit_log_2032; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2032 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4366 (class 0 OID 116501)
-- Dependencies: 314
-- Data for Name: audit_log_2033; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_2033 (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4367 (class 0 OID 116510)
-- Dependencies: 315
-- Data for Name: audit_log_default; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.audit_log_default (id, entity, entity_id, action, actor_id, payload, created_at) FROM stdin;
\.


--
-- TOC entry 4292 (class 0 OID 115749)
-- Dependencies: 239
-- Data for Name: awp_cycles; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.awp_cycles (id, year, title, window_open, window_close, status, created_at, updated_at, masters_updated_at, invitation_sent_at, package_status, consolidated_body, disha_payload, published_at, reminder_offsets) FROM stdin;
1	2026	Annual work programme 2026	2026-11-01 03:30:00+00	2027-03-31 12:30:00+00	closed	2026-10-26 18:05:52.244155+00	2026-11-18 06:37:40.300762+00	\N	\N	\N	\N	\N	\N	{7,3,1}
5	2027	Annual work plan phase 1 check	2026-11-18 07:03:38.96+00	2026-12-18 07:03:38.96+00	open	2026-11-18 07:03:38.991336+00	2026-11-18 07:04:24.118627+00	2026-11-18 07:03:39.004005+00	2026-11-18 07:03:39.004005+00	published	Annual work plan phase 1 check (2027)\nConsolidated annual work plan\n\nDepartment I - Production\n- P-2026-0003 · Phase 1 corrosion check · Q3 · priority 2\n	{"kind": "AWP", "cycle": {"year": 2027, "title": "Annual work plan phase 1 check", "publishedAt": "2026-11-18T07:04:24.120Z"}, "source": "IPEOT", "projects": [{"title": "Phase 1 corrosion check", "status": "published", "quarter": "Q3", "priority": 2, "schedule": "scheduled", "department": "D1", "dependency": null, "proposalNumber": "P-2026-0003"}]}	2026-11-18 07:04:24.118627+00	{7,3,1}
\.


--
-- TOC entry 4382 (class 0 OID 135774)
-- Dependencies: 330
-- Data for Name: awp_package_tasks; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.awp_package_tasks (id, awp_cycle_id, stage_code, stage_name, assignee_role_code, status, action, remarks, due_at, completed_at, completed_by, created_at) FROM stdin;
1	5	hoi_review	HOI review of the AWP	HOI	completed	endorse	\N	2026-11-25 07:04:23.776283+00	2026-11-18 07:04:23.852806+00	3	2026-11-18 07:04:23.776283+00
2	5	tac_review	TAC meeting	TAC	completed	authorize	\N	2026-11-25 07:04:23.852806+00	2026-11-18 07:04:23.940518+00	8	2026-11-18 07:04:23.852806+00
3	5	director_review	Director approval of the TAC output	DIRECTOR	completed	authorize	\N	2026-11-25 07:04:23.940518+00	2026-11-18 07:04:24.031237+00	9	2026-11-18 07:04:23.940518+00
4	5	publish	Publish the final AWP	PCC	completed	publish	\N	2026-11-25 07:04:24.031237+00	2026-11-18 07:04:24.118627+00	6	2026-11-18 07:04:24.031237+00
\.


--
-- TOC entry 4380 (class 0 OID 135762)
-- Dependencies: 328
-- Data for Name: awp_reminder_log; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.awp_reminder_log (awp_cycle_id, offset_days, sent_at) FROM stdin;
\.


--
-- TOC entry 4300 (class 0 OID 115849)
-- Dependencies: 247
-- Data for Name: awp_submissions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.awp_submissions (id, awp_cycle_id, proposal_id, submitted_by, submitted_at) FROM stdin;
1	1	1	7	2026-10-26 17:08:53.642821+00
3	5	6	5	2026-11-18 07:03:39.107278+00
\.


--
-- TOC entry 4328 (class 0 OID 116114)
-- Dependencies: 275
-- Data for Name: calibrations; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.calibrations (id, instrument_id, calibrated_at, valid_until, certificate_file_id, notes) FROM stdin;
\.


--
-- TOC entry 4336 (class 0 OID 116213)
-- Dependencies: 283
-- Data for Name: consumables; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.consumables (id, name, sku, quantity, unit, lab_location_id) FROM stdin;
\.


--
-- TOC entry 4269 (class 0 OID 115528)
-- Dependencies: 216
-- Data for Name: departments; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.departments (id, code, name, active, created_at, updated_at) FROM stdin;
1	D1	Department I - Production	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
2	D2	Department II - Process and RRE	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
3	D3	Department III - Corrosion and Scale	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
4	D4	Department IV - Artificial Lift	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
5	D5	Department V - Deep Water	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
6	D6	Department VI - Structure and Geotech	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
7	D7	Department VII	t	2026-10-26 16:33:32.156329+00	2026-10-26 16:33:32.156329+00
\.


--
-- TOC entry 4348 (class 0 OID 116331)
-- Dependencies: 295
-- Data for Name: distribution_log; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.distribution_log (id, project_id, audience, recipient, channel, sent_at) FROM stdin;
\.


--
-- TOC entry 4314 (class 0 OID 115985)
-- Dependencies: 261
-- Data for Name: files; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.files (id, storage_key, original_name, mime, size_bytes, virus_scan_status, uploaded_by, created_at) FROM stdin;
\.


--
-- TOC entry 4346 (class 0 OID 116310)
-- Dependencies: 293
-- Data for Name: final_reports; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.final_reports (id, project_id, file_id, locked_at, signature, created_at) FROM stdin;
\.


--
-- TOC entry 4273 (class 0 OID 115559)
-- Dependencies: 220
-- Data for Name: installations; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.installations (id, code, name, work_centre_id, active, created_at) FROM stdin;
\.


--
-- TOC entry 4326 (class 0 OID 116098)
-- Dependencies: 273
-- Data for Name: instruments; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.instruments (id, code, name, lab_location_id, active) FROM stdin;
\.


--
-- TOC entry 4357 (class 0 OID 116420)
-- Dependencies: 304
-- Data for Name: integration_outbox; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.integration_outbox (id, kind, payload, status, attempts, last_error, created_at, sent_at) FROM stdin;
\.


--
-- TOC entry 4318 (class 0 OID 116021)
-- Dependencies: 265
-- Data for Name: iso_document_versions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.iso_document_versions (id, document_id, version_no, content, file_id, approved_by, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 4316 (class 0 OID 116003)
-- Dependencies: 263
-- Data for Name: iso_documents; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.iso_documents (id, project_id, doc_type, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4322 (class 0 OID 116072)
-- Dependencies: 269
-- Data for Name: lab_locations; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.lab_locations (id, code, name, department_id, active) FROM stdin;
\.


--
-- TOC entry 4338 (class 0 OID 116227)
-- Dependencies: 285
-- Data for Name: maintenance_tickets; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.maintenance_tickets (id, instrument_id, title, status, opened_by, created_at) FROM stdin;
\.


--
-- TOC entry 4320 (class 0 OID 116052)
-- Dependencies: 267
-- Data for Name: milestones; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.milestones (id, project_id, title, due_at, completed_at, pas_document_id, sort_order, created_at) FROM stdin;
\.


--
-- TOC entry 4353 (class 0 OID 116385)
-- Dependencies: 300
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.notification_preferences (user_id, email_enabled, sms_enabled, digest) FROM stdin;
\.


--
-- TOC entry 4352 (class 0 OID 116369)
-- Dependencies: 299
-- Data for Name: notifications; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.notifications (id, user_id, title, body, channel, read_at, payload, created_at) FROM stdin;
1	5	AWP is open — Annual work plan phase 1 check	The annual work plan is open. Submit projects within one month in the fixed template. The window runs from Wed Nov 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time) to Fri Dec 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time). There is no provision for a late submission into this AWP.	email	\N	{"kind": "invitation", "cycleId": 5}	2026-11-18 07:03:38.999973+00
2	2	AWP is open — Annual work plan phase 1 check	The annual work plan is open. Submit projects within one month in the fixed template. The window runs from Wed Nov 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time) to Fri Dec 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time). There is no provision for a late submission into this AWP.	email	\N	{"kind": "invitation", "cycleId": 5}	2026-11-18 07:03:39.003152+00
3	5	P-2026-0003 is in the published AWP	P-2026-0003 · Phase 1 corrosion check\nP-2026-0003 is in the published AWP	in_app	\N	{"kind": "published", "actorId": 6, "proposalId": 6}	2026-11-18 07:04:24.118627+00
4	5	P-2026-0004 is approved as an in-year study	P-2026-0004 · In-year leak investigation\nP-2026-0004 is approved as an in-year study	in_app	\N	{"kind": "in_year_approved", "actorId": 1, "proposalId": 7}	2026-11-18 07:04:33.360528+00
5	5	P-2026-0005 is closed as short-term work	P-2026-0005 · Short-term coupon check\nP-2026-0005 is closed as short-term work	in_app	\N	{"kind": "short_term_closed", "actorId": 1, "proposalId": 8}	2026-11-18 07:04:33.735793+00
\.


--
-- TOC entry 4379 (class 0 OID 135744)
-- Dependencies: 327
-- Data for Name: outbound_mail; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.outbound_mail (id, awp_cycle_id, kind, recipient_user_id, recipient_email, subject, body, created_at) FROM stdin;
1	5	invitation	5	coordinator@ipeot.local	AWP is open — Annual work plan phase 1 check	The annual work plan is open. Submit projects within one month in the fixed template. The window runs from Wed Nov 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time) to Fri Dec 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time). There is no provision for a late submission into this AWP.	2026-11-18 07:03:39.002407+00
2	5	invitation	2	l3@ipeot.local	AWP is open — Annual work plan phase 1 check	The annual work plan is open. Submit projects within one month in the fixed template. The window runs from Wed Nov 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time) to Fri Dec 18 2026 07:03:38 GMT+0000 (Coordinated Universal Time). There is no provision for a late submission into this AWP.	2026-11-18 07:03:39.003587+00
3	5	published	5	coordinator@ipeot.local	P-2026-0003 is in the published AWP	P-2026-0003 · Phase 1 corrosion check\nP-2026-0003 is in the published AWP	2026-11-18 07:04:24.118627+00
4	\N	in_year_approved	5	coordinator@ipeot.local	P-2026-0004 is approved as an in-year study	P-2026-0004 · In-year leak investigation\nP-2026-0004 is approved as an in-year study	2026-11-18 07:04:33.360528+00
5	\N	short_term_closed	5	coordinator@ipeot.local	P-2026-0005 is closed as short-term work	P-2026-0005 · Short-term coupon check\nP-2026-0005 is closed as short-term work	2026-11-18 07:04:33.735793+00
\.


--
-- TOC entry 4279 (class 0 OID 115610)
-- Dependencies: 226
-- Data for Name: permissions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.permissions (id, code, name, description) FROM stdin;
1	admin.users.read	Read users	\N
2	admin.users.write	Assign roles	\N
3	admin.masters.read	Read master data	\N
4	admin.masters.write	Edit master data	\N
5	admin.matrix.read	Read approval matrix	\N
6	admin.matrix.write	Edit approval matrix	\N
7	admin.audit.read	Read audit log	\N
8	proposals.read	Read proposals	\N
9	proposals.write	Edit proposals	\N
10	proposals.submit	Submit proposals	\N
11	workflow.act	Act on workflow tasks	\N
12	projects.read	Read projects	\N
13	projects.write	Edit projects	\N
14	awp.read	Read AWP cycles	\N
15	awp.write	Manage AWP cycles	\N
16	dashboards.read	Read dashboards	\N
17	reports.write	Edit reports	\N
18	lims.read	Read LIMS	\N
19	lims.write	Edit LIMS	\N
20	team.allot	Allot project team	\N
\.


--
-- TOC entry 4375 (class 0 OID 135709)
-- Dependencies: 323
-- Data for Name: project_routes; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.project_routes (project_id, department_id) FROM stdin;
6	1
7	1
8	1
\.


--
-- TOC entry 4312 (class 0 OID 115959)
-- Dependencies: 259
-- Data for Name: project_team; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.project_team (id, project_id, user_id, role_on_project, allotted_by, created_at) FROM stdin;
\.


--
-- TOC entry 4290 (class 0 OID 115726)
-- Dependencies: 237
-- Data for Name: project_types; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.project_types (id, code, name, department_id, work_centre_id, active, created_at, updated_at) FROM stdin;
1	D1-ACID	Suitable acid stimulation treatment	1	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
2	D1-SAND	Sand control	1	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
3	D1-SOLVENT	Solvent design for organic deposition	1	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
4	D1-AFRAC	Acid fracturing design for tight carbonate reservoirs	1	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
5	D1-WOBRINE	Suitable workover brine	1	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
6	D1-WINTEG	Well integrity assessment	1	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
7	D2-FGR	Flare gas recovery assessment	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
8	D2-ADEQ-PROC	Adequacy check of processing facilities	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
9	D2-ADEQ-HX	Adequacy check of heat exchangers	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
10	D2-ADEQ-FLARE	Adequacy check of flare system	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
11	D2-GDU	Conceptualization of GDU and DPD facilities	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
12	D2-SCHEME	Scheme conceptualization of surface facilities	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
13	D2-MERGE	Feasibility study for merging of installations	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
14	D2-SHRINK	Shrinkage factor or VAP estimation	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
15	D2-FLOW	Flow assurance studies	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
16	D2-PPD	Crude characterization and PPD dose optimization	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
17	D2-GAS	Gas compositional analysis	2	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
18	D2-QRA-ON	QRA study (onshore)	2	1	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
19	D2-QRA-OFF	QRA study (offshore)	2	1	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
20	D2-HAZOP	HAZOP study	2	1	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
21	D2-EERA	EERA study	2	1	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
22	D3-CA	Corrosivity assessment (CA)	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
23	D3-MOC	Corrosivity assessment and material recommendation (MOC)	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
24	D3-RCA	Failure analysis or root cause analysis (RCA)	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
25	D3-MT	Material testing (MT)	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
26	D3-SM	Scale mitigation (SM)	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
27	D3-CP	Review of cathodic protection of jackets (CP)	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
28	D3-PAINT	Coating and painting	3	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
29	D4-CGL	Continuous gas lift design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
30	D4-IGL	Intermittent gas lift design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
31	D4-SRP	Sucker rod pump design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
32	D4-ESP	Electrical submersible pump design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
33	D4-PCP	Progressive cavity pump design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
34	D4-PLF	Plunger lift design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
35	D4-JP	Jet pump design and optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
36	D4-GLNO	Gas lift network optimization	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
37	D4-LMS	Artificial lift mode selection	4	\N	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
38	D6-SOIL-JKT	Soil investigation for jacket platform locations	6	4	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
39	D6-SOIL-JU	Soil investigation for jack-up rig locations	6	4	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
40	D6-SOIL-MOOR	Soil investigation for mooring buoy or MOPU locations	6	4	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
41	D6-SSA	Site-specific assessment of jack-up rigs	6	4	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
42	D6-GEOTECH	Other offshore geotechnics studies	6	4	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
43	D6-LIFE	Life extension study	6	3	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
44	D6-SIA	Structural integrity assessment (SIA)	6	3	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
45	D5-LH	Liquid holdup estimation and liquid management strategy for trunklines	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
46	D5-SA	Surge analysis	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
47	D5-FH	Flow hydraulic study (offshore lines)	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
48	D5-FR	Field development scheme or feasibility report (offshore)	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
49	D5-NA	Nodal analysis study (offshore networks)	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
50	D5-TS	Transient simulation for deepwater networks	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
51	D5-VL	VLP studies for upcoming offshore fields	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
52	D5-SU	Field start-up studies	5	\N	t	2026-10-26 17:01:40.961349+00	2026-10-26 17:01:40.961349+00
\.


--
-- TOC entry 4294 (class 0 OID 115762)
-- Dependencies: 241
-- Data for Name: projects; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.projects (id, project_category, department_id, work_centre_id, project_type_id, title, status, wbs_number, accession_number, awp_cycle_id, created_by, created_at, updated_at, priority, preferred_quarter, final_quarter, schedule_decision, dependency_note, intake, rejection_reason, removal_reason, scope_note, job_tags, parent_department_id, short_term_outcome, short_term_effort) FROM stdin;
1	scheduled	1	\N	1	Acid stimulation for NH	authorized	\N	\N	1	7	2026-10-26 17:04:05.904395+00	2026-10-27 09:57:04.968944+00	\N	\N	\N	\N	\N	awp	\N	\N	\N	\N	\N	\N	\N
5	scheduled	2	2	15	test	draft	\N	\N	\N	7	2026-10-27 10:22:47.847056+00	2026-10-27 10:22:47.847056+00	\N	\N	\N	\N	\N	awp	\N	\N	\N	\N	\N	\N	\N
6	scheduled	1	\N	1	Phase 1 corrosion check	published	\N	\N	5	5	2026-11-18 07:03:39.091255+00	2026-11-18 07:04:24.118627+00	2	Q2	Q3	scheduled	\N	awp	\N	\N	after the monsoon window	corrosion, pipeline	\N	\N	\N
7	unscheduled	1	\N	1	In-year leak investigation	in_year_approved	\N	\N	\N	5	2026-11-18 07:04:33.12646+00	2026-11-18 07:04:33.360528+00	4	Q1	\N	\N	\N	in_year	\N	\N	\N		\N	\N	\N
8	short_term	1	\N	1	Short-term coupon check	short_term_closed	\N	\N	\N	5	2026-11-18 07:04:33.430266+00	2026-11-18 07:04:33.735793+00	4	Q1	\N	\N	\N	awp	\N	\N	\N		\N	Coupon replaced	3 days
\.


--
-- TOC entry 4377 (class 0 OID 135725)
-- Dependencies: 325
-- Data for Name: proposal_files; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.proposal_files (id, proposal_id, file_name, mime, size_bytes, content, uploaded_by, created_at) FROM stdin;
1	6	scope.txt	text/plain	13	\\x73636f7065206f6620776f726b	5	2026-11-18 07:03:39.091255+00
\.


--
-- TOC entry 4298 (class 0 OID 115828)
-- Dependencies: 245
-- Data for Name: proposal_versions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.proposal_versions (id, proposal_id, version_no, snapshot, reason, created_by, created_at) FROM stdin;
1	1	1	{"form": {"asset": "NH", "answers": {"0": "Field file attached"}, "specimens": {"0": "", "1": "", "2": ""}}, "title": "Acid stimulation for NH", "category": "scheduled"}	\N	7	2026-10-26 17:04:05.904395+00
5	5	1	{"form": {"asset": "", "answers": {"0": ""}, "specimens": {}}, "title": "test", "category": "scheduled"}	\N	7	2026-10-27 10:22:47.847056+00
6	6	1	{"form": {"asset": "Mumbai High", "answers": {"0": ""}, "specimens": {"0": "", "1": "", "2": ""}}, "title": "Phase 1 corrosion check", "category": "scheduled"}	\N	5	2026-11-18 07:03:39.091255+00
7	7	1	{"form": {"asset": "", "answers": {"0": ""}, "specimens": {"0": "", "1": "", "2": ""}}, "title": "In-year leak investigation", "category": "unscheduled"}	\N	5	2026-11-18 07:04:33.12646+00
8	8	1	{"form": {"asset": "", "answers": {"0": ""}, "specimens": {"0": "", "1": "", "2": ""}}, "title": "Short-term coupon check", "category": "short_term"}	\N	5	2026-11-18 07:04:33.430266+00
\.


--
-- TOC entry 4296 (class 0 OID 115802)
-- Dependencies: 243
-- Data for Name: proposals; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.proposals (id, project_id, proposal_number, form, current_version, submitted_at, created_by, created_at, updated_at) FROM stdin;
1	1	P-2026-0001	{"asset": "NH", "answers": {"0": "Field file attached"}, "specimens": {"0": "", "1": "", "2": ""}}	1	2026-10-26 17:08:53.642821+00	7	2026-10-26 17:04:05.904395+00	2026-10-26 17:08:53.642821+00
5	5	P-2026-0002	{"asset": "", "answers": {"0": ""}, "specimens": {}}	1	\N	7	2026-10-27 10:22:47.847056+00	2026-10-27 10:22:47.847056+00
6	6	P-2026-0003	{"asset": "Mumbai High", "answers": {"0": ""}, "specimens": {"0": "", "1": "", "2": ""}}	1	2026-11-18 07:03:39.107278+00	5	2026-11-18 07:03:39.091255+00	2026-11-18 07:03:39.107278+00
7	7	P-2026-0004	{"asset": "", "answers": {"0": ""}, "specimens": {"0": "", "1": "", "2": ""}}	1	2026-11-18 07:04:33.135898+00	5	2026-11-18 07:04:33.12646+00	2026-11-18 07:04:33.135898+00
8	8	P-2026-0005	{"asset": "", "answers": {"0": ""}, "specimens": {"0": "", "1": "", "2": ""}}	1	2026-11-18 07:04:33.436309+00	5	2026-11-18 07:04:33.430266+00	2026-11-18 07:04:33.436309+00
\.


--
-- TOC entry 4344 (class 0 OID 116291)
-- Dependencies: 291
-- Data for Name: report_approvals; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.report_approvals (id, version_id, stage_code, action, actor_id, remarks, created_at) FROM stdin;
\.


--
-- TOC entry 4340 (class 0 OID 116247)
-- Dependencies: 287
-- Data for Name: report_drafts; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.report_drafts (id, project_id, sections, ai_generated, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4342 (class 0 OID 116270)
-- Dependencies: 289
-- Data for Name: report_versions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.report_versions (id, draft_id, version_no, snapshot, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 4284 (class 0 OID 115666)
-- Dependencies: 231
-- Data for Name: role_delegations; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.role_delegations (id, from_user_id, to_user_id, role_id, starts_at, ends_at, reason, active, created_at) FROM stdin;
\.


--
-- TOC entry 4280 (class 0 OID 115619)
-- Dependencies: 227
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.role_permissions (role_id, permission_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
2	3
7	5
2	5
9	8
8	8
7	8
6	8
5	8
4	8
3	8
2	8
4	9
3	9
4	10
9	11
8	11
7	11
6	11
5	11
11	12
10	12
7	12
6	12
5	12
4	12
3	12
2	12
10	13
6	13
3	14
2	14
2	15
10	16
9	16
8	16
7	16
6	16
5	16
4	16
3	16
2	16
10	17
6	17
11	18
10	18
5	18
11	19
6	20
3	11
2	11
4	11
3	10
\.


--
-- TOC entry 4277 (class 0 OID 115599)
-- Dependencies: 224
-- Data for Name: roles; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.roles (id, code, name, description, created_at) FROM stdin;
1	ADMIN	Administrator	User, master data, and matrix administration	2026-10-26 16:32:08.726271+00
2	PCC	Project Coordination Cell	AWP window, portfolio coordination, and WBS fallback	2026-10-26 16:32:08.726271+00
3	COORDINATOR	Coordinator	Proposal routing	2026-10-26 16:32:08.726271+00
4	L3	Level-3 proposer	Submits study proposals	2026-10-26 16:32:08.726271+00
5	IC	In-charge	Technical review	2026-10-26 16:32:08.726271+00
6	HOD	Head of Department	Endorsement and team allotment	2026-10-26 16:32:08.726271+00
7	HOI	Head of Institute	Authorization	2026-10-26 16:32:08.726271+00
8	TAC	Technical Advisory Committee	TAC decision	2026-10-26 16:32:08.726271+00
9	DIRECTOR	Director (Production)	Final authorization	2026-10-26 16:32:08.726271+00
10	CI	Chief Investigator	Project execution	2026-10-26 16:32:08.726271+00
11	LAB	Laboratory	Sample and result handling	2026-10-26 16:32:08.726271+00
\.


--
-- TOC entry 4374 (class 0 OID 135688)
-- Dependencies: 322
-- Data for Name: routing_rules; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.routing_rules (id, project_type_id, department_id, tag, active, created_at) FROM stdin;
1	1	1	\N	t	2026-11-18 07:01:57.187613+00
2	2	1	\N	t	2026-11-18 07:01:57.187613+00
3	3	1	\N	t	2026-11-18 07:01:57.187613+00
4	4	1	\N	t	2026-11-18 07:01:57.187613+00
5	5	1	\N	t	2026-11-18 07:01:57.187613+00
6	6	1	\N	t	2026-11-18 07:01:57.187613+00
7	7	2	\N	t	2026-11-18 07:01:57.187613+00
8	8	2	\N	t	2026-11-18 07:01:57.187613+00
9	9	2	\N	t	2026-11-18 07:01:57.187613+00
10	10	2	\N	t	2026-11-18 07:01:57.187613+00
11	11	2	\N	t	2026-11-18 07:01:57.187613+00
12	12	2	\N	t	2026-11-18 07:01:57.187613+00
13	13	2	\N	t	2026-11-18 07:01:57.187613+00
14	14	2	\N	t	2026-11-18 07:01:57.187613+00
15	15	2	\N	t	2026-11-18 07:01:57.187613+00
16	16	2	\N	t	2026-11-18 07:01:57.187613+00
17	17	2	\N	t	2026-11-18 07:01:57.187613+00
18	18	2	\N	t	2026-11-18 07:01:57.187613+00
19	19	2	\N	t	2026-11-18 07:01:57.187613+00
20	20	2	\N	t	2026-11-18 07:01:57.187613+00
21	21	2	\N	t	2026-11-18 07:01:57.187613+00
22	22	3	\N	t	2026-11-18 07:01:57.187613+00
23	23	3	\N	t	2026-11-18 07:01:57.187613+00
24	24	3	\N	t	2026-11-18 07:01:57.187613+00
25	25	3	\N	t	2026-11-18 07:01:57.187613+00
26	26	3	\N	t	2026-11-18 07:01:57.187613+00
27	27	3	\N	t	2026-11-18 07:01:57.187613+00
28	28	3	\N	t	2026-11-18 07:01:57.187613+00
29	29	4	\N	t	2026-11-18 07:01:57.187613+00
30	30	4	\N	t	2026-11-18 07:01:57.187613+00
31	31	4	\N	t	2026-11-18 07:01:57.187613+00
32	32	4	\N	t	2026-11-18 07:01:57.187613+00
33	33	4	\N	t	2026-11-18 07:01:57.187613+00
34	34	4	\N	t	2026-11-18 07:01:57.187613+00
35	35	4	\N	t	2026-11-18 07:01:57.187613+00
36	36	4	\N	t	2026-11-18 07:01:57.187613+00
37	37	4	\N	t	2026-11-18 07:01:57.187613+00
38	38	6	\N	t	2026-11-18 07:01:57.187613+00
39	39	6	\N	t	2026-11-18 07:01:57.187613+00
40	40	6	\N	t	2026-11-18 07:01:57.187613+00
41	41	6	\N	t	2026-11-18 07:01:57.187613+00
42	42	6	\N	t	2026-11-18 07:01:57.187613+00
43	43	6	\N	t	2026-11-18 07:01:57.187613+00
44	44	6	\N	t	2026-11-18 07:01:57.187613+00
45	45	5	\N	t	2026-11-18 07:01:57.187613+00
46	46	5	\N	t	2026-11-18 07:01:57.187613+00
47	47	5	\N	t	2026-11-18 07:01:57.187613+00
48	48	5	\N	t	2026-11-18 07:01:57.187613+00
49	49	5	\N	t	2026-11-18 07:01:57.187613+00
50	50	5	\N	t	2026-11-18 07:01:57.187613+00
51	51	5	\N	t	2026-11-18 07:01:57.187613+00
52	52	5	\N	t	2026-11-18 07:01:57.187613+00
\.


--
-- TOC entry 4330 (class 0 OID 116132)
-- Dependencies: 277
-- Data for Name: samples; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.samples (id, sample_code, barcode, project_id, received_at, custody, status, created_at) FROM stdin;
\.


--
-- TOC entry 4355 (class 0 OID 116401)
-- Dependencies: 302
-- Data for Name: sap_wbs_jobs; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.sap_wbs_jobs (id, project_id, request, response, status, retry_count, manual_pcc_flag, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4288 (class 0 OID 115712)
-- Dependencies: 235
-- Data for Name: sla_rules; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.sla_rules (id, stage_code, project_category, target_days, reminder_offsets_days, escalation_role_code, active, created_at) FROM stdin;
1	coordinator	\N	5	{2,1}	PCC	t	2026-10-26 16:32:08.726271+00
2	pcc	\N	5	{2,1}	HOI	t	2026-10-26 16:32:08.726271+00
3	ic_review	\N	7	{2,1}	HOD	t	2026-10-26 16:32:08.726271+00
4	hod_endorse	\N	7	{2,1}	HOI	t	2026-10-26 16:32:08.726271+00
5	hoi_authorize	\N	7	{2,1}	DIRECTOR	t	2026-10-26 16:32:08.726271+00
6	tac	\N	14	{2,1}	DIRECTOR	t	2026-10-26 16:32:08.726271+00
7	director	\N	14	{2,1}	HOI	t	2026-10-26 16:32:08.726271+00
8	pcc_route	\N	5	{2,1}	HOI	t	2026-11-18 07:01:57.215225+00
9	dept_review	\N	7	{2,1}	PCC	t	2026-11-18 07:01:57.215225+00
10	clarification	\N	7	{2,1}	HOD	t	2026-11-18 07:01:57.215225+00
11	pcc_return	\N	3	{2,1}	HOI	t	2026-11-18 07:01:57.215225+00
12	incharge_review	\N	7	{2,1}	HOD	t	2026-11-18 07:01:57.215225+00
13	short_term_hod	\N	5	{2,1}	PCC	t	2026-11-18 07:01:57.215225+00
14	short_term_close	\N	15	{2,1}	PCC	t	2026-11-18 07:01:57.215225+00
15	in_year_hod	\N	5	{2,1}	PCC	t	2026-11-18 07:01:57.215225+00
16	hoi_review	\N	7	{2,1}	DIRECTOR	t	2026-11-18 07:01:57.215225+00
17	tac_review	\N	14	{2,1}	DIRECTOR	t	2026-11-18 07:01:57.215225+00
18	director_review	\N	7	{2,1}	HOI	t	2026-11-18 07:01:57.215225+00
19	publish	\N	3	{2,1}	HOI	t	2026-11-18 07:01:57.215225+00
\.


--
-- TOC entry 4372 (class 0 OID 135669)
-- Dependencies: 320
-- Data for Name: stakeholder_units; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.stakeholder_units (id, kind, code, name, coordinator_user_id, active, created_at, updated_at) FROM stdin;
1	asset	MH	Mumbai High	\N	t	2026-11-18 07:04:33.879994+00	2026-11-18 07:04:33.879994+00
\.


--
-- TOC entry 4369 (class 0 OID 116602)
-- Dependencies: 317
-- Data for Name: study_catalogue; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.study_catalogue (project_type_code, sample_report, inputs, specimens, equipment, tests, software, form_schema, updated_at) FROM stdin;
D1-ACID	2462	["Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"]	["Core sample", "formation water sample", "crude oil sample"]	["core flow apparatus"]	["permeability test"]	[]	\N	2026-10-26 17:01:40.961349+00
D1-SAND	3562	["Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"]	["Core sample"]	["Linear flow apparatus", "sieve analysis apparatus"]	["sand control test", "particle size distribution"]	[]	\N	2026-10-26 17:01:40.961349+00
D1-SOLVENT	3528	["Field description,production history,production plan, Reservoir Studies, well completion report, formation water analysis,CBL-VDL report, Build up study report,Gradient surveys"]	["crude oil sample"]	["Viscometer", "SARA analysis apparatus"]	["Viscosity profile and SARA analysis"]	[]	\N	2026-10-26 17:01:40.961349+00
D1-AFRAC	1870	["Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"]	["Core sample", "formation water sample", "crude oil sample"]	["Core Flow Appartus"]	["wormhole testing"]	[{"use": "Acid fracturing", "name": "Gohfer"}]	\N	2026-10-26 17:01:40.961349+00
D1-WOBRINE	2711	["Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report, drilling fluids and work over fluids,"]	["Core sample", "formation water sample", "crude oil sample"]	["core flow apparatus"]	["permeability test"]	[]	\N	2026-10-26 17:01:40.961349+00
D1-WINTEG	3599	["Field description,production history,production plan, Formation evaluation report , Sedimentology report, Reservoir Studies, well completion report, mineralogy report, formation water analysis,CBL-VDL report,Elan logs, Build up study report,Gradient surveys,Artificial lift deisgn report"]	["software needed"]	["WellCat software"]	["integrity test"]	[{"use": "Well integrity analysis", "name": "WellCat"}]	\N	2026-10-26 17:01:40.961349+00
D2-HAZOP	HAZOP Study - Onshore & Offshore	["1. Updated P&ID of the complete facility", "2. Detailed Process Description of the facility.", "3. Updated PFD of the facility.", "4. List of facilities/equipment with Operating and Design Pressure & temperature.", "5. Details of Fire & Gas detection and suppression system.", "6. Mention if H2S is being handled at any of these installation.", "7. SAFE Chart/ Cause and effect diagram (if available).", "8. Previous HAZOP report and its compliance status, if any.", "9. Audit report/Observation, if any.", "10. Reason for the study proposal.", "11. Contact person at Installation, in case any clarification is required."]	[]	[]	[]	[{"use": "Study software", "name": "PHA-Pro"}]	\N	2026-10-26 17:01:40.961349+00
D2-QRA-ON	QRA Study- Onshore	["1. Latest P&ID.", "2. Process description.", "3. Installation layout to the scale.", "4. Process Flow Diagram.", "5. Latest Process parameters of Oil and Gas processed in the installation (Pressure, temperature, Flow rate)", "6. Equipment Details - Size or capacity, Operating parameters (Pressure, Temperature)", "7. Storage tanks- Number of tanks , size or capacity of Tanks and Dyke Details", "8. Latest Well test data", "9. Shift wise manning details with sitting/manned location inside the installation.", "10. Outside population detail (approx. numbers present) within 500m", "11. Probable Ignition sources within the installation", "12. Gas composition data, Oil density data", "13. Flare details- flaring quantity, Flare stack height & Flare stack Diameter.", "14. Firefighting facility details present in the installation.", "15. Wind Rose data of the location", "16. Previous QRA/ HAZOP report.", "17. Any Specific OISD/ DGMS observation relevant to QRA study."]	[]	[]	[]	[{"use": "Study software", "name": "Safeti-Phast"}]	\N	2026-10-26 17:01:40.961349+00
D2-QRA-OFF	QRA Study- Offshore	["1. Latest P&ID.", "2. Process description.", "3. Deck-wise layout to the scale.", "4. Process Flow Diagram.", "5. Current production rate of Oil/ Gas/ Condensate and dispatch pressure/temperature", "6. Deck wise list of Static and Rotary Equipment- with their Size or capacity, Operating Pressure & Temperature", "7. Latest Well test data", "8. Riser Data: Nos. and type of risers (oil/gas/WI) platform wise with size, operating pressure, temperature. Details of fuel gas riser, if any, on the Platform", "9. Distribution of total POB with below mentioned classification: Operations, Maintenance, Production and Domestic.", "10. No. of visits of OSV/MSV/Barge per year including stay time per year.", "11. Helicopter details: No. of crew changes per annum with avg. no. of passengers, flight time, number of stages. No. of fights to unmanned platforms per annum with average passengers.", "12. Well data: Numbers of wells Flowing in bridge connected wellhead platform, if any, and shut in/flowing Well pressure and temperature", "13. Gas composition data, Oil density data (including H2S)", "14. Latest morning DPR", "15. Details of deck wise Life saving Appliances (LSA) i.e. Lifeboats, life rafts along with their capacity", "16. Wind Rose data of the location", "17. Previous QRA/ HAZOP report.", "18. Any Specific OISD/ DGMS observation relevant to QRA study."]	[]	[]	[]	[{"use": "Study software", "name": "Phast"}]	\N	2026-10-26 17:01:40.961349+00
D2-EERA	EERA Study- Offshore	["1. Brief process description of the process complex", "2. Morning DPR", "3. Well test data", "4. Deck Layout drawings & Escape route and stairways layout of the process complex", "5. Details of Lifeboats, its locations and capacity", "6. Details of Life Saving Appliances (LSA)-e.g. Life rafts, life buoys, Rescue boat, Life jackets, oxygen masks , rope ladder, Personnel Transfer basket, and other PPE items etc.", "7. Details of emergency lighting, Muster stations (MS)", "8. Location of Platform Abandon Alarm & MCPs (Manual Call points)", "9. Fire detection/Suppression Systems details", "10. POB details and deck wise manning details", "11. Well SBHP, FTHP, tubing size.", "12. Location of Living quarter, helideck & fire walls present in the complex", "13. ERP/DMP and Risk Register of the complex", "14. Previous EERA study report for the process complex."]	[]	[]	[]	[{"use": "Study software", "name": "Phast"}]	\N	2026-10-26 17:01:40.961349+00
D2-FGR	FG	["Flare gas flow rates, Flare system deisgn datasheet, Operating Parameters", "Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-ADEQ-FLARE	ACF	["Flare gas flow rates, Flare system deisgn datasheet, Operating Parameters", "Production Profile- Oil, Water and Gas", "Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Equipment Datasheets and Drawing (GA)", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-ADEQ-PROC	ACS	["Production Profile- Oil, Water and Gas", "Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Equipment Datasheets and Drawing (GA)", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-ADEQ-HX	ACE	["Production Profile- Oil, Water and Gas", "Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Equipment Datasheets and Drawing (GA)", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-GDU	GDU	["Production Profile- Oil, Water and Gas", "Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Equipment Datasheets and Drawing (GA)", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-SCHEME	SF-FDP	["Production Profile- Oil, Water and Gas", "Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Well locations and Pipeline network"]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-MERGE	FM	["Production Profile- Oil, Water and Gas", "Crude characterization (ASTM D86), Gas composition,", "Equipment Datasheets and Drawing (GA)", "Well locations and Pipeline network", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-SHRINK	SF	["Crude characterization (ASTM D86), Gas composition,", "PFD and P&ID", "Equipment Datasheets and Drawing (GA)", "Well locations and Pipeline network", "Operating Parameters- Pressure, Temperature, FTHP, ABP etc."]	[]	[]	[]	[{"use": "Process modelling and simulation", "name": "Aspen HYSYS"}, {"use": "Flowline hydraulics", "name": "Pipesim"}, {"use": "Flare system analysis", "name": "Flaresim"}, {"use": "Separators adequacy", "name": "Iprocal"}]	\N	2026-10-26 17:01:40.961349+00
D2-FLOW	\N	["Candidate crude samples, Problem statement, Samples of the flow assurance chemicals(if any), Operating Conditions( well head temperature, pressure, reservoir details, production flow rate, water cut, and any other data), existing practices."]	[]	["Rotatory Evaporator", "Low temperature Bath", "Dean Stark Apparatus", "Digital Density Meter", "Centrifuge", "Pour Point Apparatus", "Cross Polar Microscope with Thermal Stage", "SIMDIS-DHA (GC)", "Rheometer", "D-86 Apparatus"]	["Sara Analysis", "wax Content", "Water Content", "Density", "BS & W", "Pour Point", "WAT", "Crude oil profiling", "Wax profiling", "Viscosity", "API Gravity", "Resin Content", "Distillation profile of Crude oil"]	[]	\N	2026-10-26 17:01:40.961349+00
D2-PPD	\N	["candidate crude samples, PPDs/Flow improver, Operating Conditions(temperature and pressure, production flow rate, water cut, and any other pertinent field data), existing practices."]	[]	["Rotatory Evaporator", "Low temperature Bath", "Dean Stark Apparatus", "Digital Density Meter", "Centrifuge", "Pour Point Apparatus", "Cross Polar Microscope with Thermal Stage", "SIMDIS-DHA (GC)", "Rheometer", "D-86 Apparatus"]	["Sara Analysis", "wax Content", "Water Content", "Density", "BS & W", "Pour Point", "WAT", "Crude oil profiling", "Wax profiling", "Viscosity", "API Gravity", "Resin Content", "Distillation profile of Crude oil"]	[]	\N	2026-10-26 17:01:40.961349+00
D2-GAS	\N	["Gas samples"]	[]	["Natural Gas Analyzer (Gas Chromatography)"]	["Natural gas profiling"]	[]	\N	2026-10-26 17:01:40.961349+00
D3-CA	CA	["Material Design properties (Material grade, thickness, Size, Corrosion Allownace)", "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)", "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)", "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)", "Water Analysis (Produced water, injection water, ETP)", "Gas Analysis", "Chemical Dosing History (CI, Biocide, SI)", "GAD, P&ID, Bathymetry", "NDT Reports"]	["Water Sample"]	["Scanning Electron Microscope", "Wet Chemistry Lab"]	["Fractography and surface morphology of failed area", "Water and Corrosion product analysis"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D3-MOC	MOC	["Material Design properties (Material grade, thickness, Size, Corrosion Allownace)", "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)", "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)", "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)", "Water Analysis (Produced water, injection water, ETP)", "Gas Analysis", "Chemical Dosing History (CI, Biocide, SI)", "GAD, P&ID, Bathymetry", "NDT Reports"]	["Crude Oil"]	["Hardness Testing", "Wet Chemistry Lab"]	["Hardness of material", "Water and Corrosion product analysis"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D3-RCA	RCA	["Material Design properties (Material grade, thickness, Size, Corrosion Allownace)", "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)", "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)", "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)", "Water Analysis (Produced water, injection water, ETP)", "Gas Analysis", "Chemical Dosing History (CI, Biocide, SI)", "GAD, P&ID, Bathymetry", "NDT Reports"]	["Failed material"]	["Semi Automatic Grinding Polishing", "Wet Chemistry Lab"]	["Sample preparation for visualising in inverted microsope", "Water and Corrosion product analysis"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D3-MT	MT	["Material Design properties (Material grade, thickness, Size, Corrosion Allownace)", "Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)", "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)", "Operating History (Leakage details, maintenance practices followed like pigging and chemical dosing, coating and painting, etc)"]	["Corrosion Inhibitor"]	["Inverted Microscope"]	["Inclusions and Microstructure check"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D3-SM	SM	["Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)", "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)", "Water Analysis (Produced water, injection water, ETP)"]	["Sacle Inhibitor"]	["Stereo Microscope"]	["surface morphology of failed area"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D3-PAINT	Paint	["Design Parameters (Pressure, Temperature, Flow rates, CO2/H2S)", "Operating Parameters (Pressure, Temperature, Flow rates, CO2/H2S, Sand production)", "Chemical Dosing History (CI, Biocide, SI)"]	[]	["Auto Titrator"]	["Water Analysis"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D3-CP	CP	["Gas Analysis", "Jacket drawing"]	[]	["HPHT Autoclave / Potentiostat"]	["Corrosion Rate prediction"]	[{"use": "Corrosion Rate", "name": "Predict"}, {"use": "Material Selection, Flow Regime, Cracking Vulnerability", "name": "CorrShaman"}, {"use": "Scaling Tendency", "name": "DownholeSAT"}, {"use": "Flow Velocity, T/P Profile", "name": "PipeSim"}]	\N	2026-10-26 17:01:40.961349+00
D4-CGL	CGL	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)", "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)", "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	[]	[]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-IGL	IGL	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)", "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)", "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)", "Intermittent Cycle Data (Injection/cycle time, surface choke or controller settings, tubing/casing pressure chart)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	[]	[]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D5-SU	Prepared with MDT approach	["Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Bathymetry data", "Fluid composition/Gas composition", "Equipment capacity/data sheets"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D6-SOIL-JKT	SIR_PL	["Soil Samples collected from the borehole locations", "In-situ Test Results/ CPTU Raw Data", "On-board Lab test results", "Draft Soil Investigation Report", "Jack-up rig Specifications"]	["Soil Samples"]	["Temperature Regulated Water Bath"]	["Hydrometer Analysis"]	[{"use": "Mudmat Capacity Analysis", "name": "MATCAP"}, {"use": "Pile Group Effect", "name": "GALLOP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "COMPILE"}, {"use": "Jack-up Leg Penetration Analysis", "name": "MAHAJACK"}, {"use": "Graph Plotting", "name": "Grapher"}, {"use": "Pile Driveability Analysis", "name": "GRLWEAP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "OPILE"}]	\N	2026-10-26 17:01:40.961349+00
D4-SRP	SRP	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "SRP Data (Pumping unit, rod taper, pump size/depth, SPM, stroke length, prime mover, dynamometer card, fluid level)", "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)", "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	["GAP"]	["Gas lift network optimization", "gas allocation"]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-ESP	ESP	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "ESP Data (Pump model & stages, motor HP/voltage/amps, cable, VSD frequency, intake pressure, ammeter chart)", "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)", "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	["PC-PUMP"]	["PCP design and performance analysis"]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-PCP	PCP	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "PCP Data (Pump model, rotor/stator & elastomer, RPM, torque, drive head, rod/tubing configuration)", "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)", "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	["RODSTAR"]	["SRP design", "wave-equation analysis & dynamometer diagnostics"]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-PLF	PLF	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)", "Intermittent Cycle Data (Injection/cycle time, surface choke or controller settings, tubing/casing pressure chart)", "Plunger Lift Data (Plunger type, tubing/casing pressure build-up cycles, GLR, line pressure, surface equipment)", "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)", "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)"]	[]	[]	[]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-JP	JP	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)", "Jet Pump Data (Nozzle & throat size, power fluid type, rate & pressure, surface pump/power fluid system, return flow)", "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)", "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	["Software"]	[]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-GLNO	GLNO	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "Gas Lift Data (Injection gas rate & pressure, GL valve details & test-rack pressures, operating valve depth)", "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)", "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	["PIPESIM"]	["Well modelling", "nodal analysis", "GL design", "ESP/PCP", "T/P profile", "flow velocity"]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D4-LMS	LMS	["Well Completion Data (Casing/tubing size & depth, perforations, deviation survey, well schematic, GL mandrel depths)", "Reservoir & IPR Data (Static pressure, PI / Vogel IPR inputs, reservoir temperature)", "Fluid PVT Data (API gravity, GOR, bubble point, gas SG, water salinity, viscosity)", "Well Test Data (Liquid rate, water cut, GOR/GLR, WHP, CHP, FBHP)", "Pressure & Temperature Survey (Flowing gradient survey, static gradient survey, FBHP/FBHT)", "Gas Availability & Gas Analysis (Compressor discharge pressure, lift gas header pressure, gas composition)", "Surface Network Data (Flowline length/ID, manifold & header/GGS pressures, gas distribution lines, elevation profile)", "Intermittent Cycle Data (Injection/cycle time, surface choke or controller settings, tubing/casing pressure chart)", "SRP Data (Pumping unit, rod taper, pump size/depth, SPM, stroke length, prime mover, dynamometer card, fluid level)", "ESP Data (Pump model & stages, motor HP/voltage/amps, cable, VSD frequency, intake pressure, ammeter chart)", "PCP Data (Pump model, rotor/stator & elastomer, RPM, torque, drive head, rod/tubing configuration)", "Plunger Lift Data (Plunger type, tubing/casing pressure build-up cycles, GLR, line pressure, surface equipment)", "Jet Pump Data (Nozzle & throat size, power fluid type, rate & pressure, surface pump/power fluid system, return flow)", "Water, Sand & Solids Analysis (Produced water, sand production, scale/corrosion, emulsion/viscosity)", "Production & Workover History (Pull-out/failure reports, run life, downhole equipment failures)", "Operational Constraints & Targets (Compressor capacity, gas availability, power limits, target rate, economics)"]	[]	["PROSPER", "GAP", "PC-PUMP", "RODSTAR"]	["Well modelling", "nodal analysis", "GL design", "T/P profile", "flow velocity", "Gas lift network optimization", "gas allocation", "PCP design and performance analysis", "SRP design", "wave-equation analysis & dynamometer diagnostics"]	[{"use": "Well modelling, nodal analysis, GL design, ESP/PCP, T/P profile, flow velocity", "name": "PIPESIM"}, {"use": "Well modelling, nodal analysis, GL design, T/P profile, flow velocity", "name": "PROSPER"}, {"use": "Gas lift network optimization, gas allocation", "name": "GAP"}, {"use": "PCP design and performance analysis", "name": "PC-PUMP"}, {"use": "SRP design, wave-equation analysis & dynamometer diagnostics", "name": "RODSTAR"}]	\N	2026-10-26 17:01:40.961349+00
D5-LH	Attached	["Current production data", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Bathymetry data", "Fluid composition/Gas composition", "Equipment capacity/data sheets", "Pigging reports"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D5-SA	Attached	["Current production data", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Bathymetry data", "Fluid composition/Gas composition", "Equipment capacity/data sheets", "Pigging reports"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D5-FH	Attached	["Long term Production profile (Oil, Water and Gas)", "Current production data", "A-Lift details", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Back pressure at WHP", "Bathymetry data", "Fluid composition/Gas composition", "Equipment capacity/data sheets"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D5-FR	(Prepared with MDT approach)	["Pressure-Production profile", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Bathymetry data", "Fluid composition/Gas composition", "Equipment capacity/data sheets"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D5-NA	Attached	["Long term Production profile (Oil, Water and Gas)", "Current production data", "A-Lift details", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Bathymetry data", "FGS data(flowing gradient survey) of wells", "Fluid composition/Gas composition", "Equipment capacity/data sheets"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D5-TS	Attached	["Pressure-Production profile", "Current production data", "A-Lift details", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "Bathymetry data", "Fluid composition/Gas composition", "Equipment capacity/data sheets"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D5-VL	(Prepared with MDT approach)	["Pressure-Production profile", "Crude oil Viscosity profile & API data", "Node Pressure and temperatures", "FGS data(flowing gradient survey) of wells", "Fluid composition/Gas composition"]	["Oil sample"]	[]	[]	[{"use": "Nodal Analysis, Flow Assurance, Pipeline Sizing, etc", "name": "OLGA"}, {"use": "Nodal Analysis, Flow Assurance", "name": "PIPESIM"}, {"use": "Cost Estimation", "name": "Multiflash"}, {"use": "", "name": "Questor"}]	\N	2026-10-26 17:01:40.961349+00
D6-SOIL-JU	SIR_JCK	["Soil Samples collected from the borehole locations", "In-situ Test Results/ CPTU Raw Data", "On-board Lab test results", "Draft Soil Investigation Report", "Jack-up rig Specifications"]	[]	["Distillation Unit"]	["Hydrometer Analysis"]	[{"use": "Mudmat Capacity Analysis", "name": "MATCAP"}, {"use": "Pile Group Effect", "name": "GALLOP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "COMPILE"}, {"use": "Jack-up Leg Penetration Analysis", "name": "MAHAJACK"}, {"use": "Graph Plotting", "name": "Grapher"}, {"use": "Pile Driveability Analysis", "name": "GRLWEAP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "OPILE"}]	\N	2026-10-26 17:01:40.961349+00
D6-SOIL-MOOR	SIR_MB	["Soil Samples collected from the borehole locations", "In-situ Test Results/ CPTU Raw Data", "On-board Lab test results", "Draft Soil Investigation Report", "Jack-up rig Specifications"]	[]	["Hydrometer"]	["Hydrometer Analysis"]	[{"use": "Mudmat Capacity Analysis", "name": "MATCAP"}, {"use": "Pile Group Effect", "name": "GALLOP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "COMPILE"}, {"use": "Jack-up Leg Penetration Analysis", "name": "MAHAJACK"}, {"use": "Graph Plotting", "name": "Grapher"}, {"use": "Pile Driveability Analysis", "name": "GRLWEAP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "OPILE"}]	\N	2026-10-26 17:01:40.961349+00
D6-SSA	SSA	["Soil Samples collected from the borehole locations", "In-situ Test Results/ CPTU Raw Data", "On-board Lab test results", "Draft Soil Investigation Report", "Jack-up rig Specifications", "Final Soil Investigation Report"]	[]	["Casagrande's Apparatus", "Sieve Shaker/ Sieve sets"]	["Liquid Limit Test", "Wet Seive Analysis"]	[{"use": "Mudmat Capacity Analysis", "name": "MATCAP"}, {"use": "Pile Group Effect", "name": "GALLOP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "COMPILE"}, {"use": "Jack-up Leg Penetration Analysis", "name": "MAHAJACK"}, {"use": "Graph Plotting", "name": "Grapher"}, {"use": "Pile Driveability Analysis", "name": "GRLWEAP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "OPILE"}]	\N	2026-10-26 17:01:40.961349+00
D6-GEOTECH	OTH	["Soil Samples collected from the borehole locations", "In-situ Test Results/ CPTU Raw Data", "On-board Lab test results", "Draft Soil Investigation Report", "Jack-up rig Specifications", "Final Soil Investigation Report"]	[]	["Heating Oven", "Sieve Shaker/ Sieve sets"]	["For Sample Drying", "Wet Seive Analysis"]	[{"use": "Mudmat Capacity Analysis", "name": "MATCAP"}, {"use": "Pile Group Effect", "name": "GALLOP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "COMPILE"}, {"use": "Jack-up Leg Penetration Analysis", "name": "MAHAJACK"}, {"use": "Graph Plotting", "name": "Grapher"}, {"use": "Pile Driveability Analysis", "name": "GRLWEAP"}, {"use": "Pile Capacity & Load Deformation Analysis", "name": "OPILE"}]	\N	2026-10-26 17:01:40.961349+00
D6-SIA	SIA	[]	[]	[]	[]	[]	{"kind": "structure-sia", "platform": {"key": "platform", "hint": "Letters and numbers only, with no spaces or special characters.", "type": "text", "label": "Jacket or platform name", "pattern": "^[A-Za-z0-9]+$"}, "categories": ["scheduled", "unscheduled"], "modifications": [{"code": "new_risers", "name": "New risers", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of risers", "repeat": true, "perItem": false}, {"key": "size", "type": "number", "label": "Riser size in inch", "repeat": false, "perItem": true}, {"key": "service", "type": "text", "label": "Service of riser", "perItem": true}, {"key": "riserType", "type": "select", "label": "Type of riser", "options": ["Flexi", "Normal", "J/I Tube", "Other"], "perItem": true}, {"key": "face", "type": "select", "label": "Face of the jacket", "options": ["South", "East", "West", "North"], "perItem": true}], "sampleReport": "PB"}, {"code": "deck_extension", "name": "Deck extension", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of deck extensions", "repeat": true, "perItem": false}, {"key": "size", "type": "text", "label": "Size of deck extension in metres (length x breadth)", "perItem": true}, {"key": "level", "type": "select", "label": "Deck extension level", "options": ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"], "perItem": true}, {"key": "face", "type": "select", "label": "Location of deck extension", "options": ["South", "East", "West", "North"], "perItem": true}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the deck extension", "perItem": true}], "sampleReport": "TCPP"}, {"code": "clamp_on", "name": "Clamp-on", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of clamp-ons", "repeat": true, "perItem": false}, {"key": "size", "type": "number", "label": "Size of clamp-on conductors in inch", "repeat": false, "perItem": true}], "sampleReport": "WI8"}, {"code": "new_bridge", "name": "New bridge", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "length", "type": "number", "label": "Bridge length in metres", "repeat": false, "perItem": false}, {"key": "load", "type": "number", "label": "Intensity of bridge load in tonnes per metre", "repeat": false, "perItem": false}, {"key": "tier", "type": "select", "label": "Tier of bridge", "options": ["One tier", "Two tier"], "perItem": false}, {"key": "deck", "type": "select", "label": "Deck on which the bridge is placed", "options": ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"], "perItem": false}, {"key": "face", "type": "select", "label": "Location of the bridge on the deck", "options": ["South", "East", "West", "North", "North West", "South West", "South East", "North East"], "perItem": false}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the bridge support", "perItem": false}], "sampleReport": "B12-11"}, {"code": "new_equipment", "name": "New equipment without deck extension", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "equipmentType", "type": "text", "label": "Type of equipment"}, {"key": "footprint", "type": "text", "label": "Footprint of equipment in metres"}, {"key": "location", "type": "select", "label": "Location of the new equipment", "options": ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"], "perItem": false}, {"key": "load", "type": "text", "label": "Load intensity or load of the new equipment in tonnes"}, {"key": "removed", "type": "text", "label": "Any existing facilities or load removed"}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the new equipment layout", "perItem": false}], "sampleReport": "B192-5"}, {"code": "life_boat", "name": "Life boat", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of life boats", "repeat": true, "perItem": false}, {"key": "weight", "type": "number", "label": "Weight of life boat in kg", "repeat": false, "perItem": true}, {"key": "level", "type": "select", "label": "Life boat level", "options": ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"], "perItem": true}, {"key": "capacity", "type": "number", "label": "Capacity of the new life boat", "repeat": false, "perItem": true}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the new life boat", "perItem": true}], "sampleReport": "NLW"}, {"code": "new_crane", "name": "New crane", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of cranes", "repeat": true, "perItem": false}, {"key": "capacity", "type": "number", "label": "Crane capacity in tonnes", "repeat": false, "perItem": true}, {"key": "level", "type": "select", "label": "Crane location level", "options": ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"], "perItem": true}, {"key": "deadLoad", "type": "number", "label": "Crane dead load in tonnes", "repeat": false, "perItem": true}, {"key": "boomRest", "type": "number", "label": "Boom rest load in tonnes", "repeat": false, "perItem": true}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the crane and boom rest", "perItem": true}], "sampleReport": "B-173-AB"}, {"code": "enhanced_crane", "name": "Enhanced crane capacity", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "capacity", "type": "number", "label": "Enhanced crane capacity in tonnes", "repeat": false, "perItem": false}, {"key": "level", "type": "select", "label": "Crane location level", "options": ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"], "perItem": false}, {"key": "load", "type": "number", "label": "Crane load in tonnes", "repeat": false, "perItem": false}, {"key": "boomRest", "type": "number", "label": "Boom rest load in tonnes", "repeat": false, "perItem": false}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the crane and boom rest", "perItem": false}], "sampleReport": "PL"}, {"code": "damage", "name": "Damage", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "memo", "type": "upload", "label": "Memo regarding damage from IMR", "perItem": false}], "sampleReport": "NU"}, {"code": "sump_caisson", "name": "External sump caisson", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of sump caissons", "repeat": true, "perItem": false}, {"key": "diameter", "type": "number", "label": "Diameter of sump caisson in inch", "repeat": false, "perItem": true}, {"key": "leg", "type": "text", "label": "Location of sump caisson — leg", "perItem": true}], "sampleReport": "SHP"}, {"code": "riser_protector", "name": "Riser protector", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of riser protectors", "repeat": true, "perItem": false}, {"key": "face", "type": "select", "label": "Face of the jacket", "options": ["South", "East", "West", "North"], "perItem": true}], "sampleReport": "SP"}, {"code": "modular_rig", "name": "Modular rig", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "load", "type": "number", "label": "Modular rig load in tonnes", "repeat": false, "perItem": false}, {"key": "drawing", "type": "upload", "label": "Marked-up drawing of the modular rig", "perItem": false}], "sampleReport": "NLM-3"}, {"code": "boat_landing", "name": "Boat landing", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "count", "type": "number", "label": "Number of boat landings", "repeat": true, "perItem": false}, {"key": "stage", "type": "number", "label": "Stage of boat landing", "repeat": false, "perItem": true}, {"key": "face", "type": "select", "label": "Face of the jacket", "options": ["South", "East", "West", "North"], "perItem": true}], "sampleReport": "PK"}, {"code": "scour", "name": "Scour", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "memo", "type": "upload", "label": "Memo regarding scour from IMR", "perItem": false}], "sampleReport": "B-55"}, {"code": "other", "name": "Any other", "fields": [{"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}, {"key": "brief", "type": "textarea", "label": "Brief about the modification, addition, or issue", "maxLength": 500}, {"key": "attachment", "type": "upload", "label": "Attachment", "perItem": false}], "sampleReport": "HQ"}]}	2026-10-26 17:01:40.961349+00
D6-LIFE	BB	[]	[]	[]	[]	[]	{"kind": "structure-life", "fields": [{"key": "platform", "hint": "Letters and numbers only, with no spaces or special characters.", "type": "text", "label": "Jacket or platform name", "pattern": "^[A-Za-z0-9]+$"}, {"key": "scheme", "type": "text", "label": "Project or scheme under which the modification is proposed"}], "categories": ["scheduled", "unscheduled"], "sampleReport": "BB"}	2026-10-26 17:01:40.961349+00
\.


--
-- TOC entry 4308 (class 0 OID 115923)
-- Dependencies: 255
-- Data for Name: tac_agenda_items; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.tac_agenda_items (id, meeting_id, project_id, sort_order) FROM stdin;
1	1	6	1
\.


--
-- TOC entry 4310 (class 0 OID 115940)
-- Dependencies: 257
-- Data for Name: tac_decisions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.tac_decisions (id, agenda_item_id, decision, remarks, decided_by, decided_at) FROM stdin;
1	1	finalised	kept	8	2026-11-18 07:04:23.940518+00
\.


--
-- TOC entry 4306 (class 0 OID 115913)
-- Dependencies: 253
-- Data for Name: tac_meetings; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.tac_meetings (id, title, scheduled_at, status, created_at) FROM stdin;
1	TAC · Annual work plan phase 1 check	2026-11-18 07:04:23.852806+00	scheduled	2026-11-18 07:04:23.852806+00
\.


--
-- TOC entry 4324 (class 0 OID 116088)
-- Dependencies: 271
-- Data for Name: test_methods; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.test_methods (id, code, name, description) FROM stdin;
\.


--
-- TOC entry 4332 (class 0 OID 116152)
-- Dependencies: 279
-- Data for Name: test_requests; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.test_requests (id, sample_id, method_id, requested_by, status, created_at) FROM stdin;
\.


--
-- TOC entry 4334 (class 0 OID 116177)
-- Dependencies: 281
-- Data for Name: test_results; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.test_results (id, request_id, analyst_id, instrument_id, result, file_id, approval_state, approved_by, created_at) FROM stdin;
\.


--
-- TOC entry 4282 (class 0 OID 115635)
-- Dependencies: 229
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.user_role_assignments (id, user_id, role_id, scope, department_id, work_centre_id, active, created_at) FROM stdin;
1	1	6	department	1	\N	t	2026-10-26 16:32:08.726271+00
2	2	4	department	1	\N	t	2026-10-26 16:32:08.726271+00
3	3	7	global	\N	\N	t	2026-10-26 16:32:08.726271+00
4	4	5	global	\N	\N	t	2026-10-26 16:32:08.726271+00
5	5	3	global	\N	\N	t	2026-10-26 16:32:08.726271+00
6	6	2	global	\N	\N	t	2026-10-26 16:32:08.726271+00
7	7	1	global	\N	\N	t	2026-10-26 16:32:08.726271+00
8	8	8	global	\N	\N	t	2026-10-27 09:51:46.798751+00
9	9	9	global	\N	\N	t	2026-10-27 09:51:46.798751+00
\.


--
-- TOC entry 4368 (class 0 OID 116581)
-- Dependencies: 316
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.user_sessions (sid, sess, expire) FROM stdin;
REL50NUArg1QEHt6acSpAUIXO80nAcJe	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:03:38.955Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:03:40
lb07PbsL1XQgP1m5jjtArc4y8Yband6b	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.479Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:24
0nenbbwHDERHzQl5TROGJgmdvfN9yJ9W	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:03:39.070Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":5,"cpf":"100003","name":"Coordinator","email":"coordinator@ipeot.local","roles":[{"code":"COORDINATOR","name":"Coordinator","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["awp.read","dashboards.read","projects.read","proposals.read","proposals.submit","proposals.write","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:03:40
EPZC99P3PKeoDKcOTGL3_SQQxeV8On47	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:03:39.192Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:03:40
OdUPEOrgOqJKCHHCIdSVVTDN_nom2FCB	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.678Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":4,"cpf":"100005","name":"In-charge","email":"ic@ipeot.local","roles":[{"code":"IC","name":"In-charge","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","lims.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:24
dgJ6-bFeCzxej6stHu6VAvCC72g2E0ik	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.597Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:24
uxkJW93FOhI-I5wwBtCCxV29I899ds60	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.757Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:24
9bfnjM5c5iHadpEmsRVg6yIN0s7Ara7s	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.841Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":3,"cpf":"100007","name":"Head of Institute","email":"hoi@ipeot.local","roles":[{"code":"HOI","name":"Head of Institute","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.matrix.read","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:24
bOV9hbjBErqVeA4Vce-TTMUdgLBIv6LR	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.411Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:25
Cu1m4lHlqhh_FlLNKITkp-3W4zt0kZCt	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.114Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":5,"cpf":"100003","name":"Coordinator","email":"coordinator@ipeot.local","roles":[{"code":"COORDINATOR","name":"Coordinator","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["awp.read","dashboards.read","projects.read","proposals.read","proposals.submit","proposals.write","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:34
lNf8ra3mL80hj_aUtaIoTp1H5-zmHwYH	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:23.929Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":8,"cpf":"100008","name":"TAC Member","email":"tac@ipeot.local","roles":[{"code":"TAC","name":"Technical Advisory Committee","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:24
CWXXULxsMacZxnoFsJX9CxOlv9-dhNYd	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:24.015Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":9,"cpf":"100009","name":"Director","email":"director@ipeot.local","roles":[{"code":"DIRECTOR","name":"Director (Production)","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:25
lfdFRBDzRpv1mnybWgqP-osqki5ZVRWy	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:24.110Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:25
yv23mFjtDuSrZ6cgoksBD5jk6Jn291SN	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:24.195Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":5,"cpf":"100003","name":"Coordinator","email":"coordinator@ipeot.local","roles":[{"code":"COORDINATOR","name":"Coordinator","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["awp.read","dashboards.read","projects.read","proposals.read","proposals.submit","proposals.write","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:25
fYHt6G_LCQU9OFBVMMFhLGFPmvoawWiQ	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.352Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:34
OgFYU2vMBP9Aa4NRa4on9F9BLZbWSLuA	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.202Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:34
zderLmy70IReptEBov7zwPN1GYhAy7Xb	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.279Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:34
6qm0lT1GnuZgM_5NOjFzkBMGStrRUg-Z	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.425Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":5,"cpf":"100003","name":"Coordinator","email":"coordinator@ipeot.local","roles":[{"code":"COORDINATOR","name":"Coordinator","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["awp.read","dashboards.read","projects.read","proposals.read","proposals.submit","proposals.write","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:34
SwN32zB9F9BRaeziHVg36w77oRf6pboa	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.510Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:34
WGExH8lC6oilfbst8vbwdzH9nb-FvGw2	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.580Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:34
AYkmdj0MV2Aq5DLOHAWECpydVCuoqcxt	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.654Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:34
2NS8qnDqinHqpqzBlistBoyWYfiD4MQ9	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.727Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":1,"cpf":"100006","name":"Head of Department","email":"hod@ipeot.local","roles":[{"code":"HOD","name":"Head of Department","scope":"department","delegated":false,"departmentId":1,"workCentreId":null,"delegatedFrom":null}],"permissions":["dashboards.read","projects.read","projects.write","proposals.read","reports.write","team.allot","workflow.act"],"departmentId":1,"workCentreId":null}}	2026-11-18 15:04:34
g5ebTv54GZOk3RFWLuvoRmFkvih_8xsv	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.802Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":7,"cpf":"100001","name":"Portal Admin","email":"admin@ipeot.local","roles":[{"code":"ADMIN","name":"Administrator","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.audit.read","admin.masters.read","admin.masters.write","admin.matrix.read","admin.matrix.write","admin.users.read","admin.users.write","awp.read","awp.write","dashboards.read","lims.read","lims.write","projects.read","projects.write","proposals.read","proposals.submit","proposals.write","reports.write","team.allot","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:34
rs7d2GaxHGT_EZdh36P0Ttl-hxJRosRM	{"cookie":{"originalMaxAge":28800000,"expires":"2026-11-18T15:04:33.875Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":6,"cpf":"100002","name":"PCC Officer","email":"pcc@ipeot.local","roles":[{"code":"PCC","name":"Project Coordination Cell","scope":"global","delegated":false,"departmentId":null,"workCentreId":null,"delegatedFrom":null}],"permissions":["admin.masters.read","admin.matrix.read","awp.read","awp.write","dashboards.read","projects.read","proposals.read","workflow.act"],"departmentId":null,"workCentreId":null}}	2026-11-18 15:04:34
\.


--
-- TOC entry 4275 (class 0 OID 115576)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.users (id, cpf, name, email, phone, password_hash, active, department_id, work_centre_id, ad_dn, sap_employee_id, last_login_at, created_at, updated_at) FROM stdin;
5	100003	Coordinator	coordinator@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:33.423526+00	2026-10-26 16:32:08.726271+00	2026-11-18 07:04:33.423526+00
1	100006	Head of Department	hod@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	1	\N	\N	\N	2026-11-18 07:04:33.726578+00	2026-10-26 16:32:08.726271+00	2026-11-18 07:04:33.726578+00
7	100001	Portal Admin	admin@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:33.801346+00	2026-10-26 16:32:08.726271+00	2026-11-18 07:04:33.801346+00
6	100002	PCC Officer	pcc@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:33.874036+00	2026-10-26 16:32:08.726271+00	2026-11-18 07:04:33.874036+00
2	100004	L3 Proposer	l3@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	1	\N	\N	\N	2026-10-28 07:30:42.395398+00	2026-10-26 16:32:08.726271+00	2026-10-28 07:30:42.395398+00
4	100005	In-charge	ic@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:23.677416+00	2026-10-26 16:32:08.726271+00	2026-11-18 07:04:23.677416+00
3	100007	Head of Institute	hoi@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:23.840746+00	2026-10-26 16:32:08.726271+00	2026-11-18 07:04:23.840746+00
8	100008	TAC Member	tac@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:23.926694+00	2026-10-27 09:51:46.781105+00	2026-11-18 07:04:23.926694+00
9	100009	Director	director@ipeot.local	\N	$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi	t	\N	\N	\N	\N	2026-11-18 07:04:24.013836+00	2026-10-27 09:51:46.781105+00	2026-11-18 07:04:24.013836+00
\.


--
-- TOC entry 4350 (class 0 OID 116345)
-- Dependencies: 297
-- Data for Name: work_centre_feedback; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.work_centre_feedback (id, project_id, work_centre_id, rating, comments, submitted_by, created_at) FROM stdin;
\.


--
-- TOC entry 4271 (class 0 OID 115541)
-- Dependencies: 218
-- Data for Name: work_centres; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.work_centres (id, code, name, department_id, active, created_at, updated_at) FROM stdin;
1	D2-RRE	Risk and reliability	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
2	D2-PROCESS	Process	2	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
3	D6-STRUCT	Structure	6	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
4	D6-GEOTECH	Geotech	6	t	2026-10-26 16:32:08.726271+00	2026-10-26 16:32:08.726271+00
\.


--
-- TOC entry 4302 (class 0 OID 115873)
-- Dependencies: 249
-- Data for Name: workflow_instances; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.workflow_instances (id, project_id, applies_to, current_stage, status, started_at, completed_at) FROM stdin;
1	1	proposal	director	completed	2026-10-26 17:08:53.642821+00	2026-10-27 09:57:04.968944+00
4	6	proposal	hod_endorse	completed	2026-11-18 07:03:39.107278+00	2026-11-18 07:04:23.768737+00
5	7	proposal	in_year_hod	completed	2026-11-18 07:04:33.135898+00	2026-11-18 07:04:33.360528+00
6	8	proposal	short_term_close	completed	2026-11-18 07:04:33.436309+00	2026-11-18 07:04:33.735793+00
\.


--
-- TOC entry 4304 (class 0 OID 115891)
-- Dependencies: 251
-- Data for Name: workflow_tasks; Type: TABLE DATA; Schema: ipeot; Owner: digi_user
--

COPY ipeot.workflow_tasks (id, instance_id, stage_code, stage_order, assignee_role_code, assignee_user_id, status, action, remarks, due_at, completed_at, created_at, completed_by) FROM stdin;
1	1	coordinator	1	COORDINATOR	\N	completed	accept	ok	2026-10-31 17:08:53.642821+00	2026-10-26 17:20:53.021207+00	2026-10-26 17:08:53.642821+00	5
2	1	pcc	2	PCC	\N	completed	accept	ok	2026-10-31 17:20:53.021207+00	2026-10-26 17:22:01.567528+00	2026-10-26 17:20:53.021207+00	6
3	1	ic_review	3	IC	\N	completed	accept	\N	2026-11-02 17:22:01.567528+00	2026-10-26 17:47:17.547912+00	2026-10-26 17:22:01.567528+00	4
4	1	hod_endorse	4	HOD	\N	completed	endorse	ok	2026-11-02 17:47:17.547912+00	2026-10-26 17:48:36.089319+00	2026-10-26 17:47:17.547912+00	1
5	1	hoi_authorize	5	HOI	\N	completed	authorize	\N	2026-11-02 17:48:36.089319+00	2026-10-26 17:53:58.517399+00	2026-10-26 17:48:36.089319+00	3
6	1	tac	6	TAC	\N	completed	authorize	Authorized	2026-11-09 17:53:58.517399+00	2026-10-27 09:55:24.442135+00	2026-10-26 17:53:58.517399+00	8
9	1	director	7	DIRECTOR	\N	completed	authorize	Authorized	2026-11-10 09:55:24.442135+00	2026-10-27 09:57:04.968944+00	2026-10-27 09:55:24.442135+00	9
10	4	pcc_route	1	PCC	\N	completed	route	\N	2026-11-23 07:03:39.107278+00	2026-11-18 07:04:23.515836+00	2026-11-18 07:03:39.107278+00	6
11	4	dept_review	2	HOD	\N	completed	accept	\N	2026-11-25 07:04:23.515836+00	2026-11-18 07:04:23.607936+00	2026-11-18 07:04:23.515836+00	1
12	4	incharge_review	4	IC	\N	completed	schedule	after the monsoon window	2026-11-25 07:04:23.607936+00	2026-11-18 07:04:23.689768+00	2026-11-18 07:04:23.607936+00	4
13	4	hod_endorse	5	HOD	\N	completed	endorse	\N	2026-11-25 07:04:23.689768+00	2026-11-18 07:04:23.768737+00	2026-11-18 07:04:23.689768+00	1
14	5	pcc_route	1	PCC	\N	completed	route	\N	2026-11-23 07:04:33.135898+00	2026-11-18 07:04:33.217678+00	2026-11-18 07:04:33.135898+00	6
15	5	dept_review	2	HOD	\N	completed	accept	\N	2026-11-25 07:04:33.217678+00	2026-11-18 07:04:33.287922+00	2026-11-18 07:04:33.217678+00	1
16	5	in_year_hod	4	HOD	\N	completed	endorse	\N	2026-11-23 07:04:33.287922+00	2026-11-18 07:04:33.360528+00	2026-11-18 07:04:33.287922+00	1
17	6	pcc_route	1	PCC	\N	completed	route	\N	2026-11-23 07:04:33.436309+00	2026-11-18 07:04:33.517998+00	2026-11-18 07:04:33.436309+00	6
18	6	dept_review	2	HOD	\N	completed	accept	\N	2026-11-25 07:04:33.517998+00	2026-11-18 07:04:33.588922+00	2026-11-18 07:04:33.517998+00	1
19	6	short_term_hod	4	HOD	\N	completed	endorse	\N	2026-11-23 07:04:33.588922+00	2026-11-18 07:04:33.663312+00	2026-11-18 07:04:33.588922+00	1
20	6	short_term_close	6	HOD	\N	completed	complete_work	\N	2026-12-03 07:04:33.663312+00	2026-11-18 07:04:33.735793+00	2026-11-18 07:04:33.663312+00	1
\.


--
-- TOC entry 4389 (class 0 OID 0)
-- Dependencies: 232
-- Name: approval_matrix_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.approval_matrix_id_seq', 42, true);


--
-- TOC entry 4390 (class 0 OID 0)
-- Dependencies: 305
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.audit_log_id_seq', 177, true);


--
-- TOC entry 4391 (class 0 OID 0)
-- Dependencies: 238
-- Name: awp_cycles_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.awp_cycles_id_seq', 5, true);


--
-- TOC entry 4392 (class 0 OID 0)
-- Dependencies: 329
-- Name: awp_package_tasks_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.awp_package_tasks_id_seq', 4, true);


--
-- TOC entry 4393 (class 0 OID 0)
-- Dependencies: 246
-- Name: awp_submissions_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.awp_submissions_id_seq', 3, true);


--
-- TOC entry 4394 (class 0 OID 0)
-- Dependencies: 274
-- Name: calibrations_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.calibrations_id_seq', 1, false);


--
-- TOC entry 4395 (class 0 OID 0)
-- Dependencies: 282
-- Name: consumables_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.consumables_id_seq', 1, false);


--
-- TOC entry 4396 (class 0 OID 0)
-- Dependencies: 215
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.departments_id_seq', 7, true);


--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 294
-- Name: distribution_log_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.distribution_log_id_seq', 1, false);


--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 260
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.files_id_seq', 1, false);


--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 292
-- Name: final_reports_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.final_reports_id_seq', 1, false);


--
-- TOC entry 4400 (class 0 OID 0)
-- Dependencies: 219
-- Name: installations_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.installations_id_seq', 1, false);


--
-- TOC entry 4401 (class 0 OID 0)
-- Dependencies: 272
-- Name: instruments_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.instruments_id_seq', 1, false);


--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 303
-- Name: integration_outbox_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.integration_outbox_id_seq', 1, false);


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 264
-- Name: iso_document_versions_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.iso_document_versions_id_seq', 1, false);


--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 262
-- Name: iso_documents_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.iso_documents_id_seq', 1, false);


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 268
-- Name: lab_locations_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.lab_locations_id_seq', 1, false);


--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 284
-- Name: maintenance_tickets_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.maintenance_tickets_id_seq', 1, false);


--
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 266
-- Name: milestones_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.milestones_id_seq', 1, false);


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 298
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.notifications_id_seq', 5, true);


--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 326
-- Name: outbound_mail_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.outbound_mail_id_seq', 5, true);


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 225
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.permissions_id_seq', 20, true);


--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 258
-- Name: project_team_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.project_team_id_seq', 1, false);


--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 236
-- Name: project_types_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.project_types_id_seq', 52, true);


--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 240
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.projects_id_seq', 8, true);


--
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 324
-- Name: proposal_files_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.proposal_files_id_seq', 1, true);


--
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 318
-- Name: proposal_number_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.proposal_number_seq', 5, true);


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 244
-- Name: proposal_versions_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.proposal_versions_id_seq', 8, true);


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 242
-- Name: proposals_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.proposals_id_seq', 8, true);


--
-- TOC entry 4418 (class 0 OID 0)
-- Dependencies: 290
-- Name: report_approvals_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.report_approvals_id_seq', 1, false);


--
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 286
-- Name: report_drafts_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.report_drafts_id_seq', 1, false);


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 288
-- Name: report_versions_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.report_versions_id_seq', 1, false);


--
-- TOC entry 4421 (class 0 OID 0)
-- Dependencies: 230
-- Name: role_delegations_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.role_delegations_id_seq', 1, false);


--
-- TOC entry 4422 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.roles_id_seq', 11, true);


--
-- TOC entry 4423 (class 0 OID 0)
-- Dependencies: 321
-- Name: routing_rules_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.routing_rules_id_seq', 52, true);


--
-- TOC entry 4424 (class 0 OID 0)
-- Dependencies: 276
-- Name: samples_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.samples_id_seq', 1, false);


--
-- TOC entry 4425 (class 0 OID 0)
-- Dependencies: 301
-- Name: sap_wbs_jobs_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.sap_wbs_jobs_id_seq', 1, false);


--
-- TOC entry 4426 (class 0 OID 0)
-- Dependencies: 234
-- Name: sla_rules_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.sla_rules_id_seq', 19, true);


--
-- TOC entry 4427 (class 0 OID 0)
-- Dependencies: 319
-- Name: stakeholder_units_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.stakeholder_units_id_seq', 1, true);


--
-- TOC entry 4428 (class 0 OID 0)
-- Dependencies: 254
-- Name: tac_agenda_items_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.tac_agenda_items_id_seq', 1, true);


--
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 256
-- Name: tac_decisions_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.tac_decisions_id_seq', 1, true);


--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 252
-- Name: tac_meetings_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.tac_meetings_id_seq', 1, true);


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 270
-- Name: test_methods_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.test_methods_id_seq', 1, false);


--
-- TOC entry 4432 (class 0 OID 0)
-- Dependencies: 278
-- Name: test_requests_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.test_requests_id_seq', 1, false);


--
-- TOC entry 4433 (class 0 OID 0)
-- Dependencies: 280
-- Name: test_results_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.test_results_id_seq', 1, false);


--
-- TOC entry 4434 (class 0 OID 0)
-- Dependencies: 228
-- Name: user_role_assignments_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.user_role_assignments_id_seq', 9, true);


--
-- TOC entry 4435 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.users_id_seq', 9, true);


--
-- TOC entry 4436 (class 0 OID 0)
-- Dependencies: 296
-- Name: work_centre_feedback_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.work_centre_feedback_id_seq', 1, false);


--
-- TOC entry 4437 (class 0 OID 0)
-- Dependencies: 217
-- Name: work_centres_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.work_centres_id_seq', 4, true);


--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 248
-- Name: workflow_instances_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.workflow_instances_id_seq', 6, true);


--
-- TOC entry 4439 (class 0 OID 0)
-- Dependencies: 250
-- Name: workflow_tasks_id_seq; Type: SEQUENCE SET; Schema: ipeot; Owner: digi_user
--

SELECT pg_catalog.setval('ipeot.workflow_tasks_id_seq', 20, true);


--
-- TOC entry 3813 (class 2606 OID 115703)
-- Name: approval_matrix approval_matrix_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.approval_matrix
    ADD CONSTRAINT approval_matrix_pkey PRIMARY KEY (id);


--
-- TOC entry 3815 (class 2606 OID 115705)
-- Name: approval_matrix approval_matrix_stage_uniq; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.approval_matrix
    ADD CONSTRAINT approval_matrix_stage_uniq UNIQUE NULLS NOT DISTINCT (project_category, department_id, applies_to, stage_order);


--
-- TOC entry 3934 (class 2606 OID 116437)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3938 (class 2606 OID 116444)
-- Name: audit_log_2026 audit_log_2026_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2026
    ADD CONSTRAINT audit_log_2026_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3942 (class 2606 OID 116453)
-- Name: audit_log_2027 audit_log_2027_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2027
    ADD CONSTRAINT audit_log_2027_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3946 (class 2606 OID 116462)
-- Name: audit_log_2028 audit_log_2028_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2028
    ADD CONSTRAINT audit_log_2028_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3950 (class 2606 OID 116471)
-- Name: audit_log_2029 audit_log_2029_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2029
    ADD CONSTRAINT audit_log_2029_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3954 (class 2606 OID 116480)
-- Name: audit_log_2030 audit_log_2030_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2030
    ADD CONSTRAINT audit_log_2030_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3958 (class 2606 OID 116489)
-- Name: audit_log_2031 audit_log_2031_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2031
    ADD CONSTRAINT audit_log_2031_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3962 (class 2606 OID 116498)
-- Name: audit_log_2032 audit_log_2032_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2032
    ADD CONSTRAINT audit_log_2032_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3966 (class 2606 OID 116507)
-- Name: audit_log_2033 audit_log_2033_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_2033
    ADD CONSTRAINT audit_log_2033_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3970 (class 2606 OID 116516)
-- Name: audit_log_default audit_log_default_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.audit_log_default
    ADD CONSTRAINT audit_log_default_pkey PRIMARY KEY (id, created_at);


--
-- TOC entry 3825 (class 2606 OID 115758)
-- Name: awp_cycles awp_cycles_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_cycles
    ADD CONSTRAINT awp_cycles_pkey PRIMARY KEY (id);


--
-- TOC entry 3827 (class 2606 OID 115760)
-- Name: awp_cycles awp_cycles_year_title_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_cycles
    ADD CONSTRAINT awp_cycles_year_title_key UNIQUE (year, title);


--
-- TOC entry 3993 (class 2606 OID 135782)
-- Name: awp_package_tasks awp_package_tasks_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_package_tasks
    ADD CONSTRAINT awp_package_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3991 (class 2606 OID 135767)
-- Name: awp_reminder_log awp_reminder_log_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_reminder_log
    ADD CONSTRAINT awp_reminder_log_pkey PRIMARY KEY (awp_cycle_id, offset_days);


--
-- TOC entry 3845 (class 2606 OID 115856)
-- Name: awp_submissions awp_submissions_awp_cycle_id_proposal_id_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_submissions
    ADD CONSTRAINT awp_submissions_awp_cycle_id_proposal_id_key UNIQUE (awp_cycle_id, proposal_id);


--
-- TOC entry 3847 (class 2606 OID 115854)
-- Name: awp_submissions awp_submissions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_submissions
    ADD CONSTRAINT awp_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3891 (class 2606 OID 116120)
-- Name: calibrations calibrations_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.calibrations
    ADD CONSTRAINT calibrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3903 (class 2606 OID 116220)
-- Name: consumables consumables_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.consumables
    ADD CONSTRAINT consumables_pkey PRIMARY KEY (id);


--
-- TOC entry 3781 (class 2606 OID 115539)
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- TOC entry 3783 (class 2606 OID 115537)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 3919 (class 2606 OID 116338)
-- Name: distribution_log distribution_log_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.distribution_log
    ADD CONSTRAINT distribution_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3865 (class 2606 OID 115994)
-- Name: files files_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- TOC entry 3867 (class 2606 OID 115996)
-- Name: files files_storage_key_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.files
    ADD CONSTRAINT files_storage_key_key UNIQUE (storage_key);


--
-- TOC entry 3915 (class 2606 OID 116317)
-- Name: final_reports final_reports_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.final_reports
    ADD CONSTRAINT final_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 3917 (class 2606 OID 116319)
-- Name: final_reports final_reports_project_id_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.final_reports
    ADD CONSTRAINT final_reports_project_id_key UNIQUE (project_id);


--
-- TOC entry 3789 (class 2606 OID 115569)
-- Name: installations installations_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.installations
    ADD CONSTRAINT installations_code_key UNIQUE (code);


--
-- TOC entry 3791 (class 2606 OID 115567)
-- Name: installations installations_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.installations
    ADD CONSTRAINT installations_pkey PRIMARY KEY (id);


--
-- TOC entry 3887 (class 2606 OID 116107)
-- Name: instruments instruments_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.instruments
    ADD CONSTRAINT instruments_code_key UNIQUE (code);


--
-- TOC entry 3889 (class 2606 OID 116105)
-- Name: instruments instruments_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.instruments
    ADD CONSTRAINT instruments_pkey PRIMARY KEY (id);


--
-- TOC entry 3930 (class 2606 OID 116429)
-- Name: integration_outbox integration_outbox_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.integration_outbox
    ADD CONSTRAINT integration_outbox_pkey PRIMARY KEY (id);


--
-- TOC entry 3873 (class 2606 OID 116030)
-- Name: iso_document_versions iso_document_versions_document_id_version_no_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_document_versions
    ADD CONSTRAINT iso_document_versions_document_id_version_no_key UNIQUE (document_id, version_no);


--
-- TOC entry 3875 (class 2606 OID 116028)
-- Name: iso_document_versions iso_document_versions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_document_versions
    ADD CONSTRAINT iso_document_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 3869 (class 2606 OID 116012)
-- Name: iso_documents iso_documents_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_documents
    ADD CONSTRAINT iso_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3871 (class 2606 OID 116014)
-- Name: iso_documents iso_documents_project_id_doc_type_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_documents
    ADD CONSTRAINT iso_documents_project_id_doc_type_key UNIQUE (project_id, doc_type);


--
-- TOC entry 3879 (class 2606 OID 116081)
-- Name: lab_locations lab_locations_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.lab_locations
    ADD CONSTRAINT lab_locations_code_key UNIQUE (code);


--
-- TOC entry 3881 (class 2606 OID 116079)
-- Name: lab_locations lab_locations_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.lab_locations
    ADD CONSTRAINT lab_locations_pkey PRIMARY KEY (id);


--
-- TOC entry 3905 (class 2606 OID 116235)
-- Name: maintenance_tickets maintenance_tickets_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 3877 (class 2606 OID 116060)
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- TOC entry 3926 (class 2606 OID 116394)
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3923 (class 2606 OID 116378)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3989 (class 2606 OID 135751)
-- Name: outbound_mail outbound_mail_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.outbound_mail
    ADD CONSTRAINT outbound_mail_pkey PRIMARY KEY (id);


--
-- TOC entry 3801 (class 2606 OID 115618)
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- TOC entry 3803 (class 2606 OID 115616)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3985 (class 2606 OID 135713)
-- Name: project_routes project_routes_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_routes
    ADD CONSTRAINT project_routes_pkey PRIMARY KEY (project_id, department_id);


--
-- TOC entry 3861 (class 2606 OID 115966)
-- Name: project_team project_team_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_team
    ADD CONSTRAINT project_team_pkey PRIMARY KEY (id);


--
-- TOC entry 3863 (class 2606 OID 115968)
-- Name: project_team project_team_project_id_user_id_role_on_project_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_team
    ADD CONSTRAINT project_team_project_id_user_id_role_on_project_key UNIQUE (project_id, user_id, role_on_project);


--
-- TOC entry 3821 (class 2606 OID 115737)
-- Name: project_types project_types_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_types
    ADD CONSTRAINT project_types_code_key UNIQUE (code);


--
-- TOC entry 3823 (class 2606 OID 115735)
-- Name: project_types project_types_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_types
    ADD CONSTRAINT project_types_pkey PRIMARY KEY (id);


--
-- TOC entry 3829 (class 2606 OID 115773)
-- Name: projects projects_accession_number_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_accession_number_key UNIQUE (accession_number);


--
-- TOC entry 3832 (class 2606 OID 115771)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 3987 (class 2606 OID 135732)
-- Name: proposal_files proposal_files_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_files
    ADD CONSTRAINT proposal_files_pkey PRIMARY KEY (id);


--
-- TOC entry 3841 (class 2606 OID 115835)
-- Name: proposal_versions proposal_versions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_versions
    ADD CONSTRAINT proposal_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 3843 (class 2606 OID 115837)
-- Name: proposal_versions proposal_versions_proposal_id_version_no_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_versions
    ADD CONSTRAINT proposal_versions_proposal_id_version_no_key UNIQUE (proposal_id, version_no);


--
-- TOC entry 3835 (class 2606 OID 115812)
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- TOC entry 3837 (class 2606 OID 115814)
-- Name: proposals proposals_project_id_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposals
    ADD CONSTRAINT proposals_project_id_key UNIQUE (project_id);


--
-- TOC entry 3839 (class 2606 OID 115816)
-- Name: proposals proposals_proposal_number_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposals
    ADD CONSTRAINT proposals_proposal_number_key UNIQUE (proposal_number);


--
-- TOC entry 3913 (class 2606 OID 116298)
-- Name: report_approvals report_approvals_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_approvals
    ADD CONSTRAINT report_approvals_pkey PRIMARY KEY (id);


--
-- TOC entry 3907 (class 2606 OID 116258)
-- Name: report_drafts report_drafts_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_drafts
    ADD CONSTRAINT report_drafts_pkey PRIMARY KEY (id);


--
-- TOC entry 3909 (class 2606 OID 116279)
-- Name: report_versions report_versions_draft_id_version_no_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_versions
    ADD CONSTRAINT report_versions_draft_id_version_no_key UNIQUE (draft_id, version_no);


--
-- TOC entry 3911 (class 2606 OID 116277)
-- Name: report_versions report_versions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_versions
    ADD CONSTRAINT report_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 3811 (class 2606 OID 115675)
-- Name: role_delegations role_delegations_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_delegations
    ADD CONSTRAINT role_delegations_pkey PRIMARY KEY (id);


--
-- TOC entry 3805 (class 2606 OID 115623)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 3797 (class 2606 OID 115608)
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- TOC entry 3799 (class 2606 OID 115606)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 3981 (class 2606 OID 135696)
-- Name: routing_rules routing_rules_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.routing_rules
    ADD CONSTRAINT routing_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 3983 (class 2606 OID 135698)
-- Name: routing_rules routing_rules_project_type_id_department_id_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.routing_rules
    ADD CONSTRAINT routing_rules_project_type_id_department_id_key UNIQUE (project_type_id, department_id);


--
-- TOC entry 3893 (class 2606 OID 116145)
-- Name: samples samples_barcode_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.samples
    ADD CONSTRAINT samples_barcode_key UNIQUE (barcode);


--
-- TOC entry 3895 (class 2606 OID 116141)
-- Name: samples samples_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.samples
    ADD CONSTRAINT samples_pkey PRIMARY KEY (id);


--
-- TOC entry 3897 (class 2606 OID 116143)
-- Name: samples samples_sample_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.samples
    ADD CONSTRAINT samples_sample_code_key UNIQUE (sample_code);


--
-- TOC entry 3928 (class 2606 OID 116413)
-- Name: sap_wbs_jobs sap_wbs_jobs_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.sap_wbs_jobs
    ADD CONSTRAINT sap_wbs_jobs_pkey PRIMARY KEY (id);


--
-- TOC entry 3973 (class 2606 OID 116587)
-- Name: user_sessions session_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3817 (class 2606 OID 115722)
-- Name: sla_rules sla_rules_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.sla_rules
    ADD CONSTRAINT sla_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 3819 (class 2606 OID 115724)
-- Name: sla_rules sla_rules_uniq; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.sla_rules
    ADD CONSTRAINT sla_rules_uniq UNIQUE NULLS NOT DISTINCT (stage_code, project_category);


--
-- TOC entry 3977 (class 2606 OID 135681)
-- Name: stakeholder_units stakeholder_units_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.stakeholder_units
    ADD CONSTRAINT stakeholder_units_code_key UNIQUE (code);


--
-- TOC entry 3979 (class 2606 OID 135679)
-- Name: stakeholder_units stakeholder_units_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.stakeholder_units
    ADD CONSTRAINT stakeholder_units_pkey PRIMARY KEY (id);


--
-- TOC entry 3975 (class 2606 OID 116614)
-- Name: study_catalogue study_catalogue_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.study_catalogue
    ADD CONSTRAINT study_catalogue_pkey PRIMARY KEY (project_type_code);


--
-- TOC entry 3857 (class 2606 OID 115928)
-- Name: tac_agenda_items tac_agenda_items_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_agenda_items
    ADD CONSTRAINT tac_agenda_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3859 (class 2606 OID 115947)
-- Name: tac_decisions tac_decisions_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_decisions
    ADD CONSTRAINT tac_decisions_pkey PRIMARY KEY (id);


--
-- TOC entry 3855 (class 2606 OID 115921)
-- Name: tac_meetings tac_meetings_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_meetings
    ADD CONSTRAINT tac_meetings_pkey PRIMARY KEY (id);


--
-- TOC entry 3883 (class 2606 OID 116096)
-- Name: test_methods test_methods_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_methods
    ADD CONSTRAINT test_methods_code_key UNIQUE (code);


--
-- TOC entry 3885 (class 2606 OID 116094)
-- Name: test_methods test_methods_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_methods
    ADD CONSTRAINT test_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 3899 (class 2606 OID 116160)
-- Name: test_requests test_requests_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_requests
    ADD CONSTRAINT test_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3901 (class 2606 OID 116186)
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3807 (class 2606 OID 115642)
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 3809 (class 2606 OID 115644)
-- Name: user_role_assignments user_role_assignments_uniq; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_role_assignments
    ADD CONSTRAINT user_role_assignments_uniq UNIQUE NULLS NOT DISTINCT (user_id, role_id, scope, department_id, work_centre_id);


--
-- TOC entry 3793 (class 2606 OID 115587)
-- Name: users users_cpf_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.users
    ADD CONSTRAINT users_cpf_key UNIQUE (cpf);


--
-- TOC entry 3795 (class 2606 OID 115585)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 116352)
-- Name: work_centre_feedback work_centre_feedback_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centre_feedback
    ADD CONSTRAINT work_centre_feedback_pkey PRIMARY KEY (id);


--
-- TOC entry 3785 (class 2606 OID 115552)
-- Name: work_centres work_centres_code_key; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centres
    ADD CONSTRAINT work_centres_code_key UNIQUE (code);


--
-- TOC entry 3787 (class 2606 OID 115550)
-- Name: work_centres work_centres_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centres
    ADD CONSTRAINT work_centres_pkey PRIMARY KEY (id);


--
-- TOC entry 3849 (class 2606 OID 115884)
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- TOC entry 3853 (class 2606 OID 115899)
-- Name: workflow_tasks workflow_tasks_pkey; Type: CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.workflow_tasks
    ADD CONSTRAINT workflow_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3971 (class 1259 OID 116588)
-- Name: IDX_session_expire; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX "IDX_session_expire" ON ipeot.user_sessions USING btree (expire);


--
-- TOC entry 3931 (class 1259 OID 116561)
-- Name: audit_log_created_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_created_idx ON ONLY ipeot.audit_log USING btree (created_at DESC);


--
-- TOC entry 3935 (class 1259 OID 116562)
-- Name: audit_log_2026_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2026_created_at_idx ON ipeot.audit_log_2026 USING btree (created_at DESC);


--
-- TOC entry 3932 (class 1259 OID 116571)
-- Name: audit_log_entity_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_entity_idx ON ONLY ipeot.audit_log USING btree (entity, entity_id);


--
-- TOC entry 3936 (class 1259 OID 116572)
-- Name: audit_log_2026_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2026_entity_entity_id_idx ON ipeot.audit_log_2026 USING btree (entity, entity_id);


--
-- TOC entry 3939 (class 1259 OID 116563)
-- Name: audit_log_2027_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2027_created_at_idx ON ipeot.audit_log_2027 USING btree (created_at DESC);


--
-- TOC entry 3940 (class 1259 OID 116573)
-- Name: audit_log_2027_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2027_entity_entity_id_idx ON ipeot.audit_log_2027 USING btree (entity, entity_id);


--
-- TOC entry 3943 (class 1259 OID 116564)
-- Name: audit_log_2028_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2028_created_at_idx ON ipeot.audit_log_2028 USING btree (created_at DESC);


--
-- TOC entry 3944 (class 1259 OID 116574)
-- Name: audit_log_2028_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2028_entity_entity_id_idx ON ipeot.audit_log_2028 USING btree (entity, entity_id);


--
-- TOC entry 3947 (class 1259 OID 116565)
-- Name: audit_log_2029_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2029_created_at_idx ON ipeot.audit_log_2029 USING btree (created_at DESC);


--
-- TOC entry 3948 (class 1259 OID 116575)
-- Name: audit_log_2029_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2029_entity_entity_id_idx ON ipeot.audit_log_2029 USING btree (entity, entity_id);


--
-- TOC entry 3951 (class 1259 OID 116566)
-- Name: audit_log_2030_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2030_created_at_idx ON ipeot.audit_log_2030 USING btree (created_at DESC);


--
-- TOC entry 3952 (class 1259 OID 116576)
-- Name: audit_log_2030_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2030_entity_entity_id_idx ON ipeot.audit_log_2030 USING btree (entity, entity_id);


--
-- TOC entry 3955 (class 1259 OID 116567)
-- Name: audit_log_2031_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2031_created_at_idx ON ipeot.audit_log_2031 USING btree (created_at DESC);


--
-- TOC entry 3956 (class 1259 OID 116577)
-- Name: audit_log_2031_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2031_entity_entity_id_idx ON ipeot.audit_log_2031 USING btree (entity, entity_id);


--
-- TOC entry 3959 (class 1259 OID 116568)
-- Name: audit_log_2032_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2032_created_at_idx ON ipeot.audit_log_2032 USING btree (created_at DESC);


--
-- TOC entry 3960 (class 1259 OID 116578)
-- Name: audit_log_2032_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2032_entity_entity_id_idx ON ipeot.audit_log_2032 USING btree (entity, entity_id);


--
-- TOC entry 3963 (class 1259 OID 116569)
-- Name: audit_log_2033_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2033_created_at_idx ON ipeot.audit_log_2033 USING btree (created_at DESC);


--
-- TOC entry 3964 (class 1259 OID 116579)
-- Name: audit_log_2033_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_2033_entity_entity_id_idx ON ipeot.audit_log_2033 USING btree (entity, entity_id);


--
-- TOC entry 3967 (class 1259 OID 116570)
-- Name: audit_log_default_created_at_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_default_created_at_idx ON ipeot.audit_log_default USING btree (created_at DESC);


--
-- TOC entry 3968 (class 1259 OID 116580)
-- Name: audit_log_default_entity_entity_id_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX audit_log_default_entity_entity_id_idx ON ipeot.audit_log_default USING btree (entity, entity_id);


--
-- TOC entry 3924 (class 1259 OID 116384)
-- Name: notifications_user_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX notifications_user_idx ON ipeot.notifications USING btree (user_id, created_at DESC);


--
-- TOC entry 3830 (class 1259 OID 115800)
-- Name: projects_department_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX projects_department_idx ON ipeot.projects USING btree (department_id);


--
-- TOC entry 3833 (class 1259 OID 115799)
-- Name: projects_status_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX projects_status_idx ON ipeot.projects USING btree (status);


--
-- TOC entry 3850 (class 1259 OID 115911)
-- Name: workflow_tasks_due_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX workflow_tasks_due_idx ON ipeot.workflow_tasks USING btree (due_at) WHERE (status = 'pending'::ipeot.task_status);


--
-- TOC entry 3851 (class 1259 OID 115910)
-- Name: workflow_tasks_inbox_idx; Type: INDEX; Schema: ipeot; Owner: digi_user
--

CREATE INDEX workflow_tasks_inbox_idx ON ipeot.workflow_tasks USING btree (assignee_user_id, status);


--
-- TOC entry 3994 (class 0 OID 0)
-- Name: audit_log_2026_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2026_created_at_idx;


--
-- TOC entry 3995 (class 0 OID 0)
-- Name: audit_log_2026_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2026_entity_entity_id_idx;


--
-- TOC entry 3996 (class 0 OID 0)
-- Name: audit_log_2026_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2026_pkey;


--
-- TOC entry 3997 (class 0 OID 0)
-- Name: audit_log_2027_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2027_created_at_idx;


--
-- TOC entry 3998 (class 0 OID 0)
-- Name: audit_log_2027_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2027_entity_entity_id_idx;


--
-- TOC entry 3999 (class 0 OID 0)
-- Name: audit_log_2027_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2027_pkey;


--
-- TOC entry 4000 (class 0 OID 0)
-- Name: audit_log_2028_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2028_created_at_idx;


--
-- TOC entry 4001 (class 0 OID 0)
-- Name: audit_log_2028_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2028_entity_entity_id_idx;


--
-- TOC entry 4002 (class 0 OID 0)
-- Name: audit_log_2028_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2028_pkey;


--
-- TOC entry 4003 (class 0 OID 0)
-- Name: audit_log_2029_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2029_created_at_idx;


--
-- TOC entry 4004 (class 0 OID 0)
-- Name: audit_log_2029_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2029_entity_entity_id_idx;


--
-- TOC entry 4005 (class 0 OID 0)
-- Name: audit_log_2029_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2029_pkey;


--
-- TOC entry 4006 (class 0 OID 0)
-- Name: audit_log_2030_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2030_created_at_idx;


--
-- TOC entry 4007 (class 0 OID 0)
-- Name: audit_log_2030_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2030_entity_entity_id_idx;


--
-- TOC entry 4008 (class 0 OID 0)
-- Name: audit_log_2030_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2030_pkey;


--
-- TOC entry 4009 (class 0 OID 0)
-- Name: audit_log_2031_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2031_created_at_idx;


--
-- TOC entry 4010 (class 0 OID 0)
-- Name: audit_log_2031_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2031_entity_entity_id_idx;


--
-- TOC entry 4011 (class 0 OID 0)
-- Name: audit_log_2031_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2031_pkey;


--
-- TOC entry 4012 (class 0 OID 0)
-- Name: audit_log_2032_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2032_created_at_idx;


--
-- TOC entry 4013 (class 0 OID 0)
-- Name: audit_log_2032_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2032_entity_entity_id_idx;


--
-- TOC entry 4014 (class 0 OID 0)
-- Name: audit_log_2032_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2032_pkey;


--
-- TOC entry 4015 (class 0 OID 0)
-- Name: audit_log_2033_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_2033_created_at_idx;


--
-- TOC entry 4016 (class 0 OID 0)
-- Name: audit_log_2033_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_2033_entity_entity_id_idx;


--
-- TOC entry 4017 (class 0 OID 0)
-- Name: audit_log_2033_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_2033_pkey;


--
-- TOC entry 4018 (class 0 OID 0)
-- Name: audit_log_default_created_at_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_created_idx ATTACH PARTITION ipeot.audit_log_default_created_at_idx;


--
-- TOC entry 4019 (class 0 OID 0)
-- Name: audit_log_default_entity_entity_id_idx; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_entity_idx ATTACH PARTITION ipeot.audit_log_default_entity_entity_id_idx;


--
-- TOC entry 4020 (class 0 OID 0)
-- Name: audit_log_default_pkey; Type: INDEX ATTACH; Schema: ipeot; Owner: digi_user
--

ALTER INDEX ipeot.audit_log_pkey ATTACH PARTITION ipeot.audit_log_default_pkey;


--
-- TOC entry 4117 (class 2620 OID 116593)
-- Name: approval_matrix approval_matrix_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER approval_matrix_touch BEFORE UPDATE ON ipeot.approval_matrix FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4125 (class 2620 OID 116551)
-- Name: audit_log audit_log_no_update; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER audit_log_no_update BEFORE DELETE OR UPDATE ON ipeot.audit_log FOR EACH ROW EXECUTE FUNCTION ipeot.prevent_audit_mutation();


--
-- TOC entry 4119 (class 2620 OID 116595)
-- Name: awp_cycles awp_cycles_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER awp_cycles_touch BEFORE UPDATE ON ipeot.awp_cycles FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4114 (class 2620 OID 116590)
-- Name: departments departments_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER departments_touch BEFORE UPDATE ON ipeot.departments FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4122 (class 2620 OID 116598)
-- Name: iso_documents iso_documents_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER iso_documents_touch BEFORE UPDATE ON ipeot.iso_documents FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4118 (class 2620 OID 116594)
-- Name: project_types project_types_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER project_types_touch BEFORE UPDATE ON ipeot.project_types FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4120 (class 2620 OID 116596)
-- Name: projects projects_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER projects_touch BEFORE UPDATE ON ipeot.projects FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4121 (class 2620 OID 116597)
-- Name: proposals proposals_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER proposals_touch BEFORE UPDATE ON ipeot.proposals FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4123 (class 2620 OID 116599)
-- Name: report_drafts report_drafts_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER report_drafts_touch BEFORE UPDATE ON ipeot.report_drafts FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4124 (class 2620 OID 116600)
-- Name: sap_wbs_jobs sap_wbs_jobs_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER sap_wbs_jobs_touch BEFORE UPDATE ON ipeot.sap_wbs_jobs FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4116 (class 2620 OID 116592)
-- Name: users users_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER users_touch BEFORE UPDATE ON ipeot.users FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4115 (class 2620 OID 116591)
-- Name: work_centres work_centres_touch; Type: TRIGGER; Schema: ipeot; Owner: digi_user
--

CREATE TRIGGER work_centres_touch BEFORE UPDATE ON ipeot.work_centres FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at();


--
-- TOC entry 4034 (class 2606 OID 115706)
-- Name: approval_matrix approval_matrix_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.approval_matrix
    ADD CONSTRAINT approval_matrix_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4100 (class 2606 OID 116519)
-- Name: audit_log audit_log_actor_fk; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ipeot.audit_log
    ADD CONSTRAINT audit_log_actor_fk FOREIGN KEY (actor_id) REFERENCES ipeot.users(id) ON DELETE SET NULL;


--
-- TOC entry 4112 (class 2606 OID 135783)
-- Name: awp_package_tasks awp_package_tasks_awp_cycle_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_package_tasks
    ADD CONSTRAINT awp_package_tasks_awp_cycle_id_fkey FOREIGN KEY (awp_cycle_id) REFERENCES ipeot.awp_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 4113 (class 2606 OID 135788)
-- Name: awp_package_tasks awp_package_tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_package_tasks
    ADD CONSTRAINT awp_package_tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4111 (class 2606 OID 135768)
-- Name: awp_reminder_log awp_reminder_log_awp_cycle_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_reminder_log
    ADD CONSTRAINT awp_reminder_log_awp_cycle_id_fkey FOREIGN KEY (awp_cycle_id) REFERENCES ipeot.awp_cycles(id) ON DELETE CASCADE;


--
-- TOC entry 4047 (class 2606 OID 115857)
-- Name: awp_submissions awp_submissions_awp_cycle_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_submissions
    ADD CONSTRAINT awp_submissions_awp_cycle_id_fkey FOREIGN KEY (awp_cycle_id) REFERENCES ipeot.awp_cycles(id);


--
-- TOC entry 4048 (class 2606 OID 115862)
-- Name: awp_submissions awp_submissions_proposal_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_submissions
    ADD CONSTRAINT awp_submissions_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES ipeot.proposals(id);


--
-- TOC entry 4049 (class 2606 OID 115867)
-- Name: awp_submissions awp_submissions_submitted_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.awp_submissions
    ADD CONSTRAINT awp_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4071 (class 2606 OID 116126)
-- Name: calibrations calibrations_certificate_file_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.calibrations
    ADD CONSTRAINT calibrations_certificate_file_id_fkey FOREIGN KEY (certificate_file_id) REFERENCES ipeot.files(id);


--
-- TOC entry 4072 (class 2606 OID 116121)
-- Name: calibrations calibrations_instrument_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.calibrations
    ADD CONSTRAINT calibrations_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES ipeot.instruments(id);


--
-- TOC entry 4082 (class 2606 OID 116221)
-- Name: consumables consumables_lab_location_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.consumables
    ADD CONSTRAINT consumables_lab_location_id_fkey FOREIGN KEY (lab_location_id) REFERENCES ipeot.lab_locations(id);


--
-- TOC entry 4093 (class 2606 OID 116339)
-- Name: distribution_log distribution_log_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.distribution_log
    ADD CONSTRAINT distribution_log_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4061 (class 2606 OID 115997)
-- Name: files files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.files
    ADD CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4091 (class 2606 OID 116325)
-- Name: final_reports final_reports_file_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.final_reports
    ADD CONSTRAINT final_reports_file_id_fkey FOREIGN KEY (file_id) REFERENCES ipeot.files(id);


--
-- TOC entry 4092 (class 2606 OID 116320)
-- Name: final_reports final_reports_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.final_reports
    ADD CONSTRAINT final_reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4022 (class 2606 OID 115570)
-- Name: installations installations_work_centre_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.installations
    ADD CONSTRAINT installations_work_centre_id_fkey FOREIGN KEY (work_centre_id) REFERENCES ipeot.work_centres(id);


--
-- TOC entry 4070 (class 2606 OID 116108)
-- Name: instruments instruments_lab_location_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.instruments
    ADD CONSTRAINT instruments_lab_location_id_fkey FOREIGN KEY (lab_location_id) REFERENCES ipeot.lab_locations(id);


--
-- TOC entry 4063 (class 2606 OID 116041)
-- Name: iso_document_versions iso_document_versions_approved_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_document_versions
    ADD CONSTRAINT iso_document_versions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4064 (class 2606 OID 116046)
-- Name: iso_document_versions iso_document_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_document_versions
    ADD CONSTRAINT iso_document_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4065 (class 2606 OID 116031)
-- Name: iso_document_versions iso_document_versions_document_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_document_versions
    ADD CONSTRAINT iso_document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES ipeot.iso_documents(id) ON DELETE CASCADE;


--
-- TOC entry 4066 (class 2606 OID 116036)
-- Name: iso_document_versions iso_document_versions_file_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_document_versions
    ADD CONSTRAINT iso_document_versions_file_id_fkey FOREIGN KEY (file_id) REFERENCES ipeot.files(id);


--
-- TOC entry 4062 (class 2606 OID 116015)
-- Name: iso_documents iso_documents_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.iso_documents
    ADD CONSTRAINT iso_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4069 (class 2606 OID 116082)
-- Name: lab_locations lab_locations_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.lab_locations
    ADD CONSTRAINT lab_locations_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4083 (class 2606 OID 116236)
-- Name: maintenance_tickets maintenance_tickets_instrument_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES ipeot.instruments(id);


--
-- TOC entry 4084 (class 2606 OID 116241)
-- Name: maintenance_tickets maintenance_tickets_opened_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4067 (class 2606 OID 116066)
-- Name: milestones milestones_pas_document_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.milestones
    ADD CONSTRAINT milestones_pas_document_id_fkey FOREIGN KEY (pas_document_id) REFERENCES ipeot.iso_documents(id);


--
-- TOC entry 4068 (class 2606 OID 116061)
-- Name: milestones milestones_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.milestones
    ADD CONSTRAINT milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4098 (class 2606 OID 116395)
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES ipeot.users(id) ON DELETE CASCADE;


--
-- TOC entry 4097 (class 2606 OID 116379)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4109 (class 2606 OID 135752)
-- Name: outbound_mail outbound_mail_awp_cycle_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.outbound_mail
    ADD CONSTRAINT outbound_mail_awp_cycle_id_fkey FOREIGN KEY (awp_cycle_id) REFERENCES ipeot.awp_cycles(id);


--
-- TOC entry 4110 (class 2606 OID 135757)
-- Name: outbound_mail outbound_mail_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.outbound_mail
    ADD CONSTRAINT outbound_mail_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4105 (class 2606 OID 135719)
-- Name: project_routes project_routes_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_routes
    ADD CONSTRAINT project_routes_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4106 (class 2606 OID 135714)
-- Name: project_routes project_routes_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_routes
    ADD CONSTRAINT project_routes_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4058 (class 2606 OID 115979)
-- Name: project_team project_team_allotted_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_team
    ADD CONSTRAINT project_team_allotted_by_fkey FOREIGN KEY (allotted_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4059 (class 2606 OID 115969)
-- Name: project_team project_team_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_team
    ADD CONSTRAINT project_team_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4060 (class 2606 OID 115974)
-- Name: project_team project_team_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_team
    ADD CONSTRAINT project_team_user_id_fkey FOREIGN KEY (user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4035 (class 2606 OID 115738)
-- Name: project_types project_types_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_types
    ADD CONSTRAINT project_types_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4036 (class 2606 OID 115743)
-- Name: project_types project_types_work_centre_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.project_types
    ADD CONSTRAINT project_types_work_centre_id_fkey FOREIGN KEY (work_centre_id) REFERENCES ipeot.work_centres(id);


--
-- TOC entry 4037 (class 2606 OID 115789)
-- Name: projects projects_awp_cycle_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_awp_cycle_id_fkey FOREIGN KEY (awp_cycle_id) REFERENCES ipeot.awp_cycles(id);


--
-- TOC entry 4038 (class 2606 OID 115794)
-- Name: projects projects_created_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4039 (class 2606 OID 115774)
-- Name: projects projects_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4040 (class 2606 OID 135662)
-- Name: projects projects_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4041 (class 2606 OID 115784)
-- Name: projects projects_project_type_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES ipeot.project_types(id);


--
-- TOC entry 4042 (class 2606 OID 115779)
-- Name: projects projects_work_centre_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.projects
    ADD CONSTRAINT projects_work_centre_id_fkey FOREIGN KEY (work_centre_id) REFERENCES ipeot.work_centres(id);


--
-- TOC entry 4107 (class 2606 OID 135733)
-- Name: proposal_files proposal_files_proposal_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_files
    ADD CONSTRAINT proposal_files_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES ipeot.proposals(id) ON DELETE CASCADE;


--
-- TOC entry 4108 (class 2606 OID 135738)
-- Name: proposal_files proposal_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_files
    ADD CONSTRAINT proposal_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4045 (class 2606 OID 115843)
-- Name: proposal_versions proposal_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_versions
    ADD CONSTRAINT proposal_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4046 (class 2606 OID 115838)
-- Name: proposal_versions proposal_versions_proposal_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposal_versions
    ADD CONSTRAINT proposal_versions_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES ipeot.proposals(id) ON DELETE CASCADE;


--
-- TOC entry 4043 (class 2606 OID 115822)
-- Name: proposals proposals_created_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposals
    ADD CONSTRAINT proposals_created_by_fkey FOREIGN KEY (created_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4044 (class 2606 OID 115817)
-- Name: proposals proposals_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.proposals
    ADD CONSTRAINT proposals_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4089 (class 2606 OID 116304)
-- Name: report_approvals report_approvals_actor_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_approvals
    ADD CONSTRAINT report_approvals_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4090 (class 2606 OID 116299)
-- Name: report_approvals report_approvals_version_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_approvals
    ADD CONSTRAINT report_approvals_version_id_fkey FOREIGN KEY (version_id) REFERENCES ipeot.report_versions(id);


--
-- TOC entry 4085 (class 2606 OID 116264)
-- Name: report_drafts report_drafts_created_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_drafts
    ADD CONSTRAINT report_drafts_created_by_fkey FOREIGN KEY (created_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4086 (class 2606 OID 116259)
-- Name: report_drafts report_drafts_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_drafts
    ADD CONSTRAINT report_drafts_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4087 (class 2606 OID 116285)
-- Name: report_versions report_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_versions
    ADD CONSTRAINT report_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4088 (class 2606 OID 116280)
-- Name: report_versions report_versions_draft_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.report_versions
    ADD CONSTRAINT report_versions_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES ipeot.report_drafts(id) ON DELETE CASCADE;


--
-- TOC entry 4031 (class 2606 OID 115676)
-- Name: role_delegations role_delegations_from_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_delegations
    ADD CONSTRAINT role_delegations_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4032 (class 2606 OID 115686)
-- Name: role_delegations role_delegations_role_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_delegations
    ADD CONSTRAINT role_delegations_role_id_fkey FOREIGN KEY (role_id) REFERENCES ipeot.roles(id);


--
-- TOC entry 4033 (class 2606 OID 115681)
-- Name: role_delegations role_delegations_to_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_delegations
    ADD CONSTRAINT role_delegations_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4025 (class 2606 OID 115629)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES ipeot.permissions(id) ON DELETE CASCADE;


--
-- TOC entry 4026 (class 2606 OID 115624)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES ipeot.roles(id) ON DELETE CASCADE;


--
-- TOC entry 4103 (class 2606 OID 135704)
-- Name: routing_rules routing_rules_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.routing_rules
    ADD CONSTRAINT routing_rules_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4104 (class 2606 OID 135699)
-- Name: routing_rules routing_rules_project_type_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.routing_rules
    ADD CONSTRAINT routing_rules_project_type_id_fkey FOREIGN KEY (project_type_id) REFERENCES ipeot.project_types(id);


--
-- TOC entry 4073 (class 2606 OID 116146)
-- Name: samples samples_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.samples
    ADD CONSTRAINT samples_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4099 (class 2606 OID 116414)
-- Name: sap_wbs_jobs sap_wbs_jobs_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.sap_wbs_jobs
    ADD CONSTRAINT sap_wbs_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4102 (class 2606 OID 135682)
-- Name: stakeholder_units stakeholder_units_coordinator_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.stakeholder_units
    ADD CONSTRAINT stakeholder_units_coordinator_user_id_fkey FOREIGN KEY (coordinator_user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4101 (class 2606 OID 116615)
-- Name: study_catalogue study_catalogue_project_type_code_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.study_catalogue
    ADD CONSTRAINT study_catalogue_project_type_code_fkey FOREIGN KEY (project_type_code) REFERENCES ipeot.project_types(code);


--
-- TOC entry 4054 (class 2606 OID 115929)
-- Name: tac_agenda_items tac_agenda_items_meeting_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_agenda_items
    ADD CONSTRAINT tac_agenda_items_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES ipeot.tac_meetings(id) ON DELETE CASCADE;


--
-- TOC entry 4055 (class 2606 OID 115934)
-- Name: tac_agenda_items tac_agenda_items_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_agenda_items
    ADD CONSTRAINT tac_agenda_items_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4056 (class 2606 OID 115948)
-- Name: tac_decisions tac_decisions_agenda_item_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_decisions
    ADD CONSTRAINT tac_decisions_agenda_item_id_fkey FOREIGN KEY (agenda_item_id) REFERENCES ipeot.tac_agenda_items(id) ON DELETE CASCADE;


--
-- TOC entry 4057 (class 2606 OID 115953)
-- Name: tac_decisions tac_decisions_decided_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.tac_decisions
    ADD CONSTRAINT tac_decisions_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4074 (class 2606 OID 116166)
-- Name: test_requests test_requests_method_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_requests
    ADD CONSTRAINT test_requests_method_id_fkey FOREIGN KEY (method_id) REFERENCES ipeot.test_methods(id);


--
-- TOC entry 4075 (class 2606 OID 116171)
-- Name: test_requests test_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_requests
    ADD CONSTRAINT test_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4076 (class 2606 OID 116161)
-- Name: test_requests test_requests_sample_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_requests
    ADD CONSTRAINT test_requests_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES ipeot.samples(id);


--
-- TOC entry 4077 (class 2606 OID 116192)
-- Name: test_results test_results_analyst_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_results
    ADD CONSTRAINT test_results_analyst_id_fkey FOREIGN KEY (analyst_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4078 (class 2606 OID 116207)
-- Name: test_results test_results_approved_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_results
    ADD CONSTRAINT test_results_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4079 (class 2606 OID 116202)
-- Name: test_results test_results_file_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_results
    ADD CONSTRAINT test_results_file_id_fkey FOREIGN KEY (file_id) REFERENCES ipeot.files(id);


--
-- TOC entry 4080 (class 2606 OID 116197)
-- Name: test_results test_results_instrument_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_results
    ADD CONSTRAINT test_results_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES ipeot.instruments(id);


--
-- TOC entry 4081 (class 2606 OID 116187)
-- Name: test_results test_results_request_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.test_results
    ADD CONSTRAINT test_results_request_id_fkey FOREIGN KEY (request_id) REFERENCES ipeot.test_requests(id);


--
-- TOC entry 4027 (class 2606 OID 115655)
-- Name: user_role_assignments user_role_assignments_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_role_assignments
    ADD CONSTRAINT user_role_assignments_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4028 (class 2606 OID 115650)
-- Name: user_role_assignments user_role_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_role_assignments
    ADD CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES ipeot.roles(id);


--
-- TOC entry 4029 (class 2606 OID 115645)
-- Name: user_role_assignments user_role_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_role_assignments
    ADD CONSTRAINT user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES ipeot.users(id) ON DELETE CASCADE;


--
-- TOC entry 4030 (class 2606 OID 115660)
-- Name: user_role_assignments user_role_assignments_work_centre_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.user_role_assignments
    ADD CONSTRAINT user_role_assignments_work_centre_id_fkey FOREIGN KEY (work_centre_id) REFERENCES ipeot.work_centres(id);


--
-- TOC entry 4023 (class 2606 OID 115588)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4024 (class 2606 OID 115593)
-- Name: users users_work_centre_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.users
    ADD CONSTRAINT users_work_centre_id_fkey FOREIGN KEY (work_centre_id) REFERENCES ipeot.work_centres(id);


--
-- TOC entry 4094 (class 2606 OID 116353)
-- Name: work_centre_feedback work_centre_feedback_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centre_feedback
    ADD CONSTRAINT work_centre_feedback_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id);


--
-- TOC entry 4095 (class 2606 OID 116363)
-- Name: work_centre_feedback work_centre_feedback_submitted_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centre_feedback
    ADD CONSTRAINT work_centre_feedback_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4096 (class 2606 OID 116358)
-- Name: work_centre_feedback work_centre_feedback_work_centre_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centre_feedback
    ADD CONSTRAINT work_centre_feedback_work_centre_id_fkey FOREIGN KEY (work_centre_id) REFERENCES ipeot.work_centres(id);


--
-- TOC entry 4021 (class 2606 OID 115553)
-- Name: work_centres work_centres_department_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.work_centres
    ADD CONSTRAINT work_centres_department_id_fkey FOREIGN KEY (department_id) REFERENCES ipeot.departments(id);


--
-- TOC entry 4050 (class 2606 OID 115885)
-- Name: workflow_instances workflow_instances_project_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.workflow_instances
    ADD CONSTRAINT workflow_instances_project_id_fkey FOREIGN KEY (project_id) REFERENCES ipeot.projects(id) ON DELETE CASCADE;


--
-- TOC entry 4051 (class 2606 OID 115905)
-- Name: workflow_tasks workflow_tasks_assignee_user_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.workflow_tasks
    ADD CONSTRAINT workflow_tasks_assignee_user_id_fkey FOREIGN KEY (assignee_user_id) REFERENCES ipeot.users(id);


--
-- TOC entry 4052 (class 2606 OID 116623)
-- Name: workflow_tasks workflow_tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.workflow_tasks
    ADD CONSTRAINT workflow_tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES ipeot.users(id);


--
-- TOC entry 4053 (class 2606 OID 115900)
-- Name: workflow_tasks workflow_tasks_instance_id_fkey; Type: FK CONSTRAINT; Schema: ipeot; Owner: digi_user
--

ALTER TABLE ONLY ipeot.workflow_tasks
    ADD CONSTRAINT workflow_tasks_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES ipeot.workflow_instances(id) ON DELETE CASCADE;


-- Completed on 2026-11-18 15:32:23 IST

--
-- PostgreSQL database dump complete
--

