# PROMPTS.md — Sarvesh Bhushan Upasani
## Indigen Services Technical Assessment · Prompt Log

> Every prompt I personally typed to any AI tool, in order, verbatim.
> Committed incrementally alongside code — not added at the end.

---

## Session 1 — 2026-06-12 (Foundation + Hybrid Retrieval)

### Prompt 1
**Tool**: Claude  
**Goal**: Design the Supabase schema for hybrid retrieval (pgvector + BM25)  
**Prompt**:
```
Write a PostgreSQL schema for a RAG system that needs:
1. Documents table (id, name, source, uploaded_at)
2. Chunks table with 1536-dim vector embedding and full-text search tsvector
3. A stored function combining cosine similarity search with Postgres FTS using Reciprocal Rank Fusion
Use pgvector extension. The RRF function should take query_text and query_embedding as params.
```
**Result**: ✅ Worked. Had to adjust the FULL OUTER JOIN syntax for Supabase compatibility.

---

### Prompt 2
**Tool**: Claude  
**Goal**: Build the Next.js chat route with Vercel AI SDK multi-agent loop  
**Prompt**:
```
Using Vercel AI SDK 4 with @ai-sdk/anthropic, write a Next.js API route that:
- Uses streamText with maxSteps: 5 for multi-agent loop
- Has two tools: searchDocuments (calls hybrid search) and verifyGrounding (checks citations)
- System prompt must enforce: only answer from retrieved chunks, cite every claim, refuse if not grounded, surface contradictions explicitly
- Returns toDataStreamResponse()
```
**Result**: ✅ Worked. Adjusted tool parameter types to use Zod schemas.

---

### Prompt 3
**Tool**: Claude  
**Goal**: PDF chunking with semantic boundaries  
**Prompt**:
```
Write a TypeScript function that chunks text for RAG:
- Split on paragraph boundaries first (double newlines)
- Apply sliding window of 500 words with 80-word overlap
- Return array of {content, metadata: {position, docName}}
- Handle edge case where last chunk might be very short (min 30 chars)
```
**Result**: ✅ Worked first try.

---

### Prompt 4
**Tool**: Claude  
**Goal**: Professional dark-mode UI for chat with streaming reasoning trace  
**Prompt**:
```
Build a Next.js chat page using useChat from ai/react that shows:
1. A collapsible reasoning trace panel on the right showing each tool call as it fires
2. Suggested queries when no messages exist
3. Tool call badges on assistant messages
4. Typing indicator with 3 animated dots
5. Dark theme using CSS variables (bg: #0a0a0f, accent: #7c6fff)
No Tailwind for component styles, use inline styles. The reasoning trace must show live tool name and args.
```
**Result**: ✅ Worked. Had to add proper TypeScript types for toolInvocations.

---

<!-- Add more prompts here as you work. Commit after each session. -->

## Session 2 — [DATE] (Reliability + Eval)

### Prompt 5
**Tool**: [Claude/ChatGPT/Copilot]  
**Goal**: [What were you trying to do?]  
**Prompt**:
```
[Your exact prompt here]
```
**Result**: [What happened? Did it work? What did you have to fix?]

---
