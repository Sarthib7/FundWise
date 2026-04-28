do $migration$
begin
  if to_regclass('public.expenses') is null
    or to_regclass('public.expense_splits') is null
    or to_regclass('public.settlements') is null then
    return;
  end if;

  execute $function$
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
  $function$;
end;
$migration$;
