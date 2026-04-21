# FundWise — Decisions Log

ADR-style log of architectural and product decisions. Newest first.

---

## ADR-001 — Pivot from Fund Flow (prediction market) to FundWise (Splitwise on Solana)

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Project began as a hackathon prediction-market + group fundraising app with Kalshi integration, ZK compression, and Meteora LP yield. Hackathon is over; owner wants a product with clearer user value and a day-one audience.

**Decision:** Pivot to a two-mode consumer expense app:
- Split Mode (Splitwise-on-Solana) — MVP priority.
- Fund Mode (shared treasury with proposals) — phase 2.

**Consequences:**
- All prediction-market / Kalshi / LP-yield code is removed.
- UI, landing page, and copy are rebuilt around expense-splitting.
- Brand stays "FundWise" to cover both modes.

---

## ADR-002 — Stablecoins only for balances; SOL only for gas

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Splitwise-like apps need unit-of-account stability. SOL price volatility makes it unusable for "you owe $14.50."

**Decision:** Every group picks a single SPL stablecoin mint at creation. All balances, expenses, and settlements use that mint. USDC is the default. USDT, PYUSD, and arbitrary SPL stables are allowed (user pastes mint or picks from a curated list).

**Consequences:**
- No FX / price-oracle code in MVP.
- A group can't mix mints — simplifies math and UX.
- Need to decide: curated stablecoin list vs. arbitrary mint input (tracked as open question in PRD §9).

---

## ADR-003 — Off-chain group metadata, on-chain money movement

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Storing every expense on-chain is expensive and slow; storing money movements off-chain is insecure and unverifiable.

**Decision:** Split the state:
- **Off-chain** (Firebase Realtime DB for MVP): group name, members, expense line items, split config, comments.
- **On-chain**: SPL token transfers for settlements and fund contributions. The settlement tx signature is written back to the off-chain record as proof.

**Consequences:**
- Don't need a custom Anchor program for Split Mode — plain SPL transfers are enough.
- Firebase is a single point of trust for who-owes-whom until settled; acceptable for friend-group trust model.
- Revisit if we ever ship public/stranger groups.

---

## ADR-004 — Drop ZK compression, Meteora/Raydium, Kalshi, Light Protocol

**Date:** 2026-04-21
**Status:** Accepted

**Context:** These were hackathon features, not user-demanded. They add dependency weight, attack surface, and maintenance burden.

**Decision:** Remove:
- `kalshi-typescript`, `app/api/kalshi`, `lib/kalshi-integration.ts`, `lib/prediction-market.ts`
- `@lightprotocol/*`, `lib/zk-compression.ts`, `lib/anchor/compressed_pool.*`
- `lib/anchor/challenge_market.*`, `lib/anchor/liquidity_interface.*`, `lib/anchor/fund_flow_programs.*`
- `components/prediction-polls.tsx`, `components/leaderboard-section.tsx`
- Unused deps: `@abstract-foundation/agw-client`, `@privy-io/react-auth`, `permissionless`

**Consequences:**
- Leaner bundle, faster builds, fewer auth paths.
- If we later need cost optimization at scale, reintroduce ZK compression deliberately.

---

## ADR-005 — Reuse Squads multisig for Fund Mode treasury (phase 2)

**Date:** 2026-04-21
**Status:** Tentative (revisit before Fund Mode implementation)

**Context:** Fund Mode needs a shared treasury with threshold approvals. Two options: (a) Squads Protocol multisig, (b) custom Anchor vault program with proposal + vote instructions.

**Decision:** Start with Squads (the `@sqds/multisig` integration is already wired). Evaluate UX friction for non-technical users — if it's too heavy, build a thin custom Anchor program in phase 3.

**Consequences:**
- Phase 2 ships faster.
- Squads UX is not perfect for casual users (extra approval step, Squads UI dependency); may need to abstract it behind our own UI.

---

## ADR-006 — Wallet-only auth; no email/password, no Firebase Auth

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Users are crypto-comfortable by assumption. Adding email adds friction without real identity value.

**Decision:** Identity = connected Solana wallet. Display names are user-chosen profile labels stored alongside the wallet address. Group invites are by address, handle, or share-link/QR.

**Consequences:**
- No account-recovery flow — wallet loss = data loss (for the wallet's view). Group data survives because it's keyed by wallet addresses in Firebase.
- Non-wallet friends = "pending" member slots (PRD §9 question).

---

## ADR-007 — Rename "circles" → "groups" in UI and code

**Date:** 2026-04-21
**Status:** Proposed

**Context:** "Circles" was the old Fund Flow term for prediction-market groups. "Group" is the Splitwise term and maps to user mental model.

**Decision:** Rename on next UI pass. URL routes: `/circles` → `/groups`, `/circle/[id]` → `/groups/[id]`. Keep redirects for any external links.

**Consequences:**
- Straightforward rename; done as part of Phase 1.

---

## ADR-008 — Keep Next.js + shadcn/ui + wallet-adapter stack

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Inherited stack works and is modern. No reason to rebuild.

**Decision:** Keep Next.js 15 (App Router), React 19, Tailwind v4, Radix/shadcn components, `@solana/wallet-adapter-*`. Stop using `@solana/kit` until there's a reason — stick to `@solana/web3.js` + `@solana/spl-token` conventions for MVP.

**Consequences:**
- Minimal rebuild; focus energy on product logic.
