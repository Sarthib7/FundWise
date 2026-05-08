# FundLabs Technology Landscape Report — Web3 Infrastructure for Expense Splitting, Shared Treasuries & AI Agent Payments on Solana

*Date: May 7, 2026*

## TL;DR

- **Build the wallet/auth and stablecoin layer on Privy + Circle CCTP V2 + Kora (replacing the now-archived Octane), settle agent payments via x402 and the Solana MPP SDK, and use Squads multisig (with Altitude as a fiat-out path) for the shared-treasury surface.** These are the only components in this set with clear primary-source documentation, audits, and live mainnet usage on Solana as of May 7, 2026.
- **Yield should come from Meteora Dynamic Vaults or a yield-bearing stablecoin (Solayer sUSD, Streamflow USD+, Ondo USDY) — not from Aave or Morpho**, neither of which has a native production deployment on Solana mainnet despite years of governance discussion.
- **For the agent product (Fundy bot), build on the Pi coding-agent framework (TypeScript/Node, 46,000 GitHub stars) — the same framework that powers OpenClaw — and treat receipts/invoices as IPFS-pinned blobs with on-chain CIDs**; Shelby is too early (devnet only, Aptos-anchored) to depend on for receipt storage in a hackathon timeline.

## Key Findings

1. **The agent-payment stack is converging on x402 + MPP.** x402 (Coinbase/Cloudflare, governed by the x402 Foundation under the Linux Foundation since Q1 2026) and MPP (Stripe/Tempo, launched March 18, 2026) are the two dominant HTTP-402 standards. They are deliberately backward-compatible at the "charge" layer, and Solana ships SDKs for both (`@solana/mpp` and the official x402 facilitator on Solana). Building Fundy bot to accept x402 *and* MPP is cheap and future-proofs against either standard winning.
2. **Octane is dead; use Kora.** The `anza-xyz/octane` repo was archived on April 20, 2026 with a README that points users directly to `solana-foundation/kora`. Kora v2.0.5 (March 11, 2026) is the Solana Foundation–maintained replacement, audited by Runtime Verification, and natively supports paying fees in USDC or any SPL token. This is the cleanest answer to "users shouldn't need SOL."
3. **Aave is *not* live on Solana**, despite a January 2024 governance vote and recurring announcements. As of May 2026, the most recent Aave changelogs only list V4 on Ethereum and V3 deployments on EVM L2s. The "Aave on Solana via Sunrise DeFi" stories are unofficial bridge-based wrappers, not Aave Labs deployments. Morpho is similarly EVM-only (Ethereum + Base).
4. **Squads + Altitude is the natural treasury + fiat off-ramp axis on Solana.** Squads Protocol secures more than $15 billion in assets and has processed over $5 billion in stablecoin transfers, trusted by over 450 teams. Its sister product Altitude (publicly launched December 2025, $200M+ processed across 50 countries by April 2026, $42.9M total funding) provides USD/EUR accounts, 5.00% APY on idle balances, virtual cards, and Bridge/MoonPay rails. For FundLabs this means you can ship "shared treasury that earns yield and pays cards" without rebuilding banking infrastructure.
5. **Shelby is not yet a viable receipt-storage layer.** It is a Jump Crypto/Aptos Labs hot-storage protocol with a Q4 2025 devnet and no public mainnet. Receipt storage today should use IPFS (with Pinata/NFT.Storage pinning) plus on-chain CIDs in a Solana program account; migrate to Shelby only if/when it ships chain-agnostic mainnet support.
6. **Frontier is the right hackathon, but the prize structure is brutal.** Colosseum's Frontier hackathon (April 6 – May 11, 2026) has no tracks: $30,000 to one Grand Champion plus 20 × $10,000 runner-up prizes, $10,000 university and public-goods awards, and accelerator entry ($250,000 pre-seed) for ~10 teams. Judging is investor-led, evaluating MVP, GTM, monetization, and team — not just code.

## Details

### 1. Wallet & Identity Layer

**Privy (privy.io)** powers 120M+ accounts across 2,000+ teams and supports Ethereum, Solana, Bitcoin, Tempo, and "hundreds of blockchains." It uses TEE-isolated key sharding, is SOC 2 compliant, supports Google/Apple/Twitter/Discord/Telegram social login, email, SMS, passkeys, and external wallet connection (Phantom, Backpack). The free tier covers 50K signatures and $1M monthly transaction volume; usage above 10K MAU, 50K signatures, or $1M volume is billed (custom per-transaction or per-transacting-wallet pricing). Privy explicitly advertises one-click funding from cards/ACH and chain abstraction. **For FundLabs**: this is the single best onboarding choice — Google login plus a Solana embedded wallet in one SDK call, and the same SDK can also issue server-controlled wallets for Fundy agents.

**Squads Protocol (squads.xyz)** is the Solana multisig standard, securing more than $15 billion across over 450 teams (Helium, Jito, Pyth, Drift, Mango among them). v4 is formally verified, audited by Trail of Bits, OtterSec, and Neodyme. Features include time locks, spending limits, role-based permissions (Proposer/Approver/Executor), sub-accounts, multi-party payments, and a SquadsX browser extension that lets multisig vaults connect to dApps like a regular wallet. **For FundLabs**: Squads is the right primitive for the *shared treasury* — you can either integrate Squads Multisig directly via the `@sqds/multisig` TypeScript SDK or use Altitude for a finished UX.

### 2. Fiat & Stablecoin Rails

**Altitude (altitude.xyz, by Squads Labs)** is built on Squads multisig infrastructure and offers multi-currency USD/EUR accounts, ACH/Wire/SEPA virtual accounts, FX, **5.00% APY on balances** (per their pinned X post Sept 2025), virtual cards with up to 2% cashback (waitlist), bill pay, and reimbursements — across 150+ countries. Compliance is handled in-house with sanctions screening, AML, transaction monitoring, KYB, and PSP partnerships including Bridge, MoonPay, Infinite, and Due. April 2026: $18M strategic round led by Solana Ventures, $42.9M total funding. Since December 2025: $200M+ processed. **For FundLabs**: this is your *fiat in/out + treasury earning APY* answer. Plug in Altitude rather than re-building banking.

**Bridge.xyz** (acquired by Stripe in October 2024 for $1.1B, now Stripe's stablecoin orchestration layer) offers an Orchestration API for moving/storing/accepting stablecoins, an Issuance API (Phantom's CASH, MetaMask, Hyperliquid's USDH all run on it), and stablecoin-linked Visa cards via Bridge–Visa partnership across LATAM (expanding to EU/Africa/Asia). Bridge backs Altitude's PSP layer on Solana. **For FundLabs**: relevant as the fiat infrastructure that ultimately settles Altitude card transactions; not a direct integration target.

**Circle CCTP V2** is the canonical native-USDC cross-chain rail. CCTP V2 launched on Ethereum/Avalanche March 11, 2025; Solana CCTP V2 was added October 2025 via Anchor programs `CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC` (MessageTransmitter) and `CCTPV2vPZJS2u2BBsUoscuikbYjnpFmbFsvVuJdgUMQe` (TokenMessengerMinter). Burn-and-mint, no wrapped USDC, no liquidity pools. **Standard transfers take 13–19 minutes**; Fast Transfers settle in ~30 seconds with Circle's soft-finality backstop. Hooks let you trigger destination-chain actions (e.g., auto-deposit into a Meteora vault) via CPI on Solana. CCTP V1 is being phased out July 31, 2026. **For FundLabs**: this is how multi-chain users top up the shared Solana treasury without bridge risk. Integrate via Circle's TypeScript SDK or via LiFi/Across for a one-click UX.

**LiFi (li.fi)** aggregates 20+ bridges and 20+ DEX aggregators across 60+ chains (including Solana, Bitcoin, Tron); $80B+ cumulative volume, 600+ integration partners (MetaMask, Phantom, Robinhood Wallet). Charges no LiFi-side fee but you pay underlying bridge/DEX fees plus optional integrator fees (LiFi takes a configurable cut, default 0% for whitelabel). Supports CCTP for the USDC leg automatically. Three integration paths: REST API, TypeScript SDK, and an embeddable Widget. **Risk**: aggregation does not eliminate underlying bridge risk; LiFi has had infinite-approval phishing incidents in the past, so use scoped approvals. **For FundLabs**: useful for an "any chain → USDC on Solana" deposit funnel; CCTP V2 alone covers most need.

### 3. Yield & Lending

**Meteora (meteora.ag)** is Solana's dominant dynamic liquidity layer. Three primitives matter for FundLabs:
- **Dynamic Vaults** — single-asset (USDC/USDT/SOL) vaults that auto-rebalance across Kamino, MarginFi, Solend, etc. via the Hermes off-chain keeper. Idle treasury can earn variable APY without LP/IL exposure.
- **Dynamic AMM pools** with auto-compounding yield (idle assets are lent out for additional yield on top of swap fees).
- **DLMM** (Dynamic Liquidity Market Maker) — concentrated liquidity with real-time fee adjustment.

DLMM/AMM/Vault contracts are audited by Zellic, Bramah Systems, and Neodyme; $500K Immunefi bug bounty. Hermes "cannot withdraw funds to external wallets — meaning even in the event of an exploit, your principal remains either in the vault or with the lending protocol." Vault APYs are variable; cited historical ranges of 10–40% are for LP positions, not stablecoin vaults — stablecoin Dynamic Vaults typically run substantially lower (single-digit APY tracking underlying lending rates). **For FundLabs**: the Dynamic Vaults are the cleanest "deposit USDC, earn yield, withdraw any time" primitive, and the SDK is well-documented.

**Aave on Solana — does not exist as an Aave Labs deployment.** The community-approved (83% in Jan 2024) Neon EVM deployment never delivered a true Solana-native version, and Aave V4 (March 30, 2026 mainnet) is Ethereum-only. Reports of "Aave launches on Solana via Sunrise DeFi" describe a third-party bridging wrapper, not an official deployment. The Solana Foundation has deployed treasury USDT into Aave on Ethereum, but that flows the other direction. **For FundLabs**: do not depend on Aave-on-Solana. Use Meteora, Kamino, or a yield-bearing stablecoin instead.

**Morpho** is on Ethereum and Base only ($7.6B+ TVL, $50M Series in August 2024 from Ribbit/a16z/Coinbase Ventures). Despite some marketing claims of "chain-agnostic," there is no Solana deployment. Compared to Meteora, Morpho is a peer-to-peer/peer-to-pool *lending* protocol with isolated markets, while Meteora is a *liquidity/yield aggregation* protocol — different products. **For FundLabs**: not relevant unless you go multi-chain on EVM.

**Yield-bearing stablecoins on Solana** (alternative to Meteora vaults):
- **Solayer sUSD** — T-bill-backed, ~4.01% APY, Token-2022 interest-bearing extension, $10M+ deposits.
- **Streamflow USD+** — T-bill-backed via M0, ~3.6% APY, daily distribution.
- **Ondo USDY** — $100M+ TVL on Solana, daily compounding, **non-US users only**.
- **Sky USDS** — bridged from Ethereum via Wormhole NTT; integrated with Kamino and Drift.

**For FundLabs**: holding sUSD or USD+ as the *base treasury asset* gets you yield with zero LP/IL/smart-contract-vault risk beyond the issuer. This is probably the highest-leverage move for a hackathon MVP.

### 4. Fee Abstraction (Critical for "no SOL needed" UX)

**Octane is archived.** As of April 20, 2026 the `anza-xyz/octane` repo is read-only and the README directs users to Kora: *"This repo has been archived and may be deleted in the future. Check out Kora: https://github.com/solana-foundation/kora."*

**Kora (solana-foundation/kora)** is the canonical Solana Foundation replacement. Latest: v2.0.5 (March 11, 2026), 22 releases, audited by Runtime Verification (Nov 2025), Rust core with TypeScript SDK, JSON-RPC 2.0. Direct from the README: *"Kora is your Solana signing infrastructure. Enable gasless transactions where users pay fees in any token—USDC, BONK, or your app's native token—or handle any transaction signing that requires a trusted signer."* Supports Privy and Turnkey signers natively. **For FundLabs**: this is the answer to "users pay fees in USDC instead of SOL." Run your own Kora node or use a public one. Cost is the SOL you spend as fee payer plus a configurable margin (e.g., 10% premium per the analogous Circle Paymaster model on EVM), recouped from user USDC payments.

**Jupiter (jup.ag)** commands 93.6% of Solana's aggregator-routed DEX volume — its highest level in approximately six months — per Step Data / Solana Floor's weekly report; KuCoin data puts Jupiter's 30-day trading volume at $49.1B as of December 2025. Standard swaps via Manual Mode have **zero Jupiter platform fee**; Ultra Mode charges 0–0.1%. You also pay underlying DEX fees (0.05–0.30%) plus Solana network cost (<$0.01). Limit orders: 0.2% taker fee. **For FundLabs**: useful for in-app SOL→USDC sweeps or auto-converting received tokens to the treasury asset; not a fee-abstraction tool per se but pairs with Kora (Kora's fee-payer node uses a Jupiter or Whirlpools route to swap the user's SPL fee back into SOL).

### 5. Agent Payment Layer

**x402** is Coinbase's open standard for HTTP-402 stablecoin payments, launched May 2025. Now governed by the **x402 Foundation under the Linux Foundation** (announced Q1 2026), with Coinbase and Cloudflare as co-founders. As of March 2026, Sherlock-cited dashboards report **119M+ transactions on Base, 35M+ on Solana, and ~$600M in annualized volume** (these are aggregator numbers; the Solana Foundation's own page states "35M+ transactions and $10M+ volumes processed over x402" since the Solana launch). On January 11, 2026 Solana surpassed Base in daily x402 transactions for the first time (518,400 vs 505,000). Caveat: independent analysis cited by Formo suggests roughly half of x402 transactions are bot-driven heartbeats with real daily payment volume around $28,000; treat headline numbers cautiously. Stripe added x402 support in February 2026; Cloudflare ships a Workers integration; Coinbase's CDP runs a hosted facilitator with 1,000 free transactions/month, then $0.001/transaction. Supports Base, Polygon, Arbitrum, World, and Solana via EIP-3009 (USDC, EURC) or Permit2 (any ERC-20).

**Machine Payments Protocol (MPP, mpp.dev)** is Stripe + Tempo's competing-but-compatible standard, launched **March 18, 2026** with Visa and Lightspark as design partners. The protocol is payment-method-agnostic at the core (`method`: tempo, stripe, solana, card); Solana support shipped via `@solana/mpp` SDK in early 2026 (handles SPL + Token-2022). MPP introduces **sessions** for streaming/recurring micropayments (Tempo-only at launch). MPP is **backward-compatible with x402's "exact" charge flow**, meaning a single MPP server can accept x402 clients without modification. As of late March 2026, MPP self-reported ~31,100 transactions, $3,730 volume, 671 registered agents, and 326 servers — small numbers but growing, and Visa's involvement gives it strong distribution potential. Stripe's recommendation matrix: x402 for permissionless crypto-native flows, MPP for fiat-rail and streaming sessions.

**Pay.sh (pay.sh / solana-foundation/pay)** launched **May 5, 2026** (just two days before this report) as a Solana Foundation × Google Cloud partnership. It is a CLI + gateway-as-a-service (`brew install pay` or `npm install -g @solana/pay`) that proxies paid API endpoints (initially Google Cloud Gemini, BigQuery, Vertex AI, Cloud Run, plus 50+ community endpoints from Helius, Alchemy, Dune, Nansen, The Graph, Crossmint, MoonPay, etc.). Local wallet authorization with Touch ID / Windows Hello / GNOME Keyring / 1Password. Built on x402 *and* MPP. Includes a built-in MCP server so Claude Code, Codex, and Gemini agents can request paid API calls through the same wallet flow. **For FundLabs**: Pay.sh is the consumer-facing entry point for the agent economy on Solana. Integrate two ways — (a) make Fundy bot a *Pay.sh client* so it can pay for any API endpoint without API keys, and (b) optionally publish FundLabs's own paid endpoints via Pay.sh so external agents can pay you for receipt parsing, expense splitting, or treasury queries.

**Zerion CLI / Zerion AI** is one of the first production examples of x402 in the wild for blockchain data. The `zeriontech/zerion-ai` GitHub repo ships an EVM+Solana JSON-first CLI plus a hosted MCP server. Pay-per-call analytics commands (portfolio, positions, history, pnl, analyze) cost $0.01 USDC per call via x402 on Base or x402 on Solana. Supports both an EVM private key (`WALLET_PRIVATE_KEY=0x...`) and a Solana base58 keypair, with `ZERION_X402_PREFER_SOLANA=true`. Trading commands still require an API key (`zk_…` tokens). **For FundLabs**: Fundy bot can call Zerion's MPP/x402 endpoints to look up Solana wallet portfolios when computing who owes whom — pay $0.01 per check, no signup. This is the cleanest concrete example of how MPP/x402 changes the agent's data-access economics.

### 6. Agent Framework

**Pi (badlogic/pi-mono)** by Mario Zechner (libGDX creator). 46,000 GitHub stars, 5.4k forks, latest release v0.73.0 (May 4, 2026). TypeScript on Node.js (`npm install -g @mariozechner/pi-coding-agent`). Modular monorepo — `pi-ai` (unified LLM API for Anthropic/OpenAI/Google/xAI/Groq/Cerebras/OpenRouter), `pi-agent-core` (tool execution + streaming), `pi-tui` (differential terminal rendering), `pi-skills` (compatible with Claude Code and Codex). Pi powers **OpenClaw** (`openclaw/openclaw`, 366,000 stars as of May 7, 2026, making it the most-starred non-aggregator software project on GitHub; OpenClaw surpassed React on March 3, 2026 at exactly 250,829 stars per star-history.com; runs on macOS/iOS/Android plus WhatsApp/Telegram/Discord/Slack/Signal/iMessage). Confirmed by Armin Ronacher (Flask creator): *"what's under the hood of OpenClaw is a little coding agent called Pi."* Pi was specifically called out in Solana's Colosseum AI Agent Hackathon (Feb 2026) as a compatible framework. **For FundLabs**: Pi is an excellent choice for Fundy bot — minimal tool harness (so you control every token in context), provider-agnostic, embeddable via the AgentSession SDK. The flip side: smaller ecosystem than LangChain/CrewAI, fewer pre-built integrations.

### 7. Storage: Receipts & Invoices

**Shelby (shelby.xyz, by Aptos Labs + Jump Crypto)** is a decentralized hot-storage protocol for read-heavy workloads (video, AI pipelines, real-time apps), targeting sub-second reads via a dedicated fiber backbone, Clay erasure coding, and micropayment channels. Anchored on Aptos as the coordination/settlement layer (~600ms finality, 30K TPS, $0.000005 gas) but explicitly **chain-agnostic with planned Ethereum and Solana support**. Devnet was scheduled for Q4 2025; public testnet to follow; mainnet contingent. The connection to "00.xyz / Double Zero" is that Shelby's tiered-archive design was inspired by Jump's experience with the Double Zero fiber network, and DoubleZero co-founder Austin Federa previously led strategy at the Solana Foundation — there is cross-pollination but no formal "DoubleZero grant to Shelby." **For FundLabs**: Shelby is *the* future-state answer for receipt/invoice storage with native pay-per-read monetization, but it is too early (devnet) to depend on for a hackathon submission. Use IPFS now, plan a Shelby migration for v2.

**00.xyz / DoubleZero (doublezero.xyz, $2Z token)** is a DePIN fiber-optic backbone for blockchain validators, founded by Austin Federa, Mateo Ward, Andrew McConnell. Raised $28M at $400M valuation (Multicoin, Dragonfly, March 2025) plus Galaxy follow-on. SEC issued a No-Action Letter on the 2Z token in September 2025, declaring it not a security — significant precedent for DePIN tokens. Mainnet went live October 2, 2025; 2Z trades on Binance/Bybit/OKX. Use case: low-latency validator-to-validator routing for Solana and other chains. **For FundLabs**: not a direct integration target; relevant only as ecosystem context (better Solana network performance benefits all builders) and because Shelby builds on the same DoubleZero-inspired infrastructure thesis.

**Recommended receipt-storage architecture for FundLabs (today):**
1. Receipt image / invoice PDF → upload to IPFS via Pinata or NFT.Storage (free or cheap pinning).
2. Receipt CID + metadata (amount, payer, group, OCR-extracted line items) → store in a Solana program account or a Squads multisig sub-account memo.
3. For permanence concerns, optionally mirror to Arweave (one-time fee, ~$5–50 per file, "permanent" via endowment model) — Arweave is the standard for NFT metadata permanence and would work for tax-archive-grade receipts.
4. When Shelby ships chain-agnostic mainnet, migrate the hot path (receipts users actively view) to Shelby for sub-second loads and pay-per-view monetization.

### 8. DAO Exit Mechanics: MolochDAO Rage-Quit

The Moloch v2 `ragequit(uint256 sharesToBurn, uint256 lootToBurn)` function lets a member burn their proportional share of *Shares* and/or non-voting *Loot* and receive a pro-rata withdrawal across all whitelisted treasury tokens. Constraints: (a) member cannot have a `Yes` vote on a proposal still in the voting/grace period, (b) tokens array must be sorted ascending and unique (to prevent duplicate withdrawals), (c) `dilutionBound` (default 3) caps how diluted a Yes-voter can become — if more than two-thirds of shares ragequit before processing, the proposal fails. Architecturally, the treasury holds funds in an internal "Guild" balance; ragequit decreases that balance and credits the member's withdrawable balance. **For FundLabs**: the rage-quit pattern is the right primitive for a "leave the group, take your pro-rata share" feature in shared treasuries. On Solana you would re-implement it as a Squads sub-account or a custom Anchor program tracking shares + a withdrawable-token registry. The Ragequitter pattern (`Moloch-Mystics/ragequit` on GitHub, ERC-6909-based) is a useful reference for how to extend ragequit to a Safe/multisig with arbitrary token approvals.

### 9. Hackathon Strategy: Colosseum Frontier

Frontier is the **12th Solana Foundation hackathon**, the 5th run by Colosseum, registration open April 6 – May 11, 2026. **No tracks, no side-bounties from Colosseum** (Superteam regional bounties exist separately on Superteam Earn). Prize structure:
- $30,000 to one Grand Champion
- $10,000 each to next 20 startups
- $10,000 University Award
- $10,000 Public Good Award
- Top ~10 winners receive **$250,000 pre-seed** via Colosseum's accelerator + AI credits + SF office access + Demo Day in front of leading crypto VCs.

Total prize/investment pool: ~$2.75M. Cypherpunk (the Dec 2025 hackathon) had 9,000+ participants and 1,576 final projects. Required deliverables: GitHub repo, video pitch deck, technical demo video, optional weekly updates. Judges are investors evaluating MVP, GTM, monetization, and team — this is closer to a YC application than a code competition. **For FundLabs**: optimize for *a working MVP a non-technical investor can use in 60 seconds* (e.g., split a dinner bill via WhatsApp + Fundy bot + Solana settlement), not for the most novel architecture. Weekly updates are recommended — they meaningfully boost visibility.

### 10. Competitive Landscape

**Direct expense-splitting competitors on Solana:**
- **SolSplitter (solsplitter.com)** — explicitly targets "DAOs, degen friend groups, and crypto-native" users.
- **SPLit (splitsol.net)** — markets Solana 400ms settlement vs Venmo's 1–3 day instant transfer, $0.001 fees vs Venmo's 1.75%.
- **Degensplit (Starknet)** — older, EVM-side experiment treating each lending as an NFT.

None has meaningful traction or AI agents. FundLabs's wedge is the **AI-agent-managed shared treasury with x402/MPP-payable endpoints + yield + multisig** — the *combination* is novel.

**Indirect / EVM-side:** SplitPro (open-source, web2), Splitwise (closed source, paywalled core feature, no crypto). The Splitwise pain point (3-entries-per-day cap, paywalled currency conversion) is a real wedge.

**AI-agent payment infrastructure landscape (May 2026):** x402 + MPP have effectively standardized the rails. The active layer is now agent-side wallet UX (Pay.sh, Coinbase AgentKit, Stripe's Agentic Commerce Suite, Visa's Trusted Agent Protocol, Mastercard's Agent Pay). FluxA is the closest direct analog to a "co-wallet for agents" product. Competition is increasing fast.

**Yield-bearing shared-treasury products:** Aave's sGHO concept, Sky's sUSDS, and similar wrappers exist on EVM, but a *group/shared* yield product is a green field. Most "DAO treasury" products (Llama, Steakhouse, Karpatkey) are advisory/curator-style, not consumer-facing.

## Recommendations

**Stage 1 (Hackathon MVP, by May 11, 2026):**
- Auth: **Privy** with Google login + Solana embedded wallet (free tier easily covers a hackathon).
- Shared treasury: **Squads Multisig v4** via `@sqds/multisig` SDK, single Squad per group, threshold-based settlement.
- Yield: Hold treasury in **Solayer sUSD** or **Meteora USDC Dynamic Vault** (one of these, not both — pick whichever is faster to integrate).
- Fee abstraction: **Kora** (run your own node or use a public endpoint) so users only ever touch USDC.
- Cross-chain top-up: **Circle CCTP V2** Fast Transfer for USDC inbound from EVM chains; LiFi Widget as a fallback for non-USDC assets.
- Agent: **Pi (`@mariozechner/pi-coding-agent`)** as the Fundy bot framework; expose Fundy as a Telegram/Discord/WhatsApp interface (OpenClaw-style multi-channel pattern).
- Agent payments: implement **x402 *and* MPP** receivers for two FundLabs endpoints (e.g., `/split` and `/balance`), priced at $0.005 USDC each. List in the Pay.sh `pay-skills` catalog for free distribution.
- Receipts: **IPFS via Pinata**, CIDs on-chain in the program account.

**Stage 2 (Post-hackathon, if accepted to accelerator):**
- Add **Altitude** as the fiat off-ramp + virtual card layer (5.00% APY on cash balances, virtual cards for group spending). Altitude's licensed PSP integrations remove the need for FundLabs to build banking compliance.
- Implement **Moloch v2-style ragequit** as a custom Anchor program on top of Squads, so members can exit a shared treasury with their pro-rata share.
- Add a **Zerion x402 integration** so Fundy can answer "what does the treasury hold across chains?" via $0.01 micro-payments instead of API keys.
- Begin a **Shelby migration prototype** for receipt hot-storage *only* once Shelby ships chain-agnostic mainnet; until then, layer Arweave under the IPFS pinning for tax-grade permanence.

**Thresholds that would change the recommendation:**
- If **Aave V4 Spokes ship a native Solana deployment** (currently no announcement; would be visible in Aave Labs' monthly development update on governance.aave.com) — switch yield routing to Aave for institutional credibility.
- If **MPP transaction volume on Solana exceeds x402 by more than 2× by Q3 2026** — drop x402 receiver and ship MPP-only.
- If **OpenClaw publishes a "FundLabs"-style group-finance skill template** before Frontier judging — pivot Fundy to ride that distribution rather than launch standalone.
- If **Shelby ships Solana mainnet support with sub-second reads and per-read payments** — make Shelby the canonical receipt store and use the per-read payments to monetize receipt access (e.g., accountant pays $0.001 to view a quarter's receipts).

## Caveats

1. **x402 volume figures are contested.** The 119M Base / 35M Solana / $600M annualized headline (Sherlock, March 2026) likely reflects a large share of bot heartbeat traffic; Formo's analysis cited daily payment volume around $28,000. Use these as "the rails are real and growing" evidence, not as a TAM calculation. The Solana Foundation's own statement of "35M+ transactions and $10M+ volumes" is the most defensible primary figure.
2. **Aave on Solana is repeatedly mis-reported.** Multiple aggregator sites describe Aave as "live on Solana via Sunrise DeFi" — these are not Aave Labs deployments and should not be treated as such.
3. **MPP is two months old.** Self-reported figures (~31K transactions, ~$3.7K volume as of late March 2026) are unverified; treat MPP as an emerging standard with strong distribution partners (Stripe, Visa) but unproven adoption.
4. **Pay.sh launched May 5, 2026 (two days before this report).** No published transaction-count data exists. The ecosystem-validation thesis is strong (Google Cloud branding) but adoption metrics are not yet measurable.
5. **Shelby has no public mainnet or testnet** as of May 2026 — only an announced Q4 2025 devnet. Plans for chain-agnostic mainnet are stated but undated.
6. **Privy custom pricing is not public.** The "above 10K MAU / 50K signatures / $1M monthly volume" tier is custom-quoted; FundLabs should request a quote before assuming free-tier economics scale.
7. **Meteora Dynamic Vault APYs vary widely.** The 10–40% annualized figures cited for "Meteora vaults" are typically *DLMM LP* yields, which include impermanent loss exposure. Single-asset stablecoin Dynamic Vault APYs track underlying lending rates and are typically much lower (low single digits to low teens depending on Solana DeFi conditions).
8. **No public information on a FundLabs-specific "Fundy" agent.** A targeted search for "Fundy" in connection with Pi/OpenClaw/Solana returned no public hits — this report assumes "Fundy" is an internal codename for a not-yet-public bot. Treat the Pi-as-framework recommendation as a default; if Fundy is already built on a different framework, the integration strategy stays largely the same (the agent-payment, fee-abstraction, and treasury layers are framework-agnostic).