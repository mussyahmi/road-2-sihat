"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { addMeasurement } from "@/lib/firestore";
import { Measurement } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Sparkles, Copy, Check, ChevronDown, ChevronUp, ClipboardPaste } from "lucide-react";
import Link from "next/link";
import { inputClass } from "@/lib/styles";

const AI_PROMPT = `Extract the body composition data from this scale screenshot and return ONLY a valid JSON object — no explanation, no markdown, no code block.

Use exactly these keys (all numbers, except date which is an ISO string like "2026-04-17T07:11:00"):

{
  "date": "YYYY-MM-DDTHH:MM:00",
  "weight": 0,
  "bmi": 0,
  "fatPercent": 0,
  "bodyFatWeight": 0,
  "skeletalMuscleMassPercent": 0,
  "skeletalMuscleWeight": 0,
  "musclePercent": 0,
  "muscleWeight": 0,
  "vFat": 0,
  "waterPercent": 0,
  "weightOfWater": 0,
  "metabolism": 0,
  "obesityDegree": 0,
  "boneMass": 0,
  "protein": 0,
  "weightWithoutFat": 0,
  "bodyAge": 0,
  "height": 0
}

Rules:
- Fill in the date from the timestamp shown on the screenshot. If no date is visible, use today's date.
- For any metric not visible in the screenshot, use 0.
- Return only the raw JSON, nothing else.`;

type FormData = Omit<Measurement, "id">;

function localDateValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function localTimeValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const EMPTY_FORM: FormData = {
  date: "",
  weight: 0,
  bmi: 0,
  fatPercent: 0,
  bodyFatWeight: 0,
  skeletalMuscleMassPercent: 0,
  skeletalMuscleWeight: 0,
  musclePercent: 0,
  muscleWeight: 0,
  vFat: 0,
  waterPercent: 0,
  weightOfWater: 0,
  metabolism: 0,
  obesityDegree: 0,
  boneMass: 0,
  protein: 0,
  weightWithoutFat: 0,
  bodyAge: 0,
  height: 0,
  notes: "",
};

interface FieldConfig {
  key: keyof FormData;
  label: string;
  unit: string;
  step: number;
}

const FIELDS: FieldConfig[] = [
  { key: "weight", label: "Weight", unit: "Kg", step: 0.01 },
  { key: "bmi", label: "BMI", unit: "", step: 0.1 },
  { key: "fatPercent", label: "Fat %", unit: "%", step: 0.1 },
  { key: "bodyFatWeight", label: "Body Fat Weight", unit: "Kg", step: 0.1 },
  { key: "skeletalMuscleMassPercent", label: "Skeletal Muscle Mass %", unit: "%", step: 0.1 },
  { key: "skeletalMuscleWeight", label: "Skeletal Muscle Weight", unit: "Kg", step: 0.1 },
  { key: "musclePercent", label: "Muscle %", unit: "%", step: 0.1 },
  { key: "muscleWeight", label: "Muscle Weight", unit: "Kg", step: 0.1 },
  { key: "vFat", label: "Visceral Fat", unit: "", step: 0.1 },
  { key: "waterPercent", label: "Water %", unit: "%", step: 0.1 },
  { key: "weightOfWater", label: "Water Weight", unit: "Kg", step: 0.1 },
  { key: "metabolism", label: "Metabolism", unit: "kcal/day", step: 0.1 },
  { key: "obesityDegree", label: "Obesity Degree %", unit: "%", step: 0.1 },
  { key: "boneMass", label: "Bone Mass", unit: "Kg", step: 0.1 },
  { key: "protein", label: "Protein %", unit: "%", step: 0.1 },
  { key: "weightWithoutFat", label: "Weight Without Fat", unit: "Kg", step: 0.1 },
  { key: "bodyAge", label: "Body Age", unit: "yrs", step: 1 },
  { key: "height", label: "Height", unit: "cm", step: 0.1 },
];

export default function AddPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormData>(() => ({ ...EMPTY_FORM, date: `${localDateValue()}T${localTimeValue()}` }));
  const [dateInput, setDateInput] = useState(localDateValue);
  const [timeInput, setTimeInput] = useState(localTimeValue);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [applied, setApplied] = useState(false);

  const applyParsed = useCallback((parsed: Record<string, unknown>) => {
    const allowed = new Set<string>([
      "date","weight","bmi","fatPercent","bodyFatWeight","skeletalMuscleMassPercent",
      "skeletalMuscleWeight","musclePercent","muscleWeight","vFat","waterPercent",
      "weightOfWater","metabolism","obesityDegree","boneMass","protein",
      "weightWithoutFat","bodyAge","height","notes",
    ]);
    const update: Partial<FormData> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (allowed.has(k)) (update as Record<string, unknown>)[k] = v;
    }
    setForm((prev) => ({ ...prev, ...update }));
    if (update.date) {
      const [d, t] = (update.date as string).split("T");
      if (d) setDateInput(d);
      if (t) setTimeInput(t.slice(0, 5));
    }
    setApplied(true);
    setAiOpen(false);
  }, []);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      const text = (e.clipboardData?.getData("text") ?? "").replace(/[\u201C\u201D\u2018\u2019]/g, (c) => c === "\u2018" || c === "\u2019" ? "'" : '"');
      try {
        const parsed = JSON.parse(text.trim());
        if (typeof parsed === "object" && parsed !== null && ("weight" in parsed || "date" in parsed)) {
          e.preventDefault();
          applyParsed(parsed);
        }
      } catch { /* not JSON, ignore */ }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [applyParsed]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizeJson = (text: string) =>
    text
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "")
      .trim()
      .replace(/[\u201C\u201D\u2018\u2019]/g, (c) =>
        c === "\u2018" || c === "\u2019" ? "'" : '"'
      );

  const applyJson = () => {
    setJsonError("");
    setApplied(false);
    try {
      applyParsed(JSON.parse(normalizeJson(jsonInput)));
    } catch {
      setJsonError("Invalid JSON — paste only the raw JSON returned by the AI.");
    }
  };

  const set = (key: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setDate = (d: string) => {
    setDateInput(d);
    setForm((prev) => ({ ...prev, date: `${d}T${timeInput}` }));
  };

  const setTime = (t: string) => {
    setTimeInput(t);
    setForm((prev) => ({ ...prev, date: `${dateInput}T${t}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const dateStr = form.date.length === 16 ? `${form.date}:00` : form.date;
      await addMeasurement(user.uid, { ...form, date: dateStr });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      <div className="flex items-center gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" }) + " h-8 w-8"}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Add Measurement</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Log your body composition data</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground px-1">
        Tip: paste a JSON measurement object anywhere on this page to auto-fill the form.
      </div>

      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20">
        <button
          type="button"
          onClick={() => setAiOpen((o) => !o)}
          className="flex items-center justify-between w-full px-4 py-3 text-left rounded-xl hover:bg-muted/20 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Import via AI
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Optional</Badge>
          </span>
          {aiOpen
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {aiOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
            <p className="text-xs text-muted-foreground">
              Copy the prompt, paste into Claude or ChatGPT with your scale screenshot, then paste the JSON response below.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={copyPrompt} className="w-full gap-2 h-8 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Prompt copied!" : "Copy AI prompt"}
            </Button>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Paste JSON response</label>
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); setApplied(false); }}
                placeholder={'{\n  "date": "2026-04-17T07:11:00",\n  "weight": 69.05,\n  ...\n}'}
                rows={5}
                className={`${inputClass} font-mono text-xs resize-none`}
              />
              {jsonError && <p className="text-xs text-red-400">{jsonError}</p>}
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full gap-2 h-8 text-xs"
              onClick={applyJson}
              disabled={!jsonInput.trim()}
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Apply to form
            </Button>
          </div>
        )}
      </div>

      {applied && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 px-1">
          <Check className="h-3.5 w-3.5" />
          Form filled from AI — review and save
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date &amp; Time</h2>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Required</Badge>
          </div>
          <div className="flex gap-2.5">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDate(e.target.value)}
              className={`${inputClass} flex-1`}
              required
            />
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTime(e.target.value)}
              className={`${inputClass} w-32`}
              required
            />
          </div>
        </section>

        <div className="border-t border-border/40" />

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Body Metrics</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">
                  {field.label}
                  {field.unit && <span className="ml-1 opacity-60">({field.unit})</span>}
                </label>
                <input
                  type="number"
                  step={field.step}
                  min={0}
                  value={form[field.key] as number}
                  onChange={(e) => set(field.key, parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-border/40" />

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. After morning workout, fasted..."
            rows={3}
            className={`${inputClass} resize-none font-sans`}
          />
        </section>

        <Button type="submit" className="w-full h-11 gap-2 font-semibold" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Measurement
            </>
          )}
        </Button>

      </form>
    </div>
  );
}
