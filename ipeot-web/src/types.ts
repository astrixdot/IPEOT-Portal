export type RoleGrant = {
  code: string;
  name: string;
  scope: string;
  departmentId: number | null;
  workCentreId: number | null;
  delegated: boolean;
  delegatedFrom: number | null;
};

export type SessionUser = {
  id: number;
  cpf: string;
  name: string;
  email: string | null;
  departmentId: number | null;
  workCentreId: number | null;
  roles: RoleGrant[];
  permissions: string[];
};

export type Assignment = {
  id: number;
  roleCode: string;
  roleName: string;
  scope: string;
  departmentId: number | null;
  workCentreId: number | null;
};

export type Department = { id: number; code: string; name: string; active: boolean };
export type WorkCentre = Department & { departmentId: number | null; departmentCode: string | null };
export type ProjectType = Department & {
  departmentId: number | null;
  departmentCode: string | null;
  workCentreId: number | null;
  workCentreCode: string | null;
};
export type PortalUser = {
  id: number;
  cpf: string;
  name: string;
  email: string | null;
  active: boolean;
  departmentId: number | null;
  departmentName: string | null;
  assignments: Assignment[];
};
