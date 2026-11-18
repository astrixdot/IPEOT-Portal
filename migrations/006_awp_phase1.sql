-- Phase 1 of IPEOT AWP WORKFLOW FINAL: planning path, side routes, and the records they need.
-- Enum values commit on their own so later statements in this file may use them.

ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'routed';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'department_review';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'clarification';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'incharge_review';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'plan_scheduled';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'plan_unscheduled';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'hod_endorsed';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'pcc_consolidation';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'hoi_review';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'tac_review';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'director_approved';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'published';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'removed';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'short_term_closed';
ALTER TYPE ipeot.project_status ADD VALUE IF NOT EXISTS 'in_year_approved';

ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'route';
ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'clarify';
ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'schedule';
ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'return';
ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'complete_work';
ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'revise';
ALTER TYPE ipeot.workflow_action ADD VALUE IF NOT EXISTS 'publish';

ALTER TABLE ipeot.projects
  ADD COLUMN IF NOT EXISTS priority smallint,
  ADD COLUMN IF NOT EXISTS preferred_quarter text,
  ADD COLUMN IF NOT EXISTS final_quarter text,
  ADD COLUMN IF NOT EXISTS schedule_decision text,
  ADD COLUMN IF NOT EXISTS dependency_note text,
  ADD COLUMN IF NOT EXISTS intake text NOT NULL DEFAULT 'awp',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS removal_reason text,
  ADD COLUMN IF NOT EXISTS scope_note text,
  ADD COLUMN IF NOT EXISTS job_tags text,
  ADD COLUMN IF NOT EXISTS parent_department_id bigint REFERENCES ipeot.departments (id),
  ADD COLUMN IF NOT EXISTS short_term_outcome text,
  ADD COLUMN IF NOT EXISTS short_term_effort text;

ALTER TABLE ipeot.awp_cycles
  ADD COLUMN IF NOT EXISTS masters_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS package_status text,
  ADD COLUMN IF NOT EXISTS consolidated_body text,
  ADD COLUMN IF NOT EXISTS disha_payload jsonb,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_offsets integer[] NOT NULL DEFAULT '{7,3,1}';

CREATE TABLE IF NOT EXISTS ipeot.stakeholder_units (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('asset', 'plant', 'service', 'institute')),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  coordinator_user_id bigint REFERENCES ipeot.users (id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.routing_rules (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_type_id bigint NOT NULL REFERENCES ipeot.project_types (id),
  department_id bigint NOT NULL REFERENCES ipeot.departments (id),
  tag text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_type_id, department_id)
);

CREATE TABLE IF NOT EXISTS ipeot.project_routes (
  project_id bigint NOT NULL REFERENCES ipeot.projects (id) ON DELETE CASCADE,
  department_id bigint NOT NULL REFERENCES ipeot.departments (id),
  PRIMARY KEY (project_id, department_id)
);

CREATE TABLE IF NOT EXISTS ipeot.proposal_files (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proposal_id bigint NOT NULL REFERENCES ipeot.proposals (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime text,
  size_bytes integer NOT NULL,
  content bytea NOT NULL,
  uploaded_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.outbound_mail (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  awp_cycle_id bigint REFERENCES ipeot.awp_cycles (id),
  kind text NOT NULL,
  recipient_user_id bigint REFERENCES ipeot.users (id),
  recipient_email text,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ipeot.awp_reminder_log (
  awp_cycle_id bigint NOT NULL REFERENCES ipeot.awp_cycles (id) ON DELETE CASCADE,
  offset_days integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (awp_cycle_id, offset_days)
);

CREATE TABLE IF NOT EXISTS ipeot.awp_package_tasks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  awp_cycle_id bigint NOT NULL REFERENCES ipeot.awp_cycles (id) ON DELETE CASCADE,
  stage_code text NOT NULL,
  stage_name text NOT NULL,
  assignee_role_code text NOT NULL,
  status ipeot.task_status NOT NULL DEFAULT 'pending',
  action ipeot.workflow_action,
  remarks text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by bigint REFERENCES ipeot.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO ipeot.routing_rules (project_type_id, department_id)
SELECT id, department_id FROM ipeot.project_types WHERE department_id IS NOT NULL
ON CONFLICT (project_type_id, department_id) DO NOTHING;

INSERT INTO ipeot.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES
  ('L3', 'workflow.act'),
  ('COORDINATOR', 'proposals.submit')
) AS v(role_code, perm_code)
JOIN ipeot.roles r ON r.code = v.role_code
JOIN ipeot.permissions p ON p.code = v.perm_code
ON CONFLICT DO NOTHING;

DELETE FROM ipeot.approval_matrix WHERE applies_to = 'proposal';

INSERT INTO ipeot.approval_matrix (
  project_category, stage_code, stage_name, stage_order, assignee_role_code, applies_to
)
SELECT v.category::ipeot.project_category, v.stage_code, v.stage_name, v.stage_order, v.role_code, 'proposal'
FROM (VALUES
  ('scheduled', 'pcc_route', 'PCC routes to department', 1, 'PCC'),
  ('scheduled', 'dept_review', 'Department review', 2, 'HOD'),
  ('scheduled', 'incharge_review', 'In-charge review', 3, 'IC'),
  ('scheduled', 'hod_endorse', 'HOD endorsement', 4, 'HOD'),
  ('scheduled', 'pcc_consolidation', 'PCC consolidation', 5, 'PCC'),
  ('scheduled', 'hoi_review', 'HOI review of the AWP', 6, 'HOI'),
  ('scheduled', 'tac', 'TAC', 7, 'TAC'),
  ('scheduled', 'director', 'Director approval', 8, 'DIRECTOR'),
  ('scheduled', 'publish', 'Publish the AWP', 9, 'PCC'),
  ('unscheduled', 'pcc_route', 'PCC routes the in-year request', 1, 'PCC'),
  ('unscheduled', 'dept_review', 'Department assessment', 2, 'HOD'),
  ('unscheduled', 'in_year_hod', 'HOD approval', 3, 'HOD'),
  ('short_term', 'pcc_route', 'PCC routes short-term work', 1, 'PCC'),
  ('short_term', 'dept_review', 'Department checks the short-term test', 2, 'HOD'),
  ('short_term', 'short_term_hod', 'HOD approval', 3, 'HOD'),
  ('short_term', 'short_term_close', 'Record outcome and effort', 4, 'HOD')
) AS v(category, stage_code, stage_name, stage_order, role_code)
ON CONFLICT ON CONSTRAINT approval_matrix_stage_uniq DO NOTHING;

INSERT INTO ipeot.sla_rules (stage_code, target_days, reminder_offsets_days, escalation_role_code)
SELECT v.stage_code, v.days, ARRAY[2, 1]::integer[], v.escalate
FROM (VALUES
  ('pcc_route', 5, 'HOI'),
  ('dept_review', 7, 'PCC'),
  ('clarification', 7, 'HOD'),
  ('pcc_return', 3, 'HOI'),
  ('incharge_review', 7, 'HOD'),
  ('short_term_hod', 5, 'PCC'),
  ('short_term_close', 15, 'PCC'),
  ('in_year_hod', 5, 'PCC'),
  ('hoi_review', 7, 'DIRECTOR'),
  ('tac_review', 14, 'DIRECTOR'),
  ('director_review', 7, 'HOI'),
  ('publish', 3, 'HOI')
) AS v(stage_code, days, escalate)
ON CONFLICT ON CONSTRAINT sla_rules_uniq DO NOTHING;
