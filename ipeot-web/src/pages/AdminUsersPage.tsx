import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import type { Department, PortalUser, WorkCentre } from "../types";
import { Banner, PageHeader, btn, btnGhost, field } from "../ui";

type Role = { id: number; code: string; name: string; description: string | null };

export function AdminUsersPage() {
  const session = useSession();
  const writable = can(session.data?.user, "admin.users.write");
  const queryClient = useQueryClient();
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api<{ data: PortalUser[] }>("/api/crud/v1/admin/users"),
  });
  const roles = useQuery({
    queryKey: ["roles"],
    queryFn: () => api<{ data: Role[] }>("/api/crud/v1/admin/roles"),
  });
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<{ data: Department[] }>("/api/crud/v1/admin/departments"),
  });
  const centres = useQuery({
    queryKey: ["work-centres"],
    queryFn: () => api<{ data: WorkCentre[] }>("/api/crud/v1/admin/work-centres"),
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [roleCode, setRoleCode] = useState("L3");
  const [scope, setScope] = useState("global");
  const [departmentId, setDepartmentId] = useState("");
  const [workCentreId, setWorkCentreId] = useState("");
  const [message, setMessage] = useState("");
  const selected = users.data?.data.find((user) => user.id === selectedId) ?? users.data?.data[0];

  const assign = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("no user");
      return api(`/api/crud/v1/admin/users/${selected.id}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          roleCode,
          scope,
          departmentId: scope === "department" ? Number(departmentId) : null,
          workCentreId: scope === "work_centre" ? Number(workCentreId) : null,
        }),
      });
    },
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  const revoke = useMutation({
    mutationFn: (assignmentId: number) => {
      if (!selected) throw new Error("no user");
      return api(`/api/crud/v1/admin/users/${selected.id}/assignments/${assignmentId}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });

  return (
    <div>
      <PageHeader title="Users and roles" detail="Assignments are scoped to the institute, a department, or a work centre. Acting arrangements are read at sign-in." />
      {users.isError ? <Banner>{errorText(users.error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <ul className="rounded-lg border border-slate-200 bg-white">
          {users.data?.data.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm ${(selected?.id === user.id) ? "bg-accent-soft text-ink" : "hover:bg-canvas"}`}
                onClick={() => setSelectedId(user.id)}
              >
                <span className="block font-medium">{user.name}</span>
                <span className="text-slate-500">{user.cpf}</span>
              </button>
            </li>
          ))}
        </ul>
        {selected ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-slate-600">{selected.email || "No email"} · {selected.departmentName || "No department"}</p>
            <ul className="mt-4 space-y-2">
              {selected.assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <span>{assignment.roleName} · {assignment.scope.replaceAll("_", " ")}</span>
                  {writable ? (
                    <button type="button" className={btnGhost} onClick={() => revoke.mutate(assignment.id)} disabled={revoke.isPending}>Remove</button>
                  ) : null}
                </li>
              ))}
              {selected.assignments.length === 0 ? <li className="text-sm text-slate-500">No active roles.</li> : null}
            </ul>
            {writable ? (
              <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); assign.mutate(); }}>
                <select className={field} value={roleCode} onChange={(e) => setRoleCode(e.target.value)}>
                  {roles.data?.data.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}
                </select>
                <select className={field} value={scope} onChange={(e) => setScope(e.target.value)}>
                  <option value="global">Institute</option>
                  <option value="department">Department</option>
                  <option value="work_centre">Work centre</option>
                </select>
                {scope === "department" ? (
                  <select className={field} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                    <option value="">Department</option>
                    {departments.data?.data.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                ) : null}
                {scope === "work_centre" ? (
                  <select className={field} value={workCentreId} onChange={(e) => setWorkCentreId(e.target.value)} required>
                    <option value="">Work centre</option>
                    {centres.data?.data.map((centre) => <option key={centre.id} value={centre.id}>{centre.name}</option>)}
                  </select>
                ) : null}
                <button className={btn} type="submit" disabled={assign.isPending}>Assign role</button>
              </form>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
