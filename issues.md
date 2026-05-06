# FundWise Issues

**Last indexed:** 2026-05-06
**Deadline:** 2026-05-11 Colosseum Frontier submission
**Current focus:** Resolve FW-007 Source Currency / Expense Proof demo scope, then clean the shipped-vs-planned product story and define a monetization model before the next public submission pass.

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
| FW-007 | Ready | P2 | HITL | Decide whether Source Currency and Expense Proof ship in the demo | FW-006 |
| FW-008 | Deferred | P2 | HITL | Fund Mode Proposal lifecycle | Split Mode mainnet stability |
| FW-009 | Deferred | P2 | HITL | Fundy, FundWise Agent, and Scoped Agent Access | Split Mode + API contract stability |
| FW-010 | Deferred | P2 | HITL | Payable Settlement Requests, invoice/Receipt endpoint, and Agent Spending Policies | Scoped Agent Access |
| FW-011 | Ready | P1 | HITL | Define monetization model and finance analysis | Owner decision |
| FW-012 | Ready | P1 | AFK | Clean shipped-vs-planned docs and messaging drift | FW-007, FW-011 |
| FW-013 | Ready | P2 | HITL | Decide Fund Mode mini-games scope and prediction-market boundary | FW-008 |

## Handoff Queue For Claude / Lot

1. **Resolve FW-007 with the owner.** Do not partially ship Source Currency or Expense Proof unless the ledger/storage implications are handled end-to-end. The likely hackathon-safe answer is to keep both as future or explicitly mocked in submission copy.
2. **Run FW-011 monetization planning.** Keep Split Mode free if that is the acquisition strategy, but model Settlement fees, Fund Mode fees, Fundy wallet top-up commissions, and partner/card revenue explicitly before claiming a business model.
3. **Run FW-012 docs cleanup after FW-007/FW-011.** The current story needs a shipped/planned matrix and terminology cleanup: `Top up to settle` vs `Route funds for Settlement`, Fundy monorepo vs separate repo, Agent Skill baseline shipped vs Scoped Agent Access planned, and Altitude/Visa/IBAN roadmap positioning.
4. **Keep commits sequential.** Commit feature/code first, then docs/status updates. Do not add co-author trailers.
5. **Quality gate after code changes:** run `pnpm build`. Known warnings from previous runs: workspace-root inference from another lockfile, two unused eslint-disable directives, and `bigint` pure-JS fallback.

### FW-010 Planning Notes (deferred)

- Payable Settlement Requests should extend Settlement Request Links for payment-aware agents, not replace the human wallet flow.
- The planned agent endpoint needs crisp language around unpaid **invoice/request**, x402 / MPP **payment challenge**, verification, and final **Receipt**. A Receipt must only be created after verified payment proof or a confirmed on-chain transfer.
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

**Status:** Ready  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** FW-006

### What to decide

Decide whether Source Currency entry and Expense Proof upload are actual demo features, clickable mockups, or roadmap copy only. Do not partially ship either feature in a way that can corrupt Balance or Settlement math.

### Acceptance Criteria

- [ ] Source Currency scope is explicitly marked as shipped, mocked, or future.
- [ ] Expense Proof scope is explicitly marked as shipped, mocked, or future.
- [ ] If Source Currency ships, every Expense stores converted USD/USDC ledger value plus Exchange Rate Snapshot.
- [ ] If Expense Proof ships, file/link storage, preview, and access rules are documented.
- [ ] Submission copy matches the actual shipped state.

### Notes

Ready for owner / agent decision. Hackathon-safe default: do not ship either as real product behavior unless the next agent can complete the end-to-end ledger and storage path without risking Balance or Settlement correctness.

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

- [x] Baseline public `https://fundwise.kairen.xyz/skill.md` endpoint exists and returns machine-readable markdown.
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
- [ ] x402 and MPP behavior is documented without implying broad wallet control.

### User Stories Covered

41, 42, 43, 50, 51, 52, 53, 54

## FW-011 - Define Monetization Model And Finance Analysis

**Status:** Ready  
**Priority:** P1  
**Type:** HITL  
**Blocked by:** Owner decision

### What to decide

Create a concrete monetization model that keeps Split Mode attractive as a free acquisition loop while defining how FundWise and Fundy can become sustainable. The current candidate paths are: free Split Mode, optional Settlement transaction fee, Fund Mode fee or subscription, Fundy wallet top-up commissions, payment-rail/card partner revenue, and possibly premium finance analysis.

### Acceptance Criteria

- [ ] Decide whether Split Mode Settlements stay free or include a tiny fee.
- [ ] Model Fund Mode monetization: flat subscription, Treasury percentage, per-Proposal fee, or hybrid.
- [ ] Model Fundy monetization: wallet top-up commission, agent wallet balance, premium personal-finance features, and tax-advisory upsell.
- [ ] Estimate user tolerance for each fee type and identify which fees would hurt growth.
- [ ] Define a “free forever” surface that can acquire early crypto-native users.
- [ ] Add a simple first-year revenue scenario with conservative assumptions.
- [ ] Update public docs/submission only after the model is chosen.

### Notes

Owner preference as of 2026-05-06: keep Split Mode free for initial users if possible; explore Settlement fee only carefully. Fund Mode and Fundy are more plausible paid surfaces.

### User Stories Covered

26, 28, 40, 45, 54

## FW-012 - Clean Shipped-vs-Planned Docs And Messaging Drift

**Status:** Ready  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-007, FW-011

### What to fix

Create a docs cleanup pass that does not add new product scope. The goal is to make README, STATUS, ROADMAP, PRD, SUBMISSION, and review language agree on what is live, what is demo-only, what is planned, and what is speculative.

### Acceptance Criteria

- [ ] Add or update a shipped/planned matrix: Split Mode, Fund Mode, LI.FI, Zerion, Agent Skill Endpoint, Scoped Agent Access, Payable Settlement Requests, Fundy, Visa / IBAN / Altitude top-ups, mini-games, and tax.
- [ ] Pick one canonical LI.FI phrase: `Top up to settle` or `Route funds for Settlement`, then make docs and UI copy consistent.
- [ ] Resolve Fundy runtime/repo inconsistency: older docs mention `services/fundy/` monorepo; newer roadmap says separate repo.
- [ ] Clarify that `/skill.md` baseline exists, while Scoped Agent Access and agent-paid Settlements remain planned unless implemented.
- [ ] Clarify that Visa / IBAN / Altitude-style top-up is a future onboarding path for non-crypto users, not current MVP functionality.
- [ ] Remove or archive stale claims that imply Fund Mode Proposals, Fundy, autonomous agent payments, or card/IBAN top-ups are shipped.
- [ ] Keep the primary public story focused on Split Mode until mainnet launch.

### Notes

This issue was created from the 2026-05-06 product roast follow-up. Only docs should change under this issue unless a stale doc claim exposes an actual product bug.

### User Stories Covered

26, 27, 28, 40, 41, 50, 51

## FW-013 - Decide Fund Mode Mini-Games Scope And Prediction-Market Boundary

**Status:** Ready  
**Priority:** P2  
**Type:** HITL  
**Blocked by:** FW-008

### What to decide

The owner wants future Fund Mode Groups to support private mini-games or Group activities funded from a shared pool, possibly including prediction-market-like mechanics. This must be explicitly scoped because the repo previously pivoted away from prediction-market code and the primary payments story should not be contaminated by speculative game mechanics.

### Acceptance Criteria

- [ ] Decide whether mini-games are in scope at all for FundWise or belong in a separate product/module.
- [ ] If retained, define the first harmless mini-game shape without regulated prediction-market or gambling risk.
- [ ] Confirm that mini-games do not ship before Fund Mode Proposal safety is complete.
- [ ] Keep mini-games out of Split Mode and out of the hackathon submission story.
- [ ] Add a future ADR only if the decision is hard to reverse, surprising, and a real trade-off.

### User Stories Covered

29, 30
