# FundWise

**Splitwise on Solana.** Create a private Group, log shared Expenses, see live Balances, and settle exact USDC amounts on Solana with a clear Receipt.

FundWise also has a second mode, **Fund Mode**, for pooled USDC Treasuries. That remains part of the product direction, but proposal flows are still incomplete and the current MVP is optimized around **Split Mode**.

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
- After wallet connect, the app should restore the exact intent the user came for: invite-linked Group, Settlement Request Link, or first Group creation
- Plain `/groups` with no existing Groups should open Group creation immediately; returning users with existing Groups should stay on the Group list
- Group creation defaults to Split Mode; Fund Mode is visible as an invite-only beta inside the create flow rather than a public default path
- Wallet-native auth (`@solana/wallet-adapter-*`); optional Phantom Connect may layer on later (see ADR-0014)
- Wallet-signed browser-session verification gates protected Group ledger reads and Receipts
- Invite link or QR join flow with an explicit `Join {GroupName}` confirmation after connect
- Settlement Request Links open the live settleable state and context, but never auto-send a Settlement
- USDC-only settlement asset
- Activity Feed, not chat
- Current net Group Balance settlement, not per-Expense settlement

### Fund Mode

Fund Mode remains in the product and repo, but it is not the primary hackathon demo path.

- Group-owned Treasury using Squads primitives
- Contributions into Treasury
- Public Group creation keeps Fund Mode invite-only for now; internal testing can be re-enabled with `FUNDWISE_FUND_MODE_INVITE_WALLETS`
- Proposal / approval / execution flow still pending and not part of the current hackathon mainline

### Sponsor layers

- `LI.FI` is the primary sponsor support layer after Split Mode hardening. It lets EVM-first users top up into Solana USDC through an `Add funds` / `Top up to settle` flow without needing to understand the underlying route details.
- `Zerion` is a secondary intelligence layer for wallet analysis, reminders, and future agent flows.

Neither sponsor integration should complicate the primary Split Mode settlement path.

## Tech Stack

- Frontend: Next.js 15, React 19, Tailwind v4, Radix / shadcn UI
- Wallets: `@solana/wallet-adapter-*` (primary); optional `@phantom/react-sdk` when Portal is configured
- Chain: Solana devnet for now
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
- `SUPABASE_SERVICE_ROLE_KEY`
- `FUNDWISE_SESSION_SECRET`

Fallback compatibility is present for:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Run

```bash
pnpm dev
pnpm build
pnpm lint
```

Current verification state:

- `pnpm exec tsc --noEmit` passes
- `pnpm lint` passes
- `pnpm build` passes

### Database Bootstrap

The base FundWise tables now live in `supabase/migrations/`, not only in `supabase/schema.sql`.

If a remote Supabase project was linked before that bootstrap migration existed, backfill it with:

```bash
supabase db push --include-all
```

## MVP Notes

- Solana devnet is the active execution environment for now.
- Mainnet-beta comes later, after the devnet hardening and rehearsal path is finished.
- Members need SOL for gas even though Settlements use USDC.
- The current execution order is:
  devnet settlement hardening -> manual QA -> LI.FI top-up / add-funds flow -> Zerion and Telegram support layers -> later Fund Mode proposals
- The current docs source of truth is split across [STATUS.md](./STATUS.md), [CONTEXT.md](./CONTEXT.md), and [PRD.md](./PRD.md). If another doc disagrees, those three win.

## License

TBD.
