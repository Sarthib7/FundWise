# ADR-0033 — Staged release pipeline: devnet → mainnet-beta staging → public mainnet

**Status:** Proposed (2026-05-16)
**Related:** [docs/split-mode-mainnet-checklist.md](../split-mode-mainnet-checklist.md), [docs/release-pipeline.md](../release-pipeline.md) (operational), [ADR-0030](./0030-supabase-rpc-and-settlement-hardening.md)

## Context

The Summit Berlin launch (2026-06-13) is the first time FundWise will move real USDC on Solana mainnet. The existing path goes: local devnet development → `FW-039` mainnet rehearsal (two funded wallets, manual test) → public launch at `https://fundwise.fun`. There is no intermediate stage with real mainnet funds, real CCTP routes, and contained blast radius before flipping the public app to mainnet.

That gap is the most likely place for a launch incident: a misconfigured mint, a wrong RPC endpoint, a CCTP route that quietly fails on a chain we didn't test, or a Supabase RLS gap that only shows under real load. A one-shot mainnet rehearsal cannot exercise all of those surfaces, and once the public app is on mainnet, mistakes affect real users.

Multi-chain inbound via Circle CCTP + LI.FI was pulled into the Summit launch scope on 2026-05-16, which adds another live surface (EVM routes from Ethereum / Base / Arbitrum / Optimism / Polygon) that the rehearsal doesn't currently cover.

## Decision

We adopt a **three-stage release pipeline**, with the same codebase running across all three, differentiated only by environment configuration. Promotion between stages is gated by an explicit checklist.

### Stage 1 — Local dev / devnet

- Host: `localhost`, Cloudflare preview deploys for feature branches
- Cluster: Solana devnet
- Data: devnet beta Supabase project
- USDC: devnet mints (cluster-aware per FW-033)
- CCTP / LI.FI: disabled (`isLifiSupportedForCurrentCluster()` returns false on devnet)
- Access: open
- Purpose: feature development, agent rehearsals

### Stage 2 — Mainnet-beta staging (new)

- Host: `beta.fundwise.fun` (or equivalent Cloudflare Pages branch deploy)
- Cluster: Solana mainnet
- Data: separate `fundwise-staging` Supabase project (NOT the prod project, NOT the devnet beta project)
- USDC: real mainnet USDC (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`)
- CCTP / LI.FI: enabled with real routes; transactions capped at small amounts (~$1–$5) for the allowlist
- Access: gated by `FUNDWISE_MAINNET_BETA_ALLOWLIST` (env var, comma-separated wallet addresses; same pattern as `FUNDWISE_FUND_MODE_INVITE_WALLETS`)
- Stage flag: `NEXT_PUBLIC_FUNDWISE_STAGE=staging` — renders a "STAGING" badge in the header next to the cluster badge
- Purpose: validate the full mainnet path with real money but contained blast radius

### Stage 3 — Public mainnet (production)

- Host: `https://fundwise.fun`
- Cluster: Solana mainnet
- Data: production Supabase project (FW-038 HITL — confirmed prod project)
- USDC: real mainnet USDC
- CCTP / LI.FI: enabled
- Access: public; allowlist removed
- Stage flag: unset / `production`
- Same code as Stage 2 — only env vars differ

### Promotion criteria

**Stage 1 → Stage 2** requires the full audit-blockers list (FW-053, FW-054, FW-055) merged, Supabase RLS verified via `pnpm supabase:verify-rls`, `record_settlement_locked` migration replayed, and a clean `pnpm test && pnpm build:pages`.

**Stage 2 → Stage 3** requires:

- 7 consecutive days on Stage 2 with no P0 or P1 issues open
- At least 3 successful CCTP routes from 3 different EVM source chains by allowlist members
- Cross-chain bridge modal verified end-to-end: quote, fee, time, rail-used surfaced correctly
- Monitoring active and a synthetic error event flows through
- Operator explicitly approves the promotion (no automatic flip)

The detailed operational checklist lives in [docs/release-pipeline.md](../release-pipeline.md). This ADR locks the shape; the checklist is allowed to grow.

## Consequences

### Costs

- One additional Cloudflare Pages environment (`beta.fundwise.fun` branch deploy).
- One additional Supabase project (`fundwise-staging`), with its own migrations replayed and RLS verified.
- Two new environment variables: `NEXT_PUBLIC_FUNDWISE_STAGE`, `FUNDWISE_MAINNET_BETA_ALLOWLIST`.
- Small UI work: STAGING badge in the header.
- Some operator overhead: keeping two non-prod environments coherent.

### What we gain

- A real-money testing ground that is not the public app. CCTP routes, mainnet RPCs, mainnet mints, mainnet rate limits, and real wallet UX all behave the way they will in prod.
- A 7-day minimum dwell time enforces "let it bake" — defects that don't show up in a single rehearsal often surface across a week of varied usage.
- A revertible promotion: if Stage 2 reveals an issue, we don't touch Stage 3.

### What we explicitly accept

- Stage 2 is on mainnet, so a security gap there is a real-money incident — just for allowlisted wallets rather than the public. The audit-blockers list at the Stage 1→2 gate is meant to make that risk acceptable.
- Two non-prod environments diverging slightly over time is a real ops risk. Mitigation: only flip env vars when promoting; never let staging and production drift on code or schema.
- This pipeline only covers FundWise's web app. Fundy lives in a separate repo (ADR-0022) and has its own deploy path; the FundWise API stages do not bind it.

### Out of scope for this ADR

- Per-environment feature flags beyond `NEXT_PUBLIC_FUNDWISE_STAGE`. If we need fine-grained flag toggling later, that's a separate decision (e.g., GrowthBook, PostHog feature flags).
- Automated promotion. Promotion remains operator-driven; CI green is necessary but not sufficient.
- Rollback automation. Manual rollback via env var flip is enough for the launch window.
