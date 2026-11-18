-- IPEOT core schema (blueprint section 6) plus reference seed.
-- Apply against database ipeot:
--   psql -h localhost -p 5490 -U digi_user -d ipeot -v ON_ERROR_STOP=1 -f migrations/001_ipeot_core.sql
-- Re-running is safe. Development users 100001-100009 share password Ipeot@123.
-- Replace those users before any shared deployment.
-- The consolidate workbook names six departments (I-VI). A seventh can be added in admin.

BEGIN;

CREATE SCHEMA IF NOT EXISTS ipeot;

DO $$ BEGIN
  CREATE TYPE ipeot.project_category AS ENUM ('scheduled', 'unscheduled', 'short_term');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.project_status AS ENUM (
    'draft', 'submitted', 'in_review', 'scope_modification', 'endorsed',
    'authorized', 'authorized_pending_wbs', 'in_progress', 'report_review',
    'closed', 'rejected', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.workflow_action AS ENUM ('accept', 'modify', 'reject', 'endorse', 'authorize');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.task_status AS ENUM ('pending', 'completed', 'cancelled', 'escalated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.iso_doc_type AS ENUM ('PDS', 'PAS', 'PCR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.assignment_scope AS ENUM ('global', 'department', 'work_centre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.awp_status AS ENUM ('draft', 'open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ipeot.virus_scan_status AS ENUM ('pending', 'clean', 'infected', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION ipeot.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION ipeot.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;

CREATE TABLE IF NOT EXISTS ipeot.departments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.work_centres (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department_id bigint REFERENCES ipeot.departments (id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.installations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  work_centre_id bigint REFERENCES ipeot.work_centres (id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cpf text NOT NULL UNIQUE,
  name text NOT NULL,
  email text,
  phone text,
  password_hash text,
  active boolean NOT NULL DEFAULT true,
  department_id bigint REFERENCES ipeot.departments (id),
  work_centre_id bigint REFERENCES ipeot.work_centres (id),
  ad_dn text,
  sap_employee_id text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.roles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.permissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS ipeot.role_permissions (
  role_id bigint NOT NULL REFERENCES ipeot.roles (id) ON DELETE CASCADE,
  permission_id bigint NOT NULL REFERENCES ipeot.permissions (id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS ipeot.user_role_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES ipeot.users (id) ON DELETE CASCADE,
  role_id bigint NOT NULL REFERENCES ipeot.roles (id),
  scope ipeot.assignment_scope NOT NULL DEFAULT 'global',
  department_id bigint REFERENCES ipeot.departments (id),
  work_centre_id bigint REFERENCES ipeot.work_centres (id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_role_assignments_uniq UNIQUE NULLS NOT DISTINCT (user_id, role_id, scope, department_id, work_centre_id)
);

CREATE TABLE IF NOT EXISTS ipeot.role_delegations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_user_id bigint NOT NULL REFERENCES ipeot.users (id),
  to_user_id bigint NOT NULL REFERENCES ipeot.users (id),
  role_id bigint REFERENCES ipeot.roles (id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_delegations_window CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS ipeot.approval_matrix (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_category ipeot.project_category NOT NULL,
  department_id bigint REFERENCES ipeot.departments (id),
  stage_code text NOT NULL,
  stage_name text NOT NULL,
  stage_order integer NOT NULL CHECK (stage_order > 0),
  assignee_role_code text NOT NULL,
  applies_to text NOT NULL CHECK (applies_to IN ('proposal', 'report')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT approval_matrix_stage_uniq UNIQUE NULLS NOT DISTINCT (project_category, department_id, applies_to, stage_order)
);

CREATE TABLE IF NOT EXISTS ipeot.sla_rules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stage_code text NOT NULL,
  project_category ipeot.project_category,
  target_days integer NOT NULL CHECK (target_days > 0),
  reminder_offsets_days integer[] NOT NULL DEFAULT '{2,1}',
  escalation_role_code text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sla_rules_uniq UNIQUE NULLS NOT DISTINCT (stage_code, project_category)
);

CREATE TABLE IF NOT EXISTS ipeot.project_types (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department_id bigint REFERENCES ipeot.departments (id),
  work_centre_id bigint REFERENCES ipeot.work_centres (id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.awp_cycles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  year integer NOT NULL,
  title text NOT NULL,
  window_open timestamptz,
  window_close timestamptz,
  status ipeot.awp_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year, title)
);

CREATE TABLE IF NOT EXISTS ipeot.projects (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_category ipeot.project_category NOT NULL,
  department_id bigint NOT NULL REFERENCES ipeot.departments (id),
  work_centre_id bigint REFERENCES ipeot.work_centres (id),
  project_type_id bigint REFERENCES ipeot.project_types (id),
  title text NOT NULL,
  status ipeot.project_status NOT NULL DEFAULT 'draft',
  wbs_number text,
  accession_number text UNIQUE,
  awp_cycle_id bigint REFERENCES ipeot.awp_cycles (id),
  created_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON ipeot.projects (status);
CREATE INDEX IF NOT EXISTS projects_department_idx ON ipeot.projects (department_id);

CREATE TABLE IF NOT EXISTS ipeot.proposals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL UNIQUE REFERENCES ipeot.projects (id) ON DELETE CASCADE,
  proposal_number text UNIQUE,
  form jsonb NOT NULL DEFAULT '{}',
  current_version integer NOT NULL DEFAULT 1,
  submitted_at timestamptz,
  created_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.proposal_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proposal_id bigint NOT NULL REFERENCES ipeot.proposals (id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  snapshot jsonb NOT NULL,
  reason text,
  created_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, version_no)
);

CREATE TABLE IF NOT EXISTS ipeot.awp_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  awp_cycle_id bigint NOT NULL REFERENCES ipeot.awp_cycles (id),
  proposal_id bigint NOT NULL REFERENCES ipeot.proposals (id),
  submitted_by bigint REFERENCES ipeot.users (id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (awp_cycle_id, proposal_id)
);

CREATE TABLE IF NOT EXISTS ipeot.workflow_instances (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id) ON DELETE CASCADE,
  applies_to text NOT NULL DEFAULT 'proposal' CHECK (applies_to IN ('proposal', 'report')),
  current_stage text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS ipeot.workflow_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instance_id bigint NOT NULL REFERENCES ipeot.workflow_instances (id) ON DELETE CASCADE,
  stage_code text NOT NULL,
  stage_order integer NOT NULL,
  assignee_role_code text,
  assignee_user_id bigint REFERENCES ipeot.users (id),
  status ipeot.task_status NOT NULL DEFAULT 'pending',
  action ipeot.workflow_action,
  remarks text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workflow_tasks_inbox_idx ON ipeot.workflow_tasks (assignee_user_id, status);
CREATE INDEX IF NOT EXISTS workflow_tasks_due_idx ON ipeot.workflow_tasks (due_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS ipeot.tac_meetings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.tac_agenda_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  meeting_id bigint NOT NULL REFERENCES ipeot.tac_meetings (id) ON DELETE CASCADE,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id),
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ipeot.tac_decisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agenda_item_id bigint NOT NULL REFERENCES ipeot.tac_agenda_items (id) ON DELETE CASCADE,
  decision text NOT NULL,
  remarks text,
  decided_by bigint REFERENCES ipeot.users (id),
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.project_team (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES ipeot.users (id),
  role_on_project text NOT NULL,
  allotted_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id, role_on_project)
);

CREATE TABLE IF NOT EXISTS ipeot.files (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  storage_key text NOT NULL UNIQUE,
  original_name text NOT NULL,
  mime text,
  size_bytes bigint NOT NULL DEFAULT 0,
  virus_scan_status ipeot.virus_scan_status NOT NULL DEFAULT 'pending',
  uploaded_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.iso_documents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id) ON DELETE CASCADE,
  doc_type ipeot.iso_doc_type NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, doc_type)
);

CREATE TABLE IF NOT EXISTS ipeot.iso_document_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id bigint NOT NULL REFERENCES ipeot.iso_documents (id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  content jsonb,
  file_id bigint REFERENCES ipeot.files (id),
  approved_by bigint REFERENCES ipeot.users (id),
  created_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_no)
);

CREATE TABLE IF NOT EXISTS ipeot.milestones (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at date,
  completed_at timestamptz,
  pas_document_id bigint REFERENCES ipeot.iso_documents (id),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.lab_locations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  department_id bigint REFERENCES ipeot.departments (id),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ipeot.test_methods (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS ipeot.instruments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  lab_location_id bigint REFERENCES ipeot.lab_locations (id),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ipeot.calibrations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instrument_id bigint NOT NULL REFERENCES ipeot.instruments (id),
  calibrated_at timestamptz NOT NULL,
  valid_until timestamptz,
  certificate_file_id bigint REFERENCES ipeot.files (id),
  notes text
);

CREATE TABLE IF NOT EXISTS ipeot.samples (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_code text NOT NULL UNIQUE,
  barcode text UNIQUE,
  project_id bigint REFERENCES ipeot.projects (id),
  received_at timestamptz,
  custody jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.test_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sample_id bigint NOT NULL REFERENCES ipeot.samples (id),
  method_id bigint REFERENCES ipeot.test_methods (id),
  requested_by bigint REFERENCES ipeot.users (id),
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.test_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id bigint NOT NULL REFERENCES ipeot.test_requests (id),
  analyst_id bigint REFERENCES ipeot.users (id),
  instrument_id bigint REFERENCES ipeot.instruments (id),
  result jsonb NOT NULL DEFAULT '{}',
  file_id bigint REFERENCES ipeot.files (id),
  approval_state text NOT NULL DEFAULT 'draft',
  approved_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.consumables (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  sku text,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  lab_location_id bigint REFERENCES ipeot.lab_locations (id)
);

CREATE TABLE IF NOT EXISTS ipeot.maintenance_tickets (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  instrument_id bigint REFERENCES ipeot.instruments (id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  opened_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.report_drafts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id),
  sections jsonb NOT NULL DEFAULT '[]',
  ai_generated boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  created_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.report_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  draft_id bigint NOT NULL REFERENCES ipeot.report_drafts (id) ON DELETE CASCADE,
  version_no integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draft_id, version_no)
);

CREATE TABLE IF NOT EXISTS ipeot.report_approvals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_id bigint NOT NULL REFERENCES ipeot.report_versions (id),
  stage_code text NOT NULL,
  action text NOT NULL,
  actor_id bigint REFERENCES ipeot.users (id),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.final_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL UNIQUE REFERENCES ipeot.projects (id),
  file_id bigint REFERENCES ipeot.files (id),
  locked_at timestamptz,
  signature jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.distribution_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id),
  audience text NOT NULL,
  recipient text,
  channel text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.work_centre_feedback (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id),
  work_centre_id bigint REFERENCES ipeot.work_centres (id),
  rating integer,
  comments text,
  submitted_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES ipeot.users (id),
  title text NOT NULL,
  body text,
  channel text NOT NULL DEFAULT 'in_app',
  read_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON ipeot.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ipeot.notification_preferences (
  user_id bigint PRIMARY KEY REFERENCES ipeot.users (id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  digest text NOT NULL DEFAULT 'daily'
);

CREATE TABLE IF NOT EXISTS ipeot.sap_wbs_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id bigint NOT NULL REFERENCES ipeot.projects (id),
  request jsonb NOT NULL DEFAULT '{}',
  response jsonb,
  status text NOT NULL DEFAULT 'queued',
  retry_count integer NOT NULL DEFAULT 0,
  manual_pcc_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.integration_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- Append-only, partitioned by year for the 7-year retention window (NFR-03).
CREATE TABLE IF NOT EXISTS ipeot.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  actor_id bigint,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS ipeot.audit_log_2026 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2026-01-01+00') TO ('2027-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2027 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2027-01-01+00') TO ('2028-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2028 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2028-01-01+00') TO ('2029-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2029 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2029-01-01+00') TO ('2030-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2030 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2030-01-01+00') TO ('2031-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2031 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2031-01-01+00') TO ('2032-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2032 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2032-01-01+00') TO ('2033-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_2033 PARTITION OF ipeot.audit_log
  FOR VALUES FROM ('2033-01-01+00') TO ('2034-01-01+00');
CREATE TABLE IF NOT EXISTS ipeot.audit_log_default PARTITION OF ipeot.audit_log DEFAULT;

DO $$ BEGIN
  ALTER TABLE ipeot.audit_log
    ADD CONSTRAINT audit_log_actor_fk FOREIGN KEY (actor_id) REFERENCES ipeot.users (id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS audit_log_no_update ON ipeot.audit_log;
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE OR DELETE ON ipeot.audit_log
  FOR EACH ROW EXECUTE FUNCTION ipeot.prevent_audit_mutation();

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON ipeot.audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON ipeot.audit_log (entity, entity_id);

COMMENT ON TABLE ipeot.audit_log IS 'Append-only. Yearly partitions cover the 7-year retention window.';

-- connect-pg-simple store. Created here so the library does not run its OIDS table script on PostgreSQL 17.
CREATE TABLE IF NOT EXISTS ipeot.user_sessions (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON ipeot.user_sessions (expire);

CREATE OR REPLACE FUNCTION ipeot.session_principal(p_user_id bigint)
RETURNS jsonb
LANGUAGE sql
STABLE
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

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT *
    FROM (VALUES
      ('departments'), ('work_centres'), ('users'), ('approval_matrix'),
      ('project_types'), ('awp_cycles'), ('projects'), ('proposals'),
      ('iso_documents'), ('report_drafts'), ('sap_wbs_jobs')
    ) AS t(table_name)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON ipeot.%I', rec.table_name || '_touch', rec.table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON ipeot.%I FOR EACH ROW EXECUTE FUNCTION ipeot.touch_updated_at()',
      rec.table_name || '_touch', rec.table_name
    );
  END LOOP;
END $$;

INSERT INTO ipeot.departments (code, name) VALUES
  ('D1', 'Department I - Production'),
  ('D2', 'Department II - Process and RRE'),
  ('D3', 'Department III - Corrosion and Scale'),
  ('D4', 'Department IV - Artificial Lift'),
  ('D5', 'Department V - Deep Water'),
  ('D6', 'Department VI - Structure and Geotech')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ipeot.work_centres (code, name, department_id)
SELECT v.code, v.name, d.id
FROM (VALUES
  ('D2-PROCESS', 'Process', 'D2'),
  ('D2-RRE', 'Risk and reliability', 'D2'),
  ('D6-GEOTECH', 'Geotech', 'D6'),
  ('D6-STRUCT', 'Structure', 'D6')
) AS v(code, name, dept)
JOIN ipeot.departments d ON d.code = v.dept
ON CONFLICT (code) DO NOTHING;

INSERT INTO ipeot.roles (code, name, description) VALUES
  ('ADMIN', 'Administrator', 'User, master data, and matrix administration'),
  ('PCC', 'Project Coordination Cell', 'AWP window, portfolio coordination, and WBS fallback'),
  ('COORDINATOR', 'Coordinator', 'Proposal routing'),
  ('L3', 'Level-3 proposer', 'Submits study proposals'),
  ('IC', 'In-charge', 'Technical review'),
  ('HOD', 'Head of Department', 'Endorsement and team allotment'),
  ('HOI', 'Head of Institute', 'Authorization'),
  ('TAC', 'Technical Advisory Committee', 'TAC decision'),
  ('DIRECTOR', 'Director (Production)', 'Final authorization'),
  ('CI', 'Chief Investigator', 'Project execution'),
  ('LAB', 'Laboratory', 'Sample and result handling')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ipeot.permissions (code, name) VALUES
  ('admin.users.read', 'Read users'),
  ('admin.users.write', 'Assign roles'),
  ('admin.masters.read', 'Read master data'),
  ('admin.masters.write', 'Edit master data'),
  ('admin.matrix.read', 'Read approval matrix'),
  ('admin.matrix.write', 'Edit approval matrix'),
  ('admin.audit.read', 'Read audit log'),
  ('proposals.read', 'Read proposals'),
  ('proposals.write', 'Edit proposals'),
  ('proposals.submit', 'Submit proposals'),
  ('workflow.act', 'Act on workflow tasks'),
  ('projects.read', 'Read projects'),
  ('projects.write', 'Edit projects'),
  ('awp.read', 'Read AWP cycles'),
  ('awp.write', 'Manage AWP cycles'),
  ('dashboards.read', 'Read dashboards'),
  ('reports.write', 'Edit reports'),
  ('lims.read', 'Read LIMS'),
  ('lims.write', 'Edit LIMS'),
  ('team.allot', 'Allot project team')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ipeot.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM ipeot.roles r
CROSS JOIN ipeot.permissions p
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO ipeot.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES
  ('PCC', 'admin.masters.read'), ('PCC', 'admin.matrix.read'), ('PCC', 'proposals.read'),
  ('PCC', 'projects.read'), ('PCC', 'awp.read'), ('PCC', 'awp.write'), ('PCC', 'dashboards.read'),
  ('COORDINATOR', 'proposals.read'), ('COORDINATOR', 'proposals.write'), ('COORDINATOR', 'projects.read'),
  ('COORDINATOR', 'awp.read'), ('COORDINATOR', 'dashboards.read'), ('COORDINATOR', 'workflow.act'),
  ('PCC', 'workflow.act'),
  ('L3', 'proposals.read'), ('L3', 'proposals.write'), ('L3', 'proposals.submit'),
  ('L3', 'projects.read'), ('L3', 'dashboards.read'),
  ('IC', 'proposals.read'), ('IC', 'workflow.act'), ('IC', 'projects.read'),
  ('IC', 'dashboards.read'), ('IC', 'lims.read'),
  ('HOD', 'proposals.read'), ('HOD', 'workflow.act'), ('HOD', 'projects.read'),
  ('HOD', 'projects.write'), ('HOD', 'dashboards.read'), ('HOD', 'team.allot'), ('HOD', 'reports.write'),
  ('HOI', 'proposals.read'), ('HOI', 'workflow.act'), ('HOI', 'projects.read'),
  ('HOI', 'dashboards.read'), ('HOI', 'admin.matrix.read'),
  ('TAC', 'proposals.read'), ('TAC', 'workflow.act'), ('TAC', 'dashboards.read'),
  ('DIRECTOR', 'proposals.read'), ('DIRECTOR', 'workflow.act'), ('DIRECTOR', 'dashboards.read'),
  ('CI', 'projects.read'), ('CI', 'projects.write'), ('CI', 'reports.write'),
  ('CI', 'lims.read'), ('CI', 'dashboards.read'),
  ('LAB', 'lims.read'), ('LAB', 'lims.write'), ('LAB', 'projects.read')
) AS v(role_code, perm_code)
JOIN ipeot.roles r ON r.code = v.role_code
JOIN ipeot.permissions p ON p.code = v.perm_code
ON CONFLICT DO NOTHING;

INSERT INTO ipeot.users (cpf, name, email, password_hash, department_id)
SELECT v.cpf, v.name, v.email, '$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi', d.id
FROM (VALUES
  ('100001', 'Portal Admin', 'admin@ipeot.local', NULL),
  ('100002', 'PCC Officer', 'pcc@ipeot.local', NULL),
  ('100003', 'Coordinator', 'coordinator@ipeot.local', NULL),
  ('100004', 'L3 Proposer', 'l3@ipeot.local', 'D1'),
  ('100005', 'In-charge', 'ic@ipeot.local', NULL),
  ('100006', 'Head of Department', 'hod@ipeot.local', 'D1'),
  ('100007', 'Head of Institute', 'hoi@ipeot.local', NULL),
  ('100008', 'TAC Member', 'tac@ipeot.local', NULL),
  ('100009', 'Director', 'director@ipeot.local', NULL)
) AS v(cpf, name, email, dept)
LEFT JOIN ipeot.departments d ON d.code = v.dept
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO ipeot.user_role_assignments (user_id, role_id, scope, department_id)
SELECT u.id, r.id, v.scope::ipeot.assignment_scope, d.id
FROM (VALUES
  ('100001', 'ADMIN', 'global', NULL),
  ('100002', 'PCC', 'global', NULL),
  ('100003', 'COORDINATOR', 'global', NULL),
  ('100004', 'L3', 'department', 'D1'),
  ('100005', 'IC', 'global', NULL),
  ('100006', 'HOD', 'department', 'D1'),
  ('100007', 'HOI', 'global', NULL),
  ('100008', 'TAC', 'global', NULL),
  ('100009', 'DIRECTOR', 'global', NULL)
) AS v(cpf, role_code, scope, dept)
JOIN ipeot.users u ON u.cpf = v.cpf
JOIN ipeot.roles r ON r.code = v.role_code
LEFT JOIN ipeot.departments d ON d.code = v.dept
ON CONFLICT ON CONSTRAINT user_role_assignments_uniq DO NOTHING;

INSERT INTO ipeot.approval_matrix (
  project_category, stage_code, stage_name, stage_order, assignee_role_code, applies_to
)
SELECT v.category::ipeot.project_category, v.stage_code, v.stage_name, v.stage_order, v.role_code, v.applies_to
FROM (VALUES
  ('scheduled', 'coordinator', 'Coordinator review', 1, 'COORDINATOR', 'proposal'),
  ('scheduled', 'pcc', 'PCC review', 2, 'PCC', 'proposal'),
  ('scheduled', 'ic_review', 'In-charge technical review', 3, 'IC', 'proposal'),
  ('scheduled', 'hod_endorse', 'HOD endorsement', 4, 'HOD', 'proposal'),
  ('scheduled', 'hoi_authorize', 'HOI authorization', 5, 'HOI', 'proposal'),
  ('scheduled', 'tac', 'TAC', 6, 'TAC', 'proposal'),
  ('scheduled', 'director', 'Director authorization', 7, 'DIRECTOR', 'proposal'),
  ('unscheduled', 'coordinator', 'Coordinator review', 1, 'COORDINATOR', 'proposal'),
  ('unscheduled', 'pcc', 'PCC review', 2, 'PCC', 'proposal'),
  ('unscheduled', 'ic_review', 'In-charge technical review', 3, 'IC', 'proposal'),
  ('unscheduled', 'hod_endorse', 'HOD endorsement', 4, 'HOD', 'proposal'),
  ('unscheduled', 'hoi_authorize', 'HOI authorization', 5, 'HOI', 'proposal'),
  ('unscheduled', 'tac', 'TAC', 6, 'TAC', 'proposal'),
  ('unscheduled', 'director', 'Director authorization', 7, 'DIRECTOR', 'proposal'),
  ('short_term', 'coordinator', 'Coordinator review', 1, 'COORDINATOR', 'proposal'),
  ('short_term', 'pcc', 'PCC review', 2, 'PCC', 'proposal'),
  ('short_term', 'ic_review', 'In-charge technical review', 3, 'IC', 'proposal'),
  ('short_term', 'hod_endorse', 'HOD endorsement', 4, 'HOD', 'proposal'),
  ('scheduled', 'ic_review', 'In-charge report review', 1, 'IC', 'report'),
  ('scheduled', 'hod_endorse', 'HOD report endorsement', 2, 'HOD', 'report'),
  ('scheduled', 'hoi_authorize', 'HOI report authorization', 3, 'HOI', 'report'),
  ('unscheduled', 'ic_review', 'In-charge report review', 1, 'IC', 'report'),
  ('unscheduled', 'hod_endorse', 'HOD report endorsement', 2, 'HOD', 'report'),
  ('unscheduled', 'hoi_authorize', 'HOI report authorization', 3, 'HOI', 'report'),
  ('short_term', 'ic_review', 'In-charge report review', 1, 'IC', 'report'),
  ('short_term', 'hod_endorse', 'HOD report endorsement', 2, 'HOD', 'report')
) AS v(category, stage_code, stage_name, stage_order, role_code, applies_to)
ON CONFLICT ON CONSTRAINT approval_matrix_stage_uniq DO NOTHING;

INSERT INTO ipeot.sla_rules (stage_code, target_days, reminder_offsets_days, escalation_role_code)
SELECT v.stage_code, v.days, ARRAY[2, 1]::integer[], v.escalate
FROM (VALUES
  ('coordinator', 5, 'PCC'),
  ('pcc', 5, 'HOI'),
  ('ic_review', 7, 'HOD'),
  ('hod_endorse', 7, 'HOI'),
  ('hoi_authorize', 7, 'DIRECTOR'),
  ('tac', 14, 'DIRECTOR'),
  ('director', 14, 'HOI')
) AS v(stage_code, days, escalate)
ON CONFLICT ON CONSTRAINT sla_rules_uniq DO NOTHING;

INSERT INTO ipeot.project_types (code, name, department_id, work_centre_id)
SELECT v.code, v.name, d.id, w.id
FROM (VALUES
  ('D1-ACID', 'Suitable acid stimulation treatment', 'D1', NULL::text),
  ('D1-SAND', 'Sand control', 'D1', NULL),
  ('D1-SOLVENT', 'Solvent design for organic deposition', 'D1', NULL),
  ('D1-AFRAC', 'Acid fracturing design for tight carbonate reservoirs', 'D1', NULL),
  ('D1-WOBRINE', 'Suitable workover brine', 'D1', NULL),
  ('D1-WINTEG', 'Well integrity assessment', 'D1', NULL),
  ('D2-FGR', 'Flare gas recovery assessment', 'D2', 'D2-PROCESS'),
  ('D2-ADEQ-PROC', 'Adequacy check of processing facilities', 'D2', 'D2-PROCESS'),
  ('D2-ADEQ-HX', 'Adequacy check of heat exchangers', 'D2', 'D2-PROCESS'),
  ('D2-ADEQ-FLARE', 'Adequacy check of flare system', 'D2', 'D2-PROCESS'),
  ('D2-GDU', 'Conceptualization of GDU and DPD facilities', 'D2', 'D2-PROCESS'),
  ('D2-SCHEME', 'Scheme conceptualization of surface facilities', 'D2', 'D2-PROCESS'),
  ('D2-MERGE', 'Feasibility study for merging of installations', 'D2', 'D2-PROCESS'),
  ('D2-SHRINK', 'Shrinkage factor or VAP estimation', 'D2', 'D2-PROCESS'),
  ('D2-FLOW', 'Flow assurance studies', 'D2', 'D2-PROCESS'),
  ('D2-PPD', 'Crude characterization and PPD dose optimization', 'D2', 'D2-PROCESS'),
  ('D2-GAS', 'Gas compositional analysis', 'D2', 'D2-PROCESS'),
  ('D2-QRA-ON', 'QRA study (onshore)', 'D2', 'D2-RRE'),
  ('D2-QRA-OFF', 'QRA study (offshore)', 'D2', 'D2-RRE'),
  ('D2-HAZOP', 'HAZOP study', 'D2', 'D2-RRE'),
  ('D2-EERA', 'EERA study', 'D2', 'D2-RRE'),
  ('D3-CA', 'Corrosivity assessment (CA)', 'D3', NULL),
  ('D3-MOC', 'Corrosivity assessment and material recommendation (MOC)', 'D3', NULL),
  ('D3-RCA', 'Failure analysis or root cause analysis (RCA)', 'D3', NULL),
  ('D3-MT', 'Material testing (MT)', 'D3', NULL),
  ('D3-SM', 'Scale mitigation (SM)', 'D3', NULL),
  ('D3-CP', 'Review of cathodic protection of jackets (CP)', 'D3', NULL),
  ('D3-PAINT', 'Coating and painting', 'D3', NULL),
  ('D4-CGL', 'Continuous gas lift design and optimization', 'D4', NULL),
  ('D4-IGL', 'Intermittent gas lift design and optimization', 'D4', NULL),
  ('D4-SRP', 'Sucker rod pump design and optimization', 'D4', NULL),
  ('D4-ESP', 'Electrical submersible pump design and optimization', 'D4', NULL),
  ('D4-PCP', 'Progressive cavity pump design and optimization', 'D4', NULL),
  ('D4-PLF', 'Plunger lift design and optimization', 'D4', NULL),
  ('D4-JP', 'Jet pump design and optimization', 'D4', NULL),
  ('D4-GLNO', 'Gas lift network optimization', 'D4', NULL),
  ('D4-LMS', 'Artificial lift mode selection', 'D4', NULL),
  ('D6-SOIL-JKT', 'Soil investigation for jacket platform locations', 'D6', 'D6-GEOTECH'),
  ('D6-SOIL-JU', 'Soil investigation for jack-up rig locations', 'D6', 'D6-GEOTECH'),
  ('D6-SOIL-MOOR', 'Soil investigation for mooring buoy or MOPU locations', 'D6', 'D6-GEOTECH'),
  ('D6-SSA', 'Site-specific assessment of jack-up rigs', 'D6', 'D6-GEOTECH'),
  ('D6-GEOTECH', 'Other offshore geotechnics studies', 'D6', 'D6-GEOTECH'),
  ('D6-LIFE', 'Life extension study', 'D6', 'D6-STRUCT'),
  ('D6-SIA', 'Structural integrity assessment (SIA)', 'D6', 'D6-STRUCT')
) AS v(code, name, dept, wc)
JOIN ipeot.departments d ON d.code = v.dept
LEFT JOIN ipeot.work_centres w ON w.code = v.wc
ON CONFLICT (code) DO NOTHING;

COMMIT;
