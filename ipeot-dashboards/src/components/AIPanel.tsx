import { useEffect, useRef, useState, type FormEvent } from "react";
import { BookOpen, Check, CornerDownLeft, Pencil, RotateCcw, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { Workspace } from "../data/ci";
import { formatShort } from "../lib/format";
import { cx } from "../lib/format";
import { useToast } from "../lib/toast";
import { Button, Card, IdChip, StatusBadge } from "./ui/primitives";
import { inputClass } from "./ui/Overlay";

type Prompt = { id: string; label: string };
type Output = { promptId: string; heading: string; text: string; cites: number[] };
type Phase = "idle" | "thinking" | "streaming" | "review" | "editing" | "accepted";

const PROMPTS: Prompt[] = [
  { id: "draft", label: "Draft Section 3 from LIMS results" },
  { id: "slip", label: "Summarise schedule slippage for I/C" },
  { id: "pcr", label: "Check PCR completeness" },
  { id: "similar", label: "Find similar past projects" },
];

function respond(promptId: string, workspace: Workspace, title: string): Output {
  if (promptId === "slip") {
    const late = workspace.milestones.filter((m) => m.status === "late");
    const active = workspace.milestones.filter((m) => m.status === "active");
    const lines = late.length
      ? late.map((m) => `• “${m.name}” was due ${formatShort(m.end)} and is ${m.progress}% complete.`)
      : ["• No milestone is past its planned end date."];
    return {
      promptId,
      heading: "Schedule note for I/C",
      text: `${title}\n\n${lines.join("\n")}\n${active.map((m) => `• “${m.name}” is in progress (${m.progress}%) and due ${formatShort(m.end)}.`).join("\n")}\n\nThe delay traces to produced-water data still awaited from the work centre. A 21-day extension to the analysis milestone keeps the final report within the AWP year.`,
      cites: [],
    };
  }
  if (promptId === "pcr") {
    const docs = workspace.iso.map((doc) => `• ${doc.type} ${doc.version}: ${doc.status.toLowerCase()}${doc.status === "Approved" ? "" : `, last edited ${formatShort(doc.editedAt)} by ${doc.editedBy}`}.`);
    const pending = workspace.lims.results.filter((r) => r.status !== "Released").length;
    return {
      promptId,
      heading: "PCR completeness check (ISO 9001 format F-IPEOT-PCR-04)",
      text: `${docs.join("\n")}\n\nMissing before submission:\n• ${pending ? `${pending} LIMS result${pending > 1 ? "s" : ""} not yet released; Section 3 tables will change.` : "All LIMS results are released."}\n• Cost booking summary from SAP PS (Section 6).\n• Work-centre feedback form signed by the coordinator.`,
      cites: [],
    };
  }
  if (promptId === "similar") {
    return {
      promptId,
      heading: "Related reports in the Knowledge Base",
      text: `${workspace.similar.length} published reports match this project’s scope, materials and test methods. The closest, ${workspace.similar[0].accession}, used the same test standards and reached a comparable conclusion; reuse its methodology table to save rework [1].`,
      cites: [0],
    };
  }
  return { promptId, heading: workspace.draft.section, text: workspace.draft.text, cites: workspace.draft.cites };
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function CitedText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <>
      {parts.map((part, index) =>
        /^\[\d+\]$/.test(part) ? (
          <sup key={index} className="mx-0.5 rounded bg-cyan-soft px-1 font-mono text-[10.5px] font-semibold text-cyan-ink">
            {part.slice(1, -1)}
          </sup>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function AIPanel({ workspace, projectTitle, index = 0 }: { workspace: Workspace; projectTitle: string; index?: number }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState<Output | null>(null);
  const [shown, setShown] = useState("");
  const [edited, setEdited] = useState("");
  const [question, setQuestion] = useState("");
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    clear();
    setPhase("idle");
    setOutput(null);
    setShown("");
    return clear;
  }, [workspace.projectId]);

  const run = (promptId: string) => {
    clear();
    const next = respond(promptId, workspace, projectTitle);
    setOutput(next);
    setShown("");
    setEdited("");
    setPhase("thinking");
    const tokens = next.text.split(/(\s+)/);
    timers.current.push(
      window.setTimeout(() => {
        if (reduced()) {
          setShown(next.text);
          setPhase("review");
          return;
        }
        setPhase("streaming");
        let i = 0;
        const step = () => {
          i = Math.min(tokens.length, i + 4);
          setShown(tokens.slice(0, i).join(""));
          if (i < tokens.length) timers.current.push(window.setTimeout(step, 22));
          else setPhase("review");
        };
        step();
      }, 900),
    );
  };

  const ask = (event: FormEvent) => {
    event.preventDefault();
    const q = question.toLowerCase();
    if (!q.trim()) return;
    run(/similar|past|previous|knowledge/.test(q) ? "similar" : /pcr|iso|complete/.test(q) ? "pcr" : /slip|delay|extension|late|schedule/.test(q) ? "slip" : "draft");
    setQuestion("");
  };

  const busy = phase === "thinking" || phase === "streaming";
  const cited = output ? output.cites.map((i) => workspace.similar[i]).filter(Boolean) : [];

  return (
    <Card
      id="ai"
      index={index}
      title={
        <span className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-teal to-cyan text-navy">
            <Sparkles className="size-4" aria-hidden />
          </span>
          AI Report Assistant
        </span>
      }
      subtitle="Grounded in this project’s LIMS results, ISO documents and the IPEOT Knowledge Base"
      className="scroll-mt-20"
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested prompts">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            disabled={busy}
            onClick={() => run(prompt.id)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50",
              prompt.id === "draft" ? "border-teal/40 bg-teal-soft text-teal-ink hover:border-teal" : "border-line bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink",
            )}
          >
            <Wand2 className="size-3.5" aria-hidden />
            {prompt.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-2/50" aria-live="polite" aria-busy={busy}>
        {phase === "idle" ? (
          <div className="flex items-center gap-3 px-4 py-6 text-sm text-ink-3">
            <Sparkles className="size-5 shrink-0 text-teal" aria-hidden />
            Choose a prompt or ask a question. Drafts are never added to the report until you accept them.
          </div>
        ) : output ? (
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={phase === "accepted" ? "success" : "warning"} icon={phase === "accepted" ? Check : Sparkles}>
                {phase === "accepted" ? "Accepted by CI" : "AI draft – pending CI review"}
              </StatusBadge>
              <span className="text-xs font-semibold text-ink-2">{output.heading}</span>
            </div>
            {phase === "thinking" ? (
              <div className="flex items-center gap-2 py-5 text-sm text-ink-3">
                <span className="dot-typing" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                Reading {workspace.lims.results.length} LIMS results and {workspace.similar.length} past reports…
              </div>
            ) : phase === "editing" ? (
              <div className="mt-3">
                <label className="sr-only" htmlFor="ai-edit">
                  Edit AI draft
                </label>
                <textarea id="ai-edit" value={edited} onChange={(event) => setEdited(event.target.value)} rows={10} className={cx(inputClass, "h-auto py-2 font-sans leading-relaxed")} />
              </div>
            ) : (
              <div className="mt-3 max-h-80 overflow-y-auto pr-1 text-sm leading-relaxed whitespace-pre-line text-ink scroll-thin">
                <CitedText text={phase === "streaming" ? shown : edited || output.text} />
                {phase === "streaming" ? <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-teal align-middle" aria-hidden /> : null}
              </div>
            )}

            {cited.length && phase !== "thinking" ? (
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-[11px] font-semibold tracking-wide text-ink-3 uppercase">Sources</p>
                <ol className="mt-1.5 space-y-1">
                  {cited.map((cite, i) => (
                    <li key={cite.accession} className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
                      <span className="font-mono font-semibold text-cyan-ink">[{i + 1}]</span>
                      <IdChip>{cite.accession}</IdChip>
                      <span className="min-w-0 truncate">{cite.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            {phase === "review" || phase === "editing" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Check}
                  onClick={() => {
                    if (phase === "editing") setOutput({ ...output, text: edited });
                    setPhase("accepted");
                    toast.push("Draft accepted", `${output.heading} added to the report draft with CI attribution.`, "success");
                  }}
                >
                  {phase === "editing" ? "Save & accept" : "Accept"}
                </Button>
                {phase === "review" ? (
                  <Button
                    size="sm"
                    icon={Pencil}
                    onClick={() => {
                      setEdited(output.text);
                      setPhase("editing");
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  onClick={() => {
                    setPhase("idle");
                    setOutput(null);
                    setEdited("");
                    toast.push("AI draft discarded", "Nothing was added to the report.", "info");
                  }}
                >
                  Discard
                </Button>
              </div>
            ) : null}
            {phase === "accepted" ? (
              <Button size="sm" variant="ghost" icon={RotateCcw} className="mt-3" onClick={() => run(output.promptId)}>
                Regenerate
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <form onSubmit={ask} className="relative mt-3">
        <label htmlFor="ai-question" className="sr-only">
          Ask the assistant about this project
        </label>
        <input id="ai-question" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={busy} placeholder="Ask about this project, e.g. “why is the analysis milestone late?”" className={cx(inputClass, "pr-11")} />
        <button type="submit" disabled={busy || !question.trim()} className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md bg-teal-soft text-teal-ink disabled:opacity-40" aria-label="Send question">
          <CornerDownLeft className="size-4" aria-hidden />
        </button>
      </form>

      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
          <BookOpen className="size-3.5" aria-hidden />
          Similar past projects
        </p>
        <ul className="mt-2 space-y-2">
          {workspace.similar.map((item, i) => (
            <li key={item.accession} className="rounded-lg border border-line px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    <span className="mr-1 font-mono text-xs text-cyan-ink">[{i + 1}]</span>
                    {item.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                    <span className="font-mono">{item.accession}</span>
                    <span aria-hidden>·</span>
                    <span>{item.year}</span>
                    <span aria-hidden>·</span>
                    <span>{item.department}</span>
                  </p>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block font-display text-base font-semibold text-teal-ink tabular">{item.match}%</span>
                  <span className="block text-[10.5px] text-ink-3">match</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
