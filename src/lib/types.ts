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
  decimals: number;
}

export const METRIC_CONFIGS: MetricConfig[] = [
  { key: "weight",                  label: "Weight",               unit: "Kg",       color: "#6366f1", decimals: 2 },
  { key: "bmi",                     label: "BMI",                  unit: "",         color: "#f59e0b", decimals: 1 },
  { key: "fatPercent",              label: "Fat %",                unit: "%",        color: "#ef4444", decimals: 1 },
  { key: "bodyFatWeight",           label: "Body Fat Weight",      unit: "Kg",       color: "#f97316", decimals: 1 },
  { key: "skeletalMuscleMassPercent", label: "Skeletal Muscle Mass %", unit: "%",   color: "#10b981", decimals: 1 },
  { key: "skeletalMuscleWeight",    label: "Skeletal Muscle Weight", unit: "Kg",    color: "#14b8a6", decimals: 1 },
  { key: "musclePercent",           label: "Muscle %",             unit: "%",        color: "#22c55e", decimals: 1 },
  { key: "muscleWeight",            label: "Muscle Weight",        unit: "Kg",       color: "#84cc16", decimals: 1 },
  { key: "vFat",                    label: "Visceral Fat",         unit: "",         color: "#a855f7", decimals: 1 },
  { key: "waterPercent",            label: "Water %",              unit: "%",        color: "#3b82f6", decimals: 1 },
  { key: "weightOfWater",           label: "Water Weight",         unit: "Kg",       color: "#60a5fa", decimals: 1 },
  { key: "metabolism",              label: "Metabolism",           unit: "kcal/day", color: "#f59e0b", decimals: 1 },
  { key: "obesityDegree",           label: "Obesity Degree",       unit: "%",        color: "#fb923c", decimals: 1 },
  { key: "boneMass",                label: "Bone Mass",            unit: "Kg",       color: "#94a3b8", decimals: 1 },
  { key: "protein",                 label: "Protein %",            unit: "%",        color: "#8b5cf6", decimals: 1 },
  { key: "weightWithoutFat",        label: "Weight Without Fat",   unit: "Kg",       color: "#0ea5e9", decimals: 1 },
  { key: "bodyAge",                 label: "Body Age",             unit: "yrs",      color: "#ec4899", decimals: 0 },
];

/** Quick lookup: metric key → decimal places */
export const METRIC_DECIMALS: Partial<Record<keyof Measurement, number>> =
  Object.fromEntries(METRIC_CONFIGS.map((c) => [c.key, c.decimals]));

/** Format a metric value to its canonical decimal places. */
export function fmtVal(key: keyof Measurement, value: number): string {
  return value.toFixed(METRIC_DECIMALS[key] ?? 1);
}

export const STATUS_COLORS: Record<MetricStatus, string> = {
  Low: "text-blue-500",
  Healthy: "text-green-500",
  Perfect: "text-emerald-500",
  High: "text-amber-500",
  Obese: "text-red-500",
};
