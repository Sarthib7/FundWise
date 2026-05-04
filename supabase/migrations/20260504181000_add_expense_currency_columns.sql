-- Add currency conversion columns to Expenses after the core schema exists.
-- ADR-0020 Decision 4, ADR-0017

alter table public.expenses
  add column if not exists source_currency text default 'USD',
  add column if not exists source_amount bigint,
  add column if not exists exchange_rate double precision,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_at timestamptz;

update public.expenses
set
  source_currency = 'USD',
  source_amount = amount,
  exchange_rate = 1.0,
  exchange_rate_source = 'default',
  exchange_rate_at = coalesce(created_at, now())
where source_currency is null;

comment on column public.expenses.source_currency is 'The real-world Source Currency the Member entered (USD, EUR, GBP, INR, AED)';
comment on column public.expenses.source_amount is 'Original Expense amount in the smallest unit of source_currency';
comment on column public.expenses.exchange_rate is 'Exchange Rate Snapshot used to convert source_amount into the USDC ledger amount';
comment on column public.expenses.exchange_rate_source is 'Provider used for the Exchange Rate Snapshot';
comment on column public.expenses.exchange_rate_at is 'Timestamp when the Exchange Rate Snapshot was fetched';
