# FundWise Issues

**Last indexed:** 2026-05-14
**Submission status:** Colosseum Frontier submission complete (deadline 2026-05-11)
**Current focus:** Dual-track delivery — Split Mode to public mainnet, Fund Mode stays devnet as invite-only beta for easy-UX and monetization testing. See [docs/split-mode-mainnet-checklist.md](./docs/split-mode-mainnet-checklist.md) and [docs/fund-mode-beta-checklist.md](./docs/fund-mode-beta-checklist.md).

This file is the local issue index for hackathon execution. Keep each issue as a vertical slice: a completed issue should be independently demoable, testable, or useful for submission.

## Issue File Index

- [Active Index](#active-index) — one-line status for every `FW-*` issue.
- [Pick Queue](#pick-queue) — current execution order by workstream.
- [Handoff Queue For Claude / Lot](#handoff-queue-for-claude--lot) — coordination rules for agents.
- [FW-001 to FW-025](#fw-024-implementation-notes-shipped-2026-05-08) — legacy hackathon, hardening, and planning notes. Completed items before FW-024 are tracked in the Active Index only.
- [FW-026 to FW-032](#fw-026---build-reimbursement-proposal-creation-for-fund-mode) — Fund Mode Proposal lifecycle and beta rehearsal.
- [FW-033 to FW-041](#fw-033---cluster-aware-stablecoin-mints-devnet-vs-mainnet) — Split Mode mainnet pre-flight and production setup.
- [FW-042 to FW-048](#fw-042---pool-templates-at-fund-mode-group-creation) — Fund Mode beta UX and Telegram onboarding.
- [FW-049 to FW-052](#fw-049---add-beta-admin-wallets-for-fund-mode-group-creation) — Fund Mode admin access, build unblock, custom setup, and devnet RPC path.
- [FW-053 to FW-056](#fw-053---branch-audit-follow-ups-critical-expense-payer-binding-settlement-toctou-sanctions-scope) — branch audit security and cleanup follow-ups.
- [FW-057 to FW-065](#fw-057---threshold-suggestions-at-treasury-initialization) — remaining Fund Mode beta checklist items.
- [Branch Audit Snapshot](#branch-audit-snapshot-2026-05-14) — audit context that produced FW-053 through FW-056.

## Active Index

| ID | Status | Priority | Type | Title | Blocked by |
| --- | --- | --- | --- | --- | --- |
| FW-001 | Done | P0 | AFK | Run full Split Mode devnet rehearsal and capture blockers | None |
| FW-002 | Done | P0 | AFK | Harden Settlement failure states on devnet | FW-001 |
| FW-003 | Done | P0 | HITL | Sign off responsive QA for the core demo path | FW-001 |
| FW-004 | Done | P1 | AFK | Polish LI.FI Top up to settle handoff | FW-002 |
| FW-005 | Done | P1 | AFK | Add Zerion CLI wallet-readiness support demo | FW-002 |
| FW-006 | Done | P0 | HITL | Prepare judge-facing demo script and submission assets | FW-001, FW-003 |
| FW-007 | Done | P2 | HITL | Decide whether Source Currency and Expense Proof ship in the demo | FW-006 |
| FW-008 | Deferred | P2 | HITL | Fund Mode Proposal lifecycle | Split Mode mainnet stability |
| FW-009 | Deferred | P2 | HITL | Fundy, FundWise Agent, and Scoped Agent Access | Split Mode + API contract stability |
| FW-010 | Deferred | P2 | HITL | Payable Settlement Requests, invoice/Receipt endpoint, and Agent Spending Policies | Scoped Agent Access |
| FW-011 | Done | P1 | HITL | Define monetization model and finance analysis | Owner decision |
| FW-012 | Done | P1 | AFK | Clean shipped-vs-planned docs and messaging drift | FW-007, FW-011 |
| FW-013 | Done | P2 | HITL | Decide Fund Mode mini-games scope and prediction-market boundary | FW-008 |
| FW-014 | Done | P0 | AFK | Lock down anonymous Supabase ledger access | None |
| FW-015 | Done | P0 | AFK | Validate Expense ledger amounts and split shares server-side | FW-014 |
| FW-016 | Done | P0 | AFK | Require Settlements to match the live Settlement graph | FW-015 |
| FW-017 | Done | P1 | AFK | Triage dependency audit advisories | FW-014 |
| FW-018 | Done | P1 | AFK | Add production browser security headers | FW-014 |
| FW-019 | Done | P1 | AFK | Verify Fund Mode Treasury addresses on-chain before persistence | FW-014 |
| FW-020 | Done | P2 | AFK | Remove legacy SOL vault helpers from Squads Fund Mode code | FW-019 |
| FW-021 | Done | P2 | AFK | Validate LI.FI top-up amount parsing before quote execution | FW-004 |
| FW-022 | Done | P2 | AFK | Retire direct browser Supabase ledger helpers after RLS lockdown | FW-014 |
| FW-023 | Done | P1 | AFK | Add wallet-session abuse controls and origin binding | FW-014 |
| FW-024 | Done | P1 | AFK | Index Compass research ADRs and add scripted devnet agent rehearsal | None |
| FW-025 | Done | P1 | AFK | Index Fund Mode hero-product sprint and integration backlog | Owner direction |
| FW-026 | Done | P0 | AFK | Build reimbursement Proposal creation for Fund Mode | FW-020 |
| FW-027 | Done | P0 | AFK | Build Proposal approval and rejection lifecycle | FW-026 |
| FW-028 | Done | P0 | AFK | Execute approved Fund Mode reimbursements through Squads | FW-027 |
| FW-029 | Done | P1 | AFK | Add Proposal proof, comments, and edit history model | FW-026 |
| FW-030 | Done | P1 | AFK | Add LI.FI funding path for Fund Mode Contributions | FW-020 |
| FW-031 | Done | P1 | AFK | Add Zerion readiness context for Fund Mode Members and Treasuries | FW-020 |
| FW-032 | Done | P1 | AFK | Run invite-only Fund Mode beta rehearsal and integration QA | Devnet RPC rate limit |
| FW-033 | Done | P0 | AFK | Cluster-aware STABLECOIN_MINTS (devnet vs mainnet) | None |
| FW-034 | Done | P1 | AFK | Cluster badge in app header | FW-033 |
| FW-035 | Done | P1 | AFK | Multi-RPC fallback with Helius primary | None |
| FW-036 | Done | P2 | AFK | Footer social links + legal nav scaffold | None |
| FW-037 | Done | P2 | AFK | Privacy / Terms / Disclosures draft pages | FW-036 |
| FW-038 | Ready | P0 | HITL | Production Supabase project + RLS migration replay | FW-014 |
| FW-039 | Ready | P0 | HITL | Mainnet rehearsal with real USDC (full Split Mode flow) | FW-033, FW-035, FW-038 |
| FW-040 | Ready | P1 | AFK | Update public copy after mainnet launch | FW-039 |
| FW-041 | Done | P1 | AFK | Minimal OFAC SDN screening on wallet connect | FW-014 |
| FW-042 | Done | P1 | AFK | Pool templates at Fund Mode Group creation | None |
| FW-043 | Done | P1 | AFK | Treasury overview card on Fund Mode dashboard | None |
| FW-044 | Ready | P1 | AFK | Auto-suggested reimbursement proposals from Member expenses | None |
| FW-045 | Ready | P2 | AFK | Fund Mode member roles (Admin / Member / Viewer) | None |
| FW-046 | Done | P2 | AFK | Fund Mode exit/refund proposal flow | FW-045 |
| FW-047 | Ready | P1 | AFK | Fund Mode creation fee infrastructure (devnet beta) | FW-033 |
| FW-048 | Done | P2 | AFK | Telegram beta channel onboarding link from Fund Mode entry | None |
| FW-049 | Ready | P0 | HITL | Add beta admin wallets for Fund Mode Group creation | Cloudflare deploy env access |
| FW-050 | Done | P0 | AFK | Fix Next build for public `.well-known` discovery routes | None |
| FW-051 | Done | P1 | AFK | Polish custom Fund Mode Group creation and faucet guidance | None |
| FW-052 | Done | P0 | AFK | Keep Fund Mode on custom devnet RPC while Split Mode moves mainnet | FW-033 |
| FW-053 | Done | P0 | AFK | Branch audit follow-ups: expense payer binding, settlement TOCTOU, sanctions screen scope | None |
| FW-054 | Open | P1 | AFK | Distributed rate-limit + cover money-moving routes | None |
| FW-055 | Done | P1 | AFK | Restrict on-chain settlement verification to expected ATAs only | None |
| FW-056 | Open | P2 | AFK | Branch audit follow-ups: UI polish, dead code, devnet mint cleanup | None |
| FW-057 | Done | P1 | AFK | Threshold suggestions at Treasury initialization | None |
| FW-058 | Done | P1 | AFK | Pre-Treasury SOL/rent checklist UI | FW-052 |
| FW-059 | Done | P2 | AFK | Squads explorer link on Treasury card | FW-052 |
| FW-038d | Done | P1 | AFK | Cloudflare-compatible open-source monitoring shim (GlitchTip via @sentry/cloudflare) | None |
| FW-060 | Ready | P2 | AFK | Threshold-change proposal type | FW-045 |
| FW-061 | Ready | P1 | AFK | Monthly fee emulation banner | FW-047 |
| FW-062 | Ready | P1 | AFK | Free-tier limits emulation | FW-047 |
| FW-063 | Ready | P2 | AFK | Beta exit survey | FW-046 |
| FW-064 | Ready | P2 | AFK | Beta admin dashboard | None |
| FW-065 | Ready | P2 | HITL | Weekly beta digest process | FW-064 |

## Pick Queue

The hackathon submission is complete. Post-submission execution follows the two checklists:

**Split Mode mainnet path (sequential, gated):**

1. **FW-033** Cluster-aware mints (P0, AFK)
2. **FW-034** Cluster badge (P1, AFK)
3. **FW-035** Multi-RPC fallback (P1, AFK)
4. **FW-036** Footer + legal scaffold (P2, AFK)
5. **FW-037** Legal page drafts (P2, AFK)
6. **FW-017** Dep audit (P1, AFK) — done
7. **FW-018** Security headers (P1, AFK) — done
8. **FW-023** Wallet-session abuse + origin binding (P1, AFK) — done
9. **FW-041** Minimal OFAC SDN screening (P1, AFK) — done
10. **FW-053** Critical branch-audit fixes: payer binding, atomic Settlement insert, sanctions recheck (P0, AFK)
11. **FW-054** Distributed rate-limit + money-moving route limits (P1, AFK)
12. **FW-055** Strict expected-ATA-only on-chain verification (P1, AFK)
13. **FW-038** Prod Supabase project (P0, HITL)
14. **FW-039** Mainnet rehearsal (P0, HITL)
15. **FW-040** Public copy update post-launch (P1, AFK)

**Fund Mode devnet beta path (parallel, non-blocking):**

1. **FW-042** Pool templates (P1, AFK) — done
2. **FW-043** Treasury overview card (P1, AFK) — done
3. **FW-044** Auto-suggested reimbursement proposals (P1, AFK)
4. **FW-047** Creation fee infrastructure (P1, AFK)
5. **FW-045** Member roles (P2, AFK)
6. **FW-046** Exit/refund proposal flow (P2, AFK)
7. **FW-048** Telegram beta channel link (P2, AFK) — done
8. **FW-049** Add beta admin wallets (P0, HITL)
9. **FW-050** Build unblock for `.well-known` routes (P0, AFK) — done
10. **FW-051** Custom Fund Mode creation UI + faucet guidance (P1, AFK) — done
11. **FW-052** Dedicated devnet RPC path for Fund Mode on-chain flows (P0, AFK) — done
12. **FW-057** Threshold suggestions at Treasury init (P1, AFK)
13. **FW-058** Pre-Treasury SOL/rent checklist UI (P1, AFK)
14. **FW-059** Squads explorer link on Treasury card (P2, AFK)
15. **FW-060** Threshold-change proposal type (P2, AFK)
16. **FW-061** Monthly fee emulation banner (P1, AFK)
17. **FW-062** Free-tier limits emulation (P1, AFK)
18. **FW-063** Beta exit survey (P2, AFK)
19. **FW-064** Beta admin dashboard (P2, AFK)
20. **FW-065** Weekly beta digest process (P2, HITL)

## Handoff Queue For Claude / Lot

1. **Keep FW-007 closed unless scope changes.** Source Currency and Expense Proof are future-only for the current public demo. Do not partially ship either without the full ledger/storage path.
2. **Keep FW-011 closed unless pricing changes.** Split Mode stays free for launch; Fund Mode, Fundy premium, and partner rails are the plausible paid surfaces. See `docs/monetization.md`.
3. **Use the shipped/planned matrix during submission edits.** See `docs/shipped-vs-planned.md`; canonical LI.FI language is `Route funds for Settlement`.
4. **Keep Fund Mode mini-games out of FundWise.** FW-013 decided they are out of scope for this product unless separately justified later outside prediction-market-like mechanics.
5. **Keep commits sequential.** Commit feature/code first, then docs/status updates. Do not add co-author trailers.
6. **Quality gate after code changes:** run `pnpm build`. Known warnings from previous runs: workspace-root inference from another lockfile, two unused eslint-disable directives, and `bigint` pure-JS fallback.

### FW-024 Implementation Notes (shipped 2026-05-08)

- Compass research artifacts were moved into `docs/research/` and indexed in `docs/research/README.md`.
- The useful Compass findings were captured as ADR-0025 and ADR-0026 instead of leaving unindexed artifacts at the repo root.
- `scripts/devnet-agent-rehearsal.mjs` was added for an agent-driven Split Mode rehearsal path.
- Latest rehearsal result: Group `80dc13a8-9b06-4d71-a7ba-68dea8d4a4ea`, Receipt `7d997c46-b665-470f-b16d-d448f1ef74c7`, devnet transaction `PkdHBESndA38yChKJHpkFYpGbfd1wQ13NXpTCtZwQrFfh5LgdLS143crW5TJ14yzZiGqb2poLiRV3e93D3KhP6p`.
- Caveat: the run used a temporary SPL stablecoin mint because the public devnet faucet was rate-limited. It proves the FundWise Settlement and Receipt machinery, not final mainnet USDC readiness.

### FW-025 Implementation Notes (shipped 2026-05-08)

- Owner clarified that Fund Mode is the hero product and needs a one-month acceleration sprint.
- ADR-0027 now records the distinction: Split Mode is the shipped wedge; Fund Mode is the north-star beta product.
- `ROADMAP.md`, `STATUS.md`, `PRD.md`, `README.md`, `docs/positioning.md`, `docs/shipped-vs-planned.md`, and the docs index were updated to keep that direction visible.
- New indexed Fund Mode work starts at FW-026 and covers reimbursement Proposals, approval/rejection, execution, proof/history, LI.FI, Zerion, and beta rehearsal.

## FW-026 - Build Reimbursement Proposal Creation For Fund Mode

**Status:** Ready
**Priority:** P0
**Type:** AFK
**Blocked by:** FW-020

### What to build

Create the first Fund Mode Proposal shape: reimbursement to a Member wallet from the Group Treasury after approval.

### Acceptance Criteria

- [x] Proposal creation is available only in Fund Mode Groups with initialized Treasury addresses.
- [x] Recipient must be a current Group Member wallet.
- [x] Amount must be positive, USDC-denominated, and validated server-side.
- [x] Proposal records memo, proposer wallet, recipient wallet, amount, status, and created timestamp.
- [x] Proposer cannot create a Proposal that bypasses the approval threshold.
- [x] UI clearly labels the flow as reimbursement, not generic external payout.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-09. Fund Mode now has a reimbursement Proposal creation path: authenticated browser route `POST /api/proposals`, server-side Fund Mode / initialized Treasury / Member-recipient validation, pending-only Proposal insertion, dashboard snapshot reads, and a Fund Mode UI form plus Proposal list. Focused test: `pnpm test tests/fundwise-mutations.test.ts` passed with 15 tests. Full gate: `pnpm build` passed.

## FW-027 - Build Proposal Approval And Rejection Lifecycle

**Status:** Done
**Priority:** P0
**Type:** AFK
**Blocked by:** FW-026

### What to build

Add wallet-confirmed Squads approval and rejection behavior for Fund Mode reimbursement Proposals, with FundWise storing review metadata as an index of on-chain governance state.

### Acceptance Criteria

- [x] Proposer cannot approve their own Proposal.
- [x] Each Member can approve or reject a Proposal at most once.
- [x] Rejection closes the Proposal and requires a new Proposal for retry.
- [x] Threshold approval marks the Proposal ready for execution but does not auto-send funds.
- [x] UI shows pending, rejected, approved-ready, and executed states distinctly.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-09. Proposal reviews originally shipped as database-backed approval/rejection decisions; the follow-up Squads governance correction now requires wallet-confirmed Squads review transactions and stores the review signature plus mirrored Squads status in FundWise. One review per Member, proposer self-review blocking, rejection closure, and threshold-ready status remain, but Squads is the authority layer. The Fund Mode dashboard shows review counts, rejection history, and pending review controls. Focused test: `pnpm test tests/fundwise-mutations.test.ts` passed with 15 tests. Full gate: `pnpm build` passed.

## FW-028 - Execute Approved Fund Mode Reimbursements Through Squads

**Status:** Done
**Priority:** P0
**Type:** AFK
**Blocked by:** FW-027

### What to build

Execute approved Squads reimbursement Proposals through the stored Squads Multisig and Treasury addresses.

### Acceptance Criteria

- [x] Execution is a separate explicit action after the approval threshold is met.
- [x] Any current Member can trigger execution for an approved Proposal.
- [x] Treasury movement targets only the approved Member recipient wallet.
- [x] Execution uses the approved Squads transaction message without client-side mutation.
- [x] Server verifies the resulting on-chain transfer before marking the Proposal executed.
- [x] Duplicate execution attempts are rejected idempotently.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-09. Approved Proposals now expose a separate Execute action that signs the Squads vault transaction, records execution through `POST /api/proposals/{proposalId}/execute`, verifies the Squads Proposal is executed, verifies the stablecoin delta from the Treasury ATA to the approved Member recipient, rejects duplicate execution signatures, and stores `tx_sig` / `executed_at` only after verification. Focused test: `pnpm test tests/fundwise-mutations.test.ts` passed with 15 tests. Full gate: `pnpm build` passed.

## FW-029 - Add Proposal Proof, Comments, And Edit History Model

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-026

### What to build

Add the lightweight audit trail needed for a real Fund Mode beta without turning Groups into chat.

### Acceptance Criteria

- [x] Proposal supports one lightweight proof file or one external proof link.
- [x] Proposal comments are scoped to the Proposal, not a Group-wide chat surface.
- [x] Proposal edits are allowed only before the first non-proposer approval.
- [x] Proposal edit history shows what changed.
- [x] Rejections remain visible in Proposal history.
- [x] Storage and access rules are documented before file upload ships.

### Notes

Completed on 2026-05-09. Proposal proof now ships as one external HTTP/HTTPS proof link, comments are Proposal-scoped, creator metadata edits are limited to memo/proof link while pending and before the first outside approval, edit history records changed fields, and storage/access rules are documented in `docs/fund-mode-proposal-audit.md` before native file upload. Focused test: `pnpm test tests/fundwise-mutations.test.ts` passed. Full gate: `pnpm build` passed.

## FW-030 - Add LI.FI Funding Path For Fund Mode Contributions

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-020

### What to build

Extend the existing LI.FI support layer so a Member can route funds for a Fund Mode Contribution when they do not already have Solana USDC.

### Acceptance Criteria

- [x] Contribution preflight can offer `Route funds for Contribution` when LI.FI is available.
- [x] Copy avoids bridge jargon and does not imply LI.FI executes the Contribution itself.
- [x] Route completion returns the Member to the same Fund Mode Group and Contribution context.
- [x] The Contribution ledger and Receipt model remain unchanged.

### Notes

Completed on 2026-05-09. Fund Mode Contributions now expose `Route funds for Contribution` when LI.FI is available, reusing the existing route modal with Contribution-specific copy. Funds route to the Member wallet, then the normal wallet-confirmed Contribution still moves USDC into the Squads Treasury and records the unchanged Contribution ledger entry. Focused test: `pnpm test tests/fundwise-mutations.test.ts` passed. Full gate: `pnpm build` passed.

## FW-031 - Add Zerion Readiness Context For Fund Mode Members And Treasuries

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-020

### What to build

Use the existing Zerion readiness boundary to support Fund Mode Contribution and Proposal readiness.

### Acceptance Criteria

- [x] Readiness output distinguishes Member Contribution readiness from Split Mode Settlement readiness.
- [x] Output includes Solana USDC and SOL-for-gas readiness where Zerion data supports it.
- [x] Fund Mode use stays read-only and never becomes signing, wallet connection, or Treasury execution.
- [x] Docs explain required Zerion CLI setup and optional x402 without inventing secrets.

### Notes

Completed on 2026-05-09. `pnpm zerion:readiness` now supports `--mode=settlement`, `--mode=contribution`, `--mode=proposal-member`, and `--mode=treasury`. Contribution mode checks Member USDC plus SOL-for-gas, proposal-member mode checks SOL-for-gas for Squads actions, and treasury mode checks vault USDC without requiring SOL because the vault does not sign. Docs now cover Fund Mode usage, required Zerion CLI/API-key setup, and optional x402 without storing secrets. Verification: `node scripts/zerion-readiness.mjs --help`, `pnpm test tests/fundwise-mutations.test.ts`, and `pnpm build` passed.
- [ ] `pnpm build` passes.

## FW-021 - Validate LI.FI Top-Up Amount Parsing Before Quote Execution

**Status:** Done
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-004

### What was fixed

`getBridgeQuote` converted the human USDC amount with `parseFloat(params.fromAmount) * 1e6` before calling LI.FI, accepting malformed strings and potentially producing unsafe, rounded, exponential, or non-finite values.

### Implementation

Completed on 2026-05-09. Added `lib/parse-usdc-amount.ts` with integer-string-math-based USDC amount parser that rejects malformed strings, non-finite numbers, zero/negative values, more than 6 decimals, and unsafe integer raw amounts. Updated `lib/lifi-bridge.ts` to use the new parser instead of `parseFloat`. Added client-side validation in `components/cross-chain-bridge-modal.tsx` that shows a clear error before the LI.FI quote request. Added 20 unit tests in `tests/parse-usdc-amount.test.ts`. `pnpm build` and all 69 tests pass.

## FW-022 - Retire Direct Browser Supabase Ledger Helpers After RLS Lockdown

**Status:** Done
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-014

### What was fixed

After FW-014, direct browser Supabase reads are no longer part of the ledger access model. `lib/db.ts` still kept direct `supabase.from(...)` helpers for profiles, expenses, splits, and settlements that either fail under RLS or invite future agents to reintroduce public anon-table access assumptions.

### Implementation

Completed on 2026-05-09. Verified that all six direct-Supabase helpers (`getProfile`, `getProfileDisplayNames`, `getExpenses`, `getExpenseSplits`, `getAllSplitsForGroup`, `getSettlements`) had zero browser-side imports — the server-side code has its own implementations. Removed all six dead functions and the `supabase` import from `lib/db.ts`. Cleaned up unused type aliases (`GroupInsert`, `ProfileRow`). The browser code exclusively uses HTTP API wrappers. `pnpm build` and all 69 tests pass.

## FW-032 - Run Invite-Only Fund Mode Beta Rehearsal And Integration QA

**Status:** In Progress
**Priority:** P1
**Type:** AFK
**Blocked by:** Devnet RPC rate limit (needs private RPC URL from owner)

### What to verify

Run the one-month beta path with real wallets on devnet before public claims change.

### Acceptance Criteria

- [x] Fund Mode Group creation works for an invite-enabled wallet.
- [x] Second Member joins by invite link.
- [x] Treasury initialization succeeds and persists verified Squads addresses.
- [x] Member makes a Contribution and the Treasury balance updates.
- [x] Member creates a reimbursement Proposal.
- [x] Other Member approves or rejects.
- [x] Approved Proposal executes through the Treasury.
- [x] LI.FI and Zerion support paths are checked where available.
- [x] Findings are either fixed or split into new indexed issues.

### 2026-05-09 Rehearsal Notes

- Added `pnpm fund:rehearsal` and `docs/fund-mode-beta-rehearsal.md`.
- Squads v4 research showed `multisigCreate` is deprecated/rejected; FundWise now uses `multisigCreateV2` with the program config treasury and `rentCollector: null`.
- Devnet rehearsal reached Squads Treasury creation and stablecoin Contribution twice. Latest confirmed Group: `8eeb481d-74cd-4913-b60c-44a7b5d5010f`; Treasury: `6make1GpsYtGwAM1pvYmzXWAh2xqJMMrTM5Kv8HxujY2`; Multisig: `F1N1RXU65p2GKWW4XYxoPoBZKxxJoEXeMQBCpS3AfuFD`; Contribution tx: `3XLaSC58XU6tqQnwwsVz8ZSq3sf8oSYbiB6sRHoT7cGyof9JbjdgMUd4HBYaMw4x52G7NRVN7gVcX8UUezdD4C9m`.

### 2026-05-10 Session 3 Rehearsal Notes

- **Helius devnet RPC configured** — `NEXT_PUBLIC_SOLANA_RPC_URL` fixed to `https://devnet.helius-rpc.com/?api-key=...` format.
- **Creator wallet added to invite list** — `FUNDWISE_FUND_MODE_INVITE_WALLETS=EMc97zXSrG6vb8aqEMponNPgYcDJ9G5vLRYHJz1BYsge`.
- **Full rehearsal passed**: Group `9c0f9012-babc-4750-b9f5-c1b7695dcb04`, Proposal `c14d795c-af81-4562-bc46-ce7452d6c5b5`, Treasury `qbWnoe6q8JtkbxEvgVxEvhkViGBoWK8K9CrXyRMNCxD`, Multisig `C2FVNyYN3z3ufcaPUtA7pNbHPju5zfghvvJnoh9K2e3s`.
- **All 12 steps completed**: health check, SOL funding, wallet sessions, display names, stablecoin mint, Fund Mode Group creation, invite join, Squads Treasury initialization, 25 USDC Contribution, reimbursement Proposal creation, approval, and execution.
- **Treasury balance after execution**: 20.00 test units (25 contributed - 5 reimbursed).
- **LI.FI and Zerion paths** confirmed via script output.
- **FW-032 is now Done.**

### FW-010 Planning Notes (deferred)

- Payable Settlement Requests should extend Settlement Request Links for payment-aware agents, not replace the human wallet flow.
- The planned agent endpoint needs crisp language around unpaid **invoice/request**, x402 / MPP **payment challenge**, verification, and final **Receipt**. A Receipt must only be created after verified payment proof or a confirmed on-chain transfer.
- x402 TODO: evaluate `@x402/next` middleware for payable agent routes that return HTTP `402` with payment requirements, facilitator URL, and FundWise-controlled wallet address. Do not add this to normal free Split Mode routes.
- MPP TODO: publish `x-payment-info` OpenAPI extensions only on payable operations after the payable Settlement Request interface exists. Candidate fields: intent, method, amount, currency, and session/request expiry.
- ACP TODO: publish `/.well-known/acp.json` only if FundWise exposes an actual commerce API. If added, it must describe protocol name/version, API base URL, transports, and service capabilities without creating checkout behavior ahead of policy enforcement.
- Add Agent Spending Policies before any agent can pay: per-Settlement cap, daily cap, Group scope, counterparty scope, USDC-only asset scope, expiry, revocation, and human fallback threshold.
- Planned endpoints to evaluate: `POST /api/agent/spending-policies`, `GET /api/agent/spending-policies`, `PATCH /api/agent/spending-policies/{policyId}`, `POST /api/agent/settlement-requests`, `GET /api/agent/settlement-requests/{requestId}`, `POST /api/agent/settlement-requests/{requestId}/pay`, `POST /api/agent/settlement-requests/{requestId}/verify`, plus a dedicated invoice / Receipt retrieval endpoint if it is meaningfully separate from Settlement Request status.
- Group ownership should stay administrative. Add ownership transfer/recovery before agent-created Groups become first-class.
- See `docs/agentic-settlement-endpoint.md` and `docs/agent-payment-policy.md`.

### FW-005 Implementation Notes (shipped 2026-05-04)

- Official Zerion CLI docs say to use commands such as `zerion analyze <address>` for complete wallet analysis; JSON output is the default and `--format human` is available for readable output.
- Prefer `ZERION_API_KEY` for auth. Optional x402 can be documented, but do not require it and do not invent keys.
- The output should be framed as `wallet-readiness support`: USDC readiness, SOL-for-gas readiness, and broader wallet context when Zerion exposes it.
- It must not become wallet connection, identity, signing, or Settlement execution. Solana wallet-adapter remains the identity and money-movement path.
- If the CLI is missing, fail with a clear setup message instead of hiding the error.

**Shipped:** `scripts/zerion-readiness.mjs` + `pnpm zerion:readiness` + `docs/zerion-readiness.md`. The script defensively walks the CLI's JSON output to tolerate upstream schema drift, sums USDC and SOL on Solana, and emits either a human verdict or `--json` for downstream tooling. Auth is pass-through; x402 is documented as optional and the script does not implement payment logic itself.

## FW-001 - Run Full Split Mode Devnet Rehearsal And Capture Blockers

**Status:** Done
**Priority:** P0  
**Type:** AFK  
**Blocked by:** None

### What to verify

Run the exact judge demo path on devnet with real wallets:

`Group -> invite / join -> Expense -> Balance -> Settlement -> Receipt`

### Acceptance Criteria

- [x] A new Split Mode Group can be created from `/groups` after wallet connect.
- [x] A second wallet can join by invite link or QR with an explicit `Join {GroupName}` action.
- [x] A Member can create an Expense with the expected split method.
- [x] Balances and suggested Settlement edges match the ledger state.
- [x] A debtor can complete a USDC Settlement on devnet.
- [x] The Receipt route loads after Settlement and shows the transaction signature.
- [x] Any blocker is recorded below this issue or split into a new issue.

### Notes

Marked complete on 2026-05-04 from owner report: the full Split Mode path was checked in the previous session and works.

### User Stories Covered

1, 2, 5, 12, 13, 14, 15, 18, 25, 26, 31, 32, 33, 34

## FW-002 - Harden Settlement Failure States On Devnet

**Status:** Done  
**Priority:** P0  
**Type:** AFK  
**Blocked by:** FW-001

### What to build

Make Settlement and Contribution preflight states understandable before wallet signing, especially when a Member lacks Solana USDC, lacks SOL for gas, or the recipient token account needs to be created.

### Acceptance Criteria

- [x] Insufficient-USDC state names the missing asset and amount clearly.
- [x] Insufficient-SOL-for-gas state explains that SOL is only needed for transaction fees.
- [x] Recipient token-account creation is described as a one-time setup when applicable.
- [x] Wallet rejection, failed simulation, failed send, and failed receipt verification have distinct user-facing messages.
- [x] The normal successful Settlement path still lands on a Receipt.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-04. Funding-gap copy now points to `Top up to settle` or `Add funds`; transaction simulation, send, confirmation, cancellation, duplicate-recording, and receipt-recording failures now show distinct messages. Successful Settlement still routes to the Receipt page.

### User Stories Covered

14, 18, 19, 20, 33

## FW-003 - Sign Off Responsive QA For The Core Demo Path

**Status:** Done  
**Priority:** P0  
**Type:** HITL  
**Blocked by:** FW-001

### What to verify

Manually test the consumer path at mobile, tablet, and desktop breakpoints, with special attention to wallet gates, modals, join recovery, Settlement Request Links, and Receipt rendering.

### Acceptance Criteria

- [x] Landing page, `/groups`, Group detail, Expense dialog, join flow, Settlement dialog, and Receipt are checked at `375`, `768`, and `1280`.
- [x] Text does not overlap or clip inside buttons, cards, dialogs, or headers.
- [x] Wallet connect CTAs are reachable above the fold on mobile.
- [x] Settlement Request Links restore live settlement context after connect and never auto-send.
- [x] Findings are either fixed immediately or added as new indexed issues.

### Notes

Completed on 2026-05-04. Browser QA covered landing, disconnected `/groups`, wallet modal, `/demo` Expense / Balance / Settlement / Receipt steps, and Group-not-found recovery at mobile, tablet, and desktop breakpoints. Owner previously checked the live connected-wallet Group path; no new blocker was found there. Two demo-story fixes were committed during this pass:

- `fix(demo): format expense amounts correctly`
- `fix(demo): align settlement story with debtor flow`

### User Stories Covered

25, 26, 31, 32, 33, 34

## FW-004 - Polish LI.FI Top Up To Settle Handoff

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-002

### What to build

Make LI.FI a support path for debtors who cannot settle because their funds are off Solana. The user-facing path should say `Add funds` or `Top up to settle`, then return to the same Group Settlement flow.

### Acceptance Criteria

- [x] Insufficient-USDC Settlement state offers `Top up to settle` when LI.FI can help.
- [x] Copy avoids bridge jargon and does not imply cross-chain creditor settlement.
- [x] Route completion returns the debtor to the Group Settlement context.
- [x] The Receipt and ledger model remain unchanged after top-up.
- [x] Mainnet-sensitive warnings and error states are clear.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-04. The LI.FI support path now uses top-up language, closes back to the Group after successful execution, and keeps Settlement / Receipt behavior unchanged.

### User Stories Covered

21, 27, 28

## FW-005 - Add Zerion CLI Wallet-Readiness Support Demo

**Status:** Done  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-002

### What to build

Create a narrow Zerion CLI support demo around wallet readiness and next actions. It should strengthen the settlement story without replacing Solana wallet identity or entering the core Settlement path.

### Acceptance Criteria

- [x] Zerion CLI usage is isolated behind a small boundary or script.
- [x] The demo can analyze a wallet and summarize readiness for FundWise Settlements.
- [x] Output distinguishes missing USDC, missing gas, and broader wallet context when available.
- [x] The feature is framed as support / analysis, not wallet connection.
- [x] Required credentials or CLI setup are documented without inventing secrets.
- [x] `pnpm build` passes after the code/docs change.

### Notes

Completed on 2026-05-04. Shipped as a standalone Node.js wrapper around the official `zerion analyze <address>` CLI:

- Script: `scripts/zerion-readiness.mjs`
- Package script: `pnpm zerion:readiness <address>` (also supports `--json` and `--min-usdc=<n>`)
- Docs: `docs/zerion-readiness.md` (setup, usage, exit codes, optional x402 path)

The script reports USDC on Solana, SOL for gas, and broader wallet context, then prints a `READY` / `NOT READY` verdict with concrete reasons. Exit codes: `0` ready, `1` not ready, `2` setup or invocation error. If the `zerion` CLI is missing it fails fast with a clear install message instead of hiding the error. Auth is pass-through to the CLI via `ZERION_API_KEY`; optional x402 is documented in `docs/zerion-readiness.md` but not required and no secrets are invented. Strictly read-only support tooling — does not connect a wallet, sign transactions, or execute Settlements.

`pnpm build` passed with the same pre-existing warnings noted in STATUS.md (workspace-root inference, two unused eslint-disable directives, bigint pure-JS fallback).

### User Stories Covered

28, 48, 49

## FW-006 - Prepare Judge-Facing Demo Script And Submission Assets

**Status:** Done  
**Priority:** P0  
**Type:** HITL  
**Blocked by:** FW-001, FW-003

### What to produce

Create the script, screenshots, and submission copy around one clear story: private Group, Expense, live Balance, USDC Settlement, Receipt. Sponsor layers should appear only after judges understand the core product.

### Acceptance Criteria

- [x] Demo script fits within the expected submission video length.
- [x] Screenshots cover Group creation, Expense entry, Balance, Settlement, and Receipt.
- [x] Submission copy leads with Visa / consumer payments fit.
- [x] LI.FI is described as `Top up to settle`, not as generic multichain settlement.
- [x] Zerion is described as wallet-readiness support, not wallet auth.
- [x] Fund Mode, Fundy, Agent Skill Endpoint, and Scoped Agent Access are marked as future direction unless actually shipped.

### Notes

Completed on 2026-05-04. See [SUBMISSION.md](./SUBMISSION.md) for the demo script, screenshot checklist, submission copy, track framing, and explicit claims to avoid.

### User Stories Covered

26, 27, 28

## FW-007 - Decide Whether Source Currency And Expense Proof Ship In The Demo

**Status:** Done  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** FW-006

### What to decide

Decide whether Source Currency entry and Expense Proof upload are actual demo features, clickable mockups, or roadmap copy only. Do not partially ship either feature in a way that can corrupt Balance or Settlement math.

### Acceptance Criteria

- [x] Source Currency scope is explicitly marked as future.
- [x] Expense Proof scope is explicitly marked as future.
- [x] If Source Currency ships, every Expense stores converted USD/USDC ledger value plus Exchange Rate Snapshot.
- [x] If Expense Proof ships, file/link storage, preview, and access rules are documented.
- [x] Submission copy matches the actual shipped state.

### Notes

Decision on 2026-05-06: keep both Source Currency and Expense Proof out of the current public demo as real product behavior. They stay future-only until Source Currency has end-to-end Exchange Rate Snapshot persistence and Expense Proof has storage, preview, limits, and access rules. The submission story should not imply either is shipped or clickable unless it is explicitly labeled as future direction.

### User Stories Covered

36, 37, 38, 39

## FW-008 - Fund Mode Proposal Lifecycle

**Status:** Deferred  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** Split Mode mainnet stability

### What to build later

Complete Fund Mode Proposals after Split Mode plus LI.FI are reliable. This is the strongest non-clone product wedge: friends can create a shared USDC Treasury, contribute to it, and release money through explicit Proposal rules.

### Acceptance Criteria

- [ ] Proposal creation, approval, rejection, and execution are complete.
- [ ] Proposer cannot approve their own reimbursement Proposal.
- [ ] Rejection closes the Proposal and retries require a new Proposal.
- [ ] Execution is a separate explicit action after threshold approval.
- [ ] Treasury payout goes to a Member wallet in the first Proposal shape.
- [ ] Contribution, Proposal, execution, and Receipt/history states are clear enough for invite-only beta users.
- [ ] Public docs clearly say Fund Mode is invite-only until this lifecycle is complete.

### User Stories Covered

29, 30

## FW-009 - Fundy, FundWise Agent, And Scoped Agent Access

**Status:** Deferred  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** Split Mode + API contract stability

### What to build later

Build Fundy and agent surfaces only after the shared web app and wallet-bound backend are stable. Fundy is intended to become a personal-finance agent that can manage personal expenses, interact with FundWise Groups, work from Telegram chats, draft Expenses, trigger reminders, run Zerion-backed wallet analysis, and later support tax guidance. Money movement must still be wallet-confirmed unless a later scoped payable Settlement flow explicitly grants narrow authority.

### Acceptance Criteria

- [x] Baseline public `https://fundwise.fun/skill.md` endpoint exists and returns machine-readable markdown.
- [ ] Docs distinguish the shipped Agent Skill Endpoint from planned Scoped Agent Access and planned payment authority.
- [ ] Scoped Agent Access supports expiring, revocable capabilities tied to Member wallet, Group, and action type.
- [ ] Fundy repo/runtime decision is consistent across docs: separate repo vs monorepo path must not conflict.
- [ ] Telegram-to-wallet linking uses web-generated short-lived codes in DM.
- [ ] Fundy can read Balances, Expenses, Settlements, and Receipts, and create draft-safe actions before any on-chain execution path.
- [ ] On-chain Settlement, Contribution, and Proposal execution deep-link back to the web app for wallet confirmation.

### User Stories Covered

40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50

## FW-010 - Payable Settlement Requests, Invoice / Receipt Endpoint, And Agent Spending Policies

**Status:** Deferred  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** Scoped Agent Access

### What to build later

Design and implement the agent-payable endpoint surface for x402 / MPP-style Settlement Requests. Agents should be able to discover a payable request, receive a machine-readable invoice or payment challenge, pay within an explicit Spending Policy, and retrieve a verified Receipt only after FundWise confirms the payment.

### Acceptance Criteria

- [ ] Terminology is locked: unpaid invoice/request vs payment challenge vs verified Receipt.
- [ ] A Receipt is never created before verified payment proof or confirmed on-chain transfer.
- [ ] Payable requests resolve live Group Balance and expire quickly to avoid stale amounts.
- [ ] Agent Spending Policies enforce per-Settlement cap, daily cap, Group scope, counterparty scope, USDC-only asset scope, expiry, revocation, and human fallback.
- [ ] Endpoint candidates from the planning notes are validated or replaced with a tighter interface.
- [ ] x402 middleware behavior is documented and limited to payable agent routes.
- [ ] MPP `x-payment-info` OpenAPI extensions are documented for payable operations only.
- [ ] ACP discovery is either published for a real commerce API or explicitly deferred as not applicable to the current free Split Mode surface.

### User Stories Covered

41, 42, 43, 50, 51, 52, 53, 54

## FW-011 - Define Monetization Model And Finance Analysis

**Status:** Done  
**Priority:** P1  
**Type:** HITL  
**Blocked by:** Owner decision

### What to decide

Create a concrete monetization model that keeps Split Mode attractive as a free acquisition loop while defining how FundWise and Fundy can become sustainable. The current candidate paths are: free Split Mode, optional Settlement transaction fee, Fund Mode fee or subscription, Fundy wallet top-up commissions, payment-rail/card partner revenue, and possibly premium finance analysis.

### Acceptance Criteria

- [x] Decide whether Split Mode Settlements stay free or include a tiny fee.
- [x] Model Fund Mode monetization: flat subscription, Treasury percentage, per-Proposal fee, or hybrid.
- [x] Model Fundy monetization: wallet top-up commission, agent wallet balance, premium personal-finance features, and tax-advisory upsell.
- [x] Estimate user tolerance for each fee type and identify which fees would hurt growth.
- [x] Define a “free forever” surface that can acquire early crypto-native users.
- [x] Add a simple first-year revenue scenario with conservative assumptions.
- [x] Update public docs/submission only after the model is chosen.

### Notes

Decision on 2026-05-06: Split Mode stays free for launch, including normal USDC Settlements. Do not ship a FundWise Settlement fee in the hackathon demo or first mainnet Split Mode launch. Fund Mode subscriptions, Fundy premium, and partner/top-up/card rails are the monetization surfaces to explore. See `docs/monetization.md`.

### User Stories Covered

26, 28, 40, 45, 54

## FW-012 - Clean Shipped-vs-Planned Docs And Messaging Drift

**Status:** Done  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-007, FW-011

### What to fix

Create a docs cleanup pass that does not add new product scope. The goal is to make README, STATUS, ROADMAP, PRD, SUBMISSION, and review language agree on what is live, what is demo-only, what is planned, and what is speculative.

### Acceptance Criteria

- [x] Add or update a shipped/planned matrix: Split Mode, Fund Mode, LI.FI, Zerion, Agent Skill Endpoint, Scoped Agent Access, Payable Settlement Requests, Fundy, Visa / IBAN / Altitude top-ups, mini-games, and tax.
- [x] Pick one canonical LI.FI phrase: `Top up to settle` or `Route funds for Settlement`, then make docs and UI copy consistent.
- [x] Resolve Fundy runtime/repo inconsistency: older docs mention `services/fundy/` monorepo; newer roadmap says separate repo.
- [x] Clarify that `/skill.md` baseline exists, while Scoped Agent Access and agent-paid Settlements remain planned unless implemented.
- [x] Clarify that Visa / IBAN / Altitude-style top-up is a future onboarding path for non-crypto users, not current MVP functionality.
- [x] Remove or archive stale claims that imply Fund Mode Proposals, Fundy, autonomous agent payments, or card/IBAN top-ups are shipped.
- [x] Keep the primary public story focused on Split Mode until mainnet launch.

### Notes

Completed on 2026-05-06. The canonical state now lives in `docs/shipped-vs-planned.md`; README, STATUS, ROADMAP, PRD, HACKATHON_PLAN, and SUBMISSION were tightened around free Split Mode, future Source Currency / Expense Proof, planned Fundy / Scoped Agent Access / Payable Settlement Requests, future rails, and mini-games being out of scope for FundWise.

### User Stories Covered

26, 27, 28, 40, 41, 50, 51

## FW-013 - Decide Fund Mode Mini-Games Scope And Prediction-Market Boundary

**Status:** Done  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** FW-008

### What to decide

The owner considered future Fund Mode Groups with private mini-games or Group activities funded from a shared pool, possibly including prediction-market-like mechanics. This is now explicitly excluded from FundWise scope because the repo previously pivoted away from prediction-market code and the primary payments story should not be contaminated by speculative game mechanics.

### Acceptance Criteria

- [x] Decide whether mini-games are in scope at all for FundWise or belong in a separate product/module.
- [x] If retained, define the first harmless mini-game shape without regulated prediction-market or gambling risk.
- [x] Confirm that mini-games do not ship before Fund Mode Proposal safety is complete.
- [x] Keep mini-games out of Split Mode and out of the hackathon submission story.
- [x] Add a future ADR only if the decision is hard to reverse, surprising, and a real trade-off.

### Notes

Decision on 2026-05-06: mini-games and prediction-market-like mechanics are out of scope for FundWise. Do not include them in Split Mode, Fund Mode beta, the hackathon submission, or near-term docs. If the owner revisits this, treat it as a separate product/module decision after Fund Mode Proposal safety is complete.

### User Stories Covered

29, 30

## FW-014 - Lock Down Anonymous Supabase Ledger Access

**Status:** Done  
**Priority:** P0  
**Type:** AFK  
**Blocked by:** None

### What to fix

The CSO audit verified that the live Supabase REST API allows anonymous reads of private Group and Expense ledger rows with the public publishable key, and anonymous insert attempts reach database constraints instead of being rejected by RLS.

### Acceptance Criteria

- [x] Public anon REST can no longer read private ledger tables: `groups`, `members`, `expenses`, `expense_splits`, `settlements`, `contributions`, `proposals`, and `proposal_approvals`.
- [x] Public anon REST insert/update attempts are denied by RLS before reaching table constraints.
- [x] The app still loads Groups, ledgers, Expenses, Receipts, Settlements, and Contributions through the protected HTTP API routes.
- [x] Invite-code lookup still works through `/api/groups?code=...` without exposing full ledger tables directly.
- [x] A Supabase migration captures the policy change.
- [x] `pnpm build` passes.

### Notes

Created from CSO finding `FW-CSO-001` on 2026-05-06. Treat this as a mainnet blocker and fix before further demo data is entered.

Completed on 2026-05-06 after the owner applied the SQL in the Supabase editor. Anonymous REST verification with the public publishable key now returns zero rows for `groups` and `expenses`, and an anonymous invalid `groups` insert is rejected with RLS error `42501` before table constraints.

### User Stories Covered

1, 2, 12, 13, 15, 16, 31, 32, 33

## FW-015 - Validate Expense Ledger Amounts And Split Shares Server-Side

**Status:** Done  
**Priority:** P0  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

Expense create/update routes currently trust caller-supplied numeric `amount` and `splits`. A valid Member can submit mismatched, negative, unsafe, or otherwise ledger-corrupting values outside the UI.

### Acceptance Criteria

- [x] Server-side create and update reject non-integer, unsafe, zero, or negative Expense amounts.
- [x] Server-side create and update reject negative or unsafe split shares.
- [x] Server-side create and update require split shares to sum exactly to the Expense amount.
- [x] Server-side create and update reject duplicate split wallets.
- [x] Expense mint must match the Group stablecoin mint.
- [x] Database constraints protect new rows from invalid positive/non-negative amounts.
- [x] Tests cover malformed Expense amount and split cases.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-06. Server mutations now validate positive safe-integer Expense amounts, non-negative safe-integer split shares, exact split totals, unique split wallets, and Group stablecoin mint match before insert/update. Added new Expense ledger constraints and unit tests.

### User Stories Covered

5, 6, 7, 8, 9, 10, 11, 12, 13

## FW-016 - Require Settlements To Match The Live Settlement Graph

**Status:** Done  
**Priority:** P0  
**Type:** AFK  
**Blocked by:** FW-015

### What to fix

Settlement receipt recording verifies that a real USDC transfer happened, but it does not verify that the transfer corresponds to the debtor's current live Settlement edge in the Group.

### Acceptance Criteria

- [x] `POST /api/settlements` recomputes the current Group Balance and simplified Settlement graph before recording a Receipt.
- [x] The route rejects transfers where sender, recipient, or amount do not exactly match a current suggested Settlement edge.
- [x] Stale Settlement Request Links cannot record overpayments, unrelated transfers, or transfers in the wrong direction.
- [x] On-chain transfer verification still runs before persistence.
- [x] Tests cover a valid edge and at least one invalid edge.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-06. Settlement recording now asserts an exact current simplified-graph edge before and after on-chain transfer verification, so stale, wrong-direction, unrelated, or overpaid transfers are rejected before Receipt persistence. If partial Settlements become product scope later, this issue must be revisited with explicit cap rules.

### User Stories Covered

14, 15, 16, 17, 18, 33

## FW-017 - Triage Dependency Audit Advisories

**Status:** Done  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

`pnpm audit --audit-level moderate` reports 26 advisories, including Solana transitive `bigint-buffer`, Vercel/Cloudflare tooling `tar` and `undici`, PostCSS, AJV, esbuild, and uuid advisories.

### Acceptance Criteria

- [x] Update safe direct dependencies where patched versions are available.
- [x] Document advisories that are transitive with no patched path yet.
- [x] Confirm deploy/build tooling updates do not break Cloudflare Pages output.
- [x] `pnpm audit --audit-level moderate` is clean or remaining advisories are explicitly accepted with rationale.
- [x] `pnpm build` passes.

### Notes

Created from CSO finding `FW-CSO-004` on 2026-05-06. This is important but below the immediate ledger integrity fixes.

Completed on 2026-05-11 on `checklist` branch. Added safe pnpm overrides for patched transitive `postcss`, `uuid`, and `ajv` paths, then documented remaining accepted advisories in `docs/dependency-audit.md`. `pnpm audit --audit-level moderate` now reports 23 advisories (down from 26): unpatched Solana `bigint-buffer`, plus Cloudflare/Vercel build-tooling `tar`, `undici`, and `esbuild` paths that cannot be fully patched without moving off deprecated `@cloudflare/next-on-pages` / changing its Vercel peer contract. `pnpm test`, `pnpm build`, and `pnpm build:pages` passed.

### User Stories Covered

26

## FW-018 - Add Production Browser Security Headers

**Status:** Done  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

The app does not currently configure browser hardening headers such as `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, or CSP.

### Acceptance Criteria

- [x] Add baseline security headers in Next or Cloudflare configuration.
- [x] Do not break wallet-adapter, QR scanning, Supabase, LI.FI, or analytics behavior.
- [x] Roll out CSP only after testing required wallet and third-party domains.
- [x] `pnpm build` passes.

### Notes

Created from CSO finding `FW-CSO-005` on 2026-05-06.

Completed on 2026-05-11 on `checklist` branch. `next.config.mjs` now applies baseline security headers to all routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy` that still allows camera and clipboard for QR/share flows, and production-only HSTS. CSP is implemented but opt-in behind `FUNDWISE_ENABLE_CSP=true`; the policy allowlists Supabase, Solana RPC/Helius, LI.FI, Zerion, and `open.er-api.com`, plus configured primary/fallback RPC and Supabase origins. Keeping CSP disabled by default avoids breaking wallet-adapter, QR scanning, or third-party route flows before browser QA. `pnpm build` passed.

### User Stories Covered

25, 26

## FW-019 - Verify Fund Mode Treasury Addresses On-Chain Before Persistence

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-014

### What to fix

The pentest pass found that `PATCH /api/groups/{groupId}/treasury` requires the creator's wallet session, but then persists caller-supplied `multisigAddress` and `treasuryAddress` without an RPC proof that the Squads multisig exists or that the Treasury is the expected vault PDA. A malicious or buggy creator client can store arbitrary Treasury addresses for a Fund Mode Group, causing future Contributions to verify and record against the wrong destination.

### Acceptance Criteria

- [x] Treasury initialization API accepts a creation transaction signature or equivalent proof, not just raw addresses.
- [x] Server verifies the Squads multisig account exists on the configured Solana cluster.
- [x] Server derives vault index `0` from the verified multisig PDA and rejects mismatched `treasuryAddress` values.
- [x] Server verifies the submitted creator wallet participated in the creation path or is a configured Squads Member.
- [x] Contributions continue to verify SPL transfers to the verified Treasury token account owner.
- [x] Tests cover forged Treasury addresses, nonexistent multisigs, and the valid initialization path.
- [x] `pnpm build` passes.

### Notes

Created from AI pentest / blockchain audit on 2026-05-06. Evidence: `app/api/groups/[groupId]/treasury/route.ts` lines 21-34 checked presence and wallet-session match only; `lib/server/fundwise-mutations.ts` lines 696-726 updated both addresses without RPC verification. The UI calls `createSquadsMultisig`, but this is not a security boundary because the API is directly callable.

Completed on 2026-05-08. `updateGroupTreasuryMutation` now rejects invalid public keys, rejects re-initialization, derives Squads vault index `0`, verifies the submitted Treasury address matches that PDA, requires the Multisig account to exist on the configured RPC, requires Squads program ownership, rejects executable accounts, decodes the Squads Multisig account data, and confirms the authenticated creator wallet is a configured Squads Member before persisting the addresses. This is the equivalent on-chain proof used instead of requiring the client to submit a separate creation transaction signature. Focused test: `pnpm test tests/fundwise-mutations.test.ts` passed with 13 tests. Full gate: `pnpm build` passed.

### User Stories Covered

29, 30

## FW-020 - Remove Legacy SOL Vault Helpers From Squads Fund Mode Code

**Status:** Done
**Priority:** P2  
**Type:** AFK  
**Blocked by:** FW-019

### What to fix

`lib/squads-multisig.ts` still exports legacy SOL helpers (`payToSquadsVault`, `withdrawFromSquadsVault`, `getVaultBalance`, `solToLamports`, `lamportsToSol`) that use `SystemProgram.transfer` and lamports. FundWise's money model is stablecoins-only, with SOL only for gas, so these helpers are a future integration footgun even though current UI paths use `contributeStablecoinToTreasury`.

### Acceptance Criteria

- [x] Remove unused SOL vault payment and withdrawal helpers, or move them to clearly non-shipped archive code outside the app bundle.
- [x] Remaining Fund Mode Treasury helpers only handle stablecoin Contributions and stablecoin balance reads.
- [x] No app, hook, or API route imports SOL vault payment or withdrawal helpers.
- [x] `pnpm build` passes.

### Notes

Created from AI pentest / blockchain audit on 2026-05-06. Evidence: `lib/squads-multisig.ts` lines 172-258 transfers SOL to the vault; lines 299-484 create SOL withdrawal proposals and auto-execute for `1/1` multisigs. `rg` found no current caller for these helpers, so this is not an active exploit path today.

Completed on 2026-05-09. `lib/squads-multisig.ts` now exposes Squads Multisig creation, stablecoin Contribution transfer, and stablecoin Treasury balance reads only. The legacy SOL vault payment, SOL withdrawal proposal, SOL vault balance, and SOL/lamport conversion exports were removed from the app bundle. Verification: `rg` found no remaining imports of those removed helpers, and `pnpm build` passed.

### User Stories Covered

29, 30

## FW-021 - Validate LI.FI Top-Up Amount Parsing Before Quote Execution

**Status:** Done  
**Priority:** P2  
**Type:** AFK  
**Blocked by:** FW-004

### What to fix

`getBridgeQuote` converts the human USDC amount with `parseFloat(params.fromAmount) * 1e6` before calling LI.FI. That accepts malformed strings and can produce unsafe, rounded, exponential, or non-finite values. This is a support path rather than the core Settlement ledger, but it can still create bad quotes or confusing wallet prompts.

### Acceptance Criteria

- [x] Add a shared USDC amount parser for LI.FI top-up inputs that rejects malformed strings, non-finite numbers, zero/negative values, more than six decimals, and unsafe integer raw amounts.
- [x] Use integer string math instead of floating point for `fromAmount`.
- [x] UI shows a clear validation error before requesting a LI.FI quote.
- [x] Tests cover malformed, fractional, too-precise, and valid top-up amounts.
- [x] `pnpm build` passes.

### Notes

Created from AI pentest on 2026-05-06. Evidence: `lib/lifi-bridge.ts` lines 47-55 builds the quote amount with `parseFloat`; `components/cross-chain-bridge-modal.tsx` lines 89-103 forwards the raw input string to `getBridgeQuote`.

### User Stories Covered

21, 27, 28

## FW-022 - Retire Direct Browser Supabase Ledger Helpers After RLS Lockdown

**Status:** Done  
**Priority:** P2  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

After FW-014, direct browser Supabase reads should no longer be part of the ledger access model. `lib/db.ts` still keeps direct `supabase.from(...)` helpers for profiles, Expenses, splits, and Settlements. Current main UI paths use HTTP APIs, but these helpers now either fail under RLS or invite future agents to reintroduce public anon-table access assumptions.

### Acceptance Criteria

- [x] Remove unused direct browser Supabase ledger helpers from `lib/db.ts`, or rewrite them to call protected HTTP APIs.
- [x] Keep invite-code lookup and dashboard reads on server-backed routes only.
- [x] Ensure no browser component imports the raw `supabase` client for private ledger tables.
- [x] `pnpm build` passes.

### Notes

Created from AI pentest on 2026-05-06. Evidence: `lib/db.ts` lines 110-145 reads `profiles`; lines 208-238 reads `expenses` and `expense_splits`; lines 287-295 reads `settlements` through the public Supabase client. `rg` currently shows the main app path mostly uses the HTTP wrappers, so this is a cleanup/hardening issue rather than a currently exploitable data leak after FW-014.

### User Stories Covered

1, 2, 12, 13, 15, 16, 31, 32, 33

## FW-023 - Add Wallet-Session Abuse Controls And Origin Binding

**Status:** Done  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

Wallet challenge and verification endpoints are simple and correct for the current MVP, but they have no rate limits and the signed message is not explicitly bound to the deployment origin or Solana cluster. This is not a direct bypass because challenges are nonce-backed and HMAC-bound to httpOnly cookies, but production should add abuse controls before public launch traffic.

### Acceptance Criteria

- [x] Rate-limit `/api/auth/wallet/challenge` and `/api/auth/wallet/verify` by IP and wallet address.
- [x] Include deployment origin and Solana cluster in the wallet challenge message.
- [x] Consider `__Host-` cookie names for production session cookies where deployment constraints allow it.
- [x] Add tests for challenge mismatch, expired challenge, invalid signature, and origin/cluster message formatting.
- [x] `pnpm build` passes.

### Notes

Created from AI pentest on 2026-05-06. Evidence: `app/api/auth/wallet/challenge/route.ts` lines 11-26 issues challenges without throttling; `lib/server/wallet-session.ts` lines 156-166 builds the message without origin or cluster fields.

Completed on 2026-05-11 on `checklist` branch. Added in-memory Edge-compatible rate limits keyed by IP and wallet for challenge and verify endpoints, normalized wallet addresses before issuing/verifying challenges, bound signed messages to request origin and current Solana cluster, rejected origin/cluster replay during verification, and switched production cookie names to `__Host-fundwise_wallet_challenge` / `__Host-fundwise_wallet_session` while retaining dev cookie names locally. Added `tests/wallet-session.test.ts` for message formatting, origin mismatch, cluster mismatch, expired signed cookie payloads, invalid signatures, IP extraction, and rate-limit bucket behavior. `pnpm test` and `pnpm build` passed.

### User Stories Covered

25, 26, 31, 32, 33

## FW-033 - Cluster-Aware Stablecoin Mints

**Status:** Done
**Priority:** P0
**Type:** AFK
**Blocked by:** None

### What to build

Split the hardcoded devnet `STABLECOIN_MINTS` map in `lib/expense-engine.ts` into a `{ devnet, mainnet }` shape keyed by `getFundWiseClusterName()`. Fix the PYUSD devnet/mainnet mints so they are correct on both clusters.

### Acceptance Criteria

- [x] `STABLECOIN_MINTS` is selected per cluster, not hardcoded.
- [x] Mainnet USDC mint = `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
- [x] Mainnet PYUSD mint = `2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo`.
- [x] Mainnet USDT mint = `Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ`.
- [x] Devnet mints remain unchanged for Fund Mode beta.
- [x] `DEFAULT_STABLECOIN` returns the cluster-appropriate USDC.
- [x] Audit query identifies any existing `groups.stablecoin_mint` rows that would be stranded by the switch; documented in `docs/split-mode-mainnet-checklist.md` Phase 1.
- [x] `pnpm build` and `pnpm test` pass.

### Notes

Completed on 2026-05-11 on `checklist` branch. New exports in `lib/expense-engine.ts`:

- `STABLECOIN_MINTS_BY_CLUSTER` — `{ devnet, mainnet-beta, custom }` maps
- `getStablecoinMintsForCluster(cluster?)` — resolves mints for the given cluster (default: current deployment)
- `getDefaultStablecoinForCluster(cluster?)` — USDC for the cluster
- `findStablecoinByMint(mintAddress)` — searches across both clusters; used wherever a Group's stored mint needs metadata
- `getClusterForGroupMode(mode)` — forces devnet for `mode === "fund"`, deployment cluster otherwise
- `getDefaultStablecoinForGroupMode(mode)` — picks the right USDC for new Groups
- Legacy `STABLECOIN_MINTS` / `DEFAULT_STABLECOIN` exports remain and resolve to the deployment's primary cluster at module load — still used by fallback paths in `app/groups/[id]/page.tsx` and `hooks/use-group-dashboard.ts`.

Callers updated: `app/groups/page.tsx` (Group creation now uses `getDefaultStablecoinForGroupMode`, and `getMintName` uses `findStablecoinByMint`), `app/groups/[id]/settlements/[settlementId]/page.tsx` (metadata lookup via `findStablecoinByMint`), `hooks/use-group-dashboard.ts` (metadata lookup via `findStablecoinByMint`). Per-Group RPC routing (so a Fund Mode Group on a mainnet deployment actually talks to a devnet RPC) is intentionally out of scope for FW-033 and tracked in FW-035.

Focused test: `pnpm test` 89 passed (20 new cluster-aware mint tests added to `tests/expense-engine.test.ts`). Full gate: `pnpm build` passed.

## FW-034 - Cluster Badge In Header

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-033

### What to build

Add a small badge in the app header showing the current Solana cluster (`mainnet` green, `devnet` orange, `custom RPC` gray). Visible on every authenticated page so users know which network they're on, especially when switching between Split Mode (mainnet) and Fund Mode (devnet) Groups.

### Acceptance Criteria

- [x] Badge reads cluster from `getFundWiseClusterName()` and updates per-Group when cluster differs.
- [x] Badge is visible on `/groups`, `/groups/[id]`, and Receipt pages.
- [x] Tooltip on hover explains what the network means.
- [x] No layout regression at `375`, `768`, `1280` (additive color + tooltip only; preserves `min-h-9`/`rounded-full`/padding from the prior badge — owner should still eyeball it after the next deploy).
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-11 on `checklist` branch. Header now extracts a `ClusterBadge` component that color-codes by cluster (mainnet → emerald, devnet → amber, custom → muted) and renders a Radix Tooltip explaining the network. `Header` accepts an optional `cluster` prop so per-Group pages can override the deployment default — `app/groups/[id]/page.tsx` and `app/groups/[id]/settlements/[settlementId]/page.tsx` pass `getClusterForGroupMode(group.mode)` so Fund Mode Groups visibly show devnet even on a mainnet deployment. Other pages fall back to `getFundWiseClusterName()` (deployment cluster). `pnpm build` and `pnpm test` (89 passed) both green.

## FW-035 - Multi-RPC Fallback With Helius Primary

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Replace the single `NEXT_PUBLIC_SOLANA_RPC_URL` with a primary + optional fallback list. On RPC error, automatically retry the request against the next URL in the list.

### Acceptance Criteria

- [x] `NEXT_PUBLIC_SOLANA_RPC_URL` remains the primary.
- [x] New env var `NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS` accepts comma-separated URLs.
- [x] Connection helper in `lib/fallback-connection.ts` wraps every method via a Proxy. Retries triggered on retriable RPC errors (HTTP 408/425/429/500/502/503/504, common rate-limit / timeout / network error patterns in the message, and `ECONNRESET` / `ETIMEDOUT` / `ENOTFOUND` codes). Single-endpoint case bypasses the proxy entirely.
- [x] Fallback logged via `console.warn`, not surfaced to user UI.
- [x] Tests cover primary success, primary fail + fallback success, all-fail, non-retriable error (no retry), and the error-classification helper itself.
- [x] `pnpm build` and `pnpm test` (100 passed) green.

### Notes

Completed on 2026-05-11 on `checklist` branch. New module `lib/fallback-connection.ts` exports `createFundWiseConnection(commitment, options?)`. Options surface a `connectionFactory` + `onFallback` callback for testing. `lib/solana-cluster.ts` gains `getSolanaRpcFallbackUrls()` and `getSolanaRpcUrls()` (dedups primary if it also appears in fallbacks). All seven `new Connection(...)` call sites in the app now route through `createFundWiseConnection`: `lib/expense-engine.ts`, `lib/stablecoin-transfer.ts`, `lib/simple-payment.ts`, `lib/squads-multisig.ts`, `lib/server/solana-transfer-verification.ts`, and both `accountReader` default args in `lib/server/fundwise-mutations.ts`. Solana transaction submission via the same primary is safe to retry because Solana dedups by signature within blockhash validity.

Helius stays primary; configure additional fallbacks at deploy time by setting `NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS=https://triton.example,https://quicknode.example`.

## FW-036 - Footer Social Links + Legal Nav Scaffold

**Status:** Done
**Priority:** P2
**Type:** AFK
**Blocked by:** None

### What to build

Extend `components/footer.tsx` with X (`https://x.com/funddotsol`) and Telegram (`https://t.me/funddotsol`) social links, and a legal nav row pointing to placeholder pages for Privacy, Terms, and Disclosures.

### Acceptance Criteria

- [x] Footer shows X + Telegram links with accessible labels (`aria-label`, visible icon optional).
- [x] Footer shows Privacy / Terms / Disclosures links pointing to `/legal/privacy`, `/legal/terms`, `/legal/disclosures`.
- [x] External links open in a new tab with `rel="noopener noreferrer"`.
- [x] Layout responsive at `375`, `768`, `1280` (additive flex-wrap row layout, owner to spot-check after next deploy).
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-11 on `checklist` branch. Footer now has three rows: product nav (existing), Community section with X + Telegram external links (target=_blank, noopener noreferrer, aria-label), and Legal section with internal links to /legal/privacy, /legal/terms, /legal/disclosures. Copyright line moved into the top row.

## FW-037 - Privacy / Terms / Disclosures Draft Pages

**Status:** Done
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-036

### What to build

Create draft Privacy Policy, Terms of Service, and Disclosures pages. **Not legally reviewed.** Each page has a banner at the top: "Draft v0 — pending legal review. Not yet binding." Content follows the structure outlined in `docs/split-mode-mainnet-checklist.md` Phase 1.

### Acceptance Criteria

- [x] `/legal/privacy`, `/legal/terms`, `/legal/disclosures` exist with draft content.
- [x] Each page has the "Draft v0" banner (shared via `app/legal/layout.tsx`).
- [x] Privacy covers: wallet identity, data collected (display name, group/expense data, session cookies), data not collected (private keys, KYC), third parties (Supabase, Cloudflare, Helius, LI.FI, Zerion), user rights (delete, export), contact channel.
- [x] Terms covers: non-custodial nature, third-party assets (USDC, Solana), user responsibilities, prohibited uses, disclaimer of warranties, limitation of liability, governing law placeholder, modification process.
- [x] Disclosures covers: smart contract risk, USDC depeg risk, network risk, fee responsibility, no FDIC insurance, beta status of Fund Mode.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-11 on `checklist` branch. Three pages under `app/legal/` share an `app/legal/layout.tsx` that renders Header + Footer + a persistent amber "Draft v0 — pending legal review" banner with a Telegram contact link. Pages use Tailwind `prose` for readable typography. Build shows three new static routes: `/legal/privacy`, `/legal/terms`, `/legal/disclosures`. Lawyer review remains deferred per owner direction; final binding text replaces these drafts before mainnet launch.

## FW-038 - Production Supabase Project + RLS Migration Replay

**Status:** Done
**Priority:** P0
**Type:** HITL
**Blocked by:** FW-014

### What to do

Spin up a separate Supabase project for mainnet (`fundwise-prod`), distinct from the existing devnet beta project. Replay all schema migrations + RLS lockdown SQL. Verify anonymous reads are denied. Verify RPC grants and Settlement idempotency hardening. Rotate `SUPABASE_SERVICE_ROLE_KEY` and `FUNDWISE_SESSION_SECRET` for prod.

### Acceptance Criteria

- [ ] New Supabase project created; URL + keys captured for prod env vars.
- [ ] All migrations from `supabase/migrations/` replayed in order.
- [x] FW-014 RLS lockdown SQL applied; anonymous REST returns zero rows for private tables.
- [x] `settlements.tx_sig` is protected by a unique index.
- [x] `record_settlement_locked` and `update_expense_with_splits` expose `EXECUTE` only to `postgres` and `service_role`.
- [ ] Daily backup confirmed enabled.
- [ ] Service role key + session secret rotated, distinct from devnet.
- [ ] Cloudflare Pages prod env vars updated to point at new project.
- [ ] Devnet beta Supabase project keys remain untouched.
- [x] Documented in `docs/ops-runbook.md`.

### Notes

This is HITL because it requires owner access to Supabase and Cloudflare dashboards. Mainnet blocker.

2026-05-11 prep completed on `checklist` branch: added `docs/ops-runbook.md` with production Supabase creation, migration replay, backup/restore, Cloudflare env, and mainnet rehearsal gates; added `scripts/verify-supabase-rls.mjs` plus `pnpm supabase:verify-rls` to verify anonymous private-ledger reads are empty and anonymous `groups` insert is denied by RLS before constraints. The script auto-loads `.env.local` for local checks without printing secrets. Verified against the currently configured devnet Supabase project: RLS verification passed. `pnpm test` and `pnpm build` passed. Owner still needs to create/configure the prod Supabase project and Cloudflare env vars.

2026-05-14 live hardening completed through Supabase SQL Editor against the configured project: `pnpm supabase:verify-rls` passed, `settlements_tx_sig_unique` exists, and both sensitive RPCs now grant `EXECUTE` only to `postgres` and `service_role`. The manual SQL was captured across `supabase/migrations/20260514102502_harden_supabase_rpc_and_settlement_ids.sql`, `supabase/migrations/20260514104435_add_record_settlement_with_lock.sql`, and ADR-0030. Remaining HITL is confirming this project is the separate production project, then wiring Cloudflare prod env, backup, RPC, and session-secret values.

## FW-039 - Mainnet Rehearsal With Real USDC

**Status:** Ready
**Priority:** P0
**Type:** HITL
**Blocked by:** FW-033, FW-035, FW-038

### What to verify

Run the 17-step mainnet test plan from `docs/split-mode-mainnet-checklist.md` Phase 4 with two real mainnet wallets funded with ~$5 USDC + ~$1 SOL each. Capture tx signatures, screenshots, and any failure modes. Sepolia is not an accepted LI.FI rehearsal path; the route proof must be a tiny mainnet EVM USDC route into Solana USDC.

### Acceptance Criteria

- [ ] All 17 steps in the checklist pass.
- [ ] Real USDC transfer confirmed on Solana mainnet explorer.
- [ ] Receipt page shows mainnet explorer URL (no `?cluster=` suffix).
- [ ] Settlement Request Link flow works on mainnet.
- [ ] Insufficient-USDC / insufficient-SOL / first-ATA preflight states behave correctly.
- [ ] Wallet rejection mid-flow recovers gracefully.
- [ ] `pnpm lifi:readiness` passes immediately before the mainnet route proof.
- [ ] LI.FI `Route funds for Settlement` verified with a tiny mainnet EVM USDC route; prefer Base or Optimism to minimize gas.
- [ ] All findings either fixed or split into new indexed issues.

## FW-040 - Update Public Copy After Mainnet Launch

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-039

### What to update

After mainnet rehearsal passes, update `README.md`, `STATUS.md`, `docs/shipped-vs-planned.md`, and landing copy to reflect that Split Mode is live on mainnet. Keep Fund Mode language as "devnet beta, invite-only".

### Acceptance Criteria

- [ ] README updated.
- [ ] STATUS updated (TL;DR + Phase header).
- [ ] `docs/shipped-vs-planned.md` updated.
- [ ] Landing page hero + claims aligned.
- [ ] Footer copyright year correct.
- [ ] `pnpm build` passes.

## FW-041 - Minimal OFAC SDN Screening On Wallet Connect

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-014

### What to build

Block sanctioned wallets at login by comparing the connecting wallet address against the public OFAC SDN list (e.g. ultrasoundmoney/sanctioned-addresses on GitHub). This is a cheap defensive measure, not a full compliance program.

### Acceptance Criteria

- [x] Wallet connect / verify flow checks address against an in-memory SDN list at app startup.
- [x] If matched, block with a clear "this wallet is not supported" message.
- [x] SDN list source documented (URL + refresh cadence).
- [x] Unit test covers a known SDN address and a known clean address.
- [x] `pnpm build` passes.

### Notes

Per owner direction, lawyer review is deferred. This is a minimal good-faith measure for mainnet launch.

Completed on 2026-05-11 on `checklist` branch. Added `lib/server/sanctions-screening.ts` with an in-memory Solana wallet set sourced from OFAC SDN XML (`https://www.treasury.gov/ofac/downloads/sdn.xml`, field `Digital Currency Address - SOL`, checked 2026-05-11). `POST /api/auth/wallet/challenge` now normalizes the Solana wallet and blocks listed wallets with a generic 403 before issuing a challenge. Added `docs/sanctions-screening.md` with source, runtime behavior, limitations, and refresh cadence. Added `tests/sanctions-screening.test.ts` covering the known OFAC SOL address and a clean address. `pnpm test` and `pnpm build` passed.

## FW-042 - Pool Templates At Fund Mode Group Creation

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Add quick-start templates to Fund Mode Group creation: `Trip pool`, `Friend fund`, `DAO grant`, `Family budget`. Each preselects a threshold suggestion, sample memo, and role hints. Reduces first-time UX cliff.

### Acceptance Criteria

- [x] Template selector visible during Fund Mode Group creation only.
- [x] Selecting a template prefills threshold suggestion (e.g. `Friend fund` defaults to majority+1).
- [x] Templates have a "no template" / "custom" fallback.
- [x] Template choice stored on the Group row for future analytics.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-11 on `checklist` branch. Added `lib/fund-mode-templates.ts` with `Trip pool`, `Friend fund`, `DAO grant`, and `Family budget` presets, each carrying an approval-threshold suggestion, default memo, and role hint. Fund Mode Group creation now shows a template selector only after Fund Mode is selected; `Custom` is the no-template fallback, and choosing a template prefills the approval threshold. Added `groups.group_template` via migration `20260511150000_add_fund_mode_template_to_groups.sql`, updated database types, API input, browser wrapper, and server mutation validation/persistence. `pnpm test` and `pnpm build` passed.

## FW-043 - Treasury Overview Card On Fund Mode Dashboard

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Add a single-screen "pool state" overview card to Fund Mode Group dashboard: available balance, pending proposal count badge, last 5 events, top 3 contributors. No drilling.

### Acceptance Criteria

- [x] Card appears at the top of Fund Mode Group dashboard.
- [x] Shows live USDC balance from Treasury vault.
- [x] Shows pending proposal count with click-through to proposals list.
- [x] Shows last 5 activity events (contribution, proposal, approval, execution).
- [x] Shows top 3 contributors by total contribution amount.
- [x] Responsive at `375`, `768`, `1280`.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-13 on `checklist` branch. Added `components/group-dashboard/treasury-overview-card.tsx` and wired it into the Fund Mode dashboard above Treasury initialization, Contributions, and reimbursement Proposals. The card summarizes available Treasury balance, funding progress, pending and approved Proposal totals, top contributors, and the five most recent Contribution / Proposal / review / execution events. Pending Proposal summary scrolls to the Proposal list, and `Reimburse me` preselects the connected Member before focusing the Proposal amount field. `pnpm lint`, `pnpm test`, and `pnpm build` passed; lint still reports two pre-existing `router` dependency warnings in `hooks/use-group-dashboard.ts`.

## FW-044 - Auto-Suggested Reimbursement Proposals From Member Expenses

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

When a Member logs an expense in a Fund Mode Group with a "pay from pool" flag, the dashboard surfaces a one-click "Propose reimbursement for $X" with memo + amount pre-filled. Closes the Split-Mode-style log → reconcile loop for pools.

### Acceptance Criteria

- [ ] Fund Mode expense entry has a "pay from pool" toggle.
- [ ] When toggled, after expense save, dashboard surfaces a one-click suggested proposal.
- [ ] One click opens the Proposal creation dialog with recipient = Member, amount = expense amount, memo = expense memo.
- [ ] User can edit before submitting.
- [ ] Dismissing the suggestion is sticky per expense (no re-nag).
- [ ] `pnpm build` passes.

## FW-045 - Fund Mode Member Roles

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** None

### What to build

Add light member roles in FundWise: `Admin` / `Member` / `Viewer`. Admin can change threshold and invite. Member can propose / approve / execute. Viewer is read-only. Stored in FundWise (Squads stays the on-chain authority).

### Acceptance Criteria

- [ ] `members.role` column added with default `member`.
- [ ] Server enforces role-gated actions: only Admin can invite, only Admin can change threshold.
- [ ] UI shows role badge next to Member name in dashboard.
- [ ] Group creator becomes Admin by default.
- [ ] Migration covers the new role column.
- [ ] Tests cover role enforcement edge cases.
- [ ] `pnpm build` passes.

## FW-046 - Fund Mode Exit/Refund Proposal Flow

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-045

### What to build

Add an explicit "return funds to leaving Member" Proposal type. It calculates the leaving Member's pro-rata share or accepts a custom amount, then runs the normal Fund Mode approval and execution lifecycle.

### Acceptance Criteria

- [ ] New proposal type `member_exit` with recipient = leaving Member.
- [ ] Amount can be custom or suggested from the Member's pro-rata Treasury share.
- [ ] Runs through normal Proposal approval, rejection, proof/history, and execution.
- [ ] UI explains that exits are Proposal-based and not automatic withdrawals.
- [ ] Tests cover the proposal type and Member authorization rules.
- [ ] `pnpm build` passes.

## FW-047 - Fund Mode Creation Fee Infrastructure (Devnet Beta)

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-033

### What to build

At Fund Mode Treasury init, prompt for a flat creation fee (devnet test-USDC) sent to a FundWise dev wallet. Show what the equivalent mainnet fee would be ($3-$5 USD). Allow opt-out with a one-click "skip for beta" button but record the choice for monetization analytics. Devnet test-USDC has no real value — this is a behavioral test, not real revenue.

### Acceptance Criteria

- [ ] Creation fee step appears after Squads multisig confirm, before FundWise persistence.
- [ ] Fee amount configurable via env var (`FUNDWISE_FUND_MODE_CREATION_FEE_USDC`).
- [ ] Fee destination wallet configurable via env var (`FUNDWISE_FUND_MODE_FEE_DEST_WALLET`).
- [ ] User can opt out; both paths are recorded in a new `fund_mode_fee_responses` table.
- [ ] Fee transfer verified on-chain before treasury persistence proceeds.
- [ ] Skip path completes treasury persistence normally.
- [ ] `pnpm build` and `pnpm test` pass.

### Notes

Pure devnet monetization test. Mainnet creation fee is not enabled until Fund Mode graduates to mainnet (separate decision).

## FW-048 - Telegram Beta Channel Onboarding Link From Fund Mode Entry

**Status:** Done
**Priority:** P2
**Type:** AFK
**Blocked by:** None

### What to build

Add a "Join the Fund Mode beta on Telegram" link from the Fund Mode entry surfaces (Group creation dialog, dashboard empty state). Points at `https://t.me/funddotsol` for now; later moves to a private invite-only channel.

### Acceptance Criteria

- [x] Link visible only when Fund Mode is selected or being shown.
- [x] Opens Telegram in a new tab with `rel="noopener noreferrer"`.
- [x] Copy explains: "Fund Mode is invite-only beta. Join the Telegram group for support and to help us test pricing."
- [x] No tracking parameters in URL.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-11 on `checklist` branch. Fund Mode creation now shows a focused `Join the Fund Mode beta on Telegram` link only after Fund Mode is selected, and the Fund Mode dashboard shows a beta onboarding banner with a `Join beta Telegram` CTA to `https://t.me/funddotsol`. Both links open in a new tab with `rel="noopener noreferrer"` and no tracking parameters. `pnpm test` and `pnpm build` passed.

## FW-049 - Add Beta Admin Wallets For Fund Mode Group Creation

**Status:** Ready
**Priority:** P0
**Type:** HITL
**Blocked by:** Cloudflare deploy env access

### What to build

Give the owner/admin wallet permission to create invite-only Fund Mode Groups by configuring the server-side allowlist. This does not grant financial authority over existing Groups; it only permits beta Group creation.

### Acceptance Criteria

- [x] Owner supplies the Solana wallet address to add.
- [x] Local `.env.local` includes the wallet in `FUNDWISE_FUND_MODE_INVITE_WALLETS`.
- [ ] Cloudflare production env includes the wallet in `FUNDWISE_FUND_MODE_INVITE_WALLETS`.
- [ ] Fund Mode Group creation succeeds for the allowlisted wallet.
- [ ] Fund Mode Group creation still fails for non-allowlisted wallets.
- [ ] README documents the env var.

## FW-050 - Fix Next Build For Public `.well-known` Discovery Routes

**Status:** Done
**Priority:** P0
**Type:** AFK
**Blocked by:** None

### What to build

Fix the Cloudflare Pages build failure where `@cloudflare/next-on-pages` rejects dynamic `.well-known` discovery routes unless each route handler explicitly opts into the Edge Runtime.

### Acceptance Criteria

- [x] Public `.well-known` discovery routes still exist at the same URLs.
- [x] Each dynamic `.well-known` route exports `export const runtime = "edge"`.
- [x] `pnpm build:pages` reaches the Cloudflare adapter build summary and lists the `.well-known` routes as Edge Function Routes.

### Notes

Completed on 2026-05-14 by restoring `export const runtime = "edge"` to the `.well-known` route handlers. The earlier removal let `next build` finish, but `pnpm build:pages` failed because the Cloudflare adapter requires every non-static route to be Edge Runtime compatible. Re-verified on `checklist`: `pnpm build:pages` passes and the Cloudflare build summary lists all seven `.well-known` routes as Edge Function Routes.

## FW-051 - Polish Custom Fund Mode Group Creation And Faucet Guidance

**Status:** Done
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Make Fund Mode creation clearer for beta admins: custom Treasury setup first, optional templates second, and explicit devnet SOL / USDC faucet guidance for creators and Members.

### Acceptance Criteria

- [x] Fund Mode creation explains beta admin access before submission.
- [x] Custom setup is the default mental model, with templates as optional presets.
- [x] Funding goal and approval threshold are clearly labeled as custom settings.
- [x] Creation dialog links to `faucet.solana.com` for devnet SOL and `faucet.circle.com` for devnet USDC.
- [x] Fund Mode dashboard repeats faucet guidance near Treasury / Contribution actions.
- [x] `pnpm build` passes.

### Notes

Completed on 2026-05-14. The create dialog now frames Fund Mode as beta-admin-only, keeps custom Treasury setup as the default path, and links directly to Solana and Circle devnet faucets. The Fund Mode dashboard repeats faucet guidance near beta onboarding, Treasury initialization, and Contributions.

## FW-052 - Keep Fund Mode On Custom Devnet RPC While Split Mode Moves Mainnet

**Status:** Done
**Priority:** P0
**Type:** AFK
**Blocked by:** FW-033

### What to build

Ensure Fund Mode on-chain flows use a dedicated configurable devnet RPC even when the public Split Mode app is configured for Solana mainnet.

### Acceptance Criteria

- [x] Devnet RPC can be configured with `SOLANA_DEVNET_RPC_URL` / `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL`.
- [x] Fund Mode Squads Treasury creation and reads use devnet RPC.
- [x] Fund Mode Contribution preflight and transfer submission use devnet RPC.
- [x] Fund Mode Contribution and Proposal execution verification use devnet RPC.
- [x] Split Mode Settlement verification keeps using the default/public app RPC.
- [x] `pnpm build` and focused tests pass.

### Notes

Completed on 2026-05-14. Added cluster-specific RPC helpers and routed Fund Mode Squads helpers, Contribution preflight/submission, and Fund Mode verification through configurable devnet endpoints while leaving Split Mode Settlements on the default app RPC. `pnpm exec tsc --noEmit`, `pnpm test tests/fundwise-mutations.test.ts`, `pnpm lint`, and `pnpm build` passed; lint still has two pre-existing router dependency warnings.

## FW-053 - Branch Audit Follow-ups (Critical: Expense Payer Binding, Settlement TOCTOU, Sanctions Scope)

**Status:** Done
**Priority:** P0
**Type:** AFK
**Blocked by:** None
**Source:** `checklist` branch audit on 2026-05-14 (security-oriented sweep + UI review + parallel adversarial sub-agents)

### Context

A multi-pass audit ran over the `checklist` branch (62 changed files, +4129 / -430 vs `main`). All 112 vitest tests pass. The Anchor IDL at `lib/anchor/group_manager.ts` is dead code — there is no Rust source under `programs/fundwise/` (only a stray `.DS_Store`); `git log --all --diff-filter=A --name-only` shows the original Rust sources existed historically but were deleted, leaving the IDL orphaned. The real on-chain governance lives in Squads multisig + SPL token verification, not a custom Anchor program. Findings below are restricted to issues that were verified by direct file/line reads, not just sub-agent claims.

### Critical findings to fix

1. **Expense payer attribution bypass** — `app/api/expenses/route.ts:59` only checks `body.createdBy === session.wallet`; `body.payer` is forwarded unchecked into `addExpenseMutation`. The mutation requires payer to be a Group Member (`assertWalletsAreMembers`) but does **not** require payer to equal the session wallet. As Alice, I can POST an Expense claiming Bob paid 100 USDC for everyone — that immediately credits Bob and debits everyone else in the balance graph, including me. Bob has no consent in the loop. Fix: bind `body.payer === session.wallet` at the route, OR add an explicit confirmation step where the listed payer must co-sign before the Expense lands on the ledger.

2. **Settlement TOCTOU between snapshot and insert** — `lib/server/fundwise-mutations.ts:896` reads a Group dashboard snapshot, line 905 verifies the on-chain transfer, line 913 re-reads the snapshot, then line 922 inserts the settlement. The second snapshot and the insert are NOT atomic. Two concurrent settlement requests for the same Group can both pass the second snapshot check; the first insert mutates the graph while the second insert is in flight and lands an already-invalid settlement. Fix: use a Supabase transaction with row-level locking on the Group, OR re-run `assertSettlementMatchesCurrentGraph` inside a postgres function that also performs the insert atomically.

3. **Sanctions screen runs only at challenge issuance, not on session-bearing mutations** — `assertWalletIsAllowed` is called exactly once: `app/api/auth/wallet/challenge/route.ts:25`. A wallet that authenticated before being added to `SANCTIONED_SOLANA_WALLETS` keeps a valid 12-hour session and can transact freely. Fix: call `assertWalletIsAllowed(session.wallet)` inside `requireAuthenticatedWallet()` so every protected route enforces the screen on every call. Bonus: hot-reload the list from a Supabase table instead of the in-process `Set`.

### Acceptance criteria

- [x] `body.payer` on POST/PATCH `/api/expenses/*` is rejected unless it equals `session.wallet`, OR a payer-confirmation flow is shipped end-to-end.
- [x] `addSettlementMutation` performs the graph match + insert atomically (postgres function or transaction with `for update` lock on the Group row).
- [x] `requireAuthenticatedWallet()` calls `assertWalletIsAllowed` and returns 403 for sanctioned wallets even if their session cookie is still valid.
- [x] Vitest covers each of the above with a regression test under `tests/`.

### Notes

Verified file:lines on 2026-05-14: `app/api/expenses/route.ts:59`, `lib/server/fundwise-mutations.ts:896,905,913,922`, `app/api/auth/wallet/challenge/route.ts:25`, `lib/server/wallet-session.ts:235`, `lib/server/sanctions-screening.ts:11`.

Completed on 2026-05-14. The route now binds Expense payer to the authenticated session, protected routes re-screen sanctioned wallets on every request, `record_settlement_locked` serializes Settlement inserts under the parent Group row, and the live Supabase project additionally enforces unique `settlements.tx_sig` plus service-role-only RPC execution. `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm supabase:verify-rls` passed during readiness checks.

## FW-054 - Distributed Rate-Limit + Cover Money-Moving Routes

**Status:** Open
**Priority:** P1
**Type:** AFK
**Blocked by:** None
**Source:** `checklist` branch audit on 2026-05-14

### Context

`lib/server/rate-limit.ts:16` uses an in-process `Map`. The app runs on edge runtime — every isolate/region carries its own counter, so the "30 per minute per IP" limit is multiplied by the number of live isolates worldwide. In Cloudflare Pages / Vercel Edge that is non-deterministic but easily 5-20x. Additionally, only the auth endpoints currently call `enforceRateLimit`. The state-changing endpoints (`/api/settlements`, `/api/contributions`, `/api/proposals`, `/api/proposals/[id]/{review,execute,comments}`, `/api/expenses`, `/api/expenses/[id]`, `/api/groups`, `/api/groups/[id]/treasury`, `/api/groups/[id]/members`, `/api/profile/display-name`) are uncapped — a single valid session can spam thousands of writes per second.

### Acceptance criteria

- [ ] Replace the in-memory bucket with a Supabase table or Upstash Redis backed counter so limits hold across isolates.
- [ ] Add per-wallet limits to every POST/PATCH/DELETE money- or membership-changing route (suggested defaults: settlements/contributions/proposals/expenses 20 per minute; group create 5 per hour; profile-display-name 10 per hour).
- [ ] Document the new limits in `docs/ops-runbook.md`.
- [ ] Add a test that exercises the limiter and confirms 429 once exceeded.

### Notes

Edge-isolate split also means the `pruneExpiredBuckets` size cap at `lib/server/rate-limit.ts:17` (`MAX_TRACKED_KEYS = 2_000`) is essentially meaningless — each isolate hits 2,000 on its own before sharing pressure.

## FW-055 - Restrict On-Chain Settlement Verification To Expected ATAs Only

**Status:** Open
**Priority:** P1
**Type:** AFK
**Blocked by:** None
**Source:** `checklist` branch audit on 2026-05-14

### Context

`lib/server/solana-transfer-verification.ts:174-187` verifies that the **expected source ATA** decreased by exactly `expectedAmount` and the **expected destination ATA** increased by exactly `expectedAmount`. It does **not** assert that those are the only token balance deltas in the transaction. A signed transaction can contain additional unrelated transfers from the source ATA to attacker-controlled ATAs in the same atomic tx; FundWise will still record the settlement/contribution/execution as valid because the two expected deltas match.

For Squads vault transactions this is partly mitigated by the multisig wrapper, but for plain settlements (`verifySettlementTransfer`) the sender wallet is the same signer that built the transaction client-side — a malicious client (e.g. a compromised browser extension) can append a side-transfer before signing.

### Acceptance criteria

- [ ] After matching the expected source/dest deltas, iterate the full `tokenBalances` map and reject the verification if any other ATA's pre/post delta is non-zero (or whitelist a fee/ATA-creation account if the destination ATA was created in-flight).
- [ ] Test: a synthesized parsed tx with an extra transfer step is rejected by `verifySettlementTransfer`, `verifyContributionTransfer`, and `verifyProposalExecutionTransfer`.
- [ ] Sanity-check that ATA-creation rent transfers (system-program lamports, not SPL) do not register as token-balance deltas and therefore do not trip the new guard.

### Notes

Verified file:lines: `lib/server/solana-transfer-verification.ts:114-187` (`verifyAtaTransfer`), `lib/server/fundwise-mutations.ts:905,987,1245` (call sites). The current `assertSigner` check only ensures the labelled signer signed; it does not constrain the payload of the signed transaction.

## FW-056 - Branch Audit Follow-ups (UI Polish, Dead Code, Devnet Mint Cleanup)

**Status:** Open
**Priority:** P2
**Type:** AFK
**Blocked by:** None
**Source:** `checklist` branch audit on 2026-05-14

### Context

Lower-severity findings from the same audit pass. Grouped together because none of them are exploitable by themselves but they all pollute either correctness or maintainability.

### Bug list

- **High — Duplicate "Settlement reached Solana" recovery banner** at `components/group-dashboard/split-mode-dashboard.tsx:373` and `:565`. Both blocks render when `isMember && pendingSettlementReceipt` is truthy. A user with the recovery state set sees two banners and can double-fire `onRecoverSettlementReceipt` by clicking the lower one before the upper resolves. Consolidate into a single render branch.
- **High — Confusing `__Host-` cookie name flip between dev and prod**. `lib/server/wallet-session.ts:9-16` uses the `__Host-` prefix only in production. Dev cookies do not get the same protections (path=/, secure, no domain), which means devnet rehearsals do not exercise the same browser invariants as prod. Use the `__Host-` prefix unconditionally and set `secure` based on `NODE_ENV` so dev/prod parity holds.
- **High — `STABLECOIN_MINTS_DEVNET.USDT` and `.PYUSD` use mainnet-looking mint addresses**. `lib/expense-engine.ts:17-25`. The "devnet" USDT mint `Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ` is the canonical mainnet USDT mint, which does not exist on devnet — any Group created with this mint will fail at first transfer. Either remove USDT/PYUSD from the devnet map or replace with the correct devnet mints (or document why both maps reference the same address).
- **Medium — Proposal review endpoint does not dedupe on `tx_sig`**. `lib/server/fundwise-mutations.ts:1159-1170` only uses the `(proposal_id, member_wallet)` unique constraint via the `23505` branch. A reviewer who races two PATCH calls with different on-chain reviews of the same proposal hits the unique-violation branch on the second, but the on-chain side may now show two approvals for one Member if the second write succeeded against Squads — FundWise will hide the second locally without flagging the discrepancy. Either dedupe on `tx_sig` or surface the divergence in the UI.
- **Medium — CSP allows `script-src 'self' 'unsafe-inline'` in production**. `next.config.mjs:79`. `unsafe-inline` defeats most of CSP's XSS protection. Migrate inline scripts/styles to files and tighten the policy.
- **Medium — `isFundModeInviteWallet` parsing is brittle**. `lib/server/fundwise-mutations.ts:214-221`. Splits `FUNDWISE_FUND_MODE_INVITE_WALLETS` on `,` and trims, but does not normalize through `new PublicKey(...).toBase58()`. A whitespace-only env var silently allows nobody; a wallet with a leading/trailing space in the env value silently mismatches; a list with one trailing comma yields an empty string in the allowlist. Normalize on read and warn loudly on parse errors.
- **Medium — Hardcoded literal cluster string in client preview**. `hooks/use-group-dashboard.ts:891` passes `cluster: "devnet"` directly into the contribution preview. Today this matches the product decision (Fund Mode is devnet-only beta) but the literal should come from `getClusterForGroupMode("fund")` so a future flip of the policy does not require code changes in unrelated files.
- **Low — Dead `WalletAdapterNetwork.Devnet` constant**. `components/solana-wallet-provider.tsx:47` declares `const network = WalletAdapterNetwork.Devnet` and never uses it. Either pass it into `WalletProvider` (and derive it from cluster) or delete the line.
- **Low — Dead Anchor IDL**. `lib/anchor/group_manager.ts` is 1,249 lines and referenced by no file in the repo. Delete it or document that it is preserved for a future on-chain program.
- **Low — `parse-usdc-amount` regex accepts a bare `.`**. `lib/parse-usdc-amount.ts:28` uses `/^\d*\.?\d*$/`, which matches `.`, `5.`, and `.5`. The bare-`.` case is caught by downstream zero-detection but the regex itself should require at least one digit.
- **Low — Empty `programs/fundwise/` directory** with `.DS_Store`. The src/tests subdirectories exist but contain no source. Delete the directory or restore the Rust source under it. (Historical Rust files visible via `git log --all --diff-filter=A` confirm there used to be a program here; it was deleted.)

### Acceptance criteria

- [ ] Each bullet above is addressed or explicitly waived in the issue.
- [ ] `pnpm test`, `pnpm lint`, `pnpm build` continue to pass.

### Notes

Findings cross-referenced from a parallel UI/security review against the source tree on 2026-05-14. All file:line references re-verified by direct reads, not relied on from sub-agent output.

## FW-057 - Threshold Suggestions At Treasury Initialization

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Suggest sensible approval thresholds at Treasury initialization: 2 Members → 2/2, 3-5 Members → majority, 6+ Members → 1/2 + 1. Show plain-English copy explaining what the threshold means before the creator signs the Squads transaction.

### Acceptance Criteria

- [ ] Treasury init UI shows a recommended threshold from current Member count.
- [ ] Creator can override the recommendation before creation.
- [ ] UI explains the tradeoff between safety and speed.
- [ ] Existing template threshold behavior still works.
- [ ] `pnpm build` passes.

## FW-058 - Pre-Treasury SOL/Rent Checklist UI

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-052

### What to build

Before Squads Treasury creation, show a checklist with estimated devnet SOL needed for multisig/rent/fees and faucet guidance.

### Acceptance Criteria

- [ ] Treasury init card shows required SOL estimate or a conservative fallback estimate.
- [ ] If connected wallet SOL is below estimate, the primary action is disabled or clearly warns before wallet prompt.
- [ ] Links to `https://faucet.solana.com` for devnet SOL.
- [ ] `pnpm build` passes.

## FW-059 - Squads Explorer Link On Treasury Card

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-052

### What to build

Add an external verification link from the Treasury overview to the corresponding Squads UI or explorer view for the multisig/Treasury addresses.

### Acceptance Criteria

- [ ] Link appears only after Treasury initialization.
- [ ] Link opens in a new tab with `rel="noopener noreferrer"`.
- [ ] Copy makes clear that FundWise remains the app workflow and Squads is the verification/governance surface.
- [ ] `pnpm build` passes.

## FW-060 - Threshold-Change Proposal Type

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-045

### What to build

Let Admins propose a threshold change for a Fund Mode Treasury. It should run through the normal Proposal lifecycle and update the FundWise metadata only after the approved on-chain governance action is executed or explicitly mirrored.

### Acceptance Criteria

- [ ] Admin-only UI can draft a threshold-change Proposal.
- [ ] Non-admin Members cannot draft threshold-change Proposals.
- [ ] Proposal history clearly shows old and new threshold.
- [ ] `pnpm build` and role tests pass.

## FW-061 - Monthly Fee Emulation Banner

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-047

### What to build

At Treasury init and around day 30 of pool age, show a non-blocking willingness-to-pay prompt for a hypothetical monthly Fund Mode subscription.

### Acceptance Criteria

- [ ] Prompt stores yes/no plus optional comment.
- [ ] Prompt is non-blocking and clearly says devnet beta/no real charge.
- [ ] Response can be viewed later in beta admin reporting.
- [ ] `pnpm build` passes.

## FW-062 - Free-Tier Limits Emulation

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-047

### What to build

Emulate future free-tier limits for beta pools, such as Member count or simulated AUM thresholds, with a mock upgrade intent flow.

### Acceptance Criteria

- [ ] Limit copy is clearly marked as beta research, not real billing.
- [ ] User can express upgrade intent without paying.
- [ ] Intent is stored for monetization analysis.
- [ ] `pnpm build` passes.

## FW-063 - Beta Exit Survey

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** FW-046

### What to build

When a Member leaves or completes an exit/refund flow, ask lightweight beta feedback questions about pricing fairness, feature gaps, and willingness to pay.

### Acceptance Criteria

- [ ] Survey has no more than 3 required questions.
- [ ] Responses are tied to Group/pool context without exposing private data publicly.
- [ ] User can skip.
- [ ] `pnpm build` passes.

## FW-064 - Beta Admin Dashboard

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** None

### What to build

Build an internal beta admin surface showing active Fund Mode pools, Member counts, Contributions, Proposal counts, last activity, and monetization-response summaries.

### Acceptance Criteria

- [ ] Admin-only access is enforced server-side.
- [ ] Shows active beta pools and latest activity.
- [ ] Shows willingness-to-pay and fee-emulation responses.
- [ ] `pnpm build` passes.

## FW-065 - Weekly Beta Digest Process

**Status:** Ready
**Priority:** P2
**Type:** HITL
**Blocked by:** FW-064

### What to build

Create a simple weekly beta digest process for the owner to send in Telegram: active pools, biggest reimbursements, common feedback, and next asks.

### Acceptance Criteria

- [ ] Digest data can be copied from the admin dashboard or a script.
- [ ] Template exists in docs.
- [ ] Owner can send manually without needing new automation.

## Branch Audit Snapshot (2026-05-14)

This snapshot is the running record of the audit that produced FW-053 through FW-056. Kept here so future runs do not lose the context.

**Scope:** `checklist` branch vs `main`. 62 files changed, +4,129 / -430 lines. 22 commits since branch point.

**Tests:** `pnpm test` → 7 files, 112 tests, all pass (1.21s).

**Smart-contract review:** there is no on-chain custom program in this branch. `programs/fundwise/` contains only a `.DS_Store`; the previously-committed Rust source (per `git log --all --diff-filter=A`: `programs/fundwise/src/{lib,state,accounts,errors,instructions,instructions/*.rs}` and root `Anchor.toml`/`Cargo.toml`) was deleted at some point. The Anchor IDL at `lib/anchor/group_manager.ts` is orphaned dead code. The actual on-chain mechanics that the app depends on are: SPL Token transfers (Split Mode settlements + Fund Mode contributions, signed by the user), and Squads multisig vault transactions (Fund Mode proposal create / review / execute). Verification of those flows happens server-side in `lib/server/solana-transfer-verification.ts` and `lib/server/fundwise-mutations.ts`.

**Adversarial summary:**

- Authentication uses HMAC-signed cookies, Ed25519 wallet signatures, 5-minute challenge TTLs, 12-hour session TTLs, and origin + cluster pinning on challenges. The flow is sound. Session cookies do NOT re-pin origin or cluster, which would let a captured session be reused if a different host runs the same `FUNDWISE_SESSION_SECRET` — operationally unlikely but worth noting.
- Server-side mutations route through Supabase service-role from `lib/server/supabase-admin.ts`. The service-role key is never imported from client code (`grep SUPABASE_SERVICE_ROLE_KEY` confirms only `lib/server/` usage).
- Most mutation routes correctly bind `body.actorWallet === session.wallet` before forwarding to the mutation layer. The one consistent exception is `body.payer` on Expense create (see FW-053).
- The on-chain verification helpers cross-check the right PDAs (`getVaultPda`, `getProposalPda`, `getTransactionPda`) against multisig program ownership, which prevents PDA spoofing. They confirm Squads program ownership for the multisig and proposal accounts before decoding.
- Settlement matching uses two snapshots around the on-chain verification — TOCTOU window described in FW-053.
- SPL-transfer verification is delta-based and does not whitelist participants — extra side-transfers in the same signed tx slip through (see FW-055).
- Rate limiting only covers `/api/auth/wallet/*` and is in-process — see FW-054.
- Sanctions screening only fires on challenge issuance — see FW-053.

**UI review summary:**

- Split Mode dashboard: balance / activity / settlement preview flows look coherent. Duplicate "Settlement reached Solana" banner is the only material defect noticed (FW-056).
- Fund Mode dashboard: TreasuryOverviewCard + suggested-reimbursements UX are a clean new surface. Memo and proof-URL fields are rendered as React text/href; `normalizeProofUrl` server-side restricts to http/https so `javascript:` payloads cannot land in the DB through the supported paths.
- Cross-chain bridge modal: external `target="_blank"` link on line 348 lacks `rel="noopener noreferrer"`. Most other external links in `components/agent-section.tsx`, `components/footer.tsx`, and `components/group-dashboard/fund-mode-dashboard.tsx` also lack `rel`. Not a critical issue but worth a sweep.
- The hardcoded `WalletAdapterNetwork.Devnet` in `components/solana-wallet-provider.tsx:47` is never wired into the actual `ConnectionProvider` — the endpoint comes from `NEXT_PUBLIC_SOLANA_RPC_URL` instead. So the constant is dead, not a misconfiguration that would force devnet at runtime.
- Accessibility on dashboards is OK (Radix-based, focus-visible rings on Buttons). No `dangerouslySetInnerHTML` outside `components/ui/chart.tsx` (shadcn boilerplate).

**Out of scope for this audit:** the production Supabase RLS policies (RLS is verified by `scripts/verify-supabase-rls.mjs` separately and not re-read here), the LI.FI route generation (covered by `docs/lifi-route-rehearsal.md`), and the Cloudflare deployment pipeline.

## Production-Ready Push Session (2026-05-14)

Production-readiness session that landed on `checklist` after the branch audit. Goal: code-side mainnet blockers cleared, Fund Mode beta polished to checklist completion, operator runbooks written for the human-only steps. Tests: 123/123 passing.

**Code commits in this session (oldest → newest):**

- `b2fa16c` `fix(api): bind expense payer to authenticated session (FW-053)`
- `92c197f` `fix(auth): re-screen sanctioned wallets on every authenticated mutation (FW-053)`
- `399844c` `fix(verification): reject side transfers in verifyAtaTransfer (FW-055)`
- `a182a17` `fix(settlement): atomic insert under row lock on parent group (FW-053)`
- `e998bbb` `test(audit): regression coverage for FW-053 + FW-055`
- `407a927` `feat(fund): Treasury init guidance — threshold, SOL pre-flight, Squads link (FW-057, FW-058, FW-059)`
- `efb8377` `feat(fund): exit-refund suggestion that pre-fills the Proposal form (FW-046)`
- `0fdda95` `docs(prod): copy-paste runbook for prod secrets and Cloudflare env`
- `847bb0c` `feat(stress): devnet stress test for the audit guards (FW-039 prep)`
- `7a80623` `feat(monitoring): GlitchTip / @sentry/cloudflare shim (FW-038d)`

**Still HITL — operator owns the next moves:**

- **FW-038 + FW-038a + FW-038b + FW-038c** — Supabase hardening is verified on the configured project; still confirm it is the separate prod project, rotate the session secret, paste Alchemy mainnet (+ Helius/public-node fallback) RPC URLs into Cloudflare Pages env, and enable daily backup. Step-by-step is in `docs/prod-secrets-runbook.md`.
- **FW-039** — Split Mode mainnet rehearsal. The user asked for a devnet audit + stress test first. Run `pnpm split:stress` against the local dev server (no cookie needed for the unauth suite; copy `fundwise_wallet_session` into `FUNDWISE_STRESS_COOKIE` for the full suite), then run the existing `scripts/devnet-agent-rehearsal.mjs` end-to-end. Capture findings before scheduling the mainnet rehearsal with two real wallets and ~$15 USDC.
- **FW-054** — Distributed rate-limit + cover money-moving routes. Open because it's the next P1 mainnet-hardening item; not blocking the first invite-only rollout.
- **FW-056** — UI polish + dead-code cleanup batch. Mostly LOW severity; ship after launch is stable.

**Mainnet readiness call:** Split Mode is code-ready for a tightly-invited mainnet rollout after the hardened Supabase project is confirmed as prod and the Alchemy RPC + session secret are pasted into Cloudflare. The remaining audit items (FW-054, FW-056) are hardening, not correctness, and can ship in the post-launch week.

**Fund Mode beta status:** Phase A and Phase B of `docs/fund-mode-beta-checklist.md` are now complete (FW-042/043/044/046/057/058/059). Phase C monetization telemetry (FW-047/061/062/063) and Phase D ops (FW-064/065) remain as the actual beta-running work, but the product is shippable to the first invite cohort as-is.

---

## FW-066 - Platform Fee Wallet env + ledger table

**Status:** Ready
**Priority:** P0 (blocks Summit fee collection)
**Type:** AFK
**Blocked by:** —
**Source:** [ADR-0032](./docs/adr/0032-fund-mode-take-rate-monetization.md), grilling session 2026-05-16

### What to build

Foundation for all take-rate fees. No fees can collect without this.

- Env var `FUNDWISE_PLATFORM_FEE_WALLET` (per cluster: devnet, mainnet). Operator-controlled wallet.
- Supabase migration: `platform_fee_ledger` table. Cols: `id`, `fee_kind` (creation | contribution | reimbursement | routing | holding | yield), `group_id` (nullable for routing), `member_wallet` (nullable), `amount` (bigint, token base units), `mint`, `tx_sig`, `cluster`, `recorded_at`. Indexes on `fee_kind`, `group_id`, `tx_sig`. RLS off (service-role only).
- `recordPlatformFeeMutation(input)` helper in `lib/server/fundwise-mutations.ts`. Idempotent on `tx_sig`.
- Unit test covering insert + duplicate-tx_sig reject.

### Acceptance Criteria

- [ ] Migration applied to devnet Supabase project.
- [ ] `FUNDWISE_PLATFORM_FEE_WALLET` validated on server boot (fail fast if missing or malformed).
- [ ] Helper rejects duplicate `tx_sig` w/ 23505 → friendly error.
- [ ] `pnpm test` passes.

## FW-067 - Buyer-pays Contribution fee on-chain

**Status:** Ready
**Priority:** P0 (blocks Fund Mode mainnet launch)
**Type:** AFK
**Blocked by:** FW-066
**Source:** [ADR-0032](./docs/adr/0032-fund-mode-take-rate-monetization.md)

### What to build

0.5% Contribution Fee, buyer-pays. Member signs gross + fee; Treasury receives gross.

- `contributeStablecoinToTreasury` in `lib/squads-multisig.ts` (or new helper alongside): build one transaction with two `transferInstruction` calls — gross to Treasury ATA, fee to Platform Fee Wallet ATA. Atomic.
- `addContributionMutation` server validates fee math against op-global rate (env `FUNDWISE_CONTRIBUTION_FEE_BPS`, default 50 = 0.5%); rejects if client sends mismatched fee.
- Verify both legs in `verifyContributionTransfer`: sender = Member, recipient_1 = Treasury (gross), recipient_2 = Platform Fee Wallet (fee). Existing helper at `lib/server/solana-transfer-verification.ts:240` covers one leg today — extend.
- Insert into `platform_fee_ledger` on success.
- UI: Contribute dialog shows "Contribute $X to Treasury. FundWise fee: $Y. Total: $X+Y."

### Acceptance Criteria

- [ ] One signed transaction, two transfers, atomic.
- [ ] Server math matches client math or rejects.
- [ ] Treasury ATA balance increases by gross; Platform Fee Wallet ATA increases by fee.
- [ ] Ledger row inserted w/ `fee_kind = 'contribution'`.
- [ ] UI breakdown matches on-chain math to the cent.
- [ ] `pnpm test` passes; new integration test for two-leg verification.

## FW-068 - Buyer-pays Reimbursement fee via Squads vault tx

**Status:** Ready
**Priority:** P0 (blocks Fund Mode mainnet launch)
**Type:** AFK
**Blocked by:** FW-066
**Source:** [ADR-0032](./docs/adr/0032-fund-mode-take-rate-monetization.md)

### What to build

Hardest piece. 0.5% Reimbursement Fee, buyer-pays — Member receives requested amount, Treasury debits gross + fee in same Squads vault transaction.

- `createSquadsReimbursementProposal` in `lib/squads-multisig.ts:317`: change `TransactionMessage` to include two `transferInstruction` calls — gross from Treasury ATA → Member ATA, fee from Treasury ATA → Platform Fee Wallet ATA. Squads vault PDA signs both.
- ATA creation for Platform Fee Wallet's USDC ATA may be needed on first fee — add lazy create instruction if missing.
- `verifyProposalExecutionTransfer` at `lib/server/solana-transfer-verification.ts:258`: extend to verify both transfer legs and assert the fee leg amount = `expected_amount * fee_bps / 10000`.
- `addProposalMutation` records `gross_amount` (what Member receives) and `fee_amount` separately. Existing `amount` column = gross; new `fee_amount` column (migration).
- `executeProposalMutation` inserts into `platform_fee_ledger` after on-chain verification.
- UI: Proposal create dialog shows "Reimburse $X to Member. FundWise fee: $Y. Treasury debits $X+Y." Proposal detail view shows breakdown.

### Acceptance Criteria

- [ ] One Squads `vaultTransactionCreate` with two transfers in the `TransactionMessage`.
- [ ] On execution, Member ATA receives exactly the gross amount; Platform Fee Wallet ATA receives exactly the fee.
- [ ] `proposals.fee_amount` column populated.
- [ ] Ledger row inserted w/ `fee_kind = 'reimbursement'`.
- [ ] Existing devnet rehearsal script (`scripts/fund-mode-beta-rehearsal.mjs`) updated + passes end-to-end with fee math verified on-chain.
- [ ] `pnpm test` passes; integration test for two-leg vault tx verification.

## FW-069 - Creation Fee at Treasury init

**Status:** Ready
**Priority:** P1 (load-bearing for Summit pricing story)
**Type:** AFK
**Blocked by:** FW-066
**Source:** [ADR-0032](./docs/adr/0032-fund-mode-take-rate-monetization.md)

### What to build

$5 flat USDC at Treasury init. Server logic exists (`recordCreationFeeMutation` at `lib/server/fundwise-mutations.ts:1889`) — wire to actual on-chain fee transfer + ledger.

- Treasury init flow: after Squads multisig creates, before FundWise records the Treasury, prompt Member for a $5 USDC fee transfer to Platform Fee Wallet. Cluster-aware (devnet test-USDC vs mainnet USDC).
- Verify on-chain via `verifyAtaTransfer` helper. Reject Treasury init if fee tx unconfirmed.
- Insert into `platform_fee_ledger` w/ `fee_kind = 'creation'`. Existing `creation_fee_records` table (FW-047) can stay or merge into the new ledger — pick one, document.
- Operator-tunable amount via `FUNDWISE_CREATION_FEE_USDC_CENTS` env (default 500 = $5).
- UI: Treasury init checklist surfaces the fee w/ "skip for beta" only on devnet (no skip on mainnet).

### Acceptance Criteria

- [ ] On-chain $5 USDC transfer confirmed before Treasury row persists.
- [ ] Ledger row inserted; idempotent on tx_sig.
- [ ] Mainnet cluster gates the "skip" path.
- [ ] `pnpm build` passes.

## FW-070 - Routing Fee (25 bps) on CCTP/LI.FI inbound

**Status:** Ready
**Priority:** P1 (Summit scope w/ multi-chain)
**Type:** AFK
**Blocked by:** FW-066, multi-chain pipeline work
**Source:** [ADR-0032](./docs/adr/0032-fund-mode-take-rate-monetization.md), CCTP launch scope

### What to build

25 bps markup on top of LI.FI/CCTP provider fees for inbound EVM → Solana USDC routes. Fee deducted before USDC lands in Member's wallet or Treasury.

- `lib/lifi-bridge.ts`: post-route handler that splits the inbound USDC — `(amount - fee) → destination`, `fee → Platform Fee Wallet ATA`. Two-leg transfer on the Solana side, atomic.
- Quote UI in `components/cross-chain-bridge-modal.tsx`: show "Route fee: 25 bps. You receive: $X. FundWise: $Y." Transparent.
- Insert into `platform_fee_ledger` w/ `fee_kind = 'routing'`.
- Operator-tunable via `FUNDWISE_ROUTING_FEE_BPS` (default 25).

### Acceptance Criteria

- [ ] Mainnet route shows 25 bps clearly in quote.
- [ ] On-chain: destination receives `amount - fee`; Platform Fee Wallet receives fee.
- [ ] Ledger row inserted.
- [ ] Mainnet rehearsal w/ tiny route confirms math end-to-end.
- [ ] `pnpm test` passes.

## FW-071 - Threshold-change Proposal type — Summit decision

**Status:** Pending decision (chat 2026-05-16 — open)
**Priority:** P2 (not Summit-critical)
**Type:** Decision + cleanup
**Blocked by:** owner decision

### Decision needed

Three options:
- (A) Remove `threshold_change` kind from server + UI. Users can't change Squads threshold from FundWise. Clean.
- (B) Wire to real Squads `configTransactionCreate`. Real on-chain threshold change. ~2-3 days post-Summit work.
- (C) Document as FundWise-internal governance only. Existing code stays; semantic divergence stays. Avoid.

**Recommendation:** ship (A) for Summit (hide UI, server logic stays inactive), build (B) post-Summit as an ADR.

### Acceptance Criteria (if A chosen)

- [ ] `addProposalMutation` rejects `kind = 'threshold_change'` w/ "not yet supported" message until B ships.
- [ ] No "propose threshold change" affordance in Fund Mode UI.
- [ ] Existing display labels for `kind = 'threshold_change'` retained for back-compat w/ any test data.
- [ ] ADR-0034 drafted to capture the decision + path to B.

## FW-072 - withAuthenticatedHandler HOF

**Status:** Ready
**Priority:** P0 (blocks FW-066+)
**Type:** AFK
**Blocked by:** —
**Source:** [ADR-0037](./docs/adr/0037-with-authenticated-handler-hof-for-api-routes.md), arch grilling 2026-05-16

### What to build

HOF at `lib/server/with-authenticated-handler.ts` absorbs session check, rate limit, body JSON parse, wallet-match assertion, Next.js params await, error envelope, success wrap. Wallet-session only. 3 PRs:

1. Add HOF + tests (unit-test auth-bypass, rate-limit invoke, wallet-match success/fail, params passthrough, error envelope shape).
2. Migrate ~10 simpler routes (settlements, expenses, contributions, proposals POST, profile, monetization).
3. Migrate remaining ~11 dynamic-param routes. Delete `lib/server/fundwise-mutations.ts` barrel at end (after FW-073 lands).

Service routes keep `requireFundyServiceAuth` inline. Public routes stay raw. No Zod yet.

### Acceptance Criteria

- [ ] PR1: HOF + tests, all green. No route migrations.
- [ ] PR2: 10 routes migrated, `pnpm test` + `pnpm lint` + `pnpm build` green.
- [ ] PR3: remaining routes migrated, mutations barrel deleted.
- [ ] Net code shrinks ~200 lines across 21 routes.
- [ ] Auth-bypass risk centralized in one tested helper.

## FW-073 - Split fundwise-mutations.ts into per-concept Modules

**Status:** Ready
**Priority:** P0 (blocks FW-072 PR2/PR3 per-concept imports)
**Type:** AFK
**Blocked by:** FW-072 PR1
**Source:** [ADR-0038](./docs/adr/0038-mutations-split-by-concept.md), arch grilling 2026-05-16

### What to build

`lib/server/fundwise-mutations.ts` (2167 lines, 9 concepts colocated) splits into `lib/server/mutations/`:
- `_internal.ts` — shared helpers (getAdmin, getGroupOrThrow, assertMemberCan, …), not re-exported
- `group.ts`, `member.ts` (Profile folded in), `expense.ts`, `settlement.ts`, `contribution.ts`, `proposal.ts`, `treasury.ts`, `monetization.ts`

`computeSuggestedReimbursements` moves OUT to `lib/expense-suggestions.ts` (pure derived view, not a mutation).

Single PR: split files, transitional barrel (`fundwise-mutations.ts → mutations/index.ts → mutations/*`). FW-072 PR2/PR3 migrate callsites to per-concept imports.

Tests: `tests/fundwise-mutations.test.ts` (421 lines) splits into `tests/mutations/{concept}.test.ts`.

### Acceptance Criteria

- [ ] All 9 files exist in `lib/server/mutations/`.
- [ ] Shared helpers in `_internal.ts`; not re-exported from `index.ts`.
- [ ] Transitional barrel re-exports everything; existing callers unchanged this PR.
- [ ] Tests split per-concept; all pass.
- [ ] `pnpm test` + `pnpm lint` + `pnpm build` green.

## FW-074 - Replace lib/db.ts with typed api-client

**Status:** Ready
**Priority:** P1 (tactical cleanup)
**Type:** AFK
**Blocked by:** FW-072
**Source:** arch grilling 2026-05-16, Candidate #5

### What to build

`lib/db.ts` (344 lines, ~30 thin HTTP wrappers) replaced by `lib/api-client.ts`: single typed `apiFetch<T>(method, path, body?)` helper + shared types (`ProposalWithReviews`, `ActivityItem`, `GroupDashboardSnapshot`, `SettlementReceiptView`). Symmetric w/ HOF server-side envelope.

2 PRs:
1. Create `lib/api-client.ts` w/ helper + types. Keep `lib/db.ts` for one PR.
2. Migrate 8 caller files (`app/groups/[id]/settlements/[settlementId]/page.tsx`, `app/groups/[id]/page.tsx`, `app/groups/page.tsx`, `components/group-dashboard/{split-mode,fund-mode,treasury-overview,expense-dialog}.tsx`, `hooks/use-group-dashboard.ts`). Delete `lib/db.ts`.

### Acceptance Criteria

- [ ] `apiFetch<T>` handles GET/POST/PATCH/DELETE.
- [ ] Error envelope `{ error: string }` parsed correctly; throws on !ok.
- [ ] All 8 callers import from `lib/api-client`; `lib/db.ts` deleted.
- [ ] `pnpm test` + `pnpm lint` + `pnpm build` green.
