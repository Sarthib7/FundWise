# FundWise Ops Runbook

**Last updated:** 2026-05-11
**Scope:** Split Mode mainnet launch prep and production operations.

This runbook supports FW-038 and FW-039. It avoids secrets; paste real values only into Supabase / Cloudflare dashboards or local `.env.local`, never into git.

## 1. Production environment map

| Component | Production value / rule |
| --- | --- |
| Web host | `https://fundwise.fun` on Cloudflare Pages |
| Public app cluster | Solana `mainnet-beta` for Split Mode |
| Fund Mode cluster | Devnet only, invite-gated |
| Supabase projects | Two projects: `fundwise-prod` and `fundwise-devnet-beta` |
| Primary RPC | Helius mainnet RPC |
| Fallback RPCs | One or more non-Helius providers in `NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS` |
| Settlement asset | Mainnet USDC mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

## 2. Create `fundwise-prod` Supabase project

Manual owner steps:

1. In Supabase dashboard, create a new project named `fundwise-prod`.
2. Use a strong database password and store it in your password manager.
3. Keep the existing devnet beta project untouched.
4. Copy these production values for Cloudflare Pages env setup:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

Do not paste keys into chat or commit them.

## 3. Replay migrations

From a local shell authenticated to Supabase CLI:

```bash
supabase --version
supabase login
supabase link --project-ref <fundwise-prod-project-ref>
supabase db push --dry-run
supabase db push --include-all
supabase migration list
```

Notes:

- `supabase db push --include-all` is intentional for bootstrapping a fresh prod project with all local migrations.
- Confirm these migrations are present in the remote history:
  - `20260428201405_bootstrap_core_schema.sql`
  - `20260506223000_lock_down_public_ledger_rls.sql`
  - `20260506224000_add_expense_ledger_constraints.sql`
  - `20260509120000_anchor_proposals_to_squads_governance.sql`
  - `20260509123000_add_proposal_audit_trail.sql`

## 4. Verify anonymous REST lockdown

Set local env to the **prod** Supabase URL + publishable key, then run:

```bash
pnpm supabase:verify-rls
```

Expected output:

```text
RLS verification passed: anonymous ledger reads are empty and anonymous insert is denied by RLS.
```

If it fails:

1. Do not launch mainnet.
2. Re-run `supabase db push --include-all` against the prod project.
3. Confirm `20260506223000_lock_down_public_ledger_rls.sql` applied.
4. Re-run `pnpm supabase:verify-rls`.

## 5. Production Cloudflare Pages env vars

Set these in the Cloudflare Pages production environment:

```text
NEXT_PUBLIC_SOLANA_RPC_URL=<Helius mainnet RPC URL>
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS=<comma-separated fallback mainnet RPC URLs>
NEXT_PUBLIC_SUPABASE_URL=<fundwise-prod URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<fundwise-prod publishable key>
SUPABASE_SERVICE_ROLE_KEY=<fundwise-prod service role key>
FUNDWISE_SESSION_SECRET=<new random production secret>
FUNDWISE_ENABLE_CSP=false
```

Rules:

- `FUNDWISE_SESSION_SECRET` must be different from devnet / local.
- Keep `FUNDWISE_ENABLE_CSP=false` until wallet, QR scanner, Supabase, LI.FI, and receipt flows are browser-QA'd with CSP enabled.
- Do not configure Fund Mode public access for prod. Keep `FUNDWISE_FUND_MODE_INVITE_WALLETS` absent or tightly scoped.

Generate a production session secret locally with:

```bash
openssl rand -base64 48
```

## 6. Backups and restore procedure

Supabase dashboard steps:

1. Open `fundwise-prod` → Database → Backups.
2. Confirm daily backups are enabled for the project tier.
3. Before mainnet launch, create or note the latest restorable backup timestamp.
4. Record the restore window in the private ops notes.

Restore drill (if production data is corrupted):

1. Pause new public sign-ins if the app is writing bad data.
2. In Supabase dashboard, restore `fundwise-prod` to a new temporary project or PITR timestamp if available.
3. Validate restored tables: `groups`, `members`, `expenses`, `expense_splits`, `settlements`.
4. Point Cloudflare env vars at the restored project only after validation.
5. Rotate `SUPABASE_SERVICE_ROLE_KEY` and `FUNDWISE_SESSION_SECRET` after any suspected secret exposure.
6. Document the incident in `docs/incident-log.md` before resuming launch comms.

## 7. Mainnet rehearsal gate

Before FW-039 starts, all must be true:

- `pnpm test` passes.
- `pnpm build` passes.
- `pnpm build:pages` passes.
- `pnpm supabase:verify-rls` passes against `fundwise-prod`.
- Cloudflare production env uses mainnet RPC and prod Supabase.
- Two real wallets are funded with approximately `$5 USDC + $1 SOL` each.

## 8. Rollback notes

If a launch blocker appears:

- Bad Supabase config: revert Cloudflare env vars to the previous known-good project or pause sign-ins.
- Bad session config: rotate `FUNDWISE_SESSION_SECRET`; all browser sessions are invalidated.
- Bad settlement path: stop announcing launch, fix, redeploy, rerun the full FW-039 rehearsal.
- On-chain transfers cannot be rolled back; communicate clearly in Telegram and preserve transaction evidence.
