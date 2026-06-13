/**
 * Free embeddings via Hugging Face's free Inference API.
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dims) — small, fast,
 * good enough for hybrid retrieval, and the HF free tier requires no billing.
 *
 * Falls back to a deterministic local hash-embedding if HF is unavailable
 * (rate-limited / cold-starting model), so ingestion never hard-fails.
 */

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;
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

async function hfEmbed(text: string): Promise<number[]> {
  const token = process.env.HF_TOKEN;
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // truncate to keep within the model's 256-token context
    body: JSON.stringify({ inputs: text.slice(0, 2000), options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    throw new Error(`HF embedding API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();

  // feature-extraction returns either a flat vector (already pooled) or a
  // [tokens][dims] matrix that needs mean-pooling.
  let vec: number[];
  if (Array.isArray(data[0])) {
    if (Array.isArray(data[0][0])) {
      // [1][tokens][dims]
      vec = meanPool(data[0]);
    } else {
      // [tokens][dims]
      vec = meanPool(data);
    }
  } else {
    vec = data as number[];
  }
  return vec;
}

function meanPool(matrix: number[][]): number[] {
  const dims = matrix[0].length;
  const sums = new Array(dims).fill(0);
  for (const row of matrix) {
    for (let i = 0; i < dims; i++) sums[i] += row[i];
  }
  return sums.map((s) => s / matrix.length);
}

export async function embed(text: string): Promise<number[]> {
  try {
    return await withRetry(() => hfEmbed(text), 3);
  } catch (err) {
    console.error("HF embedding failed, using local fallback:", err);
    return localFallbackEmbedding(text);
  }
}

export async function embedBatch(texts: string[], concurrency = 4): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);
  let idx = 0;
  async function worker() {
    while (idx < texts.length) {
      const i = idx++;
      results[i] = await embed(texts[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
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
