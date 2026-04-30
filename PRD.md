# FundWise - Product Requirements Document

**Owner:** Sarthi
**Status:** Draft v0.2
**Last updated:** 2026-04-30

## Problem Statement

Shared-expense apps solve the bookkeeping problem, but not the settlement problem. Friends can see who owes whom, yet they still have to chase each other across messaging apps and payment rails to actually get paid. Crypto users face an extra layer of friction: balances may sit on the wrong chain, wallet UX is confusing for newcomers, and a settlement flow becomes fragile if it asks users to choose assets, chains, or custom amounts at the moment of payment.

FundWise should make shared expenses feel like Splitwise, but with actual settlement finality. The MVP needs to make one thing work extremely well: a private Group where Members log Expenses, see live Balances, and settle exact USDC amounts on Solana with a clean Receipt. Members should be able to enter an Expense in the currency that was actually paid, while FundWise converts it into a stable USD/USDC ledger value before Balance and Settlement math runs.

## Solution

FundWise is a web app with wallet-native identity and two product modes:

- Split Mode is the primary MVP path. Members create a Group, join by invite link or QR, log Expenses with Splitwise-style split methods, attach optional Expense Proof, compute live net Balances, and settle with on-chain USDC transfers on Solana.
- Fund Mode is the secondary mode. Members pool USDC into a shared Treasury and spend through Proposal and approval flows. This remains part of the product direction, but it is not the primary hackathon demo path.

For the hackathon MVP, the source of truth is the web app and the default settlement asset is USDC. LI.FI and Zerion are supporting layers, not the core path. LI.FI should become the first sponsor-layer path after Split Mode hardening, helping EVM-first users top up a debtor's Solana wallet with USDC through `Add funds` / `Top up to settle` language instead of bridge jargon. Zerion can later help with wallet analysis, reminders, and agent flows. Neither should complicate the primary user journey:

`Group -> Expense -> Balance -> Settlement -> Receipt`

## Product Principles

- Web app first. Telegram, wallet mini dapp, native mobile, and other distribution surfaces come later as clients of the same core product engine.
- Wallet-native identity first. The connected Solana wallet is the Member identity key.
- Preserve intent after wallet connect. Connect should return the user to the exact Group, Settlement Request, or create flow they came for.
- One settlement asset. USDC is the only stablecoin in the MVP.
- Multi-currency Expense entry, single-currency ledger. Members may enter what was paid in another currency, but the saved Expense must include the converted USD/USDC ledger amount and exchange-rate snapshot used for Balance math.
- Off-chain metadata, on-chain money. Expenses and Group state live off-chain; Settlements and Contributions move money on-chain.
- Current state over stale links. Settlement links resolve against the debtor's current Balance when opened.
- Exact settlement over flexible settlement. The primary flow is settle the exact owed amount in one go.
- Hide routing complexity. Users should think in terms of `Add funds` or `Top up to settle`, not bridge selection and multi-step route logic.
- Activity feed, not chat. The Group timeline should explain the ledger without becoming a general messaging product. If Fund Mode needs discussion later, prefer Proposal-scoped comments over full Group chat.
- Sponsor integrations must support the main flow, not redefine it.
- Distribution expansion should reuse the same wallet-native ledger model across web, FundWise Agent, Telegram, wallet-mini-app, and native-mobile surfaces instead of inventing separate product rules per channel.
- The long-range end state is a stablecoin-first product where gas, fees, and bridging are abstracted away as much as possible for the end user, while the core ledger still stays wallet-verifiable underneath.

## User Stories

1. As a group organizer, I want to create a private Group in Split Mode, so that my friends and I can track shared expenses in one place.
2. As a new Member, I want to join a Group from an invite link or QR after connecting my wallet, so that joining is fast and does not require manual wallet entry by someone else.
3. As a Member, I want one profile display name reused across Groups, so that other people can recognize me without changing wallet-native identity.
4. As a Member, I want to edit my global profile display name later, so that I can fix or improve how I appear in the app.
5. As a Member, I want to log an Expense for a Group, so that the Group ledger reflects what happened.
6. As a Member, I want to mark any Group Member as the payer on an Expense, so that the ledger matches reality even if someone else is entering the record.
7. As a Member, I want to choose the same split methods people expect from Splitwise, so that the app feels familiar and flexible.
8. As a Member, I want to split an Expense equally, so that common cases are fast.
9. As a Member, I want to split an Expense by exact amounts, so that uneven bills can be recorded precisely.
10. As a Member, I want to split an Expense by percentage, so that proportional splits are supported.
11. As a Member, I want to split an Expense by shares, so that non-equal participation can still be entered naturally.
12. As a Member, I want to see my live Balance in the Group, so that I know whether I owe USDC or am owed USDC.
13. As a Member, I want to see who owes whom across the Group, so that the current state of the ledger is obvious.
14. As a debtor Member, I want to settle my current net Balance in one action, so that I can clear what I owe without thinking about individual Expenses.
15. As a creditor Member, I want to receive a clear Receipt when someone pays me, so that I can trust the settlement happened.
16. As any Member, I want to share a Settlement Request Link that deep-links into the Group, so that the debtor can open the Group in the correct settlement state.
17. As a debtor Member, I want the Settlement screen to use my current live Balance, so that I do not overpay or underpay from a stale link.
18. As a debtor Member, I want to pay in USDC on Solana with a normal wallet confirmation, so that the main flow stays simple and reliable.
19. As a debtor Member, I want the app to auto-create the creditor's USDC token account when needed, so that my settlement does not fail on first receipt.
20. As a debtor Member, I want the app to tell me clearly if I lack USDC or SOL, so that I understand why settlement cannot proceed.
21. As a debtor Member with funds on another chain, I want an `Add funds` flow that tops up my Solana wallet with USDC, so that I can recover from insufficient funds without learning the underlying bridge mechanics or changing the main settlement model.
22. As a Member, I want the Group Activity Feed to show Expenses, edit markers, Settlements, and Receipts, so that the ledger stays understandable without a full chat product.
23. As an Expense creator, I want to edit or delete my own Expense before later Settlements make that unsafe, so that I can fix mistakes without corrupting the ledger.
24. As a Member, I want to leave a Group only when my Balance is zero, so that the Group ledger does not end up with orphaned debts.
25. As a group organizer, I want the product to work on mobile web, so that people can join and settle from their phones during real shared-spending moments.
26. As a hackathon judge, I want to understand the main demo path in one pass, so that the product story feels coherent and not overloaded with sponsor features.
27. As a future user with funds on another chain, I want LI.FI to help me arrive at Solana USDC, so that cross-chain funds do not block settlement.
28. As a future user, I want sponsor integrations to reduce friction around funding and discovery, so that the app becomes easier to use without changing its core ledger model.
29. As a Fund Mode organizer, I want to create a Treasury-based Group later, so that a shared budget can be pooled before spending.
30. As a Fund Mode Member, I want to make Contributions and approve Proposals later, so that pooled spending stays collaborative and auditable.
31. As a disconnected visitor on `/groups`, I want one obvious wallet connect action, so that I can unlock the app without reading through extra marketing copy.
32. As a visitor who connected from an invite link, I want to return to that exact Group with a clear `Join {GroupName}` action, so that I can confirm membership without navigating again.
33. As a debtor who connected from a Settlement Request Link, I want to land directly in the live settlement-ready state with the current amount, ledger context, and history, so that I can review before signing.
34. As a first-time connected user with no existing Groups, I want Group creation to open immediately with Split Mode preselected, so that I can start quickly without an extra tap.
35. As a Group creator, I want to switch the create flow from Split Mode to Fund Mode per Group, so that I can choose the right Group type without changing the whole app.
36. As a Member, I want to enter an Expense in the currency that was actually paid, so that I do not have to manually convert real-world spending before logging it.
37. As a Member, I want FundWise to convert that Expense into the USD/USDC ledger value using a current exchange-rate quote, so that Balances and Settlements stay comparable across currencies.
38. As a Member, I want the exchange rate used for an Expense to be saved with the Expense, so that historical Balances do not change unexpectedly when market rates move later.
39. As a Member, I want to upload a receipt photo or proof file when I create an Expense, so that other Members can verify what was paid.
40. As a Member, I want the later FundWise Agent to work from Telegram and other assistant surfaces, so that I can draft Expenses, attach proof, get reminders, and review Group state without creating a separate ledger.
41. As a user with a personal AI agent, I want my agent to curl the FundWise Agent Skill Endpoint and discover what it can do, so that it can integrate with my FundWise data without manual configuration.
42. As a user with a personal AI agent, I want my agent to read my Group Balances and upcoming Settlements through Scoped Agent Access, so that I can get proactive financial summaries and reminders from my existing assistant.
43. As a user with a personal AI agent, I want money-moving actions to still require my direct wallet confirmation even when my agent initiates them, so that autonomous agents can help but not execute financial transactions on their own.
44. As a Telegram user, I want to authenticate my Telegram account against my FundWise wallet through Fundy, so that I can interact with my Groups from Telegram without managing a separate identity.
45. As a Telegram user, I want Fundy to show me my Group Balances, recent Expenses, and pending Settlements, so that I can stay on top of shared expenses without opening the web app.
46. As a Telegram user, I want Fundy to draft Expenses for me in a Group, so that I can quickly log shared spending from the chat where the spending happens.
47. As a Telegram user in a group chat, I want Fundy to be usable by multiple Members, so that everyone in the Telegram group can interact with the linked FundWise Group through the same bot.
48. As a Telegram user, I want Fundy to run Zerion-backed `/analyze` and `/readiness`, so that I can see wallet readiness and settlement context without leaving the chat.
49. As a Telegram user, I want Fundy to support `/verify` against on-chain history, so that I can confirm a Settlement or counterparty payment when coordinating in a group.
50. As a user with a personal AI agent, I want to mint and revoke scoped agent tokens from my FundWise profile, so that I can control what my agent can do without sharing my browser session.

## Implementation Decisions

- The product has two modes, but the immediate MVP path is Split Mode.
- The web app is the only required first-class surface for the MVP.
- Post-MVP distribution should expand in layers: web app first, then FundWise Agent surfaces such as Telegram bot / mini app, then wallet mini dapp, and finally a native mobile app.
- Identity is **Solana wallet address** in the MVP. No FundWise email/password and no separate “app account” tied to email as the primary key.
- Telegram auth, if added later, should be a convenience and routing layer around existing Groups, not a replacement for wallet-native Member identity.
- Telegram surfaces should be described as FundWise Agent channels. They may handle read-only, draft-safe, comment, proof upload, reminder, and history actions. **On-chain** money movement and **on-chain** execution steps must bounce back into the app for wallet confirmation. **Database-only** Proposal approve/reject may be offered from Fundy when Fund Mode and APIs support it.
- One Telegram account should map to one active wallet at a time. If relinking is allowed later, it should be an explicit flow, not an implicit multi-wallet identity model.
- One Telegram group chat should map to one FundWise Group at a time. If multi-Group switching is allowed later, it should be an explicit chat-level flow rather than the default.
- Any Group Member may add the bot to a Telegram chat, but each person must authenticate one-on-one with the bot in DM before the bot reads or drafts on their behalf.
- Agent access should not rely on broad raw API keys. Later agent surfaces should use scoped capabilities tied to the Member wallet, Group, and action type.
- The Agent Skill Endpoint (`/skill.md`) is a public URL at **`https://fundwise.kairen.xyz/skill.md`** that returns a machine-readable markdown document describing FundWise capabilities, supported actions, authentication flow, and explicit guardrails (what not to call). Fetching the document does not require authentication and the document must not expose private Member data.
- Scoped Agent Access is the permission model for autonomous agents. Agents receive scoped capabilities tied to the Member wallet, specific Group, and action type. Money-moving actions (Settlement execution, Contribution execution, Proposal execution) still require direct wallet confirmation from the Member, even when an agent initiates the intent.
- Fundy is the hosted Telegram bot that runs the FundWise Agent. It is a distribution surface, not a separate product. Users authenticate by linking their Telegram account to their FundWise wallet address via **short-lived codes** issued from the authenticated web app (`/link FW-…` in DM with Fundy).
- Fundy v1 is **command-based** (fixed commands); the end goal is an **LLM-backed** assistant (e.g. OpenRouter) with the same underlying tools. Fundy runs on **Railway** as a separate service from the Next.js app, under **`services/fundy/`** in the **monorepo**, using **`grammy`**. It calls FundWise through the **same HTTP API** as other clients, using **`FUNDWISE_SERVICE_API_KEY`** and **`X-Fundy-Wallet`** (not ad-hoc direct Supabase access from the bot).
- Fundy supports read-only views (Balances, Expenses, Settlements, Receipts), draft-safe actions (draft Expense, upload proof), comments, and history. **Proposal approve/reject** may run from Fundy when those updates are **database-only**; **on-chain** Settlement, Contribution, and Proposal **execution** bounce the Member to the web app with **Settlement Request Links** used for settle intents where applicable.
- Fundy integrates **Zerion CLI** for **`/analyze`**, **`/readiness`**, and **`/verify`** (wallet + transaction history). Prefer **`ZERION_API_KEY`** (free dev tier) for v1; optional **x402** pay-per-call on Solana later.
- Scoped Agent Access includes **user-generated agent tokens** managed from **`/profile/agents`** (rotate, delete, renew, scopes) plus optional **wallet-signed** agent authentication for agents that can sign Solana messages.
- The Agent Skill document lives at **`https://fundwise.kairen.xyz/skill.md`** and must be detailed enough to explain purpose, allowed vs disallowed calls, auth, limits, and safety rules.
- Later onboarding work should help web2 users reach stablecoin balances with far less friction, potentially through fiat rails, bank-transfer-style funding, and card or account layers, but only after the crypto-native core flow is reliable.
- A Member is keyed by wallet address and labeled with a global profile display name.
- **Optional:** Phantom Connect (Google/Apple + embedded or extension via Phantom) may be offered **in addition to** `@solana/wallet-adapter-*`, with Phantom Portal configuration. It does not replace the adapter for users who use Solflare, Backpack, or other wallets. See [CONTEXT.md](./CONTEXT.md) and [docs/adr/0014-optional-phantom-connect-alongside-wallet-adapter.md](./docs/adr/0014-optional-phantom-connect-alongside-wallet-adapter.md).
- `/groups` is the wallet-first app entry. Its primary job for disconnected users is to get them connected, then restore their intended next action.
- If a disconnected user connects from plain `/groups` and has no existing Groups, Group creation should open immediately.
- If a disconnected user connects from plain `/groups` and already has existing Groups, the app should keep them on the Group list.
- Group creation defaults to Split Mode; the public create flow keeps Fund Mode visible as an invite-only beta rather than a generally available option.
- Group join is self-serve through invite link or QR.
- Invite links should restore the exact Group context after connect and present an explicit `Join {GroupName}` action; the app should not silently join on wallet connect.
- Creator approval, Group roles, and membership workflows beyond simple join/leave are out of the MVP.
- The MVP settlement asset is USDC only.
- Expense entry may support multiple Source Currencies, but this does not change the settlement asset. Every saved Expense must have a USD/USDC ledger amount.
- Exchange-rate conversion should use a current quote at Expense create or edit time, then store an Exchange Rate Snapshot. Historical Balance math must use the stored snapshot instead of continuously repricing old Expenses. See [docs/adr/0017-snapshot-source-currency-expenses-into-usdc-ledger.md](./docs/adr/0017-snapshot-source-currency-expenses-into-usdc-ledger.md).
- Mainnet-beta is the product target. Devnet is the test and rehearsal environment.
- SOL remains necessary for gas in the MVP.
- Expenses are off-chain records stored in the app data layer.
- Expense Proof uploads are off-chain metadata attached to Expenses. They may be images, PDFs, or external proof links, and should not be confused with Settlement Receipts.
- Settlements are on-chain Solana USDC transfers.
- The Group ledger is netted at the Group level, not at the individual Expense level.
- Members settle current net Balance, not a custom amount and not an Expense-by-Expense bill.
- Only debtor Members can sign their own Settlements.
- Any Member can prompt a settlement or share a deep link, but no Member can authorize payment for someone else.
- Settlement links must resolve live state when opened.
- Settlement Request Links should restore the debtor directly into the live settlement-ready state after connect, including relevant ledger context and the current amount due.
- Settlement Request Links must never auto-send the transaction after connect.
- The simplified settlement graph is the source for suggested transfer edges.
- Each suggested edge maps to one debtor-to-creditor transfer and one Receipt.
- The primary flow settles the exact owed amount in one go.
- Any Member can create an Expense, and the payer can be any Member in the Group.
- Only the Expense creator can edit or delete the Expense.
- Expense edits update in place with a lightweight "edited" signal in the Activity Feed.
- Expense changes are blocked when later Settlements would make the ledger unsafe.
- The Group timeline is an Activity Feed, not a chat system.
- Fund Mode may add Proposal-scoped comments plus lightweight proof attachments later, but not a general Group-wide chat system in the MVP shape.
- The core modules to deepen are profile identity and join flow, Group and membership ledger, Expense entry and split validation, Source Currency conversion and Exchange Rate Snapshots, Expense Proof storage, balance computation and simplified settlement graph, settlement orchestration and receipt generation, and sponsor integration adapters for LI.FI and Zerion.
- LI.FI is the primary sponsor support adapter after Split Mode hardening, focused on topping up the debtor's Solana wallet with USDC through hidden-route `Add funds` / `Top up to settle` UX.
- Direct cross-chain creditor settlement is out of scope for the MVP.
- Zerion is a secondary intelligence layer via **Zerion CLI** and related analysis, not a user-facing “connect with Zerion” wallet SDK for the core app.
- Fund Mode keeps Treasury, Contribution, and Proposal concepts separate from Split Mode Settlement concepts.

## Testing Decisions

- Good tests should validate observable behavior, not implementation details.
- The highest-value tests are the ones that prove the ledger stays correct when users do normal and error-prone actions.
- Priority unit tests should cover split validation, balance computation, rounding behavior, and simplified settlement graph outputs.
- Priority conversion tests should cover Source Currency conversion, Exchange Rate Snapshot persistence, rounding, and the rule that historical Expenses do not reprice automatically.
- Priority integration tests should cover Expense create/edit/delete guards, Settlement orchestration, Receipt generation, and leave-Group zero-balance enforcement.
- Sponsor integration tests should mock LI.FI and Zerion boundaries and assert the app's decisions, not vendor SDK internals.
- Wallet and token transfer tests should cover insufficient-USDC, insufficient-SOL, and recipient token-account creation decisions.
- Mobile-focused smoke tests should cover join-from-link, settle-from-link, post-connect intent restoration, zero-state create flow, and receipt rendering on common narrow viewports.
- The current codebase has limited formal test coverage, so post-hackathon work should start by extracting pure modules and testing those first.

## Out of Scope

- Fundy Telegram bot as a first-class product surface in the MVP
- Agent Skill Endpoint as a first-class product surface in the MVP
- Scoped Agent Access API in the MVP
- Telegram bot as a first-class product surface in the MVP
- Telegram mini app as a first-class product surface in the MVP
- Wallet-embedded mini dapp as a first-class product surface in the MVP
- Native mobile app as a first-class product surface in the MVP
- Real-time Group-wide chat
- AI bill parsing beyond basic receipt-photo upload
- Natural-language Expense entry beyond draft-safe FundWise Agent flows
- Email-centric or non-wallet identity as the primary onboarding path
- Mandatory embedded-only wallets (all users must use a single vendor embedded wallet) in the MVP
- Gasless settlement in the MVP
- Gas abstraction in the MVP
- Multi-stablecoin settlement in the MVP
- Direct cross-chain Settlement to the creditor in the MVP
- Partial settlements
- Installment or escrow-based settlements
- Rewards, loyalty systems, or NFT reputation
- Creator approval for Group joins
- Advanced Group roles and permissions
- Public Groups or Group discovery

## Further Notes

- The main hackathon story should stay simple: private Group creation, structured Expense entry with optional receipt photo and currency conversion, live Balance view, one-click USDC settlement, and a clear Receipt.
- Sponsor integrations should be framed as supporting layers. LI.FI helps when a debtor's funds are not already on Solana in USDC. Zerion helps with wallet analysis, reminders, and future agent functionality.
- Fund Mode is still part of the long-term product and should remain documented as Treasury plus Proposal functionality, but it should not displace Split Mode as the MVP story.
- Longer-term roadmap candidates include embedded wallets, social login, gas abstraction, multi-chain top-ups, FundWise Agent distribution surfaces, and broader mobile surfaces, but those should be added only after the core Group ledger and settlement experience is genuinely reliable.
