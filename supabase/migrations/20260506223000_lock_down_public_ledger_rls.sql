-- Lock down direct anonymous access to FundWise ledger tables.
-- The Next.js API now performs wallet-session checks and uses the service role
-- server-side, so public clients should not read or mutate these tables through
-- Supabase REST directly.

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
drop policy if exists "Anyone can create groups" on public.groups;
drop policy if exists "Only creator can update groups" on public.groups;
drop policy if exists "Wallet-only MVP can update groups" on public.groups;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Wallet-only MVP can create profiles" on public.profiles;
drop policy if exists "Wallet-only MVP can update profiles" on public.profiles;

drop policy if exists "Members are viewable by everyone" on public.members;
drop policy if exists "Anyone can add members" on public.members;

drop policy if exists "Expenses are viewable by everyone" on public.expenses;
drop policy if exists "Anyone can create expenses" on public.expenses;
drop policy if exists "Anyone can update expenses" on public.expenses;

drop policy if exists "Splits are viewable by everyone" on public.expense_splits;
drop policy if exists "Anyone can create splits" on public.expense_splits;

drop policy if exists "Settlements are viewable by everyone" on public.settlements;
drop policy if exists "Anyone can create settlements" on public.settlements;

drop policy if exists "Contributions are viewable by everyone" on public.contributions;
drop policy if exists "Anyone can create contributions" on public.contributions;

drop policy if exists "Proposals are viewable by everyone" on public.proposals;
drop policy if exists "Anyone can create proposals" on public.proposals;
drop policy if exists "Anyone can update proposals" on public.proposals;

drop policy if exists "Approvals are viewable by everyone" on public.proposal_approvals;
drop policy if exists "Anyone can create approvals" on public.proposal_approvals;
