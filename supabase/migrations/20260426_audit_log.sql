-- Audit logging for all ledger mutations
-- Captures: who, what, when, outcome, txSig (if applicable), request metadata

create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  record_id uuid,
  actor_wallet text not null,
  actor_uid uuid, -- maps to auth.uid() if/when wallet auth is added
  request_id text, -- for tracing across systems
  payload jsonb, -- full input params (sans secrets)
  outcome text not null check (outcome in ('SUCCESS', 'FAILURE')),
  error_message text,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_log_table_record on public.audit_log(table_name, record_id);
create index idx_audit_log_actor_wallet on public.audit_log(actor_wallet);
create index idx_audit_log_created on public.audit_log(created_at desc);

-- RLS: allow inserts from service role only; reads by all
alter table public.audit_log enable row level security;

create policy "Anyone can read audit logs" on public.audit_log for select using (true);
create policy "Only service role can insert audit logs" on public.audit_log for insert with check (false);
