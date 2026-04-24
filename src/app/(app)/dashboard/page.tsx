"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getMeasurements } from "@/lib/firestore";
import { Measurement, METRIC_CONFIGS, fmtVal } from "@/lib/types";
import { WeightOverviewChart } from "@/components/charts/weight-overview-chart";
import { MetricLineChart } from "@/components/charts/metric-line-chart";
import { LatestStats } from "@/components/latest-stats";
import { ComparisonPanel } from "@/components/comparison-panel";
import { AiInsight } from "@/components/ai-insight";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Pencil, GitCompare, X } from "lucide-react";
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

  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  function toggleCompareMode() {
    setCompareMode((v) => !v);
    setSelectedIds([]);
    setShowComparison(false);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev; // cap at 2
      return [...prev, id];
    });
  }

  const compareEntries = useMemo(() => {
    if (selectedIds.length !== 2) return null;
    const a = measurements.find((m) => m.id === selectedIds[0]);
    const b = measurements.find((m) => m.id === selectedIds[1]);
    return a && b ? { a, b } : null;
  }, [selectedIds, measurements]);

  const selectedMeasurements = useMemo(
    () => selectedIds.map((id) => measurements.find((m) => m.id === id)).filter(Boolean) as Measurement[],
    [selectedIds, measurements],
  );

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
      </div>

      <Tabs defaultValue="overview" onValueChange={(v) => { if (v !== "history" && compareMode) { setCompareMode(false); setSelectedIds([]); setShowComparison(false); } }}>
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs px-4">Overview</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs px-4">All Charts</TabsTrigger>
          <TabsTrigger value="history" className="text-xs px-4">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5 mt-5">
          <AiInsight measurements={measurements} />
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

        <TabsContent value="history" className={`mt-5 ${compareMode ? "pb-24" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              {reversedMeasurements.length} entr{reversedMeasurements.length !== 1 ? "ies" : "y"}
            </p>
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={toggleCompareMode}
            >
              {compareMode ? (
                <>
                  <X className="h-3 w-3" />
                  Cancel
                </>
              ) : (
                <>
                  <GitCompare className="h-3 w-3" />
                  Compare
                </>
              )}
            </Button>
          </div>


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
                {reversedMeasurements.map((m) => {
                  const dateStr = format(parseISO(m.date), "dd MMM yyyy");
                  const isSelected = selectedIds.includes(m.id!);
                  const isDisabled = compareMode && selectedIds.length >= 2 && !isSelected;
                  return (
                    <tr
                      key={m.id}
                      onClick={compareMode && m.id ? () => toggleSelect(m.id!) : undefined}
                      className={[
                        "border-b border-border/40 last:border-0 transition-colors",
                        compareMode ? "cursor-pointer" : "",
                        isSelected
                          ? "bg-primary/8 border-l-2 border-l-primary"
                          : compareMode
                            ? isDisabled
                              ? "opacity-40"
                              : "hover:bg-muted/20"
                            : "hover:bg-muted/20",
                      ].join(" ")}
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
                        {compareMode ? (
                          <div className={[
                            "h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-colors ml-auto",
                            isSelected ? "bg-primary border-primary" : "border-border",
                          ].join(" ")}>
                            {isSelected && (
                              <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={`/edit?id=${m.id}`}
                            className={buttonVariants({ variant: "ghost", size: "icon" }) + " h-7 w-7"}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="h-3 w-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </TabsContent>
      </Tabs>

      {!compareMode && (
        <Link
          href="/add"
          className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 4px 24px oklch(0.78 0.155 75 / 30%)" }}
          aria-label="Add Entry"
        >
          <Plus className="h-5 w-5" />
        </Link>
      )}

      {compareMode && (
        <div
          className="fixed left-1/2 z-40"
          style={{ bottom: "24px", transform: "translateX(-50%)" }}
        >
        <div
          className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
          style={{
            animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
            background: "color-mix(in oklch, var(--popover) 95%, transparent)",
            backdropFilter: "blur(16px) saturate(1.4)",
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
            border: "1px solid var(--border)",
            borderLeft: "2px solid var(--primary)",
            boxShadow: "0 8px 32px oklch(0 0 0 / 0.12)",
            whiteSpace: "nowrap",
            minWidth: selectedIds.length < 2 ? "260px" : undefined,
            justifyContent: selectedIds.length < 2 ? "center" : undefined,
          }}
        >
          {selectedIds.length < 2 ? (
            <>
              <span className="flex gap-1 shrink-0">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${selectedIds.length >= 1 ? "bg-primary" : "bg-border"}`} />
                <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${selectedIds.length >= 2 ? "bg-primary" : "bg-border"}`} />
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedIds.length === 0 ? "Select two entries to compare" : "Select one more entry"}
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-data font-medium">
                {format(parseISO(selectedMeasurements[0].date), "d MMM")}
              </span>
              <span className="text-[10px] text-muted-foreground/40">↔</span>
              <span className="text-xs font-data font-medium">
                {format(parseISO(selectedMeasurements[1].date), "d MMM")}
              </span>
              <button
                onClick={() => setShowComparison(true)}
                className="ml-1 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                  letterSpacing: "-0.01em",
                }}
              >
                <GitCompare className="h-3 w-3" />
                Compare
              </button>
            </>
          )}
        </div>
        </div>
      )}

      {showComparison && compareEntries && (
        <ComparisonPanel
          a={compareEntries.a}
          b={compareEntries.b}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
