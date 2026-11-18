const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const PHASE1_STAGES = new Set([
  "pcc_route", "dept_review", "clarification", "pcc_return", "incharge_review",
  "hod_endorse", "short_term_hod", "short_term_close", "in_year_hod",
]);

const STAGE_DAYS = {
  pcc_route: 5,
  dept_review: 7,
  clarification: 7,
  pcc_return: 3,
  incharge_review: 7,
  hod_endorse: 7,
  short_term_hod: 5,
  short_term_close: 15,
  in_year_hod: 5,
};

export function isPhase1Stage(stage) {
  return PHASE1_STAGES.has(stage);
}

export function proposalTransition(state, action, body = {}) {
  const remarks = String(body.remarks || "").trim();
  const stage = state.stage;

  if (stage === "pcc_route") {
    if (action !== "route") return { error: "invalid_action" };
    return { status: "department_review", next: task("dept_review", "HOD", 2) };
  }

  if (stage === "dept_review") {
    if (action === "clarify") {
      if (!remarks) return { error: "remarks_required" };
      return { status: "clarification", next: task("clarification", "L3", 3, true) };
    }
    if (action === "reject") {
      if (!remarks) return { error: "remarks_required" };
      return { status: "department_review", rejectionReason: remarks, next: task("pcc_return", "PCC", 3) };
    }
    if (action === "short_term") {
      return { status: "in_review", category: "short_term", next: task("short_term_hod", "HOD", 4) };
    }
    if (action === "reroute") {
      if (body.reroute === "in_year") {
        return {
          status: "in_review",
          category: "unscheduled",
          intake: "in_year",
          next: task("in_year_hod", "HOD", 4),
        };
      }
      if (body.reroute === "next_awp") {
        return { status: "draft", category: "scheduled", intake: "awp", clearCycle: true, end: true, unsubmit: true };
      }
      return { error: "invalid_reroute" };
    }
    if (action === "accept") {
      const tags = String(body.tags || "").trim().slice(0, 300);
      const parent = Number(body.parentDepartmentId);
      const parentDepartmentId = Number.isInteger(parent) && parent > 0 ? parent : null;
      if (state.category === "short_term") {
        return { status: "in_review", tags, parentDepartmentId, next: task("short_term_hod", "HOD", 4) };
      }
      if (state.intake === "in_year" || state.category === "unscheduled") {
        return { status: "in_review", tags, parentDepartmentId, next: task("in_year_hod", "HOD", 4) };
      }
      return { status: "incharge_review", tags, parentDepartmentId, next: task("incharge_review", "IC", 4) };
    }
    return { error: "invalid_action" };
  }

  if (stage === "clarification") {
    if (action !== "accept") return { error: "invalid_action" };
    if (!remarks) return { error: "remarks_required" };
    return { status: "department_review", next: task("dept_review", "HOD", 2) };
  }

  if (stage === "pcc_return") {
    if (action !== "accept") return { error: "invalid_action" };
    return { status: "rejected", end: true, notify: "rejected" };
  }

  if (stage === "incharge_review") {
    if (action !== "schedule") return { error: "invalid_action" };
    if (body.decision === "scheduled") {
      if (!QUARTERS.includes(body.quarter)) return { error: "invalid_quarter" };
      return {
        status: "plan_scheduled",
        category: "scheduled",
        intake: "awp",
        scheduleDecision: "scheduled",
        finalQuarter: body.quarter,
        scopeNote: remarks,
        next: task("hod_endorse", "HOD", 5),
      };
    }
    if (body.decision === "unscheduled") {
      const dependency = String(body.dependency || remarks).trim();
      if (!dependency) return { error: "remarks_required" };
      return {
        status: "plan_unscheduled",
        category: "unscheduled",
        intake: "awp",
        scheduleDecision: "unscheduled",
        dependencyNote: dependency,
        scopeNote: remarks,
        next: task("hod_endorse", "HOD", 5),
      };
    }
    return { error: "invalid_decision" };
  }

  if (stage === "hod_endorse") {
    if (action === "endorse") return { status: "hod_endorsed", end: true };
    if (action === "return") {
      if (!remarks) return { error: "remarks_required" };
      return { status: "incharge_review", next: task("incharge_review", "IC", 4) };
    }
    return { error: "invalid_action" };
  }

  if (stage === "short_term_hod") {
    if (action === "endorse" || action === "accept") {
      return { status: "in_progress", next: task("short_term_close", "HOD", 6) };
    }
    if (action === "reject") {
      if (!remarks) return { error: "remarks_required" };
      return { status: "rejected", rejectionReason: remarks, end: true, notify: "rejected" };
    }
    return { error: "invalid_action" };
  }

  if (stage === "short_term_close") {
    if (action !== "complete_work") return { error: "invalid_action" };
    const outcome = String(body.outcome || "").trim();
    const effort = String(body.effort || "").trim();
    if (!outcome || !effort) return { error: "outcome_required" };
    return { status: "short_term_closed", outcome, effort, end: true, notify: "short_term_closed" };
  }

  if (stage === "in_year_hod") {
    if (action === "endorse" || action === "accept") {
      return { status: "in_year_approved", end: true, notify: "in_year_approved" };
    }
    if (action === "reject") {
      if (!remarks) return { error: "remarks_required" };
      return { status: "rejected", rejectionReason: remarks, end: true, notify: "rejected" };
    }
    return { error: "invalid_action" };
  }

  return { error: "invalid_action" };
}

function task(stage, role, order, assignCreator = false) {
  return { stage, role, order, assignCreator, days: STAGE_DAYS[stage] || 7 };
}

export function stageActions(state) {
  const stage = state.stageCode || state.stage;
  if (stage === "pcc_route") return [{ action: "route", label: "Route to department" }];
  if (stage === "dept_review") {
    const actions = [
      { action: "clarify", label: "Ask the coordinator" },
      { action: "reject", label: "Reject" },
    ];
    if (state.category === "short_term") {
      actions.unshift({ action: "accept", label: "Qualifies as short-term" });
      actions.push({ action: "reroute", label: "Does not qualify" });
    } else if (state.intake === "in_year" || state.category === "unscheduled") {
      actions.unshift({ action: "accept", label: "Needs HOD approval" });
      actions.push({ action: "short_term", label: "Treat as short-term" });
    } else {
      actions.unshift({ action: "accept", label: "Accept into the AWP" });
      actions.push({ action: "short_term", label: "Classify as short-term" });
    }
    return actions;
  }
  if (stage === "clarification") return [{ action: "accept", label: "Send the clarification" }];
  if (stage === "pcc_return") return [{ action: "accept", label: "Return to the coordinator" }];
  if (stage === "incharge_review") return [{ action: "schedule", label: "Record the schedule" }];
  if (stage === "hod_endorse") {
    return [
      { action: "endorse", label: "Endorse" },
      { action: "return", label: "Send back to the In-charge" },
    ];
  }
  if (stage === "short_term_hod" || stage === "in_year_hod") {
    return [
      { action: "endorse", label: "Approve" },
      { action: "reject", label: "Reject" },
    ];
  }
  if (stage === "short_term_close") return [{ action: "complete_work", label: "Close the short-term job" }];
  return [];
}

export function buildConsolidation(cycle, projects) {
  const lines = [`${cycle.title} (${cycle.year})`, "Consolidated annual work plan", ""];
  const groups = new Map();
  for (const project of projects) {
    const name = project.departmentName || "Department";
    groups.set(name, [...(groups.get(name) || []), project]);
  }
  for (const [name, rows] of groups) {
    lines.push(name);
    for (const row of rows) {
      const when = row.scheduleDecision === "unscheduled" ? "Unscheduled" : (row.finalQuarter || row.preferredQuarter || "quarter not set");
      lines.push(`- ${row.proposalNumber} · ${row.title} · ${when} · priority ${row.priority || "—"}`);
      if (row.dependencyNote) lines.push(`  Dependency: ${row.dependencyNote}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function buildDisha(cycle, projects) {
  return {
    source: "IPEOT",
    kind: "AWP",
    cycle: {
      year: cycle.year,
      title: cycle.title,
      publishedAt: cycle.publishedAt || null,
    },
    projects: projects.map((project) => ({
      proposalNumber: project.proposalNumber,
      title: project.title,
      department: project.departmentCode,
      schedule: project.scheduleDecision || project.projectCategory,
      quarter: project.finalQuarter,
      priority: project.priority,
      dependency: project.dependencyNote || null,
      status: project.status,
    })),
  };
}

export function buildPresentation(cycle, body) {
  const slides = String(body || "").split(/\n\n+/).filter(Boolean);
  const pages = slides.map((slide, index) => {
    const [title, ...rest] = slide.split("\n");
    const items = rest.map((line) => `<li>${escapeHtml(line.replace(/^- /, ""))}</li>`).join("");
    return `<section class="slide"><p class="index">${index + 1} / ${slides.length}</p><h1>${escapeHtml(title)}</h1>${items ? `<ul>${items}</ul>` : ""}</section>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(cycle.title)}</title>
<style>
  body { margin: 0; font-family: "Segoe UI", sans-serif; background: #0f2744; color: #102033; }
  .slide { min-height: 100vh; box-sizing: border-box; padding: 64px 72px; background: #f7f4ee; }
  .slide:nth-child(odd) { background: #fff; }
  .index { letter-spacing: .14em; text-transform: uppercase; font-size: 12px; color: #6f695f; }
  h1 { font-size: 42px; line-height: 1.1; max-width: 18ch; }
  ul { font-size: 22px; line-height: 1.45; max-width: 46rem; }
</style></head><body>${pages}</body></html>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

export async function applyProposalAction(client, task, action, body, actorId) {
  const decision = proposalTransition(
    { stage: task.stage_code, category: task.project_category, intake: task.intake },
    action,
    body,
  );
  if (decision.error) {
    const error = new Error(decision.error);
    error.status = 400;
    error.code = decision.error;
    throw error;
  }
  const sets = ["status = $2::ipeot.project_status"];
  const values = [task.project_id, decision.status];
  function add(column, value) {
    if (value === undefined) return;
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }
  add("project_category", decision.category ? `${decision.category}` : undefined);
  if (decision.category) sets[sets.length - 1] = `project_category = $${values.length}::ipeot.project_category`;
  add("intake", decision.intake);
  add("schedule_decision", decision.scheduleDecision);
  add("final_quarter", decision.finalQuarter);
  add("dependency_note", decision.dependencyNote);
  add("scope_note", decision.scopeNote);
  add("rejection_reason", decision.rejectionReason);
  add("job_tags", decision.tags);
  add("parent_department_id", decision.parentDepartmentId);
  add("short_term_outcome", decision.outcome);
  add("short_term_effort", decision.effort);
  if (decision.clearCycle) sets.push("awp_cycle_id = NULL");
  await client.query(`UPDATE ipeot.projects SET ${sets.join(", ")} WHERE id = $1`, values);

  if (action === "route") await saveRoutes(client, task, body);
  if (decision.unsubmit) {
    await client.query(`UPDATE ipeot.proposals SET submitted_at = NULL WHERE project_id = $1`, [task.project_id]);
    await client.query(`DELETE FROM ipeot.awp_submissions WHERE proposal_id = $1`, [task.proposal_id]);
  }
  if (decision.end || decision.clearCycle) {
    await client.query(
      `UPDATE ipeot.workflow_instances SET status = 'completed', completed_at = now() WHERE id = $1`,
      [task.instance_id],
    );
  }
  if (decision.next) {
    await client.query(
      `INSERT INTO ipeot.workflow_tasks (instance_id, stage_code, stage_order, assignee_role_code, assignee_user_id, status, due_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', now() + ($6::int * interval '1 day'))`,
      [
        task.instance_id,
        decision.next.stage,
        decision.next.order,
        decision.next.role,
        decision.next.assignCreator ? task.created_by : null,
        decision.next.days,
      ],
    );
    await client.query(
      `UPDATE ipeot.workflow_instances SET status = 'active', current_stage = $2, completed_at = NULL WHERE id = $1`,
      [task.instance_id, decision.next.stage],
    );
  }
  if (decision.notify) await notifyCreator(client, task, decision.notify, actorId);
  return { status: decision.status, nextStage: decision.next?.stage || null };
}

async function saveRoutes(client, task, body) {
  const requested = Array.isArray(body.departmentIds) ? body.departmentIds.map(Number).filter((id) => Number.isInteger(id) && id > 0) : [];
  let departmentIds = [...new Set(requested)];
  if (departmentIds.length === 0) {
    const rules = await client.query(
      `SELECT department_id FROM ipeot.routing_rules WHERE project_type_id = $1 AND active`,
      [task.project_type_id],
    );
    departmentIds = rules.rows.map((row) => Number(row.department_id));
  }
  if (departmentIds.length === 0 && task.department_id) departmentIds = [Number(task.department_id)];
  if (departmentIds.length === 0) {
    const error = new Error("routing_missing");
    error.status = 400;
    error.code = "routing_missing";
    throw error;
  }
  await client.query(`DELETE FROM ipeot.project_routes WHERE project_id = $1`, [task.project_id]);
  for (const departmentId of departmentIds) {
    await client.query(
      `INSERT INTO ipeot.project_routes (project_id, department_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [task.project_id, departmentId],
    );
  }
}

async function notifyCreator(client, task, kind, actorId) {
  const user = await client.query(`SELECT id, name, email FROM ipeot.users WHERE id = $1`, [task.created_by]);
  const person = user.rows[0];
  if (!person) return;
  const subject = mailSubject(kind, task);
  const body = `${task.proposal_number || "Proposal"} · ${task.project_title || ""}\n${subject}`;
  await client.query(
    `INSERT INTO ipeot.notifications (user_id, title, body, channel, payload) VALUES ($1, $2, $3, 'in_app', $4::jsonb)`,
    [person.id, subject, body, JSON.stringify({ kind, proposalId: task.proposal_id, actorId })],
  );
  await client.query(
    `INSERT INTO ipeot.outbound_mail (awp_cycle_id, kind, recipient_user_id, recipient_email, subject, body)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [task.awp_cycle_id, kind, person.id, person.email, subject, body],
  );
}

function mailSubject(kind, task) {
  const number = task.proposal_number || "A proposal";
  if (kind === "rejected") return `${number} was not accepted`;
  if (kind === "removed") return `${number} was removed from the AWP`;
  if (kind === "published") return `${number} is in the published AWP`;
  if (kind === "short_term_closed") return `${number} is closed as short-term work`;
  if (kind === "in_year_approved") return `${number} is approved as an in-year study`;
  return `${number} was updated`;
}

export async function openProposalWorkflow(client, project) {
  const instance = await client.query(
    `INSERT INTO ipeot.workflow_instances (project_id, applies_to, current_stage, status)
     VALUES ($1, 'proposal', 'pcc_route', 'active') RETURNING id`,
    [project.project_id],
  );
  await client.query(
    `INSERT INTO ipeot.workflow_tasks (instance_id, stage_code, stage_order, assignee_role_code, status, due_at)
     VALUES ($1, 'pcc_route', 1, 'PCC', 'pending', now() + interval '5 days')`,
    [instance.rows[0].id],
  );
  return { stage: "pcc_route", role: "PCC" };
}

const PACKAGE_STAGES = {
  hoi_review: ["HOI review of the AWP", "HOI"],
  tac_review: ["TAC meeting", "TAC"],
  director_review: ["Director approval of the TAC output", "DIRECTOR"],
  publish: ["Publish the final AWP", "PCC"],
};

export async function consolidateCycle(client, cycleId) {
  const cycle = await loadCycle(client, cycleId);
  const projects = await client.query(
    `SELECT pr.proposal_number AS "proposalNumber", p.title, p.priority, p.preferred_quarter AS "preferredQuarter",
            p.final_quarter AS "finalQuarter", p.schedule_decision AS "scheduleDecision", p.dependency_note AS "dependencyNote",
            d.name AS "departmentName"
     FROM ipeot.projects p
     JOIN ipeot.proposals pr ON pr.project_id = p.id
     JOIN ipeot.departments d ON d.id = p.department_id
     WHERE p.awp_cycle_id = $1 AND p.status = 'hod_endorsed'
     ORDER BY d.code, pr.proposal_number`,
    [cycleId],
  );
  if (projects.rows.length === 0) {
    const error = new Error("nothing_to_consolidate");
    error.status = 409;
    error.code = "nothing_to_consolidate";
    throw error;
  }
  const pending = await client.query(
    `SELECT id FROM ipeot.awp_package_tasks WHERE awp_cycle_id = $1 AND status = 'pending'`,
    [cycleId],
  );
  if (pending.rows.length > 0) {
    const error = new Error("package_in_progress");
    error.status = 409;
    error.code = "package_in_progress";
    throw error;
  }
  await client.query(
    `UPDATE ipeot.projects SET status = 'pcc_consolidation' WHERE awp_cycle_id = $1 AND status = 'hod_endorsed'`,
    [cycleId],
  );
  const body = buildConsolidation(cycle, projects.rows);
  await client.query(
    `UPDATE ipeot.awp_cycles SET package_status = 'hoi_review', consolidated_body = $2 WHERE id = $1`,
    [cycleId, body],
  );
  await openPackageTask(client, cycleId, "hoi_review");
  return { count: projects.rows.length };
}

export async function completePackageTask(client, task, action, body, actorId) {
  if (task.stage_code === "hoi_review") {
    if (action === "revise") {
      if (!String(body.remarks || "").trim()) throw coded(400, "remarks_required");
      await client.query(
        `UPDATE ipeot.projects SET status = 'hod_endorsed' WHERE awp_cycle_id = $1 AND status = 'pcc_consolidation'`,
        [task.awp_cycle_id],
      );
      await client.query(`UPDATE ipeot.awp_cycles SET package_status = NULL WHERE id = $1`, [task.awp_cycle_id]);
      return finishPackage(client, task, action, body, actorId);
    }
    if (action !== "endorse") throw coded(400, "invalid_action");
    await client.query(
      `UPDATE ipeot.projects SET status = 'tac_review' WHERE awp_cycle_id = $1 AND status = 'pcc_consolidation'`,
      [task.awp_cycle_id],
    );
    const cycle = await loadCycle(client, task.awp_cycle_id);
    const meeting = await client.query(
      `INSERT INTO ipeot.tac_meetings (title, scheduled_at, status) VALUES ($1, now(), 'scheduled') RETURNING id`,
      [`TAC · ${cycle.title}`],
    );
    const projects = await client.query(
      `SELECT id FROM ipeot.projects WHERE awp_cycle_id = $1 AND status = 'tac_review' ORDER BY id`,
      [task.awp_cycle_id],
    );
    for (const [index, project] of projects.rows.entries()) {
      await client.query(
        `INSERT INTO ipeot.tac_agenda_items (meeting_id, project_id, sort_order) VALUES ($1, $2, $3)`,
        [meeting.rows[0].id, project.id, index + 1],
      );
    }
    await client.query(`UPDATE ipeot.awp_cycles SET package_status = 'tac' WHERE id = $1`, [task.awp_cycle_id]);
    await finishPackage(client, task, action, body, actorId);
    await openPackageTask(client, task.awp_cycle_id, "tac_review");
    return { nextStage: "tac_review" };
  }

  if (task.stage_code === "tac_review") {
    if (action !== "authorize") throw coded(400, "invalid_action");
    const items = Array.isArray(body.items) ? body.items : [];
    const projects = await client.query(
      `SELECT p.id, pr.id AS proposal_id, pr.proposal_number, p.title, pr.created_by, p.awp_cycle_id
       FROM ipeot.projects p JOIN ipeot.proposals pr ON pr.project_id = p.id
       WHERE p.awp_cycle_id = $1 AND p.status = 'tac_review'`,
      [task.awp_cycle_id],
    );
    if (items.length !== projects.rows.length) throw coded(400, "tac_items_required");
    const byId = new Map(items.map((item) => [Number(item.projectId), item]));
    for (const project of projects.rows) {
      const item = byId.get(Number(project.id));
      if (!item || !["finalised", "modified", "removed"].includes(item.decision)) throw coded(400, "invalid_decision");
      const agenda = await client.query(
        `SELECT id FROM ipeot.tac_agenda_items WHERE project_id = $1 ORDER BY id DESC LIMIT 1`,
        [project.id],
      );
      if (agenda.rows[0]) {
        await client.query(
          `INSERT INTO ipeot.tac_decisions (agenda_item_id, decision, remarks, decided_by) VALUES ($1, $2, $3, $4)`,
          [agenda.rows[0].id, item.decision, String(item.remarks || "").slice(0, 2000), actorId],
        );
      }
      if (item.decision === "removed") {
        await client.query(
          `UPDATE ipeot.projects SET status = 'removed', removal_reason = $2 WHERE id = $1`,
          [project.id, String(item.remarks || "Removed at TAC").slice(0, 2000)],
        );
        await notifyCreator(client, {
          created_by: project.created_by,
          proposal_id: project.proposal_id,
          proposal_number: project.proposal_number,
          project_title: project.title,
          awp_cycle_id: project.awp_cycle_id,
        }, "removed", actorId);
      }
    }
    await client.query(`UPDATE ipeot.awp_cycles SET package_status = 'director' WHERE id = $1`, [task.awp_cycle_id]);
    await finishPackage(client, task, action, body, actorId);
    await openPackageTask(client, task.awp_cycle_id, "director_review");
    return { nextStage: "director_review" };
  }

  if (task.stage_code === "director_review") {
    if (action === "reject") {
      if (!String(body.remarks || "").trim()) throw coded(400, "remarks_required");
      await client.query(`UPDATE ipeot.awp_cycles SET package_status = 'tac' WHERE id = $1`, [task.awp_cycle_id]);
      await finishPackage(client, task, action, body, actorId);
      await openPackageTask(client, task.awp_cycle_id, "tac_review");
      return { nextStage: "tac_review" };
    }
    if (action !== "authorize") throw coded(400, "invalid_action");
    await client.query(
      `UPDATE ipeot.projects SET status = 'director_approved' WHERE awp_cycle_id = $1 AND status = 'tac_review'`,
      [task.awp_cycle_id],
    );
    await client.query(`UPDATE ipeot.awp_cycles SET package_status = 'director_approved' WHERE id = $1`, [task.awp_cycle_id]);
    await finishPackage(client, task, action, body, actorId);
    await openPackageTask(client, task.awp_cycle_id, "publish");
    return { nextStage: "publish" };
  }

  if (task.stage_code === "publish") {
    if (action !== "publish") throw coded(400, "invalid_action");
    await client.query(
      `UPDATE ipeot.projects SET status = 'published' WHERE awp_cycle_id = $1 AND status = 'director_approved'`,
      [task.awp_cycle_id],
    );
    const cycle = await loadCycle(client, task.awp_cycle_id);
    const projects = await client.query(
      `SELECT pr.proposal_number AS "proposalNumber", p.title, p.status, p.priority,
              p.final_quarter AS "finalQuarter", p.schedule_decision AS "scheduleDecision",
              p.dependency_note AS "dependencyNote", p.project_category AS "projectCategory",
              d.code AS "departmentCode", pr.created_by, pr.id AS proposal_id
       FROM ipeot.projects p
       JOIN ipeot.proposals pr ON pr.project_id = p.id
       JOIN ipeot.departments d ON d.id = p.department_id
       WHERE p.awp_cycle_id = $1 AND p.status = 'published'`,
      [task.awp_cycle_id],
    );
    const publishedAt = new Date().toISOString();
    const disha = buildDisha({ ...cycle, publishedAt }, projects.rows);
    await client.query(
      `UPDATE ipeot.awp_cycles SET package_status = 'published', published_at = now(), disha_payload = $2::jsonb WHERE id = $1`,
      [task.awp_cycle_id, JSON.stringify(disha)],
    );
    for (const project of projects.rows) {
      await notifyCreator(client, {
        created_by: project.created_by,
        proposal_id: project.proposal_id,
        proposal_number: project.proposalNumber,
        project_title: project.title,
        awp_cycle_id: task.awp_cycle_id,
      }, "published", actorId);
    }
    await finishPackage(client, task, action, body, actorId);
    return { nextStage: null };
  }

  throw coded(400, "invalid_action");
}

async function finishPackage(client, task, action, body, actorId) {
  await client.query(
    `UPDATE ipeot.awp_package_tasks
     SET status = 'completed', action = $2::ipeot.workflow_action, remarks = $3, completed_at = now(), completed_by = $4
     WHERE id = $1`,
    [task.id, action, String(body.remarks || "").trim().slice(0, 2000) || null, actorId],
  );
}

async function openPackageTask(client, cycleId, stage) {
  const [name, role] = PACKAGE_STAGES[stage];
  await client.query(
    `INSERT INTO ipeot.awp_package_tasks (awp_cycle_id, stage_code, stage_name, assignee_role_code, due_at)
     VALUES ($1, $2, $3, $4, now() + interval '7 days')`,
    [cycleId, stage, name, role],
  );
}

async function loadCycle(client, cycleId) {
  const result = await client.query(
    `SELECT id, year, title, consolidated_body AS "consolidatedBody" FROM ipeot.awp_cycles WHERE id = $1`,
    [cycleId],
  );
  if (!result.rows[0]) throw coded(404, "not_found");
  return result.rows[0];
}

function coded(status, code) {
  const error = new Error(code);
  error.status = status;
  error.code = code;
  return error;
}

export async function mailCoordinators(client, cycle, kind, subject, body) {
  const people = await client.query(
    `SELECT DISTINCT u.id, u.email
     FROM ipeot.users u
     JOIN ipeot.user_role_assignments a ON a.user_id = u.id AND a.active
     JOIN ipeot.roles r ON r.id = a.role_id
     WHERE u.active AND r.code IN ('L3', 'COORDINATOR')
     UNION
     SELECT u.id, u.email
     FROM ipeot.stakeholder_units s
     JOIN ipeot.users u ON u.id = s.coordinator_user_id
     WHERE s.active AND u.active`,
  );
  for (const person of people.rows) {
    await client.query(
      `INSERT INTO ipeot.notifications (user_id, title, body, channel, payload) VALUES ($1, $2, $3, 'email', $4::jsonb)`,
      [person.id, subject, body, JSON.stringify({ kind, cycleId: cycle.id })],
    );
    await client.query(
      `INSERT INTO ipeot.outbound_mail (awp_cycle_id, kind, recipient_user_id, recipient_email, subject, body)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cycle.id, kind, person.id, person.email, subject, body],
    );
  }
  return people.rows.length;
}

export async function sendDueReminders(pool) {
  const cycles = await pool.query(
    `SELECT id, year, title, window_close AS "windowClose", reminder_offsets AS "reminderOffsets"
     FROM ipeot.awp_cycles
     WHERE status = 'open' AND window_close > now()`,
  );
  let sent = 0;
  for (const cycle of cycles.rows) {
    const close = new Date(cycle.windowClose).getTime();
    const offsets = cycle.reminderOffsets || [7, 3, 1];
    for (const offset of offsets) {
      const due = close - Number(offset) * 86400000;
      if (Date.now() < due) continue;
      const inserted = await pool.query(
        `INSERT INTO ipeot.awp_reminder_log (awp_cycle_id, offset_days) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING awp_cycle_id`,
        [cycle.id, offset],
      );
      if (!inserted.rows[0]) continue;
      const client = await pool.connect();
      try {
        const count = await mailCoordinators(
          client,
          cycle,
          "reminder",
          `AWP reminder: ${cycle.title} closes in ${offset} day${offset === 1 ? "" : "s"}`,
          `The annual work plan window closes on ${new Date(cycle.windowClose).toISOString()}. Submit projects in the fixed template before it closes. Late submissions are not added to this AWP.`,
        );
        sent += count;
      } finally {
        client.release();
      }
    }
  }
  return sent;
}
