-- FundWise Fund Mode beta completion migration
-- Covers FW-045 (member roles), FW-060 (threshold-change proposals),
-- FW-047 (creation fees), FW-061 / FW-062 / FW-063 (monetization
-- telemetry), and the read surface for FW-064 (beta admin dashboard).
--
-- Safe to replay: every `add column`/`create table`/`create index`
-- statement uses `if not exists`. Re-running is a no-op.

-- =============================================
-- FW-045: Member roles (Admin / Member / Viewer)
-- =============================================
-- Roles stored in FundWise; Squads stays the on-chain authority for
-- multisig operations. Admin can change threshold + invite, Member can
-- propose/approve/execute, Viewer is read-only.
alter table public.members
  add column if not exists role text not null default 'member';

alter table public.members
  drop constraint if exists members_role_valid;

alter table public.members
  add constraint members_role_valid
  check (role in ('admin', 'member', 'viewer'));

-- Backfill: existing group creators become admins so previous Groups
-- keep working. Anyone else stays a plain member.
update public.members m
   set role = 'admin'
  from public.groups g
 where g.id = m.group_id
   and g.created_by = m.wallet
   and m.role = 'member';

create index if not exists idx_members_group_role on public.members(group_id, role);

-- =============================================
-- FW-060: Proposal kind discriminator + threshold-change support
-- =============================================
-- Reimbursement and exit-refund proposals are the existing Squads-backed
-- flow. Threshold-change proposals are FundWise-internal governance —
-- they update groups.approval_threshold after the configured number of
-- approvals, without holding Squads transaction metadata.

alter table public.proposals
  add column if not exists kind text not null default 'reimbursement';

alter table public.proposals
  drop constraint if exists proposals_kind_valid;

alter table public.proposals
  add constraint proposals_kind_valid
  check (kind in ('reimbursement', 'threshold_change', 'exit_refund'));

alter table public.proposals
  add column if not exists target_threshold int;

-- threshold-change proposals don't move money, so reimbursement-only
-- fields become nullable. The composite check below enforces the right
-- shape per kind.
alter table public.proposals
  alter column recipient_wallet drop not null;
alter table public.proposals
  alter column amount drop not null;
alter table public.proposals
  alter column mint drop not null;

alter table public.proposals
  drop constraint if exists proposals_kind_payload;

alter table public.proposals
  add constraint proposals_kind_payload
  check (
    case kind
      when 'reimbursement' then
        recipient_wallet is not null
        and amount is not null
        and amount > 0
        and mint is not null
      when 'exit_refund' then
        recipient_wallet is not null
        and amount is not null
        and amount > 0
        and mint is not null
      when 'threshold_change' then
        target_threshold is not null
        and target_threshold > 0
      else false
    end
  );

create index if not exists idx_proposals_group_kind on public.proposals(group_id, kind);

-- =============================================
-- FW-047: Fund Mode creation fees (devnet beta monetization test)
-- =============================================
-- Records a per-Treasury "creation fee" telemetry row. Devnet fee is
-- paid in test stablecoin to a FundWise dev wallet; operator may also
-- record an opt-out ("skip") to surface willingness-to-pay friction at
-- the high-intent Treasury init moment.

create table if not exists public.fund_mode_creation_fees (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer_wallet text not null,
  amount bigint, -- in smallest token unit; null when skipped
  mint text,
  tx_sig text, -- null when skipped
  outcome text not null check (outcome in ('paid', 'skipped')),
  emulated_usd_cents int, -- equivalent mainnet fee shown to user, in cents
  notes text,
  created_at timestamptz not null default now(),
  unique(group_id, outcome)
);

create index if not exists idx_fund_mode_creation_fees_group
  on public.fund_mode_creation_fees(group_id);
create index if not exists idx_fund_mode_creation_fees_payer
  on public.fund_mode_creation_fees(payer_wallet);

alter table public.fund_mode_creation_fees enable row level security;

-- =============================================
-- FW-061 / FW-062 / FW-063: Monetization telemetry
-- =============================================
-- One table covers all three signals:
--   monthly_fee_wtp     — would-you-pay $X/mo banner response
--   free_tier_cap       — user hit the free-tier wall (member limit or AUM)
--   exit_survey         — member left a pool and answered 3 questions
-- The shape is intentionally loose (jsonb) so the beta findings doc can
-- evolve without further migrations.

create table if not exists public.monetization_responses (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('monthly_fee_wtp', 'free_tier_cap', 'exit_survey')),
  group_id uuid references public.groups(id) on delete set null,
  member_wallet text not null,
  emulated_usd_cents int,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint monetization_responses_wallet_format check (
    member_wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'
  )
);

create index if not exists idx_monetization_responses_kind
  on public.monetization_responses(kind);
create index if not exists idx_monetization_responses_group
  on public.monetization_responses(group_id);
create index if not exists idx_monetization_responses_wallet
  on public.monetization_responses(member_wallet);

alter table public.monetization_responses enable row level security;

-- =============================================
-- FW-064: Beta admin dashboard read view
-- =============================================
-- A flat row-per-Fund-Mode-Group view that the admin endpoint can
-- read with one query. Service-role only; no public REST access.
create or replace view public.fund_mode_beta_admin_view as
select
  g.id                                        as group_id,
  g.name                                      as group_name,
  g.code                                      as group_code,
  g.group_template,
  g.approval_threshold,
  g.created_by,
  g.created_at,
  g.multisig_address is not null              as treasury_initialized,
  (select count(*) from public.members m where m.group_id = g.id)                       as member_count,
  (select count(*) from public.contributions c where c.group_id = g.id)                 as contribution_count,
  (select coalesce(sum(c.amount), 0) from public.contributions c where c.group_id = g.id) as contribution_total,
  (select count(*) from public.proposals p where p.group_id = g.id)                     as proposal_count,
  (select count(*) from public.proposals p
    where p.group_id = g.id and p.status = 'executed')                                  as proposals_executed,
  (select max(c.created_at) from public.contributions c where c.group_id = g.id)        as last_contribution_at,
  (select max(p.executed_at) from public.proposals p where p.group_id = g.id)           as last_execution_at,
  (select count(*) from public.fund_mode_creation_fees f
    where f.group_id = g.id and f.outcome = 'paid')                                     as creation_fees_paid,
  (select count(*) from public.fund_mode_creation_fees f
    where f.group_id = g.id and f.outcome = 'skipped')                                  as creation_fees_skipped
from public.groups g
where g.mode = 'fund';

revoke all on public.fund_mode_beta_admin_view from public, anon, authenticated;
grant select on public.fund_mode_beta_admin_view to service_role;

-- =============================================
-- FW-038 mainnet readiness: helper to read pool template + threshold
-- for the dashboard read snapshot. Idempotent.
-- =============================================
comment on column public.members.role is
  'FW-045: Fund Mode member role. admin = manage threshold/invite; member = propose/approve/execute; viewer = read-only.';
comment on column public.proposals.kind is
  'FW-060: reimbursement | threshold_change | exit_refund.';
comment on column public.proposals.target_threshold is
  'FW-060: target N-of-M threshold for threshold_change Proposals.';
