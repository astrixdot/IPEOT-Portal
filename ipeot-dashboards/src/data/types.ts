export type Category = "scheduled" | "unscheduled" | "short_term";

export type StageKey =
  | "proposal"
  | "ic_review"
  | "hod"
  | "final_auth"
  | "initiated"
  | "execution"
  | "report_approval"
  | "closed";

export type Role = "HOI" | "HOD" | "IC" | "PCC";

export type Department = {
  id: number;
  code: string;
  short: string;
  name: string;
};

export type Person = {
  id: string;
  cpf: string;
  name: string;
  designation: string;
  departmentId: number;
  role: "HOI" | "HOD" | "IC" | "CI" | "PCC" | "COORDINATOR" | "ANALYST" | "LAB_IC";
  level?: "L-1" | "L-2" | "L-3";
  capacity?: number;
};

export type Project = {
  id: string;
  proposalNo: string;
  wbs: string | null;
  accession: string | null;
  title: string;
  departmentId: number;
  workCentre: string;
  category: Category;
  stage: StageKey;
  daysInStage: number;
  pendingLevel: string;
  pendingWith: string;
  ciId: string;
  icId: string;
  fy: string;
  progress: number;
  slipDays: number;
  history: Partial<Record<StageKey, number>>;
  nextMilestone: string | null;
  nextMilestoneDue: string | null;
  startDate: string;
  endDate: string;
};
