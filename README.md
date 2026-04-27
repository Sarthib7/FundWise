# FundWise

**Splitwise on Solana.** Create a private Group, log shared Expenses, see live Balances, and settle exact USDC amounts on Solana with a clear Receipt.

FundWise also has a second mode, **Fund Mode**, for pooled USDC Treasuries with Proposal-based spending. That remains part of the product direction, but the current MVP is optimized around **Split Mode**.

## Documentation Map

Read these in order:

1. [AGENTS.md](./AGENTS.md)
2. [STATUS.md](./STATUS.md)
3. [CONTEXT.md](./CONTEXT.md)
4. [ROADMAP.md](./ROADMAP.md)
5. [HACKATHON_PLAN.md](./HACKATHON_PLAN.md)
6. [PRD.md](./PRD.md)
7. [docs/adr/](./docs/adr/)

Quick links:

- [STATUS.md](./STATUS.md) - current repo state, locked decisions, next session
- [CONTEXT.md](./CONTEXT.md) - domain language and product invariants
- [PRD.md](./PRD.md) - MVP scope, user stories, implementation decisions
- [ROADMAP.md](./ROADMAP.md) - phased delivery plan
- [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) - track strategy and sponsor framing
- [DECISIONS.md](./DECISIONS.md) - ADR index
- [audit.md](./audit.md) - current security findings and mainnet blockers

## Current Product Shape

### Split Mode

The current MVP path is:

`Group -> Expense -> Balance -> Settlement -> Receipt`

- Web app first
- `/groups` uses a wallet-first entry state so disconnected users can connect immediately and continue into their Group list
- Wallet-native auth (`@solana/wallet-adapter-*`); optional Phantom Connect may layer on later (see ADR-0014)
- Invite link or QR join flow
- USDC-only settlement asset
- Activity Feed, not chat
- Current net Group Balance settlement, not per-Expense settlement

### Fund Mode

Fund Mode remains in the product and repo, but it is not the primary hackathon demo path.

- Group-owned Treasury using Squads primitives
- Contributions into Treasury
- Proposal / approval / execution flow still pending

### Sponsor layers

- `LI.FI` is a secondary top-up and cross-chain recovery layer that helps a debtor arrive at Solana USDC.
- `Zerion` is a secondary intelligence layer for wallet analysis, reminders, and future agent flows.

Neither sponsor integration should complicate the primary Split Mode settlement path.

## Tech Stack

- Frontend: Next.js 15, React 19, Tailwind v4, Radix / shadcn UI
- Wallets: `@solana/wallet-adapter-*` (primary); optional `@phantom/react-sdk` when Portal is configured
- Chain: Solana
- Settlement asset: USDC
- Off-chain state: Supabase / Postgres
- Fund Mode Treasury: Squads (`@sqds/multisig`)
- Cross-chain support: LI.FI SDK

## Repo Structure

```text
/
├── AGENTS.md
├── CONTEXT.md
├── HACKATHON_PLAN.md
├── PRD.md
├── ROADMAP.md
├── STATUS.md
├── DECISIONS.md
├── docs/adr/
├── app/
│   ├── page.tsx
│   └── groups/
│       ├── page.tsx
│       └── [id]/
│           ├── page.tsx
│           └── settlements/[settlementId]/page.tsx
├── components/
│   └── group-dashboard/
│       ├── expense-dialog.tsx
│       ├── fund-mode-dashboard.tsx
│       ├── group-sidebar.tsx
│       ├── profile-name-dialog.tsx
│       └── split-mode-dashboard.tsx
├── hooks/
│   └── use-group-dashboard.ts
├── lib/
│   ├── db.ts
│   ├── expense-engine.ts
│   ├── simple-payment.ts
│   ├── lifi-bridge.ts
│   ├── squads-multisig.ts
│   └── supabase.ts
└── supabase/
    └── schema.sql
```

## Group Dashboard Structure

The main Group route is no longer a single giant page component.

- `app/groups/[id]/page.tsx` is the route shell and UI wiring layer.
- `hooks/use-group-dashboard.ts` owns Group loading, membership checks, shareable Settlement Request Links, Settlement execution, Treasury initialization, Contribution persistence, and profile-name persistence.
- `components/group-dashboard/` holds the Split Mode dashboard, Fund Mode dashboard, sidebar, Expense dialog, and profile dialog as focused UI modules.

## Getting Started

### Prerequisites

- Node 20+
- `pnpm`
- A Solana wallet
- A Solana RPC URL
- A Supabase project with the current schema applied

### Install

```bash
pnpm install
```

### Environment

Create `.env.local` manually. The repo does not currently ship an `.env.example`.

Required keys used by the app:

- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Fallback compatibility is present for:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Run

```bash
pnpm dev
pnpm build
pnpm lint
```

## MVP Notes

- Mainnet-beta is the product target.
- Devnet is still the test and rehearsal environment.
- Members need SOL for gas even though Settlements use USDC.
- The current execution order is:
  backend trust hardening -> on-chain / devnet hardening -> LI.FI and Zerion integration -> audit and full-flow devnet rehearsal
- The current docs source of truth is split across [STATUS.md](./STATUS.md), [CONTEXT.md](./CONTEXT.md), and [PRD.md](./PRD.md). If another doc disagrees, those three win.

## License

TBD.
