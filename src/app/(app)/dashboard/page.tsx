"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getMeasurements } from "@/lib/firestore";
import { Measurement, METRIC_CONFIGS, fmtVal } from "@/lib/types";
import { WeightOverviewChart } from "@/components/charts/weight-overview-chart";
import { MetricLineChart } from "@/components/charts/metric-line-chart";
import { LatestStats } from "@/components/latest-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Plus, RefreshCw, Pencil } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

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

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];
  const reversedMeasurements = useMemo(() => [...measurements].reverse(), [measurements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full rounded-md" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 17 }).map((_, i) => (
            <Card key={i} className="p-3">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5 text-center">
        <div className="rounded-full border border-border/50 bg-muted/30 p-5">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold">No measurements yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first entry to start tracking progress</p>
        </div>
        <Link href="/add" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-data">
            {latest ? format(parseISO(latest.date), "dd MMM yyyy · HH:mm") : "—"}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={fetchData}
          title="Refresh data"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs px-4">Overview</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs px-4">All Charts</TabsTrigger>
          <TabsTrigger value="history" className="text-xs px-4">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5 mt-5">
          <WeightOverviewChart data={measurements} />
          {latest && <LatestStats current={latest} previous={previous} />}
        </TabsContent>

        <TabsContent value="charts" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {METRIC_CONFIGS.map((metric) => (
              <MetricLineChart key={metric.key} data={measurements} metric={metric} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <div className="rounded-xl border border-border/60 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Weight</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">BMI</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Fat %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Muscle %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Water %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Body Age</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {reversedMeasurements.map((m, i) => {
                  const dateStr = format(parseISO(m.date), "dd MMM yyyy");
                  return (
                  <tr
                    key={m.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-data">
                      {dateStr}
                    </td>
                    <td className="px-4 py-3 text-right font-data text-sm font-semibold">{fmtVal("weight", m.weight)}<span className="text-xs text-muted-foreground ml-0.5 font-sans font-normal">kg</span></td>
                    <td className="px-4 py-3 text-right font-data text-xs text-muted-foreground">{fmtVal("bmi", m.bmi)}</td>
                    <td className="px-4 py-3 text-right font-data text-xs text-muted-foreground">{fmtVal("fatPercent", m.fatPercent)}%</td>
                    <td className="px-4 py-3 text-right font-data text-xs text-muted-foreground">{fmtVal("musclePercent", m.musclePercent)}%</td>
                    <td className="px-4 py-3 text-right font-data text-xs text-muted-foreground">{fmtVal("waterPercent", m.waterPercent)}%</td>
                    <td className="px-4 py-3 text-right font-data text-xs text-muted-foreground">{fmtVal("bodyAge", m.bodyAge)}<span className="text-[10px] text-muted-foreground/60 ml-0.5 font-sans">yr</span></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/edit?id=${m.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon" }) + " h-7 w-7"}
                      >
                        <Pencil className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
