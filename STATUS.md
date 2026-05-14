# FundWise - Status

**Snapshot date:** 2026-05-14 (production-ready push)
**Phase:** Dual-track delivery — Split Mode code-ready for tightly-invited mainnet rollout, Fund Mode devnet beta polished to checklist completion (Phase A + B). Operator-owned infra steps tracked in `docs/prod-secrets-runbook.md`.
**Hackathon:** Colosseum Frontier (April 6 - May 11, 2026) — submission complete
**Checklist branch:** ~50 commits on `checklist`, working tree clean, 123/123 tests passing
**Active issue index:** [issues.md](./issues.md)
**Execution checklists:** [Split Mode mainnet](./docs/split-mode-mainnet-checklist.md) · [Fund Mode beta](./docs/fund-mode-beta-checklist.md)
**Handoff:** Network strategy is locked: public app is mainnet only (Split Mode); Fund Mode stays devnet, invite-gated, hidden from public UI, used to test the monetization model with selected beta users coordinated in a Telegram group. Fundy ships alongside Split Mode mainnet from its separate repository. Yield routing via Meteora is planned but not in scope until Fund Mode is mainnet-stable. The two execution checklists own the phased work going forward.

---

## TL;DR

FundWise is still a two-mode product:

1. Split Mode: track shared expenses in a Group, compute who owes whom, and settle in USDC on Solana. **Public, mainnet target.**
2. Fund Mode: pool USDC into a shared Treasury and spend from it via Proposals. **Invite-only beta, devnet only, hidden from public UI.**

The product direction is now sharper:

- **Network strategy (locked 2026-05-11):** public production runs on Solana mainnet and exposes Split Mode only. Fund Mode is kept on devnet for invite-only beta testing, accessed via wallets listed in `FUNDWISE_FUND_MODE_INVITE_WALLETS`. Beta testers are coordinated in a private Telegram group. This keeps users from having to switch wallet networks and isolates real money from beta workflows. Fund Mode mainnet graduation is a separate decision after both the product and the monetization model are validated on devnet — see [docs/fund-mode-beta-checklist.md](./docs/fund-mode-beta-checklist.md).
- **Single deployment, dual-cluster awareness (Option A):** the same app reads both mainnet and devnet RPC URLs, picks per-Group cluster based on `Group.mode`, and shows a cluster badge in the header so the user always knows which network they're on.
- **Monetization beta on devnet:** the Fund Mode devnet beta is the controlled environment for testing the pricing model — creation fee acceptance, subscription willingness-to-pay surveys, free-tier wall friction — before any real billing flips on. See [docs/monetization.md](./docs/monetization.md) and `docs/fund-mode-beta-checklist.md` Phase C.
- **Fundy ships alongside Split Mode mainnet** from its separate repository, providing Telegram-based reminders, draft expenses, wallet-readiness, and the FundWise Agent surface. Money movement still wallet-confirmed in the web app.
- **Yield routing via Meteora** is the future Fund Mode revenue line beyond subscription, planned for after Fund Mode mainnet is stable. Not in beta scope.

- FundWise sits under the broader FundLabs umbrella: FundLabs builds the financial layer for groups, human or AI. FundWise is the shared-finance product, Fundy is the Telegram / personal-agent distribution product, and Receipt Endpoint is the planned agent-commerce audit-trail product.
- Keep public copy aligned with [docs/positioning.md](./docs/positioning.md): lead with Groups, shared Expenses, live Balances, settle-up links, and Receipts; keep crypto mechanics behind the user action until wallet or Settlement context requires them.
- The primary shipped proof is Split Mode, but Fund Mode is the hero product direction and the next one-month beta focus.
- The investor story should be ambitious, but the product-state boundary must stay strict: yield-bearing Treasuries, automatic settlement, any-chain settlement, Fundy execution, Scoped Agent Access, Receipt Endpoint, and gas abstraction are future or planned unless implemented end to end.
- The market is not empty. Crypto-native bill-splitting competitors already exist, so FundWise should position around verified USDC Settlement for real Groups, not "first crypto Splitwise."
- The web app is the source of truth for the MVP.
- Core UI for landing, Groups, Group detail, and receipts is in place; **targeted frontend polish and refactors** (navigation, CTAs, component extraction) continue in parallel with backend trust work.
- Solana devnet is the active execution environment for now. Mainnet-beta remains a later target after devnet hardening and rehearsal.
- **Identity:** Solana pubkey via `@solana/wallet-adapter-*` is the default. Optional **Phantom Connect** may be added alongside it (Portal App ID required); see ADR-0014 and [CONTEXT.md](./CONTEXT.md).
- USDC is the only settlement asset in the MVP.
- Source Currency entry is future-only for the current public demo. It must not ship as real behavior until each Expense stores the original amount, converted USD/USDC ledger value, and Exchange Rate Snapshot end to end.
- Expense Proof upload is future-only for the current public demo. It must not ship as real behavior until storage, preview, limits, and access rules are implemented.
- Split Mode stays free for launch, including normal USDC Settlements. Monetization belongs first to Fund Mode, Fundy premium, and later partner rails.
- `LI.FI` is now the highest-priority sponsor support layer after Split Mode hardening. It should appear inside the Settlement path as `Route funds for Settlement` when a Member's USDC is on another supported network, not as a standalone dashboard top-up task.
- **Zerion** remains a later CLI/analysis layer, not a replacement for Solana wallet connect.
- The assistant surface should be called **FundWise Agent**. Telegram bot and Telegram mini app are channels for it, not the product name.
- **Fundy** is the name of the hosted Telegram bot that runs the FundWise Agent. Users authenticate by linking their Telegram account to their FundWise wallet, then interact with Groups, Balances, Expenses, and Settlements from Telegram. Fundy handles read-only and draft-safe actions; money movement still requires wallet confirmation in the app.
- The **Agent Skill Endpoint** (`/skill.md`) is live as a public discovery document on the production host (`https://fundwise.fun/skill.md`). Public API reference markdown is also exposed at `https://fundwise.fun/api/docs`. Scoped Agent Access and agent-paid Settlements remain planned.
- The audience rollout is crypto-native Groups first, then agents, then non-crypto users through Visa/card, IBAN, and Altitude-style Solana banking rails after the core flow is reliable.
- Fund Mode is still incomplete but is now the active hero-product sprint. Treasury initialization and Contributions exist; Proposal flows, proposal proof/history, and integration support must ship before Fund Mode can be presented as complete product behavior.
- Settlement Request Links are the primary growth loop: a Member shares a live settle intent, the debtor opens the current Balance state, signs the exact USDC Settlement, and both sides get a Receipt.
- A scripted agent devnet rehearsal now exists at `scripts/devnet-agent-rehearsal.mjs`. The latest run created a Group, added Expenses from two wallets, joined the second wallet, settled, and produced a devnet explorer transaction URL. The rehearsal used a temporary SPL stablecoin mint because the public devnet faucet was rate-limited, so it proves the FundWise Settlement/Receipt machinery rather than final mainnet USDC readiness.
- Fundy still matters as a distribution surface, but it no longer blocks Fund Mode engineering. The next month should push Fund Mode to invite-only beta while Fundy and agent integrations are designed around the same API boundaries.
- Visa/card/IBAN rails remain partner-dependent future work. They can support a settle-to-spend story later, but they should not be claimed or built as core product until a concrete provider path exists.
- Mini-games and prediction-market-like mechanics are out of scope for FundWise and must stay out of the hackathon story.
- Canonical product-state and monetization references: [docs/shipped-vs-planned.md](./docs/shipped-vs-planned.md) and [docs/monetization.md](./docs/monetization.md).

---

## Branch Audit (2026-05-14)

The `checklist` branch went through a deep security + UI audit pass before the Split Mode mainnet cutover. Full findings live under [issues.md → Branch Audit Snapshot](./issues.md#branch-audit-snapshot-2026-05-14) and the four follow-up issues:

- **FW-053 (P0)** Critical fixes: expense `payer` field is not bound to the signed-in session (any member can credit an Expense to a different member's wallet), Settlement insert is non-atomic with its graph-match snapshot (TOCTOU race), and OFAC sanctions screening only fires at challenge issuance — a sanctioned wallet keeps its 12-hour session.
- **FW-054 (P1)** Rate limiting is in-process only (resets per edge isolate) and is not applied to money-moving routes. Move to a distributed counter and cover every POST/PATCH/DELETE mutation.
- **FW-055 (P1)** On-chain Settlement / Contribution / Proposal-execution verification matches expected deltas but doesn't reject extra side-transfers in the same signed transaction. Add a "no other token deltas" guard.
- **FW-056 (P2)** UI polish and dead-code cleanup: duplicate "Settlement reached Solana" recovery banner in Split Mode dashboard, `STABLECOIN_MINTS_DEVNET.USDT` is the mainnet mint, dead `WalletAdapterNetwork.Devnet` constant and `lib/anchor/group_manager.ts` IDL, brittle `FUNDWISE_FUND_MODE_INVITE_WALLETS` parsing, CSP still has `script-src 'unsafe-inline'`, parse-usdc-amount regex accepts a bare `.`.

**Smart-contract footprint:** there is no custom on-chain program in this branch — `programs/fundwise/` only contains a `.DS_Store`. The historical Rust source was deleted; the Anchor IDL at `lib/anchor/group_manager.ts` is orphaned. On-chain mechanics are SPL Token transfers (Split Mode + Fund Mode contributions) plus Squads multisig vault transactions (Fund Mode proposal create / review / execute), verified server-side via `lib/server/solana-transfer-verification.ts` and `lib/server/fundwise-mutations.ts`. No proprietary Solana program to audit.

**Test posture:** `pnpm test` → 7 files, 112 tests, all pass (1.21s). Coverage gaps to fill alongside the fixes: settlement TOCTOU race, ATA side-transfer rejection, proposal review/execute lifecycle, sanctioned-wallet rejection mid-session, distributed rate-limit behavior.

**Authentication review (no fix needed):** HMAC-signed cookies, Ed25519 wallet signatures, 5-minute challenge TTLs, 12-hour session TTLs, origin + cluster pinning on challenges, `__Host-` prefix in production. The session cookie itself does not re-pin origin or cluster — operationally minor, but worth knowing if `FUNDWISE_SESSION_SECRET` is ever shared across deployments.

**Mainnet readiness call:** Split Mode should not flip to mainnet until at least FW-053 (all three sub-items) and FW-055 are merged. FW-054 is a hardening item that can ship alongside or shortly after.

---

## Production-Ready Push (2026-05-14, same day)

Picked up immediately after the audit and executed the AFK fixes plus the Fund Mode beta polish round. Tests: **123/123 passing**. Working tree: clean.

**Audit blockers landed:**

- **FW-053.1** — `body.payer === session.wallet` is now enforced at POST and PATCH `/api/expenses`. No more silent attribution of an Expense to a different Member.
- **FW-053.2** — New Postgres function `record_settlement_locked` takes `for update` on the parent Group row and deduplicates by `tx_sig`. The TS mutation falls back to the previous two-step path if the migration hasn't been replayed yet on prod, so devnet rehearsals keep moving in the interim. **Operator action:** replay `supabase/migrations/20260514104435_add_record_settlement_with_lock.sql` against prod Supabase before flipping the public app to mainnet (steps in `docs/prod-secrets-runbook.md` §4).
- **FW-053.3** — `requireAuthenticatedWallet` now calls `assertWalletIsAllowed` on every protected request. A sanctioned wallet with a valid 12-hour session is blocked at the next call rather than living out its session.
- **FW-055** — `verifyAtaTransfer` rejects extra token-balance deltas in the same signed transaction. Settlement / Contribution / Proposal-execution can no longer carry a hidden side transfer.

**Fund Mode beta polish landed:**

- **FW-057** — Threshold suggestion + plain-English explanation at Treasury init. Helper at `lib/fund-mode-threshold.ts`.
- **FW-058** — Pre-Treasury SOL pre-flight (~0.02 SOL on devnet) surfaced on the dashboard before the wallet popup.
- **FW-059** — Squads explorer deep-link on the live Treasury card (`https://app.squads.so/squads/<pda>?cluster=devnet`).
- **FW-046** — Exit-refund suggestion helper. Picks the smaller of (Member's total contributions, pro-rata share of live Treasury, available balance), pre-fills the existing Proposal form. Lives at `lib/fund-mode-exit.ts` with full vitest coverage.

**Operator runbooks:**

- **`docs/prod-secrets-runbook.md`** — copy-paste-ready commands for session secret rotation, prod Supabase provisioning, RPC env wiring, migration replay, invite wallet management, pre-deploy smoke, and post-deploy verification.
- **`docs/monitoring-runbook.md`** — GlitchTip (open-source, MIT, Sentry-API-compatible) plus `@sentry/cloudflare` SDK enablement. Cloudflare-friendly path that sidesteps `@sentry/nextjs` ↔ `@cloudflare/next-on-pages` incompatibility. Three-step opt-in: `pnpm add @sentry/cloudflare`, set `SENTRY_DSN`, call `initMonitoring()` from the edge bootstrap.
- **`scripts/split-mode-stress.mjs`** (`pnpm split:stress`) — HTTP stress test for the audit guards. Covers malformed body, sanctioned wallet, challenge rate limit burst, expense payer binding, and concurrent settlement dedupe.

**Still HITL — operator owns the next moves:**

1. Run `pnpm split:stress` against the local dev server (then the deployed devnet URL) before scheduling the mainnet rehearsal.
2. Stand up the prod Supabase project per §2 of the prod secrets runbook, replay every migration, run `pnpm supabase:verify-rls`.
3. Paste Alchemy mainnet + Helius / public-node fallback RPCs into Cloudflare Pages prod env.
4. Generate and paste the prod `FUNDWISE_SESSION_SECRET` per §1.
5. Open a GlitchTip project (hosted free tier or self-host) and follow `docs/monitoring-runbook.md` to enable.
6. Schedule the mainnet rehearsal (Phase 4 of `docs/split-mode-mainnet-checklist.md`) with two funded wallets.

---

## What's in the repo today

**Stack:**

- Next.js 15 (App Router) + React 19 + Tailwind v4 + Radix/shadcn UI
- Cloudflare Pages deployment via `@cloudflare/next-on-pages` (`pnpm build:pages`, output `.vercel/output/static`)
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
- Public Story page added for the problem narrative, Settlement Request Link loop, and LI.FI cross-chain Settlement routing angle
- Group detail screen refactored into focused `components/group-dashboard/*` modules plus a dedicated `hooks/use-group-dashboard.ts` data/actions hook
- Fund Mode vertical slice with invite-only creation support, funding-goal capture, approval-threshold capture, Treasury initialization, Contribution history, and on-chain Treasury balance display
- LI.FI groundwork with client-only SDK initialization, injected EVM wallet source plus Solana destination routing, mainnet-aware bridge UI, and `pnpm lifi:readiness` route metadata checks
- Stablecoin transfer preflight for Settlements and Contributions: balance checks before wallet prompt, explicit SOL-for-gas guidance, and one-time token-account creation messaging
- Group Treasury persistence stores both `multisig_address` and `treasury_address`
- Wallet-signed session cookies for protected FundWise actions and browser-session verification
- Authenticated server-side ledger mutations for Groups, Members, Expenses, Settlements, Contributions, profile updates, and Treasury persistence
- Session-aware Group and Receipt reads so browser clients no longer read private ledger rows directly from public Supabase queries
- RPC verification for Settlement and Contribution receipts before Supabase persistence, including duplicate `tx_sig` rejection
- Compass research artifacts moved into [docs/research/](./docs/research/) with an index, and the useful product/architecture decisions were captured in ADR-0025 and ADR-0026.
- Fund Mode Treasury persistence verifies submitted Squads addresses before saving: valid public keys, confirmed Squads-owned Multisig account, decoded Squads Member list, authenticated creator as a Multisig Member, and vault index `0` PDA match.

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

The post-submission execution path is now split across two checklists, both indexed in [issues.md](./issues.md) as `FW-033` and up:

1. **Public mainnet launch of Split Mode** — see [docs/split-mode-mainnet-checklist.md](./docs/split-mode-mainnet-checklist.md). Phases: pre-flight code (cluster-aware mints, cluster badge, multi-RPC, footer + legal scaffold) → production environment setup → production env (separate Supabase project, prod RPC, Sentry) → mainnet rehearsal with real USDC → launch + comms.
2. **Fund Mode devnet beta with easy UX + monetization testing** — see [docs/fund-mode-beta-checklist.md](./docs/fund-mode-beta-checklist.md). Phases: easy-UX pool management (templates, treasury overview, auto-suggested proposals, member roles, exit flow) → multisig polish → monetization tests (creation fee, willingness-to-pay surveys, free-tier wall) → beta ops (Telegram channel, admin dashboard).

The order within Split Mode mainnet is sequential and gated. The Fund Mode beta work runs in parallel with mainnet prep and does not block the public launch.

Use [issues.md](./issues.md) as the indexed execution backlog. Current order:

Completed:

- **FW-001:** Full Split Mode devnet rehearsal passed per owner report.
- **FW-002:** Settlement failure states hardened for insufficient-USDC, insufficient-SOL-for-gas, token-account creation, wallet cancellation, simulation/send/confirmation failures, duplicate recording, and receipt-recording failure.
- **FW-003:** Responsive QA signed off for public, disconnected, wallet-modal, demo Settlement, Receipt, and Group-not-found recovery surfaces at `375`, `768`, and `1280`; live connected-wallet path was already checked by owner.
- **FW-006:** Judge-facing submission brief created in [SUBMISSION.md](./SUBMISSION.md) with demo script, screenshot checklist, submission copy, track framing, and claims to avoid.
- **FW-004:** LI.FI handoff copy now uses `Route funds for Settlement`, returns to the Group after route submission, and preserves the normal Settlement / Receipt path.
- **FW-005:** Zerion CLI wallet-readiness support shipped as `scripts/zerion-readiness.mjs` plus `pnpm zerion:readiness` and `docs/zerion-readiness.md`. Wraps `zerion analyze <address>`, summarizes USDC/SOL/broader context, prints a `READY` / `NOT READY` verdict with reasons, and falls back to a clear install message if the CLI is missing. Auth is pass-through (`ZERION_API_KEY`); optional x402 is documented, not required. `pnpm build` green.
- **FW-019:** Fund Mode Treasury addresses now require on-chain Squads verification before persistence.
- **FW-020:** Legacy SOL vault payment, withdrawal, balance, and lamport conversion helpers were removed from `lib/squads-multisig.ts`; Fund Mode Treasury helpers now stay stablecoin-only. `pnpm build` green.
- **FW-026:** Fund Mode reimbursement Proposal creation shipped with authenticated `POST /api/proposals`, server-side Treasury / Member / USDC validation, dashboard reads, and UI creation/listing. `pnpm test tests/fundwise-mutations.test.ts` and `pnpm build` green.
- **FW-027:** Proposal approval/rejection lifecycle now uses Squads-backed governance: Members sign Squads review transactions, FundWise stores signatures and mirrored status, and the database no longer acts as the approval authority. `pnpm test tests/fundwise-mutations.test.ts` and `pnpm build` green.
- **FW-028:** Approved reimbursement Proposals now execute through Squads vault transactions, then FundWise verifies the executed Squads status and Treasury-to-recipient stablecoin transfer before marking the Proposal executed. `pnpm test tests/fundwise-mutations.test.ts` and `pnpm build` green.
- **FW-029:** Proposal audit trail now supports one external proof link, Proposal-scoped comments, creator-only memo/proof edits before first outside approval, and visible edit history. Native file-upload storage rules are documented before upload ships. `pnpm test tests/fundwise-mutations.test.ts` and `pnpm build` green.
- **FW-030:** LI.FI routing is now available as `Route funds for Contribution` inside Fund Mode. It routes USDC to the Member wallet, returns to the same Group Contribution context, and leaves the Contribution ledger/receipt path unchanged. `pnpm test tests/fundwise-mutations.test.ts` and `pnpm build` green.
- **FW-031:** Zerion readiness now distinguishes Split Settlement, Fund Contribution, Proposal member action, and Treasury funding contexts while staying read-only. Docs cover CLI setup and optional x402 without inventing secrets. `node scripts/zerion-readiness.mjs --help`, `pnpm test tests/fundwise-mutations.test.ts`, and `pnpm build` green.
- **FW-032:** Fund Mode beta rehearsal script/runbook exists and devnet rehearsal now reaches invite-only Group creation, invite join, Squads v4 Treasury initialization, and stablecoin Contribution. Supabase migrations applied by owner on 2026-05-09; schema preflight confirmed. Full Proposal creation → approval → execution rehearsal is blocked on devnet RPC rate limits — needs a private RPC URL set as `NEXT_PUBLIC_SOLANA_RPC_URL` before rerunning `pnpm fund:rehearsal`.

Next pick:

- **FW-032 done:** Fund Mode beta rehearsal passed end-to-end on devnet: Group creation, invite join, Squads Treasury init, Contribution, Proposal creation, approval, execution, and Treasury-to-Member payout all verified on-chain with Helius devnet RPC. Group `9c0f9012`, Proposal `c14d795c`, execution tx `44JZK41J...`.
- **FW-021 done:** LI.FI top-up amount now uses integer-string-math parser with 20 unit tests instead of `parseFloat`.
- **LI.FI readiness done:** `pnpm lifi:readiness` checks the exact FundWise source set (Ethereum/Base/Arbitrum/Optimism/Polygon USDC -> Solana USDC) against live LI.FI metadata. Current result: mainnet routes ready, Sepolia probes have no usable route into Solana USDC, so FW-039 must use a tiny mainnet route.
- **FW-022 done:** Direct browser Supabase ledger helpers removed from `lib/db.ts`; browser code exclusively uses HTTP API wrappers.
- Remaining mainnet blocker: FW-038 production Supabase / Cloudflare environment setup, then FW-039 mainnet rehearsal. FW-038 prep is in place via `docs/ops-runbook.md` and `pnpm supabase:verify-rls`; owner dashboard access is required to finish it.
- Sentry (`@sentry/nextjs`) attempted and **reverted** — breaks `@cloudflare/next-on-pages` with a duplicated identifier error. Monitoring must use a Cloudflare-compatible alternative or wait for OpenNext adapter.
- **FW-042 done:** Fund Mode pool templates (`Trip pool`, `Friend fund`, `DAO grant`, `Family budget`) shipped with `lib/fund-mode-templates.ts`, migration `20260511150000_add_fund_mode_template_to_groups.sql`, and UI selector in Group creation.
- **FW-048 done:** Fund Mode beta Telegram onboarding link added to Group creation dialog and Fund Mode dashboard banner.
- **FW-043 done:** Fund Mode dashboard now has a Treasury overview card with live balance, funding progress, pending Proposal summary, top contributors, recent activity, and shortcuts into reimbursement Proposal creation/list review.
- **FW-038 prep done:** `docs/ops-runbook.md` and `scripts/verify-supabase-rls.mjs` shipped. Owner must create production Supabase project and configure Cloudflare env vars.

Next:

1. **FW-038 (HITL):** Owner creates production Supabase project, replays migrations, configures Cloudflare env vars.
2. **FW-039 (HITL):** Mainnet rehearsal with real USDC after FW-038 lands.
3. **FW-044:** Auto-suggested reimbursement proposals from Member expenses.
4. **FW-047:** Fund Mode creation fee infrastructure (devnet beta monetization test).
5. **FW-045:** Fund Mode member roles plus exit-flow proposal type.
6. Keep the next public submission pass aligned to [docs/shipped-vs-planned.md](./docs/shipped-vs-planned.md): shipped Split Mode is the proof, Fund Mode is the hero product sprint, and planned surfaces stay labeled as planned.
7. Treat Source Currency, Expense Proof, Scoped Agent Access, Payable Settlement Requests, rails, tax, and any autonomous payment authority as planned unless separately implemented end to end.

Deferred:

- **FW-008:** Fund Mode Proposal lifecycle, now pulled forward as the main one-month hero-product workstream.
- **FW-009:** Fundy, FundWise Agent, and Scoped Agent Access.
- **FW-010:** Payable Settlement Requests, invoice/Receipt endpoint, and Agent Spending Policies.

## Agent handoff notes

FW-024 was completed on 2026-05-08: Compass research was moved into `docs/research/`, ADR-0025 and ADR-0026 captured the useful decisions, and `scripts/devnet-agent-rehearsal.mjs` was added for repeatable agent-driven Split Mode rehearsal.

Next:

1. Keep [SUBMISSION.md](./SUBMISSION.md) and public copy aligned with FW-007: Source Currency and Expense Proof are future-only for the current demo.
2. Keep [docs/positioning.md](./docs/positioning.md) as the working FundLabs/FundWise strategy reference: FundLabs umbrella, FundWise wedge/product direction, Fundy distribution, Receipt Endpoint infrastructure, and claims guardrails.
3. Keep [docs/monetization.md](./docs/monetization.md) as the working business-model reference: free Split Mode launch, paid Fund Mode / Fundy / Receipt Endpoint / partner rails later.
4. Pick FW-026 next: build reimbursement Proposal creation now that the legacy SOL vault helpers are gone.

Do not touch unrelated dirty files unless the owner explicitly assigns them. Current handoff expectation is to work from the indexed backlog, keep commits small, and avoid broad rewrites before the May 11 submission deadline.

## Foundation-first delivery order

1. Finish backend trust hardening and devnet UX hardening for Split Mode.
2. Heavily test the core web product on devnet:
   create, invite, join, Expense, Balance, Settlement, and Receipt.
3. Finish the LI.FI support layer for EVM-first users:
   `Route funds for Settlement`, route execution, and clean return into the same Group Settlement flow.
4. Use Settlement Request Links as the acquisition loop and polish the exact debtor flow:
   shared link -> live Balance -> wallet-confirmed Settlement -> Receipt.
5. Add Zerion and Telegram support layers only after the shared wallet-bound engine is stable:
   wallet analysis, reminders, FundWise Agent, **Fundy** (hosted Telegram bot with wallet linking and read-only/draft-safe Group interactions), and later scoped agent access.
6. Return to Fund Mode as an invite-only beta after Split Mode is stable and Fundy is in users' hands:
   Treasury init, Contributions, Proposal creation, approval, execution, comments, and proof.
7. Extend the now-public Agent Skill/API docs with Scoped Agent Access API after the backend is stable:
   scoped agent capability grants and authenticated agent-to-FundWise interactions.
8. Add the missing Supabase data model for later Fund Mode and channel expansion:
   Telegram-to-wallet links, Telegram chat–Group links, short-lived link codes, draft expenses, agent-access grants, Expense Proof attachments, Proposal comments, Proposal proof attachments / external links, Proposal edit history, and later scoped agent-access records.
9. Treat Visa/card/IBAN rails as partner-dependent expansion after the crypto-native and agent surfaces are reliable.
10. Move to mainnet-beta only after the web app and shared backend are stable under devnet rehearsal.

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
- Multi-currency Expense entry is allowed as a future feature only if every Expense stores the Source Currency, original amount, converted USD/USDC ledger amount, and Exchange Rate Snapshot used at create or edit time.
- Historical Balances should not float with live exchange-rate changes. Live exchange values are for quoting at entry/edit time, not for silently repricing old Expenses.
- Expense Proof should support one lightweight receipt photo / PDF upload or proof link per Expense.
- Public-client Supabase ledger writes are dev-only scaffolding and cannot ship to mainnet-beta.
- LI.FI is the primary sponsor support layer after Split Mode hardening. It should be presented inside Settlement as `Route funds for Settlement`, not as a user-managed bridge workflow or a standalone dashboard task.
- LI.FI still routes funds into the normal Settlement path rather than paying the creditor directly across chains.
- Zerion CLI is an active sponsor track for wallet analysis, guidance, and agent-style flows around the core product.
- Future expansion should keep one shared engine across surfaces: web first, then FundWise Agent, Telegram, wallet-mini-app, and native-mobile clients on top of the same wallet-bound backend.
- The FundWise Agent name should cover Telegram bot / mini app, scoped agent access, reminders, draft Expense creation, proof upload, and wallet-aware suggestions.
- Fundy is the hosted Telegram bot that runs the FundWise Agent. It is not a separate product; it is a distribution surface for the same wallet-bound engine.
- The Agent Skill Endpoint (`/skill.md`) is a public machine-readable discovery document for autonomous agents. It does not require auth and does not expose private data.
- Scoped Agent Access is the permission model for autonomous agents: capabilities tied to Member wallet, Group, and action type, not broad permanent API keys.
- Payable Settlement Requests are now documented as a planned research direction for x402 / MPP / pay.sh-style agent payments. They extend Settlement Request Links for approved agents, but remain post-MVP and require scoped `settlement:pay` authority, idempotency, live Balance resolution, and verified payment proof before any Receipt is created.
- Agent Spending Policies are now documented as a required prerequisite for payable settlement. They define per-Settlement caps, daily caps, Group scope, counterparty scope, expiry, revocation, and human fallback behavior.
- Group ownership currently has limited power. In Split Mode, creator ownership is mostly a label; in Fund Mode, `created_by` can initialize Treasury addresses. Future ownership transfer must stay administrative and must not grant power over Balances or Receipts.
- Telegram scope should stay read-only and draft-safe plus comments/history. **Proposal approve/reject** is wallet-confirmed Squads governance for Fund Mode, so Fundy should deep-link Members back to the app for review signing rather than treat approvals as database-only bot actions. **On-chain** Settlement, Contribution, Proposal review, and Proposal execution remain app-and-wallet confirmed.
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

- **Production web host for agent discovery:** `https://fundwise.fun` — Agent Skill at **`/skill.md`** (root).
- **Fundy hosting:** separate **Railway** service in a **separate repository** per ADR-0022; Telegram library **`grammy`**.
- **Fundy ↔ FundWise data path:** HTTP **API routes only** (same surface as browsers/agents), with **`FUNDWISE_SERVICE_API_KEY`** + **`X-Fundy-Wallet`** for bot calls; extend routes for Scoped Agent Access (user tokens from **`/profile/agents`** + optional wallet-signed agent auth).
- **Telegram ↔ wallet linking:** **Option A** — short-lived codes from the authenticated web app, pasted as `/link FW-…` in DM.
- **Evolution:** command-based v1 → LLM agent (e.g. **OpenRouter**) as end state; Zerion **`/analyze`**, **`/readiness`**, **`/verify`** in v1.
- **Zerion CLI auth for Fundy:** prefer free **`ZERION_API_KEY`** initially; optional **x402** on Solana later.
- **Money movement from Telegram:** deep-link to web app; **Settlement** links must reuse existing **Settlement Request Link** behavior.

---

## Still pending for the primary MVP

- Keep [issues.md](./issues.md) updated as the working backlog and use `FW-*` IDs in session notes.
- Keep the devnet quality gates green:
  `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`
- Manual breakpoint QA and sign-off across landing, Group list, Group detail, Receipt, join flow, and modal surfaces
- Post-submission product/design pass for multi-currency Expense entry:
  Source Currency selector, current exchange-rate quote, visible converted USD/USDC amount, stored Exchange Rate Snapshot, and edit behavior
- Post-submission product/design pass for Expense Proof upload:
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

- **Fundy**: the hosted Telegram bot for the FundWise Agent, **command-first v1** on **Railway** (`grammy`), in a **separate repository**. Calls FundWise **HTTP APIs** with service-to-service auth and later Scoped Agent Access (not direct Supabase from the bot). Telegram–wallet linking uses **web-generated short codes** in DM. Zerion via **`/analyze`**, **`/readiness`**, **`/verify`** (Zerion CLI; start with **`ZERION_API_KEY`**, optional x402 later). End goal: LLM agent (e.g. OpenRouter), personal finance, and tax guidance on the same tools. See ADR-0018, ADR-0022, ADR-0023, and CONTEXT.md.
- **Agent Skill Endpoint** (`/skill.md`): public markdown at **`https://fundwise.fun/skill.md`** — what to call, what not to call, auth, limits, errors. Does not require auth to fetch; does not expose private Member data. See ADR-0018.
- **Scoped Agent Access**: the permission model for autonomous agents. Agents get scoped capabilities tied to Member wallet, Group, and action type — not broad permanent API keys.
- FundWise Agent for reminders, draft Expenses, proof upload, wallet analysis, and scoped assistant-driven FundWise actions
- Wallet-embedded mini dapp distribution
- Native mobile app
- Long-range stablecoin-only UX:
  gas / fee abstraction, automatic routing paths, and easier web2 onboarding / offboarding into stablecoin balances
- Long-range fiat bridge research:
  evaluate providers such as Bridge for virtual accounts, on/off ramps, wallets, and cards; keep Altitude-style Solana banking rails in the roadmap for Visa/card and IBAN-like top-up flows once non-crypto onboarding becomes a priority
- Mini-games / prediction-market-like mechanics:
  out of FundWise scope unless separately justified later; keep out of Split Mode, Fund Mode beta, and the hackathon story
- AI bill parsing beyond basic receipt-photo upload, or natural-language expense entry beyond draft-safe FundWise Agent flows
- **FundWise-native** email/password or social identity as the primary account system (optional Phantom Connect for wallet onboarding is a separate, additive path; see ADR-0014)
- Gas abstraction / gasless settlement
- Multi-stablecoin or multi-chain primary settlement

---

## Fund Mode status

Fund Mode remains a real product mode, but it is no longer part of the devnet-ready definition for the hackathon story. The first requirement is a polished Split Mode web app, then coherent LI.FI routing inside Settlement, then later support layers.

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
- Added interactive homepage Group preview on landing page hero
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
- Hero headline rewritten: "Group money, done right."
- CTA section rewritten: "Stop chasing. Start settling."
- Archival of ADR-0018 (Agent Skill + Fundy) and ADR-0014 (Phantom Connect) to `docs/archive/`
- Landing page hero badge updated to mention Solana + USDC settlement
- Dependabot alert acknowledged: 10 transitive vulnerabilities, all from `@solana/*` wallet adapter deps. None exploitable in client-side Next.js app.

---

## Resume point for the next session

1. Harden devnet Settlement and Contribution UX around insufficient funds, SOL-for-gas guidance, and recipient / Treasury token-account creation messaging.
2. Finish manual breakpoint QA on join, Receipt, wallet-verification, and Group dashboard routes.
3. Turn the LI.FI route flow into a user-facing `Route funds for Settlement` path for EVM-first users.
4. Run the first full end-to-end devnet rehearsal across create, invite, join, Expense, Settlement, Receipt, Treasury init, and Contribution.
5. Return to Zerion / Telegram support first, then Fund Mode proposals only after the Split Mode plus LI.FI path is polished.
6. Close GitHub issues #4–#9 on the repo after verifying all fixes.

## Planned, not yet built

- **Dashboard + Expense UX overhaul** (ADR-0020): 7→4 sections on mobile, expense dialog simplified to 3 fields, category dropdown killed, photo button added. **Next to build.**
- **Currency conversion** (ADR-0020): future-only; CoinGecko free tier, 5 currencies (USD/EUR/GBP/INR/AED), rate snapshot. Do not demo as shipped until ledger storage is complete.
- **Photo upload** (ADR-0020): future-only; Supabase Storage, JPEG/PNG only, client-side compress, one per expense. Do not demo as shipped until storage/access rules are complete.
- **Fundy Lite** (ADR-0018): Hackathon Telegram bot. Command-based, Zerion wallet analysis, draft expenses, settlement nudges. **Parallel track — second developer.**
- **Fundy Full** (ADR-0018): Post-hackathon. LLM via OpenRouter, personal finance manager, budgets, spending patterns, receipt parsing, proactive reminders.
- **Expense Dispute Handling** (ADR-0019): Members flag expenses, disputed expenses excluded from balance math, Group consensus vote resolves. Post-hackathon.
- **Fund Mode Proposals**: creation, approval, execution UI still pending.
- **Agent Skill Endpoint** (`/skill.md`) and **API docs** (`/api/docs`): public discovery/reference documents added for Fundy and external agent clients. Scoped Agent Access remains post-hackathon.
- **Scoped Agent Access**: permission model for autonomous agents. Post-hackathon.

---

## Ground rules

- Work only inside `/Users/sarthiborkar/Build/FundWise`.
- If an external input is required (RPC URL, API key, mint address, contract address), ask the owner instead of guessing.
