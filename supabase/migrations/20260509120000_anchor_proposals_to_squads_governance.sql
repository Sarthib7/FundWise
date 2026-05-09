alter table public.proposals
  add column if not exists squads_transaction_index bigint,
  add column if not exists squads_proposal_address text,
  add column if not exists squads_transaction_address text,
  add column if not exists squads_create_tx_sig text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'proposal_approvals'
      and column_name = 'approved_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'proposal_approvals'
      and column_name = 'reviewed_at'
  ) then
    alter table public.proposal_approvals rename column approved_at to reviewed_at;
  end if;
end $$;

alter table public.proposal_approvals
  add column if not exists decision text,
  add column if not exists tx_sig text;

update public.proposal_approvals
set decision = 'approved'
where decision is null;

update public.proposal_approvals
set tx_sig = 'legacy-db-review'
where tx_sig is null;

alter table public.proposal_approvals
  alter column decision set not null,
  alter column tx_sig set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'proposal_approvals_decision_check'
      and conrelid = 'public.proposal_approvals'::regclass
  ) then
    alter table public.proposal_approvals
      add constraint proposal_approvals_decision_check
      check (decision in ('approved', 'rejected'));
  end if;
end $$;
