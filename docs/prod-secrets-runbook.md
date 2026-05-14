# Production Secrets Runbook

**Owner:** sarthib7
**Status:** Live runbook — keep in sync with `docs/ops-runbook.md` and `docs/split-mode-mainnet-checklist.md`
**Last updated:** 2026-05-14

Every command in this runbook is meant to be **copy-pasted** as written. Replace the placeholder values (`<...>`) with real ones before running. Do not commit any of these values into the repo — they live in Cloudflare Pages env, Supabase project settings, or a 1Password vault.

---

## 1. Generate the prod session secret (FW-038a)

`FUNDWISE_SESSION_SECRET` signs the wallet challenge and wallet session cookies. The prod value MUST be different from the devnet value so a session compromise on one cluster does not bleed into the other.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

- 48 bytes (~64 base64url chars) gives ~256 bits of effective HMAC-SHA-256 key entropy.
- Paste the output into Cloudflare Pages > FundWise > Settings > Environment Variables > Production > `FUNDWISE_SESSION_SECRET`.
- Do NOT add it to Preview env. Preview previews of the prod branch should share Production env via Cloudflare's "Use production env for preview" toggle so we don't have to maintain two secrets.

Rotation cadence: rotate every 90 days OR immediately after any suspected leak. Rotation invalidates every active wallet session — users will be prompted to sign a fresh challenge on their next protected action.

---

## 2. Provision the production Supabase project (FW-038)

Repeat the runbook in `docs/ops-runbook.md` for a brand-new project. The short version:

```bash
# 1. Create the project in the Supabase dashboard. Region: same as Cloudflare prod (us-east).
# 2. Pull the project credentials.
export NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable-anon-key>"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"

# 3. Replay every migration in order.
pnpm dlx supabase@latest db push --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"

# 4. Verify the RLS lockdown and RPC/Settlement hardening.
pnpm supabase:verify-rls

# 5. Sanity-check stranded devnet mints (should return zero rows on a fresh prod project).
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  -c "select id, name, mode, stablecoin_mint, created_at from groups where mode = 'split' and stablecoin_mint in ('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', 'CXFaY4cXf25ZhFlexqroBfBceJ8YqWBsfaY3HQd9qucz') order by created_at desc;"
```

After step 4 passes, verify `settlements_tx_sig_unique` and the two sensitive RPC grants with `docs/ops-runbook.md` §5, then paste the three Supabase env vars into Cloudflare Pages Production env. The `SUPABASE_SERVICE_ROLE_KEY` is the one that grants the FundWise edge mutations write access — never put it in any client bundle or in Preview env. Confirm it is marked **Encrypt at rest** in Cloudflare.

---

## 3. Provision mainnet RPC URLs (FW-038b)

FundWise expects a primary mainnet RPC plus a comma-separated fallback list. Helius and Alchemy both work as primaries; we currently lean on Alchemy because that's the account the owner has provisioned.

```bash
# Cloudflare Pages Production env (paste in dashboard):
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/<alchemy-key>
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS=https://mainnet.helius-rpc.com/?api-key=<helius-key>,https://solana-rpc.publicnode.com
SOLANA_RPC_URL=$NEXT_PUBLIC_SOLANA_RPC_URL
```

If you only have Alchemy + the public node, that's fine for v1 — the fallback proxy auto-rotates on 429/503/transient errors so the second URL covers Alchemy outages.

For the Fund Mode beta (which is forced to devnet by `lib/expense-engine.ts`), also set:

```bash
SOLANA_DEVNET_RPC_URL=https://solana-devnet.g.alchemy.com/v2/<alchemy-devnet-key>
NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=$SOLANA_DEVNET_RPC_URL
SOLANA_DEVNET_RPC_FALLBACK_URLS=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_DEVNET_RPC_FALLBACK_URLS=$SOLANA_DEVNET_RPC_FALLBACK_URLS
```

Public devnet (`api.devnet.solana.com`) is acceptable as a fallback because devnet has no real money. Do not use any public mainnet endpoint as the **primary** — they rate-limit Cloudflare Workers aggressively.

---

## 4. Apply and verify the audit migrations before flipping prod RPC to mainnet

FW-053 ships a postgres function (`record_settlement_locked`) that the mutation layer falls back from gracefully if it isn't present, but the full TOCTOU protection only kicks in once the migration is replayed. ADR-0030 adds the required production hardening: `settlements.tx_sig` must be unique and both sensitive RPCs must execute only through `service_role`.

```bash
# From the local checkout, against the prod Supabase project:
pnpm dlx supabase@latest db push \
  --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

Verify the function exists:

```bash
psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" \
  -c "select proname, prosecdef from pg_proc where proname = 'record_settlement_locked';"
# Expect one row with prosecdef = t (SECURITY DEFINER).
```

Verify the index and RPC grants:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'settlements'
  and indexname = 'settlements_tx_sig_unique';

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in ('record_settlement_locked', 'update_expense_with_splits')
order by routine_name, grantee;
```

Expect the index to exist, and expect only `postgres` plus `service_role` on both RPCs.

---

## 5. Fund Mode beta invite wallets (FW-049)

Comma-separated Solana base58 wallets allowed to create invite-only Fund Mode Groups. The mutation layer trims whitespace but does not normalise case, so paste each address as it appears in Phantom (no surrounding spaces, no trailing commas).

```bash
FUNDWISE_FUND_MODE_INVITE_WALLETS=<wallet1>,<wallet2>,<wallet3>
```

Add to Preview env too if you want the same wallets to be able to test Fund Mode in preview builds.

---

## 6. Pre-deploy smoke checklist

Run these against the prod env vars (locally with the prod values exported, or as a Cloudflare Pages preview build) before flipping DNS:

```bash
pnpm install
pnpm exec tsc --noEmit
pnpm test
pnpm lint
pnpm build
pnpm lifi:readiness
pnpm supabase:verify-rls
```

All must pass. If anything fails, do not flip prod — open a `FW-*` issue and resolve before launch.

---

## 7. Post-deploy verification

After the prod build is live behind `https://fundwise.fun`:

1. Open the site in an incognito window. Connect Phantom on mainnet. Verify the cluster badge in the header says `mainnet` (green).
2. Sign the wallet challenge. Inspect cookies — both should be prefixed with `__Host-` (FundWise sets this in production only).
3. Hit `https://fundwise.fun/api/health` — expect `{ "ok": true }` plus a `204`/`200`.
4. Try to create a Fund Mode Group from a non-invite wallet — expect a clear error message, NOT a server 500.
5. Tail Cloudflare Logpush (Workers Analytics) for the first 15 minutes. Any 5xx other than `502 deploying` is worth investigating.

---

## 8. Rotating values mid-launch

If a secret leaks or a Member loses their seed phrase mid-launch:

| Value | Rotation steps |
| --- | --- |
| `FUNDWISE_SESSION_SECRET` | Regenerate via step 1, paste into Cloudflare, redeploy. Every active session is invalidated. |
| `SUPABASE_SERVICE_ROLE_KEY` | Rotate in Supabase dashboard. Paste new value into Cloudflare. Redeploy. |
| Alchemy / Helius RPC keys | Rotate in vendor dashboard. Update env. Redeploy. The fallback list keeps the app available during the swap. |
| `FUNDWISE_FUND_MODE_INVITE_WALLETS` | Add / remove a wallet, paste new list, redeploy. The check is read on every request. |

No value should ever appear in `pnpm logs`, Cloudflare logs, or git history. If you suspect any of these have leaked into a log or screenshot, rotate immediately and add a `FW-*` follow-up to harden the leak path.
