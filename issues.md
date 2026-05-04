# FundWise Issues

**Last indexed:** 2026-05-04
**Deadline:** 2026-05-11 Colosseum Frontier submission
**Current focus:** make the Split Mode devnet demo reliable before adding sponsor or agent scope.

This file is the local issue index for hackathon execution. Keep each issue as a vertical slice: a completed issue should be independently demoable, testable, or useful for submission.

## Active Index

| ID | Status | Priority | Type | Title | Blocked by |
| --- | --- | --- | --- | --- | --- |
| FW-001 | Done | P0 | AFK | Run full Split Mode devnet rehearsal and capture blockers | None |
| FW-002 | Done | P0 | AFK | Harden Settlement failure states on devnet | FW-001 |
| FW-003 | Done | P0 | HITL | Sign off responsive QA for the core demo path | FW-001 |
| FW-004 | Open | P1 | AFK | Polish LI.FI Top up to settle handoff | FW-002 |
| FW-005 | Open | P1 | AFK | Add Zerion CLI wallet-readiness support demo | FW-002 |
| FW-006 | Open | P0 | HITL | Prepare judge-facing demo script and submission assets | FW-001, FW-003 |
| FW-007 | Open | P2 | HITL | Decide whether Source Currency and Expense Proof ship in the demo | FW-006 |
| FW-008 | Deferred | P3 | HITL | Fund Mode Proposal lifecycle | Post-hackathon |
| FW-009 | Deferred | P3 | HITL | Fundy, Agent Skill Endpoint, and Scoped Agent Access | Post-hackathon |

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

**Status:** Open  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-002

### What to build

Make LI.FI a support path for debtors who cannot settle because their funds are off Solana. The user-facing path should say `Add funds` or `Top up to settle`, then return to the same Group Settlement flow.

### Acceptance Criteria

- [ ] Insufficient-USDC Settlement state offers `Top up to settle` when LI.FI can help.
- [ ] Copy avoids bridge jargon and does not imply cross-chain creditor settlement.
- [ ] Route completion returns the debtor to the Group Settlement context.
- [ ] The Receipt and ledger model remain unchanged after top-up.
- [ ] Mainnet-sensitive warnings and error states are clear.
- [ ] `pnpm build` passes.

### User Stories Covered

21, 27, 28

## FW-005 - Add Zerion CLI Wallet-Readiness Support Demo

**Status:** Open  
**Priority:** P1  
**Type:** AFK  
**Blocked by:** FW-002

### What to build

Create a narrow Zerion CLI support demo around wallet readiness and next actions. It should strengthen the settlement story without replacing Solana wallet identity or entering the core Settlement path.

### Acceptance Criteria

- [ ] Zerion CLI usage is isolated behind a small boundary or script.
- [ ] The demo can analyze a wallet and summarize readiness for FundWise Settlements.
- [ ] Output distinguishes missing USDC, missing gas, and broader wallet context when available.
- [ ] The feature is framed as support / analysis, not wallet connection.
- [ ] Required credentials or CLI setup are documented without inventing secrets.

### User Stories Covered

28, 48, 49

## FW-006 - Prepare Judge-Facing Demo Script And Submission Assets

**Status:** Open  
**Priority:** P0  
**Type:** HITL  
**Blocked by:** FW-001, FW-003

### What to produce

Create the script, screenshots, and submission copy around one clear story: private Group, Expense, live Balance, USDC Settlement, Receipt. Sponsor layers should appear only after judges understand the core product.

### Acceptance Criteria

- [ ] Demo script fits within the expected submission video length.
- [ ] Screenshots cover Group creation, Expense entry, Balance, Settlement, and Receipt.
- [ ] Submission copy leads with Visa / consumer payments fit.
- [ ] LI.FI is described as `Top up to settle`, not as generic multichain settlement.
- [ ] Zerion is described as wallet-readiness support, not wallet auth.
- [ ] Fund Mode, Fundy, Agent Skill Endpoint, and Scoped Agent Access are marked as future direction unless actually shipped.

### User Stories Covered

26, 27, 28

## FW-007 - Decide Whether Source Currency And Expense Proof Ship In The Demo

**Status:** Open  
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

### User Stories Covered

36, 37, 38, 39

## FW-008 - Fund Mode Proposal Lifecycle

**Status:** Deferred  
**Priority:** P3  
**Type:** HITL  
**Blocked by:** Post-hackathon

### What to build later

Complete Fund Mode Proposals after Split Mode plus LI.FI are reliable. This includes reimbursement-first Proposal creation, approval, rejection, proof, edit history, and explicit execution.

### Acceptance Criteria

- [ ] Proposal creation, approval, rejection, and execution are complete.
- [ ] Proposer cannot approve their own reimbursement Proposal.
- [ ] Rejection closes the Proposal and retries require a new Proposal.
- [ ] Execution is a separate explicit action after threshold approval.
- [ ] Treasury payout goes to a Member wallet in the first Proposal shape.

### User Stories Covered

29, 30

## FW-009 - Fundy, Agent Skill Endpoint, And Scoped Agent Access

**Status:** Deferred  
**Priority:** P3  
**Type:** HITL  
**Blocked by:** Post-hackathon

### What to build later

Build the agent and Telegram surfaces only after the shared web app and wallet-bound backend are stable. Fundy should call FundWise HTTP APIs, use short-lived Telegram link codes, and keep money movement wallet-confirmed in the app.

### Acceptance Criteria

- [ ] Public `https://fundwise.kairen.xyz/skill.md` returns a machine-readable markdown document.
- [ ] Scoped Agent Access supports expiring, revocable capabilities tied to Member wallet, Group, and action type.
- [ ] Fundy runs as a separate Railway service under `services/fundy/`.
- [ ] Telegram-to-wallet linking uses web-generated short-lived codes in DM.
- [ ] On-chain Settlement, Contribution, and Proposal execution deep-link back to the web app for wallet confirmation.

### User Stories Covered

40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
