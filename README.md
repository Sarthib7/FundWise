# FundWise

**Splitwise on Solana.** Split expenses with friends and settle instantly in stablecoins — no IOUs, no chasing anyone on Venmo.

A second mode, **Fund Mode**, flips the model: pool money into a shared treasury up front (a "reverse Splitwise") and spend from it via lightweight proposals. Great for group trips, shared gifts, or any recurring shared cost.

> Renamed and pivoted from the "Fund Flow" hackathon prediction-market project. Hackathon scaffolding (Kalshi, ZK compression, Meteora/Raydium LP) has been removed.

---

## Status

This repo is currently in **Phase 0 — pivot cleanup**. The prediction-market / Kalshi / ZK / LP-yield code has been removed. The landing page and core flows are being rebuilt around expense-splitting.

For the full plan:
- [PRD.md](./PRD.md) — product vision, modes, user flows, scope
- [ROADMAP.md](./ROADMAP.md) — phased delivery plan
- [DECISIONS.md](./DECISIONS.md) — architectural decisions (ADR-style)
- [STATUS.md](./STATUS.md) — what's in the repo today, removals, next actions

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
- Optional: unused balance refunds proportionally to contributors.

---

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind v4, Radix / shadcn UI
- **Wallets:** `@solana/wallet-adapter-*` — Phantom, Solflare, Backpack
- **Chain:** Solana (devnet for MVP, mainnet at Phase 3)
- **Tokens:** `@solana/spl-token` for SPL stablecoin transfers
- **Treasury (Fund Mode):** Squads Protocol (`@sqds/multisig`)
- **Off-chain state:** Firebase Realtime DB (group metadata, expenses, members)

---

## Getting started

### Prerequisites

- Node 20+ and `pnpm`
- A Solana wallet (Phantom / Solflare / Backpack) with devnet SOL
- A Solana RPC URL (Helius, QuickNode, or `https://api.devnet.solana.com`)
- A Firebase project with Realtime Database enabled
- *(Fund Mode only, Phase 2+)* Squads Protocol configured on the target network

### Install

```bash
pnpm install
```

### Environment

Copy the example and fill in your keys. The assistant will tell you which values are needed; **you** paste them locally.

```bash
cp .env.example .env.local   # create this if it doesn't exist
```

Required:
- `NEXT_PUBLIC_SOLANA_RPC_URL` — RPC endpoint
- `NEXT_PUBLIC_SOLANA_NETWORK` — `devnet` or `mainnet-beta`
- `NEXT_PUBLIC_FIREBASE_*` — standard Firebase web-app config (apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId)

### Run

```bash
pnpm dev       # starts Next.js on http://127.0.0.1:3000
pnpm build     # production build
pnpm lint      # eslint
```

---

## Onboarding — "I just landed in this repo, what now?"

Read in this order:
1. [STATUS.md](./STATUS.md) — you'll know what's live, what's stubbed, and what was removed.
2. [PRD.md](./PRD.md) — product intent and scope.
3. [ROADMAP.md](./ROADMAP.md) — what's being built right now and what's next.
4. [DECISIONS.md](./DECISIONS.md) — *why* the code looks the way it does (stablecoin-only, off-chain metadata, Squads for treasury, etc).

Directory map:
- `app/` — Next.js App Router pages. `app/circle/[id]` is the current group dashboard; it will be renamed to `app/groups/[id]` in Phase 0.
- `components/` — React components. `ui/` is shadcn primitives; everything else is app-level.
- `lib/` — client-side logic. `solana.ts`, `simple-payment.ts`, `simple-wallet.ts` are kept. Firebase wrappers are in `firebase-*.ts`. `squads-multisig.ts` is reserved for Fund Mode.
- `lib/anchor/group_manager.*` — kept for reference; not wired in MVP.
- `hooks/` — a couple of small React hooks.

---

## Contributing

Private project right now — no PRs expected from outside.

## License

TBD.
