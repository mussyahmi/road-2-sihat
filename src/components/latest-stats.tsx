"use client";

import { Measurement } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale, Percent, Flame, Droplets, Zap, Bone, Activity,
  Heart, BarChart2
} from "lucide-react";

interface StatRow {
  label: string;
  key: keyof Measurement;
  unit: string;
  icon: React.ReactNode;
}

const STATS: StatRow[] = [
  { label: "Weight", key: "weight", unit: "Kg", icon: <Scale className="h-4 w-4" /> },
  { label: "BMI", key: "bmi", unit: "", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Fat %", key: "fatPercent", unit: "%", icon: <Percent className="h-4 w-4" /> },
  { label: "Body Fat Weight", key: "bodyFatWeight", unit: "Kg", icon: <Scale className="h-4 w-4" /> },
  { label: "Skeletal Muscle %", key: "skeletalMuscleMassPercent", unit: "%", icon: <Activity className="h-4 w-4" /> },
  { label: "Skeletal Muscle Wt", key: "skeletalMuscleWeight", unit: "Kg", icon: <Activity className="h-4 w-4" /> },
  { label: "Muscle %", key: "musclePercent", unit: "%", icon: <Activity className="h-4 w-4" /> },
  { label: "Muscle Weight", key: "muscleWeight", unit: "Kg", icon: <Activity className="h-4 w-4" /> },
  { label: "Visceral Fat", key: "vFat", unit: "", icon: <Heart className="h-4 w-4" /> },
  { label: "Water %", key: "waterPercent", unit: "%", icon: <Droplets className="h-4 w-4" /> },
  { label: "Water Weight", key: "weightOfWater", unit: "Kg", icon: <Droplets className="h-4 w-4" /> },
  { label: "Metabolism", key: "metabolism", unit: "kcal/d", icon: <Flame className="h-4 w-4" /> },
  { label: "Obesity Degree", key: "obesityDegree", unit: "%", icon: <Percent className="h-4 w-4" /> },
  { label: "Bone Mass", key: "boneMass", unit: "Kg", icon: <Bone className="h-4 w-4" /> },
  { label: "Protein %", key: "protein", unit: "%", icon: <Zap className="h-4 w-4" /> },
  { label: "Weight w/o Fat", key: "weightWithoutFat", unit: "Kg", icon: <Scale className="h-4 w-4" /> },
  { label: "Body Age", key: "bodyAge", unit: "yrs", icon: <Heart className="h-4 w-4" /> },
];

interface Props {
  current: Measurement;
  previous?: Measurement;
}

export function LatestStats({ current, previous }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {STATS.map((s) => {
        const val = current[s.key] as number;
        const prevVal = previous ? (previous[s.key] as number) : undefined;
        const delta = prevVal !== undefined ? val - prevVal : null;

        return (
          <Card key={s.key} className="p-3">
            <CardContent className="p-0">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                {s.icon}
                <span className="text-xs">{s.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold">
                  {val}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">{s.unit}</span>
                </span>
                {delta !== null && (
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 ${
                      delta < 0 && ["fatPercent", "bodyFatWeight", "bmi", "vFat", "obesityDegree", "bodyAge"].includes(s.key)
                        ? "border-green-500 text-green-500"
                        : delta > 0 && ["fatPercent", "bodyFatWeight", "bmi", "vFat", "obesityDegree", "bodyAge"].includes(s.key)
                        ? "border-red-500 text-red-500"
                        : delta > 0
                        ? "border-green-500 text-green-500"
                        : delta < 0
                        ? "border-red-500 text-red-500"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
