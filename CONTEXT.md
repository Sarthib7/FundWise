# FundWise

FundWise is a shared-finance app for private Groups with two modes:

1. Split Mode: track shared expenses in a Group, compute live balances, and settle debts with on-chain USDC transfers.
2. Fund Mode: pool USDC into a shared Treasury and spend from it through Proposals and approvals.

## Positioning

**Company umbrella:** FundLabs builds the financial layer for groups — human or AI. Shared spending, agent finance, and on-chain receipts on Solana. FundWise (shared finance with Split + Fund Modes), Fundy (Telegram-native agent + MCP server), and Receipt Endpoint (Solana tx → structured receipts) are the three FundLabs products. The "human or AI" framing is load-bearing: a human can create a Fund Mode Group, allocate budget through Fundy to an AI agent, have that agent join the Group via FundWise's skill/MCP endpoints, and let the agent log Expenses, hold an allocation, and query Receipt Endpoint for its own payment history. Earlier framing of Fundy and Receipt Endpoint as "planned expansion products" is superseded — both are shipped or shipping by Solana Summit (2026-06-13).

**Canonical public tagline:** Split expenses. Earn together.

Lead public copy with shared spending, live Balances, settle-up links, and clear Receipts. Keep Solana, USDC, wallets, and other crypto mechanics behind the user benefit unless the Member is in a wallet, Settlement, Receipt, or developer context.

`Earn together` maps to Fund Mode direction. It should not imply live yield, automatic settlement, or a complete public Proposal lifecycle until those flows are implemented end to end.

Fund Mode is now the hero product direction for the next build sprint. Split Mode remains the shipped wedge and public proof, but durable Group value should converge on shared Treasuries, Contributions, reimbursement Proposals, approvals, proof/history, and integrations.

## Language

**FundLabs**:
The company and product-family umbrella for group financial infrastructure across humans and AI agents. FundWise, Fundy, and Receipt Endpoint sit under FundLabs.
Avoid: using FundLabs as the app name

**FundWise**:
The shared-finance app for private Groups. Split Mode is the shipped wedge; Fund Mode is the hero product direction.
Avoid: generic crypto Splitwise

**Group**:
A private collection of Members who share expenses or pool funds.
Avoid: Circle, team, squad, pool

**Split Mode**:
The primary MVP mode. Members log Expenses, view live Balances, and settle debts in USDC on Solana.
Avoid: Expense mode, bill-splitting mode

**Fund Mode**:
The secondary mode for pooled money. Members make Contributions into a Treasury and spend from it via Proposals.
Avoid: Treasury mode, pool mode, vault mode

**Expense**:
An off-chain record in a Split Mode Group describing who paid, how much, who participated, and how the amount is split.
Avoid: Bill, charge, transaction

**Source Currency**:
The real-world currency a Member paid or enters for an Expense, such as EUR, USD, INR, or another supported fiat unit. This is future-only for the current public demo. FundWise may show and store this original amount, but it converts the Expense into the Group ledger's USD/USDC value for Balance and Settlement math.
Avoid: Settlement asset

**Exchange Rate Snapshot**:
The conversion rate, quote time, and source used to convert a Source Currency amount into the Group ledger's USD/USDC value when an Expense is created or edited. Historical ledger math uses the stored snapshot, not a constantly floating live rate.
Avoid: Live balance repricing

**Expense Proof**:
A future optional uploaded merchant receipt image, PDF, or external proof link attached to an Expense so Members can verify what was paid. This is different from a FundWise Receipt, which confirms a Settlement.
Avoid: Settlement Receipt

**Settlement**:
An on-chain USDC transfer from a debtor Member to a creditor Member that reduces the debtor's current net Balance in the Group.
Avoid: Payment

**Settlement Request Link**:
A shareable deep link back into the Group that opens the debtor's current settleable state, including the live pending amount and related ledger context. The amount is resolved from the live Group Balance when the link is opened, but the Settlement is never auto-sent.
Avoid: Invoice, static payment link

**Payable Settlement Request**:
A planned agent-readable extension of a Settlement Request Link. It represents one exact, live debtor-to-creditor settlement intent and may expose an x402 / MPP-style payment challenge for an approved agent. It is not a confirmed Settlement and does not create a Receipt until FundWise verifies the payment proof or on-chain transfer.
Avoid: Auto-settle endpoint, generic payment endpoint

**Invoice**:
An unpaid, machine-readable request generated for a Payable Settlement Request. It may include the live amount, expiry, debtor, creditor, accepted rail, and x402 / MPP payment challenge data. It is not a Receipt.
Avoid: Receipt, confirmed settlement

**Spending Policy**:
A human-Member-granted policy that defines how much payment capacity an agent has. It works in two modes:
1. **Agent-as-hands:** the agent acts under a human Member's wallet via a scoped token; the policy caps what the agent can do under that Member's identity.
2. **Agent-as-Member:** the agent has its own wallet that joined the Group as a Member; the policy is set by the human who funded/invited it and caps what the agent can do with its own funds (e.g. per-Settlement cap, daily/weekly cap, allowed Groups, allowed asset, expiry, revocation).
Anything outside the policy must fall back to a Settlement Request Link for human wallet confirmation. The agent-as-Member path is the north-star; agent-as-hands is the lighter slice that exists today.
Avoid: Unlimited approval, broad API key

**Contribution**:
A deposit of USDC into a Fund Mode Treasury by a Member.
Avoid: Deposit, payment

**Proposal**:
A request to spend from a Fund Mode Treasury. In the first Fund Mode shape, this is a reimbursement request filed by a Member who already paid out of pocket, and the Treasury reimburses a Member wallet after approval. It includes recipient, amount, memo, and may include lightweight proof such as one uploaded image or PDF plus an optional external link. It requires approval before execution.
Avoid: Vote, request, withdrawal

**Mirrored Proposal Status**:
The FundWise-side mirror of a Squads on-chain Proposal status — one of `pending`, `approved`, `rejected`, `executed`, `cancelled`. Squads on-chain governance is the source of truth (see ADR-0029); the mirror is a UX-only cache used to render Proposal state without an RPC round-trip on every read. Mirrored values are written only after server-side verification that the on-chain Squads Proposal account matches.
Avoid: Proposal status (without "mirrored"), cached state

**Member**:
A wallet address that has joined a Group. A Member is identified by their Solana public key and shown in the UI with a profile display name. A Member's wallet is human-controlled by default, but may be controlled by an autonomous agent — in which case the human who funded or invited that agent retains policy oversight via Spending Policy and Scoped Agent Access. The "Members of a Group can be human or AI" claim in public copy reduces to this rule.
Avoid: User, participant, signer

**Profile Display Name**:
A human-readable label attached to a Member wallet and reused across Groups in the MVP. It is editable, but it is not the real identity key.
Avoid: Username, handle

**Stablecoin**:
USDC in the MVP. Balances, Settlements, Contributions, and Proposals are denominated in USDC. Expenses may be entered in a Source Currency, but they must be converted into a stored USD/USDC ledger value before Balance math runs.
Avoid: Token, currency, coin

**FundWise Agent**:
The umbrella name for later assistant surfaces that help Members read Group state, draft Expenses or Proposals, upload proof, create reminders, and suggest next actions through scoped wallet-bound permissions. Telegram bot and Telegram mini app are distribution channels for the FundWise Agent, not separate products.
Avoid: Telegram agent, generic AI agent

**Fundy**:
A FundLabs product: a personal finance agent that lives in Telegram and exposes the same tools over MCP for external agents. Fundy is both a standalone product users adopt and FundWise's primary distribution surface — those roles do not conflict. It is command-first in v1 (fixed commands, no natural-language parsing); the end goal is an LLM-backed agent (e.g. OpenRouter) on top of the same tools. Fundy runs as a **separate Node service on Railway** (library: `grammy`) in a **separate repository** per ADR-0022, and calls the **same FundWise HTTP API** as the web app using service-to-service auth and later Scoped Agent Access, not direct Supabase writes from the bot process. Users link Telegram to wallet via **short-lived codes** generated in the authenticated web app (`/link FW-…` in DM). Users authenticate by linking their Telegram account to their FundWise wallet address, then interact with Groups, Balances, Expenses, and Settlements from Telegram. Read-only and draft-safe actions run in Telegram; **database-only** Proposal approve/reject may run in Telegram; **on-chain** Settlement, Contribution, and Proposal execution deep-link back to the web app (reuse **Settlement Request Links** for settle flows). Fundy later owns personal finance, tax guidance, and any Telegram-native companion workflows.
Avoid: FundWise Telegram, the bot, "just a surface"

**Receipt Endpoint**:
A FundLabs product: a Railway-hosted, MCP-catalog-listed, x402/MPP-payable endpoint that turns any Solana transaction into a structured, archivable receipt JSON (IPFS-pinned, on-chain-verifiable). The public surface accepts any Solana tx sig and returns a generic receipt; FundWise Settlements are the **premium first-class source** because they carry richer metadata (Group, Members, Expense linkage, Settlement context). Receipt Endpoint does **not** require FundWise's Payable Settlement Request, Scoped Agent Access, or Spending Policy primitives to ship — earlier guidance tying it to those was superseded on 2026-05-16 in favour of a standalone Railway service that can ship by Solana Summit (2026-06-13). FundWise integration grows the moat over time but is not a release blocker.
Avoid: framing as a FundWise-only feature, claiming Stripe-grade compliance before audit, claiming richer receipts on non-FundWise txs than what Solana RPC plus DEX/protocol metadata actually return.

**Agent Skill Endpoint** (`/skill.md`):
A public URL on the production FundWise host (`https://fundwise.fun/skill.md`) that returns a machine-readable markdown document describing what FundWise is for, what actions autonomous agents may call, what they must not call, how to authenticate, rate limits, errors, and terms of use. Any personal AI agent can `curl` this URL to discover FundWise capabilities and integrate without manual configuration.
Avoid: API docs, developer portal

**Scoped Agent Access**:
The permission model for autonomous agents interacting with FundWise. Covers two cases:
1. **Agent-as-hands** (shipped today): an agent acts on behalf of a human Member. The Member generates a scoped token from `/profile/agents` (or signs a Solana wallet challenge); the token is tied to that Member's wallet, specific Group(s), and action type.
2. **Agent-as-Member** (north-star, partial slice at Summit): the agent has its own wallet that joined the Group as a Member. The human who funded or invited it sets Spending Policy on the agent's own-wallet behavior. The agent authenticates with its own wallet/key; the human's role is policy-setter and revoker, not principal.
Actions that move money still require direct wallet confirmation in both modes unless a Payable Settlement Request flow grants explicit, narrow, revocable payment authority for a specific wallet, Group, asset, limit, and expiry.
Avoid: API keys, bot tokens, conflating "scoped token" with "Member identity"

**Treasury**:
The on-chain USDC holding account for a Fund Mode Group. In the MVP direction, this is backed by a Squads multisig and related vault addresses.
Avoid: Wallet, pool

**Creation Fee**:
A flat $5 USDC charged once at Fund Mode Treasury initialization. Paid from the creator's wallet to the Platform Fee Wallet. Operator-tunable, non-refundable.
Avoid: setup fee, signup fee

**Contribution Fee**:
A 0.5% take applied when a Member contributes USDC to the Treasury. Buyer-pays — Treasury receives the gross contribution; the fee is added on top of what the Member signs.
Avoid: deposit fee, pool entry fee

**Reimbursement Fee**:
A 0.5% take applied when a Treasury reimburses a Member via Proposal execution. Buyer-pays — Member receives the gross requested amount; the fee is debited from the Treasury alongside (in the same Squads vault transaction).
Avoid: withdrawal fee, payout fee

**Routing Fee**:
A 25 bps take on cross-chain inbound funds routed via Circle CCTP and LI.FI before they land as USDC on the Solana side. Surfaced transparently in the route quote.
Avoid: bridge fee, swap fee

**Holding Fee** (planned, post-Summit):
A recurring 0.5%/year take on idle Treasury AUM, prorated daily. Requires a billing job and a Squads-compatible debit mechanism that does not yet exist. Not in Summit launch scope.
Avoid: AUM fee, management fee

**Yield Fee** (planned, post-Meteora):
A 30% take on yield generated when Treasury USDC is routed to Meteora or similar yield venues. Opt-in per Treasury; default off. Not in Summit launch scope.
Avoid: performance fee, yield spread

**Platform Fee Wallet**:
A FundWise-controlled Solana wallet (different per cluster) that receives all collected fees on-chain. Configured via `FUNDWISE_PLATFORM_FEE_WALLET`. Collection is recorded in the `platform_fee_ledger` table for reconciliation.
Avoid: dev wallet, fee sink

**Balance**:
A Member's net position inside a Split Mode Group. Positive means they are owed USDC. Negative means they owe USDC.
Avoid: Debt, credit, account

**Debtor**:
A Member with a negative Balance who can initiate and sign a Settlement.
Avoid: Payer, sender

**Creditor**:
A Member with a positive Balance who is owed USDC and receives Settlements and Receipts.
Avoid: Receiver, beneficiary

**Activity Feed**:
The Group timeline showing Expenses, lightweight Expense edit markers, Settlements, and Receipts. It is not a general-purpose Group chat. Fund Mode Proposals may later include scoped comments and proof attachments without turning the whole Group into a chat room.
Avoid: Chat, thread

**Receipt**:
A settlement confirmation view showing who paid whom, how much USDC moved, and the on-chain transaction signature.
Avoid: Notification, message

**Simplified Settlement Graph**:
The minimum set of debtor-to-creditor transfers needed to reduce Group Balances efficiently. Each suggested edge maps to one Settlement transfer.
Avoid: Optimized debts, minimum transfers

## Relationships

- A Group has exactly one mode: Split Mode or Fund Mode.
- A Group has many Members.
- A Member joins a Group by invite link or QR after connecting a Solana wallet and explicitly confirming the Join action in the Group context.
- A Member has one wallet identity and one global profile display name in the MVP.
- A Group creator is recorded in `groups.created_by`, but ownership is administrative metadata rather than financial authority. It must not grant power to rewrite Balances, create fake Receipts, or bypass Settlement verification.
- In Split Mode, a Group has many Expenses and many Settlements.
- An Expense belongs to one Group, has one payer Member, and can be created by any Member in the Group.
- The payer on an Expense can be different from the Member who created the record.
- An Expense may preserve its Source Currency and original amount, but the Group ledger must store the converted USD/USDC amount and Exchange Rate Snapshot used for Balance math.
- Exchange rates should be fetched as close as possible to Expense creation or edit time, then snapshotted so historical Balances do not drift with later market movements.
- An Expense may include one lightweight Expense Proof attachment or proof link in a future release.
- Only the Member who created an Expense can edit or delete it.
- Expense edits update the record in place and surface a simple "edited" signal in the Activity Feed.
- Expense edits or deletes are blocked once later Settlements would make the ledger inconsistent.
- A Balance is derived from all active Expenses and Settlements in the Group.
- Only a debtor Member can authorize and sign their own Settlement.
- Any Member can prompt or share a Settlement Request Link, but they cannot sign on behalf of another Member.
- A Settlement resolves against the debtor's current net Balance when opened, not a stale amount captured earlier.
- If wallet connect interrupts a join, settlement, or create flow, the app should return the Member to that exact context after connect instead of dropping them into a generic screen.
- A Settlement is one on-chain USDC transfer from one debtor to one creditor.
- A creditor does not receive a payment prompt; they receive the updated Balance state and Receipt.
- In Fund Mode, a Group has one Treasury, many Contributions, and many Proposals.
- A Proposal spends Treasury USDC only after the required approvals are collected.
- The first Fund Mode Proposal shape is reimbursement-first: a Member fronts an expense, files a reimbursement Proposal, and the Treasury reimburses a Member wallet only.
- The Member who creates a reimbursement Proposal cannot approve or vote on that same Proposal.
- External recipient payouts are a later expansion; in the first Fund Mode shape, a reimbursed Member can forward funds onward from their own wallet if needed.
- Fund Mode may support Proposal-scoped comments and lightweight proof attachments, but not a full Group-wide chat product in the MVP shape.
- Proposal proof should support both one lightweight uploaded file and an optional external link.
- A reimbursement Proposal may be edited only before the first non-proposer approval is recorded.
- Proposal edits must remain visible in history so reviewers can see what changed instead of relying on silent mutation.
- Proposal review supports both approval and rejection.
- If a Member rejects a Proposal, the rejection should be visible in the Proposal discussion history instead of disappearing into off-product coordination.
- A rejected reimbursement Proposal is closed. If the claimant wants to try again, they must create a new Proposal instead of reviving the rejected one.
- Reaching the approval threshold does not auto-send funds. A reimbursement Proposal still requires a separate explicit execution step before Treasury USDC moves.
- Once the approval threshold is met, any Member may execute the fixed approved Proposal so reimbursements do not stall waiting on one specific actor.

## Web shell: marketing vs in-app

- The **landing page** (`/`) is the public marketing surface. Section anchors (`#modes`, `#how`, `#features`) and product narrative live there only.
- **Interior routes** (`/groups`, `/groups/[id]`, settlement receipt, etc.) use an app-style shell: primary navigation is Group-centric, not the landing-page section menu. (Land here to work with Groups; return home via the logo or explicit links.)
- For disconnected visitors, `/groups` is the wallet-first app entry. Its first job is to get the user connected, then restore the exact action they came to complete.
- The footer may still link to marketing anchors; the sticky header should not repeat landing-only nav when the user is inside the app.

## Product invariants

- The web app is the source of truth for the MVP.
- FundLabs is the company umbrella. FundWise app docs may use the FundLabs investor frame, but public product claims must still follow shipped/planned status.
- **Identity is Solana pubkey–based.** The default connection path is `@solana/wallet-adapter-*` (Phantom, Solflare, Backpack, and other standard wallets). No FundWise email/password and no first-class “sign in with email” as the identity system.
- **Optional additive path:** Phantom Connect SDK (`@phantom/react-sdk`) may be integrated for Google/Apple and embedded wallets alongside the adapter, subject to a Phantom Portal App ID and allowlisted domains. It does not replace wallet-adapter; signing and settlement must remain correct for both paths. See `docs/adr/0014-optional-phantom-connect-alongside-wallet-adapter.md`.
- Wallet connect is a gate, not a detour. After connect, the app should restore the user's exact intent: invite-linked Group, Settlement Request Link, or first Group creation.
- Telegram is a distribution surface, not a signing surface. It may support read-only views, draft-safe actions, comments, and history, but approvals, executions, and money-moving actions must return the Member to the app for wallet confirmation.
- The later Telegram bot and Telegram mini app should be framed as FundWise Agent surfaces, not as a separate "Telegram agent" product.
- Fundy is a FundLabs product (Telegram-native personal finance agent + MCP server for external agents) that also serves as FundWise's primary distribution surface. The "product" and "distribution surface" roles co-exist; public copy may lead with the product framing, while engineering invariants below (money-moving actions deep-link to the web app, no direct Supabase writes from Fundy) still apply.
- Fundy starts as a **command-based bot** (fixed commands like `/balance`, `/owe`, `/draft`). The end goal is an AI agent with an LLM brain (OpenRouter), but the first version uses commands only.
- Fundy runs as a **separate service on Railway**, not inside the Next.js Cloudflare Workers deployment. It uses `grammy` as the Telegram bot library and lives in a separate repository per ADR-0022.
- Fundy authenticates against the FundWise API using service-to-service auth and later Scoped Agent Access, not direct Supabase access. This keeps one consistent API surface for Fundy, external agents, and the web app.
- The Agent Skill Endpoint (`/skill.md`) is a shipped public machine-readable discovery document at `https://fundwise.fun/skill.md`. It does not require authentication and does not expose private Member data.
- Autonomous agents interact with FundWise through Scoped Agent Access, not broad API keys. Capabilities are tied to Member wallet, Group, and action type.
- Scoped Agent Access supports two auth paths: (1) user-generated agent tokens from the web app profile page (`/profile/agents`) with rotate/delete/renew/scope management, and (2) wallet-signed challenge-response for agents that can sign Solana messages.
- Money-moving actions (Settlement execution, Contribution execution, Proposal execution) remain wallet-confirmed even when initiated through Fundy or an autonomous agent. Fundy deep-links back to the web app using existing Settlement Request Links and action parameters. A later Payable Settlement Request flow may allow agent-paid Settlement only through explicit `settlement:pay` authority, exact USDC amounts, short expiry, idempotency, and verified payment proof before Receipt creation.
- Spending Policies are required before any autonomous agent can pay. A policy must include per-Settlement and time-window caps, allowed Groups, allowed asset, expiry, revocation, and a human fallback threshold.
- Database-only mutations (Proposal approve/reject, draft Expense creation) may be executed directly by Fundy without bouncing to the web app.
- Telegram-to-wallet linking uses web-app-generated short-lived codes (`FW-XXXXXX`). The user generates the code in the authenticated web app, then pastes it in Fundy's DM with `/link FW-XXXXXX`.
- One Telegram account maps to one active wallet at a time. Re-linking soft-deletes the old link and creates a new one.
- One Telegram chat maps to one FundWise Group at a time. Any Member may `/connect` a chat to a Group, but every participant must authenticate in a private DM before Fundy acts for them in the group.
- Fundy uses Zerion CLI for wallet analysis via `/analyze` (portfolio overview), `/readiness` (FundWise balances + Zerion readiness), and `/verify` (on-chain history to confirm a Settlement or counterparty payment). Zerion CLI auth starts with a free **`ZERION_API_KEY`** (dev tier); optional **x402** pay-per-call on Solana later for demos (`SOLANA_PRIVATE_KEY` + `ZERION_X402`).
- Mini-games and prediction-market-like mechanics are out of scope for FundWise. They are not Split Mode scope, Fund Mode beta scope, or launch scope.
- Plain `/groups` with no existing Groups should open Group creation immediately after connect.
- Plain `/groups` with existing Groups should remain a Group list after connect.
- Group creation defaults to Split Mode, while the public create flow keeps Fund Mode visible as an invite-only beta until the Proposal lifecycle is ready.
- Group mode choice is per Group only, never a global app-wide mode switch.
- USDC is the only settlement asset in the MVP.
- Split Mode stays free for launch, including normal USDC Settlements.
- Multi-currency Expense entry does not mean multi-currency Settlement. Source Currency values convert into the USD/USDC ledger before Balance and Settlement logic.
- SOL is required for gas on Solana mainnet-beta.
- Split Mode is the primary product path for the launch MVP.
- Fund Mode remains separate from Split Mode and uses Treasury plus Proposal concepts, not direct Settlements.
- LI.FI is the primary sponsor support path when a Member's USDC is on another supported network. It belongs inside the Settlement path as `Route funds for Settlement`; the dashboard should not present a separate top-up task before the Member presses Settle.
- The audience rollout is crypto-native Groups first, then agents, then non-crypto users through Visa/card, IBAN, and Altitude-style Solana banking rails once the core product is reliable.
- **Zerion** in this product is the **Zerion CLI** track (wallet analysis, agent-style flows). It is not a user-facing “connect with Zerion wallet” SDK; it does not replace Solana wallet connection.
- FundWise Agent, Telegram bot, Telegram mini app, wallet mini dapp, and AI chat are later distribution surfaces, not the MVP source of truth.
- Fund Mode is the north-star product surface for the next one-month sprint. It remains invite-only until Proposal creation, approval/rejection, proof/history, and execution work end to end.
- Live yield-bearing Treasuries, automatic Settlement, any-chain / any-currency Settlement, gasless UX, Fundy execution, and agent-paid money movement are future claims until implemented end to end.
- Receipt Endpoint ships as a **standalone Railway service** by Solana Summit (2026-06-13): wallet/tx sig in, structured receipt JSON out, IPFS-pinned, payable per call via x402/MPP, listed in the pay-skill / x402 MCP catalog. It does not depend on FundWise's Payable Settlement Request, Scoped Agent Access, or Spending Policy primitives. FundWise Settlements are the **premium first-class source** with the richest receipt metadata, but any Solana tx is accepted at the public endpoint.

## Example dialogue

> Dev: "If I open a Settlement Request Link that was shared yesterday, do I pay the old amount or the current amount?"
> Domain expert: "The current settleable amount from the live Group Balance. The link deep-links into the Group state; it is not a static invoice."

> Dev: "If I connect from an invite link, should the app silently join me to that Group?"
> Domain expert: "No. Connect should restore the exact Group context, then show one obvious Join action like `Join Weekend Trip`."

> Dev: "What should happen if I connect from plain `/groups` and I don't have any Groups yet?"
> Domain expert: "Open Group creation immediately with Split Mode preselected. Keep Fund Mode visible as invite-only beta until treasury Proposal flows are complete."

> Dev: "If Alice is owed money, should she get a wallet prompt to settle?"
> Domain expert: "No. Only debtor Members with negative Balances see the Settle action. Creditors receive Receipts and updated balances."

> Dev: "Can Bob log an Expense even if Carol actually paid?"
> Domain expert: "Yes. Expenses are off-chain Group records. Any Member can log the Expense, and the payer can be any Member in the Group."

> Dev: "Can an autonomous agent settle a debt on behalf of a Member?"
> Domain expert: "Not by default. In the MVP, the agent can draft the settlement intent and show the debtor what they owe, but the on-chain Settlement requires direct wallet confirmation from the Member. A later Payable Settlement Request can support agent-paid settlement only if the Member grants narrow `settlement:pay` authority with amount, Group, asset, expiry, and revocation limits."

> Dev: "Can an AI agent be a Member of a Fund Mode Group in its own right — with its own wallet and its own allocation, not just as the human's hands?"
> Domain expert: "Yes — that's the north-star model. A Member is any wallet that joined a Group; nothing in the data model requires the wallet to be human-controlled. The agent's wallet is funded by the human (directly, or via a reimbursement Proposal targeting the agent's wallet from the Treasury); the human sets Spending Policy on the agent's own-wallet behavior; the agent signs its own transactions but is bounded by the policy. The fuller slice (Treasury → agent wallet allocations via approved Proposals, agent-driven Expense logging with own-wallet attribution, Receipt Endpoint queries scoped to the agent's wallet) is the direction. The Summit-shippable slice today is the lighter version (agent-as-hands via Scoped Agent Access)."

> Dev: "What power does the Group owner have?"
> Domain expert: "Today, almost none in Split Mode. `created_by` is mostly the creator label; Fund Mode currently uses it to initialize Treasury addresses. Future ownership can manage metadata and transfer the title, but it must not override Member balances, Expense ownership, Settlement verification, or Receipt integrity."

## Fundy (planned): commands and group chat linking

**Identity and setup (DM):**

- `/link FW-…` — consume a web-app-generated linking code (short TTL); binds Telegram user to one active wallet
- `/unlink` — remove Telegram–wallet link (soft-delete / explicit relink per product rules)
- `/whoami` — show linked wallet and display name

**Read-only (DM or linked group chat):**

- `/balance`, `/expenses`, `/owe`, `/settlements`, `/group`

**Draft-safe:**

- `/draft …`, `/drafts` — drafts may live in `draft_expenses` until promoted to a real Expense

**Fund Mode (when shipped):**

- `/approve`, `/reject` — Proposal approval/rejection when those actions are **database-only** and do not move Treasury funds
- On-chain **Proposal execution** — deep-link to the web app (same pattern as Settlement: wallet confirmation required)

**Zerion-backed:**

- `/analyze`, `/readiness`, `/verify …` — Zerion CLI behind the bot; see product invariants for auth mode

**Group chat ↔ Group:**

- `/connect <group-invite-code>` — link this Telegram chat to exactly one FundWise Group (initiated by a Member; confirm in chat per UX)
- `/disconnect` — unlink chat from Group
- After link: every participant must complete **DM authentication** (`/link`) before Fundy acts for them in that chat

**Deep links back to the app:**

- For **Settlement**, Fundy should reuse existing **Settlement Request Links** (live amount, never auto-send), not invent a parallel payment URL format.

## Flagged ambiguities

- "Payment" was ambiguous between Split Mode and Fund Mode.
Resolved: use Settlement for Split Mode and Contribution for Fund Mode.

- "Notification" could mean push notifications, wallet notifications, or shared links.
Resolved: the MVP relies on shareable Settlement Request Links first. Push delivery can be added later.

- "Chat" was drifting into scope.
Resolved: the MVP does not have a real-time Group-wide chat. If discussion is needed, keep it scoped to Fund Mode Proposals via comments and proof attachments.

- "Multi-chain" was being used to describe both recovery and primary settlement.
Resolved: the MVP settles on Solana in USDC. LI.FI may help a debtor route funds from another supported network during Settlement, but the Settlement itself remains a Solana USDC transfer.

- "Embedded wallet" and "social login" were proposed as onboarding improvements.
Resolved: wallet-adapter + Solana extension wallets stay the default. Optional Phantom Connect (Google/Apple + embedded) is an additive integration when Portal is configured; Member identity remains wallet pubkey–based, not email accounts owned by FundWise.

- "Currency" could mean either the currency someone actually paid in or the asset used for Settlement.
Resolved: use Source Currency for Expense entry, Exchange Rate Snapshot for conversion, and USDC for the Group ledger and Settlement asset.

- "Receipt" could mean a merchant receipt photo or a FundWise Settlement confirmation.
Resolved: use Expense Proof for uploaded merchant receipts and Receipt for Settlement confirmation views.

- "Telegram agent" sounded like a Telegram-specific product.
Resolved: use FundWise Agent as the assistant product name. Telegram is one channel where the FundWise Agent can operate later. The hosted Telegram bot is called Fundy.

- "Agent skill" could mean a skill file for Cursor agents or a public agent discovery endpoint.
Resolved: use Agent Skill Endpoint for the public `/skill.md` URL that any autonomous agent can curl. This is distinct from AGENTS.md (instructions for code-level AI agents working on the codebase).

- "Fundy" could sound like a separate product.
Resolved (2026-05-16): Fundy is a FundLabs product (Telegram-native personal finance agent + MCP server) which also serves as FundWise's primary distribution surface. Earlier resolution that flattened Fundy into "just a distribution surface, not a separate product" is superseded — both roles co-exist. Engineering invariants (money-moving actions deep-link to the web app) still apply regardless of framing.
