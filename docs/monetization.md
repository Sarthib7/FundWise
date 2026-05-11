# FundWise Monetization Model

FundWise should keep Split Mode free at launch. The early product needs trust, repeat use, and easy sharing more than it needs a small fee on the exact moment a Member is trying to repay a friend.

This is also the competitive response. Shared-expense tracking is crowded, and several crypto-native bill splitters already exist. Charging the core Settlement loop too early would weaken the only acquisition loop that can make FundWise stand out: a Member shares a Settlement Request Link, the debtor signs the exact USDC Settlement, and the Group gets a verifiable Receipt.

FundLabs-level strategy adds two later revenue lines beyond the current FundWise app: Fundy as the paid personal-finance / group-chat agent, and Receipt Endpoint as a per-call API for agent-commerce receipts. Those lines belong in the company narrative, but they stay planned until the products exist.

## Decisions

- Split Mode Group creation, Expense tracking, Balances, Settlement Request Links, and normal USDC Settlements stay free for the first public launch.
- No FundWise Settlement fee ships in the hackathon demo or first mainnet Split Mode launch.
- Fund Mode is the first natural paid FundWise surface because it manages pooled Treasury workflows, approvals, history, and higher-intent Groups.
- Fund Mode adds a **flat creation fee** at Treasury init as the first paid surface. Charged at the high-intent moment, predictable, doesn't tax recurring movement. Beta tests on devnet with test-USDC; mainnet target is $3-$5 USD equivalent.
- Fund Mode adds a **monthly subscription** for pools beyond a free tier (5 members or $1k AUM). Mainnet target is $12/mo per active Group.
- **Yield routing via Meteora** is a planned later revenue line: FundWise takes a small spread on yield earned from idle Treasury USDC. Not in beta. Requires risk disclosures, withdrawal mechanics, and Treasury accounting before any rollout.
- The Fund Mode devnet beta is used to **test the monetization model itself**: creation fee acceptance, willingness-to-pay surveys, free-tier wall friction. Real billing only flips on after Fund Mode graduates to mainnet.
- Fundy is the second paid surface because it can own personal-finance automation, Telegram workflows, wallet-readiness support, reminders, premium analysis, and later tax guidance. Fundy ships alongside Split Mode mainnet launch (separate repository).
- Receipt Endpoint is a third planned FundLabs revenue line because agent-payment receipts can be priced per API call, but it is not a FundWise MVP revenue line.
- Top-up, card, IBAN, and partner-rail revenue should be treated as upside until a real provider integration exists.

## Candidate Revenue Lines

| Revenue line | Launch stance | Rationale |
| --- | --- | --- |
| Split Mode Settlement fee | Do not launch | Hurts acquisition and makes repayment feel taxed |
| Fund Mode creation fee | **First paid surface** | Charged at high-intent Treasury init moment; predictable; doesn't tax recurring movement |
| Fund Mode subscription | **Second paid surface** | Fits durable Groups, Treasuries, Proposals, and admin value |
| Fund Mode usage fee | Later / capped | A tiny Treasury or Proposal fee may work only after Groups already trust the product |
| Fund Mode yield spread via Meteora | Later / not in beta | Requires real yield integration, risk review, disclosures, and exit mechanics |
| Fundy premium | Preferred paid agent line | Users can pay for automation, reminders, wallet analysis, personal finance, and tax help without taxing friend repayment |
| Receipt Endpoint per-call API | Planned FundLabs line | Useful for agentic commerce only after structured Receipts and payment verification exist |
| Top-up / routing commission | Later partner line | Useful if LI.FI, card, bank, or Altitude-style rails become real onboarding surfaces |
| Card / payment-rail revenue share | Later partner line | Requires partner agreements; do not claim as shipped |

## Initial Pricing Hypotheses

- Split Mode: free forever for core Groups.
- Fund Mode creation fee: $3-$5 USD flat (in stablecoin) at Treasury init. Devnet beta tests acceptance with test-USDC.
- Fund Mode subscription: free tier up to 5 members + $1k AUM. Paid tier at $12 USD/mo per active Group beyond that. Devnet beta tests willingness-to-pay via non-blocking surveys before any real billing.
- Fundy premium: 8-12 USD per user per month for personal finance, reminders, wallet-readiness, and later tax-advisory workflows.
- Meteora yield spread: 10-20% of yield earned on idle Treasury USDC, after Fund Mode mainnet is stable and yield integration is reviewed.
- Partner top-up / card rails: 0.25%-1.00% effective revenue share only when a real provider integration exists.

## Devnet beta monetization tests

The Fund Mode devnet beta is the controlled environment for testing the pricing model before any mainnet billing exists. See `docs/fund-mode-beta-checklist.md` Phase C for the indexed work items. The questions we answer in beta:

1. **Creation fee acceptance rate** — what % of beta users complete Treasury init when prompted for a $3-$5 equivalent fee? What % opt out with the "skip for beta" button?
2. **Subscription willingness-to-pay** — when the in-app banner asks "Would you pay $12/mo for this pool?", what % say yes? What does the "no" cohort want changed?
3. **Free-tier wall friction** — when a pool hits 5 members or simulated $1k AUM and sees the upgrade screen, what's the abandon rate vs. continue-with-mock-checkout rate?
4. **Exit survey signal** — when a Member leaves, do they rate pricing fairness highly or low?

Output: `docs/monetization-beta-findings.md` updating these numbers before Fund Mode mainnet billing flips on.

## Conservative First-Year Scenario

This is a planning model, not a forecast.

| Assumption | Value |
| --- | ---: |
| Active free Split Mode Groups by year end | 500 |
| New Fund Mode Groups created in year 1 | 80 |
| Fund Mode creation fee (when charged) | 4 USD |
| Paid Fund Mode Groups (subscription) by year end | 50 |
| Fund Mode average monthly subscription price | 12 USD |
| Fundy premium users by year end | 100 |
| Fundy average monthly price | 8 USD |
| Monthly routed/top-up volume by year end | 20,000 USD |
| Effective routing/partner revenue | 0.5% |

Approximate annualized run-rate at year end:

- Fund Mode creation fees: 320 USD (one-time, 80 Groups × 4 USD)
- Fund Mode subscriptions: 7,200 USD ARR
- Fundy premium: 9,600 USD ARR
- Routing / partner revenue: 1,200 USD ARR
- Total conservative year-end ARR: ~18,300 USD

The model intentionally leaves Split Mode free so it can act as the acquisition loop for Fund Mode, Fundy, and future rails. Meteora yield spread is not modeled because it depends on Treasury AUM that doesn't exist yet — revisit after Fund Mode mainnet has been live 90 days.
