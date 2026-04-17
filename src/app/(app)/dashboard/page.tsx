"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getMeasurements } from "@/lib/firestore";
import { Measurement, METRIC_CONFIGS } from "@/lib/types";
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

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMeasurements(user.uid);
      setMeasurements(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>

        {/* Tabs bar */}
        <Skeleton className="h-9 w-72 rounded-lg" />

        {/* Weight overview chart card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[220px] w-full rounded-md" />
            <div className="flex gap-4 mt-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </CardContent>
        </Card>

        {/* Latest stats grid — mirrors 2/3/4 col layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 17 }).map((_, i) => (
            <Card key={i} className="p-3">
              <CardContent className="p-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex items-end justify-between">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (measurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <p className="text-lg font-medium">No measurements yet</p>
        <p className="text-muted-foreground text-sm">Add your first entry to start tracking your progress</p>
        <Link href="/add" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {latest ? format(parseISO(latest.date), "dd MMM yyyy, HH:mm") : "—"}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">All Charts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <WeightOverviewChart data={measurements} />
          </div>
          {latest && <LatestStats current={latest} previous={previous} />}
        </TabsContent>

        {/* All Charts Tab */}
        <TabsContent value="charts" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {METRIC_CONFIGS.map((metric) => (
              <MetricLineChart key={metric.key} data={measurements} metric={metric} />
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Weight</th>
                  <th className="px-4 py-3 text-right font-medium">BMI</th>
                  <th className="px-4 py-3 text-right font-medium">Fat %</th>
                  <th className="px-4 py-3 text-right font-medium">Muscle %</th>
                  <th className="px-4 py-3 text-right font-medium">Water %</th>
                  <th className="px-4 py-3 text-right font-medium">Body Age</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m) => (
                  <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(parseISO(m.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{m.weight} Kg</td>
                    <td className="px-4 py-3 text-right">{m.bmi}</td>
                    <td className="px-4 py-3 text-right">{m.fatPercent}%</td>
                    <td className="px-4 py-3 text-right">{m.musclePercent}%</td>
                    <td className="px-4 py-3 text-right">{m.waterPercent}%</td>
                    <td className="px-4 py-3 text-right">{m.bodyAge} yrs</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/edit?id=${m.id}`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
