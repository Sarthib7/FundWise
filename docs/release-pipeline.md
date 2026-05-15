# FundWise — Release pipeline

**Decision:** [ADR-0033](./adr/0033-staged-release-pipeline.md). (Renumbered from 0032 on 2026-05-16 to avoid collision with the Fund Mode take-rate monetization ADR.) This doc is the operational companion: per-stage env, the promotion checklist, and the CCTP routing strategy.

**Last updated:** 2026-05-16

---

## Stage map

| | Stage 1 — Local / devnet | Stage 2 — Mainnet-beta staging | Stage 3 — Public mainnet |
| --- | --- | --- | --- |
| Host | `localhost`, branch previews | `beta.fundwise.fun` | `https://fundwise.fun` |
| Cluster | Solana devnet | Solana mainnet | Solana mainnet |
| USDC mint | devnet mints (cluster-aware) | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Supabase project | devnet beta project | `fundwise-staging` (separate) | production (FW-038 confirmed) |
| Access | open | allowlist (`FUNDWISE_MAINNET_BETA_ALLOWLIST`) | public |
| Stage flag | `NEXT_PUBLIC_FUNDWISE_STAGE=dev` (or unset) | `NEXT_PUBLIC_FUNDWISE_STAGE=staging` | `NEXT_PUBLIC_FUNDWISE_STAGE=production` (or unset) |
| CCTP / LI.FI | disabled (`isLifiSupportedForCurrentCluster()` returns false) | enabled, real routes, small amounts | enabled, real routes |
| Header badge | `DEVNET` (existing cluster badge) | `STAGING` chip + `MAINNET` cluster badge | `MAINNET` cluster badge only |

## Environment variables

New for staging:

```bash
NEXT_PUBLIC_FUNDWISE_STAGE=staging          # values: dev | staging | production (treated as production if unset)
FUNDWISE_MAINNET_BETA_ALLOWLIST=Wallet1,Wallet2,...   # comma-separated Solana addresses
```

Same across Stages 2 and 3 (with different values per environment):

```bash
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=...
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS=https://...,https://...
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FUNDWISE_SESSION_SECRET=<rotated per environment>
FUNDWISE_SERVICE_API_KEY=<rotated per environment>
FUNDWISE_ENABLE_CSP=true                    # both staging and production
```

Existing Fund Mode allowlist still applies on Stages 2 and 3 if Fund Mode invite-only behavior is desired during the launch window:

```bash
FUNDWISE_FUND_MODE_INVITE_WALLETS=...
```

## Promotion gate: Stage 1 → Stage 2

All boxes ✅ before pushing a build to `beta.fundwise.fun`:

- [ ] **FW-053** (P0): expense payer binding enforced at POST/PATCH; settlement TOCTOU closed via `record_settlement_locked`; OFAC check moved to per-request
- [ ] **FW-054** (P1): distributed rate limit covers every POST/PATCH/DELETE money-moving route
- [ ] **FW-055** (P1): `verifyAtaTransfer` rejects extra token-balance deltas
- [ ] **FW-056** (P2): no devnet mints leaking into mainnet config; CSP shipped; parse-usdc-amount regex hardened
- [ ] `pnpm test` green
- [ ] `pnpm build:pages` green
- [ ] `pnpm supabase:verify-rls` passes against the `fundwise-staging` project
- [ ] `record_settlement_locked` migration replayed on the `fundwise-staging` project
- [ ] Sensitive RPCs (`record_settlement_locked`, `update_expense_with_splits`) are service-role only
- [ ] Mainnet USDC mint addresses verified; PYUSD / USDT mainnet mints correct
- [ ] Helius mainnet RPC + at least one fallback configured in staging env
- [ ] `pnpm lifi:readiness` shows mainnet routes ready for all five EVM source chains
- [ ] Monitoring (GlitchTip or equivalent) initialized in staging build; a synthetic error event flows through

## Promotion gate: Stage 2 → Stage 3

Stage 2 must run with the gates above all green, then:

- [ ] 7 consecutive days on Stage 2 with no P0 or P1 issues open
- [ ] At least 3 successful CCTP routes from 3 different EVM source chains, by allowlist members, with small amounts (~$1–$5 each). Recommended: Base, Arbitrum, Ethereum.
- [ ] At least 1 successful end-to-end Settlement on Stage 2 (Group → Expense → Balance → Settle → Receipt) by two distinct allowlist wallets
- [ ] At least 1 successful Fund Mode Treasury init + Contribution + Proposal lifecycle (create → approve → execute) on Stage 2
- [ ] Cross-chain bridge modal verified: quote rendered correctly, fee displayed, time estimate within ±50% of actual, "rail used" surfaced (`via Circle CCTP` or `via <bridge>`)
- [ ] No errors in the staging GlitchTip project for the last 48 hours that aren't already triaged
- [ ] Owner explicitly approves promotion (no automatic flip)
- [ ] Launch-day comms drafted (X thread, Telegram channel post, landing-page copy adjustments)

## CCTP routing strategy

**Decision: prefer Circle CCTP with fallback to LI.FI's general router** (decided 2026-05-16 alongside ADR-0033).

### Why

| Scenario | Behavior |
| --- | --- |
| USDC on Base → Solana | Routes via Circle CCTP (fast, cheap, native USDC) |
| USDC on Ethereum → Solana | Routes via Circle CCTP (slower due to L1 finality; surface time estimate clearly in UI) |
| ETH on Optimism → Solana | LI.FI swaps ETH → USDC, then routes via CCTP (the "swap + bridge" composite route) |
| USDC on a chain CCTP doesn't yet support | Falls back to LI.FI's general router (Stargate / Across / Hop / etc.); UI surfaces the alternative rail |
| USDC source where CCTP has no liquidity at quote time | Falls back to alternative bridge; UI surfaces the alternative rail |

### Implementation

In `lib/lifi-bridge.ts`, add `preferBridges` to the `getQuote()` call:

```ts
const quote = await getQuote({
  fromChain: params.fromChain,
  toChain: LIFI_CHAINS.SOLANA,
  fromToken,
  toToken,
  fromAmount: amountInSmallestUnit,
  fromAddress: params.fromAddress,
  toAddress: params.toAddress,
  slippage: 0.005,
  preferBridges: ["cctp", "cctpV2"],
})
```

Surface `quote.tool` in `components/cross-chain-bridge-modal.tsx` so users see which rail the active quote uses ("via Circle CCTP" / "via Across" / etc.). When the active rail is non-CCTP, add a small `Powered by LI.FI` caption; when the active rail is CCTP, the caption is `Powered by Circle CCTP`.

### What we explicitly accept

- For ~95% of FundWise's target flows (USDC → USDC on CCTP-supported chains), users get the clean Circle CCTP path.
- For edge cases (chain CCTP doesn't support, ETH or other source asset needing swap-first), users still get a working route via LI.FI's general router, with a transparent UI cue about the rail.
- Marketing copy can credibly say "Powered by Circle CCTP" without overclaiming. The UI surfaces the truth on a per-quote basis.

## Rollback

Stage 2 → Stage 1: not applicable (staging stays running until issues are fixed; we don't roll back to Stage 1).

Stage 3 → Stage 2 (emergency rollback): flip production Cloudflare Pages env vars to point back at the staging Supabase project, or push the previous Pages deployment as the production branch. Database state diverges if any writes happened post-promotion — those need manual reconciliation. Plan: do not promote on a Friday.

## Open items

- Pick the actual Cloudflare Pages branch name for `beta.fundwise.fun` (suggestion: `staging`)
- Confirm whether Stage 2 reuses the existing `FUNDWISE_FUND_MODE_INVITE_WALLETS` for Fund Mode access or uses the new `FUNDWISE_MAINNET_BETA_ALLOWLIST` for both modes
- Decide cap behavior: enforce small-amount cap in middleware on Stage 2 (~$50 per transaction?) or rely on allowlist discipline
