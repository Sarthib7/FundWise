-- FundWise platform fee ledger (FW-066, ADR-0036).
--
-- Records every on-chain platform fee collected via the Fees Module
-- (Creation, Contribution, Reimbursement, Routing). One row per fee leg.
-- Service-role only — operator reconciliation surface; never read by
-- anon or authenticated clients. RLS denies by default; no public policy.
--
-- Idempotent on (tx_sig, kind) so `Fees.record` can be safely retried after
-- on-chain success without producing duplicate rows.

create table if not exists public.platform_fee_ledger (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('creation', 'contribution', 'reimbursement', 'routing')),
  fee_amount bigint not null check (fee_amount >= 0),
  mint text not null,
  cluster text not null check (cluster in ('mainnet-beta', 'devnet', 'custom')),
  fee_wallet text not null,
  payer_wallet text not null,
  group_id uuid references public.groups(id) on delete set null,
  tx_sig text not null,
  recorded_at timestamptz not null default now()
);

create unique index if not exists platform_fee_ledger_tx_sig_kind
  on public.platform_fee_ledger (tx_sig, kind);

create index if not exists platform_fee_ledger_recorded_at
  on public.platform_fee_ledger (recorded_at desc);

create index if not exists platform_fee_ledger_group_id
  on public.platform_fee_ledger (group_id);

-- Read/write through service_role only (operator reconciliation).
alter table public.platform_fee_ledger enable row level security;

-- No public/anon/authenticated policy — defaults deny.
revoke all on public.platform_fee_ledger from public, anon, authenticated;
grant select, insert on public.platform_fee_ledger to service_role;

comment on table public.platform_fee_ledger is
  'FW-066 (ADR-0036): On-chain platform fee collection ledger. '
  'One row per collected fee leg. Service-role only.';
comment on column public.platform_fee_ledger.kind is
  'Fee surface: creation | contribution | reimbursement | routing.';
comment on column public.platform_fee_ledger.fee_amount is
  'Fee amount in base units of the mint (e.g., USDC has 6 decimals).';
comment on column public.platform_fee_ledger.cluster is
  'Solana cluster the fee was collected on.';
comment on column public.platform_fee_ledger.fee_wallet is
  'FUNDWISE_PLATFORM_FEE_WALLET address that received the fee.';
comment on column public.platform_fee_ledger.payer_wallet is
  'Buyer-pays — wallet that signed (or for reimbursement, the Treasury PDA).';
comment on column public.platform_fee_ledger.group_id is
  'Nullable — routing fees may pre-date Group context.';
comment on column public.platform_fee_ledger.tx_sig is
  'On-chain signature of the transaction that included the fee transfer.';
