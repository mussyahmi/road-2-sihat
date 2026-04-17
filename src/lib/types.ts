export interface Measurement {
  id?: string;
  date: string; // ISO string e.g. "2026-04-17T07:11:00"
  weight: number;
  bmi: number;
  fatPercent: number;
  bodyFatWeight: number;
  skeletalMuscleMassPercent: number;
  skeletalMuscleWeight: number;
  musclePercent: number;
  muscleWeight: number;
  vFat: number;
  waterPercent: number;
  weightOfWater: number;
  metabolism: number;
  obesityDegree: number;
  boneMass: number;
  protein: number;
  weightWithoutFat: number;
  bodyAge: number;
  height: number;
  notes?: string;
}

export type MetricStatus = "Low" | "Healthy" | "High" | "Perfect" | "Obese";

export interface MetricConfig {
  key: keyof Measurement;
  label: string;
  unit: string;
  color: string; // tailwind text color class for chart
}

export const METRIC_CONFIGS: MetricConfig[] = [
  { key: "weight", label: "Weight", unit: "Kg", color: "#6366f1" },
  { key: "bmi", label: "BMI", unit: "", color: "#f59e0b" },
  { key: "fatPercent", label: "Fat %", unit: "%", color: "#ef4444" },
  { key: "bodyFatWeight", label: "Body Fat Weight", unit: "Kg", color: "#f97316" },
  { key: "skeletalMuscleMassPercent", label: "Skeletal Muscle Mass %", unit: "%", color: "#10b981" },
  { key: "skeletalMuscleWeight", label: "Skeletal Muscle Weight", unit: "Kg", color: "#14b8a6" },
  { key: "musclePercent", label: "Muscle %", unit: "%", color: "#22c55e" },
  { key: "muscleWeight", label: "Muscle Weight", unit: "Kg", color: "#84cc16" },
  { key: "vFat", label: "Visceral Fat", unit: "", color: "#a855f7" },
  { key: "waterPercent", label: "Water %", unit: "%", color: "#3b82f6" },
  { key: "weightOfWater", label: "Water Weight", unit: "Kg", color: "#60a5fa" },
  { key: "metabolism", label: "Metabolism", unit: "kcal/day", color: "#f59e0b" },
  { key: "obesityDegree", label: "Obesity Degree", unit: "%", color: "#fb923c" },
  { key: "boneMass", label: "Bone Mass", unit: "Kg", color: "#94a3b8" },
  { key: "protein", label: "Protein %", unit: "%", color: "#8b5cf6" },
  { key: "weightWithoutFat", label: "Weight Without Fat", unit: "Kg", color: "#0ea5e9" },
  { key: "bodyAge", label: "Body Age", unit: "yrs", color: "#ec4899" },
];

export const STATUS_COLORS: Record<MetricStatus, string> = {
  Low: "text-blue-500",
  Healthy: "text-green-500",
  Perfect: "text-emerald-500",
  High: "text-amber-500",
  Obese: "text-red-500",
};
