export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const labels: Record<string, string> = {
  invalid_credentials: "CPF or password is not valid.",
  user_not_provisioned: "This CPF is not provisioned in IPEOT. Ask an administrator.",
  ldap_unavailable: "Directory sign-in is unavailable. Try again or contact IT.",
  unauthenticated: "Sign in again to continue.",
  forbidden: "You do not have access to this action.",
  already_exists: "That code is already in use.",
  invalid_reference: "Choose a valid department or work centre.",
  invalid_code: "Use a short code of letters, numbers, hyphens, or underscores.",
  invalid_name: "Enter a name up to 200 characters.",
  last_admin: "Keep at least one active administrator.",
  department_required: "Choose a department for this assignment.",
  work_centre_required: "Choose a work centre for this assignment.",
  scope_mismatch: "That scope does not match the selected unit.",
  not_found: "That record is no longer available.",
  title_required: "Enter a proposal title.",
  invalid_category: "Choose a category allowed for this study.",
  invalid_platform: "Platform name can contain only letters and numbers, with no spaces.",
  modification_required: "Select at least one modification.",
  invalid_modification: "One of the selected modifications is not part of this study.",
  invalid_count: "Enter a count from 1 to 12.",
  invalid_study: "Choose a study from the catalogue.",
  already_submitted: "This proposal has already been submitted.",
  invalid_action: "That action is not available at this step.",
  remarks_required: "Enter a remark when you send a proposal back or reject it.",
  task_closed: "This review has already been completed.",
  invalid_year: "Enter a year from 2020 to 2100.",
  invalid_window: "The closing date must be after the opening date.",
  awp_exists: "An AWP cycle with that year and title already exists.",
  awp_window_closed: "Scheduled studies can be filed only while an AWP window is open.",
  invalid_status: "Choose draft, open, or closed.",
  planning_required: "A scheduled study needs a priority from 1 to 5 and a preferred quarter.",
  invalid_priority: "Choose a priority from 1 to 5.",
  invalid_quarter: "Choose a quarter from Q1 to Q4.",
  invalid_attachment: "Attach up to five files, each under 2 MB.",
  invalid_decision: "Choose scheduled or unscheduled, or a TAC outcome for every study.",
  invalid_reroute: "Choose whether to send this on as an in-year study or hold it for the next AWP.",
  outcome_required: "Record the outcome and the effort before closing short-term work.",
  routing_missing: "Choose at least one department to route this study to.",
  nothing_to_consolidate: "Consolidate only after a department HOD has endorsed at least one study.",
  package_in_progress: "This AWP is already with HOI, TAC, or the Director.",
  not_consolidated: "The consolidated AWP has not been generated yet.",
  not_published: "The AWP has not been published yet.",
  tac_items_required: "Record a TAC outcome for every study still on the agenda.",
  invalid_kind: "Choose asset, plant, service, or institute.",
};

export function errorText(err: unknown) {
  if (err instanceof ApiError) return labels[err.code] || "The request could not be completed.";
  return "The request could not be completed.";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, body.error || "request_failed");
  return body as T;
}
