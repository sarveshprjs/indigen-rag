const HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";
const HF_TOKEN = process.env.HF_TOKEN ?? "";

async function hfEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts, options: { wait_for_model: true } }),
  });
  if (!res.ok) throw new Error(`HF embed error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data as number[][];
}

export async function embed(text: string): Promise<number[]> {
  const result = await hfEmbed([text.slice(0, 512)]);
  return result[0];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  return hfEmbed(texts.map(t => t.slice(0, 512)));
}