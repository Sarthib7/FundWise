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
  treasury_address text, -- Squads multisig vault address

  constraint valid_stablecoin check (stablecoin_mint ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
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
  amount bigint not null, -- in smallest token unit
  mint text not null,
  memo text,
  category text default 'general',
  split_method text not null default 'equal' check (split_method in ('equal', 'exact', 'shares', 'percentage')),
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
  share bigint not null -- in smallest token unit
);

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
  status text not null default 'pending' check (status in ('pending', 'approved', 'executed', 'rejected', 'cancelled')),
  tx_sig text, -- filled when executed
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

-- =============================================
-- PROPOSAL APPROVALS (Fund Mode)
-- =============================================
create table public.proposal_approvals (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  member_wallet text not null,
  approved_at timestamptz not null default now(),
  unique(proposal_id, member_wallet)
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

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.contributions enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_approvals enable row level security;

-- Groups: anyone can read, only creator can insert/update
create policy "Groups are viewable by everyone"
  on public.groups for select
  using (true);

create policy "Anyone can create groups"
  on public.groups for insert
  with check (true);

create policy "Only creator can update groups"
  on public.groups for update
  using (created_by = auth.uid()::text);

-- Members: anyone can read, anyone can join
create policy "Members are viewable by everyone"
  on public.members for select
  using (true);

create policy "Anyone can add members"
  on public.members for insert
  with check (true);

-- Expenses: anyone can read, any member can create
create policy "Expenses are viewable by everyone"
  on public.expenses for select
  using (true);

create policy "Anyone can create expenses"
  on public.expenses for insert
  with check (true);

create policy "Anyone can update expenses"
  on public.expenses for update
  using (true);

-- Expense splits: anyone can read/insert
create policy "Splits are viewable by everyone"
  on public.expense_splits for select
  using (true);

create policy "Anyone can create splits"
  on public.expense_splits for insert
  with check (true);

-- Settlements: anyone can read/insert
create policy "Settlements are viewable by everyone"
  on public.settlements for select
  using (true);

create policy "Anyone can create settlements"
  on public.settlements for insert
  with check (true);

-- Contributions: anyone can read/insert
create policy "Contributions are viewable by everyone"
  on public.contributions for select
  using (true);

create policy "Anyone can create contributions"
  on public.contributions for insert
  with check (true);

-- Proposals: anyone can read/insert
create policy "Proposals are viewable by everyone"
  on public.proposals for select
  using (true);

create policy "Anyone can create proposals"
  on public.proposals for insert
  with check (true);

create policy "Anyone can update proposals"
  on public.proposals for update
  using (true);

-- Proposal approvals: anyone can read/insert
create policy "Approvals are viewable by everyone"
  on public.proposal_approvals for select
  using (true);

create policy "Anyone can create approvals"
  on public.proposal_approvals for insert
  with check (true);
