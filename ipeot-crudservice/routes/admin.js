import { Router } from "express";
import { pool, recordAudit } from "../db.js";
import { requirePermission, validateAssignment } from "../authz.js";
import { cleanCode, cleanName, httpError, idParam, page } from "../http.js";

const admin = Router();

function optionalId(value) {
  if (value == null || value === "") return null;
  return idParam(value);
}

admin.get("/admin/departments", requirePermission("admin.masters.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, code, name, active, created_at AS "createdAt"
     FROM ipeot.departments ORDER BY code`,
  );
  res.json({ data: rows });
});

admin.post("/admin/departments", requirePermission("admin.masters.write"), async (req, res) => {
  const code = cleanCode(req.body?.code);
  const name = cleanName(req.body?.name);
  const { rows } = await pool.query(
    `INSERT INTO ipeot.departments (code, name)
     VALUES ($1, $2)
     RETURNING id, code, name, active`,
    [code, name],
  );
  await recordAudit({
    entity: "department",
    entityId: rows[0].id,
    action: "create",
    actorId: req.session.user.id,
    payload: rows[0],
  });
  res.status(201).json({ data: rows[0] });
});

admin.patch("/admin/departments/:id", requirePermission("admin.masters.write"), async (req, res) => {
  const id = idParam(req.params.id);
  const name = req.body?.name == null ? null : cleanName(req.body.name);
  const active = typeof req.body?.active === "boolean" ? req.body.active : null;
  if (name == null && active == null) throw httpError(400, "no_changes");
  const { rows } = await pool.query(
    `UPDATE ipeot.departments
     SET name = COALESCE($2, name), active = COALESCE($3, active)
     WHERE id = $1
     RETURNING id, code, name, active`,
    [id, name, active],
  );
  if (!rows[0]) throw httpError(404, "not_found");
  await recordAudit({
    entity: "department",
    entityId: id,
    action: "update",
    actorId: req.session.user.id,
    payload: rows[0],
  });
  res.json({ data: rows[0] });
});

admin.get("/admin/work-centres", requirePermission("admin.masters.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT w.id, w.code, w.name, w.active, w.department_id AS "departmentId", d.code AS "departmentCode"
     FROM ipeot.work_centres w
     LEFT JOIN ipeot.departments d ON d.id = w.department_id
     ORDER BY w.code`,
  );
  res.json({ data: rows });
});

admin.post("/admin/work-centres", requirePermission("admin.masters.write"), async (req, res) => {
  const code = cleanCode(req.body?.code);
  const name = cleanName(req.body?.name);
  const departmentId = optionalId(req.body?.departmentId);
  const { rows } = await pool.query(
    `INSERT INTO ipeot.work_centres (code, name, department_id)
     SELECT $1, $2, d.id FROM ipeot.departments d WHERE d.id = $3
     RETURNING id, code, name, active, department_id AS "departmentId"`,
    [code, name, departmentId],
  );
  if (!rows[0]) throw httpError(400, "invalid_reference");
  await recordAudit({
    entity: "work_centre",
    entityId: rows[0].id,
    action: "create",
    actorId: req.session.user.id,
    payload: rows[0],
  });
  res.status(201).json({ data: rows[0] });
});

admin.patch("/admin/work-centres/:id", requirePermission("admin.masters.write"), async (req, res) => {
  const id = idParam(req.params.id);
  const name = req.body?.name == null ? null : cleanName(req.body.name);
  const active = typeof req.body?.active === "boolean" ? req.body.active : null;
  if (name == null && active == null) throw httpError(400, "no_changes");
  const { rows } = await pool.query(
    `UPDATE ipeot.work_centres
     SET name = COALESCE($2, name), active = COALESCE($3, active)
     WHERE id = $1
     RETURNING id, code, name, active, department_id AS "departmentId"`,
    [id, name, active],
  );
  if (!rows[0]) throw httpError(404, "not_found");
  await recordAudit({
    entity: "work_centre",
    entityId: id,
    action: "update",
    actorId: req.session.user.id,
    payload: rows[0],
  });
  res.json({ data: rows[0] });
});

admin.get("/admin/project-types", requirePermission("admin.masters.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.code, t.name, t.active,
            t.department_id AS "departmentId", d.code AS "departmentCode",
            t.work_centre_id AS "workCentreId", w.code AS "workCentreCode"
     FROM ipeot.project_types t
     LEFT JOIN ipeot.departments d ON d.id = t.department_id
     LEFT JOIN ipeot.work_centres w ON w.id = t.work_centre_id
     ORDER BY t.code`,
  );
  res.json({ data: rows });
});

admin.post("/admin/project-types", requirePermission("admin.masters.write"), async (req, res) => {
  const code = cleanCode(req.body?.code);
  const name = cleanName(req.body?.name);
  const departmentId = optionalId(req.body?.departmentId);
  const workCentreId = optionalId(req.body?.workCentreId);
  const { rows } = await pool.query(
    `INSERT INTO ipeot.project_types (code, name, department_id, work_centre_id)
     SELECT $1, $2, d.id, w.id
     FROM ipeot.departments d
     LEFT JOIN ipeot.work_centres w ON w.id = $4
     WHERE d.id = $3 AND ($4::bigint IS NULL OR w.id IS NOT NULL)
     RETURNING id, code, name, active, department_id AS "departmentId", work_centre_id AS "workCentreId"`,
    [code, name, departmentId, workCentreId],
  );
  if (!rows[0]) throw httpError(400, "invalid_reference");
  await recordAudit({
    entity: "project_type",
    entityId: rows[0].id,
    action: "create",
    actorId: req.session.user.id,
    payload: rows[0],
  });
  res.status(201).json({ data: rows[0] });
});

admin.patch("/admin/project-types/:id", requirePermission("admin.masters.write"), async (req, res) => {
  const id = idParam(req.params.id);
  const name = req.body?.name == null ? null : cleanName(req.body.name);
  const active = typeof req.body?.active === "boolean" ? req.body.active : null;
  if (name == null && active == null) throw httpError(400, "no_changes");
  const { rows } = await pool.query(
    `UPDATE ipeot.project_types
     SET name = COALESCE($2, name), active = COALESCE($3, active)
     WHERE id = $1
     RETURNING id, code, name, active`,
    [id, name, active],
  );
  if (!rows[0]) throw httpError(404, "not_found");
  await recordAudit({
    entity: "project_type",
    entityId: id,
    action: "update",
    actorId: req.session.user.id,
    payload: rows[0],
  });
  res.json({ data: rows[0] });
});

admin.get("/admin/roles", requirePermission("admin.users.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, code, name, description FROM ipeot.roles ORDER BY code`,
  );
  res.json({ data: rows });
});

admin.get("/admin/users", requirePermission("admin.users.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.cpf, u.name, u.email, u.active,
            u.department_id AS "departmentId", d.name AS "departmentName",
            COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'id', a.id,
                'roleCode', r.code,
                'roleName', r.name,
                'scope', a.scope,
                'departmentId', a.department_id,
                'workCentreId', a.work_centre_id
              ) ORDER BY r.code)
              FROM ipeot.user_role_assignments a
              JOIN ipeot.roles r ON r.id = a.role_id
              WHERE a.user_id = u.id AND a.active
            ), '[]'::jsonb) AS assignments
     FROM ipeot.users u
     LEFT JOIN ipeot.departments d ON d.id = u.department_id
     ORDER BY u.cpf`,
  );
  res.json({ data: rows });
});

admin.post("/admin/users/:id/assignments", requirePermission("admin.users.write"), async (req, res) => {
  const userId = idParam(req.params.id);
  const roleCode = cleanCode(req.body?.roleCode);
  const scope = String(req.body?.scope || "");
  const departmentId = optionalId(req.body?.departmentId);
  const workCentreId = optionalId(req.body?.workCentreId);
  const problem = validateAssignment({ scope, departmentId, workCentreId });
  if (problem) throw httpError(400, problem);
  const { rows } = await pool.query(
    `INSERT INTO ipeot.user_role_assignments (user_id, role_id, scope, department_id, work_centre_id)
     SELECT u.id, r.id, $3::ipeot.assignment_scope, $4, $5
     FROM ipeot.users u
     JOIN ipeot.roles r ON r.code = $2
     WHERE u.id = $1 AND u.active
       AND ($4::bigint IS NULL OR EXISTS (SELECT 1 FROM ipeot.departments d WHERE d.id = $4))
       AND ($5::bigint IS NULL OR EXISTS (SELECT 1 FROM ipeot.work_centres w WHERE w.id = $5))
     RETURNING id, user_id AS "userId", scope, department_id AS "departmentId", work_centre_id AS "workCentreId"`,
    [userId, roleCode, scope, departmentId, workCentreId],
  );
  if (!rows[0]) throw httpError(400, "invalid_reference");
  await recordAudit({
    entity: "user_role_assignment",
    entityId: rows[0].id,
    action: "create",
    actorId: req.session.user.id,
    payload: { ...rows[0], roleCode },
  });
  res.status(201).json({ data: { ...rows[0], roleCode } });
});

admin.delete("/admin/users/:id/assignments/:assignmentId", requirePermission("admin.users.write"), async (req, res) => {
  const userId = idParam(req.params.id);
  const assignmentId = idParam(req.params.assignmentId);
  const current = await pool.query(
    `SELECT a.id, r.code AS role_code
     FROM ipeot.user_role_assignments a
     JOIN ipeot.roles r ON r.id = a.role_id
     WHERE a.id = $1 AND a.user_id = $2 AND a.active`,
    [assignmentId, userId],
  );
  if (!current.rows[0]) throw httpError(404, "not_found");
  if (current.rows[0].role_code === "ADMIN") {
    const remaining = await pool.query(
      `SELECT count(*)::int AS total
       FROM ipeot.user_role_assignments a
       JOIN ipeot.roles r ON r.id = a.role_id
       WHERE r.code = 'ADMIN' AND a.active AND a.id <> $1`,
      [assignmentId],
    );
    if (remaining.rows[0].total === 0) throw httpError(400, "last_admin");
  }
  await pool.query(
    `UPDATE ipeot.user_role_assignments SET active = false WHERE id = $1`,
    [assignmentId],
  );
  await recordAudit({
    entity: "user_role_assignment",
    entityId: assignmentId,
    action: "revoke",
    actorId: req.session.user.id,
    payload: { userId, roleCode: current.rows[0].role_code },
  });
  res.json({ ok: true });
});

admin.get("/admin/matrix", requirePermission("admin.matrix.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT m.id, m.project_category AS "projectCategory", m.applies_to AS "appliesTo",
            m.stage_code AS "stageCode", m.stage_name AS "stageName", m.stage_order AS "stageOrder",
            m.assignee_role_code AS "assigneeRoleCode", d.code AS "departmentCode"
     FROM ipeot.approval_matrix m
     LEFT JOIN ipeot.departments d ON d.id = m.department_id
     WHERE m.active
     ORDER BY m.applies_to, m.project_category, m.stage_order`,
  );
  res.json({ data: rows });
});

admin.get("/admin/audit", requirePermission("admin.audit.read"), async (req, res) => {
  const { limit, offset } = page(req);
  const { rows } = await pool.query(
    `SELECT a.id, a.entity, a.entity_id AS "entityId", a.action,
            a.actor_id AS "actorId", u.name AS "actorName", a.payload, a.created_at AS "createdAt"
     FROM ipeot.audit_log a
     LEFT JOIN ipeot.users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  const total = await pool.query("SELECT count(*)::int AS total FROM ipeot.audit_log");
  res.json({ data: rows, total: total.rows[0].total });
});

export default admin;
