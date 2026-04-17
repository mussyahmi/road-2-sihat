"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getMeasurements, updateMeasurement, deleteMeasurement } from "@/lib/firestore";
import { Measurement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

type FormData = Omit<Measurement, "id">;

const FIELDS: { key: keyof FormData; label: string; unit: string; step: number }[] = [
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

function EditForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [form, setForm] = useState<FormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getMeasurements(user.uid).then((list) => {
      const found = list.find((m) => m.id === id);
      if (!found) { router.push("/dashboard"); return; }
      const { id: _id, ...rest } = found;
      const dateTrimmed = rest.date.length >= 16 ? rest.date.slice(0, 16) : rest.date;
      setForm({ ...rest, date: dateTrimmed });
    });
  }, [user, id]);

  const set = (key: keyof FormData, value: string | number) =>
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form || !id) return;
    setSaving(true);
    try {
      const dateStr = form.date.length === 16 ? `${form.date}:00` : form.date;
      await updateMeasurement(user.uid, id, { ...form, date: dateStr });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteMeasurement(user.uid, id);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Date & Time
              <Badge variant="secondary" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
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
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. After morning workout, fasted..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={saving || deleting}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </form>

      {/* Delete */}
      <Button
        type="button"
        variant={confirmDelete ? "destructive" : "outline"}
        className="w-full gap-2"
        onClick={handleDelete}
        disabled={saving || deleting}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {deleting ? "Deleting..." : confirmDelete ? "Tap again to confirm delete" : "Delete Entry"}
      </Button>

      {confirmDelete && !deleting && (
        <p className="text-xs text-center text-muted-foreground -mt-2">
          This will permanently remove this measurement.{" "}
          <button type="button" className="underline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
        </p>
      )}
    </>
  );
}

export default function EditPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Measurement</h1>
          <p className="text-sm text-muted-foreground">Update or delete this entry</p>
        </div>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }>
        <EditForm />
      </Suspense>
    </div>
  );
}
