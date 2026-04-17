"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Measurement } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Props {
  data: Measurement[];
}

// Amber, teal, rose — the three body composition pillars
const WEIGHT_COLOR = "#F5A623";   // amber
const MUSCLE_COLOR = "#2DD4BF";   // teal
const FAT_COLOR    = "#F87171";   // rose-red

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover p-3 shadow-xl text-xs min-w-[140px]">
      <p className="font-data text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-data font-semibold text-foreground">{entry.value} kg</span>
        </div>
      ))}
    </div>
  );
}

export function WeightOverviewChart({ data }: Props) {
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), "dd MMM"),
    weight: m.weight,
    fatWeight: m.bodyFatWeight,
    muscleWeight: m.muscleWeight,
  }));

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const diffNum = latest && prev ? latest.weight - prev.weight : null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight Trend</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Body weight over time</p>
          </div>
          {latest && (
            <div className="text-right shrink-0">
              <p className="font-data text-3xl font-bold leading-none">
                {latest.weight}
                <span className="text-sm font-sans font-normal text-muted-foreground ml-1">kg</span>
              </p>
              {diffNum !== null && (
                <p
                  className={`font-data text-xs font-semibold mt-1 ${
                    diffNum < 0 ? "text-emerald-400" : diffNum > 0 ? "text-red-400" : "text-muted-foreground"
                  }`}
                >
                  {diffNum > 0 ? "+" : ""}{diffNum.toFixed(2)} from last
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={WEIGHT_COLOR} stopOpacity={0.25} />
                <stop offset="95%" stopColor={WEIGHT_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={MUSCLE_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={MUSCLE_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={FAT_COLOR} stopOpacity={0.2} />
                <stop offset="95%" stopColor={FAT_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="oklch(0.5 0 0 / 10%)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "oklch(0.56 0.01 250)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "oklch(0.56 0.01 250)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => Number(v.toPrecision(4)).toString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="weight"
              stroke={WEIGHT_COLOR}
              strokeWidth={2}
              fill="url(#weightGrad)"
              name="Weight"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: WEIGHT_COLOR }}
            />
            <Area
              type="monotone"
              dataKey="muscleWeight"
              stroke={MUSCLE_COLOR}
              strokeWidth={1.5}
              fill="url(#muscleGrad)"
              name="Muscle"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: MUSCLE_COLOR }}
            />
            <Area
              type="monotone"
              dataKey="fatWeight"
              stroke={FAT_COLOR}
              strokeWidth={1.5}
              fill="url(#fatGrad)"
              name="Fat"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: FAT_COLOR }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-5 mt-3 px-1">
          {[
            { label: "Weight", color: WEIGHT_COLOR },
            { label: "Muscle", color: MUSCLE_COLOR },
            { label: "Fat",    color: FAT_COLOR },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full inline-block"
                style={{ background: l.color }}
              />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
