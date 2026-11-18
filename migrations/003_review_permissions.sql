-- Coordinator and PCC are the first proposal stages, so they need the inbox permission.
INSERT INTO ipeot.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM (VALUES
  ('COORDINATOR', 'workflow.act'),
  ('PCC', 'workflow.act')
) AS v(role_code, perm_code)
JOIN ipeot.roles r ON r.code = v.role_code
JOIN ipeot.permissions p ON p.code = v.perm_code
ON CONFLICT DO NOTHING;
