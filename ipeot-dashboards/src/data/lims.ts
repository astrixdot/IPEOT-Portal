import { TODAY } from "./org";
import { projects } from "./projects";

export type SampleStatus = "registered" | "assigned" | "testing" | "review" | "released";

export const SAMPLE_STAGES: { key: SampleStatus; label: string }[] = [
  { key: "registered", label: "Registered" },
  { key: "assigned", label: "Assigned" },
  { key: "testing", label: "Testing" },
  { key: "review", label: "Result Review" },
  { key: "released", label: "Released" },
];

export type Analyst = { id: string; name: string; cpf: string; section: string };

export const analysts: Analyst[] = [
  { id: "an1", name: "Rahul Bhosale", cpf: "120418", section: "Corrosion" },
  { id: "an2", name: "Sneha Patil", cpf: "121093", section: "Corrosion" },
  { id: "an3", name: "Imran Qureshi", cpf: "119782", section: "Oil & Water" },
  { id: "an4", name: "Lakshmi Narayanan", cpf: "122356", section: "Oil & Water" },
  { id: "an5", name: "Amol Gaikwad", cpf: "120967", section: "Materials" },
  { id: "an6", name: "Priya Menon", cpf: "123104", section: "Instrumental" },
];

export type Instrument = {
  id: string;
  name: string;
  model: string;
  section: string;
  calibrationDue: string;
  status: "Operational" | "Under maintenance" | "Calibration due";
  utilisation: number;
};

export const instruments: Instrument[] = [
  { id: "PS-01", name: "Potentiostat", model: "Gamry Interface 1010E", section: "Corrosion", calibrationDue: "2026-11-24", status: "Calibration due", utilisation: 82 },
  { id: "AC-02", name: "HPHT Autoclave", model: "Parr 4570, 5 L", section: "Corrosion", calibrationDue: "2027-02-10", status: "Operational", utilisation: 91 },
  { id: "ICP-01", name: "ICP-OES", model: "Agilent 5110", section: "Instrumental", calibrationDue: "2026-12-02", status: "Operational", utilisation: 68 },
  { id: "IC-01", name: "Ion Chromatograph", model: "Metrohm 930 Compact", section: "Oil & Water", calibrationDue: "2026-11-21", status: "Calibration due", utilisation: 74 },
  { id: "RH-01", name: "Rheometer", model: "Anton Paar MCR 302", section: "Oil & Water", calibrationDue: "2027-03-18", status: "Operational", utilisation: 55 },
  { id: "UTM-01", name: "Universal Testing Machine", model: "Instron 5985, 250 kN", section: "Materials", calibrationDue: "2027-01-08", status: "Under maintenance", utilisation: 0 },
  { id: "SEM-01", name: "SEM-EDS", model: "Zeiss EVO 18", section: "Materials", calibrationDue: "2027-04-30", status: "Operational", utilisation: 63 },
  { id: "XRD-01", name: "X-ray Diffractometer", model: "Bruker D8 Advance", section: "Instrumental", calibrationDue: "2026-12-14", status: "Operational", utilisation: 47 },
  { id: "KF-01", name: "Karl Fischer Titrator", model: "Metrohm 917 Coulometer", section: "Oil & Water", calibrationDue: "2026-11-27", status: "Calibration due", utilisation: 38 },
  { id: "DMA-01", name: "Density Meter", model: "Anton Paar DMA 4500 M", section: "Oil & Water", calibrationDue: "2027-05-22", status: "Operational", utilisation: 59 },
];

export type Consumable = { name: string; unit: string; stock: number; reorder: number; max: number; supplier: string };

export const consumables: Consumable[] = [
  { name: "Karl Fischer reagent (Hydranal Coulomat AG)", unit: "bottles", stock: 3, reorder: 6, max: 20, supplier: "Honeywell" },
  { name: "ICP multi-element standard, 1000 ppm", unit: "vials", stock: 2, reorder: 4, max: 12, supplier: "Merck" },
  { name: "H₂S calibration gas, 1% in N₂", unit: "cylinders", stock: 1, reorder: 2, max: 6, supplier: "Linde" },
  { name: "SiC polishing paper, 600 grit", unit: "packs", stock: 14, reorder: 10, max: 40, supplier: "Buehler" },
  { name: "Nitrogen, 99.999%", unit: "cylinders", stock: 9, reorder: 6, max: 24, supplier: "INOX Air" },
  { name: "Hydrochloric acid 37% AR", unit: "L", stock: 22, reorder: 10, max: 40, supplier: "Fisher" },
  { name: "Viscosity standard N100", unit: "bottles", stock: 5, reorder: 3, max: 10, supplier: "Cannon" },
  { name: "Ion chromatography eluent concentrate", unit: "packs", stock: 4, reorder: 4, max: 16, supplier: "Metrohm" },
];

export type Sample = {
  id: string;
  projectId: string;
  wbs: string;
  material: string;
  test: string;
  standard: string;
  analystId: string;
  instrumentId: string;
  received: string;
  due: string;
  status: SampleStatus;
  result?: string;
  priority: "Routine" | "Urgent";
};

export const tests: [material: string, test: string, standard: string, instrument: string, analyst: string, result: string][] = [
  ["Corrosion coupon", "Weight-loss corrosion rate", "ASTM G1 / G31", "PS-01", "an1", "8.6 mpy"],
  ["Corrosion coupon", "Pit depth measurement", "ASTM G46", "SEM-01", "an2", "0.41 mm"],
  ["L80 tubing specimen", "Sulphide stress cracking", "NACE TM0177 A", "AC-02", "an1", "No failure, 720 h"],
  ["X65 linepipe", "Hydrogen-induced cracking", "NACE TM0284", "AC-02", "an2", "CLR 4.8%"],
  ["Produced water", "Chloride by ion chromatography", "ASTM D4327", "IC-01", "an3", "38,400 mg/L"],
  ["Produced water", "Cations by ICP-OES", "ASTM D1976", "ICP-01", "an6", "Ca 1,820 mg/L"],
  ["Crude oil", "Pour point", "ASTM D97", "RH-01", "an4", "+27 °C"],
  ["Crude oil", "Kinematic viscosity at 40 °C", "ASTM D445", "RH-01", "an4", "18.4 cSt"],
  ["Crude oil", "Water content", "ASTM D6304", "KF-01", "an3", "0.32 %"],
  ["Crude oil", "Density at 15 °C", "ASTM D4052", "DMA-01", "an4", "0.861 g/cm³"],
  ["Scale deposit", "XRD phase identification", "ASTM D934", "XRD-01", "an6", "FeCO₃ 71%"],
  ["Weld coupon", "Vickers hardness", "ASTM E384", "SEM-01", "an5", "238 HV10"],
  ["Tubing ring", "Tensile test", "ASTM E8", "UTM-01", "an5", "Rp0.2 584 MPa"],
  ["Inhibitor solution", "Wheel test efficiency", "NACE 1D182", "PS-01", "an2", "91.4 %"],
];

const statusPlan: SampleStatus[] = [
  ...Array<SampleStatus>(14).fill("released"),
  ...Array<SampleStatus>(7).fill("review"),
  ...Array<SampleStatus>(12).fill("testing"),
  ...Array<SampleStatus>(6).fill("assigned"),
  ...Array<SampleStatus>(5).fill("registered"),
];

export const linked = projects.filter((project) => project.wbs && (project.stage === "execution" || project.stage === "initiated"));

function day(offset: number) {
  const date = new Date(TODAY);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export const samples: Sample[] = statusPlan.map((status, index) => {
  const [material, test, standard, instrumentId, analystId, result] = tests[(index * 5) % tests.length];
  const project = linked[(index * 3) % linked.length];
  const age = statusPlan.length - index;
  const dueOffset = status === "released" ? -(age % 9) - 1 : status === "review" ? (index % 3 === 0 ? -2 : 2) : status === "testing" ? (index % 5 === 0 ? -1 : 3 + (index % 6)) : 6 + (index % 7);
  return {
    id: `IPEOT-S-2026-${String(371 + index).padStart(4, "0")}`,
    projectId: project.id,
    wbs: project.wbs!,
    material,
    test,
    standard,
    analystId: status === "registered" ? "" : analystId,
    instrumentId: status === "registered" || status === "assigned" ? instrumentId : instrumentId,
    received: day(-Math.round(age * 0.7) - 1),
    due: day(dueOffset),
    status,
    result: status === "review" || status === "released" ? result : undefined,
    priority: index % 7 === 0 ? "Urgent" : "Routine",
  };
});

export const limsTrend = {
  received: [148, 162, 155, 171, 168, 180, 176, 189, 194, 201, 186, 212],
  inProgress: [31, 29, 34, 36, 33, 38, 35, 37, 40, 39, 36, 42],
  pending: [12, 9, 11, 14, 10, 13, 8, 11, 9, 12, 10, 14],
  calibration: [2, 1, 3, 2, 1, 2, 3, 1, 2, 2, 1, 3],
  stock: [1, 2, 1, 1, 3, 2, 2, 1, 2, 3, 2, 3],
};
