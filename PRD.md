# FundWise — Product Requirements Document

**Owner:** Sarthi
**Status:** Draft v0.1 (pivot from Fund Flow prediction-market hackathon project)
**Last updated:** 2026-04-21

---

## 1. Vision

**FundWise is Splitwise on Solana.**

Friends split expenses and settle up in stablecoins on Solana — no IOUs, no "I'll Venmo you later," no chasing people. Pay once, settled forever, on-chain.

A second mode, **Fund Mode**, flips the model: friends pool money into a shared treasury up front (a "reverse Splitwise") and spend from it collaboratively via proposals — great for trips, birthdays, group gifts, recurring shared costs.

## 2. Non-goals (explicit)

- **Not** a prediction market. All prediction / Kalshi / challenge-market code is removed.
- **Not** a yield product. No Meteora / Raydium / LP integrations.
- **Not** a DAO platform. Fund Mode proposals are small-group only, not governance.
- **Not** an L1-agnostic app. Solana-only.
- **Not** a custodial product. Users hold their own keys (wallet adapter).

## 3. Target users

- Friend groups (2–15 people) who travel, eat out, share rent, or split recurring costs.
- Crypto-comfortable users who already have a Solana wallet (Phantom, Solflare, Backpack) or are willing to get one.
- Secondary: group-trip organizers, roommates, couples who want shared budgets.

## 4. Core modes

### Mode 1 — **Split Mode** (priority / MVP)

*"Splitwise on Solana."*

**Job:** Track who paid for what in a group, compute who owes whom, and let people settle in one click with stablecoins.

**Key flows:**
1. **Create a group** — name, members (by wallet address, ENS-style handle, or share-link/QR).
2. **Add an expense** — payer, amount (USDC / USDT / PYUSD / any SPL stablecoin), participants, optional category + memo, split method (equal / shares / exact amounts / percentage).
3. **View balances** — per-member net balance and simplified settlement graph (minimum transactions to zero out debts).
4. **Settle up** — one-click SPL token transfer from debtor → creditor. Transaction signature is stored on the expense as proof.
5. **Activity feed** — chronological log of expenses, edits, settlements.

**Edge cases in scope for MVP:**
- Edit / delete an expense (if unsettled).
- Uneven splits (rounding — designate a "rounding taker").
- Partial settlements.
- A non-wallet friend (placeholder handle) whose balance can be claimed when they join.

### Mode 2 — **Fund Mode** (phase 2)

*"Reverse Splitwise — shared treasury with proposal-based spending."*

**Job:** Pool money up front into a group-owned treasury and spend it via lightweight proposals.

**Key flows:**
1. **Create a fund** — name, members, target amount, contribution rule (equal / custom), stablecoin mint.
2. **Contribute** — members deposit into the treasury (a Squads multisig or a program-owned vault PDA).
3. **Propose a spend** — proposer specifies recipient, amount, memo, optional attachment (e.g. receipt image hash).
4. **Vote / approve** — threshold-based approval (configurable: majority / all / N-of-M). Approved proposals execute the transfer automatically.
5. **Close / distribute** — when the trip/event ends, remaining funds refund proportionally to contributors (or roll forward).

**MVP simplifications:**
- Treasury = Squads multisig (reuse existing `@sqds/multisig` integration).
- Approval = N-of-M multisig threshold, picked at fund creation.
- No recurring contributions in v1 (just lump-sum).

## 5. Product principles

1. **On-chain settlement, off-chain UX.** Group metadata lives off-chain (fast, editable). Money movement is always on-chain.
2. **Stablecoins, not SOL.** All balances and settlements denominated in stablecoins. SOL is only used for gas.
3. **Any Solana stablecoin.** USDC is primary, but the app is mint-agnostic — user picks the group's stablecoin at creation.
4. **One-click to pay.** A settlement should never take more than 2 taps + wallet sign.
5. **Private by default.** Groups are private/invite-only; no public discovery feed in v1.

## 6. Key non-functional requirements

- **Performance:** Settlement tx should confirm in ≤3s on mainnet; UI optimistic update.
- **Cost:** Gas per settlement should be <$0.01 (Solana baseline is fine — no compression needed for MVP).
- **Auth:** Wallet signature for identity. No email/password, no Firebase Auth.
- **Storage:** Group/expense metadata in Firebase Realtime DB (already wired) or a hosted Postgres — TBD in DECISIONS.md.
- **Mobile:** Must work on mobile Safari/Chrome. Native app deferred.

## 7. Success metrics (directional, not for MVP judging)

- **Activation:** % of group creators who log ≥1 expense within 24h.
- **Core loop:** median # of expenses per group per week.
- **Settlement ratio:** % of owed balances that get settled on-chain (vs. ignored).
- **Retention:** % of groups with activity in week 4.

## 8. Out of scope (parking lot)

- Fiat on/off-ramps (point users to Coinbase/Circle link).
- Multi-chain (EVM, etc).
- Push notifications (web-push comes later).
- Recurring / scheduled payments.
- Group discovery / public groups.
- Tax exports.
- ZK-compressed state (defer — reconsider if users hit real cost walls).
- Mobile native app.

## 9. Open questions

- Do we require every member to have a wallet at group-creation time, or support "pending" members identified by handle until they connect?
- For Fund Mode, is Squads multisig the right primitive, or does a custom Anchor vault program give better UX (and lower friction for non-technical users)?
- Debt-simplification algorithm: show *all* pairwise debts, or auto-minimize to fewest transfers (Splitwise-style)?
- Stablecoin list per-group: hardcode (USDC/USDT/PYUSD) or allow arbitrary SPL mint?
