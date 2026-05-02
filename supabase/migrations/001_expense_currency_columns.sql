-- Add currency conversion columns to expenses
-- ADR-0020 Decision 4, ADR-0017

alter table public.expenses
  add column if not exists source_currency text default 'USD',
  add column if not exists source_amount bigint,
  add column if not exists exchange_rate double precision,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_at timestamptz;

-- Backfill existing expenses: USD is the default source currency
update public.expenses
set
  source_currency = 'USD',
  source_amount = amount,
  exchange_rate = 1.0,
  exchange_rate_source = 'default',
  exchange_rate_at = coalesce(created_at, now())
where source_currency is null;

comment on column public.expenses.source_currency is 'The real-world currency the member entered (USD, EUR, GBP, INR, AED)';
comment on column public.expenses.source_amount is 'Original amount in smallest unit of source_currency';
comment on column public.expenses.exchange_rate is 'Rate used to convert source_amount → USDC amount';
comment on column public.expenses.exchange_rate_source is 'API provider used for the rate (e.g. coingecko, default)';
comment on column public.expenses.exchange_rate_at is 'Timestamp when the rate was fetched';
