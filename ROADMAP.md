# FundWise — Roadmap

Phased plan from pivot cleanup to Fund Mode launch. Each phase has a clear exit criterion before moving on. Timelines are compressed for the **Colosseum Frontier hackathon** (deadline: May 11, 2026).

See [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) for track-specific strategy.

---

## Phase 0 — Pivot cleanup (April 25–26) ✅

**Goal:** Strip all prediction-market / Kalshi / ZK / LP-yield code. Rebuild landing page around Splitwise-on-Solana narrative.

**Work items:**
- [x] Delete files listed in STATUS.md §Still needs cleanup.
- [x] Drop unused deps from `package.json` (Kalshi, Light Protocol, Privy, Abstract, permissionless).
- [x] Rewrite `README.md` for the new product.
- [x] Rewrite `app/page.tsx`, `components/hero-section.tsx`, `components/how-it-works-section.tsx` for Split Mode framing.
- [x] Rename "circles" → "groups" across UI + routes.
- [x] Update `components/header.tsx` nav (remove prediction links).
- [x] Verify `pnpm build` passes with zero references to removed modules.

**Exit criterion:** `pnpm build` green, landing page says "Splitwise on Solana," no prediction-market UI reachable.

---

## Phase 1 — Split Mode MVP (April 27 – May 4) ✅ Core complete

**Goal:** A user can create a group, add expenses, see balances, and settle on-chain with USDC. This is the core submission for the **Visa Frontier track**.

**Data model (off-chain, Supabase/Postgres):**
```
groups/{groupId} = {
  name, stablecoinMint, createdBy, createdAt, mode: "split",
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
- [x] Group CRUD UI (`/groups`, `/groups/[id]`, invite-link + QR).
- [x] Expense entry modal: payer, amount, participants, split method (equal / exact / shares / %).
- [x] Balance computation + simplified settlement graph (minimize # of transfers).
- [x] Settle-up flow: pick debt → sign SPL transfer → write `txSig` back.
- [x] Activity feed (expenses + settlements, chronological).
- [ ] Edit / delete expense (only if no settlements reference it).
- [~] Empty-state + onboarding copy (mostly done; minor polish left).
- [ ] Payment receipt view (tx signature, amounts, who paid whom).

**Hackathon-specific polish (Visa track):**
- [ ] PYUSD stablecoin support (PayPal stablecoin — Visa-relevant).
- [ ] Smooth one-click settlement UX (2 taps + wallet sign).
- [ ] Group total settled volume display.
- [ ] QuickNode RPC for production.

**Exit criterion:** Two real wallets in a group, add 3 expenses with different splits, settle all debts on devnet, verify on-chain tx sigs resolve to correct transfers.

---

## Phase 1.5 — LI.FI Integration (May 2–4) ▶ Next

**Goal:** Enable cross-chain stablecoin contributions for Fund Mode. This is the core submission for the **Build with LI.FI track**.

**Work items:**
- [ ] Install `@lifi/sdk` and configure integrator ID.
- [ ] Cross-chain contribution modal: detect user's tokens on other chains.
- [ ] LI.FI route discovery (`getQuote()`) and execution (`executeRoute()`).
- [ ] Support at least 2 chains (Ethereum + Solana, or Base + Solana).
- [ ] UI: "You have 50 USDC on Base. Bridge to Solana and contribute in one click."

**Exit criterion:** A user with USDC on Base can bridge to Solana and deposit into a Fund Mode treasury via LI.FI in a single click.

---

## Phase 2 — Fund Mode MVP (May 5–8)

**Goal:** A group can pool USDC into a Squads multisig and approve proposal-based spending.

**Work items:**
- [ ] "Fund" concept alongside Group in data model (or as a group flag `mode: "fund"`).
- [ ] Create fund → spawn Squads multisig, register members as signers, set threshold.
- [ ] Contribute flow (SPL transfer → multisig vault) + LI.FI cross-chain option.
- [ ] Proposal creation modal (recipient, amount, memo, optional receipt-hash).
- [ ] Approval UI (sign on proposal until threshold hit; auto-execute).
- [ ] Close fund: remaining balance → proportional refund to contributors.
- [ ] Treasury dashboard (balance, contributions-by-member, proposal history).

**Exit criterion:** 3 wallets create a fund, each contributes, propose + approve a withdrawal, receive funds at destination wallet. All on devnet with verified tx sigs.

---

## Phase 2.5 — Zerion Agent + Sponsor Integrations (May 7–9, if time)

**Goal:** Build an autonomous agent using Zerion CLI for the **Zerion track** + deepen sponsor integrations for the **Eitherway track**.

**Work items:**
- [ ] Install Zerion CLI (`npm install -g zerion-cli`).
- [ ] Build FundWise Agent: wallet monitoring + settlement suggestions.
- [ ] Agent uses `zerion-cli wallet analyze` to check member balances before settlement.
- [ ] Telegram bot or in-app notifications for treasury events.
- [ ] Solflare deep integration (wallet features, mobile).
- [ ] (Stretch) Kamino vault integration for idle treasury yield.
- [ ] Deploy on Eitherway platform.

**Exit criterion:** Agent runs autonomously, provides actionable insights, uses Zerion CLI for wallet data.

---

## Phase 3 — Polish + Submission (May 9–11)

**Goal:** Submit to all target tracks with polished demos.

**Work items:**
- [ ] Record demo videos (3-min each, one per track).
- [ ] Write submission copy for each track.
- [ ] Final end-to-end testing on devnet.
- [ ] Submit to Colosseum Frontier main track.
- [ ] Submit to LI.FI side track.
- [ ] Submit to Visa side track.
- [ ] Submit to Zerion side track (if agent ready).
- [ ] Deploy on Eitherway (if pursuing Track 5).
- [ ] Mobile polish (QR scanning, wallet-deep-links).

---

## Phase 4 — Post-hackathon (May 12+)

Post-hackathon development. Prioritized after Demo Day feedback.

**Immediate:**
- [ ] Mainnet-beta switch (env-flag RPC + mints).
- [ ] Real stablecoin picker UI (curated: USDC, USDT, PYUSD + "paste mint" option).
- [ ] Share-card generator for expenses.
- [ ] Basic analytics (Vercel Analytics → track activation + settlement ratio).

**Parking lot (user-driven):**
- Recurring contributions / auto-split (rent, subscriptions).
- CSV / tax export.
- Push notifications (web-push or Telegram bot).
- Native mobile (Solana Mobile Stack / Expo).
- Custom Anchor vault program (replace Squads if UX demands it).
- Fund Mode treasury yield (Kamino, MarginFi, Solend).
- Group discovery / public groups.
- ZK-compressed state (if cost becomes a real problem).
- Fiat on/off-ramp (Coinbase Onramp or similar).

---

## Skills / tools reserved for implementation

- `solana-dev` skill — when writing Anchor programs (Phase 4 custom vault, if needed).
- `review-and-iterate` skill — before each phase exit.
- `frontend-design-guidelines` / `brand-design` — during Phase 0 rebrand + Phase 3 polish.
- `deploy-to-mainnet` — at Phase 4 transition.
- `roast-my-product` / `product-review` — right before submission.
