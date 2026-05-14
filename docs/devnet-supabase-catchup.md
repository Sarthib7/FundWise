# Devnet Supabase Migration Catch-up

**Owner:** sarthib7
**Last updated:** 2026-05-14
**Audience:** any operator who provisioned a Supabase project before all FundWise migrations existed and is now seeing a `POST /api/groups` → 400 with no obvious cause in the dev server log.

When a fresh Supabase project is wired to FundWise mid-development (the case for the current devnet operator), older Supabase deployments are missing migrations that the application code already depends on. The application has graceful fallbacks for some of these so the dev server stays usable, but the cleanest fix is to replay every pending migration.

This runbook is **copy-paste**. Paste each block into the Supabase SQL Editor (`Project → SQL Editor → New query`) and click Run.

---

## 1. Detect what's missing

```sql
-- 1a. Does `groups.group_template` exist? (FW-042)
select column_name, data_type, is_nullable
  from information_schema.columns
 where table_schema = 'public' and table_name = 'groups' and column_name = 'group_template';

-- 1b. Does `record_settlement_locked` exist? (FW-053)
select proname, prosecdef
  from pg_proc
 where proname = 'record_settlement_locked';

-- 1c. Does `proposals.proof_url` exist? (FW-029, already shipped on most projects)
select column_name
  from information_schema.columns
 where table_schema = 'public' and table_name = 'proposals' and column_name = 'proof_url';

-- 1d. Do the expense currency columns exist? (FW-017)
select column_name
  from information_schema.columns
 where table_schema = 'public' and table_name = 'expenses'
   and column_name in ('source_currency','source_amount','exchange_rate','exchange_rate_source','exchange_rate_at');
```

Each query returns **zero rows** if the migration is missing. If a row comes back, that migration has already been applied.

---

## 2. Apply `20260511150000_add_fund_mode_template_to_groups.sql` if section 1a is empty

Without this column, `POST /api/groups` returns 400 because the `createGroupMutation` insert references the column. The application now retries without the column when it sees a `PGRST204` / `column does not exist` error, so the dev server should still work after the FW-2026-05-14 fix — but you'll lose template support until you apply this.

```sql
alter table public.groups
  add column if not exists group_template text;

alter table public.groups
  drop constraint if exists groups_group_template_check;

alter table public.groups
  add constraint groups_group_template_check
  check (
    group_template is null
    or group_template in ('trip_pool', 'friend_fund', 'dao_grant', 'family_budget')
  );
```

---

## 3. Apply `20260514104435_add_record_settlement_with_lock.sql` if section 1b is empty

Without this RPC, settlements fall back to a non-locked two-step insert that has the FW-053 TOCTOU race. Application keeps working but the audit fix is not active.

```sql
create or replace function public.record_settlement_locked(
  p_group_id uuid,
  p_from_wallet text,
  p_to_wallet text,
  p_amount bigint,
  p_mint text,
  p_tx_sig text
)
returns table (id uuid, already_existed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.settlements%rowtype;
  v_new_id uuid;
begin
  perform 1
    from public.groups
   where id = p_group_id
   for update;

  if not found then
    raise exception 'Group not found' using errcode = 'P0002';
  end if;

  select *
    into v_existing
    from public.settlements
   where tx_sig = p_tx_sig
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

    id := v_existing.id;
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

  id := v_new_id;
  already_existed := false;
  return next;
end;
$$;

revoke all on function public.record_settlement_locked(
  uuid, text, text, bigint, text, text
) from public, anon, authenticated;

grant execute on function public.record_settlement_locked(
  uuid, text, text, bigint, text, text
) to service_role;
```

---

## 4. Verify

Re-run section 1 — every query should now return a row. Then sanity-check the dev flow:

```bash
# In the project directory:
pnpm dev
# Open http://127.0.0.1:3000, connect Phantom on devnet, sign the wallet challenge,
# go to /groups, click Create Group, enter "Test", click Create.
# Should land on /groups/<uuid> with no 400 in the server log.
```

If anything 400s again, share the exact toast message and the matching `POST /api/groups …` line; the new inline error banner in the dialog also shows the server message so the user can read it without opening devtools.

---

## 5. Going forward

For new operators standing up a Supabase project, prefer running every migration in `supabase/migrations/*.sql` in chronological order rather than copy-pasting individual blocks. The Supabase CLI does this in one command:

```bash
pnpm dlx supabase@latest db push \
  --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

That replays every file in `supabase/migrations/` in filename order. If you do not want to install the CLI, paste each migration in numeric order from the SQL editor instead.
