"use client";

import { useMemo } from "react";
import { Measurement, METRIC_CONFIGS, fmtVal } from "@/lib/types";
import { format, parseISO, differenceInDays } from "date-fns";
import { X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComparisonPanelProps {
  a: Measurement;
  b: Measurement;
  onClose: () => void;
}

const LOWER_IS_BETTER = new Set<keyof Measurement>([
  "fatPercent", "bodyFatWeight", "bmi", "vFat", "obesityDegree", "bodyAge",
]);

type DeltaKind = "good" | "bad" | "neutral";

function getDelta(
  key: keyof Measurement,
  newerVal: number,
  olderVal: number,
): { diff: number; kind: DeltaKind } {
  const diff = newerVal - olderVal;
  if (Math.abs(diff) < 0.0005) return { diff: 0, kind: "neutral" };
  if (key === "weight") return { diff, kind: "neutral" };
  const increased = diff > 0;
  const isGood = LOWER_IS_BETTER.has(key) ? !increased : increased;
  return { diff, kind: isGood ? "good" : "bad" };
}

const KIND_COLORS: Record<DeltaKind, string> = {
  good: "text-emerald-500",
  bad: "text-red-400",
  neutral: "text-muted-foreground",
};

export function ComparisonPanel({ a, b, onClose }: ComparisonPanelProps) {
  const [newer, older] = useMemo(() => {
    return new Date(a.date) >= new Date(b.date) ? [a, b] : [b, a];
  }, [a, b]);

  const daysDiff = differenceInDays(parseISO(newer.date), parseISO(older.date));

  const rows = useMemo(() =>
    METRIC_CONFIGS.map((metric) => {
      const olderVal = older[metric.key] as number;
      const newerVal = newer[metric.key] as number;
      const { diff, kind } = getDelta(metric.key, newerVal, olderVal);
      return { metric, olderVal, newerVal, diff, kind };
    }),
  [newer, older]);

  const highlights = useMemo(() => {
    const keys: (keyof Measurement)[] = ["weight", "fatPercent", "musclePercent"];
    return keys.map((k) => {
      const cfg = METRIC_CONFIGS.find((m) => m.key === k)!;
      const olderVal = older[k] as number;
      const newerVal = newer[k] as number;
      const { diff, kind } = getDelta(k, newerVal, olderVal);
      return { cfg, diff, kind };
    });
  }, [newer, older]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Positioning wrapper — bottom sheet on mobile, centered dialog on desktop */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 pointer-events-none">
      <div
        className="comparison-panel-animate pointer-events-auto w-full md:max-w-2xl flex flex-col rounded-t-2xl md:rounded-2xl border-t md:border border-border/60 bg-background"
        style={{ maxHeight: "82dvh" }}
      >
        {/* Compact header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Compare
              </span>
              <span className="text-[10px] text-muted-foreground/40">·</span>
              <span className="text-[10px] text-muted-foreground">
                {daysDiff === 0 ? "same day" : `${daysDiff}d apart`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-data text-muted-foreground">
                {format(parseISO(older.date), "d MMM ''yy")}
              </span>
              <span className="text-[10px] text-muted-foreground/40">→</span>
              <span className="text-xs font-data font-semibold">
                {format(parseISO(newer.date), "d MMM ''yy")}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 shrink-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Highlights — inline chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 shrink-0">
          {highlights.map(({ cfg, diff, kind }) => {
            const sign = diff > 0 ? "+" : "";
            const diffStr = `${sign}${diff.toFixed(cfg.decimals)}`;
            const Icon = diff > 0.0005 ? TrendingUp : diff < -0.0005 ? TrendingDown : Minus;
            return (
              <div
                key={cfg.key}
                className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1.5 flex-1"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-muted-foreground leading-none mb-0.5 truncate">
                    {cfg.label}
                  </span>
                  <span className={`text-[12px] font-data font-semibold ${KIND_COLORS[kind]} flex items-center gap-0.5`}>
                    <Icon className="h-2.5 w-2.5 shrink-0" />
                    {diffStr}
                    {cfg.unit && <span className="text-[9px] font-normal">{cfg.unit}</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2-column card grid */}
        <div className="overflow-y-auto flex-1 overscroll-contain p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {rows.map(({ metric, olderVal, newerVal, diff, kind }) => {
              const sign = diff > 0 ? "+" : "";
              const diffStr = `${sign}${diff.toFixed(metric.decimals)}`;
              return (
                <div
                  key={metric.key}
                  className="rounded-xl bg-muted/20 px-3 py-2.5"
                >
                  {/* Label + delta */}
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1 flex-1 min-w-0">
                      {metric.label}
                    </span>
                    <span className={`text-[11px] font-data font-semibold shrink-0 ${KIND_COLORS[kind]}`}>
                      {diffStr}
                      {metric.unit && <span className="text-[9px] ml-0.5">{metric.unit}</span>}
                    </span>
                  </div>
                  {/* Old → new */}
                  <div className="flex items-center gap-1 font-data text-[11px]">
                    <span className="text-muted-foreground/60">{fmtVal(metric.key, olderVal)}</span>
                    <span className="text-muted-foreground/30 text-[9px]">→</span>
                    <span className="font-medium text-foreground/90">{fmtVal(metric.key, newerVal)}</span>
                    {metric.unit && (
                      <span className="text-[9px] text-muted-foreground/40">{metric.unit}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }} />
        </div>
      </div>
      </div>
    </>
  );
}
