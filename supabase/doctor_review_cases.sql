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
