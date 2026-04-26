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

## Current Product Shape

### Split Mode

The current MVP path is:

`Group -> Expense -> Balance -> Settlement -> Receipt`

- Web app first
- Wallet-native auth only
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
- Wallets: `@solana/wallet-adapter-*`
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
├── hooks/
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
- The current docs source of truth is split across [STATUS.md](./STATUS.md), [CONTEXT.md](./CONTEXT.md), and [PRD.md](./PRD.md). If another doc disagrees, those three win.

## License

TBD.
