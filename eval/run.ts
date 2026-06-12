/**
 * Evaluation harness — Phase 4 (partial)
 * Run: npx ts-node eval/run.ts
 *
 * Measures: retrieval precision/recall, hallucination rate, p95 latency
 * Output: JSON results + pass/fail against threshold
 */

import { hybridSearch } from "../lib/retrieval";

interface QAItem {
  question: string;
  expectedChunkKeywords: string[]; // keywords that should appear in retrieved chunks
  shouldRefuse: boolean; // true = question is about a gap, system should refuse
}

// Labelled Q&A set — extend this with your actual documents
const qaSet: QAItem[] = [
  {
    question: "What is the maximum loan amount according to policy?",
    expectedChunkKeywords: ["loan", "maximum", "policy"],
    shouldRefuse: false,
  },
  {
    question: "What was the weather like last Tuesday?",
    expectedChunkKeywords: [],
    shouldRefuse: true, // this is a gap question
  },
  {
    question: "What are the eligibility criteria?",
    expectedChunkKeywords: ["eligib", "criteria", "requirement"],
    shouldRefuse: false,
  },
  // Add 12 more based on your actual documents
];

interface EvalResult {
  question: string;
  retrieved: number;
  relevantFound: boolean;
  shouldRefuse: boolean;
  latencyMs: number;
}

async function runEval() {
  console.log("Running evaluation harness...\n");
  const results: EvalResult[] = [];

  for (const qa of qaSet) {
    const start = Date.now();
    const chunks = await hybridSearch(qa.question, 6);
    const latencyMs = Date.now() - start;

    const relevantFound = qa.expectedChunkKeywords.length === 0
      ? chunks.length === 0 // gap question: good if nothing retrieved
      : qa.expectedChunkKeywords.some((kw) =>
          chunks.some((c) => c.content.toLowerCase().includes(kw.toLowerCase()))
        );

    results.push({
      question: qa.question,
      retrieved: chunks.length,
      relevantFound,
      shouldRefuse: qa.shouldRefuse,
      latencyMs,
    });

    console.log(`Q: ${qa.question.slice(0, 50)}...`);
    console.log(`  Retrieved: ${chunks.length} chunks | Relevant: ${relevantFound} | Latency: ${latencyMs}ms\n`);
  }

  // Compute metrics
  const precision = results.filter((r) => r.relevantFound).length / results.length;
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const THRESHOLD = 0.75;

  console.log("=== EVAL RESULTS ===");
  console.log(`Retrieval precision: ${(precision * 100).toFixed(1)}%`);
  console.log(`p95 latency: ${p95}ms`);
  console.log(`Pass threshold (${THRESHOLD * 100}%): ${precision >= THRESHOLD ? "PASS ✅" : "FAIL ❌"}`);

  if (precision < THRESHOLD) {
    console.error(`\nCI GATE: Build would fail — precision ${(precision * 100).toFixed(1)}% < ${THRESHOLD * 100}%`);
    process.exit(1);
  }
}

runEval().catch((e) => { console.error(e); process.exit(1); });
