# FundWise — Status

**Snapshot date:** 2026-04-25
**Phase:** 0 → 1 transition (Hackathon sprint)
**Hackathon:** Colosseum Frontier (April 6 – May 11, 2026)

---

## TL;DR

FundWise is **Splitwise on Solana** — a two-mode consumer expense app:

1. **Split Mode** — Track expenses, compute balances, settle in stablecoins (MVP priority).
2. **Fund Mode** — Shared on-chain treasury with proposal-based spending (phase 2).

We are participating in the **Colosseum Frontier** hackathon with focus on Germany-only tracks (LI.FI, Visa, Zerion). See [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) for track strategy.

---

## File Structure

```
/
├── AGENTS.md               ← Instructions for all AI agents (READ FIRST)
├── CONTEXT.md              ← Domain model, language, relationships
├── HACKATHON_PLAN.md       ← Track analysis, submission strategy, timeline
├── PRD.md                  ← Product Requirements Document
├── README.md               ← Project overview + getting started
├── ROADMAP.md              ← Phased delivery plan
├── STATUS.md               ← This file — current state
├── docs/
│   └── adr/                ← Architecture Decision Records
│       ├── 0001-pivot-from-fund-flow-to-fundwise.md
│       ├── 0002-stablecoins-only-for-balances.md
│       ├── 0003-off-chain-metadata-on-chain-money.md
│       ├── 0004-drop-hackathon-dependencies.md
│       ├── 0005-squads-multisig-for-fund-mode.md
│       ├── 0006-wallet-only-auth.md
│       ├── 0007-rename-circles-to-groups.md
│       └── 0008-keep-nextjs-shadcn-stack.md
├── DECISIONS.md            ← Legacy ADR log (superseded by docs/adr/)
├── app/                    ← Next.js App Router pages
├── components/             ← React components (ui/ = shadcn primitives)
├── lib/                    ← Client-side logic
├── hooks/                  ← React hooks
└── public/                 ← Static assets
```

---

## What's in the repo today

**Stack:**

- Next.js 15 (App Router) + React 19 + Tailwind v4 + Radix/shadcn UI
- `@solana/wallet-adapter-`* (Phantom, Solflare, etc.)
- `@solana/web3.js`, `@solana/spl-token`
- Firebase (Realtime DB for group metadata; Storage for avatars)
- Squads multisig (`@sqds/multisig`) — reserved for Fund Mode

**Features present:**

- Group ("circle") creation, joining via invite code, QR share
- Wallet connection UI (wallet-button pattern)
- Landing page, avatar customizer, group showcase
- SOL-based group wallet generation (Phase 1 simple-wallet approach)
- Squads multisig scaffolding (commented out, for Fund Mode)
- Firebase + localStorage dual storage

**Still needs cleanup (from Phase 0):**

- Prediction-market / Kalshi / ZK / LP-yield code removal (some files may still exist)
- "circles" → "groups" rename in UI + routes
- Landing page rewrite for Splitwise-on-Solana framing

---

## Hackathon Tracks — Submission Plan


| Priority | Track                          | Prize        | Status         |
| -------- | ------------------------------ | ------------ | -------------- |
| **P1**   | Visa Frontier (DE)             | $10,000 USDG | Must-submit    |
| **P1**   | Build with LI.FI (DE)          | $2,500 USDC  | Must-submit    |
| P2       | Zerion CLI Agent (DE)          | $2,000 USDC  | If time allows |
| P2       | Live dApp / Eitherway (Global) | $20,000 USDC | If time allows |
| —        | Jupiter (Global)               | 3,000 jupUSD | Skip           |


**Deadline:** May 11, 2026 (Colosseum) / May 26-27 (side track announcements)

---

## What's next (immediate — this week)

1. **Phase 0 cleanup:** Remove prediction-market code, rewrite landing page.
2. **Phase 1 start:** Split Mode — group CRUD, expense entry, balance computation.
3. **LI.FI integration:** Add `@lifi/sdk` for cross-chain Fund Mode contributions.
4. **Verify** `pnpm build` passes with zero references to removed modules.

---

## Ground rules

- **No git operations** performed by the assistant — commits and pushes are the owner's.
- Work only inside `/Users/sarthiborkar/Build/FundWise`.
- Tell the owner whenever an external input is needed (RPC URL, API key, mint address, etc.) rather than guessing.

