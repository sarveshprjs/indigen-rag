/**
 * Free embeddings via Jina AI's embeddings API.
 * Model: jina-embeddings-v3, truncated to 384 dims (Matryoshka representation
 * learning — Jina embeddings support requesting a smaller `dimensions` value,
 * which is just a truncation of the full vector, so this stays compatible
 * with the existing vector(384) schema).
 *
 * Chosen over Hugging Face's Inference Providers API, which now requires a
 * scope ("Make calls to Inference Providers") that isn't selectable on plain
 * free accounts without billing setup. Jina's free API key
 * (https://jina.ai/?sui=apikey) has no such friction.
 *
 * Falls back to a deterministic local hash-embedding if the API is
 * unavailable, so ingestion never hard-fails.
 */

const JINA_URL = "https://api.jina.ai/v1/embeddings";
const JINA_MODEL = "jina-embeddings-v3";
export const EMBEDDING_DIM = 384;

function localFallbackEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/).slice(0, EMBEDDING_DIM);
  const vec = new Array(EMBEDDING_DIM).fill(0);
  words.forEach((w, i) => {
    const hash = w.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    vec[i % EMBEDDING_DIM] += hash / 10000;
  });
  const mag = Math.sqrt(vec.reduce((a, v) => a + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

async function jinaEmbed(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error("JINA_API_KEY is not set");

  const res = await fetch(JINA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      task: "retrieval.passage",
      dimensions: EMBEDDING_DIM,
      input: texts.map((t) => t.slice(0, 4000)),
    }),
  });

  if (!res.ok) {
    throw new Error(`Jina embedding API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  // data.data is sorted by `index`; sort defensively in case the API doesn't guarantee order
  return (data.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embed(text: string): Promise<number[]> {
  try {
    const [vec] = await withRetry(() => jinaEmbed([text]), 3);
    return vec;
  } catch (err) {
    console.error("Jina embedding failed, using local fallback:", err);
    return localFallbackEmbedding(text);
  }
}

export async function embedBatch(texts: string[], batchSize = 16): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    try {
      const vecs = await withRetry(() => jinaEmbed(batch), 3);
      results.push(...vecs);
    } catch (err) {
      console.error("Jina embedding batch failed, using local fallback:", err);
      results.push(...batch.map(localFallbackEmbedding));
    }
  }
  return results;
}

async function withRetry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i) + Math.random() * 200));
    }
  }
  throw lastErr;
}
