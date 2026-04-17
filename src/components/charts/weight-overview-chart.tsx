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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: Measurement[];
}

export function WeightOverviewChart({ data }: Props) {
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), "dd MMM"),
    weight: m.weight,
    fatWeight: m.bodyFatWeight,
    muscleWeight: m.muscleWeight,
    waterWeight: m.weightOfWater,
  }));

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const diff = latest && prev ? (latest.weight - prev.weight).toFixed(2) : null;

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Weight Trend</CardTitle>
            <p className="text-muted-foreground text-sm mt-0.5">Body weight over time</p>
          </div>
          {latest && (
            <div className="text-right">
              <p className="text-3xl font-bold">{latest.weight} <span className="text-base font-normal text-muted-foreground">Kg</span></p>
              {diff !== null && (
                <p className={`text-sm font-medium ${parseFloat(diff) < 0 ? "text-green-500" : parseFloat(diff) > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {parseFloat(diff) > 0 ? "+" : ""}{diff} from last
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => Number(v.toPrecision(4)).toString()} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: "8px" }} />
            <Area type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} fill="url(#weightGrad)" name="Weight" />
            <Area type="monotone" dataKey="muscleWeight" stroke="#22c55e" strokeWidth={2} fill="url(#muscleGrad)" name="Muscle" />
            <Area type="monotone" dataKey="fatWeight" stroke="#ef4444" strokeWidth={2} fill="url(#fatGrad)" name="Fat" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-indigo-500 inline-block" /> Weight</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-green-500 inline-block" /> Muscle</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-red-500 inline-block" /> Fat</span>
        </div>
      </CardContent>
    </Card>
  );
}
