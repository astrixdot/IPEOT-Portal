-- TAC and Director development sign-in, and place P-2026-0001 on the open 2026 cycle.
-- Password matches the other development users: Ipeot@123. Used only when LDAP_URL is empty.

INSERT INTO ipeot.users (cpf, name, email, password_hash, department_id)
SELECT v.cpf, v.name, v.email, '$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi', NULL
FROM (VALUES
  ('100008', 'TAC Member', 'tac@ipeot.local'),
  ('100009', 'Director', 'director@ipeot.local')
) AS v(cpf, name, email)
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO ipeot.user_role_assignments (user_id, role_id, scope, department_id)
SELECT u.id, r.id, 'global'::ipeot.assignment_scope, NULL
FROM (VALUES
  ('100008', 'TAC'),
  ('100009', 'DIRECTOR')
) AS v(cpf, role_code)
JOIN ipeot.users u ON u.cpf = v.cpf
JOIN ipeot.roles r ON r.code = v.role_code
ON CONFLICT ON CONSTRAINT user_role_assignments_uniq DO NOTHING;

WITH target AS (
  SELECT c.id
  FROM ipeot.awp_cycles c
  WHERE c.year = 2026 AND c.status = 'open'
  ORDER BY c.id DESC
  LIMIT 1
)
UPDATE ipeot.projects p
SET awp_cycle_id = target.id
FROM ipeot.proposals pr, target
WHERE pr.project_id = p.id
  AND pr.proposal_number = 'P-2026-0001'
  AND p.project_category = 'scheduled'
  AND p.awp_cycle_id IS NULL;

INSERT INTO ipeot.awp_submissions (awp_cycle_id, proposal_id, submitted_by, submitted_at)
SELECT p.awp_cycle_id, pr.id, pr.created_by, COALESCE(pr.submitted_at, now())
FROM ipeot.proposals pr
JOIN ipeot.projects p ON p.id = pr.project_id
WHERE pr.proposal_number = 'P-2026-0001'
  AND p.awp_cycle_id IS NOT NULL
ON CONFLICT (awp_cycle_id, proposal_id) DO NOTHING;
