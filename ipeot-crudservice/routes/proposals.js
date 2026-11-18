import { Router } from "express";
import { pool, recordAudit } from "../db.js";
import { requirePermission } from "../authz.js";
import { httpError, idParam, page } from "../http.js";
import { validateProposal } from "../proposal-form.js";
import { openProposalWorkflow } from "../awp-flow.js";

const proposals = Router();

function studyFromRow(row) {
  return {
    code: row.code,
    name: row.name,
    sampleReport: row.sample_report,
    inputs: row.inputs || [],
    specimens: row.specimens || [],
    equipment: row.equipment || [],
    tests: row.tests || [],
    software: row.software || [],
    formSchema: row.form_schema,
    departmentCode: row.departmentCode,
    departmentName: row.departmentName,
    workCentreCode: row.workCentreCode,
    workCentreName: row.workCentreName,
  };
}

const studySelect = `
  SELECT t.code, t.name, t.id AS type_id, t.department_id, t.work_centre_id,
         d.code AS "departmentCode", d.name AS "departmentName",
         w.code AS "workCentreCode", w.name AS "workCentreName",
         c.sample_report, c.inputs, c.specimens, c.equipment, c.tests, c.software, c.form_schema
  FROM ipeot.project_types t
  JOIN ipeot.departments d ON d.id = t.department_id
  LEFT JOIN ipeot.work_centres w ON w.id = t.work_centre_id
  LEFT JOIN ipeot.study_catalogue c ON c.project_type_code = t.code
`;

proposals.get("/guidelines", requirePermission("proposals.read"), async (req, res) => {
  const category = String(req.query.category || "scheduled");
  if (!["scheduled", "unscheduled", "short_term"].includes(category)) throw httpError(400, "invalid_category");
  const proposalId = req.query.proposalId ? idParam(req.query.proposalId) : null;
  const { rows } = await pool.query(
    `SELECT m.stage_order AS "stageOrder", m.stage_name AS "stageName", m.stage_code AS "stageCode",
            m.assignee_role_code AS "roleCode", s.target_days AS "targetDays",
            t.created_at AS "receivedAt", t.completed_at AS "completedAt", t.due_at AS "dueAt",
            t.status AS "taskStatus"
     FROM ipeot.approval_matrix m
     LEFT JOIN ipeot.sla_rules s ON s.stage_code = m.stage_code AND s.active AND s.project_category IS NULL
     LEFT JOIN LATERAL (
       SELECT wt.created_at, wt.completed_at, wt.due_at, wt.status
       FROM ipeot.workflow_tasks wt
       JOIN ipeot.workflow_instances wi ON wi.id = wt.instance_id
       JOIN ipeot.proposals pr ON pr.project_id = wi.project_id
       WHERE $2::bigint IS NOT NULL AND pr.id = $2::bigint
         AND wi.applies_to = 'proposal' AND wt.stage_code = m.stage_code
       ORDER BY wt.created_at DESC
       LIMIT 1
     ) t ON true
     WHERE m.active AND m.applies_to = 'proposal' AND m.department_id IS NULL
       AND m.project_category = $1::ipeot.project_category
     ORDER BY m.stage_order`,
    [category, proposalId],
  );
  res.json({
    data: rows.map((row) => {
      if (!row.receivedAt || (row.taskStatus !== "completed" && row.taskStatus !== "pending")) {
        return { ...row, doneInDays: null, onTime: null };
      }
      const start = new Date(row.receivedAt).getTime();
      const finished = row.taskStatus === "completed" && row.completedAt;
      const end = finished ? new Date(row.completedAt).getTime() : Date.now();
      const due = row.dueAt ? new Date(row.dueAt).getTime() : (row.targetDays ? start + Number(row.targetDays) * 86400000 : null);
      const late = due != null && end > due;
      if (!finished && !late) return { ...row, doneInDays: null, onTime: null };
      const elapsed = (end - start) / 86400000;
      return {
        ...row,
        doneInDays: elapsed < 1 ? 0 : Math.ceil(elapsed),
        onTime: due == null ? null : !late,
      };
    }),
  });
});

proposals.get("/catalogue", requirePermission("proposals.read"), async (_req, res) => {
  const { rows } = await pool.query(`${studySelect} WHERE t.active ORDER BY d.code, w.code NULLS FIRST, t.code`);
  const departments = [];
  for (const row of rows) {
    if (row.inputs == null && row.form_schema == null) continue;
    let department = departments.find((item) => item.code === row.departmentCode);
    if (!department) {
      department = { code: row.departmentCode, name: row.departmentName, studies: [] };
      departments.push(department);
    }
    department.studies.push(studyFromRow(row));
  }
  res.json({ data: departments });
});

async function loadStudy(code) {
  const { rows } = await pool.query(`${studySelect} WHERE t.code = $1 AND t.active`, [code]);
  return rows[0] ? studyFromRow(rows[0]) : null;
}

async function insertProposal(userId, studyRow, value) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const project = await client.query(
      `INSERT INTO ipeot.projects (
         project_category, department_id, work_centre_id, project_type_id, title, status, created_by,
         priority, preferred_quarter, intake
       )
       SELECT $1::ipeot.project_category, t.department_id, t.work_centre_id, t.id, $2, 'draft', $3, $5, $6, $7
       FROM ipeot.project_types t WHERE t.code = $4
       RETURNING id`,
      [value.category, value.title, userId, studyRow.code, value.priority, value.preferredQuarter, value.intake || "awp"],
    );
    const number = await client.query(
      `SELECT 'P-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ipeot.proposal_number_seq')::text, 4, '0') AS proposal_number`,
    );
    const proposal = await client.query(
      `INSERT INTO ipeot.proposals (project_id, proposal_number, form, current_version, created_by)
       VALUES ($1, $2, $3::jsonb, 1, $4)
       RETURNING id, proposal_number`,
      [project.rows[0].id, number.rows[0].proposal_number, JSON.stringify(value.form), userId],
    );
    await client.query(
      `INSERT INTO ipeot.proposal_versions (proposal_id, version_no, snapshot, created_by)
       VALUES ($1, 1, $2::jsonb, $3)`,
      [proposal.rows[0].id, JSON.stringify({ title: value.title, category: value.category, form: value.form }), userId],
    );
    for (const file of value.files || []) {
      await client.query(
        `INSERT INTO ipeot.proposal_files (proposal_id, file_name, mime, size_bytes, content, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [proposal.rows[0].id, file.name, file.mime, file.content.length, file.content, userId],
      );
    }
    await client.query("COMMIT");
    return { id: proposal.rows[0].id, projectId: project.rows[0].id, proposalNumber: proposal.rows[0].proposal_number };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

proposals.get("/proposals", requirePermission("proposals.read"), async (req, res) => {
  const { limit, offset } = page(req);
  const { rows } = await pool.query(
    `SELECT pr.id, pr.proposal_number AS "proposalNumber", pr.submitted_at AS "submittedAt",
            p.id AS "projectId", p.title, p.status, p.project_category AS "projectCategory",
            t.code AS "typeCode", t.name AS "typeName", d.code AS "departmentCode", d.name AS "departmentName",
            c.title AS "awpTitle"
     FROM ipeot.proposals pr
     JOIN ipeot.projects p ON p.id = pr.project_id
     JOIN ipeot.project_types t ON t.id = p.project_type_id
     JOIN ipeot.departments d ON d.id = p.department_id
     LEFT JOIN ipeot.awp_cycles c ON c.id = p.awp_cycle_id
     ORDER BY pr.id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  res.json({ data: rows });
});

proposals.post("/proposals", requirePermission("proposals.write"), async (req, res) => {
  const study = await loadStudy(String(req.body?.typeCode || ""));
  if (!study) throw httpError(400, "invalid_study");
  const checked = validateProposal(study, req.body || {});
  if (checked.error) throw httpError(400, checked.error);
  const files = decodeFiles(req.body?.attachments);
  if (files.error) throw httpError(400, files.error);
  const created = await insertProposal(req.session.user.id, study, { ...checked.value, files: files.files });
  await recordAudit({
    entity: "proposal",
    entityId: created.id,
    action: "create",
    actorId: req.session.user.id,
    payload: { proposalNumber: created.proposalNumber, typeCode: study.code },
  });
  res.status(201).json({ data: created });
});

proposals.get("/proposals/:id", requirePermission("proposals.read"), async (req, res) => {
  const id = idParam(req.params.id);
  const { rows } = await pool.query(
    `SELECT pr.id, pr.proposal_number AS "proposalNumber", pr.form, pr.current_version AS "currentVersion",
            pr.submitted_at AS "submittedAt", pr.created_by AS "createdBy",
            p.id AS "projectId", p.title, p.status, p.project_category AS "projectCategory", p.intake,
            p.priority, p.preferred_quarter AS "preferredQuarter", p.final_quarter AS "finalQuarter",
            p.schedule_decision AS "scheduleDecision", p.dependency_note AS "dependencyNote",
            p.rejection_reason AS "rejectionReason", p.removal_reason AS "removalReason",
            p.scope_note AS "scopeNote", p.job_tags AS "jobTags",
            p.short_term_outcome AS "shortTermOutcome", p.short_term_effort AS "shortTermEffort",
            t.code AS "typeCode", t.name AS "typeName",
            d.code AS "departmentCode", d.name AS "departmentName",
            c.title AS "awpTitle", c.year AS "awpYear",
            sc.sample_report AS "sampleReport", sc.inputs, sc.specimens, sc.equipment, sc.tests, sc.software, sc.form_schema AS "formSchema"
     FROM ipeot.proposals pr
     JOIN ipeot.projects p ON p.id = pr.project_id
     JOIN ipeot.project_types t ON t.id = p.project_type_id
     JOIN ipeot.departments d ON d.id = p.department_id
     LEFT JOIN ipeot.awp_cycles c ON c.id = p.awp_cycle_id
     LEFT JOIN ipeot.study_catalogue sc ON sc.project_type_code = t.code
     WHERE pr.id = $1`,
    [id],
  );
  if (!rows[0]) throw httpError(404, "not_found");
  const files = await pool.query(
    `SELECT id, file_name AS "fileName", mime, size_bytes AS "sizeBytes" FROM ipeot.proposal_files WHERE proposal_id = $1 ORDER BY id`,
    [id],
  );
  const reviews = await pool.query(
    `SELECT t.action, t.remarks, t.stage_code AS "stageCode", t.completed_at AS "completedAt",
            u.name AS "actorName", u.cpf AS "actorCpf"
     FROM ipeot.workflow_tasks t
     JOIN ipeot.workflow_instances i ON i.id = t.instance_id
     LEFT JOIN ipeot.users u ON u.id = t.completed_by
     WHERE i.project_id = $1 AND t.status = 'completed'
     ORDER BY t.completed_at DESC NULLS LAST
     LIMIT 8`,
    [rows[0].projectId],
  );
  res.json({ data: { ...rows[0], files: files.rows, reviews: reviews.rows } });
});

proposals.get("/proposals/:id/files/:fileId", requirePermission("proposals.read"), async (req, res) => {
  const id = idParam(req.params.id);
  const fileId = idParam(req.params.fileId);
  const { rows } = await pool.query(
    `SELECT file_name, mime, content FROM ipeot.proposal_files WHERE id = $1 AND proposal_id = $2`,
    [fileId, id],
  );
  if (!rows[0]) throw httpError(404, "not_found");
  res.setHeader("Content-Type", rows[0].mime || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${rows[0].file_name.replace(/["\r\n]/g, "")}"`);
  res.send(rows[0].content);
});

proposals.post("/proposals/:id/submit", requirePermission("proposals.submit"), async (req, res) => {
  const id = idParam(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      `SELECT pr.id, p.id AS project_id, p.status, p.project_category, p.department_id, p.awp_cycle_id,
              p.priority, p.preferred_quarter, p.intake
       FROM ipeot.proposals pr
       JOIN ipeot.projects p ON p.id = pr.project_id
       WHERE pr.id = $1
       FOR UPDATE OF pr, p`,
      [id],
    );
    if (!current.rows[0]) throw httpError(404, "not_found");
    if (!["draft", "scope_modification"].includes(current.rows[0].status)) throw httpError(409, "already_submitted");
    const row = current.rows[0];
    if (row.project_category === "scheduled" && row.intake !== "in_year" && (row.priority == null || !row.preferred_quarter)) {
      throw httpError(400, "planning_required");
    }
    let cycleId = row.awp_cycle_id;
    if (row.project_category === "scheduled" && row.intake !== "in_year" && !cycleId) {
      const open = await client.query(
        `SELECT id
         FROM ipeot.awp_cycles
         WHERE status = 'open'
           AND window_open <= now()
           AND window_close >= now()
         ORDER BY (year = EXTRACT(YEAR FROM now())::int) DESC, id DESC
         LIMIT 1`,
      );
      if (!open.rows[0]) throw httpError(409, "awp_window_closed");
      cycleId = open.rows[0].id;
      await client.query(`UPDATE ipeot.projects SET awp_cycle_id = $2 WHERE id = $1`, [row.project_id, cycleId]);
    }
    if (cycleId) {
      await client.query(
        `INSERT INTO ipeot.awp_submissions (awp_cycle_id, proposal_id, submitted_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (awp_cycle_id, proposal_id) DO NOTHING`,
        [cycleId, id, req.session.user.id],
      );
    }
    const stage = await openProposalWorkflow(client, row);
    await client.query(`UPDATE ipeot.projects SET status = 'submitted' WHERE id = $1`, [row.project_id]);
    await client.query(`UPDATE ipeot.proposals SET submitted_at = now() WHERE id = $1`, [id]);
    await client.query("COMMIT");
    await recordAudit({
      entity: "proposal",
      entityId: id,
      action: "submit",
      actorId: req.session.user.id,
      payload: { stage: stage.stage, role: stage.role, awpCycleId: cycleId },
    });
    res.json({ data: { id, stage: stage.stage, role: stage.role } });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

function decodeFiles(list) {
  if (list == null) return { files: [] };
  if (!Array.isArray(list) || list.length > 5) return { error: "invalid_attachment" };
  const files = [];
  for (const item of list) {
    const name = String(item?.name || "").trim().slice(0, 180);
    const data = String(item?.dataBase64 || "");
    if (!name || !data) return { error: "invalid_attachment" };
    const content = Buffer.from(data, "base64");
    if (!content.length || content.length > 2_000_000) return { error: "invalid_attachment" };
    files.push({ name, mime: String(item?.mime || "application/octet-stream").slice(0, 120), content });
  }
  return { files };
}

export default proposals;
