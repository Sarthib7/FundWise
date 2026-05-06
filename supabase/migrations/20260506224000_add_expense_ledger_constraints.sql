-- Guard new Expense ledger rows against invalid token-unit amounts.
-- Cross-row split sum validation stays in the server/RPC layer.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_amount_positive'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_amount_positive
      check (amount > 0)
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expense_splits_share_non_negative'
      and conrelid = 'public.expense_splits'::regclass
  ) then
    alter table public.expense_splits
      add constraint expense_splits_share_non_negative
      check (share >= 0)
      not valid;
  end if;
end $$;
