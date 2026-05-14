-- Add Fundy Telegram authentication tables.
-- Users create short-lived link codes in the wallet-authenticated web app,
-- then paste `/link FW-XXXXXX` in Fundy's Telegram DM. Fundy consumes the
-- code through service auth and receives the linked wallet.

create table if not exists public.telegram_link_codes (
  id uuid primary key default uuid_generate_v4(),
  code_hash text not null unique,
  wallet text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,

  constraint telegram_link_codes_wallet_format check (wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  constraint telegram_link_codes_expiry_after_create check (expires_at > created_at)
);

create table if not exists public.telegram_wallet_links (
  id uuid primary key default uuid_generate_v4(),
  telegram_id text not null,
  telegram_username text,
  telegram_first_name text,
  telegram_last_name text,
  wallet text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  deactivated_at timestamptz,

  constraint telegram_wallet_links_telegram_id_format check (telegram_id ~ '^[1-9][0-9]{0,19}$'),
  constraint telegram_wallet_links_wallet_format check (wallet ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$')
);

create index if not exists idx_telegram_link_codes_wallet
  on public.telegram_link_codes(wallet);

create index if not exists idx_telegram_link_codes_expires_at
  on public.telegram_link_codes(expires_at);

create unique index if not exists idx_telegram_wallet_links_one_active_per_user
  on public.telegram_wallet_links(telegram_id)
  where active;

create index if not exists idx_telegram_wallet_links_wallet
  on public.telegram_wallet_links(wallet)
  where active;

alter table public.telegram_link_codes enable row level security;
alter table public.telegram_wallet_links enable row level security;

-- No anon/authenticated RLS policies by design. FundWise API routes use the
-- server-side service role after wallet-session or Fundy service-key checks.
