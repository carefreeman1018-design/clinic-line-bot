-- Run this file in Supabase SQL Editor to create all backend tables used by the bot.

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

create index if not exists knowledge_chunks_metadata_idx
  on knowledge_chunks
  using gin (metadata);

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
language plpgsql
stable
as $$
begin
  perform set_config('ivfflat.probes', '100', true);

  return query
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
end;
$$;

create table if not exists line_conversation_messages (
  id bigserial primary key,
  line_user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists line_conversation_messages_user_time_idx
  on line_conversation_messages (line_user_id, created_at desc, id desc);

create table if not exists bot_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists response_styles (
  id text primary key,
  display_name text not null,
  voice jsonb not null default '{}'::jsonb,
  preferred_phrases text[] not null default '{}',
  avoid_phrases text[] not null default '{}',
  boundary_phrases text[] not null default '{}',
  example_rewrites jsonb not null default '[]'::jsonb,
  doctor_name text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists doctor_review_cases (
  id bigserial primary key,
  line_user_id text not null,
  user_message text not null,
  conversation_summary text not null default '',
  conversation_snapshot jsonb not null default '[]'::jsonb,
  bot_draft text not null,
  final_reply text,
  doctor_reply text,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'closed', 'failed')),
  reviewer_line_user_id text,
  review_source_id text,
  sent_at timestamptz,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_review_cases_status_created_idx
  on doctor_review_cases (status, created_at desc, id desc);

create index if not exists doctor_review_cases_line_user_idx
  on doctor_review_cases (line_user_id, created_at desc, id desc);
