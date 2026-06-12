-- Run this in the Supabase SQL editor if you already created the old schema
-- with vector(1536) (OpenAI/Gemini sized embeddings) and are switching to the
-- free Hugging Face sentence-transformers/all-MiniLM-L6-v2 model (384 dims).
--
-- This DROPS existing chunk embeddings — you'll need to re-ingest your PDFs
-- after running this (the chunks/text stay structurally fine, only the
-- embedding column + index + RPC change).

-- 1. Drop the old vector index (dimension is baked into ivfflat index, must rebuild)
drop index if exists chunks_embedding_idx;

-- 2. Clear existing 1536-dim embeddings and resize the column to 384
alter table chunks alter column embedding type vector(384) using null;

-- 3. Recreate the index for the new dimension
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4. Recreate hybrid_search with the new query_embedding dimension
--    (copy the full function body from supabase-schema.sql, just with
--     vector(384) instead of vector(1536) — already updated there)
-- Drop the old 1536-dim signature first so Postgres doesn't keep both overloads:
drop function if exists hybrid_search(text, vector(1536), int, int);

-- Then re-run the `create or replace function hybrid_search(...)` block from
-- supabase-schema.sql (now using vector(384)).

-- 5. Re-ingest your PDFs via /ingest so chunks get real 384-dim embeddings.
