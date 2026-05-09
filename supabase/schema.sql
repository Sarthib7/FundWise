-- FundWise Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- GROUPS
-- =============================================
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null default upper(substring(uuid_generate_v4()::text, 1, 6)),
  name text not null,
  mode text not null default 'split' check (mode in ('split', 'fund')),
  stablecoin_mint text not null,
  created_by text not null,
  created_at timestamptz not null default now(),

  -- Fund Mode fields (nullable, only used when mode = 'fund')
  funding_goal bigint, -- in smallest token unit
  approval_threshold int default 1, -- N-of-M approvals needed
  multisig_address text, -- Squads multisig PDA
  treasury_address text, -- Squads multisig vault address

  constraint valid_stablecoin check (stablecoin_mint ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
);

-- =============================================
-- PROFILES
-- =============================================
create table public.profiles (
  wallet text primary key,
  display_name text not null check (char_length(display_name) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- GROUP MEMBERS
-- =============================================
create table public.members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  wallet text not null,
  display_name text,
  joined_at timestamptz not null default now(),

  unique(group_id, wallet)
);

-- =============================================
-- EXPENSES (Split Mode)
-- =============================================
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer text not null, -- wallet address
  created_by text not null, -- wallet address that owns edit/delete
  amount bigint not null check (amount > 0), -- in smallest token unit
  mint text not null,
  memo text,
  category text default 'general',
  split_method text not null default 'equal' check (split_method in ('equal', 'exact', 'shares', 'percentage')),
  source_currency text default 'USD',
  source_amount bigint,
  exchange_rate double precision,
  exchange_rate_source text,
  exchange_rate_at timestamptz,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

-- =============================================
-- EXPENSE SPLITS
-- =============================================
create table public.expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  wallet text not null,
  share bigint not null check (share >= 0) -- in smallest token unit
);

create or replace function public.update_expense_with_splits(
  p_expense_id uuid,
  p_actor_wallet text,
  p_payer text,
  p_amount bigint,
  p_mint text,
  p_memo text,
  p_category text,
  p_split_method text,
  p_splits jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense public.expenses%rowtype;
  v_lock_timestamp timestamptz;
begin
  if p_split_method not in ('equal', 'exact', 'shares', 'percentage') then
    raise exception 'Invalid split method';
  end if;

  if jsonb_typeof(p_splits) <> 'array' or jsonb_array_length(p_splits) = 0 then
    raise exception 'Expense must include at least one split';
  end if;

  select *
  into v_expense
  from public.expenses
  where id = p_expense_id
  for update;

  if not found or v_expense.deleted_at is not null then
    raise exception 'Expense not found';
  end if;

  if v_expense.created_by <> p_actor_wallet then
    raise exception 'Only the Expense creator can edit this Expense';
  end if;

  v_lock_timestamp := coalesce(v_expense.edited_at, v_expense.created_at);

  if exists (
    select 1
    from public.settlements
    where group_id = v_expense.group_id
      and confirmed_at > v_lock_timestamp
  ) then
    raise exception 'This expense is locked because a later settlement has already been recorded in the group';
  end if;

  delete from public.expense_splits
  where expense_id = p_expense_id;

  insert into public.expense_splits (expense_id, wallet, share)
  select
    p_expense_id,
    split_entry ->> 'wallet',
    (split_entry ->> 'share')::bigint
  from jsonb_array_elements(p_splits) as split_entry;

  update public.expenses
  set
    payer = p_payer,
    amount = p_amount,
    mint = p_mint,
    memo = nullif(btrim(coalesce(p_memo, '')), ''),
    category = coalesce(nullif(btrim(coalesce(p_category, '')), ''), 'general'),
    split_method = p_split_method,
    edited_at = now()
  where id = p_expense_id;
end;
$$;

-- =============================================
-- SETTLEMENTS (Split Mode - on-chain proof)
-- =============================================
create table public.settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_wallet text not null,
  to_wallet text not null,
  amount bigint not null, -- in smallest token unit
  mint text not null,
  tx_sig text not null,
  confirmed_at timestamptz not null default now()
);

-- =============================================
-- FUND CONTRIBUTIONS (Fund Mode)
-- =============================================
create table public.contributions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_wallet text not null,
  amount bigint not null,
  mint text not null,
  tx_sig text not null,
  created_at timestamptz not null default now()
);

-- =============================================
-- PROPOSALS (Fund Mode)
-- =============================================
create table public.proposals (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  proposer_wallet text not null,
  recipient_wallet text not null,
  amount bigint not null,
  mint text not null,
  memo text,
  proof_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'executed', 'rejected', 'cancelled')),
  squads_transaction_index bigint,
  squads_proposal_address text,
  squads_transaction_address text,
  squads_create_tx_sig text,
  tx_sig text, -- filled when executed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  executed_at timestamptz
);

-- =============================================
-- PROPOSAL APPROVALS (Fund Mode)
-- =============================================
create table public.proposal_approvals (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  member_wallet text not null,
  decision text not null check (decision in ('approved', 'rejected')),
  tx_sig text not null,
  reviewed_at timestamptz not null default now(),
  unique(proposal_id, member_wallet)
);

-- =============================================
-- PROPOSAL COMMENTS (Fund Mode)
-- =============================================
create table public.proposal_comments (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  member_wallet text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- =============================================
-- PROPOSAL EDITS (Fund Mode)
-- =============================================
create table public.proposal_edits (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  editor_wallet text not null,
  changed_fields jsonb not null,
  created_at timestamptz not null default now()
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_members_group on public.members(group_id);
create index idx_members_wallet on public.members(wallet);
create index idx_expenses_group on public.expenses(group_id);
create index idx_expense_splits_expense on public.expense_splits(expense_id);
create index idx_settlements_group on public.settlements(group_id);
create index idx_contributions_group on public.contributions(group_id);
create index idx_proposals_group on public.proposals(group_id);
create index idx_proposal_comments_proposal on public.proposal_comments(proposal_id);
create index idx_proposal_edits_proposal on public.proposal_edits(proposal_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.contributions enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_approvals enable row level security;

-- Direct public Supabase access is intentionally closed.
-- The app uses wallet-session-protected HTTP routes plus the server-side service role
-- for reads and mutations. Leaving these tables without anon policies makes RLS
-- deny public REST reads/writes by default while service-role API handlers continue
-- to work.
