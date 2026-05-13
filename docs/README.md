# FundWise Docs

This directory holds detailed product, API, positioning, and decision records. Start with the root docs first, then use this index for deeper topics.

## Fast Paths

- **Split Mode to mainnet:** [Split Mode Mainnet Checklist](./split-mode-mainnet-checklist.md). Phased map. Test plan. Rollback.
- **LI.FI route rehearsal:** [LI.FI Route Rehearsal](./lifi-route-rehearsal.md). EVM wallet path. Sepolia boundary. Mainnet proof.
- **Fund Mode devnet beta:** [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md). Easy UX. Monetization tests. Beta ops.
- **Current product truth:** [STATUS](../STATUS.md) -> [Shipped vs Planned Product Matrix](./shipped-vs-planned.md)
- **Build plan:** [issues](../issues.md). Pick Queue at top. FW-* IDs.
- **Monetization:** [Monetization Model](./monetization.md). Free Split Mode. Paid Fund Mode. Meteora yield later.
- **FundLabs / FundWise positioning:** [Positioning](./positioning.md) -> [SUBMISSION](../SUBMISSION.md)
- **Domain language:** [CONTEXT](../CONTEXT.md) -> related ADRs in [docs/adr](./adr/)
- **Agent and payment surfaces:** [Agentic Settlement Endpoint Research](./agentic-settlement-endpoint.md) -> [Agent Payment Policy](./agent-payment-policy.md)

## Execution Checklists

Two tracks. Two checklists. Tick items as they ship.

- [Split Mode Mainnet Checklist](./split-mode-mainnet-checklist.md). Public app. Mainnet. Real USDC. Locked sequential phases.
- [LI.FI Route Rehearsal](./lifi-route-rehearsal.md). Mainnet-only route proof for EVM USDC into Solana USDC.
- [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md). Devnet only. Invite gated. Tests pricing.

New blockers become indexed `FW-*` issues in [issues](../issues.md). Not new files.

## Source Of Truth Rules

- Use [Positioning](./positioning.md) for the FundLabs umbrella, FundWise product position, product-family strategy, public copy, canonical taglines, and claims to avoid.
- Use [Shipped vs Planned Product Matrix](./shipped-vs-planned.md) for shipped/planned status.
- Use [CONTEXT](../CONTEXT.md) for names, domain terms, and invariants.
- Use [STATUS](../STATUS.md) for the latest execution handoff.

## Core Product Docs

- [README](../README.md) - project overview and top-level documentation map
- [STATUS](../STATUS.md) - current state, locked decisions, and next actions
- [CONTEXT](../CONTEXT.md) - domain language and product invariants
- [Positioning](./positioning.md) - FundLabs / FundWise positioning, canonical tagline, messaging hierarchy, and claims guardrails
- [PRD](../PRD.md) - user stories and implementation decisions
- [ROADMAP](../ROADMAP.md) - phased delivery plan
- [HACKATHON_PLAN](../HACKATHON_PLAN.md) - hackathon strategy and sponsor framing
- [SUBMISSION](../SUBMISSION.md) - judge-facing script and submission checklist
- [issues](../issues.md) - indexed local backlog
- [Shipped vs Planned Product Matrix](./shipped-vs-planned.md) - canonical shipped, planned, and out-of-scope status
- [Monetization Model](./monetization.md) - free Split Mode launch and paid-surface hypotheses
- [Split Mode Mainnet Checklist](./split-mode-mainnet-checklist.md) - phased mainnet map, test plan, rollback
- [LI.FI Route Rehearsal](./lifi-route-rehearsal.md) - EVM wallet source path, testnet boundary, and mainnet proof steps
- [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md) - easy-UX work, monetization tests, beta program ops
- [Fund Mode Beta Rehearsal](./fund-mode-beta-rehearsal.md) - scripted rehearsal flow for devnet beta
- [Fund Mode Proposal Audit](./fund-mode-proposal-audit.md) - storage and access rules for Proposal proof/comments
- [Research Reports](./research/) - generated market and technology research; supporting context only, not source of truth

## API And Agent Surfaces

- [API reference](./api.md) - static API reference snapshot
- [Zerion readiness](./zerion-readiness.md) - wallet-readiness CLI support notes
- [Agentic Settlement Endpoint Research](./agentic-settlement-endpoint.md) - Payable Settlement Request research and endpoint shape
- [Agent Payment Policy](./agent-payment-policy.md) - Spending Policies, endpoint gaps, safety rules, and ownership notes

## Research Reports

- [Research index](./research/) - generated research artifacts kept out of the repo root
- [Monetization and business model research](./research/monetization-business-model-research-2026-05-07.md) - supporting market context for Fund Mode, Fundy, paid endpoints, and revenue models
- [Technology landscape research](./research/technology-landscape-research-2026-05-07.md) - supporting architecture context for treasury, agent payments, fee abstraction, rails, and receipt storage

## Architecture Decisions

- [ADR directory](./adr/) - active Architecture Decision Records
- [ADR archive](./archive/) - retired or superseded ADRs

## Topic Groups

**Split Mode**

- [Stablecoins only for Balances](./adr/0002-stablecoins-only-for-balances.md)
- [Off-chain metadata, on-chain money](./adr/0003-off-chain-metadata-on-chain-money.md)
- [USDC as MVP settlement asset](./adr/0011-fix-usdc-as-the-mvp-settlement-asset.md)
- [Wallet-signed sessions](./adr/0015-wallet-signed-session-cookies-for-server-mutations.md)
- [Source Currency snapshots](./adr/0017-snapshot-source-currency-expenses-into-usdc-ledger.md)

**Fund Mode**

- [Squads multisig for Fund Mode](./adr/0005-squads-multisig-for-fund-mode.md)
- [Store multisig and vault addresses](./adr/0010-store-multisig-and-vault-addresses-for-fund-mode.md)
- [Prioritize Split Mode and hide cross-chain routing](./adr/0016-prioritize-split-mode-and-hide-cross-chain-routing.md)
- [Research-informed Fund Mode infrastructure boundaries](./adr/0026-research-informed-fund-mode-infrastructure-boundaries.md)
- [Fund Mode is the hero product](./adr/0027-fund-mode-is-the-hero-product.md)

**Agent And Payments**

- [Agent Skill Endpoint and Fundy Telegram bot](./adr/0018-agent-skill-endpoint-and-fundy-telegram-bot.md)
- [Fundy moves to a separate repository](./adr/0022-fundy-moves-to-a-separate-repository.md)
- [Payable Settlement Request research](./agentic-settlement-endpoint.md)
- [Agent Payment Policy](./agent-payment-policy.md)

**Go-To-Market**

- [Positioning](./positioning.md)
- [GTM rollout order](./adr/0021-gtm-rollout-order-split-fundy-fund-mode-beta.md)
- [Visa Frontier track and card partnerships](./adr/0024-visa-frontier-track-and-card-partnerships.md)
- [Keep Split Mode free and monetize later surfaces](./adr/0025-keep-split-mode-free-and-monetize-later-surfaces.md)
- [FundLabs product-family positioning](./adr/0028-fundlabs-product-family-positioning.md)
