# Project Report
## Indigen Services Technical Assessment — Sarvesh Bhushan Upasani

---

## 1. Problem Understanding + Assumptions

The task is to build a multi-agent RAG platform that handles **heterogeneous, partially contradictory documents** and produces **grounded, cited answers** — not a chatbot over PDFs. The hard part is: orchestration, grounding verification, reliability guardrails, and a measurable eval harness.

**Key assumptions I made:**
- "Heterogeneous PDFs" means documents with different structures, overlapping topics, and deliberate contradictions — I created test documents with conflicting policy versions to prove the system handles this
- The grounding guard is the most important correctness property — a system that hallucinations confidently is worse than one that refuses
- Phase 0–1 solid > Phase 0–4 broken — I prioritised getting hybrid retrieval production-quality before adding agent complexity
- The eval harness needs real labelled Q&A pairs to be meaningful — I created a 15-question set with ground-truth chunk IDs

---

## 2. Architecture & Tech Decisions

**Next.js 15 + Vercel AI SDK 4**: The streaming agent loop and tool-calling are first-class features. `maxSteps: 5` gives the orchestrator enough budget to retrieve, verify, and synthesise without runaway loops.

**pgvector + Postgres FTS hybrid**: Semantic search alone misses exact-match queries (policy numbers, dates). BM25/FTS alone misses paraphrased queries. Reciprocal Rank Fusion combines both without requiring score normalisation — scores from different algorithms are not comparable, but ranks are.

**Claude claude-sonnet-4-6 as orchestrator**: Strong instruction-following for the grounding constraints. The system prompt's hard rules ("refuse if not grounded", "cite every claim") are reliably followed.

**OpenAI text-embedding-3-small**: 1536 dimensions, cost-effective, good performance. Considered Cohere but OpenAI's free tier was sufficient for the document corpus size.

**Supabase over Pinecone**: Keeps everything in one data store. The `hybrid_search` stored function runs both retrieval paths in a single round-trip.

**Trade-offs I considered:**
- Sentence-level vs paragraph-level chunking: Paragraph boundaries preserve semantic coherence but produce variable chunk sizes. Chose paragraph-first with sliding window fallback.
- Cross-encoder re-ranking: Would improve precision significantly but adds ~300ms latency per query. Deferred to "more time" list.

---

## 3. What's Done vs What's Incomplete

**Done:**
- Phase 0: Next.js scaffold, Supabase schema, GitHub Actions CI, Vercel deployment
- Phase 1: PDF ingestion, semantic chunking, pgvector embeddings, hybrid search with RRF
- Phase 2: Orchestrator agent, Retriever sub-agent, Grounding Verifier tool, streaming reasoning trace in UI
- Phase 3: Circuit breaker (closed/open/half-open states), exponential backoff + jitter, hallucination guard (citation requirement + refusal on gaps), contradiction surfacing

**Incomplete:**
- Phase 4 CI regression gate: The eval script runs locally and produces precision/recall scores, but I did not complete the GitHub Actions job that fails the build on accuracy drops below threshold. This would take ~2 more hours.
- Dead-letter queue: Failed ingestion jobs are currently just returned as 500 errors. A proper dead-letter path with retry and alerting was not implemented.
- Re-ranking: Basic RRF is used. A cross-encoder (Cohere Rerank API) would improve retrieval quality, especially on longer documents.
- Multi-document contradiction detection: The system surfaces contradictions when the LLM notices them in retrieved chunks, but there is no explicit contradiction-detection pass over the full corpus.

---

## 4. Challenges Faced & How I Solved Them

**Challenge 1: pgvector + FTS in one query**  
The `hybrid_search` stored function uses a FULL OUTER JOIN between the semantic and keyword result sets. Getting the RRF calculation right with NULLs in the COALESCE took a few iterations — the initial version was dropping keyword-only results.

**Challenge 2: Streaming tool calls in the UI**  
Vercel AI SDK's `useChat` exposes `toolInvocations` on message objects, but the state management for live tool call display (before the result arrives) required tracking tool calls separately in a `useState` using the `onToolCall` callback.

**Challenge 3: LLM grounding compliance**  
The initial system prompt was not strict enough — the model would occasionally answer from general knowledge when retrieved chunks were thin. The fix was making the refusal rule explicit: "If retrieved chunks do not contain enough information, respond EXACTLY: [refusal text]." The word EXACTLY was the key — it eliminated paraphrased partial answers.

---

## 5. AI Tools Used + Prompt Approach

See `PROMPTS.md` for the full incremental log.

**Where AI helped most:** Boilerplate (Supabase schema, Next.js routes), TypeScript types, the RRF SQL function, CSS-in-JS styling. Claude was reliable for well-specified prompts with clear input/output contracts.

**Where AI failed me:** The initial streaming UI had a race condition where tool call state wasn't cleared between messages. AI-generated code missed this edge case — I debugged it manually. The lesson: AI is good at greenfield code, worse at state management edge cases.

---

## 6. Testing Approach + Known Bugs / Limitations

**Testing approach:**
- 15-question labelled Q&A set covering: direct retrieval, contradiction queries, gap queries (questions the corpus can't answer), and multi-document synthesis
- Manual verification that the system refuses gap questions and surfaces contradictions
- Circuit breaker tested by temporarily pointing to a dead endpoint

**Known limitations:**
- No authentication — the API is open
- Large PDFs (>50 pages) may timeout during ingestion on Vercel's 60s function limit
- The RRF function assumes English text (uses `english` FTS config)
- Eval harness is not wired into CI yet

---

## 7. What I'd Build With More Time

1. **Phase 4 CI gate**: GitHub Actions job running eval, failing if precision < 0.75
2. **Re-ranking**: Cohere Rerank API after initial retrieval — 20-30% precision improvement
3. **Token/cost budgets**: Track and limit tokens per query, surface cost in UI
4. **Dead-letter queue**: Failed ingestion → Supabase queue → retry worker on Railway
5. **Multi-document contradiction detection**: Pre-compute contradiction pairs at ingest time, not just at query time
6. **Authentication**: NextAuth for the frontend, API key middleware for the ingest endpoint

---

## 8. Setup Steps, Repo Link, Live URL

**Repo**: https://github.com/YOUR_USERNAME/indigen-rag  
**Live URL**: https://YOUR_PROJECT.vercel.app

### Setup steps
1. `git clone` + `npm install`
2. Copy `.env.example` → `.env.local`, fill in 4 keys
3. Run `supabase-schema.sql` in Supabase SQL Editor
4. `npm run dev` → localhost:3000
5. Upload PDFs at `/ingest`, chat at `/chat`

Full instructions in `README.md`.
