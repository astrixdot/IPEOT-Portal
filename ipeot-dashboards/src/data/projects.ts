import type { Category, Project, StageKey } from "./types";
import { CURRENT_FY, TODAY, coordinators, hodOf, icOf, cisOf, person } from "./org";

export const STAGES: { key: StageKey; label: string; short: string; target: number | null }[] = [
  { key: "proposal", label: "Proposal", short: "Proposal", target: 7 },
  { key: "ic_review", label: "I/C Review", short: "I/C", target: 10 },
  { key: "hod", label: "HOD Endorsement", short: "HOD", target: 7 },
  { key: "final_auth", label: "HOI / TAC / Director", short: "Final auth.", target: 21 },
  { key: "initiated", label: "Initiated (SAP WBS)", short: "Initiated", target: 5 },
  { key: "execution", label: "Execution", short: "Execution", target: null },
  { key: "report_approval", label: "Report Approval", short: "Report", target: 15 },
  { key: "closed", label: "Closed", short: "Closed", target: null },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  scheduled: "Scheduled",
  unscheduled: "Unscheduled",
  short_term: "Short-term",
};

export function stageMeta(key: StageKey) {
  return STAGES.find((item) => item.key === key)!;
}

export function stageTarget(project: Pick<Project, "stage" | "category">, stage: StageKey = project.stage) {
  if (stage === "final_auth" && project.category === "short_term") return 5;
  return stageMeta(stage).target;
}

export function overdueDays(project: Project) {
  if (project.stage === "execution") return project.slipDays;
  const target = stageTarget(project);
  if (target == null) return 0;
  return Math.max(0, project.daysInStage - target);
}

export function isOverdue(project: Project) {
  return overdueDays(project) > 0;
}

export function isPendingApproval(project: Project) {
  return ["ic_review", "hod", "final_auth", "report_approval"].includes(project.stage);
}

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Row = [title: string, dept: number, workCentre: string, category: "s" | "u" | "t", stage: string, ci?: string];

const rows: Row[] = [
  ["Acid stimulation design for carbonate reservoirs, Mumbai High South", 1, "Mumbai High Asset", "s", "E"],
  ["Hydraulic fracturing fluid optimisation for tight sands", 1, "Cambay Asset", "s", "F"],
  ["Sand control evaluation for unconsolidated sands", 1, "Rajahmundry Asset", "s", "C"],
  ["Work-over fluid compatibility for HPHT wells, KG onshore", 1, "Rajahmundry Asset", "u", "I"],
  ["Organic deposition mitigation in flowlines", 1, "Ankleshwar Asset", "t", "R"],
  ["Well integrity assessment of ageing producers, Neelam field", 1, "Neelam & Heera Asset", "s", "E"],
  ["Paraffin inhibitor screening for heavy oil wells", 1, "Mehsana Asset", "t", "P"],
  ["Matrix acidising performance review, Bassein gas wells", 1, "Bassein & Satellite Asset", "s", "C"],

  ["Flare gas recovery feasibility study", 2, "Uran Plant", "s", "E"],
  ["Adequacy check of process facilities", 2, "Hazira Plant", "s", "H"],
  ["Heat exchanger adequacy review, Heera process platform", 2, "Neelam & Heera Asset", "u", "R"],
  ["Crude characterisation and PPD dose optimisation", 2, "Ankleshwar Asset", "t", "C"],
  ["Gas dehydration unit debottlenecking", 2, "Bassein & Satellite Asset", "s", "F"],
  ["Flow assurance study for Mumbai High trunk lines", 2, "Mumbai High Asset", "s", "W"],
  ["HAZOP of revamped effluent treatment plant", 2, "Ahmedabad Asset", "u", "I"],

  ["Corrosion rate monitoring of MUT lines, Mumbai High", 3, "Mumbai High Asset", "s", "E", "ci1"],
  ["Scale mitigation strategy for injection wells", 3, "Neelam & Heera Asset", "s", "H"],
  ["Cathodic protection review of SHP structure", 3, "Mumbai High Asset", "u", "C"],
  ["Composite repair qualification for offshore risers", 3, "Bassein & Satellite Asset", "s", "P"],
  ["Root cause analysis of production tubing failure", 3, "Assam Asset", "t", "E", "ci1"],
  ["Paint scheme evaluation for onshore installations", 3, "Rajahmundry Asset", "t", "I"],
  ["Sour service material qualification per NACE MR0175", 3, "Cauvery Asset", "s", "E", "ci1"],
  ["Corrosion inhibitor efficiency trials, gathering network", 3, "Ankleshwar Asset", "u", "R", "ci1"],

  ["ESP run-life improvement programme", 4, "Mehsana Asset", "s", "E"],
  ["Gas lift network optimisation, Mumbai High North", 4, "Mumbai High Asset", "s", "F"],
  ["SRP design review for marginal wells", 4, "Ahmedabad Asset", "t", "C"],
  ["Jet pump applicability study", 4, "Cambay Asset", "u", "H"],
  ["PCP selection for heavy oil wells", 4, "Mehsana Asset", "s", "R"],
  ["Plunger lift trials for liquid-loaded gas wells", 4, "Tripura Asset", "t", "E"],
  ["Artificial lift selection for satellite fields", 4, "Bassein & Satellite Asset", "s", "P"],

  ["Field development plan review, deep water Cluster-II", 5, "Rajahmundry Asset", "s", "E"],
  ["Subsea tie-back concept screening for marginal fields", 5, "Mumbai High Asset", "s", "I"],
  ["Merging of installations study, Mumbai High South", 5, "Mumbai High Asset", "u", "C"],
  ["Integrated asset modelling, Bassein field", 5, "Bassein & Satellite Asset", "s", "W"],
  ["Hydrate management strategy for deep water flowlines", 5, "Rajahmundry Asset", "s", "F"],
  ["Reservoir–surface coupled study, Daman development", 5, "Bassein & Satellite Asset", "u", "E"],
  ["Scheme conceptualisation for Cauvery offshore development", 5, "Cauvery Asset", "s", "H"],

  ["Structural integrity assessment of B-55 platform", 6, "Mumbai High Asset", "s", "E"],
  ["Life extension study of BB platform", 6, "Mumbai High Asset", "s", "R"],
  ["SIA for NLM-3 modular rig deployment", 6, "Neelam & Heera Asset", "t", "C"],
  ["Geotechnical investigation for new well platforms", 6, "Mumbai High Asset", "s", "E"],
  ["Scour assessment around HQ platform", 6, "Mumbai High Asset", "u", "I"],
  ["Offshore wind resource assessment, Gulf of Khambhat", 6, "Cambay Asset", "s", "W"],
  ["Rooftop solar integration feasibility", 6, "Hazira Plant", "u", "P"],
  ["SIA of WI-8 platform for three clamp-on wells", 6, "Mumbai High Asset", "t", "C"],

  ["Digital twin pilot for process gas compressors", 7, "Uran Plant", "s", "E"],
  ["Machine-learning ESP failure prediction", 7, "Mehsana Asset", "s", "H"],
  ["Technology scouting for downhole fibre-optic sensing", 7, "Ahmedabad Asset", "u", "F"],
  ["CO₂ capture and EOR utilisation screening", 7, "Ankleshwar Asset", "s", "E"],
  ["Green hydrogen pilot scoping study", 7, "Hazira Plant", "s", "R"],
  ["Drone-based methane leak detection trials", 7, "Assam Asset", "t", "E"],
  ["Commercialisation of in-house corrosion inhibitor formulation", 7, "Ankleshwar Asset", "u", "C"],
];

const STAGE_CODE: Record<string, StageKey> = {
  P: "proposal",
  I: "ic_review",
  H: "hod",
  F: "final_auth",
  W: "initiated",
  E: "execution",
  R: "report_approval",
  C: "closed",
};

const CATEGORY_CODE: Record<string, Category> = { s: "scheduled", u: "unscheduled", t: "short_term" };

/* Overdue days at the current level, by row number (1-based). Execution rows carry milestone slip. */
const stuck: Record<number, number> = { 2: 34, 10: 12, 15: 16, 23: 22, 25: 29, 27: 11, 39: 19, 42: 15 };
const slips: Record<number, number> = { 6: 18, 16: 6, 24: 9, 38: 25 };
const finalLevel: Record<number, string> = { 2: "TAC", 13: "HOI", 25: "Director (Production)", 35: "TAC", 48: "HOI" };
const reportLevel: Record<number, string> = { 5: "HOD", 11: "I/C", 23: "HOD", 28: "HOI", 39: "HOI", 50: "I/C" };
const previousFy = new Set([3, 18, 33]);
const carriedOver = new Set([1, 9, 31, 38]);

const milestones = [
  "Laboratory testing complete",
  "Field sampling at site",
  "Interim review with work centre",
  "Simulation runs complete",
  "Draft report to I/C",
  "Data reconciliation with work centre",
];

const stageMultiplier: Partial<Record<StageKey, number>> = {
  proposal: 0.8,
  ic_review: 0.82,
  hod: 1.08,
  final_auth: 1.26,
  initiated: 0.6,
  report_approval: 1.12,
};

function addDays(days: number) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function build(): Project[] {
  const random = seeded(20261119);
  const serial = new Map<number, number>();
  return rows.map(([title, dept, workCentre, cat, code, ciOverride], index) => {
    const n = index + 1;
    const stage = STAGE_CODE[code];
    const category = CATEGORY_CODE[cat];
    const stageIndex = STAGES.findIndex((item) => item.key === stage);
    const cis = cisOf(dept);
    const ci = ciOverride ? person(ciOverride)! : cis[n % cis.length];
    const ic = icOf(dept);
    const hod = hodOf(dept);
    const base = { stage, category };
    const target = stageTarget(base) ?? 30;
    let daysInStage = stuck[n] != null ? target + stuck[n] : Math.max(1, Math.round(target * (0.25 + random() * 0.6)));
    if (stage === "execution") daysInStage = 40 + Math.round(random() * 160);
    if (stage === "closed") daysInStage = 10 + Math.round(random() * 120);
    const slipDays = slips[n] ?? 0;

    const history: Partial<Record<StageKey, number>> = {};
    STAGES.slice(0, stageIndex).forEach((item) => {
      const t = stageTarget(base, item.key);
      const m = stageMultiplier[item.key];
      if (t && m) history[item.key] = Math.max(1, Math.round(t * m * (0.7 + random() * 0.6)));
    });

    let pendingLevel = "";
    let pendingWith = "";
    if (stage === "proposal") {
      pendingLevel = n % 2 ? "Work centre" : "PCC";
      pendingWith = n % 2 ? `${coordinators[workCentre]} (coordinator)` : "Kavita Deshmukh (PCC)";
    } else if (stage === "ic_review") {
      pendingLevel = "I/C";
      pendingWith = ic.name;
    } else if (stage === "hod") {
      pendingLevel = "HOD";
      pendingWith = hod.name;
    } else if (stage === "final_auth") {
      pendingLevel = category === "short_term" ? "HOD" : finalLevel[n] ?? "HOI";
      pendingWith =
        pendingLevel === "HOI" ? "Dr. Rajiv Malhotra (HOI)" : pendingLevel === "TAC" ? "Technical Advisory Committee" : pendingLevel === "HOD" ? hod.name : "Director (Production), ONGC";
    } else if (stage === "initiated") {
      pendingLevel = "SAP";
      pendingWith = "SAP PS – WBS release";
    } else if (stage === "execution") {
      pendingLevel = "CI";
      pendingWith = ci.name;
    } else if (stage === "report_approval") {
      pendingLevel = reportLevel[n] ?? "I/C";
      pendingWith = pendingLevel === "I/C" ? ic.name : pendingLevel === "HOD" ? hod.name : "Dr. Rajiv Malhotra (HOI)";
    } else {
      pendingLevel = "—";
      pendingWith = "Closed";
    }

    const fy = previousFy.has(n) || carriedOver.has(n) ? "2025-26" : CURRENT_FY;
    const fyCode = fy === CURRENT_FY ? "2627" : "2526";
    const count = (serial.get(dept) ?? 100) + 7 + Math.round(random() * 9);
    serial.set(dept, count);
    const wbs = stageIndex >= 4 ? `IPE.${fyCode}.${String(dept).padStart(2, "0")}.${String(count).padStart(4, "0")}` : null;
    const accession = stage === "closed" ? `IPEOT/ACC/${fy === CURRENT_FY ? 2026 : 2025}/${String(40 + n * 3).padStart(4, "0")}` : null;

    const progress =
      stage === "execution" ? 18 + Math.round(random() * 66) : stage === "initiated" ? 4 : stage === "report_approval" ? 96 : stage === "closed" ? 100 : 0;
    const startOffset = stageIndex >= 4 ? -(daysInStage + 20) : 14 + Math.round(random() * 30);
    const span = category === "short_term" ? 15 + Math.round(random() * 20) : 150 + Math.round(random() * 180);
    const hasMilestone = stage === "execution" || stage === "initiated";
    const milestoneDue = slipDays > 0 ? -slipDays : 6 + Math.round(random() * 40);

    return {
      id: `p${n}`,
      proposalNo: `PR/${fy === CURRENT_FY ? 2026 : 2025}/${String(180 + n * 2).padStart(4, "0")}`,
      wbs,
      accession,
      title,
      departmentId: dept,
      workCentre,
      category,
      stage,
      daysInStage,
      pendingLevel,
      pendingWith,
      ciId: ci.id,
      icId: ic.id,
      fy,
      progress,
      slipDays,
      history,
      nextMilestone: hasMilestone ? milestones[Math.floor(random() * milestones.length)] : null,
      nextMilestoneDue: hasMilestone ? addDays(milestoneDue) : null,
      startDate: addDays(startOffset),
      endDate: addDays(startOffset + span),
    };
  });
}

export const projects: Project[] = build();
