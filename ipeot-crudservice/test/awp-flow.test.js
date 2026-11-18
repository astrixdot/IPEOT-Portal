import test from "node:test";
import assert from "node:assert/strict";
import { buildConsolidation, buildDisha, proposalTransition, stageActions } from "../awp-flow.js";

test("an AWP proposal is routed, reviewed, scheduled, and endorsed", () => {
  const state = { stage: "pcc_route", category: "scheduled", intake: "awp" };
  const routed = proposalTransition(state, "route", {});
  assert.equal(routed.status, "department_review");
  assert.equal(routed.next.stage, "dept_review");

  const asked = proposalTransition({ ...state, stage: "dept_review" }, "clarify", {});
  assert.equal(asked.error, "remarks_required");
  const clarified = proposalTransition({ ...state, stage: "dept_review" }, "clarify", { remarks: "Need the well file" });
  assert.equal(clarified.next.assignCreator, true);

  const accepted = proposalTransition({ ...state, stage: "dept_review" }, "accept", { tags: "acid" });
  assert.equal(accepted.status, "incharge_review");

  const missingQuarter = proposalTransition({ stage: "incharge_review", category: "scheduled", intake: "awp" }, "schedule", { decision: "scheduled" });
  assert.equal(missingQuarter.error, "invalid_quarter");
  const scheduled = proposalTransition({ stage: "incharge_review", category: "scheduled", intake: "awp" }, "schedule", { decision: "scheduled", quarter: "Q2", remarks: "Scope kept" });
  assert.equal(scheduled.status, "plan_scheduled");
  assert.equal(scheduled.finalQuarter, "Q2");

  const returned = proposalTransition({ stage: "hod_endorse", category: "scheduled", intake: "awp" }, "return", {});
  assert.equal(returned.error, "remarks_required");
  const endorsed = proposalTransition({ stage: "hod_endorse", category: "scheduled", intake: "awp" }, "endorse", {});
  assert.equal(endorsed.status, "hod_endorsed");
  assert.equal(endorsed.end, true);
});

test("department classification can reject, send short-term, or defer to the next AWP", () => {
  const state = { stage: "dept_review", category: "scheduled", intake: "awp" };
  const rejected = proposalTransition(state, "reject", { remarks: "Incomplete" });
  assert.equal(rejected.next.stage, "pcc_return");
  const closed = proposalTransition({ stage: "pcc_return", category: "scheduled", intake: "awp" }, "accept", {});
  assert.equal(closed.status, "rejected");

  const shortTerm = proposalTransition(state, "short_term", {});
  assert.equal(shortTerm.category, "short_term");
  assert.equal(shortTerm.next.stage, "short_term_hod");

  const deferred = proposalTransition({ stage: "dept_review", category: "short_term", intake: "awp" }, "reroute", { reroute: "next_awp" });
  assert.equal(deferred.status, "draft");
  assert.equal(deferred.clearCycle, true);
});

test("in-year work stops at the HOD and short-term work records an outcome", () => {
  const approved = proposalTransition({ stage: "in_year_hod", category: "unscheduled", intake: "in_year" }, "endorse", {});
  assert.equal(approved.status, "in_year_approved");
  const started = proposalTransition({ stage: "short_term_hod", category: "short_term", intake: "awp" }, "endorse", {});
  assert.equal(started.next.stage, "short_term_close");
  const unfinished = proposalTransition({ stage: "short_term_close", category: "short_term", intake: "awp" }, "complete_work", { outcome: "Done" });
  assert.equal(unfinished.error, "outcome_required");
  const closed = proposalTransition({ stage: "short_term_close", category: "short_term", intake: "awp" }, "complete_work", { outcome: "Done", effort: "12 days" });
  assert.equal(closed.status, "short_term_closed");
});

test("in-charge can keep a study in the AWP without a quarter", () => {
  const held = proposalTransition(
    { stage: "incharge_review", category: "scheduled", intake: "awp" },
    "schedule",
    { decision: "unscheduled", dependency: "Waiting on core samples" },
  );
  assert.equal(held.status, "plan_unscheduled");
  assert.equal(held.category, "unscheduled");
  assert.equal(held.intake, "awp");
  assert.equal(held.dependencyNote, "Waiting on core samples");
});

test("the department sees a different action for a short-term check", () => {
  const labels = stageActions({ stage: "dept_review", category: "short_term", intake: "awp" }).map((item) => item.action);
  assert.deepEqual(labels, ["accept", "clarify", "reject", "reroute"]);
});

test("consolidation text and the DISHA file keep the schedule", () => {
  const text = buildConsolidation({ title: "AWP 2026", year: 2026 }, [{
    departmentName: "Production",
    proposalNumber: "P-2026-0002",
    title: "Acid stimulation",
    scheduleDecision: "scheduled",
    finalQuarter: "Q3",
    priority: 2,
  }]);
  assert.match(text, /P-2026-0002/);
  assert.match(text, /Q3/);
  const disha = buildDisha({ title: "AWP 2026", year: 2026, publishedAt: "2026-02-01" }, [{
    proposalNumber: "P-2026-0002",
    title: "Acid stimulation",
    departmentCode: "D1",
    scheduleDecision: "scheduled",
    finalQuarter: "Q3",
    priority: 2,
    status: "published",
  }]);
  assert.equal(disha.projects[0].quarter, "Q3");
  assert.equal(disha.cycle.publishedAt, "2026-02-01");
});
