# Backend Trust Hardening — Design Document

**Target:** FundWise backend security — ensure all ledger mutations are authenticated and tamper-proof
**Phase:** 1 of 3 (Auth + Receipt Verification + RLS)
**Branch:** `feat/responsiveness-signoff`
**Status:** Infrastructure ready | Client integration pending auth layer

---

## Problem Statement

Current state allows **client-side direct table mutations** with no authentication:
- `supabase.from('expenses').insert()` from browser
- `p_actor_wallet` param in `update_expense_with_splits()` RPC can be spoofed
- RLS policies are `using (true)` (open to public writes)
- No on-chain proof verification for `settlements` or `contributions`

This means:
- Any user can impersonate another wallet by passing a fake `created_by` or `from_wallet`
- Any user can modify/delete any expense (only RESTRICTED by custom code, not enforced at DB layer)
- Settlements can be faked without any on-chain receipt

---

## Solution Overview

Three-layer defense:

| Layer | Purpose | Implementation |
|---|---|---|
| **1. Edge Functions (service role)** | Server-side mutation gate — no direct client table access | Supabase Edge Functions wired to specific endpoints |
| **2. Receipt verification (on-chain)** | Prove that a settlement/contribution actually occurred on-chain | Solana RPC `getTransaction` — verify txSig contains expected transfer |
| **3. Member-scoped RLS** | Enforce that only group members can mutate group data | Row-level security policies using `auth.uid()` (via Supabase Auth) |

---

## Database Changes

### New Tables

#### `audit_log`
Captures every attempted mutation with full context for compliance/debugging.

```sql
audit_log (
  id uuid PK,
  table_name,
  operation,
  record_id,
  actor_wallet,
  actor_uid,        -- maps to auth.uid() once wallet auth is live
  request_id,       -- request tracing
  payload jsonb,    -- full input (safe fields only)
  outcome,          -- SUCCESS / FAILURE
  error_message,
  ip_address inet,
  user_agent text,
  created_at
)
```

**Policies:**
- Read: public (for debugging)
- Write: service role only (Edge Functions)

---

### RLS Policy Updates (member-scoped)

All ledger tables now enforce:

```sql
-- expenses/splits: only group members can INSERT
create policy "Group members can create expenses" on expenses for insert
  with check (
    exists (
      select 1 from members
      where members.group_id = expenses.group_id
        and members.wallet = auth.uid()::text
    )
  );

-- settlements: Edge Functions insert via service_role; direct client blocks
create policy "Only service role can insert settlements" on settlements for insert
  with check (auth.role() = 'service_role');

-- members: can update own display name; group creator can update anyone
create policy "Members self-edit OR creator edit" on members for update
  using (wallet = auth.uid()::text or group_created_by = auth.uid()::text);
```

**Note:** Until Supabase Auth is set up, these policies will block all current client mutations. The Edge Functions are the migration bridge.

---

## Edge Functions

Supabase Edge Functions (Deno runtime) act as **trusted server-side API**. They:
1. Receive client request with parameters
2. Verify txSig on-chain (for settlement/contribution)
3. Verify group membership via admin client
4. Write ledger records
5. Write `audit_log` entry

**Functions created:**

| Name | Endpoint | Purpose |
|---|---|---|
| `add-expense` | `POST /functions/v1/add-expense` | Create expense + splits, verify all wallets are members |
| `delete-expense` | `POST /functions/v1/delete-expense` | Soft-delete expense, check settlement lock |
| `add-settlement` | `POST /functions/v1/add-settlement` | Verify Solana transfer txSig, then insert |
| `add-contribution` | `POST /functions/v1/add-contribution` | Verify Solana contribution txSig, then insert |
| `update-member-profile` | `POST /functions/v1/update-member-profile` | Update member display name, member-scoped |

**Shared libs (`_shared/`):**
- `audit.ts` → unified audit log writer
- `verify-tx.ts` → lightweight on-chain tx verification via Solana JSON-RPC
- `supabase-admin.ts` → admin client using `SUPABASE_SERVICE_ROLE_KEY`

---

### Receipt Verification Logic (`verify-tx.ts`)

```ts
// Parse Solana transaction instruction data
// Key checks:
// 1. SPL Token transfer discriminator = 0x03
// 2. source token account == expected.from
// 3. dest token account == expected.to
// 4. amount == expected.amount (raw token amount, not UI amount)
// 5. mint == expected.mint
// 6. tx confirmed (commitment: 'confirmed')

// Pays fee from transaction fee account
// Minimal SDK — uses raw RPC to keep Edge Function cold-start fast (~50MB vs 200MB)
```

**Assumptions:**
- RPC URL from `SOLANA_RPC_URL` env (Helius/Alchemy)
- Token amount is raw (not UI decimals) — client must send in smallest unit

---

## RPC Updates

### `update_expense_with_splits` migration

Changed signature from:
```sql
(p_expense_id, p_actor_wallet, ...)
```
to:
```sql
(p_expense_id, ..., p_actor_wallet DEFAULT NULL)
```

And now uses:
```sql
v_actor_wallet := coalesce(auth.uid()::text, p_actor_wallet);
```

**Migration path:**
- Existing RPC calls from client include `p_actor_wallet` → accepted as fallback (still unsecured)
- Once Supabase Auth is integrated, client will call via Edge Function using service_role, `auth.uid()` is set
- Legacy fallback allows gradual migration

---

### New RPC: `delete_expense_secure`

Wraps delete logic inside SQL with same lock guard, uses `auth.uid()` first, `p_actor_wallet` fallback.

---

## Client Migration Path (`lib/db.ts`)

**Current state:** Direct table ops from browser (insecure)
**Target state:** All mutations routed through Edge Functions

**Phase 1 (this PR):** Add Edge Functions + RLS migrations. No breaking changes; client still uses old paths.

**Phase 2 (after auth integration):**
```ts
// Old
await supabase.from('settlements').insert({...})

// New
await fetch('/functions/v1/add-settlement', {
  method: 'POST',
  headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({ groupId, fromWallet, toWallet, amount, mint, txSig }),
})
```

Functions to migrate:
- ✅ `addSettlement()` → call `add-settlement` EF
- ✅ `addContribution()` → call `add-contribution` EF
- ⚠️ `addExpense()` → can optionally call `add-expense` EF (or keep insert + RLS)
- ⚠️ `deleteExpense()` → call `delete-expense` EF
- ⚠️ `updateMemberDisplayName()` → call `update-member-profile` EF
- ⚠️ `updateExpense()` → already uses RPC; change to call via Edge Function or add auth header

---

## Supabase Auth Requirements

To fully activate member-scoped RLS:

1. **Enable Supabase Auth** (email/password or social)
2. **Add wallet claim to user metadata** after wallet connect
3. **Client stores JWT** and includes in `Authorization: Bearer <token>` header
4. **Edge Functions forward JWT** to Supabase admin client (automatically sets `auth.uid()`)

_Lightweight alternative:_ Use **Supabase anon key with custom JWT** signed by wallet signature (outside scope for now).

---

## Environment Variables Required

| Variable | Purpose | Example |
|---|---|---|
| `SUPABASE_URL` | Project URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for Edge Functions | `eyJ...` |
| `SOLANA_RPC_URL` | RPC for tx verification | `https://api.mainnet-beta.solana.com` |

These go into Supabase Project Settings → Edge Functions → Environment Variables.

---

## Deployment Steps

1. **Apply all migrations** (Supabase SQL editor or `supabase db push`)
   - `20260426_audit_log.sql`
   - `20260426_rls_member_scoped.sql`
   - `20260426_update_rpc_auth.sql`

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy add-settlement
   supabase functions deploy add-contribution
   supabase functions deploy add-expense
   supabase functions deploy delete-expense
   supabase functions deploy update-member-profile
   ```

   Or use GitHub Actions/CI pipeline.

3. **Configure env vars** in Supabase dashboard per function deployment

4. **Update `lib/db.ts`** to call Edge Functions (post-auth)

5. **Test flow:**
   - Create group (client-side OK — RLS not enforced yet)
   - Add expense via Edge Function → audit entry created
   - Record settlement via Edge Function → txSig verified on-chain
   - Check `audit_log` for entries with `outcome = 'SUCCESS'`

---

## Rollback Safety

- **Edge Functions are additive** → no impact on existing client code
- **RLS policies are selective** → `USING` checks only fire on rows the client actually accesses
  - Public reads remain open
  - Writes from anon client are blocked once auth is live
- **RPC updates create new version** → old version still callable if needed
- **Audit_log** read-only for public; service can always insert

**Emergency:** Disable Edge Functions by removing route handlers; revert RLS with `drop policy` statements.

---

## Open Questions

| Question | Decision | Notes |
|---|---|---|
| **Auth system** | Supabase Auth (email+wallet) vs custom JWT | Needs product decision |
| **RPC amount type** | Should `amount` be `bigint` (base units) or `float` (display)? | Currently bigint; frontend has conversion helpers |
| **LI.FI bridge txSig format** | Bridge receipts differ from native transfers | Need adapter per provider in `verify-tx.ts` |
| **Batch operations** | How to handle multi-split expense efficiently | Individual function call per split not needed; atomic split insert works |

---

## Implementation Progress

- [x] Audit log table SQL
- [x] RLS member-scoped policies SQL
- [x] RPC auth migration SQL (`update_expense_with_splits`, `delete_expense_secure`)
- [x] Edge Function: `add-settlement` (with txSig verification)
- [x] Edge Function: `add-contribution` (with txSig verification)
- [x] Edge Function: `add-expense` (membership guard)
- [x] Edge Function: `delete-expense` (RPC wrapper)
- [x] Edge Function: `update-member-profile`
- [ ] Client migration to call Edge Functions (blocked on Supabase Auth rollout)
- [ ] Unit tests for tx verification edge cases
- [ ] Load test for Edge Functions cold-start latency
- [ ] Audit log retention policy (30d → delete, 90d → archive to S3)

---

## Next Actions

1. **Set up Supabase Auth** with email/password + wallet connect
2. **Expose `auth.uid()` ↔ wallet address mapping** (maybe via `auth.users()`)
3. **Update `lib/db.ts`**: add optional `accessToken` param → inject into EF fetch headers
4. **Migrate `addExpense()` → EF** (keep fallback for unauthenticated guest usage)
5. **Update group creation** to include creator as member via EF
6. **Write ADRs** summarizing design choices (design doc already inline)

---

*Last updated: 2026-04-26 — Sarthi / Hermes*
