alter table public.proposals
  add column if not exists proof_url text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.proposal_comments (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  member_wallet text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.proposal_edits (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  editor_wallet text not null,
  changed_fields jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_comments_proposal
  on public.proposal_comments(proposal_id);

create index if not exists idx_proposal_edits_proposal
  on public.proposal_edits(proposal_id);

alter table public.proposal_comments enable row level security;
alter table public.proposal_edits enable row level security;
