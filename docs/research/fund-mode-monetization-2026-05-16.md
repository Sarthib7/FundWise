# Fund Mode monetization deep dive

**Author:** sarthib7
**Date:** 2026-05-16
**Purpose:** Pressure-test the existing `docs/monetization.md` pricing hypotheses against comparable products and identify what to confirm in the devnet beta before Fund Mode goes paid on mainnet.

This is a planning/reasoning document, not a forecast. Numbers cited for comparable products are approximate based on commonly published pricing as of the author's research window (early 2026); treat them as anchors, not facts to quote at investors. The devnet beta (Phase C of `docs/fund-mode-beta-checklist.md`) is the place to replace these anchors with real signal.

---

## What we're trying to figure out

Three questions, in priority order:

1. **Is $12/mo per Group the right subscription price** for the ICP we actually intend to serve at Summit Berlin?
2. **Are we missing pricing dimensions** (per-member tiering, AUM tiering, cross-chain spread, yield take) that competitors use and we don't?
3. **Where does the free tier wall hit** — at member count, at AUM, or at feature scope — and how does that affect conversion?

Everything below feeds into those three questions.

---

## Comparable products and rough pricing anchors

### Consumer bill-splitting (Split Mode neighborhood)

| Product | Free tier | Paid tier | Notes |
| --- | --- | --- | --- |
| Splitwise | Ad-supported, all core features | **Splitwise Pro ~$30/yr (~$2.50/mo)** per user | Adds receipt scan, charts, currency conversion, no ads. Per-user pricing, not per-group. |
| Tricount (Bunq) | Free, no ads | Acquired by Bunq; bundled into Bunq Premium | Was ad-supported; now a bank-bundled feature. |
| Settle Up | Free with ads | ~$2-4/mo Premium | Tiny user base relative to Splitwise. |
| Splid | Free | ~$5 one-time Pro | One-time pricing is rare and signals a small operation. |

**Read:** Consumer bill-splitting WTP is real but small — ~$30/yr per user is the proven ceiling. Conversion to paid is in the low single digits percent for free-tier users. None of these can move money; they only track ledgers.

### Crypto-native group treasury (Fund Mode neighborhood)

| Product | Free tier | Paid tier | Notes |
| --- | --- | --- | --- |
| Squads Protocol (the smart-contract layer FundWise builds on) | Free protocol | No protocol fees today | Squads monetizes via institutional services and infra products, not protocol take rate. |
| Squads (the app, app.squads.so) | Free app | Pro tier exists; ~$0-50+/mo range depending on workspace size | Targets DAOs and Solana orgs. Sophisticated multisig UX. |
| Coinshift / Multis | Free for individuals | **$50-200+/mo per workspace** for DAOs | EVM-first; treasury management with payment workflows, accounting integrations. |
| Den (denlabs.xyz) | Free tier | Paid tier ~$30-100/mo per workspace | EVM multisig + spend management. |
| Utopia | n/a | **$100-500/mo enterprise pricing** | Crypto payroll; DAO/SMB focus. |
| Parcel | n/a | Custom enterprise pricing | DAO payments orchestration. |
| Llama / Origami / Steakhouse | Service businesses, not SaaS | Consulting + custom contracts | Specialized DAO finance services. |

**Read:** The crypto group-treasury market splits cleanly between "DAO/SMB enterprise SaaS at $50-500/mo" and "free consumer wallet with multisig features." There's no consumer-tier $10-20/mo product in this space today. **Fund Mode is targeting an empty middle.**

### Personal finance subscriptions (Fundy companion neighborhood)

| Product | Pricing | Notes |
| --- | --- | --- |
| Lunch Money | ~$10/mo or ~$80/yr | Loyal indie audience; manual-categorization-friendly. |
| YNAB | **~$15/mo or $109/yr** | Premium personal-finance flagship; strong retention. |
| Copilot | ~$13/mo or $95/yr | Mac/iOS premium personal finance. |
| Monarch Money | ~$15/mo or $100/yr | Mint replacement. |
| Rocket Money | Free + paid features $3-12/mo (sliding) | Subscription-cancelation focus. |
| Mint (Intuit, discontinued) | Free, ad-supported | Discontinued 2024 — proves "free ad-supported" wasn't durable. |

**Read:** Personal-finance subscriptions cluster around **$10-15/mo or $80-110/yr**. Annual prepay always discounts to ~$8-9/mo equivalent. The $30/yr Splitwise model is the floor; YNAB at $109/yr is the ceiling for a high-value tool. **Fundy premium can confidently price at $9-12/mo / $80-100/yr.**

### Consumer fintech tier benchmarks (subscription willingness-to-pay context)

| Product | Lowest paid tier |
| --- | --- |
| Revolut Premium | ~€8-10/mo |
| Wise (transfer-fee based) | n/a — no subscription tier |
| Monzo Plus | ~£5-7/mo |
| N26 Smart | ~€5/mo |
| Apple One | $19-32/mo (bundle) |

**Read:** European consumer-fintech subscriptions cluster around **€5-10/mo**. That's the comfort zone for "I pay this every month and don't think about it." Anything above €15/mo gets pushback in consumer space; pushes you into "tool I use for work" framing.

### Yield-bearing crypto products (Treasury yield model)

| Product | Performance fee on yield | Notes |
| --- | --- | --- |
| Yearn Finance | 10-20% on yield generated, 0-2% management | Vault-dependent. |
| Lido Staking | 10% on staking rewards | Take rate goes to node operators + DAO treasury. |
| Marinade Finance | ~6-7% on staking rewards | Solana liquid staking. |
| Wealthfront / Betterment (web2 robo) | 0.25% on AUM, no performance fee | Different model — AUM not yield. |
| Compound / Aave | 0 (protocols); UIs may take spread | DeFi lending protocols are free; aggregators charge. |
| Meteora (DEX/yield aggregator) | Pool-dependent; LP fees, no subscription | What FundWise would integrate with. |

**Read:** Crypto yield-take of **10-20% of yield generated** is the established consumer pattern. 30% is the upper bound (some structured products). 5% is generous and probably leaves money on the table.

---

## Stress-test of current FundWise prices

The current `docs/monetization.md` proposes:

1. Split Mode free (forever)
2. Fund Mode creation fee: $3-5 flat at Treasury init
3. Fund Mode subscription: $12/mo per Group beyond a 5-member / $1k-AUM free tier
4. Meteora yield spread: 10-20% of yield (post-launch)
5. Fundy premium: $8-12/mo

### What's right

- **Split Mode free:** matches the market (Splitwise is the floor, free is the only competitive answer). Locked correctly. Keep.
- **Creation fee at $3-5:** sized appropriately for crypto-native users. In consumer web2 SaaS, account creation fees are unusual and would feel hostile. In crypto, they're normal (account rent, mint fees, registration fees) and they signal commitment. $3-5 is small enough to not deter, large enough to actually settle on a "yes, we're doing this pool" decision. Keep.
- **Yield take at 10-20%:** correctly anchored. 20% would be the right starting point if/when Meteora ships — it's the Yearn standard. Below 10% is generous; above 25% gets pushback.
- **Fundy premium at $8-12:** correctly anchored — sits squarely in the personal-finance subscription zone. Default to **$9/mo or $79/yr** to match the YNAB-Lunch Money corridor. Keep.

### What's worth adjusting

- **$12/mo Fund Mode subscription is probably too low for the durable-group cohort and too high for the trip-pool cohort.** Two problems baked together:
  - A 30-member DAO Treasury moving $50k+ pays $12/mo for the same product surface as a 4-friend trip pool moving $300. The DAO would happily pay $50, the trip pool will balk at $12.
  - One number that has to do both jobs leaves margin on the table at the top and creates friction at the bottom.

- **The free tier wall ("5 members or $1k AUM") collapses the wrong way.** On mainnet:
  - A trip pool of 4 friends with $2k stays free forever — they never see the wall.
  - A DAO with 8 contributors and $20k AUM hits the wall on day 1 — but $12/mo will feel cheap, not load-bearing.
  - The wall sorts users by AUM, which is approximately the right signal, but the price beyond the wall is undifferentiated.

- **No pricing dimension for cross-chain participation (Phase 2).** When CCTP/LiFi ships, every cross-chain Member contribution flows through FundWise's routing. That's a natural FX/swap spread opportunity (5-30 bps on inbound conversion). Not in the current doc. **This is a real revenue line we're leaving uncaptured.**

- **No bundled "FundWise + Fundy" pricing.** If Fundy is the acquisition channel for Fund Mode (it should be — Telegram is where Groups already exist), and both are paid surfaces, there should be a bundled tier that's cheaper than buying them separately. Notion + Calendar play.

### What's missing

- **Annual prepay discount.** Every comparable product offers ~20% off for annual. Not in the doc.
- **DAO/Enterprise tier.** No "we use this for our 20-member DAO with $100k" pricing. Pricing implicitly tops out at $12/mo.
- **Per-member vs per-Group rationale.** The doc charges per Group, which is right for friend-group use, but unstated. Should be explicit.
- **Where the money is collected from.** Subscription out of the Treasury? Out of the creator's wallet? Both options have UX consequences (Treasury feels shared, creator's wallet feels personal). Not specified.

---

## Pricing strategy direction — the four paths

The choices above are tactical. The strategic question is which posture FundWise takes:

### Path A — Premium SaaS for durable Groups *(current doc's direction, lightly)*

- Frame: "FundWise is the Notion of group money."
- Subscription is the primary revenue line.
- Creation fee gates Fund Mode setup intent.
- Free tier is intentionally restrictive (small pools or low AUM).
- Price points: **$5 creation fee, $15-19/mo per Group, $79/yr annual**, DAO tier at $49/mo for >$50k AUM.
- Pros: predictable revenue, healthy per-Group economics.
- Cons: top of funnel suffers; high-WTP cohort feels overcharged at $19 while low-WTP cohort balks.

### Path B — Freemium with broad free tier

- Frame: "FundWise is free, you can pay if you want more."
- Free tier is generous (5+ Groups, any AUM, all core features).
- Paid tier adds tax advisory, analytics, integrations.
- Price point: **$7-9/mo, $59/yr annual.**
- Pros: maximum acquisition.
- Cons: revenue density is low; need 10x more users to hit the same ARR.

### Path C — Usage-based take rate

- Frame: "FundWise is free; we take a small cut of money moving through Treasuries."
- No subscription.
- Creation fee at $5.
- **0.5% take on inbound Contributions and 0.5% on outbound Reimbursements.** Capped per transaction.
- Yield take of 20% if yield routing is enabled.
- Pros: aligned incentives — FundWise earns when Groups actually use the product.
- Cons: feels like a tax on group money; one bad month for the Group is a bad month for FundWise; harder to forecast.

### Path D — Yield-only

- Frame: "FundWise is free forever for the app. We earn when your Treasury earns."
- No subscription, no creation fee, no take rate.
- Defers all monetization until Meteora ships and Treasuries actually generate yield.
- **20-30% of yield generated.**
- Pros: lowest-friction acquisition.
- Cons: no revenue for 6-12 months post-launch; vulnerable to yield market conditions; only works for Groups that opt in to yield.

### Recommendation: a refined Path A with a Path C kicker

- Keep subscription as the primary line **(Path A)** because the cohort that opens a Fund Mode Group is high-intent and durable. Free will not capture the value FundWise adds.
- Add a cross-chain spread on Phase 2 inbound conversion **(Path C-style usage take)** because that revenue is genuinely "earned" by routing infrastructure, doesn't feel like a tax on group money, and shows up only when CCTP/LiFi flows route through us. 10-25 bps.
- Add a yield take **(Path D-style)** as a separate optional line when Meteora ships. 20% standard.

Pricing recommendation, with confidence levels:

| Surface | Price | Confidence |
| --- | --- | --- |
| Split Mode | Free | **High** — locked. |
| Fund Mode creation fee | **$5 flat** (in USDC) at Treasury init | **High** — anchor-tested. Beta should confirm acceptance rate. |
| Fund Mode subscription (Standard) | **$15/mo or $129/yr** per Group; free tier up to 4 members + $500 AUM | **Medium** — current $12 is plausible but probably leaves margin. |
| Fund Mode subscription (DAO/Pro) | **$49/mo or $399/yr** per Group when AUM ≥ $10k OR members ≥ 10 | **Medium** — untested in this market, but matches consumer-DAO-tool pricing range. |
| Cross-chain inbound spread (Phase 2) | **10-25 bps on CCTP/LI.FI-routed inbound conversion** | **Low-Medium** — depends on partner take rates; we add markup. |
| Yield routing fee (post-Meteora) | **20% of yield generated** on Treasury USDC | **Medium** — anchors to Yearn standard. |
| Fundy premium | **$9/mo or $79/yr** per user | **High** — sits in the personal-finance subscription corridor. |
| FundWise + Fundy bundle | **$19/mo or $169/yr** (saves ~30%) | **Low** — proposal only. Depends on Fundy launching. |

---

## What the beta needs to confirm

The devnet beta is the controlled environment for replacing these anchors with real signal. Three measurements matter most:

1. **Creation fee acceptance** — at $5 USD-equivalent, what % of beta users complete Treasury init when prompted? What % opt out?
2. **Subscription WTP for the durable cohort** — among beta groups that have run ≥1 reimbursement, what % say yes to $15/mo? $19/mo? $25/mo? Use thumbs up/down on a non-blocking banner; collect open-text on "what would change your mind."
3. **Free-tier wall placement** — at member count 4 vs 6, at AUM $500 vs $1k vs $2k, where does abandon-vs-continue split most cleanly? This is the most expensive signal to get wrong on mainnet, so beta should test 2-3 wall placements behind a feature flag.

Secondary signals worth catching, but not load-bearing for the launch decision:

- Exit-survey pricing-fairness rating (1-5) — useful trend signal but biased toward people leaving (so it's a complaint pool).
- "Would you pay for tax advisory?" prompt to feed Fundy pricing.
- "Would you opt into yield routing if it took 20%?" prompt for the Meteora line.

Output: `docs/monetization-beta-findings.md` (per the existing checklist) replacing the anchors here with measured numbers before any real billing flips on. If the beta produces fewer than 10 paid-intent signals across these dimensions, treat the launch pricing as a hypothesis and ship with a "pricing in beta, will be locked at $X by Y date" banner — not as finalized.

---

## What this does not address (intentional)

- **Pricing currency.** Charging in USDC is correct (matches the product), but pricing-display in USD is also correct (consumer comfort). The doc should say "$5 USD equivalent, charged in USDC at the spot rate at checkout." Not in scope here.
- **Tax treatment of subscription revenue.** Outside this doc.
- **VAT / EU pricing compliance.** Outside this doc; revisit before EU billing flips on.
- **Refund policy.** Standard SaaS 14-day refund is fine; not a pricing-strategy question.
- **Card / IBAN top-up margin (Phase 3).** Partner-dependent; revisit when MoonPay (card) and Bridge.xyz (SEPA/IBAN) integrations are real. Altitude was ruled out — it's a competing consumer-business neobank, not embeddable infra.
- **Receipt Endpoint API pricing** (FundLabs-level, not FundWise). Out of scope here.

---

## Open questions for the user

These need a decision before the ADR can be finalized:

1. **DAO/Pro tier — yes or no?** Single price simplifies the launch story; tiered captures more revenue from the high-WTP cohort. The risk of "no DAO tier" is leaving real money on the table; the risk of "yes DAO tier" is complicating the beta WTP signal because the wall placement matters more.
2. **Subscription charged from Treasury or from creator wallet?** Treasury feels shared (good for groups) but blocks groups whose Treasury is below $X; creator wallet is simpler but feels personal-cost.
3. **Annual vs monthly default at signup?** Defaulting to annual increases ARR per signup ~20-30%; defaulting to monthly maximizes top-of-funnel.
4. **Fundy bundle at launch or later?** If Fundy ships alongside Split Mode mainnet at Summit, the bundle could ship Day 1. Decision depends on Fundy launch readiness.
