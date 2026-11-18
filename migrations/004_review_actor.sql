-- Remember who completed a review, and fill earlier comments from the audit log.
ALTER TABLE ipeot.workflow_tasks
  ADD COLUMN IF NOT EXISTS completed_by bigint REFERENCES ipeot.users (id);

UPDATE ipeot.workflow_tasks t
SET completed_by = a.actor_id
FROM (
  SELECT DISTINCT ON (entity_id) entity_id, actor_id
  FROM ipeot.audit_log
  WHERE entity = 'workflow_task' AND actor_id IS NOT NULL
  ORDER BY entity_id, created_at DESC
) a
WHERE t.completed_by IS NULL
  AND t.status = 'completed'
  AND t.id::text = a.entity_id;
