# FundWise

**Splitwise on Solana.** Split expenses with friends and settle instantly in stablecoins — no IOUs, no chasing anyone on Venmo.

A second mode, **Fund Mode**, flips the model: pool money into a shared treasury up front (a "reverse Splitwise") and spend from it via lightweight proposals. Great for group trips, shared gifts, or any recurring shared cost.

---

## Status

This repo is currently in **Phase 0 → 1 transition** — hackathon sprint for the Colosseum Frontier hackathon (April 6 – May 11, 2026). Focused on Germany-only tracks: LI.FI, Visa, Zerion.

For the full plan:

- [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) — hackathon track analysis and submission strategy
- [CONTEXT.md](./CONTEXT.md) — domain model, language, relationships
- [PRD.md](./PRD.md) — product vision, modes, user flows, scope
- [ROADMAP.md](./ROADMAP.md) — phased delivery plan (hackathon-timed)
- [STATUS.md](./STATUS.md) — what's in the repo today, what's next
- [docs/adr/](./docs/adr/) — architecture decision records

---

## Modes

### Split Mode (MVP priority)

- Create a group of friends (by wallet, handle, or share-link/QR).
- Log expenses in the group's chosen stablecoin (USDC by default; any SPL stablecoin supported).
- See per-member balances with a simplified settlement graph (minimum transactions to zero out).
- Settle debts with a one-click on-chain SPL transfer. The tx signature is recorded as proof.

### Fund Mode (Phase 2)

- Pool stablecoins into a shared treasury (Squads multisig for MVP).
- Propose spends (recipient, amount, memo).
- Threshold-based approval; approved proposals execute automatically.
- Cross-chain contributions via LI.FI (bridge from any chain).
- Optional: unused balance refunds proportionally to contributors.

---

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind v4, Radix / shadcn UI
- **Wallets:** `@solana/wallet-adapter-`* — Phantom, Solflare, Backpack
- **Chain:** Solana (devnet for MVP, mainnet at Phase 4)
- **Tokens:** `@solana/spl-token` for SPL stablecoin transfers
- **Treasury (Fund Mode):** Squads Protocol (`@sqds/multisig`)
- **Cross-chain:** LI.FI SDK (`@lifi/sdk`) for bridge+swap contributions
- **Off-chain state:** Firebase Realtime DB (group metadata, expenses, members)
- **RPC:** QuickNode (production)

---

## Project structure

```
/
├── AGENTS.md               ← Instructions for all AI agents (READ FIRST)
├── CONTEXT.md              ← Domain model, language, relationships
├── HACKATHON_PLAN.md       ← Hackathon track strategy
├── PRD.md                  ← Product Requirements Document
├── ROADMAP.md              ← Phased delivery plan
├── STATUS.md               ← Current state and next actions
├── docs/
│   └── adr/                ← Architecture Decision Records
├── app/                    ← Next.js App Router pages
│   ├── page.tsx            ← Landing page
│   ├── layout.tsx          ← Root layout
│   ├── circles/page.tsx    ← Groups list (to be renamed)
│   └── circle/[id]/page.tsx ← Group dashboard (to be renamed)
├── components/             ← React components
│   ├── ui/                 ← shadcn primitives
│   ├── header.tsx          ← Navigation
│   ├── hero-section.tsx    ← Landing hero
│   ├── wallet-provider.tsx ← Solana wallet adapter
│   └── ...                 ← App-level components
├── lib/                    ← Client-side logic
│   ├── solana.ts           ← Group CRUD + wallet interactions
│   ├── simple-payment.ts   ← SOL transfer implementation
│   ├── squads-multisig.ts  ← Squads multisig (Fund Mode)
│   ├── firebase.ts         ← Firebase config
│   ├── firebase-group-storage.ts ← Firebase group persistence
│   └── ...
├── hooks/                  ← React hooks
└── public/                 ← Static assets
```

---

## Getting started

### Prerequisites

- Node 20+ and `pnpm`
- A Solana wallet (Phantom / Solflare / Backpack) with devnet SOL
- A Solana RPC URL (Helius, QuickNode, or `https://api.devnet.solana.com`)
- A Firebase project with Realtime Database enabled

### Install

```bash
pnpm install
```

### Environment

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SOLANA_RPC_URL` — RPC endpoint
- `NEXT_PUBLIC_SOLANA_NETWORK` — `devnet` or `mainnet-beta`
- `NEXT_PUBLIC_FIREBASE_*` — Firebase web-app config

### Run

```bash
pnpm dev       # starts Next.js on http://127.0.0.1:3000
pnpm build     # production build
pnpm lint      # eslint
```

---

## Onboarding

Read in this order:

1. [AGENTS.md](./AGENTS.md) — shared instructions for all AI agents.
2. [STATUS.md](./STATUS.md) — what's live, what's stubbed, what's removed.
3. [CONTEXT.md](./CONTEXT.md) — domain language and relationships.
4. [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) — hackathon strategy.
5. [PRD.md](./PRD.md) — product intent and scope.
6. [ROADMAP.md](./ROADMAP.md) — what's being built and when.
7. [docs/adr/](./docs/adr/) — why the code looks the way it does.

---

## Contributing

Private project right now — no PRs expected from outside.

## License

TBD.