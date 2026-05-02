# FundWise - Status

**Snapshot date:** 2026-04-30
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
- Expenses may later be entered in other Source Currencies, but they must convert into a stored USD/USDC ledger value using an Exchange Rate Snapshot before Balance and Settlement math runs.
- Receipt-photo upload belongs in the product plan as Expense Proof, stored off-chain as Expense metadata.
- `LI.FI` is now the highest-priority sponsor support layer after Split Mode hardening. The intended user-facing language is `Add funds` or `Top up to settle`, not bridge jargon.
- **Zerion** remains a later CLI/analysis layer, not a replacement for Solana wallet connect.
- The assistant surface should be called **FundWise Agent**. Telegram bot and Telegram mini app are channels for it, not the product name.
- **Fundy** is the name of the hosted Telegram bot that runs the FundWise Agent. Users authenticate by linking their Telegram account to their FundWise wallet, then interact with Groups, Balances, Expenses, and Settlements from Telegram. Fundy handles read-only and draft-safe actions; money movement still requires wallet confirmation in the app.
- The **Agent Skill Endpoint** (`/skill.md`) is a public URL on the production host (`https://fundwise.kairen.xyz/skill.md`) that returns a detailed machine-readable markdown document so any autonomous agent can curl it, discover FundWise capabilities, and integrate through Scoped Agent Access.
- Fund Mode is still incomplete. Treasury initialization and Contributions exist, but Proposal flows are not yet ready to be presented as fully shipped product behavior.

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
- Plain `/groups` zero-state Group creation flow with Split Mode preselected and Fund Mode shown as invite-only beta inside create
- Invite link, copy-link, native share, and QR join flow for Groups, plus QR scanning on `/groups`
- Shareable Settlement Request Links that deep-link back into the Group and resolve debtor-to-creditor amounts from the live simplified settlement graph
- Global profile display-name editing with reuse across Groups
- Final empty-state and copy polish across Group screens
- Responsive pass across landing, Group list, Group detail, Receipt, and modal surfaces
- Consumer landing rewrite with product-first messaging, tighter CTAs, and consistent iconography
- Group detail screen refactored into focused `components/group-dashboard/*` modules plus a dedicated `hooks/use-group-dashboard.ts` data/actions hook
- Fund Mode vertical slice with invite-only creation support, funding-goal capture, approval-threshold capture, Treasury initialization, Contribution history, and on-chain Treasury balance display
- LI.FI groundwork with client-only SDK initialization, injected EVM wallet source plus Solana destination routing, and mainnet-aware bridge UI
- Stablecoin transfer preflight for Settlements and Contributions: balance checks before wallet prompt, explicit SOL-for-gas guidance, and one-time token-account creation messaging
- Group Treasury persistence stores both `multisig_address` and `treasury_address`
- Wallet-signed session cookies for protected FundWise actions and browser-session verification
- Authenticated server-side ledger mutations for Groups, Members, Expenses, Settlements, Contributions, profile updates, and Treasury persistence
- Session-aware Group and Receipt reads so browser clients no longer read private ledger rows directly from public Supabase queries
- RPC verification for Settlement and Contribution receipts before Supabase persistence, including duplicate `tx_sig` rejection

---

## Frontend readiness today

- The core web app flows exist and build successfully:
  landing, Group list, Group detail, Expense dialog, Settlement flow, and Receipt
- `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` now pass again. The repo no longer needs to hide TypeScript or ESLint failures during build.
- The responsive cleanup pass is in place across the main consumer surfaces
- **In progress (session decisions, April 2026):**
  - **Context-aware header:** landing section nav (Modes / How it works / Features) on `/` only; interior routes get an app-style header without that marketing nav.
  - **Landing hero:** (shipped) secondary CTA points to `/#how` with copy “See how it works”; primary remains “Start splitting” → `/groups`.
  - **Wallet-first CTAs:** shipped. Landing and `/groups` now open the real wallet connect flow instead of acting like dead links, and the disconnected `/groups` entry keeps the primary connect action above the fold on mobile.
  - **Post-connect flow:** shipped for plain `/groups`, invite-linked Group entry, Settlement Request Links, and Receipt recovery. Wallet connect restores the Group or Receipt context first, then the app asks for the minimum next step: verify wallet, join Group, or settle.
  - **Mode choice:** locked. Group creation defaults to Split Mode, while Fund Mode stays visible as an invite-only beta inside create. There is no global app-wide Split/Fund switch.
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
- LI.FI top-up / add-funds polish for EVM-first users:
  tighten copy, handoff, and post-bridge return into the normal Settlement flow
- Remove unused `group-showcase-section` after owner confirmation

## Foundation-first delivery order

1. Finish backend trust hardening and devnet UX hardening for Split Mode.
2. Heavily test the core web product on devnet:
   create, invite, join, Expense, Balance, Settlement, Receipt, Treasury init, and Contribution.
3. Finish the LI.FI support layer for EVM-first users:
   `Add funds` / `Top up to settle`, route execution, and clean return into the same Group Settlement flow.
4. Add Zerion and Telegram support layers only after the shared wallet-bound engine is stable:
   wallet analysis, reminders, FundWise Agent, **Fundy** (hosted Telegram bot with wallet linking and read-only/draft-safe Group interactions), and later scoped agent access.
5. Add the Agent Skill Endpoint (`/skill.md`) and Scoped Agent Access API after the backend is stable:
   public discovery document, scoped agent capability grants, and authenticated agent-to-FundWise interactions.
6. Add the missing Supabase data model for later Fund Mode and channel expansion:
   Telegram-to-wallet links, Telegram chat–Group links, short-lived link codes, draft expenses, agent-access grants, Expense Proof attachments, Proposal comments, Proposal proof attachments / external links, Proposal edit history, and later scoped agent-access records.
7. Return to Fund Mode proposals only after the Split Mode plus LI.FI story is coherent under devnet rehearsal.
8. Move to mainnet-beta only after the web app and shared backend are stable under devnet rehearsal.

---

## Product decisions locked on 2026-04-27

- Split Mode is the primary MVP path for the hackathon demo.
- The Group page owns the full flow:
  Group -> Expense -> Balance -> Settlement -> Receipt
- Members join by invite link or QR after connecting a wallet.
- Wallet connect should restore the exact intent the user came for instead of dropping them into a generic screen.
- Plain `/groups` with no existing Groups should open Group creation immediately after connect.
- Plain `/groups` with existing Groups should stay on the Group list after connect.
- Group creation defaults to Split Mode; the public create flow keeps Fund Mode invite-only instead of broadly available, and there is no global app-wide toggle.
- Join is invite-based and does not require creator approval in the MVP.
- Invite links restore the exact Group context and present an explicit `Join {GroupName}` action after connect; they do not silently join on wallet connect.
- Member identity is wallet-native with one global profile display name reused across Groups.
- Expenses are off-chain records; Settlements are on-chain USDC transfers.
- Any Member can log an Expense, and the payer can be any Member in the Group.
- Only the Expense creator can edit or delete it.
- The Activity Feed is the primary in-Group timeline surface; no Group-wide chat is planned for the MVP, though Fund Mode may later add Proposal-scoped comments and proof attachments.
- Only Members with a negative Balance see the Settle action.
- Settlements resolve against the debtor's current net Balance, not a stale linked amount.
- The primary settlement action is exact-amount settlement in one go.
- Settlement Request Links should reopen the live settlement-ready state with the current amount and ledger context after connect, but they must never auto-send the transaction.
- Each suggested edge in the simplified settlement graph maps to one debtor-to-creditor transfer.
- Devnet is the active execution environment for now; mainnet-beta comes after devnet hardening and rehearsal evidence.
- USDC is the only stablecoin in the MVP.
- Multi-currency Expense entry is allowed as a planned feature only if every Expense stores the Source Currency, original amount, converted USD/USDC ledger amount, and Exchange Rate Snapshot used at create or edit time.
- Historical Balances should not float with live exchange-rate changes. Live exchange values are for quoting at entry/edit time, not for silently repricing old Expenses.
- Expense Proof should support one lightweight receipt photo / PDF upload or proof link per Expense.
- Public-client Supabase ledger writes are dev-only scaffolding and cannot ship to mainnet-beta.
- LI.FI is the primary sponsor support layer after Split Mode hardening. It should be presented as `Add funds` / `Top up to settle`, not as a user-managed bridge workflow.
- LI.FI still tops up the debtor's Solana wallet rather than paying the creditor directly across chains.
- Zerion CLI is an active sponsor track for wallet analysis, guidance, and agent-style flows around the core product.
- Future expansion should keep one shared engine across surfaces: web first, then FundWise Agent, Telegram, wallet-mini-app, and native-mobile clients on top of the same wallet-bound backend.
- The FundWise Agent name should cover Telegram bot / mini app, scoped agent access, reminders, draft Expense creation, proof upload, and wallet-aware suggestions.
- Fundy is the hosted Telegram bot that runs the FundWise Agent. It is not a separate product; it is a distribution surface for the same wallet-bound engine.
- The Agent Skill Endpoint (`/skill.md`) is a public machine-readable discovery document for autonomous agents. It does not require auth and does not expose private data.
- Scoped Agent Access is the permission model for autonomous agents: capabilities tied to Member wallet, Group, and action type, not broad permanent API keys.
- Telegram scope should stay read-only and draft-safe plus comments/history. **Proposal approve/reject** may run from Fundy when those actions are database-only; **on-chain** Settlement, Contribution, and Proposal execution remain app-and-wallet confirmed (deep-link back; reuse **Settlement Request Links** for settle intents).
- Telegram identity should stay simple: one Telegram account links to one active wallet at a time, with an explicit relink flow later if needed.
- Telegram chat mapping should stay simple: one Telegram chat maps to one FundWise Group at a time, with any group-switching flow deferred.
- Telegram bot attachment may be initiated by any Member, but each person must authenticate privately in DM before the bot acts for them in the shared chat.
- The next delivery sequence is locked:
  backend trust hardening -> on-chain / devnet hardening -> LI.FI support -> Zerion / Telegram support -> isolated audits -> full rewiring -> end-to-end devnet testing

### UX / frontend (locked with CONTEXT.md, April 2026)

- Landing marketing anchors belong on `/` only; do not repeat that section nav on Group routes.
- Zerion track = **CLI / analysis**, not an in-app “Zerion wallet connect” replacement.
- Optional Phantom Connect is **additive** to wallet-adapter, with Portal configuration supplied by the owner.

## Product decisions locked on 2026-04-30 (Fundy + Agent Skill grill)

- **Production web host for agent discovery:** `https://fundwise.kairen.xyz` — Agent Skill at **`/skill.md`** (root).
- **Fundy hosting:** separate **Railway** service; **monorepo** path **`services/fundy/`**; Telegram library **`grammy`**.
- **Fundy ↔ FundWise data path:** HTTP **API routes only** (same surface as browsers/agents), with **`FUNDWISE_SERVICE_API_KEY`** + **`X-Fundy-Wallet`** for bot calls; extend routes for Scoped Agent Access (user tokens from **`/profile/agents`** + optional wallet-signed agent auth).
- **Telegram ↔ wallet linking:** **Option A** — short-lived codes from the authenticated web app, pasted as `/link FW-…` in DM.
- **Evolution:** command-based v1 → LLM agent (e.g. **OpenRouter**) as end state; Zerion **`/analyze`**, **`/readiness`**, **`/verify`** in v1.
- **Zerion CLI auth for Fundy:** prefer free **`ZERION_API_KEY`** initially; optional **x402** on Solana later.
- **Money movement from Telegram:** deep-link to web app; **Settlement** links must reuse existing **Settlement Request Link** behavior.

---

## Still pending for the primary MVP

- Keep the devnet quality gates green:
  `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`
- Manual breakpoint QA and sign-off across landing, Group list, Group detail, Receipt, join flow, and modal surfaces
- Product/design pass for multi-currency Expense entry:
  Source Currency selector, current exchange-rate quote, visible converted USD/USDC amount, stored Exchange Rate Snapshot, and edit behavior
- Product/design pass for Expense Proof upload:
  receipt photo / PDF upload, preview, storage limits, and access rules
- Devnet settlement and Contribution rehearsal on real wallets after the new preflight checks:
  verify insufficient-USDC, insufficient-SOL, and recipient / Treasury token-account creation messaging against actual wallet prompts
- End-to-end devnet rehearsal of the protected write and protected read flow with real wallet signatures and receipts
- Later mainnet checklist work:
  supported mainnet USDC mint wiring, production RPC choice, and final mainnet-beta readiness review

## Likely Supabase / DB follow-up

- Tighten the production schema and migrations around Fund Mode before mainnet-beta:
  Proposal comments, Proposal proof attachments / links, Proposal edit-history records, and execution-state metadata.
- Add Telegram identity-link tables with a one-Telegram-account-to-one-active-wallet rule, plus **telegram chat ↔ group**, **short-lived link codes**, and **`draft_expenses`** for Telegram/agent drafts.
- Add scoped agent-access records instead of broad permanent API keys.
- Add agent-access grant tables for autonomous agent capabilities: scoped to Member wallet, Group, and action type, with expiration and revocation support; support **user-generated tokens** from `/profile/agents` (rotate/delete/renew) and optional **wallet-signed** agent auth.
- Keep all of that behind the same server-side wallet-bound authorization model rather than exposing new public-client mutation paths.

---

## Secondary work kept out of the main path

- **Fundy**: the hosted Telegram bot for the FundWise Agent, **command-first v1** on **Railway** (`grammy`), code in **`services/fundy/`** (monorepo). Calls FundWise **HTTP APIs** with **`FUNDWISE_SERVICE_API_KEY` + `X-Fundy-Wallet`** (not direct Supabase from the bot). Telegram–wallet linking uses **web-generated short codes** in DM. Zerion via **`/analyze`**, **`/readiness`**, **`/verify`** (Zerion CLI; start with **`ZERION_API_KEY`**, optional x402 later). End goal: LLM agent (e.g. OpenRouter) on same tools. See ADR-0018 and CONTEXT.md.
- **Agent Skill Endpoint** (`/skill.md`): public markdown at **`https://fundwise.kairen.xyz/skill.md`** — what to call, what not to call, auth, limits, errors. Does not require auth to fetch; does not expose private Member data. See ADR-0018.
- **Scoped Agent Access**: the permission model for autonomous agents. Agents get scoped capabilities tied to Member wallet, Group, and action type — not broad permanent API keys.
- FundWise Agent for reminders, draft Expenses, proof upload, wallet analysis, and scoped assistant-driven FundWise actions
- Wallet-embedded mini dapp distribution
- Native mobile app
- Long-range stablecoin-only UX:
  gas / fee abstraction, automatic bridging and top-up paths, and easier web2 onboarding / offboarding into stablecoin balances
- Long-range fiat bridge research:
  evaluate providers such as Bridge for virtual accounts, on/off ramps, wallets, and cards; treat Altitude as inspiration for stablecoin account UX rather than the first direct consumer integration target
- AI bill parsing beyond basic receipt-photo upload, or natural-language expense entry beyond draft-safe FundWise Agent flows
- **FundWise-native** email/password or social identity as the primary account system (optional Phantom Connect for wallet onboarding is a separate, additive path; see ADR-0014)
- Gas abstraction / gasless settlement
- Multi-stablecoin or multi-chain primary settlement

---

## Fund Mode status

Fund Mode remains a real product mode, but it is no longer part of the devnet-ready definition for the hackathon story. The first requirement is a polished Split Mode web app, then a coherent LI.FI top-up path, then later support layers.

**Already present:**

- Public Group creation keeps Fund Mode invite-only; internal testing can be re-enabled by listing wallets in `FUNDWISE_FUND_MODE_INVITE_WALLETS`
- Treasury initialization exists
- Contribution history and on-chain Treasury balance are surfaced

**Still pending:**

- Proposal creation, approval, and execution UI
- Reimbursement-first Proposal rules: Member files reimbursement request, Treasury reimburses Member wallet only, external vendor payouts later
- Proposal approval guard: proposer cannot approve their own reimbursement Proposal
- Proposal discussion scope: allow comments and lightweight proof attachments on a Proposal later, but do not expand this into full Group chat during the MVP
- Proposal proof model: support one lightweight uploaded file plus an optional external link
- Proposal edit rule: editable only before the first outside approval, with visible edit history
- Proposal review actions: support both approve and reject, with rejection visible in Proposal discussion
- Proposal rejection rule: once rejected, the Proposal is closed and any retry must be a new Proposal
- Proposal execution rule: meeting the threshold unlocks a separate explicit execute step instead of auto-payout
- Proposal execution actor: once approved, any Member may execute the reimbursement
- Clear signer-management rules after Treasury initialization
- Fund Mode treasury policy follow-up: keep MVP spending strict and proposal-first; revisit optional Squads roles / spending limits later for trusted low-value trip spending
- One-click LI.FI into Treasury Contribution flow

---

## Product roast — 2026-04-30

Full roast in `review.md`. Weighted score: **51/110** (needs significant work).

**Top 5 issues:**
1. Target user too narrow (wallet + USDC + SOL + crypto-literate friends)
2. Entire app behind wallet gate — no demo, no trial
3. 18 ADRs, zero tests, zero real users
4. Documentation-to-product ratio inverted
5. No retention — episodic loop, no notifications

**Actions taken:**
- Added interactive demo at `/demo` (5-step walkthrough: Group → Expenses → Balances → Settle → Receipt)
- Added 32 unit tests for `expense-engine.ts` (splits, balances, settlement graph, formatting)
- Added "Try demo" CTA on landing page hero
- Created GitHub issues #4–#9 for all remaining fixes

**Remaining issues (from roast):**
- #6 Settlement preview before wallet sign ✅ **SHIPPED**
- #7 Archive future-planning docs ✅ **SHIPPED**
- #8 Landing page tightening ✅ **SHIPPED**
- #9 Post-settlement notifications ✅ **SHIPPED**

**Additional actions taken (session 2):**
- Added `SettlementPreviewDialog` component — shows amount, recipient, fee, and steps before wallet sign
- All settlement buttons (hero card, balances list, request link) now route through preview dialog
- Post-settlement success toast with creditor name and "View your receipt →"
- Activity Feed header shows expense/settlement count badge
- Hero headline rewritten: "Splitwise, but you actually get paid."
- CTA section rewritten: "Stop chasing. Start settling."
- Archival of ADR-0018 (Agent Skill + Fundy) and ADR-0014 (Phantom Connect) to `docs/archive/`
- Landing page hero badge updated to mention Solana + USDC settlement
- Dependabot alert acknowledged: 10 transitive vulnerabilities, all from `@solana/*` wallet adapter deps. None exploitable in client-side Next.js app.

---

## Resume point for the next session

1. Harden devnet Settlement and Contribution UX around insufficient funds, SOL-for-gas guidance, and recipient / Treasury token-account creation messaging.
2. Finish manual breakpoint QA on join, Receipt, wallet-verification, and Group dashboard routes.
3. Turn the LI.FI top-up flow into a user-facing `Add funds` / `Top up to settle` path for EVM-first users.
4. Run the first full end-to-end devnet rehearsal across create, invite, join, Expense, Settlement, Receipt, Treasury init, and Contribution.
5. Return to Zerion / Telegram support first, then Fund Mode proposals only after the Split Mode plus LI.FI path is polished.
6. Close GitHub issues #4–#9 on the repo after verifying all fixes.

## Planned, not yet built

- **Expense Dispute Handling** (ADR-0019): Members flag expenses, disputed expenses excluded from balance math, Group consensus vote resolves. Post-hackathon. Below Fund Mode proposals, above Telegram bot.
- **Fund Mode Proposals**: creation, approval, execution UI still pending.
- **Fundy**: hosted Telegram bot for FundWise Agent (archived in `docs/archive/`).
- **Agent Skill Endpoint**: public discovery at `/skill.md` (archived in `docs/archive/`).
- **Scoped Agent Access**: permission model for autonomous agents (archived in `docs/archive/`).

---

## Ground rules

- Work only inside `/Users/sarthiborkar/Build/FundWise`.
- If an external input is required (RPC URL, API key, mint address, contract address), ask the owner instead of guessing.
