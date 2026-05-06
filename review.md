# FundWise — Product Roast Review

**Date:** 2026-05-06  
**Reviewer:** Pi Agent (`roast-my-product`)  
**Product:** FundWise — Group money, done right  
**Stage:** Split Mode devnet MVP, Fund Mode / Fundy / agent-payments roadmap

---

## Verdict

FundWise has a real crypto-native thesis, but right now it is trying to sell the roadmap as the moat. The shipped product is Split Mode; the strongest product is probably Fund Mode plus agents — and that is not fully real yet.

---

## What changed from the earlier roast

The earlier roast undercounted several parts of the product direction:

- **Fund Mode is not decorative.** It is meant to be a long-lived shared pool / Treasury for friends, with Proposals to release funds. That is a stronger crypto primitive than plain expense splitting.
- **Agent Skill + payable Receipt / invoice endpoints are strategic.** The intended x402 / MPP-style endpoint where agents can call, pay, and receive Receipts or invoices increases crypto necessity beyond “wallet payment button.”
- **Fundy is broader than a Telegram reminder bot.** The plan is a personal-finance agent that can manage personal expenses, interact with Telegram Groups, draft Expenses, create Group interactions, and eventually support tax guidance.
- **Visa / IBAN / card top-up is part of the non-crypto expansion path.** The stated long-term path is crypto-native users first, then agents, then non-crypto users once card / IBAN / Altitude-style Solana banking rails are available.
- **Split Mode can be temporary or recurring.** Trips are temporary, but roommates, shared households, recurring friend groups, and Fund Mode Treasuries can become longer-lived.

Those corrections improve the product’s ceiling. They do not remove the main risk: the shipped MVP, docs, and roadmap still need sharper separation between **live**, **demo**, **planned**, and **speculative**.

---

## Scorecard

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Value Proposition** | **7/10** | “Group money, done right” is clear when focused on Split Mode: create Group, log Expenses, view Balances, settle exact USDC, get Receipt. It gets muddy when Fund Mode, Fundy, x402, Visa rails, mini-games, and tax are all discussed at once. |
| **Crypto Necessity** | **8/10** | Stronger than a normal crypto app. On-chain USDC Settlement, Treasury custody, verifiable Receipts, agent-payable x402 / MPP flows, and future programmable spending policies are meaningfully worse without crypto. The problem is not necessity; it is sequencing. |
| **Target User Clarity** | **6/10** | The staged target is clearer now: crypto-native friend groups first, then agents, then non-crypto users through card / IBAN / wallet top-up rails. But public copy still sometimes says “consumer payments” before the product is ready for non-crypto consumers. |
| **First-Time User Experience** | **6/10** | `/demo` and the landing preview fix the old “connect wallet before seeing anything” sin. The live app is still wallet-first and requires USDC + SOL understanding, so non-crypto onboarding remains future-dependent. |
| **Core Loop** | **6/10** | Split Mode has an episodic loop; Fund Mode and Fundy can create a durable loop through shared pools, recurring Expenses, Telegram interactions, personal finance, and tax. But those retention surfaces are mostly roadmap, not shipped proof. |
| **Competitive Moat** | **4/10** | The moat thesis is better than “Splitwise clone”: shared Treasury, agent-accessible APIs, payable Receipt / invoice endpoints, and Fundy distribution can compound. Today, moat is still mostly planned architecture, not user/network lock-in. |
| **Technical Execution** | **6/10** | Current repo builds, `pnpm build` passes, and `pnpm test` shows 34 passing tests. Wallet sessions, protected reads, RPC receipt verification, Settlement preflight, `/skill.md`, and `/api/docs` exist. Mainnet, robust E2E tests, Fund Mode Proposals, and production agent payment flows are still missing. |
| **Naming & Messaging** | **7/10** | “FundWise” and “Group money, done right” work. But docs/UI still drift between “Top up to settle” and “Route funds for Settlement,” and Fundy / Agent Skill / Fund Mode status is not consistently marked as shipped vs planned. |
| **Monetization Path** | **3/10** | There is now a rough thesis: Split Mode free, possible Settlement fees, Fund Mode fees/subscription/percentage, Fundy wallet top-up commissions. But none of this is modeled, priced, or validated. This is still the weakest business dimension. |
| **Market Timing** | **8/10** | Stablecoins, Solana payments, Visa frontier interest, agent payments, x402, and wallet-aware agents are all timely. The window is good. The danger is overbuilding five narratives instead of landing one wedge. |
| **Weighted Total** | **68/110** | Needs significant work; strong ceiling if focus and monetization get fixed. |

---

## The Worst Issues

### 1. You are confusing “roadmap” with “product”

**What's wrong:** Fund Mode, Fundy, x402 invoices, Visa / IBAN top-ups, Altitude, mini-games, and tax are not equal to shipped product. Each is plausible; together they make the shipped Split Mode path feel smaller than the roadmap around it.

**Why it matters:** Judges, users, and future contributors need to know what is live now. If everything is presented as part of the pitch, the strongest shipped path gets diluted.

**What good looks like:** A strict hierarchy everywhere:

1. **Live now:** Split Mode devnet / mainnet launch path.
2. **Next:** Fund Mode Treasury + Proposal lifecycle.
3. **Then:** Fundy and agent-readable APIs.
4. **Later:** Visa / IBAN / Altitude top-ups, mini-games, tax.

### 2. Fund Mode could be the moat, but it is not allowed to stay half-real

**What's wrong:** Fund Mode is potentially the most differentiated human product: friends pool money into a shared Treasury and use Proposals to spend. But the Proposal lifecycle is incomplete, so today it risks being a menu item instead of a product.

**Why it matters:** A shared Treasury without complete Proposal creation, approval, rejection, proof, execution, and recovery rules is dangerous. It creates expectations around pooled money before the governance workflow is ready.

**What good looks like:** Fund Mode stays invite-only until one full loop ships: create Treasury → Contribution → Proposal → approval/rejection → explicit execution → Receipt/history.

### 3. Agent payments are promising, but dangerous if underspecified

**What's wrong:** The x402 / MPP payable Receipt or invoice endpoint is a strong idea, but “agents can call and get Receipts/invoices” needs precise language. Is it a quote? invoice? payable settlement intent? receipt after verified payment? Who can call? What spending policy caps it? What prevents stale Balance payment?

**Why it matters:** Agent payments without exact authorization semantics become either unusable or unsafe. A Receipt must never exist before verified payment.

**What good looks like:** A spec that distinguishes:

- **Invoice / request:** unpaid intent, live amount, expires.
- **Payment challenge:** x402 / MPP payable object.
- **Verification:** proof or on-chain tx confirmed.
- **Receipt:** created only after verification.

### 4. Monetization is still hand-wavy

**What's wrong:** Current monetization ideas are plausible but not yet a model: Split Mode free, possible Settlement fee, Fund Mode subscription or percentage, Fundy wallet top-up commission, finance-analysis revenue. There are no numbers.

**Why it matters:** Fees on friend-to-friend settlements are sensitive. A 1% fee on a dinner split feels bad. A Fund Mode Treasury fee may make more sense, but only if value is clear.

**What good looks like:** A tiny monetization model with three scenarios: free Split Mode acquisition, Fund Mode paid tier, Fundy/payment-rail commission. Include expected fee, transaction volume, user tolerance, and what remains free.

### 5. The “mini-games / prediction market” idea is radioactive unless isolated

**What's wrong:** Private mini-games from a shared pool may be fun, but prediction-market language conflicts with the repo’s existing cleanup direction and can derail the payments story.

**Why it matters:** The product just pivoted away from prediction-market baggage. Reintroducing it casually risks confusing scope, compliance, and judging narrative.

**What good looks like:** If kept, frame it as a far-future Fund Mode “Group activity / game” module with explicit constraints. Do not put it in Split Mode. Do not pitch it for the hackathon. Do not build it before Treasury Proposal safety is done.

---

## Common Sins Detected

- **Complexity Worship:** The product has too many named primitives for its shipped maturity: Fund Mode, Fundy, Agent Skill Endpoint, Scoped Agent Access, Payable Settlement Requests, Spending Policies, x402 invoices, Visa top-ups, mini-games, tax.
- **No Retention Loop — partially unresolved:** Fundy and Fund Mode can fix this, but the currently shipped Split Mode loop is still mostly episodic.
- **Bridge to Nowhere — reduced but not gone:** LI.FI / Visa / Altitude rails are valuable only if they directly unblock Settlement or top-up. If they become separate dashboards, they are sponsor/integration theater.
- **Grant-Dependent — unresolved:** Hackathon timing is strong, but revenue is not yet defined.

---

## UX Red Flags

- **Wallet-first live app:** Demo exists, but real usage still starts with wallet connection and wallet verification.
- **Non-crypto users are roadmap-only:** Visa / IBAN / Altitude-style onboarding is a future solution, not a current UX defense.
- **Terminology drift:** “Top up to settle” vs “Route funds for Settlement” needs one canonical term.
- **Shipped/planned ambiguity:** `/skill.md` exists, but Scoped Agent Access and full agent payment flows remain planned. Docs should say that cleanly.
- **Mainnet trust gap:** Devnet success is not enough for pooled Treasury or payable agent endpoints.

---

## Fix These Now

1. **Highest impact:** Create a public shipped/planned matrix and make every doc obey it. Split Mode is live/primary; Fund Mode is invite-only/incomplete; Agent Skill baseline exists; Scoped Agent Access and x402 payable Receipts are planned; Visa / Altitude onboarding is future.
2. **Easiest win:** Write a one-page monetization model with numbers: free Split Mode, optional Settlement fee, Fund Mode paid tier / percentage, Fundy wallet top-up commission, and partner/card revenue.
3. **Existential fix:** Finish either Split Mode mainnet acquisition or the Fund Mode Proposal loop before touching mini-games, tax, or autonomous agent payments.
