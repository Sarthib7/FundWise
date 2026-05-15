# FundWise Documentation Index

This directory holds detailed product, API, operations, research, and architecture-decision documents. For current execution, start at the root docs, then use this index for deeper context.

## Start Here

1. [AGENTS.md](../AGENTS.md) — instructions for agents working in this repo.
2. [STATUS.md](../STATUS.md) — latest execution state, locked decisions, next actions.
3. [CONTEXT.md](../CONTEXT.md) — domain language and product invariants.
4. [Positioning](./positioning.md) — FundLabs / FundWise messaging and claims guardrails.
5. [ROADMAP.md](../ROADMAP.md) — phased product and engineering plan.
6. [PRD.md](../PRD.md) — user stories, product principles, implementation decisions.
7. [issues.md](../issues.md) — indexed `FW-*` backlog and pick queue.
8. [ADR directory](./adr/) and [DECISIONS.md](../DECISIONS.md) — current architecture decisions.

## Current Execution Fast Paths

- **Split Mode mainnet:** [Split Mode Mainnet Checklist](./split-mode-mainnet-checklist.md) → [ops runbook](./ops-runbook.md) → [issues pick queue](../issues.md#pick-queue).
- **Fund Mode devnet beta:** [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md) → [Fund Mode Beta Rehearsal](./fund-mode-beta-rehearsal.md) → [issues FW-042+](../issues.md#fw-042---pool-templates-at-fund-mode-group-creation).
- **Security / audit follow-up:** [issues FW-053–FW-056](../issues.md#fw-053---branch-audit-follow-ups-critical-expense-payer-binding-settlement-toctou-sanctions-scope) → [audit.md](../audit.md) → [dependency audit](./dependency-audit.md) → [sanctions screening](./sanctions-screening.md).
- **Agent / Fundy / API discovery:** [Agent Skill Endpoint research](./agentic-settlement-endpoint.md) → [Agent Payment Policy](./agent-payment-policy.md) → [API reference](./api.md) → live `/skill.md` and `/api/docs` routes.
- **Public copy / product claims:** [Positioning](./positioning.md) → [Shipped vs Planned](./shipped-vs-planned.md).
- **Monetization:** [Monetization model](./monetization.md) → [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md#phase-c--monetization-model-testing-the-point-of-beta) → [research reports](./research/).

## Root Documentation

| Doc | Purpose |
| --- | --- |
| [README.md](../README.md) | Project overview, quick docs map, setup, current product shape. |
| [AGENTS.md](../AGENTS.md) | Required agent operating rules, reading order, coding standards. |
| [STATUS.md](../STATUS.md) | Latest source of truth for what is live, blocked, or next. |
| [CONTEXT.md](../CONTEXT.md) | Canonical domain model, language, invariants, examples. |
| [PRD.md](../PRD.md) | Product requirements, user stories, implementation decisions, out-of-scope boundaries. |
| [ROADMAP.md](../ROADMAP.md) | Phased delivery plan from Split Mode through Fund Mode, Fundy, and expansion. |
| [issues.md](../issues.md) | Indexed local backlog with `FW-*` IDs and pick queue. |
| [DECISIONS.md](../DECISIONS.md) | ADR index only; points to active ADR files. |
| [audit.md](../audit.md) | Security findings and mainnet blockers. |
| [review.md](../review.md) | Product/code review and roast notes. |
| [brand.md](../brand.md) | Brand system, logo rules, palette, and visual constraints. |

## Execution Checklists And Runbooks

| Doc | Purpose | Primary links |
| --- | --- | --- |
| [Split Mode Mainnet Checklist](./split-mode-mainnet-checklist.md) | Public mainnet launch plan for Split Mode. | [issues FW-038–FW-040](../issues.md#active-index), [ops runbook](./ops-runbook.md) |
| [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md) | Devnet invite-only beta plan for Fund Mode UX, monetization, and ops. | [issues FW-042–FW-065](../issues.md#fw-042---pool-templates-at-fund-mode-group-creation), [beta rehearsal](./fund-mode-beta-rehearsal.md) |
| [Fund Mode Beta Rehearsal](./fund-mode-beta-rehearsal.md) | Scripted Fund Mode rehearsal path and devnet evidence. | [Fund Mode checklist](./fund-mode-beta-checklist.md), [STATUS](../STATUS.md) |
| [LI.FI Route Rehearsal](./lifi-route-rehearsal.md) | Mainnet-only EVM USDC → Solana USDC route rehearsal. | [Split Mode checklist](./split-mode-mainnet-checklist.md) |
| [Operations Runbook](./ops-runbook.md) | Supabase, Cloudflare, RLS verification, and production ops steps. | [Split Mode checklist](./split-mode-mainnet-checklist.md), [issues FW-038](../issues.md#active-index) |
| [Zerion Readiness](./zerion-readiness.md) | Zerion CLI readiness script usage and context modes. | [ROADMAP](../ROADMAP.md) |

## Product, Positioning, And Business Model

| Doc | Purpose |
| --- | --- |
| [Positioning](./positioning.md) | Canonical tagline, FundLabs product-family positioning, messaging hierarchy, claims guardrails. |
| [Shipped vs Planned](./shipped-vs-planned.md) | Canonical shipped/planned/out-of-scope product matrix. |
| [Monetization](./monetization.md) | Free Split Mode launch, paid Fund Mode/Fundy/Receipt Endpoint hypotheses, conservative scenario. |
| [Fund Mode Proposal Audit](./fund-mode-proposal-audit.md) | Proposal proof/comment/edit-history model and storage/access rules. |

## API, Agents, And Payment Policy

| Doc | Purpose | Related implementation |
| --- | --- | --- |
| [API Reference](./api.md) | Static API reference snapshot. | `app/api/docs/route.ts`, `app/api/openapi.json/route.ts` |
| [Agentic Settlement Endpoint Research](./agentic-settlement-endpoint.md) | Payable Settlement Request, x402, MPP, pay.sh research. | `app/skill.md/route.ts`, `lib/server/fundwise-api-discovery.ts` |
| [Agent Payment Policy](./agent-payment-policy.md) | Spending Policies, endpoint gaps, safety policy, Group ownership notes. | Planned Scoped Agent Access |
| [Zerion Readiness](./zerion-readiness.md) | CLI commands for wallet readiness and verification. | `scripts/zerion-readiness.mjs` |

## Security, Compliance, And Dependency Notes

| Doc | Purpose |
| --- | --- |
| [audit.md](../audit.md) | Security findings and mainnet blockers. |
| [Dependency Audit](./dependency-audit.md) | Dependency advisory triage and accepted risk notes. |
| [Sanctions Screening](./sanctions-screening.md) | Minimal wallet screening approach and limitations. |
| [Operations Runbook](./ops-runbook.md) | RLS verification and production environment procedures. |
| [Supabase RPC and Settlement hardening](./adr/0030-supabase-rpc-and-settlement-hardening.md) | Service-role-only RPC grants and unique Settlement transaction signatures. |
| [issues FW-053–FW-056](../issues.md#fw-053---branch-audit-follow-ups-critical-expense-payer-binding-settlement-toctou-sanctions-scope) | Current branch-audit remediation backlog. |

## Research Reports

Research is supporting context only. If research disagrees with [STATUS](../STATUS.md), [CONTEXT](../CONTEXT.md), [PRD](../PRD.md), or latest ADRs, the source-of-truth docs win.

- [Research index](./research/) — research directory index.
- [Monetization and business model research](./research/monetization-business-model-research-2026-05-07.md) — market and revenue context.
- [Technology landscape research](./research/technology-landscape-research-2026-05-07.md) — architecture, rails, agent payments, treasury, and fee-abstraction context.

## Architecture Decisions

- [DECISIONS.md](../DECISIONS.md) — root ADR index.
- [Active ADR index](./adr/README.md) — ADR directory index.
- [Active ADR directory](./adr/) — current architecture decisions.
- [ADR archive index](./archive/README.md) — retired/superseded ADR index.
- [ADR archive](./archive/) — retired or superseded ADRs.
- [Archived Phantom Connect ADR](./archive/0014-optional-phantom-connect-alongside-wallet-adapter.md) — archived copy of optional Phantom Connect context.

### Active ADR Index

| ADR | Title |
| --- | --- |
| [0001](./adr/0001-pivot-from-fund-flow-to-fundwise.md) | Pivot from Fund Flow to FundWise |
| [0002](./adr/0002-stablecoins-only-for-balances.md) | Stablecoins only for Balances |
| [0003](./adr/0003-off-chain-metadata-on-chain-money.md) | Off-chain metadata, on-chain money |
| [0004](./adr/0004-drop-hackathon-dependencies.md) | Drop inherited hackathon dependencies |
| [0005](./adr/0005-squads-multisig-for-fund-mode.md) | Squads multisig for Fund Mode |
| [0006](./adr/0006-wallet-only-auth.md) | Wallet-only auth |
| [0007](./adr/0007-rename-circles-to-groups.md) | Rename circles to Groups |
| [0008](./adr/0008-keep-nextjs-shadcn-stack.md) | Keep Next.js / shadcn stack |
| [0009](./adr/0009-switch-from-firebase-to-supabase.md) | Switch from Firebase to Supabase |
| [0010](./adr/0010-store-multisig-and-vault-addresses-for-fund-mode.md) | Store multisig and vault addresses for Fund Mode |
| [0011](./adr/0011-fix-usdc-as-the-mvp-settlement-asset.md) | Fix USDC as the MVP Settlement asset |
| [0012](./adr/0012-require-authenticated-and-verified-ledger-writes-before-mainnet.md) | Require authenticated verified ledger writes before mainnet |
| [0013](./adr/0013-store-global-profile-display-names-separately.md) | Store global profile display names separately |
| [0014](./adr/0014-optional-phantom-connect-alongside-wallet-adapter.md) | Optional Phantom Connect alongside wallet adapter |
| [0015](./adr/0015-wallet-signed-session-cookies-for-server-mutations.md) | Wallet-signed session cookies for server mutations |
| [0016](./adr/0016-prioritize-split-mode-and-hide-cross-chain-routing.md) | Prioritize Split Mode and hide cross-chain routing |
| [0017](./adr/0017-snapshot-source-currency-expenses-into-usdc-ledger.md) | Snapshot Source Currency Expenses into USDC ledger |
| [0018](./adr/0018-agent-skill-endpoint-and-fundy-telegram-bot.md) | Agent Skill Endpoint and Fundy Telegram bot |
| [0018 full spec](./adr/0018-fundy-telegram-bot.md) | Fundy Telegram Bot full specification; repo note superseded by ADR-0022 |
| [0019](./adr/0019-expense-dispute-handling-via-group-consensus.md) | Expense dispute handling via Group consensus |
| [0020](./adr/0020-dashboard-and-expense-ux-overhaul.md) | Dashboard and Expense UX overhaul |
| [0021](./adr/0021-gtm-rollout-order-split-fundy-fund-mode-beta.md) | GTM rollout order: Split, Fundy, Fund Mode beta |
| [0022](./adr/0022-fundy-moves-to-a-separate-repository.md) | Fundy moves to a separate repository |
| [0023](./adr/0023-tax-advisory-and-filing-live-in-fundy.md) | Tax advisory and filing live in Fundy |
| [0024](./adr/0024-visa-frontier-track-and-card-partnerships.md) | Visa Frontier track and card partnerships |
| [0025](./adr/0025-keep-split-mode-free-and-monetize-later-surfaces.md) | Keep Split Mode free and monetize later surfaces |
| [0026](./adr/0026-research-informed-fund-mode-infrastructure-boundaries.md) | Research-informed Fund Mode infrastructure boundaries |
| [0027](./adr/0027-fund-mode-is-the-hero-product.md) | Fund Mode is the hero product |
| [0028](./adr/0028-fundlabs-product-family-positioning.md) | FundLabs product-family positioning |
| [0029](./adr/0029-squads-governance-source-of-truth-for-fund-mode.md) | Squads governance is the Fund Mode source of truth |
| [0030](./adr/0030-supabase-rpc-and-settlement-hardening.md) | Supabase RPC and Settlement hardening |
| [0031](./adr/0031-fund-mode-pricing-decision.md) | Fund Mode pricing decision (superseded by ADR-0032) |
| [0032](./adr/0032-fund-mode-take-rate-monetization.md) | Fund Mode take-rate monetization (supersedes ADR-0031) |
| [0033](./adr/0033-staged-release-pipeline.md) | Staged release pipeline |
| [0034](./adr/0034-threshold-change-proposal-semantics.md) | Threshold-change Proposal semantics |
| [0035](./adr/0035-squads-module-fences-governance-plumbing.md) | `lib/squads/` Module fences Squads governance plumbing |
| [0036](./adr/0036-fees-module-deep-by-design.md) | `lib/fees/` Module is deep by design |
| [0037](./adr/0037-with-authenticated-handler-hof-for-api-routes.md) | `withAuthenticatedHandler` HOF for wallet-session API routes |
| [0038](./adr/0038-mutations-split-by-concept.md) | Split `fundwise-mutations.ts` into per-concept Modules |

## Topic Groups

### Split Mode

- [Split Mode Mainnet Checklist](./split-mode-mainnet-checklist.md)
- [Stablecoins only for Balances](./adr/0002-stablecoins-only-for-balances.md)
- [Off-chain metadata, on-chain money](./adr/0003-off-chain-metadata-on-chain-money.md)
- [USDC as MVP settlement asset](./adr/0011-fix-usdc-as-the-mvp-settlement-asset.md)
- [Wallet-signed sessions](./adr/0015-wallet-signed-session-cookies-for-server-mutations.md)
- [Supabase RPC and Settlement hardening](./adr/0030-supabase-rpc-and-settlement-hardening.md)
- [Source Currency snapshots](./adr/0017-snapshot-source-currency-expenses-into-usdc-ledger.md)
- [LI.FI Route Rehearsal](./lifi-route-rehearsal.md)

### Fund Mode

- [Fund Mode Beta Checklist](./fund-mode-beta-checklist.md)
- [Fund Mode Beta Rehearsal](./fund-mode-beta-rehearsal.md)
- [Fund Mode Proposal Audit](./fund-mode-proposal-audit.md)
- [Squads multisig for Fund Mode](./adr/0005-squads-multisig-for-fund-mode.md)
- [Store multisig and vault addresses](./adr/0010-store-multisig-and-vault-addresses-for-fund-mode.md)
- [Research-informed Fund Mode infrastructure boundaries](./adr/0026-research-informed-fund-mode-infrastructure-boundaries.md)
- [Fund Mode is the hero product](./adr/0027-fund-mode-is-the-hero-product.md)
- [Squads governance source of truth](./adr/0029-squads-governance-source-of-truth-for-fund-mode.md)

### FundWise Agent, Fundy, And Agent Payments

- [Agent Skill Endpoint and Fundy Telegram bot](./adr/0018-agent-skill-endpoint-and-fundy-telegram-bot.md)
- [Fundy full specification](./adr/0018-fundy-telegram-bot.md)
- [Fundy moves to a separate repository](./adr/0022-fundy-moves-to-a-separate-repository.md)
- [Tax advisory and filing live in Fundy](./adr/0023-tax-advisory-and-filing-live-in-fundy.md)
- [Agentic Settlement Endpoint Research](./agentic-settlement-endpoint.md)
- [Agent Payment Policy](./agent-payment-policy.md)
- [API Reference](./api.md)

### Go-To-Market And Monetization

- [Positioning](./positioning.md)
- [GTM rollout order](./adr/0021-gtm-rollout-order-split-fundy-fund-mode-beta.md)
- [Visa Frontier track and card partnerships](./adr/0024-visa-frontier-track-and-card-partnerships.md)
- [Keep Split Mode free and monetize later surfaces](./adr/0025-keep-split-mode-free-and-monetize-later-surfaces.md)
- [FundLabs product-family positioning](./adr/0028-fundlabs-product-family-positioning.md)
- [Monetization model](./monetization.md)

## Maintenance Rules

- New execution work must get a unique `FW-*` issue in [issues.md](../issues.md).
- New irreversible architecture decisions must get the next ADR number and be added to [DECISIONS.md](../DECISIONS.md) and this index.
- New research belongs under [docs/research/](./research/) and must be linked from [docs/research/README.md](./research/README.md).
- If any docs disagree, use [STATUS](../STATUS.md), [CONTEXT](../CONTEXT.md), [PRD](../PRD.md), and the latest ADRs as source of truth.
