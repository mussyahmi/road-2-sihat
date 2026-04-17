"use client";

import { Measurement } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scale, Percent, Flame, Droplets, Zap, Bone, Activity,
  Heart, BarChart2, TrendingDown, TrendingUp, Minus
} from "lucide-react";

interface StatRow {
  label: string;
  key: keyof Measurement;
  unit: string;
  icon: React.ReactNode;
  /** Lower is better for these keys */
  lowerIsBetter?: boolean;
}

const STATS: StatRow[] = [
  { label: "Weight", key: "weight", unit: "kg", icon: <Scale className="h-3.5 w-3.5" /> },
  { label: "BMI", key: "bmi", unit: "", icon: <BarChart2 className="h-3.5 w-3.5" />, lowerIsBetter: true },
  { label: "Fat %", key: "fatPercent", unit: "%", icon: <Percent className="h-3.5 w-3.5" />, lowerIsBetter: true },
  { label: "Body Fat", key: "bodyFatWeight", unit: "kg", icon: <Scale className="h-3.5 w-3.5" />, lowerIsBetter: true },
  { label: "Skeletal Muscle %", key: "skeletalMuscleMassPercent", unit: "%", icon: <Activity className="h-3.5 w-3.5" /> },
  { label: "Skeletal Muscle", key: "skeletalMuscleWeight", unit: "kg", icon: <Activity className="h-3.5 w-3.5" /> },
  { label: "Muscle %", key: "musclePercent", unit: "%", icon: <Activity className="h-3.5 w-3.5" /> },
  { label: "Muscle Weight", key: "muscleWeight", unit: "kg", icon: <Activity className="h-3.5 w-3.5" /> },
  { label: "Visceral Fat", key: "vFat", unit: "", icon: <Heart className="h-3.5 w-3.5" />, lowerIsBetter: true },
  { label: "Water %", key: "waterPercent", unit: "%", icon: <Droplets className="h-3.5 w-3.5" /> },
  { label: "Water Weight", key: "weightOfWater", unit: "kg", icon: <Droplets className="h-3.5 w-3.5" /> },
  { label: "Metabolism", key: "metabolism", unit: "kcal/d", icon: <Flame className="h-3.5 w-3.5" /> },
  { label: "Obesity Degree", key: "obesityDegree", unit: "%", icon: <Percent className="h-3.5 w-3.5" />, lowerIsBetter: true },
  { label: "Bone Mass", key: "boneMass", unit: "kg", icon: <Bone className="h-3.5 w-3.5" /> },
  { label: "Protein %", key: "protein", unit: "%", icon: <Zap className="h-3.5 w-3.5" /> },
  { label: "Lean Mass", key: "weightWithoutFat", unit: "kg", icon: <Scale className="h-3.5 w-3.5" /> },
  { label: "Body Age", key: "bodyAge", unit: "yrs", icon: <Heart className="h-3.5 w-3.5" />, lowerIsBetter: true },
];

interface Props {
  current: Measurement;
  previous?: Measurement;
}

export function LatestStats({ current, previous }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
      {STATS.map((s) => {
        const val = current[s.key] as number;
        const prevVal = previous ? (previous[s.key] as number) : undefined;
        const delta = prevVal !== undefined ? val - prevVal : null;

        const isPositive =
          delta === null
            ? null
            : s.lowerIsBetter
            ? delta < 0
            : delta > 0;

        const isNeutral = delta === 0;

        return (
          <Card
            key={s.key}
            className="p-3 border-border/60 hover:border-border/80 transition-colors"
          >
            <CardContent className="p-0">
              {/* Label row */}
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                {s.icon}
                <span className="text-[11px] font-medium leading-none">{s.label}</span>
              </div>

              {/* Value + delta */}
              <div className="flex items-end justify-between gap-1">
                <div className="leading-none">
                  <span className="font-data text-lg font-bold text-foreground">{val}</span>
                  {s.unit && (
                    <span className="text-[10px] text-muted-foreground ml-0.5">{s.unit}</span>
                  )}
                </div>

                {delta !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-data font-semibold px-1.5 py-0.5 rounded-md ${
                      isNeutral
                        ? "bg-muted/60 text-muted-foreground"
                        : isPositive
                        ? "bg-emerald-500/12 text-emerald-400"
                        : "bg-red-500/12 text-red-400"
                    }`}
                  >
                    {isNeutral ? (
                      <Minus className="h-2.5 w-2.5" />
                    ) : isPositive ? (
                      <TrendingDown className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingUp className="h-2.5 w-2.5" />
                    )}
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
