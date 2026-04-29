# FundWise - Roadmap

Phased plan from pivot cleanup through hackathon submission and post-hackathon expansion. See [STATUS.md](./STATUS.md) for the current checkpoint, [PRD.md](./PRD.md) for the locked MVP shape, and [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) for track-specific framing.

---

## Phase 0 - Pivot cleanup (April 25-26) ✅

**Goal:** remove prediction-market baggage and reframe the product as Splitwise on Solana.

**Completed:**

- Removed prediction-market, Kalshi, ZK-compression, LP-yield, and related dependencies
- Rewrote the landing page around FundWise
- Renamed `circles` to `groups`
- Moved off the inherited Firebase path and into the current Supabase-backed model
- Verified `pnpm build`

**Exit criterion:** the repo and UI clearly describe FundWise instead of the old hackathon project.

---

## Phase 1 - Split Mode MVP (core shipped, hardening active)

**Goal:** a user can create a private Group, add Expenses, see live Balances, and settle exact USDC amounts on Solana.

**Shipped:**

- Group CRUD UI
- Zero-state Group creation with Split Mode preselected
- Invite link and QR join flow
- Expense entry with Splitwise-style split methods:
  equal, exact amounts, percentage, and shares
- Balance computation
- Simplified settlement graph
- Settlement receipt route
- Activity Feed
- Creator-owned Expense edit/delete flow with later-Settlement guard
- Shareable Settlement Request Link flow from the Group page
- Group total settled volume display on the Group page
- Global profile display-name editing with reuse across Groups
- Final empty-state and copy pass across Group screens
- Responsive pass across the landing page, Group list, Group page, Receipt, and modal surfaces
- Consumer landing polish with product-first messaging, cleaner partner branding, and consistent iconography
- Wallet-signed session cookies for protected FundWise actions
- Authenticated server-side ledger writes for Groups, Members, Expenses, Settlements, Contributions, and profile updates
- Session-aware Group and Receipt reads instead of public browser Supabase ledger reads
- RPC verification before persisting Settlement and Contribution receipts

**Still to finish before the next full devnet rehearsal:**

- Manual breakpoint QA across landing, Group list, Group page, join flow, dialogs, and Receipt
- Devnet settlement UX hardening around insufficient-USDC states, insufficient-SOL states, and clearer ATA-creation messaging
- Multi-currency Expense entry planning: Source Currency capture, current exchange-rate quote, Exchange Rate Snapshot storage, and USD/USDC ledger conversion without changing the USDC settlement asset
- Expense Proof planning: optional merchant receipt photo / PDF upload tied to Expense records
- Ongoing frontend maintainability: context-aware app header, wallet-modal CTAs, split `app/groups/[id]/page.tsx` into components (no behavior change); optional Phantom Connect when Portal is ready

**Execution order inside Phase 1:**

1. Keep quality gates green while finishing on-chain settlement hardening and devnet wiring
2. Manual QA and devnet rehearsal
3. LI.FI support layer
4. Zerion support layer
5. Isolated audits and later mainnet readiness

**Backend trust and mainnet-beta hardening inside Phase 1:**

- Authenticated wallet-bound server-side ledger writes with protected Group / Receipt reads
- RPC verification before persisting Settlement and Contribution receipts
- Exchange-rate provider boundary plus stored Exchange Rate Snapshots for any Expense entered in a Source Currency other than the ledger value
- Off-chain storage path and access rules for Expense Proof uploads
- Supported mainnet USDC mint wiring
- Clear insufficient-USDC and insufficient-SOL states
- Recipient USDC token-account auto-creation inside settlement flow
- Production RPC wiring

**On-chain integration rule for this phase:**

- Keep Split Mode on the simplest credible path:
  direct Solana USDC settlement plus the minimum on-chain handling required for safety and devnet rehearsal
- Do not invent new custom contracts unless the product actually needs them
- If custom contract work is needed later, prefer it in Fund Mode or isolated sponsor / treasury surfaces instead of the core Split Mode flow

**Exit criterion:** a real user can open the web app on mobile or desktop, join a Group, log Expenses, settle their current net Balance in USDC, and land on a usable Receipt flow that is structurally ready for mainnet-beta.
Wallet connect should not break that path; it must restore the user's original intent instead of forcing re-navigation.

---

## Phase 1.5 - Sponsor support layers

This phase supports the MVP. It does not redefine it.

This phase starts only after the frontend pass, backend trust pass, and on-chain settlement hardening are in place.

### LI.FI support

**Goal:** help an EVM-first debtor arrive at Solana USDC without needing to think in bridge jargon or manually reason about route details.

**Shipped groundwork:**

- LI.FI SDK installed
- Route discovery and execution plumbing
- Cross-chain UI groundwork

**Still to finish:**

- `Add funds` / `Top up to settle` entry point when a debtor lacks USDC on Solana
- Clean handoff back into the normal Group Settlement flow
- Mainnet-safe copy and error states

**Exit criterion:** a user with funds on another chain can connect their existing EVM wallet, top up into Solana USDC, and then complete the normal Group Settlement flow without learning the underlying route mechanics.

### Zerion support

**Goal:** add wallet analysis and CLI-driven agent support that strengthens the product story without entering the primary settlement path.

**Near-term scope:**

- Wallet analysis for insufficient-funds guidance
- Optional reminder / suggestion layer
- Zerion CLI agent prototype for the track

**Explicitly not required in the MVP path:**

- Social login
- Embedded wallet auth
- Replacing wallet-native identity

---

## Phase 2 - Fund Mode MVP

**Goal:** support pooled USDC Treasury flows without polluting the Split Mode plus LI.FI hackathon story.

**Already present in the repo:**

- Group creation supports Fund Mode
- Treasury initialization exists
- Contribution history and on-chain Treasury balance are surfaced
- Multisig and vault addresses are both stored

**Still to build:**

- Proposal creation UI
- Approval UI
- Execution flow
- Reimbursement-first proposal flow where Treasury payouts go to Member wallets only
- Proposal-scoped comments and lightweight proof attachments, without expanding to Group-wide chat
- Proposal evidence model: one lightweight uploaded file plus optional external link
- Proposal edit history and pre-approval-only editing
- Proposal review states with approve and reject
- Proposal closure model where rejection ends the current Proposal and retries require a new one
- Separate proposal execution step after approvals reach threshold
- Approved proposal execution can be triggered by any Member
- Signer-management rules after Treasury initialization
- Treasury policy design: keep MVP on strict proposal-based spending, then evaluate Squads permissions / spending limits for trusted low-value withdrawals
- Better Contribution UX

**Exit criterion:** a Fund Mode Group can initialize a Treasury, accept Contributions, create a Proposal, approve it, and execute it through the stored Squads identities.

---

## Phase 3 - Submission polish (through May 11, 2026)

**Goal:** submit a coherent consumer product story instead of a pile of sponsor demos.

**Must-have narrative:**

- Web app first
- Private Group creation
- Fast Expense entry
- Optional receipt photo upload
- Currency conversion into a stable USD/USDC ledger value
- Live Group Balances
- One-click USDC Settlement
- Clear Receipt

**Submission work:**

- Demo videos
- Submission copy
- End-to-end rehearsals
- End-to-end devnet testing after the full stack is rewired
- Judge-oriented screenshots and notes
- Mainnet-beta readiness review or clearly explained mainnet-beta target with devnet rehearsal evidence

**Track priorities:**

1. Visa Frontier
2. LI.FI
3. Zerion
4. Eitherway, if time allows
5. Fund Mode only as future-direction evidence unless the Proposal lifecycle is genuinely complete

---

## Phase 4 - Post-hackathon expansion

Only pursue these after the core Group ledger and USDC settlement flow are reliable.

**Product expansion:**

- Multi-stablecoin support
- Broader Source Currency support for Expense entry, including exchange-rate provider redundancy and better display of original amount vs converted ledger amount
- Cross-chain direct flows beyond top-up
- Embedded wallets
- Social login
- Gas abstraction / gasless settlement
- Stablecoin-only user experience where fees and bridging are abstracted away from the end user
- Easier web2 onboarding and offboarding:
  bank-transfer style funding, fiat-to-stablecoin ramps, and later card or account-style interfaces for non-crypto users
- FundWise Agent as the umbrella assistant layer for drafting Expenses, attaching proof, reminders, Group summaries, and Proposal support
- Telegram auth, Telegram bot, and Telegram mini app as FundWise Agent distribution for existing group chats
- Agent skill plus scoped agent access so personal agents can create requests, read Proposals, and operate within wallet-bound permissions
- Wallet mini dapp distribution
- Native mobile app once the shared engine and secondary surfaces are stable
- AI bill parsing beyond basic receipt-photo upload and natural-language Expense entry beyond draft-safe FundWise Agent flows

**Channel strategy:**

- Keep one core product engine: wallet-bound ledger APIs, proposal rules, and settlement logic must be shared across every surface
- Expand surfaces in this order:
  web app -> FundWise Agent on Telegram bot / Telegram mini app -> agent skill / agent access -> wallet mini dapp -> native mobile app
- Telegram should reuse the existing Group model rather than redefining it; group-chat commands should call the same FundWise Agent and backend capabilities
- Telegram should stay read-only and draft-safe plus comments/history; approvals, execution, and money movement must bounce to the app for wallet confirmation
- Telegram identity should use one active wallet per Telegram account, with relinking as an explicit later flow rather than multi-wallet ambiguity
- Telegram chat mapping should start as one chat -> one FundWise Group, with switch-group behavior deferred until the simpler model is proven
- Any Member may add the bot, but every participant must authenticate one-on-one in DM before the bot acts for them in the group chat
- The shared backend likely needs new schema for Telegram links, Expense Proof attachments, Proposal comments, proof attachments / links, Proposal edit history, and later agent capability grants before those channels are built
- Agent access should use scoped capabilities, not broad permanent API keys
- For long-range onboarding and fee abstraction research, Bridge is the more direct infrastructure candidate today; Altitude is better treated as UX and operating-model inspiration unless its consumer surface changes materially

**Fund Mode expansion:**

- Better treasury UX
- Refund / closeout flow
- Yield integrations if user demand justifies them
- Custom Anchor vault if Squads UX becomes the bottleneck

**Operations and analytics:**

- Activation and settlement analytics
- Better production monitoring
- Mainnet support tooling

---

## Implementation skills

- `review-and-iterate` before each phase exit
- `frontend-design-guidelines` and `brand-design` for user-facing polish
- `openai-docs` or `find-docs` when vendor docs are needed
- `deploy-to-mainnet` once the core path is actually production-ready
