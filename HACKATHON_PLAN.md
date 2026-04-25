# FundWise — Hackathon Track Plan

**Owner:** Sarthi
**Last updated:** 2026-04-25
**Hackathon:** Colosseum Frontier (April 6 – May 11, 2026)
**Submission deadline:** May 11, 2026 (16 days from now)
**Demo Day:** May 12, 2026 (Superteam Germany)
**Location:** Germany-based (eligible for DE-only tracks)

---

## Track Overview

All five tracks are part of the **Colosseum Frontier** hackathon. We can submit to multiple tracks with the same project.


| #   | Track                                 | Sponsor           | Region  | Prize Pool   | 1st          | Deadline | Fit Score  |
| --- | ------------------------------------- | ----------------- | ------- | ------------ | ------------ | -------- | ---------- |
| 1   | Build with LI.FI                      | LI.FI             | DE only | $2,500 USDC  | $1,500       | May 26   | **HIGH**   |
| 2   | Zerion CLI Agent                      | Zerion            | DE only | $2,000 USDC  | $1,000       | May 26   | **MEDIUM** |
| 3   | Visa Frontier                         | Visa / ST Germany | DE only | $10,000 USDG | $5,000       | May 27   | **HIGH**   |
| 4   | Not Your Regular Bounty               | Jupiter           | Global  | 3,000 jupUSD | 1,000 jupUSD | May 26   | LOW        |
| 5   | Live dApp (Solflare/Kamino/QuickNode) | Eitherway         | Global  | $20,000 USDC | $5,000       | May 27   | MEDIUM     |


**Total addressable (DE tracks only):** $14,500
**Total addressable (all tracks):** $35,500+

---

## Track-by-Track Analysis

### Track 1: Build with LI.FI (Superteam Germany) — PRIORITY 1

**Fit: HIGH | Region: DE only | Prize: $2,500 USDC**

**What LI.FI wants:** Projects that use the LI.FI SDK or API for cross-chain actions (swap, bridge, swap+bridge+contract call). They want to see LI.FI as the routing/liquidity layer for real user problems.

**Why FundWise fits:**

- Fund Mode pools stablecoins into a shared treasury. With LI.FI, members could **contribute from any chain** — not just Solana. A group member with USDC on Ethereum or Base could bridge into the Solana treasury via LI.FI in one click.
- FundWise's "any stablecoin" philosophy naturally extends to "any chain's stablecoin" with LI.FI.
- The cross-chain treasury onboarding is a concrete, real user problem LI.FI solves.

**What to build:**

1. Integrate `@lifi/sdk` into Fund Mode's contribution flow
2. When a member clicks "Contribute to Fund," detect if they have stablecoins on other chains
3. Show a LI.FI-powered bridge+swap UI: "You have 50 USDC on Base. Bridge to Solana and contribute in one click."
4. Use LI.FI's `getQuote()` for route discovery and `executeRoute()` for signing/execution
5. The bridged USDC arrives as SPL USDC in the group treasury

**Submission requirements (based on ETHGlobal LI.FI prizes):**

- Use LI.FI SDK/API for at least one cross-chain action
- Support at least two chains in the user journey
- Working frontend a judge can click through
- GitHub repo + video demo

**Effort:** ~2-3 days. LI.FI SDK is well-documented. The bridge UI can be a modal within the existing contribution flow.

**Win angle:** "Splitwise + cross-chain treasury funding" is a unique consumer use case. Most LI.FI hacks are DeFi yield/arb — FundWise stands out as a real-world expense-sharing app.

---

### Track 2: Visa Frontier Hackathon (Superteam Germany) — PRIORITY 1

**Fit: HIGH | Region: DE only | Prize: $10,000 USDG**

**What Visa wants:** Payments innovation. Products that rethink how people pay, split, or pool money. Visa is sponsoring because they want to see the future of digital payments.

**Why FundWise fits:**

- FundWise is literally a **payments product** — splitting expenses and pooling money are payment primitives.
- The "fund your treasury then spend" model mirrors how real-world shared budgets work (joint accounts, group gifts, trip funds).
- Settlements on-chain are instant and final — no "I'll Venmo you later."
- Stablecoin denomination maps to Visa's interest in digital dollars.

**What to emphasize in submission:**

1. **Split Mode as a payment network:** Friends settle debts instantly with stablecoins, no intermediaries
2. **Fund Mode as a shared spending account:** Pre-funded treasury with governance — a crypto-native joint account
3. **One-click settlements:** 2 taps + wallet sign, done in <3 seconds
4. **Real consumer problem:** Splitwise has 50M+ registered users; crypto can make it better
5. **Payment flow:** Contribution → Treasury → Proposal → Approval → Payout (full lifecycle)

**What to build (Visa-specific polish):**

- Polish the settlement flow to be buttery smooth
- Add a "payment receipt" view after settlement (tx signature, amounts, who paid whom)
- Show the total settled volume per group (shows payment volume)
- Add support for PYUSD (PayPal stablecoin) — directly relevant to Visa's payment network framing

**Effort:** Minimal extra work — the core payment flows ARE the submission. Focus on UX polish and demo video quality.

**Win angle:** FundWise is the most tangible consumer payments product in the hackathon. It's not "DeFi infrastructure" — it's "pay your friends." Visa judges will immediately understand the value proposition.

---

### Track 3: Build an Autonomous Onchain Agent using Zerion CLI (Superteam Germany) — PRIORITY 2

**Fit: MEDIUM | Region: DE only | Prize: $2,000 USDC**

**What Zerion wants:** Projects that build autonomous AI agents using the Zerion CLI for on-chain data (wallet analysis, portfolio, positions, transactions). The CLI wraps the Zerion API for AI agents.

**Why FundWise could fit (stretch):**

- We could build a **"FundWise Agent"** — an AI assistant that:
  - Monitors group treasuries and alerts when balances are low
  - Analyzes member wallets (via Zerion CLI) to suggest optimal settlement timing
  - Auto-proposes fund distributions based on spending patterns
  - Checks wallet balances before settlement to reduce failed transactions
- The agent runs as a background service using Zerion CLI for wallet data

**What to build:**

1. Install Zerion CLI: `npm install -g zerion-cli`
2. Create an agent script that:
  - Uses `zerion-cli wallet analyze <address>` to check member wallets
  - Monitors group treasury balances
  - Sends notifications (Telegram bot or in-app) when action is needed
  - Auto-suggests settlement amounts based on wallet balances
3. Can use x402 pay-per-call (no API key needed) for agent autonomy

**Submission requirements (inferred from track description + Zerion docs):**

- Working autonomous agent using Zerion CLI
- Agent performs on-chain actions or provides actionable insights
- Video demo + GitHub repo

**Effort:** ~3-4 days. Building the agent logic + Zerion CLI integration + demo video.

**Win angle:** "AI group expense manager that monitors wallets and auto-suggests settlements." Unique — most agents will be trading/DeFi focused.

**Risk:** This is a stretch fit. The agent needs to be genuinely useful, not bolted on. Only pursue if time allows after Tracks 1 and 2.

---

### Track 4: Not Your Regular Bounty (Jupiter) — PRIORITY 3

**Fit: LOW | Region: Global | Prize: 3,000 jupUSD**

**What Jupiter wants:** The track is vague ("Not Your Regular Bounty"). Skills needed: Content, Backend, Frontend, Mobile. 98 submissions already — very competitive.

**Why FundWise fits (weak):**

- Jupiter is Solana's DEX aggregator. FundWise doesn't directly use Jupiter.
- We could use Jupiter for swapping between stablecoin types (USDC → USDT) within the app, but that's marginal.
- We could build on Jupiter's liquidity for Fund Mode treasury yield, but that's explicitly out of scope for MVP.

**Recommendation:** SKIP. Low fit, high competition, vague requirements. Focus energy on DE tracks.

---

### Track 5: Build a Live dApp (Solflare/Kamino/DFlow/QuickNode via Eitherway) — PRIORITY 3

**Fit: MEDIUM | Region: Global | Prize: $20,000 USDC**

**What the sponsors want:** Live dApps deployed and usable. Integrating with at least one of: Solflare wallet, Kamino lending, DFlow order flow, QuickNode RPC, or Birdeye analytics. Deployed on the Eitherway platform.

**Why FundWise could fit:**

- **Solflare:** FundWise already supports Solflare via @solana/wallet-adapter. Could deepen integration with Solflare-specific features.
- **QuickNode:** Could use QuickNode for production RPC (already in our stack plan).
- **Kamino:** Could park idle Fund Mode treasury stablecoins in Kamino lending for yield (mentioned in ROADMAP.md Phase 4).
- **DFlow:** Less relevant for our use case.
- **Birdeye:** Could add token price feeds for stablecoin verification.

**What to build:**

1. Deploy FundWise as a live dApp on Eitherway
2. Deepen Solflare integration (Solflare wallet features, Solflare Mobile Stack)
3. Use QuickNode RPC for production
4. (Stretch) Add Kamino vault integration for Fund Mode idle treasury yield

**Submission requirements (inferred):**

- Live, working dApp on Eitherway
- Integration with at least one sponsor's product
- GitHub repo + video demo

**Effort:** Medium. The live deployment is already planned (Phase 3). Extra work is sponsor integrations.

**Win angle:** Consumer-focused dApp with real utility — stands out against DeFi/infra-heavy submissions.

**Risk:** $20K pool is attractive but 19 submissions already and global competition. The Eitherway deployment adds a layer of complexity. Pursue if time allows.

---

## Final Recommendation: Submission Strategy

### Primary targets (must-submit)


| Track                  | Prize        | Why                                                      | Extra Work Needed                      |
| ---------------------- | ------------ | -------------------------------------------------------- | -------------------------------------- |
| **Visa Frontier** (DE) | $10,000 USDG | FundWise IS a payments product. Core flows = submission. | UX polish + PYUSD support + demo video |
| **LI.FI** (DE)         | $2,500 USDC  | Cross-chain treasury funding is a genuine use case.      | LI.FI SDK integration (~2-3 days)      |


### Secondary targets (submit if time allows)


| Track                              | Prize        | Why                                                  | Extra Work Needed                           |
| ---------------------------------- | ------------ | ---------------------------------------------------- | ------------------------------------------- |
| **Zerion CLI** (DE)                | $2,000 USDC  | AI agent for expense monitoring. Stretch but unique. | Agent script + Zerion CLI (~3-4 days)       |
| **Live dApp / Eitherway** (Global) | $20,000 USDC | Live deployment + Solflare/QuickNode integration.    | Eitherway deployment + sponsor integrations |


### Skip


| Track       | Why                                                         |
| ----------- | ----------------------------------------------------------- |
| **Jupiter** | Vague requirements, low fit, 98 submissions, marginal value |


---

## Implementation Plan (April 25 – May 11)

### Week 1: April 25 – May 1 (Core MVP + LI.FI)

**Goal:** Get Split Mode fully working on devnet + LI.FI integration for Fund Mode.

- Phase 0 cleanup: remove prediction-market code, rewrite landing page
- Split Mode: group CRUD, expense entry, balance computation
- Split Mode: settlement flow (SPL token transfer on devnet)
- LI.FI SDK integration: add `@lifi/sdk`, build cross-chain contribution modal
- Fund Mode basic: create fund, contribute (with LI.FI cross-chain option)

### Week 2: May 2 – May 8 (Polish + Agent + Sponsor Integrations)

**Goal:** Polish all flows, build Zerion agent, add sponsor integrations.

- UX polish: receipt views, empty states, onboarding, mobile
- PYUSD stablecoin support (Visa track)
- QuickNode RPC for production
- Zerion CLI agent: wallet monitoring + settlement suggestions
- Solflare deep integration
- Kamino idle treasury yield (stretch)

### Week 3: May 9 – May 11 (Submission + Demo)

**Goal:** Submit to all target tracks, create demo videos.

- Deploy to Eitherway (if pursuing Track 5)
- Record demo videos (3-min each, one per track)
- Write submission copy for each track
- Submit to Colosseum Frontier main track
- Submit to LI.FI side track (May 26 deadline but submit early)
- Submit to Visa side track
- Submit to Zerion side track (if agent ready)
- Test all flows on devnet end-to-end

---

## Key Dates


| Date              | Event                                               |
| ----------------- | --------------------------------------------------- |
| April 25          | Today — start building                              |
| April 27 – May 11 | Build Station Berlin (Superteam Germany co-working) |
| May 11            | **Colosseum Frontier submission deadline**          |
| May 12            | Demo Day (Superteam Germany)                        |
| May 26            | LI.FI / Zerion / Jupiter track winner announcement  |
| May 27            | Visa / Eitherway track winner announcement          |


---

## Sponsor Integration Details

### LI.FI

- **SDK:** `@lifi/sdk` (npm)
- **Key methods:** `getQuote()`, `executeRoute()`, `getContractCallsQuote()`
- **Chains:** Support at least 2 (Ethereum + Solana, or Base + Solana)
- **Docs:** [https://docs.li.fi/](https://docs.li.fi/)
- **Contact:** @Oxjunebox on Telegram

### Zerion CLI

- **Install:** `npm install -g zerion-cli`
- **Auth:** API key or x402 pay-per-call ($0.01 USDC/request on Base)
- **Key command:** `zerion-cli wallet analyze <address>`
- **Skills:** wallet-analysis, wallet-trading, chains
- **Docs:** [https://developers.zerion.io/build-with-ai/zerion-cli](https://developers.zerion.io/build-with-ai/zerion-cli)
- **GitHub:** github.com/zeriontech/zerion-ai
- **Contact:** @gyaning02 on Telegram

### Visa / Superteam Germany

- **Focus:** Payments innovation, consumer fintech
- **Contact:** @zCasee on Telegram

### Eitherway (Solflare/Kamino/QuickNode)

- **Platform:** Deploy dApp on Eitherway
- **Sponsors to integrate:** Solflare wallet, QuickNode RPC, Kamino lending
- **Contact:** Via Eitherway Telegram group

