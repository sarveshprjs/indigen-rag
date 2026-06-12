export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { streamText, tool } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { hybridSearch, formatChunksForPrompt } from "@/lib/retrieval";

// Groq — free tier, fast, OpenAI-compatible. Works fine from Vercel
// serverless functions (no localhost dependency like Ollama).
const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.3-70b-versatile");

const SYSTEM_PROMPT = `You are an intelligent document analyst with access to a curated document corpus.

RULES — NEVER BREAK THESE:
1. You MUST only answer from retrieved document chunks. Never use your general knowledge for factual claims.
2. Every factual claim MUST include a citation in the format [chunk_id].
3. If retrieved chunks do not contain enough information to answer, respond EXACTLY:
   "I cannot find sufficient information in the available documents to answer this question reliably."
4. If documents contain contradictions on a topic, explicitly surface them:
   "Note: The documents contain conflicting information — [doc A says X] vs [doc B says Y]."
5. Never fabricate, hallucinate, or extrapolate beyond what the documents state.
6. Always call searchDocuments at least once before answering.`;

export async function POST(req: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    const { textStream } = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages,
      maxSteps: 5,
      tools: {
        searchDocuments: tool({
          description: "Search the document corpus using hybrid retrieval. Always call this before answering.",
          parameters: z.object({
            query: z.string().describe("The search query"),
            topK: z.number().default(6),
          }),
          execute: async ({ query, topK }) => {
            const chunks = await hybridSearch(query, topK);
            if (chunks.length === 0) {
              return { found: false, message: "No relevant chunks found.", chunks: [] };
            }
            return {
              found: true,
              count: chunks.length,
              context: formatChunksForPrompt(chunks),
              chunkIds: chunks.map((c) => c.id.slice(0, 8)),
            };
          },
        }),
      },
    });

    // Convert text stream to SSE format for useChat compatibility
    const encoder = new TextEncoder();
    const transformStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text-delta", text: chunk })}\n\n`)
            );
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`)
          );
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "message-stop" })}\n\n`));
        controller.close();
      },
    });

    return new Response(transformStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
