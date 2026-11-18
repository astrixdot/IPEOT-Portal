import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api, errorText } from "../api";
import { Banner, PageHeader, btn, btnGhost, field } from "../ui";
import { StudyGuidelines } from "./Guidelines";

type FieldDef = {
  key: string;
  label: string;
  type: string;
  options?: string[];
  repeat?: boolean;
  perItem?: boolean;
  hint?: string;
  maxLength?: number;
};

type ModificationDef = { code: string; name: string; sampleReport: string; fields: FieldDef[] };

type FormSchema = {
  kind: string;
  categories?: string[];
  platform?: FieldDef;
  fields?: FieldDef[];
  modifications?: ModificationDef[];
  sampleReport?: string;
};

type Study = {
  code: string;
  name: string;
  sampleReport: string | null;
  inputs: string[];
  specimens: string[];
  equipment: string[];
  tests: string[];
  software: { name: string; use: string }[];
  formSchema: FormSchema | null;
  workCentreName: string | null;
};

type Department = { code: string; name: string; studies: Study[] };

type ModDraft = { code: string; count: number; shared: Record<string, string>; items: Record<string, string>[] };

const categoryLabel: Record<string, string> = {
  scheduled: "Scheduled",
  unscheduled: "Unscheduled",
  short_term: "Short-term",
};

const categoryHelp: Record<string, string> = {
  scheduled: "Filed into the open annual work plan. The In-charge later confirms the quarter, or keeps it in the plan with no timeline.",
  unscheduled: "A request raised during the year. It does not enter the AWP window. The department and HOD decide it.",
  short_term: "A small job, about 10 to 15 days. It stays in the department and ends with the HOD.",
};

function readFiles(list: FileList | null, setAttachments: (files: { name: string; mime: string; dataBase64: string }[]) => void) {
  const files = [...(list || [])].slice(0, 5);
  Promise.all(files.map((file) => new Promise<{ name: string; mime: string; dataBase64: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      mime: file.type || "application/octet-stream",
      dataBase64: String(reader.result).split(",")[1] || "",
    });
    reader.onerror = () => reject(reader.error);
  }))).then(setAttachments).catch(() => setAttachments([]));
}

export function NewProposalPage() {
  const navigate = useNavigate();
  const catalogue = useQuery({
    queryKey: ["catalogue"],
    queryFn: () => api<{ data: Department[] }>("/api/crud/v1/catalogue"),
  });
  const [departmentCode, setDepartmentCode] = useState("");
  const [typeCode, setTypeCode] = useState("");
  const [title, setTitle] = useState("");
  const [asset, setAsset] = useState("");
  const [category, setCategory] = useState("scheduled");
  const [priority, setPriority] = useState("3");
  const [preferredQuarter, setPreferredQuarter] = useState("Q1");
  const [attachments, setAttachments] = useState<{ name: string; mime: string; dataBase64: string }[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [specimens, setSpecimens] = useState<Record<string, string>>({});
  const [platform, setPlatform] = useState("");
  const [lifeFields, setLifeFields] = useState<Record<string, string>>({});
  const [mods, setMods] = useState<ModDraft[]>([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"proposal" | "guidelines">("proposal");

  const department = catalogue.data?.data.find((item) => item.code === departmentCode);
  const study = department?.studies.find((item) => item.code === typeCode);
  const categories = study?.formSchema?.categories || ["scheduled", "unscheduled", "short_term"];
  const groups = useMemo(() => groupStudies(department?.studies || []), [department]);

  const save = useMutation({
    mutationFn: () => api<{ data: { id: number } }>("/api/crud/v1/proposals", {
      method: "POST",
      body: JSON.stringify(payload(study, { title, asset, category, answers, specimens, platform, lifeFields, mods, priority, preferredQuarter, attachments })),
    }),
    onSuccess: (result) => navigate(`/proposals/${result.data.id}`),
    onError: (err) => setMessage(errorText(err)),
  });

  return (
    <div>
      <PageHeader title="New proposal" detail="Choose the department, then the study. The form follows that sheet in the consolidate workbook." />
      <div className="mb-6 flex gap-2">
        <button type="button" className={tab === "proposal" ? btn : btnGhost} onClick={() => setTab("proposal")}>Proposal</button>
        <button type="button" className={tab === "guidelines" ? btn : btnGhost} onClick={() => setTab("guidelines")}>General guidelines</button>
      </div>
      {tab === "guidelines" ? <StudyGuidelines category={category} /> : null}
      {tab === "proposal" ? <>
      {catalogue.isError ? <Banner>{errorText(catalogue.error)}</Banner> : null}
      {message ? <Banner>{message}</Banner> : null}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {(catalogue.data?.data || []).map((item, index) => (
          <button
            key={item.code}
            type="button"
            className={item.code === departmentCode ? btn : btnGhost}
            onClick={() => {
              setDepartmentCode(item.code);
              setTypeCode("");
              setMods([]);
            }}
          >
            {index + 1}. {item.code}
          </button>
        ))}
      </div>
      {department ? (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">{department.name}</h2>
          {groups.map((group) => (
            <div key={group.name} className="mb-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{group.name}</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {group.studies.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    className={`rounded-lg border px-3 py-3 text-left text-sm ${item.code === typeCode ? "border-ink bg-accent-soft" : "border-line bg-paper hover:border-ink"}`}
                    onClick={() => {
                      setTypeCode(item.code);
                      setCategory((item.formSchema?.categories || ["scheduled"])[0]);
                      setAnswers({});
                      setSpecimens({});
                      setMods([]);
                    }}
                  >
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-slate-500">{item.sampleReport ? `Sample ${item.sampleReport}` : item.code}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : <p className="text-sm text-slate-600">Start with Department I and continue through Structure.</p>}
      {study ? (
        <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); setMessage(""); save.mutate(); }}>
          <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
            <label className="block text-sm">Title
              <input className={`${field} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="block text-sm">Asset or installation
              <input className={`${field} mt-1`} value={asset} onChange={(event) => setAsset(event.target.value)} />
            </label>
            <label className="block text-sm">Category
              <select className={`${field} mt-1`} value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item} value={item}>{categoryLabel[item] || item}</option>)}
              </select>
              <span className="mt-1 block text-xs text-slate-500">{categoryHelp[category]}</span>
            </label>
            <label className="block text-sm">Priority
              <select className={`${field} mt-1`} value={priority} onChange={(event) => setPriority(event.target.value)} required={category === "scheduled"}>
                {["1", "2", "3", "4", "5"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm">Preferred quarter
              <select className={`${field} mt-1`} value={preferredQuarter} onChange={(event) => setPreferredQuarter(event.target.value)} required={category === "scheduled"}>
                {["Q1", "Q2", "Q3", "Q4"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">Attachments
              <input className={`${field} mt-1`} type="file" multiple onChange={(event) => void readFiles(event.target.files, setAttachments)} />
              {attachments.length > 0 ? <span className="mt-1 block text-xs text-slate-500">{attachments.map((file) => file.name).join(", ")}</span> : null}
            </label>
          </section>
          {study.formSchema?.kind === "structure-sia" ? (
            <SiaFields schema={study.formSchema} platform={platform} setPlatform={setPlatform} mods={mods} setMods={setMods} />
          ) : null}
          {study.formSchema?.kind === "structure-life" ? (
            <LifeFields schema={study.formSchema} platform={platform} setPlatform={setPlatform} fields={lifeFields} setFields={setLifeFields} />
          ) : null}
          {study.inputs.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Data required</h2>
              {study.inputs.map((input, index) => (
                <label key={input} className="block text-sm">
                  {input}
                  <textarea className={`${field} mt-1 min-h-20`} value={answers[String(index)] || ""} onChange={(event) => setAnswers({ ...answers, [String(index)]: event.target.value })} />
                </label>
              ))}
            </section>
          ) : null}
          {study.specimens.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Physical specimen</h2>
              {study.specimens.map((specimen, index) => (
                <label key={specimen} className="block text-sm">
                  {specimen}
                  <input className={`${field} mt-1`} value={specimens[String(index)] || ""} onChange={(event) => setSpecimens({ ...specimens, [String(index)]: event.target.value })} placeholder="Sample reference, if available" />
                </label>
              ))}
            </section>
          ) : null}
          <Reference study={study} />
          <button className={btn} type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save draft"}</button>
        </form>
      ) : null}
      </> : null}
    </div>
  );
}

function groupStudies(studies: Study[]) {
  const groups: { name: string; studies: Study[] }[] = [];
  for (const study of studies) {
    const name = study.workCentreName || "Studies";
    const group = groups.find((item) => item.name === name);
    if (group) group.studies.push(study);
    else groups.push({ name, studies: [study] });
  }
  return groups;
}

function payload(study: Study | undefined, state: {
  title: string;
  asset: string;
  category: string;
  answers: Record<string, string>;
  specimens: Record<string, string>;
  platform: string;
  lifeFields: Record<string, string>;
  mods: ModDraft[];
  priority: string;
  preferredQuarter: string;
  attachments: { name: string; mime: string; dataBase64: string }[];
}) {
  return {
    typeCode: study?.code,
    title: state.title,
    asset: state.asset,
    category: state.category,
    priority: Number(state.priority),
    preferredQuarter: state.preferredQuarter,
    attachments: state.attachments,
    answers: state.answers,
    specimens: state.specimens,
    platform: state.platform,
    ...state.lifeFields,
    modifications: state.mods,
  };
}

function Reference({ study }: { study: Study }) {
  if (study.equipment.length + study.tests.length + study.software.length === 0) return null;
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
      <h2 className="font-semibold">Equipment, tests, and software</h2>
      {study.equipment.length > 0 ? <p className="mt-2"><span className="text-slate-500">Equipment. </span>{study.equipment.join("; ")}</p> : null}
      {study.tests.length > 0 ? <p className="mt-2"><span className="text-slate-500">Tests. </span>{study.tests.join("; ")}</p> : null}
      {study.software.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {study.software.map((item) => <li key={item.name}><span className="font-medium">{item.name}.</span> {item.use}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

function FieldInput({ fieldDef, value, onChange }: { fieldDef: FieldDef; value: string; onChange: (value: string) => void }) {
  if (fieldDef.type === "select") {
    return (
      <label className="block text-sm">{fieldDef.label}
        <select className={`${field} mt-1`} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Select</option>
          {(fieldDef.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (fieldDef.type === "textarea") {
    return (
      <label className="block text-sm">{fieldDef.label}
        <textarea className={`${field} mt-1 min-h-24`} maxLength={fieldDef.maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  return (
    <label className="block text-sm">{fieldDef.label}
      {fieldDef.hint ? <span className="mt-1 block text-xs text-slate-500">{fieldDef.hint}</span> : null}
      <input className={`${field} mt-1`} type={fieldDef.type === "number" ? "number" : "text"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={fieldDef.type === "upload" ? "Drawing or memo reference" : ""} />
    </label>
  );
}

function LifeFields({
  schema, platform, setPlatform, fields, setFields,
}: {
  schema: FormSchema;
  platform: string;
  setPlatform: (value: string) => void;
  fields: Record<string, string>;
  setFields: (value: Record<string, string>) => void;
}) {
  const platformField = schema.platform || (schema.fields || []).find((item) => item.key === "platform");
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
      {platformField ? <FieldInput fieldDef={platformField} value={platform} onChange={setPlatform} /> : null}
      {(schema.fields || []).filter((item) => item.key !== "platform").map((item) => (
        <FieldInput key={item.key} fieldDef={item} value={fields[item.key] || ""} onChange={(value) => setFields({ ...fields, [item.key]: value })} />
      ))}
      {schema.sampleReport ? <p className="text-sm text-slate-500">Sample report {schema.sampleReport}</p> : null}
    </section>
  );
}

function SiaFields({
  schema, platform, setPlatform, mods, setMods,
}: {
  schema: FormSchema;
  platform: string;
  setPlatform: (value: string) => void;
  mods: ModDraft[];
  setMods: (value: ModDraft[]) => void;
}) {
  function toggle(definition: ModificationDef) {
    if (mods.some((item) => item.code === definition.code)) {
      setMods(mods.filter((item) => item.code !== definition.code));
      return;
    }
    setMods([...mods, { code: definition.code, count: 1, shared: {}, items: [{}] }]);
  }
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {schema.platform ? <FieldInput fieldDef={schema.platform} value={platform} onChange={setPlatform} /> : null}
      </div>
      <h2 className="text-lg font-semibold">Modifications</h2>
      {(schema.modifications || []).map((definition) => {
        const current = mods.find((item) => item.code === definition.code);
        const repeat = definition.fields.find((item) => item.repeat);
        const sharedFields = definition.fields.filter((item) => !item.perItem && !item.repeat);
        const itemFields = definition.fields.filter((item) => item.perItem);
        return (
          <article key={definition.code} className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={Boolean(current)} onChange={() => toggle(definition)} />
              {definition.name}
              <span className="font-normal text-slate-500">Sample {definition.sampleReport}</span>
            </label>
            {current ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {sharedFields.map((item) => (
                    <FieldInput key={item.key} fieldDef={item} value={current.shared[item.key] || ""} onChange={(value) => updateMod(mods, setMods, definition.code, { shared: { ...current.shared, [item.key]: value } })} />
                  ))}
                  {repeat ? (
                    <FieldInput fieldDef={repeat} value={String(current.count)} onChange={(value) => resizeMod(mods, setMods, definition.code, Number(value))} />
                  ) : null}
                </div>
                {itemFields.length > 0 ? current.items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-md bg-slate-50 p-3 md:grid-cols-2">
                    <p className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Item {index + 1}</p>
                    {itemFields.map((fieldDef) => (
                      <FieldInput key={fieldDef.key} fieldDef={fieldDef} value={item[fieldDef.key] || ""} onChange={(value) => {
                        const items = current.items.map((row, rowIndex) => rowIndex === index ? { ...row, [fieldDef.key]: value } : row);
                        updateMod(mods, setMods, definition.code, { items });
                      }} />
                    ))}
                  </div>
                )) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function updateMod(mods: ModDraft[], setMods: (value: ModDraft[]) => void, code: string, patch: Partial<ModDraft>) {
  setMods(mods.map((item) => item.code === code ? { ...item, ...patch } : item));
}

function resizeMod(mods: ModDraft[], setMods: (value: ModDraft[]) => void, code: string, count: number) {
  const safe = Number.isInteger(count) && count >= 1 && count <= 12 ? count : 1;
  setMods(mods.map((item) => {
    if (item.code !== code) return item;
    const items = Array.from({ length: safe }, (_, index) => item.items[index] || {});
    return { ...item, count: safe, items };
  }));
}
