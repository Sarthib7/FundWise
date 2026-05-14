# Split Mode — Mainnet Launch Checklist

**Owner:** sarthib7
**Target:** Public mainnet launch of Split Mode
**Strategy:** Public app pinned to mainnet for Split Mode. Fund Mode stays devnet, invite-only, hidden from the public UI.
**Last updated:** 2026-05-14

This file is the execution checklist for moving Split Mode from devnet to mainnet. Tick items as they ship. New blockers become indexed `FW-*` issues in `issues.md`, not new files.

---

## Current state

- ✅ Split Mode lifecycle works end-to-end on devnet (Group → invite → Expense → Balance → Settlement → Receipt)
- ✅ RLS lockdown, server-side ledger validation, settlement-graph enforcement, Squads governance shipped
- ✅ LI.FI `Route funds for Settlement` shipped
- ✅ LI.FI route metadata readiness check shipped as `pnpm lifi:readiness`
- ✅ Zerion CLI wallet readiness shipped
- ✅ Stablecoin mints are cluster-aware (FW-033)
- ✅ Cluster badge shows the active network on authenticated pages (FW-034)
- ✅ Multi-RPC fallback is wired through `NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS` (FW-035)
- ✅ Footer social links and draft legal pages exist (FW-036/FW-037)
- ✅ Baseline browser security headers are configured; CSP is opt-in behind `FUNDWISE_ENABLE_CSP=true` (FW-018)
- ✅ Mainnet pre-flight security hardening items are complete through FW-041; production env setup is next
- ✅ Production Supabase prep: `docs/ops-runbook.md` + `pnpm supabase:verify-rls` shipped (FW-038 HITL portion remains)
- ✅ Configured Supabase project hardening verified: RLS check passed, `settlements.tx_sig` unique, sensitive RPCs service-role-only
- ✅ Fund Mode pool templates shipped (FW-042)
- ✅ Fund Mode Telegram beta onboarding links shipped (FW-048)
- ⚠️ Confirm the hardened Supabase project is the separate production project before public mainnet launch
- ❌ Sentry blocked: `@sentry/nextjs` breaks `@cloudflare/next-on-pages`; need Cloudflare-native monitoring

---

## Mainnet map (target end state)

| Surface | Value |
| --- | --- |
| Production host | `https://fundwise.fun` |
| Default cluster | `mainnet-beta` |
| Primary RPC | Helius mainnet (`https://mainnet.helius-rpc.com/?api-key=...`) |
| Fallback RPCs | Triton / QuickNode (added as `NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS`) |
| USDC mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (6 decimals) |
| PYUSD mint | `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo` (6 decimals) |
| USDT mint | `Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ` (6 decimals) |
| Wallet adapter cluster | `mainnet-beta` (passed via env, not hardcoded) |
| Supabase project | Separate prod project (NOT the devnet one) |
| Session cookie prefix | `__Host-` in prod |
| Error monitoring | Sentry (or equivalent) before public launch |
| Wallets supported | Phantom, Solflare (mainnet) |
| Fund Mode visibility | Hidden in public UI; entry behind `FUNDWISE_FUND_MODE_INVITE_WALLETS` env check |

Cluster routing per the dual-cluster strategy:

- Split Mode Group → mainnet RPC
- Fund Mode Group → devnet RPC (forced; invite wallets only)
- Cluster badge in app header shows which network is active for the current Group

---

## Phase 1 — Pre-flight code (build mainnet-capable but ship under devnet flag)

| ID | Task | Status |
| --- | --- | --- |
| FW-033 | Cluster-aware `STABLECOIN_MINTS` — split into `{ devnet, mainnet }` keyed by cluster, fix PYUSD mainnet mint | **Done** (commit `a2f2fbd` on `checklist` branch) |
| FW-034 | Cluster badge in app header (`mainnet` green / `devnet` orange) — visible on every authenticated page | **Done** |
| FW-035 | Multi-RPC fallback — primary + comma-separated fallback URLs from env, automatic retry on RPC error | **Done** |
| FW-036 | Footer: X + Telegram social links; legal nav scaffold pointing to placeholder pages | **Done** |
| FW-037 | Privacy / Terms / Disclosures draft pages (v0, marked "draft, not yet legally reviewed") | **Done** |

**Code locations touched:**
- `lib/expense-engine.ts` (mint config — done in FW-033)
- `lib/solana-cluster.ts` (already has cluster helpers — add fallback RPC support)
- `components/footer.tsx`
- `components/header.tsx` (cluster badge)
- `next.config.mjs` (baseline security headers + opt-in CSP)
- `app/legal/privacy/page.tsx` (new)
- `app/legal/terms/page.tsx` (new)
- `app/legal/disclosures/page.tsx` (new)

**Pre-mainnet audit query** — run against the existing devnet beta Supabase project (and the new prod project once it exists in FW-038) to confirm no Split Mode groups are stranded on devnet-only mints:

```sql
-- Stranded check: Split Mode groups on devnet-only mint addresses
-- Expected on a fresh prod project: zero rows.
-- Expected on the devnet beta project: rows are fine because they stay on devnet.
select id, name, mode, stablecoin_mint, created_at
  from groups
 where mode = 'split'
   and stablecoin_mint in (
       '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', -- devnet test USDC
       'CXFaY4cXf25ZhFlexqroBfBceJ8YqWBsfaY3HQd9qucz'  -- devnet PYUSD placeholder
   )
 order by created_at desc;
```

---

## Phase 2 — Security hardening (must land before any mainnet wallet signs)

| ID | Task | Status |
| --- | --- | --- |
| FW-017 | Triage `pnpm audit` advisories; upgrade safe transitives, document accepted ones | **Done** |
| FW-018 | Browser security headers — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | **Done** |
| FW-023 | Rate-limit `/api/auth/wallet/challenge` and `/api/auth/wallet/verify` by IP + wallet; bind challenge message to origin + cluster; `__Host-` cookie prefix in prod | **Done** |
| FW-041 | Minimal OFAC SDN screening on wallet connect using OFAC SDN XML `Digital Currency Address - SOL`; block sanctioned wallets at login | **Done** |

Notes:
- CSP must allowlist Supabase, Helius, LI.FI, Zerion, Solana wallet adapter origins. Roll out behind a flag.
- OFAC check is a JSON-list comparison; not a full compliance program. Cheap insurance, lawyer can refine later.

---

## Phase 3 — Production environment setup

| ID | Task | Status |
| --- | --- | --- |
| FW-038 | Create separate prod Supabase project; replay schema migrations; replay RLS lockdown (FW-014 SQL); verify anonymous-read denial; verify RPC grants and `settlements.tx_sig` uniqueness; rotate `SUPABASE_SERVICE_ROLE_KEY` for prod | Partially complete — configured Supabase project hardened via SQL Editor on 2026-05-14; still confirm it is the separate prod project and wire Cloudflare prod env |
| FW-038a | Rotate `FUNDWISE_SESSION_SECRET` for prod; ensure not shared with devnet | New |
| FW-038b | Configure mainnet Helius RPC + fallback URLs as prod env vars in Cloudflare Pages | New |
| FW-038c | Daily Supabase backup confirmed enabled; document restore procedure in `docs/ops-runbook.md` | HITL — restore procedure documented |
| FW-038d | Sentry (or equivalent) error monitoring wired into prod build | Blocked — `@sentry/nextjs` breaks `@cloudflare/next-on-pages` with duplicated identifier error; must use Cloudflare-compatible alternative or wait for OpenNext |

**Supabase project structure** (resolved decision):

> Two separate Supabase projects: `fundwise-prod` (mainnet) and `fundwise-devnet-beta` (Fund Mode beta).
> Reason: cleanest isolation — mainnet has real money, devnet doesn't. Backups, secrets, and migrations all independent. Bug in one cluster can't leak to the other. Doubles admin overhead, which is acceptable at this scale.

---

## Phase 4 — Mainnet rehearsal (real USDC, two wallets, before public claim)

**Prerequisites:** Phases 1-3 done. Two real mainnet wallets funded with ~$5 USDC + ~$1 SOL each.

**LI.FI rehearsal rule:** Sepolia is not a valid FundWise rehearsal path. LI.FI's current guidance is to test integrations on mainnet, and `pnpm lifi:readiness` currently reports no Ethereum/Base/Arbitrum/OP Sepolia route into Solana USDC. Before public launch, run `pnpm lifi:readiness`, then execute one tiny mainnet EVM USDC route into the Member's Solana wallet and complete the normal Settlement flow. Full runbook: [LI.FI Route Rehearsal](./lifi-route-rehearsal.md).

| # | Flow | Pass criteria |
| --- | --- | --- |
| 1 | Create Group → copy invite | Group row created with mainnet mint; invite link works |
| 2 | Wallet 2 joins via invite | Member row added; cluster badge shows `mainnet` |
| 3 | Add expense, equal split | Balance reflects correctly |
| 4 | Add expense, exact split | Sum matches amount; rejected if mismatch |
| 5 | Add expense, percentage split | Percentages sum to 100; balance correct |
| 6 | Add expense, shares split | Shares math correct |
| 7 | Edit expense before settle | Balance recomputes |
| 8 | Delete expense before settle | Balance recomputes |
| 9 | Settle suggested edge | Real USDC moved on mainnet; signature confirmed |
| 10 | Receipt page shows tx | Explorer link goes to mainnet (no `?cluster=` suffix) |
| 11 | Try to edit settled-related expense | Blocked with clear error |
| 12 | Settlement Request Link | Debtor opens link, sees live amount, signs |
| 13 | Insufficient USDC at settle | Clear error, top-up suggestion shown |
| 14 | Insufficient SOL at settle | Clear error, SOL guidance shown |
| 15 | First-time recipient ATA | Preflight shows extra rent cost (~0.002 SOL) |
| 16 | Wallet rejection mid-flow | App recovers gracefully |
| 17 | LI.FI route readiness + top-up path | `pnpm lifi:readiness` passes; tiny mainnet EVM USDC route → Solana USDC → settle |

**Output artifacts to capture:**
- Group UUID, member wallets (redacted to first/last 4 chars)
- All settlement tx signatures + explorer URLs
- Screenshots of receipt page on mainnet
- Any failure modes that need new issues

---

## Phase 5 — Launch

| Task | Status |
| --- | --- |
| Flip `NEXT_PUBLIC_SOLANA_RPC_URL` to mainnet on prod env | Pending Phase 4 |
| Verify cluster badge reads `mainnet` for new Groups | Pending Phase 4 |
| Update `README.md`, `STATUS.md`, `docs/shipped-vs-planned.md`, `SUBMISSION.md` to say "Split Mode is live on mainnet" | Pending Phase 4 |
| Update landing copy + footer copyright year if needed | Pending Phase 4 |
| Announce on X + Telegram | Pending Phase 4 |
| Monitor first 48h: error rate, settlement success rate, support requests in Telegram | Pending Phase 4 |

---

## Post-launch (first 30 days)

- Watch Sentry for unique errors
- Watch Supabase usage / cost
- Watch Helius RPC quota; flip to fallback if quota approached
- Collect feedback from first ~10 real groups → triage into new `FW-*` issues
- Decide go/no-go on Fund Mode mainnet graduation (separate checklist)

---

## Rollback plan

If a critical mainnet issue surfaces:

1. **Bad data path** (e.g. Supabase RLS hole): pause sign-ups by removing wallet-adapter from layout; investigate before re-enabling.
2. **Bad settlement path** (e.g. wrong mint, ATA bug): flip `NEXT_PUBLIC_SOLANA_RPC_URL` back to devnet on prod Cloudflare env; users see devnet for new Groups while we fix. Existing mainnet Settlements still verifiable on-chain.
3. **Bad auth path** (e.g. session leak): invalidate `FUNDWISE_SESSION_SECRET`, all sessions cleared, users re-verify wallet.
4. **Bad public copy**: edit `README.md` / landing claims back to "preview" within an hour.

There is no rollback for on-chain transfers — once USDC moves, it's moved. The mitigations are detection + clear user comms in Telegram.

---

## Open decisions

| Question | Default | Decide before |
| --- | --- | --- |
| Production RPC provider | Helius primary | Phase 3 |
| Fallback RPCs | Triton + QuickNode (TBD) | Phase 3 |
| Sentry vs alternative monitoring | Sentry default, open to swap | Phase 3 |
| Mainnet rehearsal funding source | Owner's wallet, ~$15 USDC total | Phase 4 |
| Public launch announcement copy | Owner-drafted, reviewed by Claude | Phase 5 |

---

## Definition of done

Split Mode is "live on mainnet" when:

1. All Phase 1-4 items above are ✅
2. README, STATUS, SUBMISSION, and `docs/shipped-vs-planned.md` all say "Split Mode mainnet"
3. At least one third-party (not owner) has completed an end-to-end Settlement on mainnet
4. 48h of post-launch monitoring shows no P0/P1 incidents
