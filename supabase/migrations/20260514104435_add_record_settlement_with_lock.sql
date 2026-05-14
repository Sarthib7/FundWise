-- FW-053: record settlements atomically under a row lock on the parent group.
--
-- Before this migration, addSettlementMutation re-read the dashboard snapshot
-- twice around the on-chain verification, then inserted into settlements
-- without holding any lock. Concurrent settle calls could both pass the second
-- snapshot check and then race the insert, leaving the off-chain ledger in a
-- state that didn't match the simplified graph at the moment of insert.
--
-- This SECURITY DEFINER function takes a row lock on the parent group and
-- performs an idempotent insert: callers that retry with the same tx_sig get
-- the original settlement row back; callers that re-use a tx_sig with
-- different participants get a clear error.

-- The OUT columns of `returns table (...)` enter the function's namespace as
-- locals, which collides with the `id` columns on `groups` and `settlements`.
-- Rename the OUT columns to disambiguate, then alias every table query so the
-- planner never sees an unqualified `id`.
create or replace function public.record_settlement_locked(
  p_group_id uuid,
  p_from_wallet text,
  p_to_wallet text,
  p_amount bigint,
  p_mint text,
  p_tx_sig text
)
returns table (settlement_id uuid, already_existed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.settlements%rowtype;
  v_new_id uuid;
begin
  -- Row lock on the group serialises concurrent settlement inserts for the
  -- same Group without blocking other Groups.
  perform 1
    from public.groups g
   where g.id = p_group_id
   for update;

  if not found then
    raise exception 'Group not found' using errcode = 'P0002';
  end if;

  select s.*
    into v_existing
    from public.settlements s
   where s.tx_sig = p_tx_sig
   limit 1;

  if found then
    if v_existing.group_id <> p_group_id
       or v_existing.from_wallet <> p_from_wallet
       or v_existing.to_wallet <> p_to_wallet
       or v_existing.amount <> p_amount
       or v_existing.mint <> p_mint then
      raise exception 'Duplicate settlement tx_sig with mismatched payload'
        using errcode = '23505';
    end if;

    settlement_id := v_existing.id;
    already_existed := true;
    return next;
    return;
  end if;

  insert into public.settlements (
    group_id, from_wallet, to_wallet, amount, mint, tx_sig
  ) values (
    p_group_id, p_from_wallet, p_to_wallet, p_amount, p_mint, p_tx_sig
  )
  returning settlements.id into v_new_id;

  settlement_id := v_new_id;
  already_existed := false;
  return next;
end;
$$;

revoke all on function public.record_settlement_locked(
  uuid, text, text, bigint, text, text
) from public, anon, authenticated;

-- Service-role callers (the FundWise edge mutations) need execute privilege.
grant execute on function public.record_settlement_locked(
  uuid, text, text, bigint, text, text
) to service_role;
