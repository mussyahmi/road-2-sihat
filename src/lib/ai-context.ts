import { Measurement } from "./types";

export function buildMeasurementContext(measurements: Measurement[]): Measurement[] {
  if (measurements.length === 0) return [];
  if (measurements.length <= 7) return measurements;

  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last5 = sorted.slice(-5);

  // One entry per calendar month (last entry of each month)
  const monthlyMap = new Map<string, Measurement>();
  for (const m of sorted) {
    monthlyMap.set(m.date.slice(0, 7), m);
  }
  const monthly = Array.from(monthlyMap.values());

  // Merge: first + monthly + last5, deduplicated
  const seen = new Set<string>();
  const result: Measurement[] = [];
  for (const m of [first, ...monthly, ...last5]) {
    const key = m.id ?? m.date;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(m);
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export function serializeMeasurements(measurements: Measurement[]): string {
  return measurements
    .map((m) =>
      [
        `Date: ${m.date}`,
        `Weight: ${m.weight}kg, BMI: ${m.bmi}, Body Age: ${m.bodyAge}yrs`,
        `Fat: ${m.fatPercent}% (${m.bodyFatWeight}kg), Visceral Fat: ${m.vFat}`,
        `Muscle: ${m.musclePercent}% (${m.muscleWeight}kg), Skeletal Muscle: ${m.skeletalMuscleMassPercent}% (${m.skeletalMuscleWeight}kg)`,
        `Water: ${m.waterPercent}% (${m.weightOfWater}kg), Protein: ${m.protein}%`,
        `Bone Mass: ${m.boneMass}kg, Metabolism: ${m.metabolism}kcal/day`,
        `Obesity Degree: ${m.obesityDegree}%, Weight Without Fat: ${m.weightWithoutFat}kg`,
        m.notes ? `Notes: ${m.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n---\n\n");
}
