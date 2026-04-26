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
- Invite link and QR join flow
- Expense entry with Splitwise-style split methods:
  equal, exact amounts, percentage, and shares
- Balance computation
- Simplified settlement graph
- Settlement receipt route
- Activity Feed
- Creator-owned Expense edit/delete flow with later-Settlement guard

**Still to finish before calling the Split Mode path polished:**

- Shareable Settlement Request Link flow from the Group page
- Global profile display-name polish
- Group total settled volume display
- Final empty states and copy pass

**Mainnet-beta hardening inside Phase 1:**

- Supported mainnet USDC mint wiring
- Clear insufficient-USDC and insufficient-SOL states
- Recipient USDC token-account auto-creation inside settlement flow
- Production RPC wiring
- Mobile-web polish for join and settle flows

**Exit criterion:** a real user can open the web app on mobile or desktop, join a Group, log Expenses, settle their current net Balance in USDC, and land on a usable Receipt flow that is structurally ready for mainnet-beta.

---

## Phase 1.5 - Sponsor support layers

This phase supports the MVP. It does not redefine it.

### LI.FI support

**Goal:** help a debtor arrive at Solana USDC when they do not already have enough funds on Solana.

**Shipped groundwork:**

- LI.FI SDK installed
- Route discovery and execution plumbing
- Cross-chain UI groundwork

**Still to finish:**

- Recovery/top-up branch when a debtor lacks USDC on Solana
- Clean handoff back into the normal Group Settlement flow
- Mainnet-safe copy and error states

**Exit criterion:** a user with funds on another chain can top up into Solana USDC and then perform the normal Group Settlement flow.

### Zerion support

**Goal:** add wallet analysis and future agent support without entering the primary settlement path.

**Near-term scope:**

- Wallet analysis for insufficient-funds guidance
- Optional reminder / suggestion layer
- Stretch agent prototype for the Zerion track

**Explicitly not required in the MVP path:**

- Social login
- Embedded wallet auth
- Replacing wallet-native identity

---

## Phase 2 - Fund Mode MVP

**Goal:** support pooled USDC Treasury flows without polluting the Split Mode product.

**Already present in the repo:**

- Group creation supports Fund Mode
- Treasury initialization exists
- Contribution history and on-chain Treasury balance are surfaced
- Multisig and vault addresses are both stored

**Still to build:**

- Proposal creation UI
- Approval UI
- Execution flow
- Signer-management rules after Treasury initialization
- Better Contribution UX

**Exit criterion:** a Fund Mode Group can initialize a Treasury, accept Contributions, create a Proposal, approve it, and execute it through the stored Squads identities.

---

## Phase 3 - Submission polish (through May 11, 2026)

**Goal:** submit a coherent consumer product story instead of a pile of sponsor demos.

**Must-have narrative:**

- Web app first
- Private Group creation
- Fast Expense entry
- Live Group Balances
- One-click USDC Settlement
- Clear Receipt

**Submission work:**

- Demo videos
- Submission copy
- End-to-end rehearsals
- Judge-oriented screenshots and notes
- Mainnet-beta readiness review or clearly explained mainnet-beta target with devnet rehearsal evidence

**Track priorities:**

1. Visa Frontier
2. LI.FI
3. Zerion
4. Eitherway, if time allows

---

## Phase 4 - Post-hackathon expansion

Only pursue these after the core Group ledger and USDC settlement flow are reliable.

**Product expansion:**

- Multi-stablecoin support
- Cross-chain direct flows beyond top-up
- Embedded wallets
- Social login
- Gas abstraction / gasless settlement
- Telegram bot and Telegram mini app
- Wallet mini dapp distribution
- AI bill parsing and natural-language Expense entry

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
