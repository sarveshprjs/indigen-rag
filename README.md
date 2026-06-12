# Indigen RAG — Autonomous Multi-Agent Document Intelligence Platform

> **Indigen Services Technical Assessment** · Sarvesh Bhushan Upasani

A production-grade multi-agent agentic-RAG platform that ingests heterogeneous PDFs and answers natural-language queries with **cited, grounded responses** — backed by hybrid retrieval, a reliability layer, and an automated evaluation harness.

## Live Demo
- **Frontend**: [deployed on Vercel — add URL here]
- **Repo**: [this repo]

## Architecture

```
User Query
    │
    ▼
Next.js (Vercel) ──── Vercel AI SDK 4 ────► Orchestrator Agent (Claude claude-sonnet-4-6)
    │                                              │
    │                              ┌───────────────┼───────────────┐
    │                              ▼               ▼               ▼
    │                         Retriever    Grounding         Synthesiser
    │                         Agent        Verifier          Agent
    │                              │               │               │
    ▼                              ▼               ▼               ▼
Supabase                   pgvector (semantic) + FTS (BM25)
(Postgres + pgvector)      Reciprocal Rank Fusion
```

## Phases Completed

| Phase | Status | What's built |
|-------|--------|-------------|
| 0 — Foundation | ✅ Done | Next.js 15, Vercel deploy, Supabase, GitHub Actions CI/CD |
| 1 — Hybrid Retrieval | ✅ Done | pgvector + BM25 + RRF, semantic chunking, incremental indexing |
| 2 — Multi-Agent | ✅ Done | Orchestrator + Retriever + Grounding Verifier + Synthesiser, streaming trace |
| 3 — Reliability | ✅ Done | Circuit breaker, retry+backoff, hallucination guard, refusal on gaps |
| 4 — Eval Harness | 🔶 Partial | Eval script written, dashboard pending CI gate |

## Setup

### Prerequisites
- Node.js 20+
- Supabase account (free tier works)
- OpenAI API key (for embeddings)
- Anthropic API key (for Claude)

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/indigen-rag
cd indigen-rag
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in your keys
```

### 3. Supabase schema
Run `supabase-schema.sql` in your Supabase SQL editor.

### 4. Run locally
```bash
npm run dev
# → http://localhost:3000
```

### 5. Upload test documents
Go to `/ingest` and upload PDFs. Then chat at `/chat`.

## Key Technical Decisions

**Hybrid retrieval (semantic + BM25)**: Semantic search alone misses exact-match queries (policy numbers, names). BM25 alone misses paraphrased queries. RRF combines both without requiring score normalisation.

**Chunking strategy**: Paragraph-boundary splits preserve semantic units better than fixed-token splits. Sliding window overlap prevents context loss at boundaries.

**Grounding guard**: Every answer requires chunk citations. If no relevant chunks exist, the system refuses rather than hallucinating. Contradictions between documents are explicitly surfaced.

**Circuit breaker**: Prevents cascade failures on LLM/API errors. Exponential backoff with jitter on retries.

## What I'd Build With More Time
1. Phase 4 CI regression gate — eval runs on every PR
2. Streaming cost/token budgets per query
3. Re-ranking with a cross-encoder (Cohere Rerank)
4. Multi-document contradiction detection as a first-class feature
5. Dead-letter queue for failed ingestion jobs

## Stack
- **Frontend**: Next.js 15, Vercel AI SDK 4, React 19
- **LLM**: Anthropic Claude claude-sonnet-4-6
- **Embeddings**: OpenAI text-embedding-3-small (1536d)
- **Database**: Supabase Postgres + pgvector
- **Retrieval**: pgvector cosine similarity + Postgres FTS + RRF
- **CI/CD**: GitHub Actions → Vercel auto-deploy
