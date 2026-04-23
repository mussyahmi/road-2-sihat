"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getMeasurements } from "@/lib/firestore";
import { Measurement, METRIC_CONFIGS, fmtVal } from "@/lib/types";
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
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from "lucide-react";

const LOWER_IS_BETTER = new Set([
  "weight",
  "bmi",
  "fatPercent",
  "bodyFatWeight",
  "vFat",
  "obesityDegree",
  "bodyAge",
]);

const LINE_COLOR = "#F5A623";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, unit, metricKey }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="font-data text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className="font-data font-bold text-foreground text-sm">
        {fmtVal(metricKey, payload[0].value)}
        {unit && (
          <span className="text-muted-foreground ml-0.5 font-normal text-xs">{unit}</span>
        )}
      </p>
    </div>
  );
}

export function MetricDetailClient() {
  const { key } = useParams<{ key: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  const metric = METRIC_CONFIGS.find((m) => m.key === key);

  useEffect(() => {
    if (!metric) router.replace("/dashboard");
  }, [metric, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMeasurements(user.uid);
      setMeasurements(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(
    () =>
      measurements.map((m) => ({
        date: format(parseISO(m.date), "dd MMM"),
        fullDate: format(parseISO(m.date), "dd MMM yyyy · HH:mm"),
        value: m[key as keyof Measurement] as number,
        id: m.id,
      })),
    [measurements, key]
  );

  const values = chartData.map((d) => d.value);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const avgVal = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const totalChange = values.length >= 2 ? values[values.length - 1] - values[0] : 0;

  const latest = chartData[chartData.length - 1]?.value;
  const prev = chartData[chartData.length - 2]?.value;
  const delta = latest !== undefined && prev !== undefined ? latest - prev : null;

  const lowerIsBetter = LOWER_IS_BETTER.has(key);
  const isPositiveDelta =
    delta === null ? null : lowerIsBetter ? delta < 0 : delta > 0;
  const isTotalPositive = lowerIsBetter ? totalChange < 0 : totalChange > 0;

  const chartPadding = (maxVal - minVal) * 0.2 || 1;
  const reversedData = useMemo(() => [...chartData].reverse(), [chartData]);

  if (!metric) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-14 w-40" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const mk = key as keyof Measurement;
  const summaryStats = [
    { label: "Minimum", value: fmtVal(mk, minVal), colored: false },
    { label: "Maximum", value: fmtVal(mk, maxVal), colored: false },
    { label: "Average", value: fmtVal(mk, avgVal), colored: false },
    {
      label: "Total Change",
      value: (totalChange > 0 ? "+" : "") + fmtVal(mk, totalChange),
      colored: true,
      positive: isTotalPositive,
      zero: totalChange === 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard"
        className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2 gap-1.5"}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Hero */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2">
          {metric.label}
          {metric.unit ? ` · ${metric.unit}` : ""}
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <span className="font-data text-5xl font-black tracking-tight text-foreground leading-none">
            {latest != null ? fmtVal(mk, latest) : "—"}
          </span>
          {metric.unit && (
            <span className="text-muted-foreground text-xl mb-0.5">{metric.unit}</span>
          )}
          {delta !== null && (
            <span
              className={`mb-0.5 inline-flex items-center gap-1 font-data text-[11px] font-semibold px-2 py-1 rounded-lg ${
                delta === 0
                  ? "bg-muted/60 text-muted-foreground"
                  : isPositiveDelta
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {delta === 0 ? (
                <Minus className="h-3 w-3" />
              ) : isPositiveDelta ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {delta > 0 ? "+" : ""}
              {fmtVal(mk, delta)} vs prev
            </span>
          )}
        </div>
      </div>

      {/* Full chart */}
      <Card className="border-border/60">
        <CardContent className="px-2 pt-5 pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 6"
                stroke="oklch(0.5 0 0 / 8%)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "oklch(0.56 0.01 250)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minVal - chartPadding, maxVal + chartPadding]}
                tick={{ fontSize: 10, fill: "oklch(0.56 0.01 250)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => Number(v.toPrecision(3)).toString()}
              />
              <Tooltip content={<ChartTooltip unit={metric.unit} metricKey={mk} />} />
              <ReferenceLine
                y={avgVal}
                stroke="oklch(0.5 0 0 / 20%)"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: LINE_COLOR }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                {stat.label}
              </p>
              <p
                className={`font-data text-xl font-bold leading-none ${
                  stat.colored
                    ? stat.zero
                      ? "text-muted-foreground"
                      : stat.positive
                      ? "text-emerald-400"
                      : "text-red-400"
                    : "text-foreground"
                }`}
              >
                {stat.value}
                {metric.unit && (
                  <span className="text-xs text-muted-foreground ml-0.5 font-normal">
                    {metric.unit}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History table */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">History</h2>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="px-4 py-3 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {reversedData.map((row, i) => {
                const nextRow = reversedData[i + 1];
                const rowDelta = nextRow ? row.value - nextRow.value : null;
                const rowPositive =
                  rowDelta === null
                    ? null
                    : lowerIsBetter
                    ? rowDelta < 0
                    : rowDelta > 0;
                return (
                  <tr
                    key={row.id ?? `${row.fullDate}-${i}`}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground font-data whitespace-nowrap">
                      {row.fullDate}
                    </td>
                    <td className="px-4 py-3 text-right font-data font-semibold text-foreground">
                      {fmtVal(mk, row.value)}
                      {metric.unit && (
                        <span className="text-xs text-muted-foreground ml-0.5 font-normal">
                          {metric.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rowDelta !== null ? (
                        <span
                          className={`font-data text-xs font-medium ${
                            rowDelta === 0
                              ? "text-muted-foreground"
                              : rowPositive
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {rowDelta > 0 ? "+" : ""}
                          {fmtVal(mk, rowDelta)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
