import { Router } from "express";
import { pool, recordAudit } from "../db.js";
import { hasPermission, requirePermission } from "../authz.js";
import { cleanCode, cleanName, httpError, idParam, page } from "../http.js";
import {
  applyProposalAction,
  buildPresentation,
  completePackageTask,
  consolidateCycle,
  isPhase1Stage,
  mailCoordinators,
  sendDueReminders,
  stageActions,
} from "../awp-flow.js";

const portal = Router();

portal.get("/dashboard", requirePermission("dashboards.read"), async (req, res) => {
  const userId = req.session.user.id;
  const roles = (req.session.user.roles || []).map((role) => role.code);
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM ipeot.projects) AS projects,
       (
         (SELECT count(*)::int FROM ipeot.workflow_tasks
            WHERE status = 'pending'
              AND (assignee_user_id = $1 OR (assignee_user_id IS NULL AND assignee_role_code = ANY($2::text[]))))
         + (SELECT count(*)::int FROM ipeot.awp_package_tasks
            WHERE status = 'pending' AND assignee_role_code = ANY($2::text[]))
       ) AS "myPendingTasks",
       (SELECT count(*)::int FROM ipeot.awp_cycles WHERE status = 'open') AS "openAwpCycles",
       (SELECT count(*)::int FROM ipeot.departments WHERE active) AS departments,
       (SELECT count(*)::int FROM ipeot.project_types WHERE active) AS "projectTypes",
       (SELECT count(*)::int FROM ipeot.projects WHERE status IN (
          'submitted', 'in_review', 'department_review', 'clarification', 'incharge_review',
          'plan_scheduled', 'plan_unscheduled', 'hod_endorsed', 'pcc_consolidation', 'hoi_review', 'tac_review', 'scope_modification'
       )) AS "inReview",
       (SELECT count(*)::int FROM ipeot.projects WHERE status IN ('authorized', 'director_approved', 'published', 'in_year_approved')) AS authorized`,
    [userId, roles],
  );
  const statuses = await pool.query(
    `SELECT status, count(*)::int AS count FROM ipeot.projects GROUP BY status`,
  );
  let tasks = [];
  if (hasPermission(req.session.user, "workflow.act")) {
    const pending = await pool.query(
      `SELECT * FROM (
         SELECT t.id, COALESCE(m.stage_name, t.stage_code) AS "stageName", t.stage_code AS "stageCode", t.due_at AS "dueAt",
                p.title AS "projectTitle", pr.id AS "proposalId", pr.proposal_number AS "proposalNumber", 'proposal'::text AS kind
         FROM ipeot.workflow_tasks t
         JOIN ipeot.workflow_instances i ON i.id = t.instance_id
         JOIN ipeot.projects p ON p.id = i.project_id
         LEFT JOIN ipeot.proposals pr ON pr.project_id = p.id
         LEFT JOIN ipeot.approval_matrix m
           ON m.stage_code = t.stage_code AND m.project_category = p.project_category
          AND m.applies_to = i.applies_to AND m.department_id IS NULL AND m.active
         WHERE t.status = 'pending'
           AND (t.assignee_user_id = $1 OR (t.assignee_user_id IS NULL AND t.assignee_role_code = ANY($2::text[])))
         UNION ALL
         SELECT t.id, t.stage_name, t.stage_code, t.due_at, c.title, NULL::bigint, NULL::text, 'package'
         FROM ipeot.awp_package_tasks t
         JOIN ipeot.awp_cycles c ON c.id = t.awp_cycle_id
         WHERE t.status = 'pending' AND t.assignee_role_code = ANY($2::text[])
       ) q
       ORDER BY "dueAt" NULLS LAST, id
       LIMIT 5`,
      [userId, roles],
    );
    tasks = pending.rows;
  }
  let proposals = [];
  if (hasPermission(req.session.user, "proposals.read")) {
    const recent = await pool.query(
      `SELECT pr.id, pr.proposal_number AS "proposalNumber", p.title, p.status,
              p.project_category AS "projectCategory", d.code AS "departmentCode"
       FROM ipeot.proposals pr
       JOIN ipeot.projects p ON p.id = pr.project_id
       JOIN ipeot.departments d ON d.id = p.department_id
       ORDER BY pr.id DESC
       LIMIT 5`,
    );
    proposals = recent.rows;
  }
  let awp = null;
  if (hasPermission(req.session.user, "awp.read")) {
    const cycles = await pool.query(
      `SELECT c.id, c.year, c.title, c.status, c.window_open AS "windowOpen", c.window_close AS "windowClose",
              (SELECT count(*)::int FROM ipeot.projects p WHERE p.awp_cycle_id = c.id) AS filed
       FROM ipeot.awp_cycles c
       ORDER BY (c.status = 'open') DESC, c.year DESC, c.id DESC
       LIMIT 1`,
    );
    awp = cycles.rows[0] || null;
  }
  res.json({ data: { ...rows[0], statuses: statuses.rows, tasks, proposals, awp } });
});

portal.get("/projects", requirePermission("projects.read"), async (req, res) => {
  const { limit, offset } = page(req);
  const { rows } = await pool.query(
    `SELECT p.id, p.title, p.project_category AS "projectCategory", p.status,
            p.wbs_number AS "wbsNumber", p.accession_number AS "accessionNumber",
            d.code AS "departmentCode", d.name AS "departmentName", p.created_at AS "createdAt"
     FROM ipeot.projects p
     JOIN ipeot.departments d ON d.id = p.department_id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  res.json({ data: rows });
});

portal.get("/projects/:id", requirePermission("projects.read"), async (req, res) => {
  const id = idParam(req.params.id);
  const project = await pool.query(
    `SELECT p.id, p.title, p.project_category AS "projectCategory", p.status,
            p.wbs_number AS "wbsNumber", p.accession_number AS "accessionNumber",
            d.code AS "departmentCode", d.name AS "departmentName", p.created_at AS "createdAt"
     FROM ipeot.projects p
     JOIN ipeot.departments d ON d.id = p.department_id
     WHERE p.id = $1`,
    [id],
  );
  if (!project.rows[0]) throw httpError(404, "not_found");
  const team = await pool.query(
    `SELECT t.role_on_project AS "roleOnProject", u.name, u.cpf
     FROM ipeot.project_team t
     JOIN ipeot.users u ON u.id = t.user_id
     WHERE t.project_id = $1
     ORDER BY t.role_on_project, u.name`,
    [id],
  );
  res.json({ data: { ...project.rows[0], team: team.rows } });
});

function roleCodes(user) {
  return (user?.roles || []).map((role) => role.code);
}

portal.get("/tasks/mine", requirePermission("workflow.act"), async (req, res) => {
  const roles = roleCodes(req.session.user);
  const { rows } = await pool.query(
    `SELECT t.id, t.stage_code AS "stageCode", COALESCE(m.stage_name, t.stage_code) AS "stageName", t.status, t.due_at AS "dueAt",
            t.assignee_role_code AS "assigneeRoleCode",
            p.id AS "projectId", p.title AS "projectTitle", p.project_category::text AS "projectCategory", p.intake,
            pr.id AS "proposalId", pr.proposal_number AS "proposalNumber",
            NULL::bigint AS "cycleId", 'proposal'::text AS kind
     FROM ipeot.workflow_tasks t
     JOIN ipeot.workflow_instances i ON i.id = t.instance_id
     JOIN ipeot.projects p ON p.id = i.project_id
     LEFT JOIN ipeot.proposals pr ON pr.project_id = p.id
     LEFT JOIN ipeot.approval_matrix m
       ON m.stage_code = t.stage_code
      AND m.project_category = p.project_category
      AND m.applies_to = i.applies_to
      AND m.department_id IS NULL
      AND m.active
     WHERE t.status = 'pending'
       AND (
         t.assignee_user_id = $1
         OR (t.assignee_user_id IS NULL AND t.assignee_role_code = ANY($2::text[]))
       )
     UNION ALL
     SELECT t.id, t.stage_code, t.stage_name, t.status, t.due_at, t.assignee_role_code,
            NULL::bigint, c.title, NULL::text, NULL::text, NULL::bigint, NULL::text, c.id, 'package'
     FROM ipeot.awp_package_tasks t
     JOIN ipeot.awp_cycles c ON c.id = t.awp_cycle_id
     WHERE t.status = 'pending' AND t.assignee_role_code = ANY($2::text[])
     ORDER BY "dueAt" NULLS LAST, id`,
    [req.session.user.id, roles],
  );
  res.json({
    data: rows.map((row) => ({
      ...row,
      actions: row.kind === "proposal" ? stageActions({ stage: row.stageCode, category: row.projectCategory, intake: row.intake }) : packageActions(row.stageCode),
    })),
  });
});

function packageActions(stage) {
  if (stage === "hoi_review") return [{ action: "endorse", label: "Endorse the AWP" }, { action: "revise", label: "Send back for revision" }];
  if (stage === "tac_review") return [{ action: "authorize", label: "Record the TAC outcome" }];
  if (stage === "director_review") return [{ action: "authorize", label: "Approve the TAC output" }, { action: "reject", label: "Send back to TAC" }];
  if (stage === "publish") return [{ action: "publish", label: "Publish the AWP" }];
  return [];
}

const forwardActions = new Set(["accept", "endorse", "authorize"]);

portal.post("/tasks/:id/complete", requirePermission("workflow.act"), async (req, res) => {
  const id = idParam(req.params.id);
  const action = String(req.body?.action || "");
  const remarks = String(req.body?.remarks || "").trim().slice(0, 2000);
  const codes = roleCodes(req.session.user);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      `SELECT t.id, t.status, t.stage_code, t.stage_order, t.assignee_role_code, t.assignee_user_id, t.instance_id,
              i.applies_to, p.id AS project_id, p.project_category, p.intake, p.department_id, p.project_type_id,
              p.awp_cycle_id, p.title AS project_title, pr.id AS proposal_id, pr.proposal_number, pr.created_by
       FROM ipeot.workflow_tasks t
       JOIN ipeot.workflow_instances i ON i.id = t.instance_id
       JOIN ipeot.projects p ON p.id = i.project_id
       LEFT JOIN ipeot.proposals pr ON pr.project_id = p.id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [id],
    );
    const task = current.rows[0];
    if (!task) throw httpError(404, "not_found");
    if (task.status !== "pending") throw httpError(409, "task_closed");
    const assignedToUser = task.assignee_user_id && Number(task.assignee_user_id) === Number(req.session.user.id);
    if (!codes.includes("ADMIN") && !codes.includes(task.assignee_role_code) && !assignedToUser) throw httpError(403, "forbidden");
    await client.query(
      `UPDATE ipeot.workflow_tasks
       SET status = 'completed', action = $2::ipeot.workflow_action, remarks = $3,
           completed_at = now(), completed_by = $4
       WHERE id = $1`,
      [id, action, remarks || null, req.session.user.id],
    );
    if (task.applies_to === "proposal" && isPhase1Stage(task.stage_code)) {
      const result = await applyProposalAction(client, task, action, req.body || {}, req.session.user.id);
      await client.query("COMMIT");
      await recordAudit({
        entity: "workflow_task",
        entityId: id,
        action,
        actorId: req.session.user.id,
        payload: { remarks, nextStage: result.nextStage, projectId: task.project_id },
      });
      res.json({ data: { id, action, nextStage: result.nextStage } });
      return;
    }
    if (!forwardActions.has(action) && action !== "modify" && action !== "reject") throw httpError(400, "invalid_action");
    if ((action === "modify" || action === "reject") && !remarks) throw httpError(400, "remarks_required");
    let nextStage = null;
    if (forwardActions.has(action)) {
      const next = await client.query(
        `SELECT stage_code, stage_order, assignee_role_code
         FROM ipeot.approval_matrix
         WHERE project_category = $1 AND applies_to = $2 AND active AND department_id IS NULL AND stage_order > $3
         ORDER BY stage_order
         LIMIT 1`,
        [task.project_category, task.applies_to, task.stage_order],
      );
      if (next.rows[0]) {
        const sla = await client.query(
          `SELECT target_days FROM ipeot.sla_rules WHERE stage_code = $1 AND active AND project_category IS NULL LIMIT 1`,
          [next.rows[0].stage_code],
        );
        const days = sla.rows[0]?.target_days || 7;
        await client.query(
          `INSERT INTO ipeot.workflow_tasks (instance_id, stage_code, stage_order, assignee_role_code, status, due_at)
           VALUES ($1, $2, $3, $4, 'pending', now() + ($5::int * interval '1 day'))`,
          [task.instance_id, next.rows[0].stage_code, next.rows[0].stage_order, next.rows[0].assignee_role_code, days],
        );
        await client.query(
          `UPDATE ipeot.workflow_instances SET current_stage = $2 WHERE id = $1`,
          [task.instance_id, next.rows[0].stage_code],
        );
        await client.query(`UPDATE ipeot.projects SET status = 'in_review' WHERE id = $1`, [task.project_id]);
        nextStage = next.rows[0].stage_code;
      } else {
        const finished = action === "authorize" ? "authorized" : "endorsed";
        await client.query(
          `UPDATE ipeot.workflow_instances SET status = 'completed', completed_at = now() WHERE id = $1`,
          [task.instance_id],
        );
        await client.query(`UPDATE ipeot.projects SET status = $2::ipeot.project_status WHERE id = $1`, [task.project_id, finished]);
      }
    } else if (action === "modify") {
      await client.query(`UPDATE ipeot.workflow_instances SET status = 'cancelled', completed_at = now() WHERE id = $1`, [task.instance_id]);
      await client.query(`UPDATE ipeot.projects SET status = 'scope_modification' WHERE id = $1`, [task.project_id]);
      await client.query(`UPDATE ipeot.proposals SET submitted_at = NULL WHERE project_id = $1`, [task.project_id]);
    } else {
      await client.query(`UPDATE ipeot.workflow_instances SET status = 'cancelled', completed_at = now() WHERE id = $1`, [task.instance_id]);
      await client.query(`UPDATE ipeot.projects SET status = 'rejected' WHERE id = $1`, [task.project_id]);
    }
    await client.query("COMMIT");
    await recordAudit({
      entity: "workflow_task",
      entityId: id,
      action,
      actorId: req.session.user.id,
      payload: { remarks, nextStage, projectId: task.project_id },
    });
    res.json({ data: { id, action, nextStage } });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

portal.get("/awp/cycles", requirePermission("awp.read"), async (_req, res) => {
  await sendDueReminders(pool).catch(() => {});
  const cycles = await pool.query(
    `SELECT id, year, title, status, window_open AS "windowOpen", window_close AS "windowClose",
            package_status AS "packageStatus", invitation_sent_at AS "invitationSentAt",
            masters_updated_at AS "mastersUpdatedAt", published_at AS "publishedAt",
            consolidated_body IS NOT NULL AS "hasConsolidation",
            disha_payload IS NOT NULL AS "hasDisha"
     FROM ipeot.awp_cycles
     ORDER BY year DESC, id DESC`,
  );
  const filed = await pool.query(
    `SELECT p.id AS "projectId", p.awp_cycle_id AS "cycleId",
            d.code AS "departmentCode", d.name AS "departmentName",
            pr.id AS "proposalId", pr.proposal_number AS "proposalNumber",
            p.title, p.status, p.project_category AS "projectCategory",
            p.final_quarter AS "finalQuarter", p.schedule_decision AS "scheduleDecision", p.priority
     FROM ipeot.projects p
     JOIN ipeot.departments d ON d.id = p.department_id
     JOIN ipeot.proposals pr ON pr.project_id = p.id
     WHERE p.awp_cycle_id IS NOT NULL
     ORDER BY d.code, pr.proposal_number`,
  );
  const byCycle = new Map();
  for (const row of filed.rows) {
    const list = byCycle.get(row.cycleId) || [];
    list.push(row);
    byCycle.set(row.cycleId, list);
  }
  res.json({
    data: cycles.rows.map((cycle) => ({ ...cycle, proposals: byCycle.get(cycle.id) || [] })),
  });
});

function awpWindow(body) {
  const year = Number(body?.year);
  const title = String(body?.title || "").trim();
  const windowOpen = new Date(body?.windowOpen);
  const windowClose = new Date(body?.windowClose);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw httpError(400, "invalid_year");
  if (!title || title.length > 200) throw httpError(400, "title_required");
  if (Number.isNaN(windowOpen.getTime()) || Number.isNaN(windowClose.getTime()) || windowClose <= windowOpen) {
    throw httpError(400, "invalid_window");
  }
  return { year, title, windowOpen: windowOpen.toISOString(), windowClose: windowClose.toISOString() };
}

portal.post("/awp/cycles", requirePermission("awp.write"), async (req, res) => {
  const cycle = awpWindow(req.body || {});
  const status = req.body?.status === "draft" ? "draft" : "open";
  try {
    const inserted = await pool.query(
      `INSERT INTO ipeot.awp_cycles (year, title, window_open, window_close, status)
       VALUES ($1, $2, $3, $4, $5::ipeot.awp_status)
       RETURNING id, year, title, status, window_open AS "windowOpen", window_close AS "windowClose"`,
      [cycle.year, cycle.title, cycle.windowOpen, cycle.windowClose, status],
    );
    if (status === "open") await inviteCycle(inserted.rows[0], Boolean(req.body?.mastersUpdated));
    await recordAudit({
      entity: "awp_cycle",
      entityId: inserted.rows[0].id,
      action: "open",
      actorId: req.session.user.id,
      payload: { year: cycle.year, title: cycle.title, status },
    });
    res.status(201).json({ data: inserted.rows[0] });
  } catch (err) {
    if (err.code === "23505") throw httpError(409, "awp_exists");
    throw err;
  }
});

portal.patch("/awp/cycles/:id", requirePermission("awp.write"), async (req, res) => {
  const id = idParam(req.params.id);
  const status = String(req.body?.status || "");
  if (!["draft", "open", "closed"].includes(status)) throw httpError(400, "invalid_status");
  const updated = await pool.query(
    `UPDATE ipeot.awp_cycles SET status = $2::ipeot.awp_status WHERE id = $1
     RETURNING id, year, title, status, window_open AS "windowOpen", window_close AS "windowClose"`,
    [id, status],
  );
  if (!updated.rows[0]) throw httpError(404, "not_found");
  await recordAudit({
    entity: "awp_cycle",
    entityId: id,
    action: status,
    actorId: req.session.user.id,
    payload: { status },
  });
  res.json({ data: updated.rows[0] });
});

async function inviteCycle(cycle, mastersUpdated) {
  const client = await pool.connect();
  try {
    const subject = `AWP is open — ${cycle.title}`;
    const body = `The annual work plan is open. Submit projects within one month in the fixed template. The window runs from ${cycle.windowOpen} to ${cycle.windowClose}. There is no provision for a late submission into this AWP.`;
    await mailCoordinators(client, cycle, "invitation", subject, body);
    await client.query(
      `UPDATE ipeot.awp_cycles
       SET invitation_sent_at = now(), masters_updated_at = CASE WHEN $2 THEN now() ELSE masters_updated_at END
       WHERE id = $1`,
      [cycle.id, mastersUpdated],
    );
  } finally {
    client.release();
  }
}

portal.post("/awp/cycles/:id/invite", requirePermission("awp.write"), async (req, res) => {
  const id = idParam(req.params.id);
  const { rows } = await pool.query(
    `SELECT id, year, title, window_open AS "windowOpen", window_close AS "windowClose" FROM ipeot.awp_cycles WHERE id = $1 AND status = 'open'`,
    [id],
  );
  if (!rows[0]) throw httpError(404, "not_found");
  await inviteCycle(rows[0], Boolean(req.body?.mastersUpdated));
  res.json({ data: { id, invited: true } });
});

portal.post("/awp/cycles/:id/consolidate", requirePermission("awp.write"), async (req, res) => {
  const id = idParam(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await consolidateCycle(client, id);
    await client.query("COMMIT");
    res.json({ data: result });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

portal.post("/awp/package-tasks/:id/complete", requirePermission("workflow.act"), async (req, res) => {
  const id = idParam(req.params.id);
  const action = String(req.body?.action || "");
  const codes = roleCodes(req.session.user);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(`SELECT * FROM ipeot.awp_package_tasks WHERE id = $1 FOR UPDATE`, [id]);
    const task = current.rows[0];
    if (!task) throw httpError(404, "not_found");
    if (task.status !== "pending") throw httpError(409, "task_closed");
    if (!codes.includes("ADMIN") && !codes.includes(task.assignee_role_code)) throw httpError(403, "forbidden");
    const result = await completePackageTask(client, task, action, req.body || {}, req.session.user.id);
    await client.query("COMMIT");
    res.json({ data: { id, action, ...result } });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

portal.get("/awp/cycles/:id/presentation", requirePermission("awp.read"), async (req, res) => {
  const id = idParam(req.params.id);
  const { rows } = await pool.query(
    `SELECT title, year, consolidated_body AS "consolidatedBody" FROM ipeot.awp_cycles WHERE id = $1`,
    [id],
  );
  if (!rows[0]?.consolidatedBody) throw httpError(404, "not_consolidated");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(buildPresentation(rows[0], rows[0].consolidatedBody));
});

portal.get("/awp/cycles/:id/disha", requirePermission("awp.read"), async (req, res) => {
  const id = idParam(req.params.id);
  const { rows } = await pool.query(`SELECT disha_payload AS "disha" FROM ipeot.awp_cycles WHERE id = $1`, [id]);
  if (!rows[0]?.disha) throw httpError(404, "not_published");
  res.json({ data: rows[0].disha });
});

portal.get("/notifications/mine", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, title, body, channel, read_at AS "readAt", created_at AS "createdAt"
     FROM ipeot.notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [req.session.user.id],
  );
  res.json({ data: rows });
});

portal.get("/awp/coordinators", requirePermission("awp.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT u.id, u.name, u.cpf
     FROM ipeot.users u
     JOIN ipeot.user_role_assignments a ON a.user_id = u.id AND a.active
     JOIN ipeot.roles r ON r.id = a.role_id
     WHERE u.active AND r.code IN ('L3', 'COORDINATOR')
     ORDER BY u.name`,
  );
  res.json({ data: rows });
});

portal.get("/awp/stakeholders", requirePermission("awp.read"), async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.kind, s.code, s.name, s.active, s.coordinator_user_id AS "coordinatorUserId", u.name AS "coordinatorName"
     FROM ipeot.stakeholder_units s
     LEFT JOIN ipeot.users u ON u.id = s.coordinator_user_id
     ORDER BY s.kind, s.code`,
  );
  res.json({ data: rows });
});

portal.post("/awp/stakeholders", requirePermission("awp.write"), async (req, res) => {
  const kind = String(req.body?.kind || "");
  if (!["asset", "plant", "service", "institute"].includes(kind)) throw httpError(400, "invalid_kind");
  const code = cleanCode(req.body?.code);
  const name = cleanName(req.body?.name);
  const coordinatorUserId = req.body?.coordinatorUserId ? idParam(req.body.coordinatorUserId) : null;
  const { rows } = await pool.query(
    `INSERT INTO ipeot.stakeholder_units (kind, code, name, coordinator_user_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, kind, code, name, coordinator_user_id AS "coordinatorUserId"`,
    [kind, code, name, coordinatorUserId],
  );
  res.status(201).json({ data: rows[0] });
});

portal.get("/awp/routing", requirePermission("awp.read"), async (req, res) => {
  const typeCode = String(req.query.typeCode || "");
  const { rows } = await pool.query(
    `SELECT r.id, t.code AS "typeCode", t.name AS "typeName", d.id AS "departmentId", d.code AS "departmentCode", d.name AS "departmentName", r.tag
     FROM ipeot.routing_rules r
     JOIN ipeot.project_types t ON t.id = r.project_type_id
     JOIN ipeot.departments d ON d.id = r.department_id
     WHERE r.active AND ($1 = '' OR t.code = $1)
     ORDER BY t.code, d.code`,
    [typeCode],
  );
  res.json({ data: rows });
});

portal.post("/awp/routing", requirePermission("awp.write"), async (req, res) => {
  const projectTypeId = idParam(req.body?.projectTypeId);
  const departmentId = idParam(req.body?.departmentId);
  const tag = String(req.body?.tag || "").trim().slice(0, 80) || null;
  const { rows } = await pool.query(
    `INSERT INTO ipeot.routing_rules (project_type_id, department_id, tag)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_type_id, department_id) DO UPDATE SET tag = EXCLUDED.tag, active = true
     RETURNING id`,
    [projectTypeId, departmentId, tag],
  );
  res.status(201).json({ data: rows[0] });
});

export default portal;
