# FundLabs Monetization & Business Model Strategy — A Decision-Ready Research Report

## TL;DR
- **Lead with two revenue engines that are already proven elsewhere — a 10–25% yield-curator spread on Fund Mode treasuries (the Morpho/Wealthfront model) and per-call x402/MPP fees on Receipt Endpoint at $0.005–$0.02/call (the Zerion model) — and treat FundWise Split Mode and Fundy Bot as zero-fee top-of-funnel that drains balances into Fund Mode.** This is the only configuration that makes a 2-person team VC-fundable while staying philosophically consistent with the "users see only dollars" vision.
- **For the Colosseum Frontier judging on May 11, 2026, the winning revenue narrative is "agent-economy infra with a consumer wedge."** Cofounder Matty Taylor explicitly framed Colosseum hackathons as "equally engineering competitions as they are business competitions," and accelerator-aligned VCs are funding agent-payment companies aggressively right now: Catena Labs raised $18M led by a16z crypto on May 20, 2025 (Chris Dixon: "They're building financial infrastructure that agentic commerce can depend on"); Skyfire raised $8.5M in August 2024 + a $1M Coinbase Ventures/a16z CSX strategic top-up in October 2024; MCPay just won Cypherpunk's Stablecoin track and a $250K Colosseum check in December 2025. Frame Receipt Endpoint as "Stripe receipts for the agent economy" and FundWise/Fundy as the consumer distribution moat.
- **Do not launch a token at hackathon stage.** Successful comparable infrastructure plays — Squads ($10B+ AUM, no token at launch), Safe (token launched only after $72B+ AUM), Phantom (no token, ~$550M cumulative revenue), and Privy (acquired by Stripe on June 11, 2025 with no token; Privy was "last valued at $230 million in March [2025]" per Bitcoin Magazine, having raised $40M+ from Paradigm, Coinbase Ventures, and Ribbit Capital) — built durable equity-funded businesses. OlympusDAO-style treasury tokens collapsed >93% from peak. A token is a Series A+ option, not a seed-stage tactic.

## Key Findings

### 1. The realistic monetization stack, by product

**FundWise Split Mode** is structurally a loss leader. Splitwise has been a category leader for 14 years and only converts via a $39.99/year Pro tier (estimated ARR > $25M, ~25–30% from subscriptions, the rest from ads and fintech referrals); founder Jon Bittner explicitly told TechCrunch the company "doesn't make money off of transaction fees or stored consumer funds." Don't try to charge for the split itself — instead, monetize the *settlement* (a 0.1–0.3% spread on USDC settlement, similar to Phantom's 0.85% in-app swap rate, Stripe's 1.5% stablecoin fee, or Wise-style FX margins) and use Split Mode purely as a viral acquisition surface for Fund Mode.

**FundWise Fund Mode** is where the real money is, and the model to copy is Morpho + Wealthfront, not Splitwise. Morpho Vaults V2 cap performance fees at **50% of yield generated** plus a management fee of up to **5% of TVL** for vault curators. Wealthfront's entire business model is a yield spread — they earn approximately 0.40% per dollar of AUM by passing along part of the federal funds rate to users; their 2023 revenue was $184M on $55B AUM (117% YoY growth) almost entirely from this spread, per Sacra. Robinhood Gold charges $5/month subscription PLUS earns the spread between what program banks pay (currently passing 3.35% APY to Gold members on uninvested cash, per Robinhood as of Feb 11, 2026). For Fund Mode running on Meteora/sUSD where gross yields range from 4–5% (sUSD T-bill backing per Solayer/OpenEden) to 5–9% on Kamino USDC and into double digits in dynamic vaults, **a 10–20% performance fee on yield (effectively a 0.4–1.0% spread on a 5% gross APY) is well within market norms** and would not alienate users who currently get 0% on Splitwise balances or Venmo balances.

**Fundy Bot** has three monetization vectors layered on top of the Bot. (a) **Per-transaction fee on agent-executed payments** of 25–50 bps, similar to how Phantom monetizes wallet swaps (0.85%) and gasless mobile swaps (1.5% all-in). (b) **B2B Telegram-group SaaS**: $5–15/month subscription for treasurer features in friend groups, DAOs, or small businesses. (c) **AI-agent infrastructure margin**: when Fundy executes a Zerion CLI call on behalf of the user, FundLabs can take a small markup on the underlying $0.01/call x402 fee — the standard arbitrage every "agent toolbelt" company is building right now. Catena Labs ($18M from a16z crypto, May 2025), Skyfire ($9.5M total — $8.5M seed in August 2024 from Neuberger Berman, Brevan Howard Digital, DRW VC, Inception Capital, Arrington, Circle, Gemini, Ripple plus a $1M October 2024 strategic add from Coinbase Ventures and a16z CSX), and Payman ($13.8M from Visa + Coinbase Ventures) all share variants of this thesis.

**Receipt Endpoint** is the highest-leverage product per LOC of code, and where the agent-economy thesis lives. Pricing benchmarks: Zerion charges **exactly $0.01 per request via x402** (Abi Dharshan, Zerion API Product Lead: "Same portfolio, positions, and PnL data that powers the Zerion app, is now available to any agent on Base for a cent per call… The flat pricing gives agents a clear budget constraint, so they can reason about the marginal cost before making requests"). Coinbase's hosted x402 facilitator gives 1,000 free transactions/month then **$0.001/transaction**. OpenAI charges per token, not per call. Stripe's MPP integration uses an example in its docs that "requires 0.01 USD, paid in pathUSD, per request" — same $0.01 reference price. The right pricing for a structured-receipt + IPFS-archive endpoint is **$0.005–$0.02 per receipt** (premium over raw data because you're delivering compliance/audit value, not a data lookup), with volume tiers cascading down for enterprises and a free tier of ~100 receipts/month to seed agent adoption. The market is real: per the Solana Foundation, x402 has processed "35M+ transactions and $10M+ volumes" on Solana since summer 2025; Sherlock cites the broader cross-chain figure at "over 119 million transactions on Base and 35 million on Solana, handles roughly $600 million in annualized volume" through March 2026 — at zero protocol fees, so the unit economics work for the picks-and-shovels layer.

### 2. Comparable benchmarks

| Company | What they do | Monetization | Key metric |
|---|---|---|---|
| Splitwise | Expense splitting | Freemium $39.99/yr Pro + ads + fintech referral | ~$25M+ estimated ARR (Vizologi/businessmodelcanvastemplate.com); raised $20M Series A from Insight Partners 2021 |
| Safe (Gnosis) | Multisig | Community-aligned swap fees (35bp/15bp tiers) — first revenue stream activated only Q3 2024 | $1.7M annualized fees in Q3'24, $72B+ assets in Safes (Messari); SAFE token after years free |
| Squads | Solana multisig | Pro tier subscription + Fee Relayer (gasless), virtual bank accounts via Grid; no token at launch | $10B+ assets secured, $3B+ stablecoin transfers processed; raised $5.7M led by Placeholder; explicit philosophy: "Build infrastructure people have to use, not speculate on" |
| Phantom | Solana wallet | 0.85% in-app swap fee + 1.5% gasless + perp builder fees; **no token** | ~$17M revenue April 2025 alone (AltcoinGordon/blockchain.news); ~$550M cumulative revenue (DefiLlama); $150M Series C from Sequoia/Paradigm/a16z January 2025 |
| Coinshift | Crypto treasury mgmt | Fixed annual subscription tiers (free starter, paid for multi-entity/GAAP/IFRS); ERP integrations | $1B+ assets managed, $68.2M+ payouts processed |
| Zerion | Wallet portfolio API | Tiered: $0 dev → $499/mo for 1M requests → enterprise; also **$0.01/call via x402** for agents | Powers Privy, Kraken Wallet, Uniswap Wallet; "millions of API calls" from AI agents |
| Wealthfront | Robo + cash | ~0.40% yield spread on cash; 0.25% advisory on robo | $184M revenue 2023 (117% YoY, per Sacra); $55B AUM end-2023 |
| Robinhood Gold | Brokerage cash | $5/mo subscription + spread on cash sweep (currently 3.35% APY to Gold) | Public; tens of billions in sweep AUM |
| Bridge.xyz (Stripe) | Stablecoin infra | Earn on US Treasury reserves (3–4%) + payment orchestration fees + card interchange | Acquired by Stripe for $1.1B February 2025 |
| Stripe stablecoin | Payments | **1.5% per stablecoin transaction** (vs. on-chain cost ~$0.0002, per developer Sterling Crispin's calculation) | Live since October 2024; subscription support added October 2025 |
| Morpho | Lending protocol | Performance fees up to **50% of yield**, mgmt fee up to **5% of TVL** for curators; protocol fee switch up to 25% of borrower interest | $7.6B TVL, $43.5M treasury, $1.4B mkt cap; $16.9M annualized revenue (DefiLlama) |
| Meteora | Solana DEX | Swap fees on DAMM/DLMM; ~$16.9M annual revenue, $27.8M treasury (DefiLlama); MET token launched October 2025 | Backed by Coinbase Ventures, Jump, Alameda |
| Catena Labs | AI-native FI | Pre-revenue; protocol-level monetization TBD | $18M seed from a16z crypto led by Chris Dixon, May 20, 2025; co-founded by Circle co-founder Sean Neville |
| Skyfire | "Visa for AI agents" | Per-transaction fees on agent payment network (USDC/Base) | $8.5M Aug 2024 seed (Neuberger Berman, Brevan Howard, DRW, Circle, Ripple, Gemini, Arrington) + $1M Oct 2024 strategic from Coinbase Ventures + a16z CSX |
| Payman AI | Agent payment network | Take-rate on agent payouts | $13.8M total (Visa, Coinbase Ventures lead) |

### 3. Yield-spread monetization — what's defensible and what alienates users

The market has converged on **20–50% of yield** as the curator's cut for crypto-native products and **roughly 25–50% of yield** for consumer fintech, depending on whether the spread is disclosed:

- **Morpho** caps performance fees at 50% of yield generated, with management fees capped at 5% of TVL on Vaults V2; in practice top vaults charge 10–25% performance.
- **Wealthfront** keeps "the modest spread between what our partner banks pay us and what you are paid" — they pass roughly 75–85% of EFFR-driven yield to users and keep ~0.40% as gross margin (Wealthfront blog, "Why Is the Wealthfront Cash Account APY So High?").
- **Robinhood** pays Gold members 3.35% APY and keeps the spread as fee income from program banks; non-Gold users get ~1.5%.
- **Revolut** runs Flexible Cash Funds at "an ongoing charge calculated as a percentage of the value of the shares you hold in the money market fund," with the fee "automatically deducted from the daily returns" (Revolut Greece Flexible Cash Funds page).

For FundLabs, the right calibration is: **start at 10–15% performance fee on yield (so on a 5% gross sUSD/Meteora APY, users see 4.25–4.5% net, FundLabs earns ~0.50–0.75% spread); never charge a management fee at this stage** because friend groups are not institutional vaults and any "0.5% just for holding" framing is fatal in consumer fintech. Disclose the spread transparently — Wealthfront's "why our APY is so high" blog post is one of the most-cited pieces of fintech content because transparency itself is a differentiator.

### 4. API/endpoint pricing for AI agents — the emerging standard

The 2025–2026 standard is converging fast:

- **Zerion API: $0.01/call via x402 on Base** — the most-cited consumer benchmark.
- **Coinbase's hosted x402 facilitator: free for 1,000 txns/month, then $0.001/txn** — the floor (infrastructure pass-through).
- **OpenAI / Anthropic: per-token billing** — generally $3–15 per million input tokens for frontier models; not directly comparable.
- **MPP (Stripe + Tempo, March 2026)**: example in Stripe docs: "requires 0.01 USD, paid in pathUSD, per request."
- **HumanGrid AI x402 pricing in the wild: $0.01–$0.05/query** (lablab.ai catalog).
- **x402's whitepaper cites micropayment use cases at $0.10/audio clip, $0.10/legal-research document, $0.25/article**.

For Receipt Endpoint, **$0.005 for a basic receipt and $0.02 for a structured + IPFS-archived audit-trail receipt** is the right pricing — premium over Zerion because of structured output + permanent storage + tax/compliance value, but cheap enough that an agent doing 1,000 transactions a month spends only $5–20 on receipts. Volume tiers (e.g., $499/mo for 100k receipts in an enterprise plan, mirroring Zerion's pricing) round out the curve.

### 5. B2B angles and TAM

- **DAOs**: Per DeepDAO data cited by eco.com (Q1 2026), there are 13,000+ DAOs globally (6,000+ active) collectively controlling more than $26B in onchain treasuries, with the largest being Uniswap ($4.8B), Sky/MakerDAO ($3.9B), Optimism ($2.1B), Arbitrum ($1.7B), and Lido ($1.4B). DataIntelo pegs the dedicated "DAO Treasury Management" software market at $1.25B in 2024, growing to $5.38B by 2033 at 19.7% CAGR. Coinshift, the Ethereum-incumbent equivalent, manages $1B+ assets and has processed $68.2M+ in payouts using a fixed annual subscription model. **TAM for FundLabs in DAO treasury alone: ~$100M+ ARR by 2030** if it captures even 2% of the DAO treasury management market.
- **AI agent organizations**: Catena Labs, Skyfire, Payman, and Manufact (mcp-use, $6.3M from Peak XV) have collectively raised >$45M in 2024–2025 to serve this market. Per Gartner (cited via BlockEden, October 2025), "the agentic commerce market is projected to grow from $136 billion in 2025 to $1.7 trillion by 2030 at a 67% CAGR"; IDC separately forecasts total AI spending will reach $1.3 trillion by 2029 (31.9% YoY CAGR). Stripe ACP, Coinbase x402, Google AP2, and Anthropic MCP are racing to become the standard, which is bullish for picks-and-shovels infra like Receipt Endpoint.
- **Corporate expense management**: Brex, Ramp, and Pleo define this category; competing head-on is suicidal for a 2-person team. The realistic wedge is **stablecoin-native expense management for crypto-native companies and remote-first teams** — an order of magnitude smaller TAM but defensible (a few thousand crypto companies × $100–500/seat/month).

### 6. Freemium vs transaction fee vs yield spread — verdict

For a Solana-native, crypto-first startup competing on UX and aiming to grow fast, the empirical answer from the 2024–2025 landscape is:

**Tier 1 (primary): Yield spread on Fund Mode** — invisible to users, scales linearly with TVL, no per-action friction, copies the proven Wealthfront/Robinhood/Morpho playbook. This is the fundable revenue line at seed stage.

**Tier 2 (secondary): Per-call API fees on Receipt Endpoint** — small absolute dollars but very high quality revenue narrative for VCs (variable cost, scales with the entire agent economy, not just FundLabs users). This is what makes the deck pop.

**Tier 3 (long-tail): Settlement spread on FundWise (~0.1–0.3%) and B2B Fundy Bot subscriptions ($5–15/mo for groups)** — only after MAU + group counts justify it.

**Avoid** Splitwise-style consumer subscription as the primary line — it works only because Splitwise has 60%+ market share and 14 years of brand. A 2-person team with no brand cannot capture meaningful $39/yr subs against a free, open-source incumbent (Spliit, SplitPro, etc., already exist).

### 7. VC fundability — what to put on the deck

Per Crunchbase News, "Total global funding to VC-backed financial technology startups totaled $51.8 billion for the year [2025]… a fairly significant – 27% – increase from 2024's total of $40.8 billion raised," with deal count down 23% to 3,457 deals — meaning fewer, but larger checks. Crypto/blockchain saw the biggest deal sizes (Polymarket $2B, Kalshi $1B at $11B valuation, Kraken $800M at $20B, MGX→Binance $2B). For a hackathon-stage seed:

- **Median seed valuation 2025**: $14–17M post-money (Carta), with crypto/blockchain commanding the highest median multiples among fintech sub-sectors (Finro). AI/ML infrastructure: $4.6M median raise; fintech: $3.2M.
- **Required traction for seed**: $50K–$200K ARR or compelling user growth + retention; for Series A in fintech, $2–5M ARR is the modern bar (Carta).
- **Crypto-fintech comparables that raised seed**: Reflect (**$3.75M seed September 2025** from a16z crypto CSX with Solana Ventures, Equilibrium, BigBrain Holdings, Colosseum — won Radar Grand Champion); Hylo (**$1.5M seed August 2025** led by Robot Ventures with Solana Ventures, Colosseum, YTWO Ventures); Trepa (**$420K pre-seed summer 2025** led by Colosseum with Ignight Capital, The Balaji Fund); Skyfire ($9.5M total); Catena Labs ($18M).
- **Realistic FundLabs target post-Frontier**: If you win a top prize and Colosseum accelerator entry, you receive **$250K from Colosseum** on a SAFE with token warrants, can plausibly raise an additional $1–3M pre-seed bridge from typical Solana ecosystem leads (Solana Ventures, Multicoin, Robot Ventures, Big Brain, Borderless), and target $14–17M post-money once you have 5–10K Fund Mode TVL data points and a handful of Receipt Endpoint case studies.

### 8. Hackathon pitch angle for Colosseum Frontier judges

Per Colosseum's official Frontier announcement (April 6 – May 11, 2026), the prize structure has been simplified to: **$30,000 Grand Champion**, **$10,000 each to the next best 20 startups** ($200K total), **$10,000 University Award**, and **$10,000 Public Goods Award**, with "10+ winners… accepted into the program, and each will receive $250,000 in pre-seed funding." Sponsors include Coinbase, Privy, Metaplex, Reflect, Arcium, World, Raydium, and MoonPay. Frontier explicitly removed all bounty-based tracks to "simplify."

Matty Taylor's "How to Win a Colosseum Hackathon" essay (February 20, 2024) is explicit: "prizes will be awarded to teams who intend to build full-time and develop products with potentially viable business models (although, there will always be an award for the best public good)." Hackathons are "equally engineering competitions as they are business competitions." Five product principles listed:

1. "Build products that enable new markets that couldn't exist without crypto or improve existing markets by bringing them onchain"
2. "Build products that solve problems that affect you personally"
3. "Build products in markets where you have prior experience" (founder-market fit)
4. "Don't be afraid to build products that have been attempted before"
5. "Build wildly ambitious products"

The required pitch (≤3 minutes, Loom format) must cover team, product, why-you-built-it, **the potential market opportunity unlocked by your product**, **how you will get initial product usage**, demo, and the framing "explaining why it is destined to become the next breakout crypto product." Acceptance rate into Cohort 4 was **0.67% (11 of ~1,640 submissions)** per Colosseum's Cohort 4 announcement.

**Recommended FundLabs narrative arc** (in this exact order):
1. **Hook**: "Friend groups have tens of billions of idle balances on Splitwise/Venmo earning 0%. AI agents are about to spend trillions per year (Gartner projects agentic commerce growing from $136B in 2025 to $1.7T by 2030 at 67% CAGR, per BlockEden) with no receipts. We're building the rails for both, on Solana."
2. **Product 1 (FundWise)**: 30-second demo of Split Mode → Fund Mode flow. Mention nearly-live mainnet status. Position as the "hook."
3. **Product 2 (Fundy Bot)**: 30-second Telegram demo of natural-language expense logging + agent-executed payment.
4. **Product 3 (Receipt Endpoint)**: 30-second demo of an x402-paid endpoint returning structured receipt + IPFS hash. Emphasize this is the **infra layer for the agent economy** that other Colosseum cohort companies (MCPay, Corbits) will pay for.
5. **Business model**: "Three revenue lines, all live: 10% of Fund Mode yield, $0.01 per Receipt Endpoint call, 25 bps on Fundy Bot agent transactions. At 100K Fund Mode users averaging $500 TVL, that's $1M ARR from spread alone."
6. **Why us**: 2-person Berlin team with prior Solana shipping; team-product fit is real because you eat your own expense problem.
7. **Ask**: "We want Frontier accelerator + design partners from Squads, Privy, Meteora, Coinbase x402."

Past Colosseum Grand Champions weighted hard toward infra with a clear monetization story: **Reflect (Radar)** = stablecoin yield-spread mechanism; **TapeDrive (Breakout)** = data-storage pricing claimed at "1,400× cheaper than Solana's status quo"; **Unruggable (Cypherpunk)** = hardware sales; **Ore (Renaissance)** = mineable token economy. None of them won on a pure consumer-app pitch.

### 9. Token economics — don't, yet

Successful comparable infrastructure plays delayed or avoided tokens entirely:

- **Squads**: $10B+ AUM, no token at launch, explicit philosophy "Build infrastructure people have to use, not speculate on"; SQDS only began distribution after years of operations.
- **Safe (Gnosis)**: Token launched only after $72B+ assets in Safes, with the first DAO revenue stream activated in Q3 2024.
- **Phantom**: ~$550M cumulative revenue, $150M Series C in January 2025, **no token**.
- **Privy**: Acquired by Stripe on June 11, 2025 for an undisclosed amount; was last valued at $230M in March 2025 per Bitcoin Magazine, having raised $40M+ from Paradigm, Coinbase Ventures, and Ribbit Capital — without ever launching a token.
- **Coinshift**: $1B+ assets managed, no consumer token.

Failure modes from token-first:
- **OlympusDAO**: $4.4B peak market cap → 93%+ collapse; "Ponzi" Twitter polls; $150M of OHM liquidations in 30 days; treasury exploit for 30,000 OHM.
- Generic "DeFi 2.0" treasury-token forks that died in 2022.

A token at hackathon stage signals to VCs that you don't have a real revenue model. Reserve token-launch optionality for Series A+ when (a) you have $10M+ TVL or 100K MAU, (b) you have a clear utility (fee discount, governance over a real treasury), and (c) regulatory clarity has improved further (the GENIUS Act and EU MiCA make this easier than 2022).

### 10. Network effects and defensibility

The moat for FundLabs comes from three reinforcing loops:

1. **Group-level network effects (FundWise)**: Once a friend group adopts Fund Mode and locks in a multisig with shared yield, switching costs are nontrivial — Splitwise has demonstrated 14 years of stickiness on far weaker network effects (no shared treasury). Each Split Mode user pulls in 4–8 contacts on average.
2. **Distribution + data flywheel (Fundy Bot)**: Telegram-native distribution gives access to existing crypto-native groups. Each transaction logged trains the personal-finance model, creating a data moat over time.
3. **Agent-economy lock-in (Receipt Endpoint)**: As agents adopt your receipt format and IPFS archive, switching means re-auditing thousands of past transactions. This is the strongest moat structurally — it mirrors why Stripe's billing data and Plaid's connection data are sticky.

Monetization reinforces defensibility because the yield-spread model only works at scale (more TVL → cheaper Meteora rates → better net yield → better retention), and the per-call API model has classic SaaS expansion-revenue dynamics (an agent that integrates Receipt Endpoint will use it on 100% of transactions, not 30%).

## Recommendations

**Stage 1 — Hackathon (now → May 11, 2026)**:
- Lock in three live revenue meters even if revenue is trivial: a 10% performance fee on Fund Mode yield, $0.01 per Receipt Endpoint call, 25 bps on Fundy Bot executed transactions. **Demonstrating revenue lines exist > absolute revenue dollars** at this stage.
- Get 3–5 paying Receipt Endpoint design partners before May 11 (target: Latinum, Corbits, MCPay, Skyfire, any agent-tooling company in the lablab.ai x402 catalog). Even free pilots that produce quotes for the deck are gold.
- Pitch deck must feature Reflect / TapeDrive / Unruggable economics framing as comparables — Colosseum loves precedent in its own portfolio.

**Stage 2 — Accelerator (June–August 2026, conditional on win)**:
- Use the $250K Colosseum check + 8 weeks (first 2 in-person at the SF office) to prove out unit economics on Fund Mode at $1M cumulative TVL.
- Onboard one DAO design partner (start with a Solana Cohort 4 alumnus or a Bonk DAO sub-treasury — Bonk DAO is a Colosseum LP, having committed $500K to the fund).
- Build the B2B Fundy Bot subscription tier ($15/group/month for 10+ member groups). Don't release publicly; use as a wedge for warm enterprise conversations.

**Stage 3 — Pre-seed/Seed bridge (Q4 2026)**:
- Target $1.5–3M raise at $14–20M post (median 2025 fintech seed valuations) once you hit any of: $5M Fund Mode TVL, 10K MAU, $5K MRR from Receipt Endpoint, or a marquee enterprise design partner.
- Target investors: Solana Ventures (ecosystem fit), Robot Ventures (backed Hylo), a16z crypto CSX (backed Reflect, Catena, Skyfire), Coinbase Ventures (x402-aligned), Multicoin (Solana thesis), Pillar VC (backed Catena), Borderless Capital.

**Benchmarks that would change the strategy**:
- If Receipt Endpoint hits >$10K MRR within 90 days of mainnet, **flip the priority** — lead with Receipt Endpoint as the wedge product and treat FundWise as the consumer demo. This is the "agent infra company" narrative.
- If Fund Mode TVL grows >40% MoM for 3 consecutive months, **raise faster and bigger** ($5–10M seed); the Wealthfront/Revolut consumer-fintech path is open.
- If neither metric hits by month 6, **B2B-pivot Fundy Bot** to crypto-company expense management ($100–500/seat/mo), competing only with Coinshift in the Solana-specific niche.
- If a major incumbent (Phantom, Squads, Backpack) ships a directly competing Fund Mode feature, **double down on Receipt Endpoint** which has no incumbent and a wider moat.

**Don't do**:
- Don't launch a token before Series A. The Squads/Phantom/Privy playbook is conclusively superior to OlympusDAO/DeFi-2.0 forks for this category.
- Don't compete on price with Splitwise's free tier. You will lose. Compete on yield and crypto-native UX.
- Don't try to be Brex/Ramp. You will lose. The 2-person team's right size is friend-groups + small DAOs + AI agents.

## Caveats

- Several monetization figures cited are estimates from third-party analysts (Vizologi, Sacra, Coinlaw, DefiLlama). Splitwise's $25M+ ARR is industry-extrapolated, not company-reported. Treat single-source revenue figures with care.
- The "$600M collectively raised by Solana hackathon alumni" figure circulates on Superteam regional pages but is not corroborated in Colosseum's own public stats; do not cite it in pitches as if it were an official Colosseum number.
- The agent-economy is moving very fast. x402, MPP (March 18, 2026 launch), Google AP2, and Stripe ACP launched within 12 months of each other; the standard that wins by 2027 is genuinely uncertain. Hedge by supporting at least x402 + MPP at launch.
- Token regulation in the EU under MiCA and in the US under the GENIUS Act is shifting; a Berlin-based team has an EU advantage on stablecoin payment rails, but should consult counsel before any token-distribution event.
- Several "future" claims (e.g., Gartner's $1.7T agentic commerce projection by 2030, IDC's $1.3T total AI spending by 2029) cited in industry sources use forward language and should be treated as projections, not facts.
- Conflict in source quality: Sherlock pegs x402 at "119M transactions on Base + 35M on Solana, $600M annualized" through March 2026; the Solana Foundation's own page cites "35M+ transactions and $10M+ volumes" through summer-2025-launch + a few months. The lower number is more conservative and probably more reliable for pitch use.
- Hylo's connection to Colosseum was initially via a pitch ("a year ago, our team pitched @colosseum"); it's an investee but specific hackathon-win provenance was not verifiable. Reflect (Radar Grand Champion), TapeDrive (Breakout Grand Champion), Ore (Renaissance Grand Champion), and Unruggable (Cypherpunk Grand Champion) are the four confirmed Colosseum-era Grand Champions.