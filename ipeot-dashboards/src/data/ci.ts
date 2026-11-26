export const CI_ID = "ci1";

export type Milestone = {
  name: string;
  start: string;
  end: string;
  status: "done" | "active" | "upcoming" | "late";
  progress: number;
};

export type IsoDoc = {
  type: "PDS" | "PAS" | "PCR";
  name: string;
  status: "Draft" | "In Review" | "Approved";
  version: string;
  editedAt: string;
  editedBy: string;
};

export type LimsResult = {
  sampleId: string;
  test: string;
  standard: string;
  value: string;
  status: "Released" | "Awaiting approval" | "Testing";
};

export type Citation = {
  accession: string;
  title: string;
  year: number;
  department: string;
  match: number;
};

export type Workspace = {
  projectId: string;
  milestones: Milestone[];
  iso: IsoDoc[];
  lims: { received: number; inProgress: number; awaiting: number; results: LimsResult[] };
  report: { step: number; comments: number[] };
  draft: { section: string; text: string; cites: number[] };
  similar: Citation[];
};

export const workspaces: Workspace[] = [
  {
    projectId: "p16",
    milestones: [
      { name: "PDS approval and kick-off", start: "2026-06-02", end: "2026-06-20", status: "done", progress: 100 },
      { name: "Coupon and ER probe installation", start: "2026-06-21", end: "2026-07-31", status: "done", progress: 100 },
      { name: "Quarterly coupon retrieval – Q2", start: "2026-08-01", end: "2026-09-15", status: "done", progress: 100 },
      { name: "Weight-loss and pit-depth analysis", start: "2026-09-16", end: "2026-11-13", status: "late", progress: 72 },
      { name: "Inhibitor dosage recommendation", start: "2026-11-14", end: "2027-01-10", status: "upcoming", progress: 0 },
      { name: "Final report and PCR", start: "2027-01-11", end: "2027-02-28", status: "upcoming", progress: 0 },
    ],
    iso: [
      { type: "PDS", name: "Project Definition Sheet", status: "Approved", version: "v1.2", editedAt: "2026-06-18", editedBy: "Vikram Joshi" },
      { type: "PAS", name: "Project Activity Schedule", status: "In Review", version: "v2.1", editedAt: "2026-11-14", editedBy: "Dr. Meenakshi Raghavan" },
      { type: "PCR", name: "Project Completion Report", status: "Draft", version: "v0.3", editedAt: "2026-11-17", editedBy: "Sandeep Rao" },
    ],
    lims: {
      received: 24,
      inProgress: 6,
      awaiting: 3,
      results: [
        { sampleId: "IPEOT-S-2026-0398", test: "Corrosion rate, coupon C-07 (MUT-2)", standard: "ASTM G1 / G31", value: "8.6 mpy", status: "Released" },
        { sampleId: "IPEOT-S-2026-0399", test: "Corrosion rate, coupon C-11 (MUT-4)", standard: "ASTM G1 / G31", value: "14.2 mpy", status: "Released" },
        { sampleId: "IPEOT-S-2026-0402", test: "Maximum pit depth, C-11", standard: "ASTM G46", value: "0.41 mm", status: "Awaiting approval" },
        { sampleId: "IPEOT-S-2026-0405", test: "Water analysis – chloride", standard: "ASTM D512", value: "38,400 mg/L", status: "Released" },
        { sampleId: "IPEOT-S-2026-0406", test: "Dissolved CO₂ / H₂S", standard: "NACE TM0194", value: "142 / 6 ppm", status: "Awaiting approval" },
        { sampleId: "IPEOT-S-2026-0411", test: "SRB count (MPN)", standard: "NACE TM0194", value: "10³ cells/mL", status: "Testing" },
      ],
    },
    report: { step: 0, comments: [4, 0, 0, 0, 0] },
    draft: {
      section: "Section 3 – Results and Discussion",
      text:
        "3.1 Weight-loss coupons retrieved from MUT-2 and MUT-4 after 92 days of exposure show general corrosion rates of 8.6 mpy and 14.2 mpy respectively (ASTM G1/G31). The MUT-4 rate exceeds the 10 mpy operating limit set in the Asset corrosion management plan.\n\n3.2 Maximum pit depth on coupon C-11 is 0.41 mm, equivalent to an annualised pitting rate of 1.6 mm/y. Pitting is concentrated at the 6 o'clock position, consistent with water drop-out in low-velocity sections.\n\n3.3 Produced water chloride of 38,400 mg/L and dissolved CO₂ of 142 ppm indicate a sweet-corrosion regime with a minor sour contribution (H₂S 6 ppm). This pattern matches the behaviour recorded on comparable Mumbai High trunk lines [1] and the inhibitor response observed in Ankleshwar gathering lines [2].\n\n3.4 Pending the SRB count, microbiologically influenced corrosion is not yet ruled out. A batch biocide trial is recommended before the inhibitor dosage is revised.",
      cites: [0, 1],
    },
    similar: [
      { accession: "IPEOT/ACC/2023/0187", title: "Internal corrosion assessment of Mumbai High trunk lines", year: 2023, department: "CCSM", match: 91 },
      { accession: "IPEOT/ACC/2024/0062", title: "Inhibitor performance in Ankleshwar gathering network", year: 2024, department: "CCSM", match: 84 },
      { accession: "IPEOT/ACC/2021/0215", title: "MIC risk screening for water injection lines, Heera", year: 2021, department: "CCSM", match: 76 },
    ],
  },
  {
    projectId: "p22",
    milestones: [
      { name: "PDS approval", start: "2026-05-04", end: "2026-05-22", status: "done", progress: 100 },
      { name: "Material procurement from Cauvery Asset", start: "2026-05-23", end: "2026-07-10", status: "done", progress: 100 },
      { name: "SSC testing (NACE TM0177 Method A)", start: "2026-07-11", end: "2026-10-30", status: "done", progress: 100 },
      { name: "HIC testing (NACE TM0284)", start: "2026-10-01", end: "2026-12-15", status: "active", progress: 55 },
      { name: "Metallography and hardness survey", start: "2026-12-01", end: "2027-01-20", status: "upcoming", progress: 0 },
      { name: "Qualification report", start: "2027-01-21", end: "2027-03-15", status: "upcoming", progress: 0 },
    ],
    iso: [
      { type: "PDS", name: "Project Definition Sheet", status: "Approved", version: "v1.0", editedAt: "2026-05-20", editedBy: "Vikram Joshi" },
      { type: "PAS", name: "Project Activity Schedule", status: "Approved", version: "v1.3", editedAt: "2026-10-02", editedBy: "Dr. Prakash Iyer" },
      { type: "PCR", name: "Project Completion Report", status: "Draft", version: "v0.1", editedAt: "2026-11-05", editedBy: "Dr. Meenakshi Raghavan" },
    ],
    lims: {
      received: 18,
      inProgress: 5,
      awaiting: 2,
      results: [
        { sampleId: "IPEOT-S-2026-0371", test: "SSC, L80 tubing, 90% SMYS, 720 h", standard: "NACE TM0177 A", value: "No failure", status: "Released" },
        { sampleId: "IPEOT-S-2026-0372", test: "SSC, 13Cr tubing, 90% SMYS, 720 h", standard: "NACE TM0177 A", value: "Failure at 412 h", status: "Released" },
        { sampleId: "IPEOT-S-2026-0384", test: "HIC, X65 linepipe – CLR / CTR", standard: "NACE TM0284", value: "4.8% / 0.9%", status: "Awaiting approval" },
        { sampleId: "IPEOT-S-2026-0385", test: "Vickers hardness, weld HAZ", standard: "ASTM E384", value: "238 HV10", status: "Released" },
        { sampleId: "IPEOT-S-2026-0391", test: "HIC, X52 linepipe", standard: "NACE TM0284", value: "—", status: "Testing" },
      ],
    },
    report: { step: 0, comments: [1, 0, 0, 0, 0] },
    draft: {
      section: "Section 3 – Test Results",
      text:
        "3.1 L80 tubing specimens loaded to 90% of SMYS completed the 720-hour NACE TM0177 Method A exposure without cracking and are acceptable for the Cauvery sour service envelope.\n\n3.2 One 13Cr specimen failed at 412 hours. Fractography indicates sulphide stress cracking initiating at a surface pit. 13Cr is therefore not recommended where H₂S partial pressure exceeds 0.05 psia, in line with the earlier qualification for Western Offshore wells [1].\n\n3.3 X65 linepipe shows a crack length ratio of 4.8% and crack thickness ratio of 0.9% (NACE TM0284), within the 15% / 5% acceptance limits. Weld HAZ hardness of 238 HV10 is below the 250 HV limit of NACE MR0175 / ISO 15156-2 [2].",
      cites: [0, 1],
    },
    similar: [
      { accession: "IPEOT/ACC/2022/0144", title: "Sour service qualification of OCTG for Western Offshore", year: 2022, department: "CCSM", match: 88 },
      { accession: "IPEOT/ACC/2020/0098", title: "HIC susceptibility of linepipe steels for Cauvery", year: 2020, department: "CCSM", match: 81 },
      { accession: "IPEOT/ACC/2023/0031", title: "Weld hardness survey of sour gas pipelines", year: 2023, department: "SFPE", match: 69 },
    ],
  },
  {
    projectId: "p20",
    milestones: [
      { name: "Failed tubing received from Assam Asset", start: "2026-10-27", end: "2026-10-31", status: "done", progress: 100 },
      { name: "Visual and NDT examination", start: "2026-11-01", end: "2026-11-07", status: "done", progress: 100 },
      { name: "Chemical analysis and metallography", start: "2026-11-08", end: "2026-11-21", status: "active", progress: 80 },
      { name: "Root cause and recommendations", start: "2026-11-22", end: "2026-11-28", status: "upcoming", progress: 0 },
    ],
    iso: [
      { type: "PDS", name: "Project Definition Sheet", status: "Approved", version: "v1.0", editedAt: "2026-10-28", editedBy: "Dr. Prakash Iyer" },
      { type: "PAS", name: "Project Activity Schedule", status: "Approved", version: "v1.0", editedAt: "2026-10-29", editedBy: "Dr. Prakash Iyer" },
      { type: "PCR", name: "Project Completion Report", status: "Draft", version: "v0.2", editedAt: "2026-11-18", editedBy: "Pooja Kulkarni" },
    ],
    lims: {
      received: 7,
      inProgress: 2,
      awaiting: 1,
      results: [
        { sampleId: "IPEOT-S-2026-0408", test: "Chemical composition, N80 tubing", standard: "ASTM E415", value: "Conforms to API 5CT", status: "Released" },
        { sampleId: "IPEOT-S-2026-0409", test: "Scale deposit – XRD phase analysis", standard: "ASTM D934", value: "FeCO₃ 71%, CaCO₃ 18%", status: "Awaiting approval" },
        { sampleId: "IPEOT-S-2026-0410", test: "Wall-thickness loss at failure", standard: "ASTM E797", value: "68% loss", status: "Testing" },
      ],
    },
    report: { step: 0, comments: [0, 0, 0, 0, 0] },
    draft: {
      section: "Section 3 – Findings",
      text:
        "3.1 Chemical composition of the failed N80 joint conforms to API 5CT, so material non-conformance is excluded as the primary cause.\n\n3.2 XRD of the internal deposit identifies siderite (FeCO₃, 71%) with calcite (18%), confirming CO₂ corrosion under deposit as the dominant mechanism [1].\n\n3.3 Localised wall loss reaches 68% at the failure location, 380 m above the pump intake, where flow regime transition favours water wetting.",
      cites: [0],
    },
    similar: [
      { accession: "IPEOT/ACC/2024/0119", title: "Failure analysis of tubing string, Lakwa field", year: 2024, department: "CCSM", match: 86 },
      { accession: "IPEOT/ACC/2019/0073", title: "Under-deposit CO₂ corrosion in Assam producers", year: 2019, department: "PE", match: 72 },
    ],
  },
  {
    projectId: "p23",
    milestones: [
      { name: "Inhibitor shortlisting", start: "2026-04-06", end: "2026-04-30", status: "done", progress: 100 },
      { name: "Wheel and bubble tests", start: "2026-05-01", end: "2026-06-30", status: "done", progress: 100 },
      { name: "Field trial on GGS-II network", start: "2026-07-01", end: "2026-09-30", status: "done", progress: 100 },
      { name: "Report preparation", start: "2026-10-01", end: "2026-10-31", status: "done", progress: 100 },
      { name: "Report approval", start: "2026-11-01", end: "2026-11-30", status: "active", progress: 40 },
    ],
    iso: [
      { type: "PDS", name: "Project Definition Sheet", status: "Approved", version: "v1.1", editedAt: "2026-04-03", editedBy: "Vikram Joshi" },
      { type: "PAS", name: "Project Activity Schedule", status: "Approved", version: "v2.0", editedAt: "2026-07-02", editedBy: "Dr. Prakash Iyer" },
      { type: "PCR", name: "Project Completion Report", status: "In Review", version: "v1.0", editedAt: "2026-11-02", editedBy: "Dr. Meenakshi Raghavan" },
    ],
    lims: {
      received: 32,
      inProgress: 0,
      awaiting: 0,
      results: [
        { sampleId: "IPEOT-S-2026-0244", test: "Inhibitor efficiency, wheel test, 25 ppm", standard: "NACE 1D182", value: "91.4%", status: "Released" },
        { sampleId: "IPEOT-S-2026-0245", test: "Inhibitor efficiency, bubble test, 25 ppm", standard: "ASTM G170", value: "88.7%", status: "Released" },
        { sampleId: "IPEOT-S-2026-0301", test: "Field ER probe rate, post-dosing", standard: "ASTM G96", value: "2.1 mpy", status: "Released" },
      ],
    },
    report: { step: 2, comments: [6, 3, 2, 0, 0] },
    draft: {
      section: "Section 3 – Field Trial Results",
      text:
        "3.1 Candidate inhibitor CI-B at 25 ppm achieved 91.4% efficiency in the NACE 1D182 wheel test and 88.7% in the ASTM G170 bubble test, the highest of the four candidates.\n\n3.2 During the 90-day field trial on the GGS-II network, ER probe corrosion rate fell from 11.8 mpy to 2.1 mpy, consistent with the response recorded in the 2024 Ankleshwar trial [1].",
      cites: [0],
    },
    similar: [
      { accession: "IPEOT/ACC/2024/0062", title: "Inhibitor performance in Ankleshwar gathering network", year: 2024, department: "CCSM", match: 93 },
      { accession: "IPEOT/ACC/2022/0201", title: "Green corrosion inhibitor screening", year: 2022, department: "NTBD", match: 71 },
    ],
  },
];

export type InboxItem = {
  id: string;
  kind: "lab" | "data" | "return" | "reminder";
  title: string;
  detail: string;
  projectId: string;
  from: string;
  age: string;
  action: string;
  urgent?: boolean;
};

export const inbox: InboxItem[] = [
  { id: "a1", kind: "return", title: "PAS v2.1 returned with comments", detail: "Revise milestone 4 end date and add slip justification.", projectId: "p16", from: "Vikram Joshi · I/C", age: "2 h", action: "Revise PAS", urgent: true },
  { id: "a2", kind: "lab", title: "Approve pit-depth result before release", detail: "IPEOT-S-2026-0402 · ASTM G46 · analyst Rahul Bhosale", projectId: "p16", from: "Corrosion Lab", age: "5 h", action: "Review result" },
  { id: "a3", kind: "data", title: "Produced water analysis pending from site", detail: "Requested from Mumbai High Asset on 04-Nov. Second reminder due.", projectId: "p16", from: "R. Venkatesh · coordinator", age: "15 d", action: "Send reminder", urgent: true },
  { id: "a4", kind: "lab", title: "HIC test slot confirmed for X52 coupons", detail: "Autoclave AC-02 booked 24–27 Nov.", projectId: "p22", from: "Corrosion Lab", age: "1 d", action: "Acknowledge" },
  { id: "a5", kind: "reminder", title: "Root cause report due in 5 days", detail: "Short-term job. HOD approval closes the project.", projectId: "p20", from: "Portal", age: "today", action: "Open report" },
  { id: "a6", kind: "return", title: "HOD comments on Section 4 of the report", detail: "2 comments on field-trial cost-benefit table.", projectId: "p23", from: "Dr. Prakash Iyer · HOD", age: "1 d", action: "Respond" },
];

export const team = [
  { id: "ci1", name: "Dr. Meenakshi Raghavan", role: "Chief Investigator", cpf: "112487", active: 5, capacity: 5 },
  { id: "ci2", name: "Sandeep Rao", role: "Co-investigator", cpf: "114023", active: 3, capacity: 4 },
  { id: "ci3", name: "Pooja Kulkarni", role: "Co-investigator", cpf: "115690", active: 3, capacity: 3 },
  { id: "an1", name: "Rahul Bhosale", role: "Lab analyst", cpf: "120418", active: 7, capacity: 8 },
  { id: "an2", name: "Sneha Patil", role: "Lab analyst", cpf: "121093", active: 4, capacity: 8 },
];
