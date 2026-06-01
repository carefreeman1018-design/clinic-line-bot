create extension if not exists vector;

create table if not exists knowledge_chunks (
  id text primary key,
  source text not null,
  title text not null,
  content text not null,
  source_urls text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_embedding_idx
  on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists knowledge_chunks_source_idx
  on knowledge_chunks (source);

create or replace function match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  min_similarity float default 0.25
)
returns table (
  id text,
  source text,
  title text,
  content text,
  source_urls text[],
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.source,
    knowledge_chunks.title,
    knowledge_chunks.content,
    knowledge_chunks.source_urls,
    knowledge_chunks.metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) >= min_similarity
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;
