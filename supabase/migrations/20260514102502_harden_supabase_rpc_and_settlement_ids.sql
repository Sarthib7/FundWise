-- Record the 2026-05-14 SQL Editor hardening in migration history.
--
-- The live Supabase project was verified with:
-- - anonymous ledger reads denied by RLS
-- - settlements.tx_sig protected by a unique index
-- - sensitive SECURITY DEFINER RPCs executable only by postgres/service_role
--
-- This migration sorts before 20260514104435_add_record_settlement_with_lock.sql,
-- so it only grants-locks update_expense_with_splits. The
-- record_settlement_locked grants are declared in the migration that creates it.

create unique index if not exists settlements_tx_sig_unique
  on public.settlements(tx_sig);

revoke all on function public.update_expense_with_splits(
  uuid, text, text, bigint, text, text, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.update_expense_with_splits(
  uuid, text, text, bigint, text, text, text, text, jsonb
) to service_role;
