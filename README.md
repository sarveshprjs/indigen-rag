<div align="center">

# 🧠 INDIGEN RAG

### Autonomous Multi-Agent Document Intelligence & Retrieval Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-indigen--rag.vercel.app-1A56DB?style=for-the-badge)](https://indigen-rag.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-sarveshprjs%2Findigen--rag-181717?style=for-the-badge&logo=github)](https://github.com/sarveshprjs/indigen-rag)
[![TypeScript](https://img.shields.io/badge/TypeScript-88%25-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Cost](https://img.shields.io/badge/Infrastructure_Cost-$0.00%2Fmo-0E9F6E?style=for-the-badge)](https://github.com/sarveshprjs/indigen-rag)

> **Indigen Services Technical Assessment** · Built by **Sarvesh Bhushan Upasani**
>
> A production-grade multi-agent agentic-RAG platform that ingests heterogeneous PDFs and answers natural-language queries with **cited, grounded responses** — powered by hybrid retrieval, hallucination guards, and a full automated evaluation harness. Zero infrastructure cost.

---

</div>

## 📋 Table of Contents

- [🚀 Live Demo](#-live-demo)
- [✨ Features](#-features)
- [🏗️ Architecture & Flowchart](#️-architecture--flowchart)
- [🛠️ Technology Stack](#️-technology-stack)
- [🤖 Multi-Agent Pipeline](#-multi-agent-pipeline)
- [📊 Phase Completion](#-phase-completion)
- [⚡ Quick Start](#-quick-start)
- [🔑 Environment Variables](#-environment-variables)
- [🗄️ Database Setup](#️-database-setup)
- [🔍 Key Engineering Decisions](#-key-engineering-decisions)
- [🧪 Evaluation Harness](#-evaluation-harness)
- [⚠️ Honest Engineering Notes](#️-honest-engineering-notes)
- [🔭 What I'd Build Next](#-what-id-build-next)

---

## 🚀 Live Demo

| Resource | Link |
|----------|------|
| 🌐 **Live Application** | [https://indigen-rag.vercel.app/](https://indigen-rag.vercel.app/) |
| 💻 **Source Code** | [https://github.com/sarveshprjs/indigen-rag](https://github.com/sarveshprjs/indigen-rag) |
| 📹 **Demo Video** | Attached in submission email |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Hybrid Retrieval** | Dense vector (semantic) + BM25 (lexical) fused via Reciprocal Rank Fusion |
| 🤖 **Multi-Agent Pipeline** | Retriever → Grounding Verifier → Synthesiser chain |
| 🚫 **Hallucination Guard** | Explicit refusal when corpus lacks grounding — never fabricates |
| 📌 **Citation-Backed Answers** | Every claim linked to `[chunk_id]` source references |
| ⚡ **Real-Time Streaming** | Token-by-token streaming with reasoning-trace sidebar |
| 🛡️ **Circuit Breaker** | Exponential backoff + retry on API failures |
| 📄 **PDF Ingestion** | Multi-page heterogeneous PDF corpus support |
| 💰 **Zero Cost** | 100% free-tier infrastructure — no credit card required |

---

## 🏗️ Architecture & Flowchart

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│              Next.js 15 · React 19 · Vercel AI SDK 6               │
│         (Dark glassmorphism UI · Reasoning-trace sidebar)           │
└─────────────────────┬───────────────────────────────────────────────┘
                      │  User Query
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTE                              │
│                  /api/chat  ·  streamText()                         │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
          ┌───────────▼────────────┐
          │                        │
          ▼                        ▼
┌─────────────────┐    ┌──────────────────────────────────────────────┐
│  INGESTION PATH │    │              QUERY PATH                      │
│                 │    │                                              │
│  pdf-parse      │    │  ┌─────────────────────────────────────┐    │
│      │          │    │  │  [AGENT 1]  RETRIEVER AGENT         │    │
│      ▼          │    │  │                                     │    │
│  Semantic       │    │  │  hybrid_search() PL/pgSQL function  │    │
│  Chunking       │    │  │  ┌──────────────┬────────────────┐  │    │
│      │          │    │  │  │ pgvector     │ tsvector FTS   │  │    │
│      ▼          │    │  │  │ cosine sim   │ BM25 ranking   │  │    │
│  Jina AI        │    │  │  └──────┬───────┴───────┬────────┘  │    │
│  Embeddings v3  │    │  │         │               │           │    │
│  (384-dim MRL)  │    │  │         └──────┬─────────┘          │    │
│      │          │    │  │                │ RRF Fusion         │    │
│      ▼          │    │  │                ▼                    │    │
│  Supabase       │◄───┤  │     Top-K Citation-tagged Chunks   │    │
│  pgvector DB    │    │  └─────────────────┬───────────────────┘    │
│                 │    │                    │                         │
└─────────────────┘    │  ┌─────────────────▼───────────────────┐    │
                       │  │  [AGENT 2]  GROUNDING VERIFIER      │    │
                       │  │                                     │    │
                       │  │  • Coverage check (sufficient?)     │    │
                       │  │  • Contradiction detection          │    │
                       │  │  • Refusal signal if gaps found     │    │
                       │  └─────────────────┬───────────────────┘    │
                       │                    │                         │
                       │  ┌─────────────────▼───────────────────┐    │
                       │  │  [AGENT 3]  SYNTHESISER AGENT       │    │
                       │  │                                     │    │
                       │  │  Groq LPU · Llama 3.3 70B           │    │
                       │  │  • Grounded answer generation       │    │
                       │  │  • Mandatory [chunk_id] citations   │    │
                       │  │  • Contradiction surfacing          │    │
                       │  │  • Explicit refusal if ungrounded   │    │
                       │  └─────────────────┬───────────────────┘    │
                       │                    │ Token stream            │
                       └────────────────────┼─────────────────────────┘
                                            │
                                            ▼
                               ┌────────────────────┐
                               │   useChat() hook   │
                               │  React UI update   │
                               │  (word-by-word)    │
                               └────────────────────┘
```

### Data Flow: PDF Ingestion

```
PDF Upload
    │
    ▼
pdf-parse (text extraction)
    │
    ▼
Semantic Chunking (paragraph boundaries + sliding window overlap)
    │
    ▼
Jina AI Embeddings v3 API          ◄── Fallback: deterministic hash embedder
    │          (384-dim MRL vectors)
    ▼
Supabase Batch Insert
    ├── embedding (vector)
    ├── content (text)
    ├── metadata (page, source, chunk_id)
    └── tsvector (auto-computed for FTS)
```

### Hybrid Search: RRF Fusion

```
User Query
    │
    ├──────────────────────┬──────────────────────┐
    ▼                      ▼                      │
Jina Embedding         tsvector query             │
(384-dim vector)       (lexical tokens)           │
    │                      │                      │
    ▼                      ▼                      │
pgvector               Postgres FTS               │
cosine_similarity()    ts_rank()                  │
    │                      │                      │
    └──────────┬────────────┘                      │
               ▼                                   │
    Reciprocal Rank Fusion (RRF)                   │
    score = Σ 1/(k + rank_i)                       │
               │                                   │
               ▼                                   │
    Top-K Chunks (fused relevance)                 │
               │                                   │
               └───────────────────────────────────┘
                          → Synthesiser Agent
```

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) + React 19 | SSR, file-based routing, React Server Components |
| **Language** | TypeScript (strict mode) end-to-end | Type safety from DB schema → UI components |
| **Chat / Streaming** | Vercel AI SDK 6 (`useChat`, `streamText`) | Real-time token streaming, standard agent UI protocol |
| **LLM Inference** | Groq LPU — Llama 3.3 70B Versatile | Frontier-scale open model, extreme speed, **free** |
| **Embeddings** | Jina AI — `jina-embeddings-v3` (384-dim, MRL) | SOTA multilingual, compact vectors, **free** |
| **Vector DB** | Supabase PostgreSQL + pgvector | Unified semantic + keyword retrieval, ACID, **free** |
| **Hybrid Search** | pgvector + tsvector + custom RRF PL/pgSQL | Best-of-both retrieval without score normalisation |
| **PDF Ingestion** | pdf-parse + custom semantic chunking | Robust text extraction from heterogeneous PDFs |
| **Hosting** | Vercel Hobby tier | Global edge CDN, auto CI/CD, serverless functions, **free** |
| **CI/CD** | GitHub Actions → Vercel | Automatic deploy on every push, preview per branch |

> 💚 **Total infrastructure cost: $0.00/month**

---

## 🤖 Multi-Agent Pipeline

Every query flows through three specialised agents with clean handoffs:

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  1. RETRIEVER AGENT                                    │
│     ┌──────────────────────────────────────────────┐  │
│     │ • Converts query to 384-dim Jina embedding   │  │
│     │ • Calls hybrid_search() stored procedure     │  │
│     │ • Semantic + lexical → RRF fused ranking     │  │
│     │ • Returns top-K chunks with chunk_id tags    │  │
│     └──────────────────────────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  2. GROUNDING VERIFIER (system-prompt encoded)         │
│     ┌──────────────────────────────────────────────┐  │
│     │ • Checks if retrieved chunks cover the query │  │
│     │ • Detects contradictions between documents   │  │
│     │ • Issues REFUSAL signal if coverage < thresh │  │
│     └──────────────────────────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  3. SYNTHESISER AGENT (Groq / Llama 3.3 70B)          │
│     ┌──────────────────────────────────────────────┐  │
│     │ • Answers ONLY from verified retrieved context│  │
│     │ • Every claim cited with [chunk_id]           │  │
│     │ • Surfaces document contradictions explicitly │  │
│     │ • Streams tokens to browser via AI SDK        │  │
│     │ • REFUSES if context is insufficient          │  │
│     └──────────────────────────────────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Phase Completion

| Phase | Name | Status | What Was Built |
|-------|------|--------|----------------|
| **0** | Foundation | ✅ Complete | Next.js 15, Vercel deploy, Supabase schema, GitHub Actions CI/CD |
| **1** | Hybrid Retrieval | ✅ Complete | pgvector + BM25 + RRF, semantic chunking, PDF ingestion pipeline |
| **2** | Multi-Agent Pipeline | ✅ Complete | Retriever + Grounding Verifier + Synthesiser, streaming reasoning trace |
| **3** | Reliability Safeguards | ✅ Complete | Circuit breaker, retry+backoff, hallucination guard, explicit refusal |
| **4** | Eval Harness | 🔶 Partial | Eval script written and functional; CI regression gate pending |

---

## ⚡ Quick Start

### Prerequisites

- Node.js 20+
- Supabase account (free tier)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Jina AI API key (free at [jina.ai](https://jina.ai))

### 1. Clone and install

```bash
git clone https://github.com/sarveshprjs/indigen-rag
cd indigen-rag
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in your API keys (see Environment Variables below)
```

### 3. Set up Supabase database

Run the migration in your Supabase SQL editor:

```bash
# Run supabase-migration-384.sql in your Supabase dashboard
# This creates: documents table, pgvector extension, hybrid_search() function
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Upload documents and chat

1. Navigate to `/ingest` → upload your PDFs
2. Navigate to `/chat` → ask questions!

---

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Groq (LLM inference — free at console.groq.com)
GROQ_API_KEY=your_groq_api_key

# Jina AI (embeddings — free at jina.ai)
JINA_API_KEY=your_jina_api_key
```

---

## 🗄️ Database Setup

The platform uses a single Supabase PostgreSQL instance with:

```sql
-- pgvector extension for dense vector storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table with hybrid search columns
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(384),          -- Jina v3 MRL 384-dim
  tsvector_content TSVECTOR,      -- PostgreSQL FTS
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- The hybrid_search() stored procedure
-- Combines cosine similarity + ts_rank via Reciprocal Rank Fusion
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding VECTOR(384),
  match_count INT DEFAULT 10
) RETURNS TABLE(...) ...
```

See [`supabase-migration-384.sql`](./supabase-migration-384.sql) for the full schema.

---

## 🔍 Key Engineering Decisions

### Why Hybrid Retrieval?

| Retrieval Method | Semantic Search Only | Lexical (BM25) Only | **Hybrid (RRF)** |
|-----------------|---------------------|--------------------|--------------------|
| Paraphrased queries | ✅ Excellent | ❌ Poor | ✅ Excellent |
| Exact-match (IDs, names) | ❌ Poor | ✅ Excellent | ✅ Excellent |
| Out-of-vocabulary terms | ❌ Poor | ✅ Excellent | ✅ Excellent |
| Score normalisation needed | — | — | ✅ Not needed (RRF) |

### Why Retrieve-Then-Generate over Tool-Call Loops?

After empirical testing revealed inconsistencies in Groq's multi-step function-calling for Llama 3.3, the architecture migrated from an agent tool-calling loop to a **retrieve-then-generate pipeline**. This decision is documented in the git commit history — demonstrating iterative engineering and pragmatic decision-making under time constraints.

### Why Jina v3 with 384-dim MRL vectors?

Matryoshka Representation Learning (MRL) allows truncating full high-dimensional embeddings to compact 384-dim vectors while preserving semantic fidelity. This keeps the pgvector index lean, ANN queries fast, and memory footprint small — with no meaningful accuracy loss for document retrieval tasks.

---

## 🧪 Evaluation Harness

An evaluation script is included in `/eval`:

```bash
# Run evaluation against test question set
npm run eval

# Output: accuracy score, precision/recall per question, grounding rate
```

The eval harness measures:
- **Grounding rate** — % of answers with valid chunk citations
- **Refusal accuracy** — % of unanswerable questions correctly refused
- **Retrieval precision@K** — % of retrieved chunks that are relevant

> 🔶 CI regression gate (fail PR if accuracy drops below threshold) is scaffolded as a next step.

---

## ⚠️ Honest Engineering Notes

These limitations are documented transparently:

- **Rate limits** — Free-tier rate limits (Groq, Jina, Supabase) may introduce occasional latency under heavy concurrent load
- **Cold starts** — Vercel serverless cold starts can add 2–3 seconds to the first request after inactivity
- **Hand-tuned parameters** — Grounding threshold and chunking parameters are defaults; a labelled eval set would enable data-driven calibration
- **Eval CI gate** — The regression gate is written but not yet wired into GitHub Actions
- **Re-indexing** — Incremental re-indexing and dead-letter queues for failed ingestion are scaffolded but not complete

---

## 🔭 What I'd Build Next

1. **Phase 4 CI gate** — eval runs automatically on every PR; fails if accuracy drops below threshold
2. **Cross-encoder reranking** — Cohere Rerank or a local model for higher precision after initial retrieval
3. **Streaming cost dashboards** — per-query token usage and latency observability
4. **Multi-document contradiction UI** — first-class feature to surface and reconcile conflicting sources
5. **Dead-letter queue** — for failed ingestion jobs with automatic retry and alerting
6. **Distributed tracing** — OpenTelemetry spans across the full agent pipeline

---

## 📁 Project Structure

```
indigen-rag/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── chat/           # Streaming chat endpoint (streamText)
│   │   └── ingest/         # PDF ingestion endpoint
│   ├── chat/               # Chat UI page
│   └── ingest/             # Document upload UI
├── lib/                    # Shared library modules
│   ├── retriever.ts        # Hybrid search + RRF
│   ├── embeddings.ts       # Jina AI + fallback embedder
│   ├── supabase.ts         # DB client + queries
│   └── chunker.ts          # Semantic chunking strategy
├── eval/                   # Evaluation harness
├── .github/workflows/      # GitHub Actions CI/CD
├── supabase-schema.sql     # Full DB schema
├── supabase-migration-384.sql  # pgvector + hybrid_search()
├── PROJECT_REPORT.md       # Extended technical report
├── PROMPTS.md              # All AI prompts used during development
└── README.md               # This file
```

---

## 📜 PROMPTS.md

As required by the assessment brief, all raw AI prompts used during development are saved in [`PROMPTS.md`](./PROMPTS.md).

---

<div align="center">

**Built with ❤️ by Sarvesh Bhushan Upasani**

*Indigen Services Technical Assessment · June 2025*

[![Live Demo](https://img.shields.io/badge/🌐_Try_it_Live-indigen--rag.vercel.app-1A56DB?style=for-the-badge)](https://indigen-rag.vercel.app/)

</div>
