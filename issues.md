# FundWise Issues

**Last indexed:** 2026-05-11
**Submission status:** Colosseum Frontier submission complete (deadline 2026-05-11)
**Current focus:** Dual-track delivery — Split Mode to public mainnet, Fund Mode stays devnet as invite-only beta for easy-UX and monetization testing. See [docs/split-mode-mainnet-checklist.md](./docs/split-mode-mainnet-checklist.md) and [docs/fund-mode-beta-checklist.md](./docs/fund-mode-beta-checklist.md).

This file is the local issue index for hackathon execution. Keep each issue as a vertical slice: a completed issue should be independently demoable, testable, or useful for submission.

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
| FW-042 | Ready | P1 | AFK | Pool templates at Fund Mode Group creation | None |
| FW-043 | Ready | P1 | AFK | Treasury overview card on Fund Mode dashboard | None |
| FW-044 | Ready | P1 | AFK | Auto-suggested reimbursement proposals from Member expenses | FW-043 |
| FW-045 | Ready | P2 | AFK | Fund Mode member roles (Admin / Member / Viewer) + exit flow proposal type | None |
| FW-047 | Ready | P1 | AFK | Fund Mode creation fee infrastructure (devnet beta) | FW-033 |
| FW-048 | Done | P2 | AFK | Telegram beta channel onboarding link from Fund Mode entry | None |

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
10. **FW-038** Prod Supabase project (P0, HITL)
11. **FW-039** Mainnet rehearsal (P0, HITL)
12. **FW-040** Public copy update post-launch (P1, AFK)

**Fund Mode devnet beta path (parallel, non-blocking):**

1. **FW-042** Pool templates (P1, AFK)
2. **FW-043** Treasury overview card (P1, AFK)
3. **FW-044** Auto-suggested reimbursement proposals (P1, AFK)
4. **FW-047** Creation fee infrastructure (P1, AFK)
5. **FW-045** Member roles + exit flow (P2, AFK)
6. **FW-048** Telegram beta channel link (P2, AFK) — done

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

**Status:** Done
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

**Status:** Ready
**Priority:** P0
**Type:** HITL
**Blocked by:** FW-014

### What to do

Spin up a separate Supabase project for mainnet (`fundwise-prod`), distinct from the existing devnet beta project. Replay all schema migrations + RLS lockdown SQL. Verify anonymous reads are denied. Rotate `SUPABASE_SERVICE_ROLE_KEY` and `FUNDWISE_SESSION_SECRET` for prod.

### Acceptance Criteria

- [ ] New Supabase project created; URL + keys captured for prod env vars.
- [ ] All migrations from `supabase/migrations/` replayed in order.
- [ ] FW-014 RLS lockdown SQL applied; anonymous REST returns zero rows for private tables.
- [ ] Daily backup confirmed enabled.
- [ ] Service role key + session secret rotated, distinct from devnet.
- [ ] Cloudflare Pages prod env vars updated to point at new project.
- [ ] Devnet beta Supabase project keys remain untouched.
- [ ] Documented in `docs/ops-runbook.md` (new file).

### Notes

This is HITL because it requires owner access to Supabase and Cloudflare dashboards. Mainnet blocker.

2026-05-11 prep completed on `checklist` branch: added `docs/ops-runbook.md` with production Supabase creation, migration replay, backup/restore, Cloudflare env, and mainnet rehearsal gates; added `scripts/verify-supabase-rls.mjs` plus `pnpm supabase:verify-rls` to verify anonymous private-ledger reads are empty and anonymous `groups` insert is denied by RLS before constraints. The script auto-loads `.env.local` for local checks without printing secrets. Verified against the currently configured devnet Supabase project: RLS verification passed. `pnpm test` and `pnpm build` passed. Owner still needs to create/configure the prod Supabase project and Cloudflare env vars.

## FW-039 - Mainnet Rehearsal With Real USDC

**Status:** Ready
**Priority:** P0
**Type:** HITL
**Blocked by:** FW-033, FW-035, FW-038

### What to verify

Run the 17-step mainnet test plan from `docs/split-mode-mainnet-checklist.md` Phase 4 with two real mainnet wallets funded with ~$5 USDC + ~$1 SOL each. Capture tx signatures, screenshots, and any failure modes.

### Acceptance Criteria

- [ ] All 17 steps in the checklist pass.
- [ ] Real USDC transfer confirmed on Solana mainnet explorer.
- [ ] Receipt page shows mainnet explorer URL (no `?cluster=` suffix).
- [ ] Settlement Request Link flow works on mainnet.
- [ ] Insufficient-USDC / insufficient-SOL / first-ATA preflight states behave correctly.
- [ ] Wallet rejection mid-flow recovers gracefully.
- [ ] LI.FI top-up path verified (optional, may defer if user has Solana USDC).
- [ ] All findings either fixed or split into new indexed issues.

## FW-040 - Update Public Copy After Mainnet Launch

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-039

### What to update

After mainnet rehearsal passes, update `README.md`, `STATUS.md`, `SUBMISSION.md`, `docs/shipped-vs-planned.md`, and landing copy to reflect that Split Mode is live on mainnet. Keep Fund Mode language as "devnet beta, invite-only".

### Acceptance Criteria

- [ ] README updated.
- [ ] STATUS updated (TL;DR + Phase header).
- [ ] SUBMISSION updated.
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

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Add quick-start templates to Fund Mode Group creation: `Trip pool`, `Friend fund`, `DAO grant`, `Family budget`. Each preselects a threshold suggestion, sample memo, and role hints. Reduces first-time UX cliff.

### Acceptance Criteria

- [ ] Template selector visible during Fund Mode Group creation only.
- [ ] Selecting a template prefills threshold suggestion (e.g. `Friend fund` defaults to majority+1).
- [ ] Templates have a "no template" / "custom" fallback.
- [ ] Template choice stored on the Group row for future analytics.
- [ ] `pnpm build` passes.

## FW-043 - Treasury Overview Card On Fund Mode Dashboard

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** None

### What to build

Add a single-screen "pool state" overview card to Fund Mode Group dashboard: available balance, pending proposal count badge, last 5 events, top 3 contributors. No drilling.

### Acceptance Criteria

- [ ] Card appears at the top of Fund Mode Group dashboard.
- [ ] Shows live USDC balance from Treasury vault.
- [ ] Shows pending proposal count with click-through to proposals list.
- [ ] Shows last 5 activity events (contribution, proposal, approval, execution).
- [ ] Shows top 3 contributors by total contribution amount.
- [ ] Responsive at `375`, `768`, `1280`.
- [ ] `pnpm build` passes.

## FW-044 - Auto-Suggested Reimbursement Proposals From Member Expenses

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-043

### What to build

When a Member logs an expense in a Fund Mode Group with a "pay from pool" flag, the dashboard surfaces a one-click "Propose reimbursement for $X" with memo + amount pre-filled. Closes the Split-Mode-style log → reconcile loop for pools.

### Acceptance Criteria

- [ ] Fund Mode expense entry has a "pay from pool" toggle.
- [ ] When toggled, after expense save, dashboard surfaces a one-click suggested proposal.
- [ ] One click opens the Proposal creation dialog with recipient = Member, amount = expense amount, memo = expense memo.
- [ ] User can edit before submitting.
- [ ] Dismissing the suggestion is sticky per expense (no re-nag).
- [ ] `pnpm build` passes.

## FW-045 - Fund Mode Member Roles + Exit Flow Proposal Type

**Status:** Ready
**Priority:** P2
**Type:** AFK
**Blocked by:** None

### What to build

Add light member roles in FundWise: `Admin` / `Member` / `Viewer`. Admin can change threshold and invite. Member can propose / approve / execute. Viewer is read-only. Stored in FundWise (Squads stays the on-chain authority). Add an explicit "return funds to leaving Member" proposal type.

### Acceptance Criteria

- [ ] `members.role` column added with default `member`.
- [ ] Server enforces role-gated actions: only Admin can invite, only Admin can change threshold.
- [ ] UI shows role badge next to Member name in dashboard.
- [ ] Group creator becomes Admin by default.
- [ ] New proposal type `member_exit` with recipient = leaving Member, amount = custom or pro-rata. Runs normal approval lifecycle.
- [ ] Migration covers the new column + proposal type.
- [ ] Tests cover role enforcement edge cases.
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
