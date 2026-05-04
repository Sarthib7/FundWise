# FundWise - Roadmap

Phased plan from pivot cleanup through hackathon submission and post-hackathon expansion. See [STATUS.md](./STATUS.md) for the current checkpoint, [PRD.md](./PRD.md) for the locked MVP shape, and [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) for track-specific framing.

---

## GTM and product order

The strategic rollout order is locked, even where individual phases run in parallel for engineering. See [ADR-021](./docs/adr/0021-gtm-rollout-order-split-fundy-fund-mode-beta.md) for the locked decision:

1. **Split Mode on Solana mainnet** — the public, open product. Settlement asset is **USDC** ([ADR-011](./docs/adr/0011-fix-usdc-as-the-mvp-settlement-asset.md)). This is what hackathon judges and early users see, and what we test in production.
2. **Fundy companion agent** — a personalized finance Telegram agent built in a **separate repository** ([ADR-022](./docs/adr/0022-fundy-moves-to-a-separate-repository.md)) on a **PI agent framework**, using the **Zerion CLI** for wallet intelligence. Fundy manages personal finance for an individual user, plugs into FundWise to manage Group expenses, can be added to friends' Telegram groups, and grows a **tax filing / tax advisory** surface owned by Fundy ([ADR-023](./docs/adr/0023-tax-advisory-and-filing-live-in-fundy.md)). Fundy is a sibling product, not a feature of the FundWise repo.
3. **Fund Mode — invite-only closed beta** — pooled USDC treasuries with proposal-based spending. Launched after Split Mode is stable in production and Fundy is in users' hands; access is gated to invited cohorts before any open release.
4. **Visa-rail card partnerships** — settled USDC reaches Visa merchants through partners (KAST, Avici, Rain). Targeting the **Visa Frontier hackathon track (Germany)** as the first wedge ([ADR-024](./docs/adr/0024-visa-frontier-track-and-card-partnerships.md)); see the partner research brief inside Phase 3.

The repo phases below describe engineering scope; this section is the order in which surfaces are exposed to users.

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

## Phase 2 - Fund Mode MVP (invite-only closed beta)

**Goal:** support pooled USDC Treasury flows without polluting the Split Mode plus LI.FI hackathon story.

**Release model:** Fund Mode is **not** part of the open Split Mode rollout. After Split Mode is stable on mainnet and Fundy is shipping to users, Fund Mode opens as an **invite-only closed beta** to a curated cohort. Public availability is deferred until the Proposal lifecycle is genuinely complete and the treasury surface has been stress-tested with real groups.

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

### Visa Frontier — partner research brief

Reference brief for the Visa-track narrative. Each entry is what we verified plus how the partner plugs into FundWise.

**1. Visa Frontier Hackathon Track (Superteam Germany)**
- Sidetrack on the Solana Frontier Hackathon (online, April 6 – May 11, 2026), Germany-eligible only; prize pool 10,000 USDG (5k / 3k / 2k); winners announced May 27, 2026; sponsor contact `@zCasee` on Telegram.
- Public listing on Superteam Earn does not enumerate explicit judging rubric or required Visa APIs. Frontier-wide messaging says the Visa payments track gives teams access to Visa SMEs and includes Visa staff on the judging panel — i.e. judged on payments fit, not a fixed Visa Direct integration.
- Realistic FundWise framing: position USDC-on-Solana group settlement as a consumer payments use case and show a credible bridge to Visa rails (settled USDC → Visa-network card spend) via one of the partners below. No mandatory SDK to wire in.

**2. KAST (kast.xyz)**
- Stablecoin debit card on Visa rails; funded by USDC / USDT / USDe; deposits on Solana, Ethereum, Polygon, Arbitrum, Tron; founded by ex-Circle leadership; Apple/Google Pay; live "Solana Card" tier with staking rewards.
- FundWise plug-in: after settlement, route a payer's USDC out of the Group to their KAST-funded address so the same balance is spendable at Visa merchants — closes the loop from "settled the trip" to "actually paid for the trip." Lightest wedge is a deep-link / "Top up KAST with this USDC" CTA on the Receipt page.
- Hackathon-grade path: KAST has no public partner API today, so realistic integration is a deposit-address handoff plus co-marketing intro via Superteam. Treat as a narrative + UX partner, not an SDK dependency.

**3. Avici (avici.money) — this is the "Avici/Avia" the user meant**
- Confirmed real product. Self-custodial Solana neobank with a Visa debit card funded exclusively by USDC; deposits on Solana / Ethereum / Polygon; mobile app live on Google Play; frequently benchmarked head-to-head against KAST in Solana-card roundups.
- FundWise plug-in: identical pattern to KAST — settled USDC routes to the user's Avici-funded address for Visa spend. Self-custody framing aligns better with FundWise's wallet-first model and is a cleaner story for the Frontier judges.
- Hackathon-grade path: also no public partner API surfaced. Reach out via the Avici app / site contact and Superteam Germany; pitch as the consumer-card surface for FundWise settlements. Narrative partner, not an SDK.

**4. Other Visa-rail options worth naming**
- **Rain (rain.xyz)** — enterprise card-issuing platform, native Solana support, settles with Visa daily in stablecoins, has a developer-facing API for both custodial and non-custodial wallets. Of all the cards listed, Rain is the only one with a credible "wire it up in a hackathon" path; FundWise could issue a virtual card scoped to a Group treasury for shared expenses. Realistically: API access still requires a partner conversation, so v1 is a mock + design doc, not a live issue.
- **Reap (reap.global)** — USD/HKD Visa cards backed by stablecoin collateral, Circle/Solana/Visa partner. Same shape as Rain but more APAC-anchored; reasonable backup if Rain doesn't reply.
- **Skip for hackathon scope:** Gnosis Pay (EVM-only, doesn't fit Solana narrative), Crypto.com / Bitpanda Card (closed consumer products, no partner-grade hackathon path), Holyheld (EVM-first, similar issue).

Recommended FundWise framing for the Visa Frontier submission: lead with USDC-on-Solana group settlement, then show the "settle → spend" handoff to KAST or Avici as the consumer wedge, and name Rain as the production path for issuing FundWise-branded Group cards post-hackathon.

---

## Phase 4 - Fundy companion agent (separate repo)

**Goal:** ship a personal-finance Telegram agent that an individual user owns end-to-end, that knows their wallets and FundWise Groups, and that can be added to friends' Telegram chats to act as a shared finance copilot. Fundy is the second user-facing surface after Split Mode, and the wedge that opens up the invite-only Fund Mode beta.

**Repository and runtime:**

- **Separate repository** from the FundWise web app. Sibling product; calls FundWise over public HTTP APIs and the Agent Skill Endpoint, never reaches into the FundWise database directly.
- Built on a **PI agent framework** for the agent loop, with the **Zerion CLI** as the primary wallet-intelligence and analytics tool.
- Hosted Telegram bot on **Railway** (`grammy`); command-first v1, LLM layer later (e.g. OpenRouter).

**Capabilities:**

- **Personal finance for the individual user**: portfolio view, spend tracking, balance and runway alerts, wallet readiness checks before Group settlements
- **FundWise Group operations**: drafting Expenses, attaching proof, reminders, Group summaries, and Proposal support — read-only and draft-safe inside Telegram
- **Group-chat mode**: any FundWise Member may add Fundy to a Telegram chat; every participant must authenticate one-on-one in DM before Fundy acts for them in the group chat
- **Tax advisory and tax filing** — long-arc surface inside Fundy. Starts as **tax advisory** (year-to-date taxable events, simple optimization prompts, jurisdiction-aware guidance) and grows into **assisted tax filing** as wallet-data coverage and partner integrations mature. Tax filing is explicitly Fundy's responsibility, not the FundWise web app's.

**Auth and trust boundary:**

- Authenticates users with **web-generated link codes** in DM; calls FundWise **HTTP APIs** with service key + wallet header
- Zerion CLI behind **`/analyze`**, **`/readiness`**, **`/verify`** (`ZERION_API_KEY` first, x402 optional)
- DB-only Proposal approve / reject is allowed in-chat; **on-chain** actions (settle, contribute, execute proposal) deep-link back to the web app for wallet confirmation. Settlements specifically use **Settlement Request Links** to bounce out of Telegram into the signing flow.
- Telegram identity = one active wallet per Telegram account; relinking is an explicit later flow rather than multi-wallet ambiguity. Telegram chat mapping starts as one chat → one FundWise Group.

**FundWise repo prerequisites for Fundy:**

- **Agent Skill Endpoint** (`/skill.md`): public markdown at **`https://fundwise.kairen.xyz/skill.md`** — purpose, allowed vs forbidden calls, auth (profile tokens + optional wallet-signed), limits, errors; any agent can `curl` it. Fundy is the first consumer.
- **Scoped Agent Access API**: permission model for autonomous agents — scoped capabilities tied to Member wallet, Group, and action type (read, draft, comment), not broad permanent API keys. Money-moving action types still require direct wallet confirmation. Supports capability grants with expiration and revocation.
- Backend schema additions before Fundy can ship: Telegram-to-wallet links, agent-access grants, Proposal comments and proof attachments, Proposal edit history, and later agent capability grants.

**Exit criterion:** an individual user can DM Fundy, link their FundWise account, see personal finance and Group context, draft Expenses, get tax-advisory summaries, and add Fundy to a friends' Telegram group where every Member authenticates and uses Fundy without leaving the chat (except for on-chain confirmations).

---

## Phase 5 - Post-hackathon expansion

Only pursue these after the core Group ledger, USDC settlement flow, and Fundy companion are reliable.

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
- FundWise Agent as the umbrella assistant layer for drafting Expenses, attaching proof, reminders, Group summaries, and Proposal support (the in-app counterpart to Fundy)
- Telegram mini app as an additional FundWise Agent distribution surface
- Wallet mini dapp distribution
- Native mobile app once the shared engine and secondary surfaces are stable
- AI bill parsing beyond basic receipt-photo upload and natural-language Expense entry beyond draft-safe FundWise Agent flows
- **Visa-rail card partnerships in production**: graduate the partner research from Phase 3 into a real "settle → spend" handoff. Near-term partners: **KAST** and **Avici** (consumer Solana cards, USDC funding); production-grade issuer path: **Rain** (developer-facing card-issuing API with native Solana support) for FundWise-branded Group cards. Frame Germany / EU presence around the Visa Frontier track relationship.

**Channel strategy:**

- Keep one core product engine: wallet-bound ledger APIs, proposal rules, and settlement logic must be shared across every surface. Fundy reuses the existing Group model rather than redefining it.
- Expand surfaces in this order:
  web app → Fundy (hosted Telegram bot) → Agent Skill Endpoint + Scoped Agent Access → Telegram mini app → wallet mini dapp → native mobile app
- The Agent Skill Endpoint should be the first thing an autonomous agent fetches when discovering FundWise. It should describe all available actions, the Scoped Agent Access auth model, and link to the API surface.
- For long-range onboarding and fee abstraction research, Bridge is the more direct infrastructure candidate today; Altitude is better treated as UX and operating-model inspiration unless its consumer surface changes materially.

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
