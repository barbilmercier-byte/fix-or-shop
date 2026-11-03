"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { callFunction, uploadPhoto } from "@/lib/functions";

const WHEN = [
  "When starting",
  "When idling",
  "When accelerating",
  "While braking",
  "When turning",
  "At highway speed",
  "Over bumps",
  "When cold",
  "When warmed up",
  "All the time",
];
const SOUNDS = ["Squeal", "Grinding", "Clunk", "Knocking", "Clicking", "Rattle", "Whine", "Hiss", "Humming"];

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              on ? "border-orange-600 bg-orange-600 text-white" : "border-black/15 dark:border-white/15"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function DiagnoseForm({ vehicleId, userId }: { vehicleId: string; userId: string }) {
  const router = useRouter();
  const [symptom, setSymptom] = useState("");
  const [when, setWhen] = useState<string[]>([]);
  const [sounds, setSounds] = useState<string[]>([]);
  const [lights, setLights] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState<"" | "uploading" | "thinking">("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setBusy("uploading");
      const photo_paths = await Promise.all(photos.map((f) => uploadPhoto(userId, f)));
      setBusy("thinking");
      const { id } = await callFunction<{ id: string }>("diagnose", {
        vehicle_id: vehicleId,
        symptom,
        photo_paths,
        context: {
          when: when.length ? when : undefined,
          sounds: sounds.length ? sounds.join(", ") : undefined,
          warning_lights: lights.trim() || undefined,
        },
      });
      router.push(`/diagnoses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy("");
    }
  }

  if (busy) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
        <p className="font-semibold">{busy === "uploading" ? "Uploading photos…" : "Diagnosing…"}</p>
        <p className="text-sm muted">This can take up to a minute. Keep this page open.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className="label" htmlFor="symptom">
          Describe the problem
        </label>
        <textarea
          id="symptom"
          required
          minLength={5}
          maxLength={2000}
          rows={5}
          className="input"
          value={symptom}
          onChange={(e) => setSymptom(e.target.value)}
          placeholder="e.g. High-pitched squeal from the front when I first start the car in the morning. Goes away after a few minutes."
        />
      </div>
      <div className="space-y-2">
        <p className="label">When does it happen?</p>
        <Chips options={WHEN} value={when} onChange={setWhen} />
      </div>
      <div className="space-y-2">
        <p className="label">Any sounds?</p>
        <Chips options={SOUNDS} value={sounds} onChange={setSounds} />
      </div>
      <div>
        <label className="label" htmlFor="lights">
          Warning lights on the dash <span className="font-normal muted">(optional)</span>
        </label>
        <input
          id="lights"
          className="input"
          value={lights}
          onChange={(e) => setLights(e.target.value)}
          placeholder="e.g. check engine light, battery light"
        />
      </div>
      <div className="space-y-2">
        <p className="label">
          Photos <span className="font-normal muted">(up to 3: the area, a leak, a dashboard light)</span>
        </p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 3))}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-200 file:px-3 file:py-2 file:font-medium dark:file:bg-neutral-800"
        />
        {photos.length > 0 && <p className="text-xs muted">{photos.length} photo(s) selected</p>}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
      <button className="btn-primary w-full py-3 text-base">Diagnose</button>
    </form>
  );
}
