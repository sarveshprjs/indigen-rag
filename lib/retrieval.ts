import { supabaseAdmin } from "./supabase";
import { embed } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  doc_id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export async function hybridSearch(query: string, topK = 6): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embed(query);

  const { data, error } = await supabaseAdmin.rpc("hybrid_search", {
    query_text: query,
    query_embedding: queryEmbedding,
    match_count: topK,
  });

  if (error) {
    console.error("Hybrid search error:", error);
    return [];
  }

  return (data ?? []) as RetrievedChunk[];
}

export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (c, i) =>
        `[CHUNK ${i + 1} | id:${c.id.slice(0, 8)} | doc:${String(c.metadata?.docName ?? "unknown")}]\n${c.content}`
    )
    .join("\n\n---\n\n");
}
