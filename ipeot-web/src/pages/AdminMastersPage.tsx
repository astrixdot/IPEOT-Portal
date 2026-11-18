import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorText } from "../api";
import { can } from "../access";
import { useSession } from "../auth";
import type { Department, ProjectType, WorkCentre } from "../types";
import { Banner, PageHeader, btn, btnGhost, field } from "../ui";

type Section = "departments" | "centres" | "types";

export function AdminMastersPage() {
  const session = useSession();
  const writable = can(session.data?.user, "admin.masters.write");
  const [section, setSection] = useState<Section>("departments");
  const departments = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<{ data: Department[] }>("/api/crud/v1/admin/departments"),
  });
  const centres = useQuery({
    queryKey: ["work-centres"],
    queryFn: () => api<{ data: WorkCentre[] }>("/api/crud/v1/admin/work-centres"),
  });
  const types = useQuery({
    queryKey: ["project-types"],
    queryFn: () => api<{ data: ProjectType[] }>("/api/crud/v1/admin/project-types"),
  });

  return (
    <div>
      <PageHeader title="Master data" detail="Departments, work centres, and study types used when a proposal is raised." />
      <div className="mb-4 flex gap-2">
        <Tab current={section} id="departments" set={setSection} label="Departments" />
        <Tab current={section} id="centres" set={setSection} label="Work centres" />
        <Tab current={section} id="types" set={setSection} label="Study types" />
      </div>
      {section === "departments" ? (
        <DepartmentSection rows={departments.data?.data ?? []} loading={departments.isLoading} error={departments.error} writable={writable} />
      ) : null}
      {section === "centres" ? (
        <CentreSection
          rows={centres.data?.data ?? []}
          departments={departments.data?.data ?? []}
          loading={centres.isLoading}
          error={centres.error}
          writable={writable}
        />
      ) : null}
      {section === "types" ? (
        <TypeSection
          rows={types.data?.data ?? []}
          departments={departments.data?.data ?? []}
          centres={centres.data?.data ?? []}
          loading={types.isLoading}
          error={types.error}
          writable={writable}
        />
      ) : null}
    </div>
  );
}

function Tab({ current, id, set, label }: { current: Section; id: Section; set: (id: Section) => void; label: string }) {
  return (
    <button type="button" className={current === id ? btn : btnGhost} onClick={() => set(id)}>{label}</button>
  );
}

function DepartmentSection({ rows, loading, error, writable }: { rows: Department[]; loading: boolean; error: unknown; writable: boolean }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const create = useMutation({
    mutationFn: () => api("/api/crud/v1/admin/departments", { method: "POST", body: JSON.stringify({ code, name }) }),
    onSuccess: async () => {
      setCode("");
      setName("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  return (
    <section>
      {error ? <Banner>{errorText(error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      {writable ? (
        <form className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[8rem_1fr_auto]" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          <input className={field} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <button className={btn} type="submit" disabled={create.isPending}>Add department</button>
        </form>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : <SimpleRows rows={rows.map((row) => [row.code, row.name, row.active ? "Active" : "Inactive"])} columns={["Code", "Name", "Status"]} />}
    </section>
  );
}

function CentreSection({
  rows, departments, loading, error, writable,
}: {
  rows: WorkCentre[];
  departments: Department[];
  loading: boolean;
  error: unknown;
  writable: boolean;
}) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [message, setMessage] = useState("");
  const create = useMutation({
    mutationFn: () => api("/api/crud/v1/admin/work-centres", {
      method: "POST",
      body: JSON.stringify({ code, name, departmentId: Number(departmentId) }),
    }),
    onSuccess: async () => {
      setCode("");
      setName("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["work-centres"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  return (
    <section>
      {error ? <Banner>{errorText(error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      {writable ? (
        <form className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          <input className={field} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className={field} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
            <option value="">Department</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.code}</option>)}
          </select>
          <button className={btn} type="submit" disabled={create.isPending}>Add work centre</button>
        </form>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
        <SimpleRows rows={rows.map((row) => [row.code, row.name, row.departmentCode ?? "—", row.active ? "Active" : "Inactive"])} columns={["Code", "Name", "Department", "Status"]} />
      )}
    </section>
  );
}

function TypeSection({
  rows, departments, centres, loading, error, writable,
}: {
  rows: ProjectType[];
  departments: Department[];
  centres: WorkCentre[];
  loading: boolean;
  error: unknown;
  writable: boolean;
}) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [workCentreId, setWorkCentreId] = useState("");
  const [message, setMessage] = useState("");
  const create = useMutation({
    mutationFn: () => api("/api/crud/v1/admin/project-types", {
      method: "POST",
      body: JSON.stringify({
        code,
        name,
        departmentId: Number(departmentId),
        workCentreId: workCentreId ? Number(workCentreId) : null,
      }),
    }),
    onSuccess: async () => {
      setCode("");
      setName("");
      setWorkCentreId("");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["project-types"] });
    },
    onError: (err) => setMessage(errorText(err)),
  });
  const centreOptions = centres.filter((centre) => !departmentId || String(centre.departmentId) === departmentId);
  return (
    <section>
      {error ? <Banner>{errorText(error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      {writable ? (
        <form className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
          <input className={field} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
          <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select className={field} value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setWorkCentreId(""); }} required>
            <option value="">Department</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.code}</option>)}
          </select>
          <select className={field} value={workCentreId} onChange={(e) => setWorkCentreId(e.target.value)}>
            <option value="">Work centre</option>
            {centreOptions.map((centre) => <option key={centre.id} value={centre.id}>{centre.code}</option>)}
          </select>
          <button className={btn} type="submit" disabled={create.isPending}>Add study type</button>
        </form>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
        <SimpleRows
          rows={rows.map((row) => [row.code, row.name, row.departmentCode ?? "—", row.workCentreCode ?? "—", row.active ? "Active" : "Inactive"])}
          columns={["Code", "Name", "Department", "Work centre", "Status"]}
        />
      )}
    </section>
  );
}

function SimpleRows({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>{columns.map((column) => <th key={column} className="px-3 py-2 font-medium">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-slate-100">
              {row.map((cell, index) => <td key={`${row[0]}-${index}`} className="px-3 py-2">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
