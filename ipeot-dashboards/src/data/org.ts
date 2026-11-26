import type { Department, Person } from "./types";

export const TODAY = new Date("2026-11-19T10:00:00+05:30");
export const CURRENT_FY = "2026-27";
export const FINANCIAL_YEARS = ["2026-27", "2025-26", "2024-25"];

export const departments: Department[] = [
  { id: 1, code: "PE", short: "Production Engg.", name: "Production Engineering" },
  { id: 2, code: "SFPE", short: "Surface Facilities", name: "Surface Facilities & Process Engineering" },
  { id: 3, code: "CCSM", short: "Corrosion & Materials", name: "Composite Material, Corrosion & Scale Management" },
  { id: 4, code: "ALWA", short: "Artificial Lift", name: "Artificial Lift & Well Analysis" },
  { id: 5, code: "DWFD", short: "Deep Water & FD", name: "Deep Water & Field Development" },
  { id: 6, code: "SGAE", short: "Structures & Energy", name: "Structure, Geotechnical & Alternate Energy" },
  { id: 7, code: "NTBD", short: "New Tech & BD", name: "New Technologies & Business Development" },
];

export const workCentres = [
  "Mumbai High Asset",
  "Neelam & Heera Asset",
  "Bassein & Satellite Asset",
  "Ahmedabad Asset",
  "Ankleshwar Asset",
  "Mehsana Asset",
  "Cambay Asset",
  "Assam Asset",
  "Rajahmundry Asset",
  "Cauvery Asset",
  "Tripura Asset",
  "Uran Plant",
  "Hazira Plant",
];

export function department(id: number) {
  return departments.find((item) => item.id === id) ?? departments[0];
}

export const people: Person[] = [
  { id: "hoi", cpf: "078214", name: "Dr. Rajiv Malhotra", designation: "ED – Head of Institute", departmentId: 0, role: "HOI" },
  { id: "pcc1", cpf: "104551", name: "Kavita Deshmukh", designation: "DGM (P) – PCC", departmentId: 0, role: "PCC" },

  { id: "hod1", cpf: "081736", name: "S. K. Verma", designation: "GGM (P) – HOD", departmentId: 1, role: "HOD" },
  { id: "hod2", cpf: "083392", name: "Anita Nair", designation: "GM (Chem) – HOD", departmentId: 2, role: "HOD" },
  { id: "hod3", cpf: "085127", name: "Dr. Prakash Iyer", designation: "GGM (Chem) – HOD", departmentId: 3, role: "HOD" },
  { id: "hod4", cpf: "086640", name: "M. R. Kulkarni", designation: "GM (P) – HOD", departmentId: 4, role: "HOD" },
  { id: "hod5", cpf: "087903", name: "Deepak Bhattacharya", designation: "GM (Res) – HOD", departmentId: 5, role: "HOD" },
  { id: "hod6", cpf: "088251", name: "Col. (Retd.) Harish Rawat", designation: "GM (Civil) – HOD", departmentId: 6, role: "HOD" },
  { id: "hod7", cpf: "089478", name: "Sunita Reddy", designation: "GM (E&T) – HOD", departmentId: 7, role: "HOD" },

  { id: "ic1", cpf: "094215", name: "Rakesh Pandey", designation: "DGM (P) – I/C", departmentId: 1, role: "IC" },
  { id: "ic2", cpf: "095308", name: "Farah Sheikh", designation: "DGM (Chem) – I/C", departmentId: 2, role: "IC" },
  { id: "ic3", cpf: "096114", name: "Vikram Joshi", designation: "DGM (Chem) – I/C", departmentId: 3, role: "IC" },
  { id: "ic4", cpf: "096802", name: "Ashok Menon", designation: "DGM (P) – I/C", departmentId: 4, role: "IC" },
  { id: "ic5", cpf: "097451", name: "Neha Saxena", designation: "DGM (Res) – I/C", departmentId: 5, role: "IC" },
  { id: "ic6", cpf: "098036", name: "Gurpreet Singh", designation: "DGM (Civil) – I/C", departmentId: 6, role: "IC" },
  { id: "ic7", cpf: "098724", name: "Arjun Mehta", designation: "DGM (E&T) – I/C", departmentId: 7, role: "IC" },

  { id: "ci1", cpf: "112487", name: "Dr. Meenakshi Raghavan", designation: "CC (Chem)", departmentId: 3, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci2", cpf: "114023", name: "Sandeep Rao", designation: "SC (Chem)", departmentId: 3, role: "CI", level: "L-2", capacity: 4 },
  { id: "ci3", cpf: "115690", name: "Pooja Kulkarni", designation: "Chemist", departmentId: 3, role: "CI", level: "L-3", capacity: 3 },
  { id: "ci4", cpf: "110352", name: "Ankit Sharma", designation: "SE (P)", departmentId: 1, role: "CI", level: "L-2", capacity: 4 },
  { id: "ci5", cpf: "111847", name: "Divya Pillai", designation: "CE (P)", departmentId: 1, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci6", cpf: "113216", name: "Manoj Tiwari", designation: "CE (Mech)", departmentId: 2, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci7", cpf: "116034", name: "Shreya Ghosh", designation: "SC (Chem)", departmentId: 2, role: "CI", level: "L-2", capacity: 4 },
  { id: "ci8", cpf: "112905", name: "Ravi Chandran", designation: "CE (P)", departmentId: 4, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci9", cpf: "117268", name: "Nikhil Bansal", designation: "EE (P)", departmentId: 4, role: "CI", level: "L-3", capacity: 3 },
  { id: "ci10", cpf: "110918", name: "Dr. Aparna Sen", designation: "CG (Res)", departmentId: 5, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci11", cpf: "115402", name: "Karthik Subramanian", designation: "SE (Res)", departmentId: 5, role: "CI", level: "L-2", capacity: 4 },
  { id: "ci12", cpf: "111563", name: "Rohit Deshpande", designation: "CE (Civil)", departmentId: 6, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci13", cpf: "116781", name: "Ishita Banerjee", designation: "SE (Civil)", departmentId: 6, role: "CI", level: "L-2", capacity: 4 },
  { id: "ci14", cpf: "113874", name: "Vivek Agarwal", designation: "CE (E&T)", departmentId: 7, role: "CI", level: "L-1", capacity: 5 },
  { id: "ci15", cpf: "118145", name: "Tanvi Joshi", designation: "AEE (E&T)", departmentId: 7, role: "CI", level: "L-3", capacity: 3 },

  { id: "lab1", cpf: "101629", name: "Dr. Sameer Kulkarni", designation: "CC (Chem) – Lab In-charge", departmentId: 3, role: "LAB_IC" },
];

export function person(id: string) {
  return people.find((item) => item.id === id);
}

export function hodOf(departmentId: number) {
  return people.find((item) => item.role === "HOD" && item.departmentId === departmentId)!;
}

export function icOf(departmentId: number) {
  return people.find((item) => item.role === "IC" && item.departmentId === departmentId)!;
}

export function cisOf(departmentId: number) {
  return people.filter((item) => item.role === "CI" && item.departmentId === departmentId);
}

export const coordinators: Record<string, string> = {
  "Mumbai High Asset": "R. Venkatesh",
  "Neelam & Heera Asset": "Pratibha Kamat",
  "Bassein & Satellite Asset": "Hemant Patil",
  "Ahmedabad Asset": "Jignesh Patel",
  "Ankleshwar Asset": "Mitesh Desai",
  "Mehsana Asset": "Bhavesh Chaudhary",
  "Cambay Asset": "Nilesh Shah",
  "Assam Asset": "Bhaskar Gogoi",
  "Rajahmundry Asset": "K. Srinivas",
  "Cauvery Asset": "S. Murugan",
  "Tripura Asset": "Sanjib Debbarma",
  "Uran Plant": "Ajay Mhatre",
  "Hazira Plant": "Paresh Modi",
};
