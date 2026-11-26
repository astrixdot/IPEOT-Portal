import { createContext, useContext, useState, type ReactNode } from "react";
import type { Project, Role } from "../data/types";
import { department, person } from "../data/org";

export const ROLES: { key: Role; label: string; person: string; scope: string }[] = [
  { key: "HOI", label: "HOI", person: "hoi", scope: "All 7 departments" },
  { key: "HOD", label: "HOD", person: "hod3", scope: department(3).name },
  { key: "IC", label: "I/C", person: "ic3", scope: `${department(3).short} · projects under I/C review` },
  { key: "PCC", label: "PCC", person: "pcc1", scope: "Institute-wide coordination" },
];

const RoleContext = createContext<{ role: Role; setRole: (role: Role) => void }>({ role: "HOI", setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("HOI");
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}

export function roleMeta(role: Role) {
  const meta = ROLES.find((item) => item.key === role)!;
  return { ...meta, user: person(meta.person)! };
}

export function approvalQueue(role: Role, list: Project[]) {
  if (role === "HOI") return list.filter((p) => (p.stage === "final_auth" || p.stage === "report_approval") && p.pendingLevel === "HOI");
  if (role === "HOD") return list.filter((p) => p.departmentId === 3 && (p.stage === "hod" || (p.stage === "report_approval" && p.pendingLevel === "HOD") || (p.stage === "final_auth" && p.category === "short_term")));
  if (role === "IC") return list.filter((p) => p.icId === "ic3" && (p.stage === "ic_review" || (p.stage === "report_approval" && p.pendingLevel === "I/C")));
  return list.filter((p) => p.stage === "proposal" || (p.stage === "final_auth" && p.pendingLevel === "TAC"));
}

export function scopeProjects(role: Role, list: Project[]) {
  if (role === "HOD") return list.filter((project) => project.departmentId === 3);
  if (role === "IC") return list.filter((project) => project.icId === "ic3" && project.ciId !== "ci3");
  return list;
}
