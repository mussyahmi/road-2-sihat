"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { addMeasurement } from "@/lib/firestore";
import { Measurement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Sparkles, Copy, Check, ChevronDown, ChevronUp, ClipboardPaste } from "lucide-react";
import Link from "next/link";

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
  height: 170,
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
  { key: "metabolism", label: "Metabolism", unit: "kcal/day", step: 1 },
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

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyJson = () => {
    setJsonError("");
    setApplied(false);
    try {
      const parsed = JSON.parse(jsonInput.trim());
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
      // Convert date to full ISO string
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
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Measurement</h1>
          <p className="text-sm text-muted-foreground">Key in your body composition data manually</p>
        </div>
      </div>

      {/* AI Import */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setAiOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Import via AI
              <Badge variant="secondary" className="text-xs">Optional</Badge>
            </CardTitle>
            {aiOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {aiOpen && (
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Copy the prompt below, paste it into Claude or ChatGPT along with your scale screenshot, then paste the JSON response here.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={copyPrompt} className="w-full gap-2">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Prompt copied!" : "Copy AI prompt"}
            </Button>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Paste JSON response here</label>
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(""); setApplied(false); }}
                placeholder={'{\n  "date": "2026-04-17T07:11:00",\n  "weight": 69.05,\n  ...\n}'}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
            </div>
            <Button
              type="button"
              size="sm"
              className="w-full gap-2"
              onClick={applyJson}
              disabled={!jsonInput.trim()}
            >
              <ClipboardPaste className="h-4 w-4" />
              Apply to form
            </Button>
          </CardContent>
        )}
      </Card>

      {applied && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 px-1">
          <Check className="h-4 w-4" />
          Form filled from AI response — review and save.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Date & Time
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTime(e.target.value)}
              className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Body Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {field.label}
                    {field.unit && <span className="ml-1 text-xs">({field.unit})</span>}
                  </label>
                  <input
                    type="number"
                    step={field.step}
                    min={0}
                    value={form[field.key] as number}
                    onChange={(e) => set(field.key, parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Notes (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. After morning workout, fasted..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Measurement
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
