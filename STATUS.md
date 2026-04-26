# FundWise - Status

**Snapshot date:** 2026-04-26
**Phase:** Split Mode MVP hardening for mainnet-beta target
**Hackathon:** Colosseum Frontier (April 6 - May 11, 2026)

---

## TL;DR

FundWise is still a two-mode product:

1. Split Mode: track shared expenses in a Group, compute who owes whom, and settle in USDC on Solana.
2. Fund Mode: pool USDC into a shared Treasury and spend from it via Proposals.

The product direction is now sharper:

- The primary hackathon demo is Split Mode, not Fund Mode.
- The web app is the source of truth for the MVP.
- Frontend sign-off now comes before backend and sponsor-layer expansion.
- Mainnet-beta is the product target; devnet remains the test environment.
- Wallet-native auth stays in place.
- USDC is the only settlement asset in the MVP.
- LI.FI and Zerion CLI are active sponsor tracks, but neither should displace the main Split Mode user path.

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
- Shareable Settlement Request Links that deep-link back into the Group and resolve debtor-to-creditor amounts from the live simplified settlement graph
- Fund Mode vertical slice with Split Mode or Fund Mode Group creation, funding-goal capture, approval-threshold capture, Treasury initialization, Contribution history, and on-chain Treasury balance display
- LI.FI groundwork with client-only SDK initialization, injected EVM wallet source plus Solana destination routing, and mainnet-aware bridge UI
- Group Treasury persistence stores both `multisig_address` and `treasury_address`

---

## Frontend readiness today

- The core web app flows exist and build successfully:
  landing, Group list, Group detail, Expense dialog, Settlement flow, and Receipt
- The UI is usable, but it is not signed off yet as fully polished across mobile breakpoints
- Responsive behavior, spacing density, empty states, and copy consistency still need one dedicated pass before backend and sponsor work resumes

## Current work in progress

**Wallet data layer added via Zerion API** (server-side proxy, no client secret exposure):
  - `lib/zerion/`: client singleton, types, wallet-service, React hook `useZerionWallet()`
  - API routes: `/api/zerion/portfolio`, `/api/zerion/transactions` (server-side only, JWT proxy)
  - Example component: `components/zerion/portfolio-card.tsx` with top holdings + 24h change
  - ADR-007: rationale (unified multichain schema, free tier covers demo)
  - ✓ Pending: wire PortfolioCard into header or profile dropdown

**Swap provider infrastructure complete** (LiFi primary + Jupiter fallback):
  - `lib/swaps/`: abstract provider, LiFi wrapper, Jupiter fallback, service orchestrator
  - Error handling: structured `SwapError` codes, exponential backoff, price-impact guard
  - ADRs: ADR-005 (provider selection strategy), ADR-006 (per-edge atomic settlement flow)
  - Rate-limit mitigation: auto fallback after 2 LiFi quote attempts → Jupiter
  - ✓ Pending: integrate `SwapService` into settlement page UI; add loading/error states; devnet smoke test

**Frontend responsiveness pass remains signed off**:
  landing, header/footer/wallet chrome, hero, CTA, groups list, group detail,
  receipt, balance card, settlement request card, activity feed, join card,
  and the bridge modal.

**New UX improvements shipped:**
- Group total settled volume displayed in header (Split Mode only)
- Global profile display name editing via modal (pencil icon on own balance)
- QR scanner dialog and expense dialog validated across breakpoints (already responsive)

**Backend trust hardening infrastructure added** (non-breaking):
- Audit log table + RLS member-scoped policies (schema pending EF migration)
- Supabase Edge Functions for all future server-side mutations
- RPC receipt verification for Settlement and Contribution
- Design doc: `docs/BACKEND_TRUST_HARDENING.md`

**Anchor program security hardening (in progress → ready for local build):**
- `state.rs`: `expense_count` added to `Group`; `#[max_len]` constraints on `String`/`Vec` fields; overflow-checks enabled in `Cargo.toml`
- `errors.rs`: `ReentrantCall` variant added; `SettlementLocked` clarified
- Instructions (`create_group`, `join_group`, `add_expense`, `update_expense`, `delete_expense`, `record_settlement`): full **Checks-Effects-Interactions** ordering; settlement PDA lock via unique seeds; CPI `transfer_checked` with mint decimals validation; group `total_settled_volume` increment
- Security test suite: `tests/security.test.ts` — 4 exploit scenarios (wrong owner, duplicate settlement, insufficient balance, happy path)
- Keypair synced: program ID `Ai2w51mduD8GjMamzkG17EUQzrELxEmWmKX3GDa2V99r`
- ✓ Build blocked on this host (ARM64 Linux): Solana BPF toolchain (`cargo-build-sbf`) unavailable. Requires x86_64 machine with `anchor build`

**ADRs shipped today (DECIDED):**
- ADR-005: Swap Provider Selection & Fallback Strategy
- ADR-006: Settlement Flow: Swap-Based USDC Disbursement
- ADR-007: Zerion API as Wallet Data Layer
- ADR-013: Client Mutation Migration to Edge Functions
- ADR-014: On-Chain Settlement Verification via CPI Token Transfer
- ADR-015: Settlement Lock Enforcement via PDA Iteration & Duplicate Detection
- docs/adr/0003-state-compression-strategy.md (updated)

**Security documentation:**
- `docs/SECURITY_THREAT_MODEL.md`: threat model, attack surface, mitigations, security checklist

---

## Next: integrate Zerion PortfolioCard into header/profile, then integrate SwapService into settlement UI.

## Product decisions locked on 2026-04-26

- Split Mode is the primary MVP path for the hackathon demo.
- The Group page owns the full flow:
  Group -> Expense -> Balance -> Settlement -> Receipt
- Members join by invite link or QR after connecting a wallet.
- Join is invite-based and does not require creator approval in the MVP.
- Member identity is wallet-native with one global profile display name reused across Groups.
- Expenses are off-chain records; Settlements are on-chain USDC transfers.
- Any Member can log an Expense, and the payer can be any Member in the Group.
- Only the Expense creator can edit or delete it.
- The Activity Feed is the only in-Group timeline surface for now; there is no chat.
- Only Members with a negative Balance see the Settle action.
- Settlements resolve against the debtor's current net Balance, not a stale linked amount.
- The primary settlement action is exact-amount settlement in one go.
- Each suggested edge in the simplified settlement graph maps to one debtor-to-creditor transfer.
- Mainnet-beta is the product target; devnet is for testing and rehearsals.
- USDC is the only stablecoin in the MVP.
- Public-client Supabase ledger writes are dev-only scaffolding and cannot ship to mainnet-beta.
- LI.FI is a secondary top-up path into the debtor's Solana wallet, not a direct cross-chain creditor settlement path.
- Zerion CLI is an active sponsor track for wallet analysis, guidance, and agent-style flows around the core product.
- The next delivery sequence is locked:
  frontend responsiveness -> backend trust hardening -> on-chain / devnet hardening -> LI.FI and Zerion support -> isolated audits -> full rewiring -> end-to-end devnet testing

---

## Still pending for the primary MVP

- Empty-state and copy polish across Group screens (copy review) — partially done, more may be needed
- **Deploy Edge Functions** (requires `SUPABASE_SERVICE_ROLE_KEY`)
- **Integrate Supabase Auth** to activate member-scoped RLS
- **Migrate client mutations** to call Edge Functions instead of direct table ops
- Mainnet USDC hardening with clear insufficient-USDC and insufficient-SOL states, recipient token-account auto-creation inside settlement flow, and explicit SOL-for-gas guidance
- Mainnet deployment checklist and supported USDC mint wiring
- **Anchor program local build** (requires x86_64 machine with Solana BPF toolchain)
- **Devnet deployment** (local build → `anchor deploy` → smoke test)

## Secondary work kept out of the main path

- LI.FI recovery/top-up branch when a debtor lacks USDC on Solana
- Telegram bot and Telegram mini app
- Wallet-embedded mini dapp distribution
- AI bill parsing or natural-language expense entry
- Embedded wallets and social login
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

1. **Frontend responsiveness pass** — run final visual QA across breakpoints, finish any empty-state copy polish.
2. **Anchor build** — compile program on x86_64 Linux with Solana BPF toolchain (`anchor build`), fix any compile errors, deploy to devnet (`anchor deploy`), test locally.
3. **Edge Functions deployment** — after you provide `SUPABASE_SERVICE_ROLE_KEY`, run `supabase functions deploy` to all EF routes (`expense`, `expense/update`, `expense/delete`, `settlement`, `contribution`, `profile/name`).
4. **Client mutation migration** — swap `supabase.from()` calls for `supabase.functions.invoke()` for all mutating operations.
5. **Supabase Auth integration** — enable email/password or magic link; activate RLS policies; restrict EF access to authenticated members.
6. **On-chain + Edge Functions integration** — wire `SwapService.executeSettlementSwap()` into settlement confirmation page; add Zerion PortfolioCard to header/profile dropdown.
7. **Devnet smoke test** — end-to-end: create group → add expense → call EF settlement → submit on-chain TX → verify USDC transfer on Solscan devnet.
8. **Mainnet hardening checklist** — mainnet USDC mint wiring, recipient token-account creation, insufficient-funds UX, SOL gas guidance.
9. **Audit** — contract security review; then full-stack rewiring and polish before hackathon demo.
10. Return to Fund Mode proposals only after the Split Mode demo path is fully polished.

---

## Ground rules

- No git operations performed by the assistant; commits and pushes are the owner's.
- Work only inside `/home/tokisaki/FundWise`.
- If an external input is required (RPC URL, API key, mint address, contract address), ask the owner instead of guessing.

