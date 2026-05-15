# Fund Mode mainnet closed beta is a gated stretch for Solana Summit

Locked 2026-05-16. Amends [ADR-0021](./0021-gtm-rollout-order-split-fundy-fund-mode-beta.md) and [ADR-0027](./0027-fund-mode-is-the-hero-product.md) for the Summit window only; the longer-term rollout order is unchanged.

## Decision

For **Solana Summit (2026-06-13)**:

- **Split Mode on Solana mainnet = firm commitment.** Pre-flight items FW-033 through FW-041 in `issues.md` complete; the cutover happens by Summit.
- **Fund Mode mainnet closed beta = gated stretch.** The default plan keeps Fund Mode on **devnet** as the invite-only beta path (per `issues.md` and `docs/shipped-vs-planned.md`). The flip to mainnet closed beta happens **only if all four gate criteria below are met by ~2026-06-06** (one week before Summit). Otherwise, Fund Mode stays on devnet at Summit and the positioning copy frames devnet as deliberate (not a fallback).

## Gate criteria (all four must clear)

1. **Proposal lifecycle end-to-end on devnet, multi-wallet.** A full pass with ≥ 3 real wallets: Contribution → multiple Proposals → some approved → some rejected → executions confirmed on-chain → mirrored Proposal status (see CONTEXT.md `Mirrored Proposal Status`) matches the Squads on-chain truth. No silent diverges. Threshold-change Proposal semantics (ADR-0034) exercised at least once if in scope.
2. **All four fee flows execute cleanly on devnet.** Creation Fee, Contribution Fee, Reimbursement Fee, and (where applicable) Routing Fee — each lands in the Platform Fee Wallet with `platform_fee_ledger` reconciliation matching on-chain.
3. **Trusted closed-beta cohort identified.** Team + ≤ 10 trusted external Members who can absorb a bug without it becoming a public incident. Cohort explicitly briefed that mainnet closed beta is the early flight, not a finished product.
4. **Squads program audit references checked** for the targeted mainnet Squads program version.

If any gate fails by 2026-06-06, Fund Mode mainnet flip is deferred post-Summit. Devnet beta continues.

## Public positioning, two variants

Pre-write both. Pick at the 2026-06-06 gate check.

- **Variant A — Fund Mode on mainnet closed beta:** "FundWise is live on Solana mainnet. Split Mode is open to everyone today; Fund Mode opens as an invite-only closed beta for shared Treasuries with on-chain Proposals and approvals."
- **Variant B — Fund Mode stays on devnet:** "FundWise Split Mode is live on Solana mainnet. Fund Mode runs as a fully-instrumented invite-only beta on Solana devnet — that's deliberate: real wallets, real Proposals, real flows, without real-money risk while we harden the Treasury lifecycle. Mainnet flip follows beta validation."

Variant B is the default. Variant A activates only on gate pass.

## Why this matters

- Pushing Fund Mode to mainnet for the Summit moment makes the talk materially stronger but risks a real-money bug on Day 1 of mainnet, visible to a sophisticated Solana audience.
- A gated stretch with pre-written fallback prevents last-minute positioning scrambles either way.
- The gate criteria are concrete, falsifiable, and individually shippable — no fuzzy "is it ready" judgment calls.

## What this does not change

- ADR-0027 stands: Fund Mode remains the hero product direction for the next sprint.
- ADR-0021 amended only for the Summit window: the original rollout order (Split → Fundy → Fund Mode invite-only beta) is preserved; this ADR addresses *which cluster* the closed beta runs on at the Summit moment.
- Devnet beta does not stop at Summit. It continues until mainnet flip is justified by real production data, regardless of whether Variant A or B ships at Summit.
