"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Measurement, MetricConfig } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: Measurement[];
  metric: MetricConfig;
}

export function MetricLineChart({ data, metric }: Props) {
  const chartData = data.map((m) => ({
    date: format(parseISO(m.date), "dd MMM"),
    value: m[metric.key] as number,
  }));

  const values = chartData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.2 || 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.label}
          {metric.unit && <span className="ml-1 text-xs">({metric.unit})</span>}
        </CardTitle>
        <p className="text-2xl font-bold text-indigo-500">
          {chartData[chartData.length - 1]?.value ?? "—"}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
            />
            <YAxis
              domain={[min - padding, max + padding]}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              tickFormatter={(v) => Number(v.toPrecision(4)).toString()}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: "8px" }}
              formatter={(val) => [`${val} ${metric.unit}`, metric.label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: "#6366f1" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
