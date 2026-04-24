"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Measurement } from "@/lib/types";
import { buildMeasurementContext, serializeMeasurements } from "@/lib/ai-context";
import { genAI, MODEL } from "@/lib/gemini";
import { saveGoal, saveInsightCache, getGoal } from "@/lib/firestore";
import { useAuth } from "@/contexts/auth-context";
import { Sparkles, AlertCircle, Target, Pencil, Check, CheckCircle2, XCircle } from "lucide-react";

const SYSTEM_PROMPT = `You are a supportive health coach analyzing a user's body composition data logged from a smart scale.

Return ONLY a valid JSON object — no preamble, no markdown, no extra text. Use this exact shape:
{"insight":"...","dos":["...","..."],"donts":["...","..."]}

Rules for "insight":
- 2-4 sentences max.
- Focus on the 2-3 most meaningful signals (fat loss vs muscle gain, body age trend, visceral fat, metabolism).
- If only one entry exists, describe their current baseline — don't fabricate trends.
- Be encouraging but honest. Don't sugarcoat if a metric is moving in the wrong direction.
- Speak directly to the user ("your", "you").
- No markdown, no bullet points — plain sentences only.
- If a goal is provided, directly relate progress to it.

Rules for "dos" (exactly 2 items):
- Specific, actionable things the user SHOULD do or continue based on their data.
- One short sentence each, 10 words or fewer.
- Ground each item in their actual numbers.

Rules for "donts" (1 to 2 items):
- Specific habits or behaviors the user should AVOID based on their data.
- One short sentence each, 10 words or fewer.
- Ground each item in their actual numbers.`;

interface InsightData {
  insight: string;
  dos: string[];
  donts: string[];
}

interface AiInsightProps {
  measurements: Measurement[];
}

export function AiInsight({ measurements }: AiInsightProps) {
  const [data, setData]           = useState<InsightData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [visible, setVisible]     = useState(false);
  const [goal, setGoal]           = useState("");
  const [goalReady, setGoalReady] = useState(false);
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState("");
  const inputRef                  = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const latest   = measurements[measurements.length - 1];
  const latestId = latest?.id ?? latest?.date ?? "";

  useEffect(() => {
    if (!user) return;
    getGoal(user.uid)
      .then(async (g) => {
        setGoal(g);
        const { getInsightCache } = await import("@/lib/firestore");
        const cache = await getInsightCache(user.uid);
        if (cache && cache.latestId === latestId && cache.goal === g && cache.dos) {
          setData({ insight: cache.insight, dos: cache.dos ?? [], donts: cache.donts ?? [] });
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
        ? `\n\nUser's goal: "${currentGoal.trim()}"\n\nGiven this goal, directly relate the progress to it in the insight field.`
        : "";
      const prompt = `${SYSTEM_PROMPT}\n\nHere are the user's body composition entries (oldest to newest):\n\n${serialized}${goalLine}`;

      const model  = genAI.getGenerativeModel({ model: MODEL });
      const result = await model.generateContent(prompt);
      const raw    = result.response.text().trim();

      let parsed: InsightData;
      try {
        // Strip possible ```json fences if the model adds them despite instructions
        const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        const obj = JSON.parse(jsonStr);
        parsed = {
          insight: String(obj.insight ?? ""),
          dos:     Array.isArray(obj.dos)   ? obj.dos.map(String)   : [],
          donts:   Array.isArray(obj.donts) ? obj.donts.map(String) : [],
        };
      } catch {
        // Fallback: treat entire response as plain insight
        parsed = { insight: raw, dos: [], donts: [] };
      }

      setData(parsed);
      if (user) saveInsightCache(user.uid, {
        latestId,
        goal: currentGoal,
        insight: parsed.insight,
        dos:    parsed.dos,
        donts:  parsed.donts,
      });
      setTimeout(() => setVisible(true), 50);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate")) {
        setError("rate-limited");
      } else {
        setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [measurements, latestId, user]);

  useEffect(() => {
    if (!goalReady) return;
    if (data) return;
    fetchInsight(goal);
  }, [fetchInsight, goal, goalReady, data]);

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
    setData(null);
    setVisible(false);
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

  const hasList = data && (data.dos.length > 0 || data.donts.length > 0);

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

        .next-steps-divider {
          height: 1px;
          background: linear-gradient(90deg, oklch(0.62 0.155 75 / 15%), oklch(0.62 0.155 75 / 5%) 80%, transparent);
        }
        :is(.dark *) .next-steps-divider {
          background: linear-gradient(90deg, oklch(0.62 0.155 75 / 20%), oklch(0.62 0.155 75 / 5%) 80%, transparent);
        }
        @keyframes chipSlideIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .chip-do {
          background: oklch(0.50 0.14 145 / 8%);
          border: 1px solid oklch(0.50 0.14 145 / 18%);
          color: oklch(0.38 0.13 145);
        }
        :is(.dark *) .chip-do {
          background: oklch(0.50 0.14 145 / 12%);
          border-color: oklch(0.50 0.14 145 / 22%);
          color: oklch(0.72 0.14 145);
        }
        .chip-dont {
          background: oklch(0.55 0.14 25 / 8%);
          border: 1px solid oklch(0.55 0.14 25 / 18%);
          color: oklch(0.42 0.14 25);
        }
        :is(.dark *) .chip-dont {
          background: oklch(0.55 0.14 25 / 12%);
          border-color: oklch(0.55 0.14 25 / 22%);
          color: oklch(0.72 0.14 25);
        }
        .chip-do-icon  { color: oklch(0.50 0.14 145); }
        .chip-dont-icon { color: oklch(0.55 0.14 25); }
        :is(.dark *) .chip-do-icon  { color: oklch(0.65 0.14 145); }
        :is(.dark *) .chip-dont-icon { color: oklch(0.68 0.14 25); }
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
            {/* Skeleton chips */}
            <div className="pt-2 space-y-1.5">
              <div className="insight-skeleton h-2.5 w-24 rounded-full" />
              <div className="insight-skeleton h-6 w-[70%] rounded-lg" />
              <div className="insight-skeleton h-6 w-[60%] rounded-lg" />
              <div className="insight-skeleton h-6 w-[50%] rounded-lg" />
            </div>
          </div>
        ) : error === "rate-limited" ? (
          <p className="text-sm text-muted-foreground/70">Too many requests — please try again later.</p>
        ) : error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : data ? (
          <div className={`space-y-3 ${visible ? "insight-enter" : "opacity-0"}`}>
            <p className="text-sm leading-relaxed text-foreground/85">
              {data.insight}
            </p>

            {hasList && (
              <>
                <div className="next-steps-divider" />

                <div className="space-y-1.5">
                  <span
                    className="block text-[9px] font-bold uppercase tracking-[0.14em] mb-2"
                    style={{ color: "oklch(0.62 0.155 75 / 60%)" }}
                  >
                    Next steps
                  </span>

                  {data.dos.map((item, i) => (
                    <div
                      key={`do-${i}`}
                      className="chip-do flex items-start gap-2 rounded-lg px-3 py-1.5"
                      style={{
                        animation: `chipSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${0.08 * i}s both`,
                      }}
                    >
                      <CheckCircle2 className="chip-do-icon h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="text-xs leading-snug">{item}</span>
                    </div>
                  ))}

                  {data.donts.map((item, i) => (
                    <div
                      key={`dont-${i}`}
                      className="chip-dont flex items-start gap-2 rounded-lg px-3 py-1.5"
                      style={{
                        animation: `chipSlideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${0.08 * (data.dos.length + i)}s both`,
                      }}
                    >
                      <XCircle className="chip-dont-icon h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="text-xs leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
