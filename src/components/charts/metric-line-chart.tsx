"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Measurement, MetricConfig, fmtVal } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useRouter } from "next/navigation";

const LINE_COLOR = "#F5A623"; // amber — consistent accent

interface Props {
  data: Measurement[];
  metric: MetricConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const { value, unit, metricKey } = payload[0].payload;
  return (
    <div className="rounded-md border border-border/60 bg-popover px-2.5 py-1.5 shadow-lg text-xs">
      <p className="font-data text-[10px] text-muted-foreground">{label}</p>
      <p className="font-data font-semibold text-foreground">
        {fmtVal(metricKey, value)}
        {unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

export function MetricLineChart({ data, metric }: Props) {
  const router = useRouter();
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), "dd MMM"),
    value: m[metric.key] as number,
    unit: metric.unit,
    metricKey: metric.key,
  }));

  const values = chartData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.25 || 1;

  const latest = chartData[chartData.length - 1]?.value;
  const prev = chartData[chartData.length - 2]?.value;
  const delta = latest !== undefined && prev !== undefined ? latest - prev : null;

  return (
    <Card
      onClick={() => router.push(`/metric/${metric.key}`)}
      className="border-border/60 hover:border-border/80 hover:shadow-sm cursor-pointer transition-all"
    >
      <CardHeader className="pb-1 pt-4 px-4">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {metric.label}
          {metric.unit && <span className="ml-1 opacity-60">({metric.unit})</span>}
        </p>
        <div className="flex items-end justify-between">
          <p className="font-data text-2xl font-bold text-foreground leading-none mt-1">
            {latest != null ? fmtVal(metric.key, latest) : "—"}
          </p>
          {delta !== null && (
            <span
              className={`inline-flex items-center gap-0.5 font-data text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                delta === 0
                  ? "bg-muted/60 text-muted-foreground"
                  : delta < 0
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "bg-red-500/12 text-red-400"
              }`}
            >
              {delta === 0 ? (
                <Minus className="h-2.5 w-2.5" />
              ) : delta < 0 ? (
                <TrendingDown className="h-2.5 w-2.5" />
              ) : (
                <TrendingUp className="h-2.5 w-2.5" />
              )}
              {delta > 0 ? "+" : ""}{fmtVal(metric.key, delta)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="oklch(0.5 0 0 / 10%)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "oklch(0.56 0.01 250)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[min - padding, max + padding]}
              tick={{ fontSize: 9, fill: "oklch(0.56 0.01 250)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => Number(v.toPrecision(3)).toString()}
            />
            <Tooltip content={<MiniTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={LINE_COLOR}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: LINE_COLOR }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
