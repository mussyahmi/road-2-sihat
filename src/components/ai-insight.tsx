"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Measurement } from "@/lib/types";
import { buildMeasurementContext, serializeMeasurements } from "@/lib/ai-context";
import { genAI, MODEL } from "@/lib/gemini";
import { saveGoal, saveInsightCache, getGoal } from "@/lib/firestore";
import { useAuth } from "@/contexts/auth-context";
import { Sparkles, AlertCircle, Target, Pencil, Check } from "lucide-react";

const SYSTEM_PROMPT = `You are a supportive health coach analyzing a user's body composition data logged from a smart scale.

Rules:
- Be concise: 2-4 sentences max.
- Focus on the most meaningful changes (fat loss vs muscle gain, body age trend, visceral fat, metabolism).
- If only one entry exists, describe their current baseline — don't fabricate trends.
- Be encouraging but honest. Don't sugarcoat if a metric is moving in the wrong direction.
- Speak directly to the user ("your", "you").
- Do NOT list every metric. Pick the 2-3 most notable signals.
- Do NOT use markdown, bullet points, or headers — plain sentences only.
- If a goal is provided, directly relate the progress to that goal. Tell them how close they are or how their current trajectory affects achieving it.`;

interface AiInsightProps {
  measurements: Measurement[];
}

export function AiInsight({ measurements }: AiInsightProps) {
  const [insight, setInsight]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [visible, setVisible]   = useState(false);
  const [goal, setGoal]         = useState("");
  const [goalReady, setGoalReady] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState("");
  const inputRef                = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const latest   = measurements[measurements.length - 1];
  const latestId = latest?.id ?? latest?.date ?? "";

  // Load goal + cached insight from Firestore together
  useEffect(() => {
    if (!user) return;
    getGoal(user.uid)
      .then(async (g) => {
        setGoal(g);
        // Check if cached insight is still valid for current data + goal
        const { getInsightCache } = await import("@/lib/firestore");
        const cache = await getInsightCache(user.uid);
        if (cache && cache.latestId === latestId && cache.goal === g) {
          setInsight(cache.insight);
          setTimeout(() => setVisible(true), 50);
        }
        setGoalReady(true);
      })
      .catch(() => setGoalReady(true));
  }, [user, latestId]);

  const fetchInsight = useCallback(async (currentGoal: string) => {
    if (measurements.length === 0) return;

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setError("no-key");
      return;
    }

    setLoading(true);
    setVisible(false);
    setError(null);

    try {
      const context    = buildMeasurementContext(measurements);
      const serialized = serializeMeasurements(context);
      const goalLine   = currentGoal.trim()
        ? `\n\nUser's goal: "${currentGoal.trim()}"\n\nGiven this goal, directly relate the progress to it — how close are they, and are they on track?`
        : "";
      const prompt = `${SYSTEM_PROMPT}\n\nHere are the user's body composition entries (oldest to newest):\n\n${serialized}${goalLine}\n\nProvide a brief, insightful health coaching message.`;

      const model  = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const text   = result.response.text().trim();

      setInsight(text);
      if (user) saveInsightCache(user.uid, { latestId, goal: currentGoal, insight: text });
      setTimeout(() => setVisible(true), 50);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
        setError("Too many requests — you've hit the API rate limit. Wait a minute and try again.");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [measurements, latestId, user]);

  useEffect(() => {
    if (!goalReady) return;
    if (insight) return; // already loaded from cache
    fetchInsight(goal);
  }, [fetchInsight, goal, goalReady, insight]);

  // Focus input when editing starts
  useEffect(() => {
    if (editing) {
      setDraft(goal);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [editing, goal]);

  const commitGoal = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (trimmed === goal) return;
    setGoal(trimmed);
    if (user) saveGoal(user.uid, trimmed);
    setInsight(null);
    setVisible(false);
    fetchInsight(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter")  commitGoal();
    if (e.key === "Escape") setEditing(false);
  };

  if (error === "no-key") {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Add your <span className="font-mono">NEXT_PUBLIC_GEMINI_API_KEY</span> to{" "}
          <span className="font-mono">.env.local</span> to enable AI insights.
        </p>
      </div>
    );
  }

  return (
    <div className="ai-insight-root relative overflow-hidden rounded-xl px-5 py-4 space-y-2.5">
      <style>{`
        .ai-insight-root {
          border: 1px solid oklch(0.87 0.005 250 / 55%);
          background: linear-gradient(135deg, oklch(1 0 0) 0%, oklch(0.983 0.01 75) 100%);
        }
        :is(.dark *) .ai-insight-root {
          border-color: oklch(0.3 0.01 250 / 45%);
          background: linear-gradient(135deg, oklch(0.165 0.008 250) 0%, oklch(0.185 0.018 75) 100%);
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
        .insight-enter { animation: insightFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes warmShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .insight-skeleton {
          border-radius: 99px;
          background: linear-gradient(90deg, oklch(0.91 0.003 250) 25%, oklch(0.94 0.012 75) 50%, oklch(0.91 0.003 250) 75%);
          background-size: 1200px 100%;
          animation: warmShimmer 1.8s ease-in-out infinite;
        }
        :is(.dark *) .insight-skeleton {
          background: linear-gradient(90deg, oklch(0.24 0.006 250) 25%, oklch(0.28 0.022 75) 50%, oklch(0.24 0.006 250) 75%);
          background-size: 1200px 100%;
          animation: warmShimmer 1.8s ease-in-out infinite;
        }
        .goal-input {
          background: transparent;
          border: none;
          outline: none;
          border-bottom: 1.5px solid oklch(0.62 0.155 75 / 60%);
          color: inherit;
          font-size: 0.7rem;
          width: 100%;
          padding: 1px 0 2px;
          font-family: inherit;
        }
        .goal-input::placeholder { color: oklch(0.62 0.155 75 / 40%); }
        .goal-input:focus { border-bottom-color: oklch(0.62 0.155 75); }
        @keyframes goalPop {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .goal-tag { animation: goalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
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

        {/* Goal area */}
        <div className="flex items-center gap-1.5 min-w-0 ml-3 flex-1 justify-end">
          {editing ? (
            <div className="flex items-center gap-1.5 w-full max-w-[220px]">
              <Target className="h-3 w-3 shrink-0" style={{ color: "oklch(0.62 0.155 75)" }} />
              <input
                ref={inputRef}
                className="goal-input flex-1"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitGoal}
                placeholder="e.g. reach 18% body fat by June"
                maxLength={80}
              />
              <button
                onMouseDown={e => { e.preventDefault(); commitGoal(); }}
                className="shrink-0 flex items-center justify-center rounded h-4 w-4 transition-opacity hover:opacity-70"
                style={{ color: "oklch(0.62 0.155 75)" }}
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : goal ? (
            <button
              onClick={() => setEditing(true)}
              className="goal-tag flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all hover:opacity-80 active:scale-95 min-w-0"
              style={{
                background: "oklch(0.62 0.155 75 / 10%)",
                border: "1px solid oklch(0.62 0.155 75 / 20%)",
                color: "oklch(0.50 0.155 75)",
                maxWidth: "200px",
              }}
            >
              <Target className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{goal}</span>
              <Pencil className="h-2.5 w-2.5 shrink-0 opacity-50" />
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[10px] transition-all hover:opacity-80 active:scale-95"
              style={{
                color: "oklch(0.62 0.155 75 / 55%)",
                borderBottom: "1px dashed oklch(0.62 0.155 75 / 30%)",
                paddingBottom: "1px",
              }}
            >
              <Target className="h-2.5 w-2.5" />
              Set a goal
            </button>
          )}
        </div>
      </div>

      {/* Insight body */}
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
