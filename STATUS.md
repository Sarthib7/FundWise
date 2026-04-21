# FundWise — Status

**Snapshot date:** 2026-04-21
**Phase:** 1 — Split Mode MVP (Phase 0 complete)

---

## TL;DR

Project was a Solana prediction-market + group-fundraising hackathon app called "Fund Flow." It has been renamed to **FundWise** and is pivoting to a two-mode consumer expense app:

1. **Split Mode** — Splitwise on Solana (MVP priority).
2. **Fund Mode** — shared on-chain treasury with proposal-based spending (phase 2).

See [PRD.md](./PRD.md), [ROADMAP.md](./ROADMAP.md), [DECISIONS.md](./DECISIONS.md).

---

## What's in the repo today

**Stack (keep):**
- Next.js 15 (App Router) + React 19 + Tailwind v4 + Radix/shadcn UI
- `@solana/wallet-adapter-*` (Phantom, Solflare, etc.)
- `@solana/web3.js`, `@solana/spl-token`
- Firebase (Realtime DB for group metadata; Storage for avatars)
- Squads multisig (`@sqds/multisig`) — reserved for Fund Mode

**Features present (mixed — see Removals):**
- Group ("circle") creation, joining via invite code, QR share
- Wallet connection UI and a "wallet-button" pattern
- Landing page, avatar customizer, group showcase
- Prediction-market / Kalshi / challenge-market code (**to be removed**)
- ZK compression scaffolding (**to be removed**)
- Liquidity-pool / Meteora scaffolding (**to be removed**)

---

## Removals (Phase 0 cleanup list)

### Files to delete
- `app/api/kalshi/` (whole dir)
- `lib/kalshi-integration.ts`
- `lib/prediction-market.ts`
- `lib/zk-compression.ts`
- `lib/anchor/challenge_market.ts` + `.json`
- `lib/anchor/compressed_pool.ts` + `.json`
- `lib/anchor/liquidity_interface.ts` + `.json`
- `lib/anchor/fund_flow_programs.ts` + `.json`
- `components/prediction-polls.tsx`
- `components/leaderboard-section.tsx` (prediction leaderboard; rebuild later if needed)

### `package.json` deps to drop
- `kalshi-typescript`
- `@lightprotocol/compressed-token`, `@lightprotocol/stateless.js`
- `@abstract-foundation/agw-client`
- `@privy-io/react-auth`
- `permissionless`

### Copy / UI to rewrite
- `README.md` — rewrite around FundWise pitch.
- `app/page.tsx`, `components/hero-section.tsx`, `components/how-it-works-section.tsx`, `components/group-showcase-section.tsx` — reframe for Splitwise-on-Solana.
- `components/header.tsx` — remove any prediction links.

### Rename (ADR-007)
- `circles` → `groups` in UI, code, and routes.

---

## What's next (immediate)

1. Apply the Phase 0 removals (above).
2. Verify `pnpm build` still passes with zero references to the removed modules.
3. Rewrite landing page copy around Split Mode.
4. Start Phase 1 work (see [ROADMAP.md](./ROADMAP.md)).

---

## Ground rules (from owner)

- **No git operations** performed by the assistant — commits and pushes are the owner's.
- Work only inside `/Users/sarthiborkar/Build/FundWise`.
- Tell the owner whenever an external input is needed (RPC URL, API key, mint address, etc.) rather than guessing.
