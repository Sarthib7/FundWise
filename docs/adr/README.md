# Architecture Decision Records

Active ADRs for FundWise. Use [DECISIONS.md](../../DECISIONS.md) as the root ADR index, and use [docs/README.md](../README.md) for the broader documentation map.

If docs disagree, treat [STATUS.md](../../STATUS.md), [CONTEXT.md](../../CONTEXT.md), [PRD.md](../../PRD.md), and the latest ADRs as source of truth.

## Active ADRs

| ADR | Decision |
| --- | --- |
| [0001](./0001-pivot-from-fund-flow-to-fundwise.md) | Pivot from Fund Flow to FundWise |
| [0002](./0002-stablecoins-only-for-balances.md) | Stablecoins only for Balances |
| [0003](./0003-off-chain-metadata-on-chain-money.md) | Off-chain metadata, on-chain money |
| [0004](./0004-drop-hackathon-dependencies.md) | Drop inherited hackathon dependencies |
| [0005](./0005-squads-multisig-for-fund-mode.md) | Squads multisig for Fund Mode |
| [0006](./0006-wallet-only-auth.md) | Wallet-only auth |
| [0007](./0007-rename-circles-to-groups.md) | Rename circles to Groups |
| [0008](./0008-keep-nextjs-shadcn-stack.md) | Keep Next.js / shadcn stack |
| [0009](./0009-switch-from-firebase-to-supabase.md) | Switch from Firebase to Supabase |
| [0010](./0010-store-multisig-and-vault-addresses-for-fund-mode.md) | Store multisig and vault addresses for Fund Mode |
| [0011](./0011-fix-usdc-as-the-mvp-settlement-asset.md) | Fix USDC as the MVP Settlement asset |
| [0012](./0012-require-authenticated-and-verified-ledger-writes-before-mainnet.md) | Require authenticated verified ledger writes before mainnet |
| [0013](./0013-store-global-profile-display-names-separately.md) | Store global profile display names separately |
| [0014](./0014-optional-phantom-connect-alongside-wallet-adapter.md) | Optional Phantom Connect alongside wallet adapter |
| [0015](./0015-wallet-signed-session-cookies-for-server-mutations.md) | Wallet-signed session cookies for server mutations |
| [0016](./0016-prioritize-split-mode-and-hide-cross-chain-routing.md) | Prioritize Split Mode and hide cross-chain routing |
| [0017](./0017-snapshot-source-currency-expenses-into-usdc-ledger.md) | Snapshot Source Currency Expenses into USDC ledger |
| [0018](./0018-agent-skill-endpoint-and-fundy-telegram-bot.md) | Agent Skill Endpoint and Fundy Telegram bot |
| [0018 full spec](./0018-fundy-telegram-bot.md) | Fundy Telegram Bot full specification; repo note superseded by ADR-0022 |
| [0019](./0019-expense-dispute-handling-via-group-consensus.md) | Expense dispute handling via Group consensus |
| [0020](./0020-dashboard-and-expense-ux-overhaul.md) | Dashboard and Expense UX overhaul |
| [0021](./0021-gtm-rollout-order-split-fundy-fund-mode-beta.md) | GTM rollout order: Split, Fundy, Fund Mode beta |
| [0022](./0022-fundy-moves-to-a-separate-repository.md) | Fundy moves to a separate repository |
| [0023](./0023-tax-advisory-and-filing-live-in-fundy.md) | Tax advisory and filing live in Fundy |
| [0024](./0024-visa-frontier-track-and-card-partnerships.md) | Visa Frontier track and card partnerships |
| [0025](./0025-keep-split-mode-free-and-monetize-later-surfaces.md) | Keep Split Mode free and monetize later surfaces |
| [0026](./0026-research-informed-fund-mode-infrastructure-boundaries.md) | Research-informed Fund Mode infrastructure boundaries |
| [0027](./0027-fund-mode-is-the-hero-product.md) | Fund Mode is the hero product |
| [0028](./0028-fundlabs-product-family-positioning.md) | FundLabs product-family positioning |
| [0029](./0029-squads-governance-source-of-truth-for-fund-mode.md) | Squads governance is the Fund Mode source of truth |

## Notes

- There are two ADR-0018 files because the compact Agent Skill / Fundy decision and the full Fundy specification were both retained. ADR-0022 supersedes only the old monorepo repo-structure note in the full spec.
- Retired or superseded ADRs live in [../archive/](../archive/).
