import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const EXTRACT_PROMPT = `You are extracting body composition data from a smart scale screenshot.

First, determine if this image shows a body composition scale result (weight, fat %, muscle %, BMI, etc.).

If it does NOT show scale data, return exactly this and nothing else:
{"error":"not_a_scale"}

If it does show scale data, return ONLY a valid JSON object with these keys (all numbers, except date which is an ISO string like "2026-04-17T07:11:00"):

{
  "date": "YYYY-MM-DDTHH:MM:00",
  "weight": 0,
  "bmi": 0,
  "fatPercent": 0,
  "bodyFatWeight": 0,
  "skeletalMuscleMassPercent": 0,
  "skeletalMuscleWeight": 0,
  "musclePercent": 0,
  "muscleWeight": 0,
  "vFat": 0,
  "waterPercent": 0,
  "weightOfWater": 0,
  "metabolism": 0,
  "obesityDegree": 0,
  "boneMass": 0,
  "protein": 0,
  "weightWithoutFat": 0,
  "bodyAge": 0,
  "height": 0
}

Rules:
- Fill in the date from the timestamp shown on the screenshot. If no date is visible, use today's date.
- For any metric not visible in the screenshot, use 0.
- Return only the raw JSON, nothing else.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { imageBase64, mimeType } = await req.json() as {
    imageBase64: string;
    mimeType: string;
  };

  if (!imageBase64 || !mimeType) {
    return NextResponse.json({ error: "imageBase64 and mimeType are required" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const result = await model.generateContent([
    EXTRACT_PROMPT,
    { inlineData: { mimeType, data: imageBase64 } },
  ]);

  const text = result.response.text().trim();

  try {
    const json = JSON.parse(text.replace(/^```json?\n?/, "").replace(/\n?```$/, ""));
    if (json.error === "not_a_scale") {
      return NextResponse.json({ error: "That doesn't look like a scale screenshot. Please upload a body composition result." }, { status: 422 });
    }
    return NextResponse.json({ data: json });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 422 });
  }
}
