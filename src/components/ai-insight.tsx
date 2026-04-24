"use client";

import { useState, useEffect, useCallback } from "react";
import { Measurement } from "@/lib/types";
import { Sparkles, AlertCircle } from "lucide-react";

const CACHE_KEY = "ai-insight-cache";

interface CacheEntry {
  latestId: string;
  insight: string;
}

function readCache(latestId: string): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return entry.latestId === latestId ? entry.insight : null;
  } catch {
    return null;
  }
}

function writeCache(latestId: string, insight: string) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ latestId, insight }));
  } catch { /* storage full or unavailable */ }
}

interface AiInsightProps {
  measurements: Measurement[];
}

export function AiInsight({ measurements }: AiInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const latest = measurements[measurements.length - 1];
  const latestId = latest?.id ?? latest?.date ?? "";

  const fetchInsight = useCallback(async () => {
    if (measurements.length === 0) return;

    const cached = readCache(latestId);
    if (cached) {
      setInsight(cached);
      setTimeout(() => setVisible(true), 50);
      return;
    }

    setLoading(true);
    setVisible(false);
    setError(null);

    try {
      const res = await fetch("/api/health-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurements }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        if (res.status === 500 && json.error?.includes("GEMINI_API_KEY")) {
          setError("no-key");
        } else {
          setError(json.error ?? "Failed to load insight.");
        }
        return;
      }

      setInsight(json.insight);
      writeCache(latestId, json.insight);
      setTimeout(() => setVisible(true), 50);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }, [measurements, latestId]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  if (error === "no-key") {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Add your <span className="font-mono">GEMINI_API_KEY</span> to{" "}
          <span className="font-mono">.env.local</span> to enable AI insights.{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Get a free key →
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="ai-insight-root relative overflow-hidden rounded-xl pl-6 px-5 py-4 space-y-2.5">
      <style>{`
        .ai-insight-root {
          border: 1px solid oklch(0.87 0.005 250 / 55%);
          background: linear-gradient(135deg,
            oklch(1 0 0) 0%,
            oklch(0.983 0.01 75) 100%
          );
        }
        :is(.dark *) .ai-insight-root {
          border-color: oklch(0.3 0.01 250 / 45%);
          background: linear-gradient(135deg,
            oklch(0.165 0.008 250) 0%,
            oklch(0.185 0.018 75) 100%
          );
        }
        .ai-insight-root::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          border-radius: 0.75rem 0 0 0.75rem;
          background: linear-gradient(180deg,
            oklch(0.72 0.155 75) 0%,
            oklch(0.52 0.155 75) 100%
          );
        }
        .ai-insight-root::after {
          content: '\\201C';
          position: absolute;
          right: 8px; top: -16px;
          font-size: 6.5rem;
          line-height: 1;
          font-family: Georgia, serif;
          color: oklch(0.62 0.155 75 / 7%);
          pointer-events: none;
          user-select: none;
        }
        @keyframes insightFadeUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .insight-enter {
          animation: insightFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes warmShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .insight-skeleton {
          border-radius: 99px;
          background: linear-gradient(90deg,
            oklch(0.91 0.003 250) 25%,
            oklch(0.94 0.012 75) 50%,
            oklch(0.91 0.003 250) 75%
          );
          background-size: 1200px 100%;
          animation: warmShimmer 1.8s ease-in-out infinite;
        }
        :is(.dark *) .insight-skeleton {
          background: linear-gradient(90deg,
            oklch(0.24 0.006 250) 25%,
            oklch(0.28 0.022 75) 50%,
            oklch(0.24 0.006 250) 75%
          );
          background-size: 1200px 100%;
          animation: warmShimmer 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Label */}
      <div className="flex items-center gap-2 relative z-10">
        <div
          className="flex items-center justify-center rounded-md h-6 w-6"
          style={{ background: "oklch(0.62 0.155 75 / 12%)" }}
        >
          <Sparkles className="h-3 w-3" style={{ color: "oklch(0.55 0.155 75)" }} />
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "oklch(0.55 0.155 75)" }}
        >
          AI Insight
        </span>
      </div>

      {/* Body */}
      <div className="relative z-10">
        {loading ? (
          <div className="space-y-2 py-0.5">
            <div className="insight-skeleton h-3 w-full" />
            <div className="insight-skeleton h-3 w-[80%]" />
            <div className="insight-skeleton h-3 w-[55%]" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : insight ? (
          <p className={`text-sm leading-relaxed text-foreground/85 ${visible ? "insight-enter" : "opacity-0"}`}>
            {insight}
          </p>
        ) : null}
      </div>
    </div>
  );
}
