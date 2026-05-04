create extension if not exists "uuid-ossp";

create table if not exists public.groups (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null default upper(substring(uuid_generate_v4()::text, 1, 6)),
  name text not null,
  mode text not null default 'split' check (mode in ('split', 'fund')),
  stablecoin_mint text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  funding_goal bigint,
  approval_threshold int default 1,
  multisig_address text,
  treasury_address text,
  constraint valid_stablecoin check (stablecoin_mint ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
);

create table if not exists public.profiles (
  wallet text primary key,
  display_name text not null check (char_length(display_name) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  wallet text not null,
  display_name text,
  joined_at timestamptz not null default now(),
  unique(group_id, wallet)
);

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer text not null,
  created_by text not null,
  amount bigint not null,
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

create table if not exists public.expense_splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  wallet text not null,
  share bigint not null
);

create table if not exists public.settlements (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_wallet text not null,
  to_wallet text not null,
  amount bigint not null,
  mint text not null,
  tx_sig text not null,
  confirmed_at timestamptz not null default now()
);

create table if not exists public.contributions (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  member_wallet text not null,
  amount bigint not null,
  mint text not null,
  tx_sig text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  proposer_wallet text not null,
  recipient_wallet text not null,
  amount bigint not null,
  mint text not null,
  memo text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'executed', 'rejected', 'cancelled')),
  tx_sig text,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create table if not exists public.proposal_approvals (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  member_wallet text not null,
  approved_at timestamptz not null default now(),
  unique(proposal_id, member_wallet)
);

create index if not exists idx_members_group on public.members(group_id);
create index if not exists idx_members_wallet on public.members(wallet);
create index if not exists idx_expenses_group on public.expenses(group_id);
create index if not exists idx_expense_splits_expense on public.expense_splits(expense_id);
create index if not exists idx_settlements_group on public.settlements(group_id);
create index if not exists idx_contributions_group on public.contributions(group_id);
create index if not exists idx_proposals_group on public.proposals(group_id);

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.contributions enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_approvals enable row level security;

drop policy if exists "Groups are viewable by everyone" on public.groups;
create policy "Groups are viewable by everyone"
  on public.groups for select
  using (true);

drop policy if exists "Anyone can create groups" on public.groups;
create policy "Anyone can create groups"
  on public.groups for insert
  with check (true);

drop policy if exists "Only creator can update groups" on public.groups;
create policy "Only creator can update groups"
  on public.groups for update
  using (created_by = auth.uid()::text);

drop policy if exists "Wallet-only MVP can update groups" on public.groups;
create policy "Wallet-only MVP can update groups"
  on public.groups for update
  using (true)
  with check (true);

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Wallet-only MVP can create profiles" on public.profiles;
create policy "Wallet-only MVP can create profiles"
  on public.profiles for insert
  with check (true);

drop policy if exists "Wallet-only MVP can update profiles" on public.profiles;
create policy "Wallet-only MVP can update profiles"
  on public.profiles for update
  using (true)
  with check (true);

drop policy if exists "Members are viewable by everyone" on public.members;
create policy "Members are viewable by everyone"
  on public.members for select
  using (true);

drop policy if exists "Anyone can add members" on public.members;
create policy "Anyone can add members"
  on public.members for insert
  with check (true);

drop policy if exists "Expenses are viewable by everyone" on public.expenses;
create policy "Expenses are viewable by everyone"
  on public.expenses for select
  using (true);

drop policy if exists "Anyone can create expenses" on public.expenses;
create policy "Anyone can create expenses"
  on public.expenses for insert
  with check (true);

drop policy if exists "Anyone can update expenses" on public.expenses;
create policy "Anyone can update expenses"
  on public.expenses for update
  using (true);

drop policy if exists "Splits are viewable by everyone" on public.expense_splits;
create policy "Splits are viewable by everyone"
  on public.expense_splits for select
  using (true);

drop policy if exists "Anyone can create splits" on public.expense_splits;
create policy "Anyone can create splits"
  on public.expense_splits for insert
  with check (true);

drop policy if exists "Settlements are viewable by everyone" on public.settlements;
create policy "Settlements are viewable by everyone"
  on public.settlements for select
  using (true);

drop policy if exists "Anyone can create settlements" on public.settlements;
create policy "Anyone can create settlements"
  on public.settlements for insert
  with check (true);

drop policy if exists "Contributions are viewable by everyone" on public.contributions;
create policy "Contributions are viewable by everyone"
  on public.contributions for select
  using (true);

drop policy if exists "Anyone can create contributions" on public.contributions;
create policy "Anyone can create contributions"
  on public.contributions for insert
  with check (true);

drop policy if exists "Proposals are viewable by everyone" on public.proposals;
create policy "Proposals are viewable by everyone"
  on public.proposals for select
  using (true);

drop policy if exists "Anyone can create proposals" on public.proposals;
create policy "Anyone can create proposals"
  on public.proposals for insert
  with check (true);

drop policy if exists "Anyone can update proposals" on public.proposals;
create policy "Anyone can update proposals"
  on public.proposals for update
  using (true);

drop policy if exists "Approvals are viewable by everyone" on public.proposal_approvals;
create policy "Approvals are viewable by everyone"
  on public.proposal_approvals for select
  using (true);

drop policy if exists "Anyone can create approvals" on public.proposal_approvals;
create policy "Anyone can create approvals"
  on public.proposal_approvals for insert
  with check (true);

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
