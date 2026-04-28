# FundWise - Status

**Snapshot date:** 2026-04-28
**Phase:** Split Mode MVP hardening on Solana devnet
**Hackathon:** Colosseum Frontier (April 6 - May 11, 2026)

---

## TL;DR

FundWise is still a two-mode product:

1. Split Mode: track shared expenses in a Group, compute who owes whom, and settle in USDC on Solana.
2. Fund Mode: pool USDC into a shared Treasury and spend from it via Proposals.

The product direction is now sharper:

- The primary hackathon demo is Split Mode, not Fund Mode.
- The web app is the source of truth for the MVP.
- Core UI for landing, Groups, Group detail, and receipts is in place; **targeted frontend polish and refactors** (navigation, CTAs, component extraction) continue in parallel with backend trust work.
- Solana devnet is the active execution environment for now. Mainnet-beta remains a later target after devnet hardening and rehearsal.
- **Identity:** Solana pubkey via `@solana/wallet-adapter-*` is the default. Optional **Phantom Connect** may be added alongside it (Portal App ID required); see ADR-0014 and [CONTEXT.md](./CONTEXT.md).
- USDC is the only settlement asset in the MVP.
- LI.FI and Zerion CLI are active sponsor tracks, but neither should displace the main Split Mode user path. **Zerion** is CLI/analysis, not a replacement for Solana wallet connect.

---

## What's in the repo today

**Stack:**

- Next.js 15 (App Router) + React 19 + Tailwind v4 + Radix/shadcn UI
- `@solana/wallet-adapter-*` for wallet-native auth
- `@solana/web3.js`, `@solana/spl-token`
- Supabase (`@supabase/supabase-js`) with schema in `supabase/schema.sql`
- Squads multisig (`@sqds/multisig`) reserved for Fund Mode Treasury flows

**Already shipped:**

- Firebase removed; Supabase is the off-chain data layer
- Normalized schema for `groups`, `members`, `expenses`, `expense_splits`, `settlements`, `contributions`, `proposals`, and `proposal_approvals`
- Split Mode data and logic modules for Group CRUD, Expense storage, balance math, simplified settlement graph, and settlement persistence
- `/groups` and `/groups/[id]` routes
- Settlement receipt route at `/groups/[id]/settlements/[settlementId]`
- Creator-owned Expense edit and delete flow with later-Settlement safety guard plus working equal, exact, percentage, and shares split inputs
- Plain `/groups` zero-state Group creation flow with Split Mode preselected and Fund Mode available inside create
- Invite link, copy-link, native share, and QR join flow for Groups, plus QR scanning on `/groups`
- Shareable Settlement Request Links that deep-link back into the Group and resolve debtor-to-creditor amounts from the live simplified settlement graph
- Global profile display-name editing with reuse across Groups
- Final empty-state and copy polish across Group screens
- Responsive pass across landing, Group list, Group detail, Receipt, and modal surfaces
- Consumer landing rewrite with product-first messaging, tighter CTAs, and consistent iconography
- Group detail screen refactored into focused `components/group-dashboard/*` modules plus a dedicated `hooks/use-group-dashboard.ts` data/actions hook
- Fund Mode vertical slice with Split Mode or Fund Mode Group creation, funding-goal capture, approval-threshold capture, Treasury initialization, Contribution history, and on-chain Treasury balance display
- LI.FI groundwork with client-only SDK initialization, injected EVM wallet source plus Solana destination routing, and mainnet-aware bridge UI
- Group Treasury persistence stores both `multisig_address` and `treasury_address`
- Wallet-signed session cookies for protected FundWise actions and browser-session verification
- Authenticated server-side ledger mutations for Groups, Members, Expenses, Settlements, Contributions, profile updates, and Treasury persistence
- Session-aware Group and Receipt reads so browser clients no longer read private ledger rows directly from public Supabase queries
- RPC verification for Settlement and Contribution receipts before Supabase persistence, including duplicate `tx_sig` rejection

---

## Frontend readiness today

- The core web app flows exist and build successfully:
  landing, Group list, Group detail, Expense dialog, Settlement flow, and Receipt
- The responsive cleanup pass is in place across the main consumer surfaces
- **In progress (session decisions, April 2026):**
  - **Context-aware header:** landing section nav (Modes / How it works / Features) on `/` only; interior routes get an app-style header without that marketing nav.
  - **Landing hero:** (shipped) secondary CTA points to `/#how` with copy “See how it works”; primary remains “Start splitting” → `/groups`.
  - **Wallet-first CTAs:** shipped. Landing and `/groups` now open the real wallet connect flow instead of acting like dead links, and the disconnected `/groups` entry keeps the primary connect action above the fold on mobile.
  - **Post-connect flow:** shipped for plain `/groups`, invite-linked Group entry, Settlement Request Links, and Receipt recovery. Wallet connect restores the Group or Receipt context first, then the app asks for the minimum next step: verify wallet, join Group, or settle.
  - **Mode choice:** locked. Group creation defaults to Split Mode, with Fund Mode selectable per Group inside create. There is no global app-wide Split/Fund switch.
  - **Invite and settlement deep links:** shipped. Invite links restore Group context and show an explicit `Join {GroupName}` action after connect and wallet verification; Settlement Request Links open the live settlement-ready state with current amount and ledger context, but never auto-send.
  - **Protected reads:** shipped. Connected wallets must verify the browser session before FundWise reveals private Group ledger state or Receipts.
  - **Frontend QA:** disconnected `/groups` and Group-not-found recovery states are manually checked at `375`, `768`, and `1280`; remaining frontend QA is on the extracted Split Mode, Fund Mode, sidebar, dialog, join, and Receipt surfaces.
  - **Cleanup:** remove unused `group-showcase-section` (dead code).
  - **Phantom Connect:** optional SDK integration after owner supplies Phantom Portal **App ID** and allowlisted callback URL; must not break existing adapter-based Settlements.
- Remaining UI risk is the deeper Group dashboard interaction review plus join and Receipt edge cases. Large file splits are for maintainability, not cosmetic rewrites.

## Next active work

- Devnet settlement UX hardening:
  insufficient-USDC states, insufficient-SOL-for-gas states, and clearer ATA-creation messaging during Settlement and Contribution flows
- Manual breakpoint QA and sign-off across landing, Group list, Group detail, join, modal, and Receipt flows
- Remove unused `group-showcase-section` after owner confirmation

---

## Product decisions locked on 2026-04-27

- Split Mode is the primary MVP path for the hackathon demo.
- The Group page owns the full flow:
  Group -> Expense -> Balance -> Settlement -> Receipt
- Members join by invite link or QR after connecting a wallet.
- Wallet connect should restore the exact intent the user came for instead of dropping them into a generic screen.
- Plain `/groups` with no existing Groups should open Group creation immediately after connect.
- Plain `/groups` with existing Groups should stay on the Group list after connect.
- Group creation defaults to Split Mode; Fund Mode is selectable per Group inside create, not via a global app-wide toggle.
- Join is invite-based and does not require creator approval in the MVP.
- Invite links restore the exact Group context and present an explicit `Join {GroupName}` action after connect; they do not silently join on wallet connect.
- Member identity is wallet-native with one global profile display name reused across Groups.
- Expenses are off-chain records; Settlements are on-chain USDC transfers.
- Any Member can log an Expense, and the payer can be any Member in the Group.
- Only the Expense creator can edit or delete it.
- The Activity Feed is the only in-Group timeline surface for now; there is no chat.
- Only Members with a negative Balance see the Settle action.
- Settlements resolve against the debtor's current net Balance, not a stale linked amount.
- The primary settlement action is exact-amount settlement in one go.
- Settlement Request Links should reopen the live settlement-ready state with the current amount and ledger context after connect, but they must never auto-send the transaction.
- Each suggested edge in the simplified settlement graph maps to one debtor-to-creditor transfer.
- Devnet is the active execution environment for now; mainnet-beta comes after devnet hardening and rehearsal evidence.
- USDC is the only stablecoin in the MVP.
- Public-client Supabase ledger writes are dev-only scaffolding and cannot ship to mainnet-beta.
- LI.FI is a secondary top-up path into the debtor's Solana wallet, not a direct cross-chain creditor settlement path.
- Zerion CLI is an active sponsor track for wallet analysis, guidance, and agent-style flows around the core product.
- The next delivery sequence is locked:
  backend trust hardening -> on-chain / devnet hardening -> LI.FI and Zerion support -> isolated audits -> full rewiring -> end-to-end devnet testing

### UX / frontend (locked with CONTEXT.md, April 2026)

- Landing marketing anchors belong on `/` only; do not repeat that section nav on Group routes.
- Zerion track = **CLI / analysis**, not an in-app “Zerion wallet connect” replacement.
- Optional Phantom Connect is **additive** to wallet-adapter, with Portal configuration supplied by the owner.

---

## Still pending for the primary MVP

- Manual breakpoint QA and sign-off across landing, Group list, Group detail, Receipt, join flow, and modal surfaces
- Devnet settlement and Contribution UX hardening with clear insufficient-USDC and insufficient-SOL states plus explicit token-account creation messaging
- End-to-end devnet rehearsal of the protected write and protected read flow with real wallet signatures and receipts
- Later mainnet checklist work:
  supported mainnet USDC mint wiring, production RPC choice, and final mainnet-beta readiness review

---

## Secondary work kept out of the main path

- LI.FI recovery/top-up branch when a debtor lacks USDC on Solana
- Telegram bot and Telegram mini app
- Wallet-embedded mini dapp distribution
- AI bill parsing or natural-language expense entry
- **FundWise-native** email/password or social identity as the primary account system (optional Phantom Connect for wallet onboarding is a separate, additive path; see ADR-0014)
- Gas abstraction / gasless settlement
- Multi-stablecoin or multi-chain primary settlement

---

## Fund Mode status

Fund Mode remains a real product mode, but it is no longer the primary demo path before the Split Mode MVP is polished.

**Already present:**

- Group creation supports Fund Mode
- Treasury initialization exists
- Contribution history and on-chain Treasury balance are surfaced

**Still pending:**

- Proposal creation, approval, and execution UI
- Clear signer-management rules after Treasury initialization
- One-click LI.FI into Treasury Contribution flow

---

## Resume point for the next session

1. Harden devnet Settlement and Contribution UX around insufficient funds, SOL-for-gas guidance, and recipient / Treasury token-account creation messaging.
2. Finish manual breakpoint QA on join, Receipt, wallet-verification, and Group dashboard routes.
3. If `next dev` falls into missing `.next/server` chunk errors during browser QA again, clear `.next` and restart `pnpm dev` before debugging app code.
4. Keep LI.FI top-up and Zerion CLI support aligned to the core Split Mode path without bloating the main settlement UX.
5. Run the first full end-to-end devnet rehearsal across create, invite, join, Expense, Settlement, Receipt, Treasury init, and Contribution.
6. Return to Fund Mode proposals only after the Split Mode demo path is polished.

---

## Ground rules

- Work only inside `/Users/sarthiborkar/Build/FundWise`.
- If an external input is required (RPC URL, API key, mint address, contract address), ask the owner instead of guessing.
