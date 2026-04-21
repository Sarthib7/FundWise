# FundWise — Roadmap

Phased plan from pivot cleanup to Fund Mode launch. Each phase has a clear exit criterion before moving on.

---

## Phase 0 — Pivot cleanup (this week)

**Goal:** Strip all prediction-market / Kalshi / ZK / LP-yield code. Rebuild landing page around Splitwise-on-Solana narrative.

**Work items:**
- [ ] Delete files listed in STATUS.md §Removals.
- [ ] Drop unused deps from `package.json` (Kalshi, Light Protocol, Privy, Abstract, permissionless).
- [ ] Rewrite `README.md` for the new product.
- [ ] Rewrite `app/page.tsx`, `components/hero-section.tsx`, `components/how-it-works-section.tsx` for Split Mode framing.
- [ ] Rename "circles" → "groups" across UI + routes.
- [ ] Update `components/header.tsx` nav (remove prediction links).
- [ ] Verify `pnpm build` passes with zero references to removed modules.

**Exit criterion:** `pnpm build` green, landing page says "Splitwise on Solana," no prediction-market UI reachable.

---

## Phase 1 — Split Mode MVP (2–3 weeks)

**Goal:** A user can create a group, add expenses, see balances, and settle on-chain with USDC.

**Data model (off-chain, Firebase):**
```
groups/{groupId} = {
  name, stablecoinMint, createdBy, createdAt,
  members: [{ wallet, displayName, joinedAt }]
}
groups/{groupId}/expenses/{expenseId} = {
  payer, amount, mint, memo, category,
  splits: [{ wallet, share }],   // shares sum to amount
  createdAt, editedAt
}
groups/{groupId}/settlements/{settlementId} = {
  from, to, amount, mint, txSig, confirmedAt
}
```

**Work items:**
- [ ] Group CRUD UI (`/groups`, `/groups/[id]`, invite-link + QR).
- [ ] Expense entry modal: payer, amount, participants, split method (equal / exact / shares / %).
- [ ] Balance computation + simplified settlement graph (minimize # of transfers).
- [ ] Settle-up flow: pick debt → sign SPL transfer → write `txSig` back.
- [ ] Activity feed (expenses + settlements, chronological).
- [ ] Edit / delete expense (only if no settlements reference it).
- [ ] Empty-state + onboarding copy.

**Exit criterion:** Two real wallets in a group, add 3 expenses with different splits, settle all debts on devnet, verify on-chain tx sigs resolve to correct transfers.

---

## Phase 2 — Fund Mode MVP (2–3 weeks after Phase 1)

**Goal:** A group can pool USDC into a Squads multisig and approve proposal-based spending.

**Work items:**
- [ ] "Fund" concept alongside Group in data model (or as a group flag).
- [ ] Create fund → spawn Squads multisig, register members as signers, set threshold.
- [ ] Contribute flow (SPL transfer → multisig vault).
- [ ] Proposal creation modal (recipient, amount, memo, optional receipt-hash).
- [ ] Approval UI (sign on proposal until threshold hit; auto-execute).
- [ ] Close fund: remaining balance → proportional refund to contributors.
- [ ] Treasury dashboard (balance, contributions-by-member, proposal history).

**Exit criterion:** 3 wallets create a fund, each contributes, propose + approve a withdrawal, receive funds at destination wallet. All on devnet with verified tx sigs.

---

## Phase 3 — Polish + real-world launch (1–2 weeks)

- [ ] Mainnet-beta switch (env-flag RPC + mints).
- [ ] Real stablecoin picker UI (curated: USDC, USDT, PYUSD + "paste mint" option).
- [ ] Mobile polish (QR scanning, wallet-deep-links).
- [ ] Share-card generator for expenses ("I just settled $42 with Sarthi on FundWise").
- [ ] Basic analytics (Vercel Analytics → track activation + settlement ratio).
- [ ] Public landing copy, docs, launch post.

**Exit criterion:** Ready to post to one community (Solana-Twitter or a friend group) and collect feedback.

---

## Phase 4 — Post-launch, user-driven

Prioritized after real user feedback. Parking-lot candidates:

- Recurring contributions / auto-split (rent, subscriptions).
- CSV / tax export.
- Push notifications (web-push or Telegram bot).
- Native mobile (Solana Mobile Stack / Expo).
- Custom Anchor vault program (replace Squads if UX demands it).
- **Fund Mode treasury yield** — idle stablecoin balance in a Fund Mode treasury could be parked in a lending protocol (Kamino, MarginFi, Solend) for passive yield, split among contributors on close. Owner flagged as "nice-to-have, not MVP." Decide after Phase 2 ships and we see real balances and hold-times.
- Group discovery / public groups.
- ZK-compressed state (if cost becomes a real problem).
- Fiat on/off-ramp (Coinbase Onramp or similar).

---

## Skills / tools reserved for implementation

- `solana-dev` skill — when writing Anchor programs (Phase 3/4 custom vault, if needed).
- `review-and-iterate` skill — before each phase exit.
- `frontend-design-guidelines` / `brand-design` — during Phase 0 rebrand + Phase 3 polish.
- `deploy-to-mainnet` — at Phase 3 transition.
- `roast-my-product` / `product-review` — right before launch.
