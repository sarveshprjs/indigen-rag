-- Run this in Supabase SQL Editor

-- Enable pgvector extension
create extension if not exists vector;

-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text,
  uploaded_at timestamptz default now()
);

-- Chunks table with embeddings + full-text search
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid references documents(id) on delete cascade,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(384),
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz default now()
);

-- Vector similarity index
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Full-text search index
create index if not exists chunks_fts_idx on chunks using gin(fts);

-- Hybrid search function (semantic + BM25 via RRF)
create or replace function hybrid_search(
  query_text text,
  query_embedding vector(384),
  match_count int default 8,
  rrf_k int default 60
)
returns table (
  id uuid,
  doc_id uuid,
  content text,
  metadata jsonb,
  score float
)
language plpgsql
as $$
declare
  semantic_results record;
  keyword_results record;
begin
  return query
  with semantic as (
    select
      c.id,
      c.doc_id,
      c.content,
      c.metadata,
      row_number() over (order by c.embedding <=> query_embedding) as rank
    from chunks c
    order by c.embedding <=> query_embedding
    limit match_count * 2
  ),
  keyword as (
    select
      c.id,
      c.doc_id,
      c.content,
      c.metadata,
      row_number() over (order by ts_rank(c.fts, plainto_tsquery('english', query_text)) desc) as rank
    from chunks c
    where c.fts @@ plainto_tsquery('english', query_text)
    order by ts_rank(c.fts, plainto_tsquery('english', query_text)) desc
    limit match_count * 2
  ),
  combined as (
    select
      coalesce(s.id, k.id) as id,
      coalesce(s.doc_id, k.doc_id) as doc_id,
      coalesce(s.content, k.content) as content,
      coalesce(s.metadata, k.metadata) as metadata,
      coalesce(1.0 / (rrf_k + s.rank), 0) +
      coalesce(1.0 / (rrf_k + k.rank), 0) as score
    from semantic s
    full outer join keyword k on s.id = k.id
  )
  select * from combined
  order by score desc
  limit match_count;
end;
$$;
