create table if not exists line_conversation_messages (
  id bigserial primary key,
  line_user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists line_conversation_messages_user_time_idx
  on line_conversation_messages (line_user_id, created_at desc, id desc);

