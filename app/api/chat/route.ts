export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { hybridSearch, formatChunksForPrompt } from "@/lib/retrieval";
import { llmBreaker } from "@/lib/circuit-breaker";

const SYSTEM_PROMPT = `You are an intelligent document analyst with access to a curated document corpus.

RULES — NEVER BREAK THESE:
1. You MUST only answer from retrieved document chunks. Never use your general knowledge for factual claims.
2. Every factual claim MUST include a citation in the format [chunk_id].
3. If retrieved chunks do not contain enough information to answer, respond EXACTLY:
   "I cannot find sufficient information in the available documents to answer this question reliably."
4. If documents contain contradictions on a topic, explicitly surface them:
   "Note: The documents contain conflicting information — [doc A says X] vs [doc B says Y]."
5. Never fabricate, hallucinate, or extrapolate beyond what the documents state.

PROCESS:
- First retrieve relevant chunks using the search tool
- Verify the chunks actually support the answer
- Synthesise a grounded, cited response
- Surface any contradictions or gaps honestly`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  return llmBreaker.call(async () => {
    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages,
      maxSteps: 5,
      tools: {
        searchDocuments: tool({
          description:
            "Search the document corpus using hybrid semantic + keyword retrieval. Always call this before answering any factual question.",
          parameters: z.object({
            query: z.string().describe("The search query — be specific"),
            topK: z.number().default(6).describe("Number of chunks to retrieve"),
          }),
          execute: async ({ query, topK }) => {
            const chunks = await hybridSearch(query, topK);
            if (chunks.length === 0) {
              return {
                found: false,
                message: "No relevant chunks found for this query.",
                chunks: [],
              };
            }
            return {
              found: true,
              count: chunks.length,
              context: formatChunksForPrompt(chunks),
              chunkIds: chunks.map((c) => c.id.slice(0, 8)),
            };
          },
        }),

        verifyGrounding: tool({
          description:
            "Verify that your intended answer is actually grounded in the retrieved chunks. Call before giving a final answer.",
          parameters: z.object({
            intendedAnswer: z.string(),
            chunkIds: z.array(z.string()),
          }),
          execute: async ({ intendedAnswer, chunkIds }) => {
            const hasCitations = chunkIds.some((id) =>
              intendedAnswer.includes(id)
            );
            return {
              grounded: hasCitations || chunkIds.length > 0,
              citationsPresent: hasCitations,
              warning: !hasCitations
                ? "Answer does not contain explicit chunk citations — add [chunk_id] references"
                : null,
            };
          },
        }),
      },
    });
    return result.toDataStreamResponse();
  });
}