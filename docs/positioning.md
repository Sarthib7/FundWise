# FundLabs + FundWise Positioning — Post-Hackathon, Summit-Ready

**Source of truth** for FundLabs umbrella positioning, public copy, investor narrative, claims guardrails. Hackathon complete. Next milestone: **Solana Summit 2026-06-13**.

Last lock: 2026-05-16. Supersedes hackathon-era framings in `FundLabs_Positioning_Strategy.docx`. Aligned with [ADR-0039](./adr/0039-fundy-is-a-product-and-agent-as-member-north-star.md), [ADR-0040](./adr/0040-receipt-endpoint-ships-standalone.md), [ADR-0041](./adr/0041-fund-mode-mainnet-closed-beta-gated-stretch.md).

---

## Canonical Lines

- **FundLabs:** Financial layer for groups — human or AI.
- **FundWise:** Split expenses. Earn together.
- **Fundy:** Finance agent. Lives in your group chat.
- **Receipt Endpoint:** Receipts for any Solana payment. Payable per call.

Subtitle (extended umbrella, when one line isn't enough): *Shared spending, agent finance, and on-chain receipts on Solana.*

---

## FundLabs Umbrella

Three products in market by Summit. Not "one product + planned expansions" — three.

| Product | What it is | Status (2026-05-16) | Primary user | Revenue hypothesis |
|---|---|---|---|---|
| **FundWise** | Shared-finance web app. Split Mode (track + settle Expenses) + Fund Mode (shared USDC Treasury, Proposals, approvals). | Split Mode = shipped on devnet, mainnet cutover firm by Summit. Fund Mode = invite-only beta on devnet; mainnet closed beta = gated stretch (ADR-0041). | Private Groups (friends, travel, flatmates, small DAOs) | Fund Mode fees: Creation, Contribution, Reimbursement, Routing. Yield take post-Meteora integration. Split Mode stays free. |
| **Fundy** | Telegram-native personal finance agent + MCP server for external agents. | Live on Railway since 2026-05-15. 11 tools exposed, MCP token-authenticated, Zerion CLI live, 56/56 tests passing. | Individuals using FundWise; external autonomous agents | Premium personal-finance + tax advisory (ADR-0023); later B2B agent platform fees. |
| **Receipt Endpoint** | Standalone Solana tx → structured receipt service. Railway-hosted, x402/MPP payable, listed in pay-skill / x402 MCP catalog. Any Solana tx accepted; FundWise Settlements = premium first-class source. | Shipping by Summit (ADR-0040). | Any agent doing any Solana payment; accounting/tax/audit platforms long-term. | Per-call API pricing via x402/MPP. |

**Shared thesis:** Groups already coordinate money. Existing tools split workflow across chat, spreadsheets, bank apps, wallets, receipts. FundLabs collapses that surface into wallet-native ledgers, agent-readable APIs, and verifiable receipts on Solana.

**The "human or AI" framing is load-bearing, not hand-waving.** Concrete scenario:

> Human creates a Fund Mode Group on FundWise. Allocates budget through Fundy to an AI agent. Agent joins the Group via FundWise's skill/MCP endpoints. Agent logs Expenses, holds an allocation, queries Receipt Endpoint for its own payment history.

Today: agent participates via Scoped Agent Access tokens (**agent-as-hands**, ships at Summit). Direction: agent has own wallet, joins as its own Member, holds own allocation (**agent-as-Member**, north-star — see ADR-0039).

---

## FundWise Positioning

First FundLabs product. Shared-finance web app for private Groups.

**Consumer copy (lead familiar):**

> FundWise helps private Groups track shared spending, see live Balances, and settle up with verifiable USDC Receipts on Solana. Fund Mode pools USDC into shared Treasuries for Contributions, Proposals, and approvals — pay together before spending instead of chasing reimbursements after.

**Mode breakdown:**

- **Split Mode** — wedge. Group, Expense, Balance, Settlement, Receipt. Free at launch. Wallet-native, USDC on Solana mainnet by Summit. Settlement Request Links = acquisition loop. *Shipped devnet today; mainnet by 2026-06-13.*
- **Fund Mode** — hero direction. Shared Treasury, Contributions, reimbursement Proposals, approvals, proof/history, execution. Squads multisig backing. Fees: Creation $5 USDC + Contribution 0.5% + Reimbursement 0.5%. *Devnet invite-only beta today; mainnet closed beta is a **gated stretch** for Summit (ADR-0041).*

**Investor sharper thesis:**

- Split Mode = wedge. Easy to demo, easy to understand.
- Fund Mode = product. Durable Groups need shared Treasuries, governance, proof, exit mechanics, integrations.
- Fundy = product and distribution. Real Groups coordinate in Telegram and personal agents already.
- Receipt Endpoint = infrastructure. Agent commerce needs structured receipts, not just payment rails.

---

## Fundy Positioning

FundLabs product, not "just a distribution surface" (ADR-0039). Both roles co-exist — public copy leads with product framing; engineering invariants (money movement deep-links to web app, no direct Supabase writes from Fundy) still apply.

**Current public framing:**

- Telegram-native. Personal finance agent + MCP server for external agents.
- Live on Railway. Separate repo (ADR-0022). Calls FundWise over public HTTP.
- Reads Group state, drafts Expenses, surfaces Settlement deep-links, runs Zerion CLI for wallet readiness.
- Money movement deep-links back to web app for wallet confirmation.
- Group-chat mode after every Member authenticates in DM.

**Future framing (post-Summit, no live claims yet):**

- LLM-backed natural-language finance agent (OpenRouter underneath).
- Tax advisory + filing (ADR-0023).
- Premium subscription tier.
- Agent-to-agent coordination via MCP.

---

## Receipt Endpoint Positioning

Standalone Railway service (ADR-0040). Decoupled from FundWise's Payable Settlement Requests + Scoped Agent Access — does not require those primitives to ship.

**Current public framing:**

- Solana tx sig in → structured receipt JSON out, IPFS-pinned.
- Payable per call via x402 / MPP. Free tier for developer testing.
- Listed in pay-skill / x402 MCP catalog.
- Any Solana tx accepted at the public endpoint.
- FundWise Settlements = **premium first-class source** (richer metadata: Group, Members, Expense linkage, Settlement context).

**Future framing (post-Summit, no live claims yet):**

- Arweave permanent archive tier (enterprise).
- Accounting / tax / DAO tooling / agent-platform integrations.
- Per-merchant tax-category metadata.

**Hard avoid:** Stripe-grade compliance claims before audit. Receipts on non-FundWise txs cannot claim richer attribution than Solana RPC + DEX/protocol metadata actually returns.

---

## Shipped vs Direction (Summit Frame)

**Live at Summit (claimable as shipped):**

- FundWise Split Mode on **Solana mainnet** — wallet-native Groups, on-chain USDC Settlement, Receipts.
- FundWise web app on Cloudflare Pages.
- Fundy in Telegram — group ledger reads, draft Expenses, Settlement deep-links, Zerion CLI wallet readiness.
- Fundy as MCP server — token-authenticated, 11 tools, external agents can call FundWise read paths.
- Agent Skill Endpoint at `https://fundwise.fun/skill.md`.
- Receipt Endpoint v1 — Solana tx → structured receipt JSON, x402/MPP payable, MCP-catalog listed.

**Shipping at Summit (announce + open):**

- Fund Mode invite-only beta — **devnet by default, mainnet iff ADR-0041 gate clears by 2026-06-06.**
- Agent-as-hands flow polished — Scoped Agent Access token issuance from `/profile/agents` (or wallet-signed challenge), agent joins Group via MCP, logs Expenses, queries Receipt Endpoint.

**Direction (named so audience knows it's coming, not claimed live):**

- Payable Settlement Requests → agent-paid Settlement (`settlement:pay` authority with caps + expiry).
- Treasury → agent wallet allocations via approved reimbursement Proposals; **agent-as-Member** full path.
- Yield-bearing Treasuries (Meteora / sUSD).
- Multi-chain inbound via Circle CCTP + LI.FI (LI.FI integration built; mainnet pipeline pending).
- Fiat onboarding via Privy + MoonPay + Bridge.xyz.
- Native mobile, Telegram mini app, wallet mini-dapp.

**Out of scope at Summit:**

- Multi-chain Settlement (Solana stays the ledger).
- Gasless settlement as a live claim.
- Live yield APY claims.
- Autonomous-agent money movement (planned via Payable Settlement Requests post-Summit).
- Mini-games / prediction-market mechanics — out of FundWise entirely.

---

## Messaging Hierarchy

### Consumer

Lead familiar:

- Split expenses.
- Settle up.
- Live settle-up links.
- See who owes whom.
- Verifiable Receipt.
- Fund a shared Treasury when the Group wants to pay before spending.

Crypto mechanics stay behind the user benefit. Surface USDC / Solana / wallets when the Member is in a wallet, Settlement, Receipt, Treasury, or developer context.

### Product / Launch Story

One coherent path:

`Group → Expense → Balance → Settlement → Receipt`

Beats:

- Settlement Request Links = acquisition loop.
- Fund Mode = durable-group product, opens at Summit (devnet or mainnet per ADR-0041 gate).
- Fundy = agent product + distribution surface, already live in users' Telegrams.
- Receipt Endpoint = developer-facing receipts API, also shipping at Summit.

### Investor

Lead with FundLabs umbrella:

> FundLabs builds the financial layer for groups — human or AI. FundWise starts with shared expenses and grows into yield-aware shared Treasuries. Fundy brings the system into Telegram and personal agents. Receipt Endpoint gives the agent economy a verifiable audit trail. Three shipping or shipped products by Solana Summit 2026-06-13.

Hooks:

- Shared expenses are proven behavior; tracked balances earn nothing and settle poorly.
- Group chats are where coordination already happens; they don't produce financial state.
- AI agents can pay; they still need approvals, limits, receipts, audit trails.
- Solana = low-cost, fast stablecoin settlement, credible for consumer Groups + agent workflows.

---

## Monetization

Sequence (locked direction):

1. **Fund Mode fees** — Creation Fee ($5 flat, one-time), Contribution Fee (0.5%, buyer-pays), Reimbursement Fee (0.5%, buyer-pays), Routing Fee (25 bps on CCTP/LI.FI inbound). All flows land in Platform Fee Wallet, reconciled in `platform_fee_ledger`. (See ADR-0031, ADR-0032.)
2. **Fundy premium** — reminders, personal finance automation, tax advisory (ADR-0023).
3. **Receipt Endpoint** — per-call x402/MPP pricing. Free tier for developer testing.
4. **Yield Fee** (post-Meteora) — 30% take on yield generated when Treasury USDC routes to yield venues. Opt-in per Treasury; default off.
5. **Holding Fee** (planned, post-Summit) — 0.5%/year AUM, prorated daily. Requires billing job + Squads-compatible debit mechanism not yet in place.

Split Mode stays free at launch — acquisition loop, trust builder.

**Do not present** yield spread, automated agent execution fees, or per-receipt API revenue as live FundWise revenue. Treat as roadmap.

---

## Claims Guardrails

### Use freely

- FundLabs builds the financial layer for groups — human or AI.
- FundWise: private Groups, shared Expenses, live Balances, USDC Settlement, verifiable Receipts on Solana.
- Split Mode = shipped wedge; mainnet by Solana Summit 2026-06-13.
- Fund Mode = hero direction; invite-only beta on devnet (mainnet closed beta = gated stretch per ADR-0041).
- Fundy = FundLabs product, live in Telegram + MCP server for external agents, on Railway since 2026-05-15.
- Receipt Endpoint = standalone Solana tx → receipt JSON service, x402/MPP payable, ships by Summit.
- Members of a Group can be human or AI (Member = any wallet that joined; agent-as-hands ships at Summit, agent-as-Member is direction).
- Settlement Request Links resolve the live Balance and require wallet confirmation.

### Use only with explicit future/beta wording

- Shared Treasuries earning yield → "direction; not live."
- Automatic settlement → never; settlement always requires wallet confirmation.
- Any-currency or any-chain settlement → Solana stays the ledger; CCTP/LI.FI = inbound rail.
- Gasless UX → planned via Kora / Privy fee-payer, not live.
- AI agents spending from Group Treasuries autonomously → planned via Payable Settlement Requests post-Summit; not live.
- x402 / MPP payment execution beyond Receipt Endpoint → planned.
- Arweave permanent receipt archives → enterprise tier, post-Summit.
- Visa, card, IBAN, Privy, Kora, CCTP, Meteora, Solayer, MoonPay, Bridge.xyz → name partners only with status caveats.

### Never claim

- "First crypto Splitwise."
- "FundWise settles automatically."
- "FundWise supports any chain and any currency."
- "FundWise yield is live."
- "Agents can spend without user limits."
- "Prompt instructions authorize money movement."
- "Settlement is gasless."
- "FundWise is Telegram-first" — FundWise is wallet-native web app; Fundy is the Telegram surface.
- Receipt Endpoint claims richer attribution on non-FundWise txs than what Solana RPC actually returns.

### Updated avoid list (changes from prior version)

- ~~"Fundy is shipped"~~ → **Fundy IS shipped** (live on Railway 2026-05-15). Use freely.
- ~~"Receipt Endpoint is live"~~ → **Receipt Endpoint is shipping by Summit.** Once live (post-deploy), use freely.
- ~~"Fundy and Receipt Endpoint are planned expansion products"~~ → **superseded.** Both are products in market by Summit.

---

## Source Notes

- The Desktop `FundLabs_Positioning_Strategy.docx` is the hackathon-era artifact. Investor stats inside it (OpenClaw stars, Pay.sh launch date, MPP launch date, Altitude raise, x402 tx volume, Splitwise $90B, Gartner $1.7T) **require source verification before any external use.** Treat as pitch inputs, not load-bearing facts.
- This doc replaces the hackathon-era 3-min pitch script, Colosseum spine, ARR scenarios, and comparable-raises tables. Those remain in the `.docx` for reference but are no longer canon.
- This doc is the source of truth for public copy through Summit (2026-06-13). Update at Summit + 1 week with actual launch status.
