import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

export const genAI = new GoogleGenerativeAI(apiKey);
export const MODEL = "gemini-2.5-flash-lite";
