"use client";

import { useEffect, useState, useTransition } from "react";
import { callFunction, uploadPhoto } from "@/lib/functions";
import type { Guide } from "@/lib/types";
import { saveSteps } from "./actions";

type Props = { repairId: string; diagnosisId: string; causeIndex: number; userId: string; initialDone: number[] };

export function FixGuide({ repairId, diagnosisId, causeIndex, userId, initialDone }: Props) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<number[]>(initialDone);
  const [, startTransition] = useTransition();

  useEffect(() => {
    callFunction<Guide>("guide", { diagnosis_id: diagnosisId, cause_index: causeIndex })
      .then(setGuide)
      .catch((e) => setError(e.message));
  }, [diagnosisId, causeIndex]);

  function toggle(i: number) {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i].sort((a, b) => a - b);
    setDone(next);
    startTransition(() => saveSteps(repairId, next));
  }

  if (error) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>;
  if (!guide) {
    return (
      <div className="card flex flex-col items-center gap-3 py-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        <p className="text-sm muted">Writing your step-by-step guide…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p>{guide.overview}</p>

      {guide.safety_warnings.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <h2 className="font-semibold">Before you start</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guide.safety_warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <List title="Tools" items={guide.tools} />
        <List title="Parts" items={guide.parts} />
      </section>

      {guide.specs_to_look_up.length > 0 && (
        <List title="Look these up in your manual" items={guide.specs_to_look_up} />
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">
          Steps <span className="text-sm font-normal muted">({done.length} of {guide.steps.length} done)</span>
        </h2>
        <ol className="space-y-3">
          {guide.steps.map((s, i) => (
            <Step
              key={i}
              index={i}
              step={s}
              checked={done.includes(i)}
              onToggle={() => toggle(i)}
              ask={(question, photo) => askStuck(i, question, photo)}
            />
          ))}
        </ol>
      </section>

      <section className="card space-y-2 text-sm">
        <p><span className="font-semibold">You&apos;re done when: </span>{guide.done_when}</p>
        {guide.stop_if.length > 0 && (
          <div>
            <p className="font-semibold">Stop and take it to a shop if:</p>
            <ul className="list-disc pl-5">{guide.stop_if.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        )}
      </section>
    </div>
  );

  async function askStuck(stepIndex: number, question: string, photo: File | null) {
    const photo_path = photo ? await uploadPhoto(userId, photo) : undefined;
    return callFunction<{ answer: string; should_stop: boolean }>("guide", {
      diagnosis_id: diagnosisId,
      cause_index: causeIndex,
      step_index: stepIndex,
      question,
      photo_path,
    });
  }
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="card">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{items.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

function Step({
  index,
  step,
  checked,
  onToggle,
  ask,
}: {
  index: number;
  step: Guide["steps"][number];
  checked: boolean;
  onToggle: () => void;
  ask: (q: string, photo: File | null) => Promise<{ answer: string; should_stop: boolean }>;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [reply, setReply] = useState<{ answer: string; should_stop: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      setReply(await ask(question, photo));
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`card space-y-3 ${checked ? "opacity-60" : ""}`}>
      <label className="flex cursor-pointer gap-3">
        <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 h-5 w-5 accent-orange-600" />
        <span>
          <span className="font-semibold">{index + 1}. {step.title}</span>
          <span className="mt-1 block text-sm">{step.detail}</span>
          {step.caution && <span className="mt-1 block text-sm font-medium text-amber-700 dark:text-amber-300">⚠ {step.caution}</span>}
        </span>
      </label>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-orange-600">
          I&apos;m stuck on this step
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
          <textarea required minLength={2} rows={2} className="input" placeholder="What's happening? e.g. the bolt won't turn" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="block text-sm" />
          <button className="btn-secondary" disabled={busy}>{busy ? "Thinking…" : "Ask"}</button>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {reply && (
            <div className={`rounded-xl p-3 text-sm ${reply.should_stop ? "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100" : "bg-neutral-100 dark:bg-neutral-800"}`}>
              {reply.should_stop && <p className="font-semibold">Stop here and take it to a shop.</p>}
              <p className="whitespace-pre-line">{reply.answer}</p>
            </div>
          )}
        </form>
      )}
    </li>
  );
}
