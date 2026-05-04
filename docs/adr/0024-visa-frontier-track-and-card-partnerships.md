# Target the Visa Frontier track with KAST / Avici / Rain partnerships

FundWise will pitch the **Visa Frontier hackathon track** (Superteam Germany sidetrack on the Solana Frontier Hackathon, online April 6 – May 11, 2026; Germany-eligible only; 10,000 USDG prize pool; winners May 27, 2026; sponsor contact `@zCasee` on Telegram) with a "settle → spend" narrative. Partner cards bridge settled USDC into Visa-rail spend. This commits the team to a specific submission framing and to opening partner conversations with named companies.

Public listing: https://superteam.fun/earn/listing/visa-frontier-hackathon-track

## Decisions

### Frontier framing is "USDC-on-Solana group settlement → Visa spend"

- Lead the submission with Split Mode + USDC mainnet settlement (the locked story per ADR-0021).
- Show a credible bridge from settled USDC to a Visa-network card via one of the partners below.
- Track gives access to Visa SMEs and includes Visa staff on the panel — judging is on **payments fit**, not a fixed Visa Direct or specific-SDK integration. There is no mandatory SDK to wire in.

### Partner shortlist

**KAST (kast.xyz)** — stablecoin Visa debit card on Solana / Ethereum / Polygon / Arbitrum / Tron, USDC / USDT / USDe funded, ex-Circle leadership, live "Solana Card" tier with staking rewards, Apple/Google Pay.

- FundWise plug-in: post-Settlement, route a payer's USDC to their KAST-funded address so the same balance is spendable at Visa merchants. Lightest wedge is a deep-link / "Top up KAST with this USDC" CTA on the Receipt page.
- Hackathon-grade path: KAST has no public partner API today. Realistic integration is a deposit-address handoff plus co-marketing intro via Superteam. **Narrative + UX partner, not an SDK dependency.**

**Avici (avici.money)** — self-custodial Solana neobank with a Visa debit card funded exclusively by USDC; deposits on Solana / Ethereum / Polygon; mobile app live on Google Play.

- FundWise plug-in: identical pattern to KAST — settled USDC routes to the user's Avici-funded address for Visa spend. Self-custody framing aligns better with FundWise's wallet-first model and is a cleaner story for Frontier judges.
- Hackathon-grade path: also no public partner API surfaced. Reach out via the Avici app / site contact and Superteam Germany. **Narrative partner, not an SDK.**

**Rain (rain.xyz)** — enterprise card-issuing platform, native Solana support, settles with Visa daily in stablecoins, developer-facing API for both custodial and non-custodial wallets.

- FundWise plug-in: of all the cards listed, Rain is the only one with a credible "wire it up" path. FundWise could issue a virtual card scoped to a Group treasury for shared expenses.
- Hackathon-grade path: API access still requires a partner conversation, so v1 is **mock + design doc, not a live issue**. Rain is the **production path** for FundWise-branded Group cards post-hackathon.

**Reap (reap.global)** — USD/HKD Visa cards backed by stablecoin collateral, Circle / Solana / Visa partner. Same shape as Rain but more APAC-anchored. Reasonable backup if Rain doesn't reply.

### Explicitly out of scope

Skipped for hackathon scope, do not pursue:

- **Gnosis Pay** — EVM-only, doesn't fit the Solana narrative.
- **Crypto.com Card / Bitpanda Card** — closed consumer products, no partner-grade hackathon path.
- **Holyheld** — EVM-first, similar issue.

### Recommended Frontier pitch order

1. Lead with USDC-on-Solana group settlement (Split Mode story).
2. Show "settle → spend" handoff to KAST or Avici as the consumer wedge.
3. Name Rain as the production path for issuing FundWise-branded Group cards post-hackathon.

## Why this matters

- Locks a specific track and a specific partner shortlist instead of leaving the Visa pitch unframed.
- Avoids burning hackathon time integrating SDKs that none of the consumer-card partners actually offer.
- Names the realistic engineering wedge (Rain post-hackathon) so the team doesn't promise judges a card issue we can't deliver in two weeks.

## Cross-references

- ADR-0011 — USDC as the MVP settlement asset.
- ADR-0021 — Split Mode is the public Frontier story; Fund Mode is closed beta.
- `ROADMAP.md` Phase 3 — full Visa Frontier partner research brief lives there.
- `ROADMAP.md` Phase 5 — Visa-rail card partnerships in production.
