# FundLabs and FundWise Positioning

This is the repo-safe adaptation of `FundLabs_Positioning_Strategy.docx`.
Use it as the source of truth for FundLabs umbrella positioning, FundWise public copy, investor narrative, and claims guardrails.

The strategy is intentionally ambitious. The docs and product must still distinguish what is shipped, what is in beta, and what is a roadmap or fundraising claim.

## Canonical Lines

**FundLabs:** FundLabs builds the financial layer for groups, human or AI.

**FundWise:** Split expenses. Earn together.

**Fundy:** Finance agent for the group chat era.

**Receipt Endpoint:** Audit trail for agentic commerce.

## Company Umbrella

FundLabs is the company and product family. The umbrella category is group financial infrastructure, not "crypto bill splitting."

The long-term stack has three products:

| Product | Primary user | Core job | Revenue hypothesis |
| --- | --- | --- | --- |
| FundWise | Friend Groups, later DAOs and recurring shared treasuries | Track shared spending, settle, pool USDC, approve spend, and eventually make idle Group money productive | Fund Mode subscription, later yield spread or treasury fee |
| Fundy | Individuals, Telegram Groups, and later agent networks | Bring FundWise actions, reminders, drafts, readiness checks, and personal-finance help into the group chat | Premium subscription, later transaction or B2B fees |
| Receipt Endpoint | AI agents, developers, auditors, and payment-aware services | Return structured, verifiable Receipts for agent and on-chain payments | Per-call API pricing via x402 / MPP-style rails |

The shared thesis: Groups already coordinate money, but current tools split the workflow across chat, spreadsheets, bank apps, wallets, and receipts. FundLabs should become the standard financial layer that lets groups and agents track obligations, move stablecoins, verify outcomes, and keep an audit trail.

## FundWise Positioning

FundWise is the first FundLabs product.

Public product copy should make FundWise feel like a better shared-finance app first:

> FundWise helps private Groups track shared spending, see live Balances, and settle up with verifiable USDC Receipts. Fund Mode turns those Groups into shared Treasuries for Contributions, Proposals, approvals, proof, and eventually productive idle money.

For users, lead with the familiar:

- Create a private Group.
- Log shared Expenses.
- See live Balances.
- Share settle-up links.
- Confirm exact USDC Settlement.
- Get a clear Receipt.
- Move into Fund Mode when the Group wants to fund before spending instead of chasing reimbursements after.

For investors and roadmap discussion, the sharper thesis is:

- Split Mode is the wedge because it is easy to understand and demo.
- Fund Mode is the product because durable Groups need shared Treasuries, governance, proof, exit mechanics, integrations, and eventually yield.
- Fundy is the distribution layer because real Groups already coordinate in Telegram and personal agents.
- Receipt Endpoint is the infrastructure expansion because agentic commerce needs structured receipts, not just payment rails.

## Shipped vs Direction

**Shipped/demoable now:** Split Mode devnet MVP: Group, Expense, Balance, Settlement, Receipt, Settlement Request Links, protected reads/writes, and sponsor support groundwork.

**Active beta direction:** Fund Mode: shared USDC Treasuries, Contributions, reimbursement Proposals, approvals, proof/history, and explicit execution. Treasury initialization and Contributions exist; Proposal lifecycle is not complete yet.

**Planned:** Fundy, Scoped Agent Access, Payable Settlement Requests, Receipt Endpoint, productive treasury/yield strategy, gas abstraction, fiat/card/IBAN rails, broader AI-agent participation, and non-crypto onboarding.

**Out of scope for current FundWise:** prediction markets, mini-games, broad autonomous spending, automatic settlement, yield claims as live behavior, any-chain settlement as core behavior, and any product claim that bypasses wallet-confirmed money movement.

## Messaging Hierarchy

### Consumer

Lead with shared spending and trust:

- Split expenses.
- Settle up.
- Share live settle-up links.
- See who owes whom.
- Get a verifiable Receipt.
- Fund a shared Treasury when the Group wants to pay before spending.

Keep crypto mechanics in the background until the user is in a wallet, Settlement, Receipt, Treasury, or developer context.

### Product / launch story

Lead with one coherent path:

`Group -> Expense -> Balance -> Settlement -> Receipt`

Then explain:

- Settlement Request Links are the acquisition loop.
- CCTP + LI.FI help when the debtor's funds are not already Solana USDC (post-launch multi-chain phase).
- Privy + MoonPay + Bridge.xyz cover fiat onboarding for non-crypto users (later phase); Squads Protocol stays the group-treasury layer.
- Zerion helps with wallet readiness and agent-style analysis.
- Fund Mode is the hero direction and ships alongside Split Mode at the Summit Berlin launch (2026-06-13).

### Investor

Lead with FundLabs:

> FundLabs builds the financial layer for groups, human or AI. FundWise starts with shared expenses and grows into yield-aware shared Treasuries. Fundy brings the system into Telegram and personal agents. Receipt Endpoint gives agentic commerce a verifiable audit trail.

Useful investor hooks:

- Shared expenses are a proven behavior, but tracked balances earn nothing and settle poorly.
- Group chats are where coordination already happens, but they do not produce financial state.
- AI agents can pay, but they still need approvals, limits, receipts, and audit trails.
- Solana makes low-cost, fast stablecoin settlement credible for consumer Groups and agent workflows.

## Product Narrative

### FundWise

**Current public story:** split shared Expenses and settle exact USDC Balances with verifiable Receipts.

**Next product story:** fund the Group upfront, earn together later, and reimburse Members through Proposal-based spending.

Fund Mode should be framed as "pay before, earn together" only when the copy also explains its current state. Until yield routing is implemented, use "shared Treasury" and "productive idle money direction" instead of claiming live APY.

### Fundy

Fundy is the hosted Telegram and personal-finance companion for FundWise. It is planned as a separate service and repository.

Repo-safe current framing:

- Starts command-first.
- Reads Balances, Expenses, Settlements, Receipts, and later Proposals.
- Creates drafts and reminders.
- Uses Zerion readiness where useful.
- Deep-links back to the FundWise web app for wallet-confirmed money movement.

Future framing:

- Natural-language finance agent.
- Group chat interface for shared spending.
- Human and AI-agent coordination surface.
- Premium personal-finance and later tax-advisory layer.

### Receipt Endpoint

Receipt Endpoint is the planned developer and agent-commerce infrastructure surface.

Repo-safe current framing:

- It is not shipped in the FundWise web app.
- It should grow from Payable Settlement Requests and the existing Receipt model.
- It should return structured, verifiable payment records only after payment verification.
- It requires Scoped Agent Access and Spending Policies before private or money-moving use.

Future framing:

- Structured receipts for x402, MPP, and other agent-payment rails.
- IPFS/Arweave-style receipt archives where appropriate.
- Accounting, tax, DAO tooling, and agent-platform integrations.

## Monetization Position

Keep Split Mode free at launch. It is the acquisition loop and trust builder.

Preferred revenue sequence:

1. Fund Mode subscription or beta plan for serious Groups with Treasuries, Proposals, proof, and admin value.
2. Fundy premium for reminders, readiness, personal finance, automation, and later tax support.
3. Receipt Endpoint per-call pricing after the API exists and has real users.
4. Routing, card, IBAN, top-up, or yield revenue only when provider integrations and risk controls are real.

Do not present yield spread, automated agent execution fees, or per-receipt API revenue as live FundWise revenue.

## Claims Guardrails

Use these claims freely:

- FundLabs builds the financial layer for groups, human or AI.
- FundWise starts with private Groups, shared Expenses, live Balances, USDC Settlement, and verifiable Receipts.
- Split Mode is the shipped wedge.
- Fund Mode is the hero product direction and invite-only beta focus.
- Fundy and Receipt Endpoint are planned expansion products in the same FundLabs stack.
- Settlement Request Links resolve the live Balance and require wallet confirmation.

Use these only with clear future/beta wording:

- shared Treasuries earning yield
- automatic settlement
- any-currency or any-chain settlement
- gasless UX
- AI agents joining or spending from Group Treasuries
- x402 / MPP payment execution
- IPFS or Arweave receipt archives
- Visa, card, IBAN, Altitude, Privy, Kora, CCTP, Meteora, Solayer, or other specific partner/infrastructure claims

Avoid these claims:

- "first crypto Splitwise"
- "FundWise settles automatically"
- "FundWise supports any chain and any currency"
- "FundWise yield is live"
- "Fundy is shipped"
- "Receipt Endpoint is live"
- "Agents can spend without user limits"
- "Prompt instructions authorize money movement"
- "Settlement is gasless"
- "FundWise is Telegram-first"

## Source Notes

The Desktop strategy doc includes market-size, investor, partner, APY, audit, and protocol adoption claims. Treat those as pitch inputs that require source verification before publishing externally. Keep this repo's docs focused on positioning, product order, and claims boundaries unless a claim has been verified separately.
