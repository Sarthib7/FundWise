# FundWise Issues

**Last indexed:** 2026-05-08
**Deadline:** 2026-05-11 Colosseum Frontier submission
**Current focus:** Keep shipped/planned claims honest while accelerating Fund Mode as the hero product for the next one-month beta sprint.

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
| FW-017 | Ready | P2 | AFK | Triage dependency audit advisories | FW-014 |
| FW-018 | Ready | P3 | AFK | Add production browser security headers | FW-014 |
| FW-019 | Done | P1 | AFK | Verify Fund Mode Treasury addresses on-chain before persistence | FW-014 |
| FW-020 | Done | P2 | AFK | Remove legacy SOL vault helpers from Squads Fund Mode code | FW-019 |
| FW-021 | Ready | P2 | AFK | Validate LI.FI top-up amount parsing before quote execution | FW-004 |
| FW-022 | Ready | P2 | AFK | Retire direct browser Supabase ledger helpers after RLS lockdown | FW-014 |
| FW-023 | Ready | P3 | AFK | Add wallet-session abuse controls and origin binding | FW-014 |
| FW-024 | Done | P1 | AFK | Index Compass research ADRs and add scripted devnet agent rehearsal | None |
| FW-025 | Done | P1 | AFK | Index Fund Mode hero-product sprint and integration backlog | Owner direction |
| FW-026 | Done | P0 | AFK | Build reimbursement Proposal creation for Fund Mode | FW-020 |
| FW-027 | Ready | P0 | AFK | Build Proposal approval and rejection lifecycle | FW-026 |
| FW-028 | Ready | P0 | AFK | Execute approved Fund Mode reimbursements through Squads | FW-027 |
| FW-029 | Ready | P1 | AFK | Add Proposal proof, comments, and edit history model | FW-026 |
| FW-030 | Ready | P1 | AFK | Add LI.FI funding path for Fund Mode Contributions | FW-020 |
| FW-031 | Ready | P1 | AFK | Add Zerion readiness context for Fund Mode Members and Treasuries | FW-020 |
| FW-032 | Ready | P1 | AFK | Run invite-only Fund Mode beta rehearsal and integration QA | FW-028 |

## Pick Queue

1. **FW-027:** Build Proposal approval and rejection lifecycle.
2. **FW-028:** Execute approved Fund Mode reimbursements through Squads.
3. **FW-030 / FW-031:** Add LI.FI and Zerion support around Fund Mode once the core Treasury/Proposal path exists.
4. **FW-021 / FW-022 / FW-017 / FW-018 / FW-023:** supporting hardening tasks.

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

**Status:** Ready
**Priority:** P0
**Type:** AFK
**Blocked by:** FW-026

### What to build

Add database-backed approval and rejection behavior for Fund Mode reimbursement Proposals.

### Acceptance Criteria

- [ ] Proposer cannot approve their own Proposal.
- [ ] Each Member can approve or reject a Proposal at most once.
- [ ] Rejection closes the Proposal and requires a new Proposal for retry.
- [ ] Threshold approval marks the Proposal ready for execution but does not auto-send funds.
- [ ] UI shows pending, rejected, approved-ready, and executed states distinctly.
- [ ] `pnpm build` passes.

## FW-028 - Execute Approved Fund Mode Reimbursements Through Squads

**Status:** Ready
**Priority:** P0
**Type:** AFK
**Blocked by:** FW-027

### What to build

Execute approved reimbursement Proposals through the stored Squads Multisig and Treasury addresses.

### Acceptance Criteria

- [ ] Execution is a separate explicit action after the approval threshold is met.
- [ ] Any current Member can trigger execution for an approved Proposal.
- [ ] Treasury movement targets only the approved Member recipient wallet.
- [ ] Execution uses the approved amount and stablecoin mint without client-side mutation.
- [ ] Server verifies the resulting on-chain transfer before marking the Proposal executed.
- [ ] Duplicate execution attempts are rejected idempotently.
- [ ] `pnpm build` passes.

## FW-029 - Add Proposal Proof, Comments, And Edit History Model

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-026

### What to build

Add the lightweight audit trail needed for a real Fund Mode beta without turning Groups into chat.

### Acceptance Criteria

- [ ] Proposal supports one lightweight proof file or one external proof link.
- [ ] Proposal comments are scoped to the Proposal, not a Group-wide chat surface.
- [ ] Proposal edits are allowed only before the first non-proposer approval.
- [ ] Proposal edit history shows what changed.
- [ ] Rejections remain visible in Proposal history.
- [ ] Storage and access rules are documented before file upload ships.

## FW-030 - Add LI.FI Funding Path For Fund Mode Contributions

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-020

### What to build

Extend the existing LI.FI support layer so a Member can route funds for a Fund Mode Contribution when they do not already have Solana USDC.

### Acceptance Criteria

- [ ] Contribution preflight can offer `Route funds for Contribution` when LI.FI is available.
- [ ] Copy avoids bridge jargon and does not imply LI.FI executes the Contribution itself.
- [ ] Route completion returns the Member to the same Fund Mode Group and Contribution context.
- [ ] The Contribution ledger and Receipt model remain unchanged.
- [ ] `pnpm build` passes.

## FW-031 - Add Zerion Readiness Context For Fund Mode Members And Treasuries

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-020

### What to build

Use the existing Zerion readiness boundary to support Fund Mode Contribution and Proposal readiness.

### Acceptance Criteria

- [ ] Readiness output distinguishes Member Contribution readiness from Split Mode Settlement readiness.
- [ ] Output includes Solana USDC and SOL-for-gas readiness where Zerion data supports it.
- [ ] Fund Mode use stays read-only and never becomes signing, wallet connection, or Treasury execution.
- [ ] Docs explain required Zerion CLI setup and optional x402 without inventing secrets.
- [ ] `pnpm build` passes.

## FW-032 - Run Invite-Only Fund Mode Beta Rehearsal And Integration QA

**Status:** Ready
**Priority:** P1
**Type:** AFK
**Blocked by:** FW-028

### What to verify

Run the one-month beta path with real wallets on devnet before public claims change.

### Acceptance Criteria

- [ ] Fund Mode Group creation works for an invite-enabled wallet.
- [ ] Second Member joins by invite link.
- [ ] Treasury initialization succeeds and persists verified Squads addresses.
- [ ] Member makes a Contribution and the Treasury balance updates.
- [ ] Member creates a reimbursement Proposal.
- [ ] Other Member approves or rejects.
- [ ] Approved Proposal executes through the Treasury.
- [ ] LI.FI and Zerion support paths are checked where available.
- [ ] Findings are either fixed or split into new indexed issues.

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

**Status:** Ready  
**Priority:** P2  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

`pnpm audit --audit-level moderate` reports 26 advisories, including Solana transitive `bigint-buffer`, Vercel/Cloudflare tooling `tar` and `undici`, PostCSS, AJV, esbuild, and uuid advisories.

### Acceptance Criteria

- [ ] Update safe direct dependencies where patched versions are available.
- [ ] Document advisories that are transitive with no patched path yet.
- [ ] Confirm deploy/build tooling updates do not break Cloudflare Pages output.
- [ ] `pnpm audit --audit-level moderate` is clean or remaining advisories are explicitly accepted with rationale.
- [ ] `pnpm build` passes.

### Notes

Created from CSO finding `FW-CSO-004` on 2026-05-06. This is important but below the immediate ledger integrity fixes.

### User Stories Covered

26

## FW-018 - Add Production Browser Security Headers

**Status:** Ready  
**Priority:** P3  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

The app does not currently configure browser hardening headers such as `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, or CSP.

### Acceptance Criteria

- [ ] Add baseline security headers in Next or Cloudflare configuration.
- [ ] Do not break wallet-adapter, QR scanning, Supabase, LI.FI, or analytics behavior.
- [ ] Roll out CSP only after testing required wallet and third-party domains.
- [ ] `pnpm build` passes.

### Notes

Created from CSO finding `FW-CSO-005` on 2026-05-06.

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

**Status:** Ready  
**Priority:** P2  
**Type:** AFK  
**Blocked by:** FW-004

### What to fix

`getBridgeQuote` converts the human USDC amount with `parseFloat(params.fromAmount) * 1e6` before calling LI.FI. That accepts malformed strings and can produce unsafe, rounded, exponential, or non-finite values. This is a support path rather than the core Settlement ledger, but it can still create bad quotes or confusing wallet prompts.

### Acceptance Criteria

- [ ] Add a shared USDC amount parser for LI.FI top-up inputs that rejects malformed strings, non-finite numbers, zero/negative values, more than six decimals, and unsafe integer raw amounts.
- [ ] Use integer string math instead of floating point for `fromAmount`.
- [ ] UI shows a clear validation error before requesting a LI.FI quote.
- [ ] Tests cover malformed, fractional, too-precise, and valid top-up amounts.
- [ ] `pnpm build` passes.

### Notes

Created from AI pentest on 2026-05-06. Evidence: `lib/lifi-bridge.ts` lines 47-55 builds the quote amount with `parseFloat`; `components/cross-chain-bridge-modal.tsx` lines 89-103 forwards the raw input string to `getBridgeQuote`.

### User Stories Covered

21, 27, 28

## FW-022 - Retire Direct Browser Supabase Ledger Helpers After RLS Lockdown

**Status:** Ready  
**Priority:** P2  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

After FW-014, direct browser Supabase reads should no longer be part of the ledger access model. `lib/db.ts` still keeps direct `supabase.from(...)` helpers for profiles, Expenses, splits, and Settlements. Current main UI paths use HTTP APIs, but these helpers now either fail under RLS or invite future agents to reintroduce public anon-table access assumptions.

### Acceptance Criteria

- [ ] Remove unused direct browser Supabase ledger helpers from `lib/db.ts`, or rewrite them to call protected HTTP APIs.
- [ ] Keep invite-code lookup and dashboard reads on server-backed routes only.
- [ ] Ensure no browser component imports the raw `supabase` client for private ledger tables.
- [ ] `pnpm build` passes.

### Notes

Created from AI pentest on 2026-05-06. Evidence: `lib/db.ts` lines 110-145 reads `profiles`; lines 208-238 reads `expenses` and `expense_splits`; lines 287-295 reads `settlements` through the public Supabase client. `rg` currently shows the main app path mostly uses the HTTP wrappers, so this is a cleanup/hardening issue rather than a currently exploitable data leak after FW-014.

### User Stories Covered

1, 2, 12, 13, 15, 16, 31, 32, 33

## FW-023 - Add Wallet-Session Abuse Controls And Origin Binding

**Status:** Ready  
**Priority:** P3  
**Type:** AFK  
**Blocked by:** FW-014

### What to fix

Wallet challenge and verification endpoints are simple and correct for the current MVP, but they have no rate limits and the signed message is not explicitly bound to the deployment origin or Solana cluster. This is not a direct bypass because challenges are nonce-backed and HMAC-bound to httpOnly cookies, but production should add abuse controls before public launch traffic.

### Acceptance Criteria

- [ ] Rate-limit `/api/auth/wallet/challenge` and `/api/auth/wallet/verify` by IP and wallet address.
- [ ] Include deployment origin and Solana cluster in the wallet challenge message.
- [ ] Consider `__Host-` cookie names for production session cookies where deployment constraints allow it.
- [ ] Add tests for challenge mismatch, expired challenge, invalid signature, and origin/cluster message formatting.
- [ ] `pnpm build` passes.

### Notes

Created from AI pentest on 2026-05-06. Evidence: `app/api/auth/wallet/challenge/route.ts` lines 11-26 issues challenges without throttling; `lib/server/wallet-session.ts` lines 156-166 builds the message without origin or cluster fields.

### User Stories Covered

25, 26, 31, 32, 33
