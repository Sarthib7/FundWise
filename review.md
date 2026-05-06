# FundWise — Product Roast Review

**Date:** 2026-04-30
**Reviewer:** Pi Agent (roast-my-product skill)
**Product:** FundWise — Group money, done right
**Stage:** Hackathon MVP (Colosseum Frontier, deadline May 11, 2026)

---

## Verdict

FundWise is a Group money app for crypto people who already have USDC on Solana — a product for approximately 47 humans, built by a team that spent more words on ADRs, CONTEXT.md glossaries, and planned Telegram bots than on getting a single real user through the core loop on mainnet.

---

## Scorecard

| Dimension | Score | Justification |
|---|---|---|
| **Value Proposition** (2x) | **6/10** | The problem is real: shared-expense tools handle bookkeeping but not final settlement. But "settle in USDC on Solana" narrows the addressable market to people who (a) split expenses, (b) are OK with crypto, (c) hold USDC on Solana, (d) want to settle debts that way. Niche of a niche of a niche. |
| **Crypto Necessity** | **7/10** | One of the better crypto products for actual necessity. Existing shared-expense apps do not provide cross-border settlement finality. On-chain USDC transfer IS the settlement. Replace blockchain with Postgres and you're back to tracking debts but not closing them. |
| **Target User Clarity** | **4/10** | Docs say "consumer payments" but UX requires: Solana wallet, USDC on Solana, SOL for gas, understanding of token accounts, and tolerance for devnet. Building for crypto-native expats and hackathon judges, not "consumers." |
| **First-Time User Experience** | **3/10** | Landing page → Connect Wallet → figure out what to do. No demo. No "try it without a wallet." No onboarding walkthrough. The disconnected `/groups` page is decent but walls off ALL value behind wallet connect. |
| **Core Loop** | **5/10** | Create Group → Add Expense → See Balance → Settle → Receipt. The loop exists and it's correct. But frequency is episodic (trips, dinners), not daily. No notifications. No push triggers to return. |
| **Competitive Moat** | **2/10** | What stops an incumbent shared-expense app from adding "Settle with crypto"? Nothing. No network effects. No data lock-in. No liquidity moat. No user base. A funded competitor could replicate this in 2 weeks. |
| **Technical Execution** | **5/10** | Code compiles. Architecture is solid (Supabase + Solana + server-side mutations + RPC verification). But: **zero tests**, LI.FI is "groundwork" not shipped, Fund Mode Proposals don't exist, no mainnet deployment. Well-structured prototype, not production. |
| **Naming & Messaging** | **6/10** | "FundWise" is fine. The positioning is clear when it owns Group money instead of borrowing competitor mind-share. But landing page buries the lead under mode explanations, tech strips, and feature sections. Dual-mode confuses before anyone understands the first. |
| **Monetization Path** | **2/10** | No monetization plan. No fees, no premium tier, no protocol revenue. PRD, ROADMAP, STATUS — none mention revenue. Free tool hoping the hackathon leads somewhere. |
| **Market Timing** | **5/10** | Stablecoin payments are having a moment. Visa IS interested in on-chain settlement. But Solana consumer apps have struggled to find PMF. Not riding a wave; hoping one forms. |

| **Total** | **51/110** |
|---|---|

**Verdict band: 50-69 — Needs significant work. Core issues to address.**

---

## The Worst Issues

### 1. Ghost Market — Target User is Too Narrow

**What's wrong:** Target user needs to (1) have a Solana wallet, (2) hold USDC on Solana, (3) have SOL for gas, (4) want to split expenses with friends, (5) have friends who also meet criteria 1-3, and (6) prefer this over familiar off-chain settlement rails.

**Why it matters:** No users = no product. Hackathon judges will see a demo that works for the 3 people in the room with Phantom wallets.

**What good looks like:** Either abstract the crypto away completely (user never needs to know they're on Solana) or own the niche explicitly: "for crypto-native expat groups who split bills across borders."

### 2. Zero Onboarding, Zero Discovery, Zero Trial

**What's wrong:** Entire app is behind a wallet gate. No way to see FundWise in action without connecting. No demo mode. No sample Group. No interactive preview.

**Why it matters:** First-time visitors bounce. They don't trust you enough to connect a wallet.

**What good looks like:** A "Try a demo Group" button that loads a pre-populated Group with sample expenses, balances, and a simulated settlement flow. Show the product working before asking for a wallet.

### 3. 18 ADRs, 0 Tests, 0 Real Users

**What's wrong:** Exceptional documentation — 18 ADRs, 600-line CONTEXT.md, 23KB STATUS.md. But `tests/` is empty. Zero test files. More documentation about planned features (Fundy, Agent Skill, Scoped Agent Access) than evidence the core loop works reliably.

**Why it matters:** Judges don't care about ADRs. They care whether settlement works when USDC is low, when SOL is missing, when the network is slow, when two people settle simultaneously.

**What good looks like:** Tests on expense engine (balance math, settlement graph), tests on Supabase mutations, at minimum one end-to-end devnet flow that runs automatically.

### 4. Documentation-to-Product Ratio is Inverted

**What's wrong:** ~15 files of planning documentation totaling 100,000+ words. Actual meaningful TypeScript: ~5,000 lines across 20 files. Detailed specs for Fundy, Agent Skill Endpoint, Scoped Agent Access — all months away.

**Why it matters:** Every hour spent documenting Fundy's `/link` command flow is an hour not spent making settlement work on mainnet. Docs create an illusion of progress.

**What good looks like:** 2 planning docs max for hackathon: README + STATUS.md. ADRs only for implemented decisions. Archive all Fund Mode, Fundy, Agent Skill planning until Split Mode is live.

### 5. No One Comes Back

**What's wrong:** Core loop is episodic, not habitual. No push notifications ("Alice added a $60 dinner"). No social feed. No recurring expenses. No weekly summary. Nothing triggers a return visit.

**Why it matters:** Without retention, every user is a one-time acquisition cost.

**What good looks like:** Active notifications, Activity Feed as a reason to return, at least one retention mechanic before the hackathon.

---

## Common Sins Detected

- **Wallet Gate (#3):** Zero product value without wallet connect. `/groups` is a beautiful wall. Textbook wallet gate.
- **No Retention Loop (#5):** Add expenses, settle, done. No return trigger. "Check your Group balances" is not a loop.
- **Bridge to Nowhere (#8):** LI.FI integration is "groundwork" — SDK installed but no user-facing flow. Stop selling what isn't shipped.
- **Complexity Worship (#12):** Drowning in terminology for what is essentially a shared ledger plus Send USDC. Source Currency, Exchange Rate Snapshot, Simplified Settlement Graph, Scoped Agent Access — the conceptual overhead is enormous.
- **Grant-Dependent (#10):** This is a hackathon project built for Colosseum Frontier. No revenue model. No sustainability plan beyond sponsor prizes.

---

## UX Red Flags

- **Wallet Connection Before Value Preview (#1):** Entire app requires wallet to see anything. No demo mode, no preview, no sample data.
- **No Transaction Simulation (#2):** Settlement asks users to sign a USDC transfer without a crystal-clear preview of exact amount, recipient, and fee.
- **No Onboarding for Non-Crypto Users (#8):** Once connected, no guidance on "you need USDC" or "you need SOL for gas." Users discover requirements by failing.
- **Stale Data After Transaction (#10):** No WebSocket subscriptions, no optimistic updates, no auto-refresh strategy documented for post-settlement state.
- **Loading States Without Explanation (#12):** During settlement — the highest-anxiety moment — what does the user see while the tx confirms?

---

## Fix These Now (Prioritized)

1. **Demo mode (highest impact):** ✅ SHIPPED — `/demo` route with 5-step walkthrough.
2. **Cut docs, add tests (easiest win):** ✅ SHIPPED — 32 tests, ADR-0018/0014 archived.
3. **Abstract crypto or own the niche (existential fix):** Partially addressed — hero copy now leads with "Group money, done right." Full resolution requires embedded wallet integration (post-hackathon).

## Dependabot — 2026-04-30

10 transitive vulnerabilities from `@solana/*` wallet adapter deps (protobufjs, bigint-buffer, lodash, elliptic, uuid, postcss). All are indirect deps. None exploitable in client-side Next.js app — no server-side protobuf parsing, no user-controlled template rendering, no direct crypto primitive usage. Safe to acknowledge and suppress. Patch by updating `@solana/wallet-adapter-*` when upstream releases fixes.
