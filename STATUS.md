# FundWise — Status

**Snapshot date:** 2026-04-25
**Phase:** 1 complete (Split Mode core) — paused before Phase 1.5
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
- `@solana/wallet-adapter-*` (Phantom, Solflare, etc.)
- `@solana/web3.js`, `@solana/spl-token`
- Supabase (`@supabase/supabase-js`) + Postgres schema in `supabase/schema.sql`
- Squads multisig (`@sqds/multisig`) — reserved for Fund Mode

**Completed in this phase:**

- Firebase removed; Supabase introduced as the only off-chain data layer
- New normalized DB model implemented (`groups`, `members`, `expenses`, `expense_splits`, `settlements`, `contributions`, `proposals`, `proposal_approvals`)
- New Split Mode data + logic modules:
  - `lib/db.ts` (CRUD and activity feed)
  - `lib/expense-engine.ts` (split math, balances, settlement graph, SPL settlement)
- New routes and dashboard:
  - `/groups`
  - `/groups/[id]`
- "circles" legacy routes removed and replaced with "groups"
- Build verified green with the new structure

**Still pending in Split Mode (before submission polish):**

- Edit/delete expense with settlement guard
- Dedicated settlement receipt screen (currently toast + tx sig)
- Final empty-state and copy polish on a few edge views

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

## Resume point (next session)

1. **Setup unblock:** Run `supabase/schema.sql` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **Phase 1.5:** LI.FI integration (`@lifi/sdk`) for cross-chain fund contributions.
3. **Visa polish:** PYUSD pass + settlement receipt UI + flow polish.
4. **Phase 2:** Fund Mode treasury and proposals on top of Squads.

---

## Ground rules

- **No git operations** performed by the assistant — commits and pushes are the owner's.
- Work only inside `/Users/sarthiborkar/Build/FundWise`.
- Tell the owner whenever an external input is needed (RPC URL, API key, mint address, etc.) rather than guessing.

