# ADR-0031 — Fund Mode pricing decision

**Status:** Superseded by [ADR-0032](./0032-fund-mode-take-rate-monetization.md) (2026-05-16)
**Supersedes / extends:** [ADR-0025](./0025-keep-split-mode-free-and-monetize-later-surfaces.md) (Split Mode free), [ADR-0027](./0027-fund-mode-is-the-hero-product.md) (Fund Mode hero), [`docs/monetization.md`](../monetization.md) (existing pricing hypothesis)

> **Note (2026-05-16):** during a grilling session, the subscription model proposed below was rejected. The user's call: subscription fees are a real consumer-acquisition barrier, and pool take-rates plus yield fees produce a more natural "Stripe of group money" model. Replaced by ADR-0032. This file is retained for the research record; the take-rate model in ADR-0032 is the current decision.
**Related research:** [`docs/research/fund-mode-monetization-2026-05-16.md`](../research/fund-mode-monetization-2026-05-16.md)

## Context

Fund Mode launches on Solana mainnet at Solana Summit Berlin on 2026-06-13. The existing `docs/monetization.md` lays out a pricing hypothesis (free Split Mode, $3-5 creation fee, $12/mo subscription, future yield take, Fundy premium). The hypothesis was set before the multi-chain (CCTP/LI.FI) and fiat onramp (Bridge.xyz / Altitude.xyz) phases were locked into the roadmap, and before any beta WTP signal was collected.

The market analysis in the linked research doc shows:

- Consumer bill-splitting WTP tops out around $30/yr (Splitwise Pro). Split Mode being free is correct.
- Crypto group-treasury tools split between **DAO-tier SaaS at $50-500/mo** (Coinshift, Den, Utopia) and free wallet features. Fund Mode targets an empty middle.
- Personal-finance subscriptions cluster at **$9-15/mo / $79-110/yr** (Lunch Money, YNAB, Copilot, Monarch). Fundy fits here.
- Crypto yield take is **10-20% standard** (Yearn, Lido, Marinade); 20% is a defensible starting anchor.
- The current `$12/mo` Fund Mode subscription is plausibly underpriced for the durable-group cohort and undifferentiated for the trip-pool cohort. A single price is doing two jobs.

## Decision

The pricing structure FundWise launches with at Summit Berlin (subject to beta confirmation):

### Locked

- **Split Mode is free.** No Settlement fee, no Group creation fee, no per-Member fee. Permanent for the launch and foreseeable future.
- **Fund Mode creation fee: $5 flat (USDC equivalent at spot)** at Treasury initialization. Beta-tests acceptance with test-USDC; mainnet uses live USDC. One-time per Treasury, non-refundable, paid from creator wallet.
- **Yield routing take (when Meteora ships, post-launch): 20% of yield generated** on idle Treasury USDC. Opt-in per Treasury; default off.
- **Fundy premium: $9/mo or $79/yr per user** (annual prepay saves ~27%). Ships when Fundy ships from its separate repo.

### Beta-validated, mainnet target

- **Fund Mode Standard subscription: $15/mo or $129/yr per Group.**
  - Annual prepay default at signup (with monthly visible as a one-click alternative).
  - Charged from creator wallet to start; revisit "charge from Treasury" after the first 90 days of mainnet.
  - Free tier covers up to **4 active Members and $500 AUM** (mainnet USDC equivalent). Above either threshold, subscription is required to keep the Treasury active.
- **Fund Mode DAO/Pro tier: $49/mo or $399/yr per Group**, when **AUM ≥ $10k USDC** OR **Member count ≥ 10**. Same feature set as Standard with higher AUM/member ceiling, priority support, and (later) accounting export.

### Multi-chain phase (Phase 2 — post-Summit)

- **Inbound conversion spread: 10-25 bps** on CCTP/LI.FI-routed inbound funds when a Member contributes from a non-Solana chain. Markup on top of provider fees, displayed transparently in the quote.
- No new fee on Solana-native contributions — those continue to settle through the existing Contribution flow with no FundWise take.

### Fiat onboarding phase (Phase 3 — later)

The Phase 3 stack is locked as Privy (per-user embedded wallet, non-custodial via TEE shards), MoonPay (card top-up), Bridge.xyz (SEPA / IBAN / wire bank rails), and Squads Protocol (group treasury — already integrated). Altitude is ruled out (it's Squads' own consumer-business neobank, not embeddable infra). See [ADR-0028](./0028-fundlabs-product-family-positioning.md) and `docs/research/fund-mode-monetization-2026-05-16.md`.

- Pricing follows the MoonPay (card) and Bridge.xyz (bank-rail) partner agreements. Defer until each integration exists. Likely **10-25 bps markup** on top of provider fees for fiat top-ups.
- No additional FundWise fee on the Privy-managed embedded wallet itself — the wallet is provisioned silently as part of the FundWise account.

### Bundle (optional, ship-when-ready)

- **FundWise + Fundy bundle: $19/mo or $169/yr** — saves ~30% vs. buying separately. Ships when Fundy is ready; not required for Summit launch.

## Why these numbers

Each price has a public anchor:

| Price | Anchor |
| --- | --- |
| $5 creation fee | Crypto-native account-creation / mint-fee comfort zone; large enough to signal commitment, small enough not to deter |
| $15/mo Standard | Sits in the personal-finance / consumer-fintech subscription corridor (Notion, Lunch Money, Revolut Premium); above Splitwise's $2.50/mo because FundWise actually moves money |
| $49/mo DAO/Pro | Bottom of the DAO-treasury SaaS range (Coinshift starts ~$50, Den ~$30-100); priced to be obviously a deal for a real DAO |
| 20% yield take | Yearn standard; matches Lido's institutional model; consumer-acceptable for "set and forget" yield |
| $9/mo Fundy | YNAB-Lunch Money personal-finance corridor |
| 10-25 bps cross-chain | Below typical bridge aggregator markup (50-100 bps); positions FundWise as a fair routing layer, not a rent-seeker |
| Free tier at 4 members / $500 AUM | Captures most trip pools and friend funds in free; pushes any durable or larger Group to paid |

## Consequences

**What this commits to:**

- The devnet beta must measure: $5 creation fee acceptance rate, $15/mo subscription WTP signal among durable Groups, free-tier wall placement abandon-vs-continue rate at 4 members / $500 AUM. Phase C of the beta checklist already covers this; the numbers above replace the older $3-5 / $12/mo anchors.
- Annual prepay needs to be a real flow at launch (Stripe-style billing infrastructure, not just a banner). If annual prepay can't ship for Summit, default monthly and ship annual within 30 days post-launch.
- The DAO/Pro tier needs at least one DAO beta participant before Summit. If no DAO participates in the beta, ship Standard only and add DAO/Pro post-launch as a Phase 1.5 follow-up.
- The cross-chain spread requires LI.FI/CCTP integration plumbing to surface fees in quote displays. Tracked under the Phase 2 multi-chain workstream, not Summit launch.
- Yield take requires Meteora integration; remains a planned line in this ADR, not a Summit-launch line.

**What this gives up:**

- The simpler "$12/mo, one tier" story. Two tiers add UX complexity at signup.
- Maximum freemium acquisition velocity. A more generous free tier (e.g., $2k AUM) would convert more users to "tried it" but slow Standard tier conversion.
- Pure usage-based pricing (Path C). Considered and rejected — feels like a tax on group money, harder to forecast, and the durable-group ICP responds better to predictable subscription.
- Yield-only pricing (Path D). Considered and rejected — defers all revenue 6-12+ months until Meteora ships and is widely opted-into.

## Alternatives considered

- **Path A — Premium SaaS only** (the lightly-extended version of the current doc). Rejected as a single-tier model; kept as the framing for the dual-tier model adopted here.
- **Path B — Broad freemium at $7-9/mo.** Rejected. Per-Group economics get thin if the high-WTP cohort is capped at $9.
- **Path C — Usage-based take rate.** Rejected as the *primary* model; kept as the basis for the Phase 2 cross-chain spread.
- **Path D — Yield-only.** Rejected as the primary model; kept as a post-launch revenue line.

See `docs/research/fund-mode-monetization-2026-05-16.md` for the full comparison.

## Open questions

These remain open and should be resolved before the launch banner copy is finalized:

1. **Subscription paid from Treasury vs creator wallet.** Starting position is creator wallet; revisit at 90 days.
2. **Annual vs monthly default.** Starting position is annual prepay default (better ARR, market-standard).
3. **Refund policy.** Default to 14-day no-questions; not load-bearing for launch but should be on the pricing page.
4. **EU VAT handling.** Required before EU billing flips on. Not a Summit blocker; Summit launch can charge USD-denominated in USDC with EU VAT compliance as a fast-follow.
5. **DAO/Pro tier feature differentiation beyond AUM/member limits.** Likely candidates: accounting export, priority support SLA, multi-Treasury workspace, custom roles. Decide post-beta.
6. **Bundle pricing display.** If Fundy ships at Summit, the bundle should be on the pricing page Day 1. If Fundy ships later, the bundle banner should be visible but greyed/"coming soon."

## Status — what happens next

- This ADR is **draft**. Owner to mark as accepted once the numbers are confirmed (or revised based on the open questions above).
- Update `docs/monetization.md` to point at this ADR and adopt the dual-tier numbers as the working hypothesis.
- Update `docs/fund-mode-beta-checklist.md` Phase C to replace `$3-5` and `$12/mo` anchors with `$5` and `$15/mo Standard, $49/mo Pro`.
- Add `docs/monetization-beta-findings.md` skeleton with the three measurements listed under "Consequences" — to be filled in by beta-cohort signal before mainnet billing flips on.
