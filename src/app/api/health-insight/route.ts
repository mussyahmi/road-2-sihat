import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Measurement } from "@/lib/types";
import { buildMeasurementContext, serializeMeasurements } from "@/lib/ai-context";

const SYSTEM_PROMPT = `You are a supportive health coach analyzing a user's body composition data logged from a smart scale.

Rules:
- Be concise: 2-4 sentences max.
- Focus on the most meaningful changes visible in the data (fat loss vs muscle gain, body age trend, visceral fat, metabolism).
- If only one entry exists, describe their current baseline — don't fabricate trends.
- Be encouraging but honest. Don't sugarcoat if a metric is moving in the wrong direction.
- Speak directly to the user ("your", "you").
- Do NOT list every metric. Pick the 2-3 most notable signals.
- Do NOT use markdown, bullet points, or headers — plain sentences only.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { measurements } = await req.json() as { measurements: Measurement[] };

  if (!measurements || measurements.length === 0) {
    return NextResponse.json({ error: "No measurements provided" }, { status: 400 });
  }

  const context = buildMeasurementContext(measurements);
  const serialized = serializeMeasurements(context);

  const prompt = `${SYSTEM_PROMPT}

Here are the user's body composition entries (oldest to newest):

${serialized}

Provide a brief, insightful health coaching message based on these entries.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  try {
    const result = await model.generateContent(prompt);
    const insight = result.response.text().trim();
    return NextResponse.json({ insight });
  } catch (e) {
    console.error("[health-insight]", e);
    const message = e instanceof Error ? e.message : "Gemini API error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
