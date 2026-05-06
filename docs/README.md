# FundWise Docs

This directory holds detailed product, API, and decision records. Start with the root docs first, then use this index for deeper topics.

## Core Product Docs

- [README](../README.md) - project overview and top-level documentation map
- [STATUS](../STATUS.md) - current state, locked decisions, and next actions
- [CONTEXT](../CONTEXT.md) - domain language and product invariants
- [PRD](../PRD.md) - user stories and implementation decisions
- [ROADMAP](../ROADMAP.md) - phased delivery plan
- [HACKATHON_PLAN](../HACKATHON_PLAN.md) - hackathon strategy and sponsor framing
- [SUBMISSION](../SUBMISSION.md) - judge-facing script and submission checklist
- [issues](../issues.md) - indexed local backlog

## API And Agent Surfaces

- [API reference](./api.md) - static API reference snapshot
- [Zerion readiness](./zerion-readiness.md) - wallet-readiness CLI support notes
- [Agentic Settlement Endpoint Research](./agentic-settlement-endpoint.md) - Payable Settlement Request research and endpoint shape
- [Agent Payment Policy](./agent-payment-policy.md) - Spending Policies, endpoint gaps, safety rules, and ownership notes

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

**Agent And Payments**

- [Agent Skill Endpoint and Fundy Telegram bot](./adr/0018-agent-skill-endpoint-and-fundy-telegram-bot.md)
- [Fundy moves to a separate repository](./adr/0022-fundy-moves-to-a-separate-repository.md)
- [Payable Settlement Request research](./agentic-settlement-endpoint.md)
- [Agent Payment Policy](./agent-payment-policy.md)

**Go-To-Market**

- [GTM rollout order](./adr/0021-gtm-rollout-order-split-fundy-fund-mode-beta.md)
- [Visa Frontier track and card partnerships](./adr/0024-visa-frontier-track-and-card-partnerships.md)
