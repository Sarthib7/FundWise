---
title: ADR-007 — Zerion API as Wallet Data Layer
status: DECIDED
decidedOn: 2026-04-26
authors: [fundwise-team, hermes-agent]
category: data
---

## Problem

FundWise needs to display user wallet information:
- Wallet address + balances (SOL, SPL tokens)
- Total portfolio value (USD)
- Transaction history (activity feed)
- Token prices + metadata (icons, symbols)

Building this in-house requires:
- Multiple RPC endpoints per chain (Solana + several EVM chains)
- Token metadata lookups (coingecko, custom lists)
- Price feeds (oracle integrations)
- Transaction parsing (decoding logs, instruction data)
- Multi-chain normalization (uniform UI across chains)

Should we build this ourselves, adopt a third-party API, or skip wallet data entirely?

## Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Build in-house** | Direct RPC + custom indexer | No vendor lock-in; fully customizable | High dev time; ongoing maintenance; oracle integration complex |
| **Jupiter-only** | Jupiter provides price data only | Already integrated for swaps, good SOL price data | No portfolio/balance data; EVM chain coverage missing |
| **LiFi only** | LiFi also focused on swap execution | Unified with swap layer | LiFi is swap execution, not wallet data provider |
| **Zerion API** | Zerion API read-only (wallet data layer) | Multi-chain (Solana+EVM), normalized schema, portfolio+positions+tx, production-grade | Vendor dependency; cost for high volume (but free tier covers demo) |
| **Covalent/Coingecko** | Alternative APIs | Good coverage | Covalent rate-limited, CG no transaction parsing |

## Decision

**Adopt Zerion API as the wallet data layer** for:
- Portfolio balances and total USD value
- Token positions (fungible + DeFi + NFT, though FundWise only uses fungible)
- Transaction history (parsed, human-readable)
- Chain and token metadata (icons, symbols, names)

**Do NOT use Zerion for swap execution** — stick with LiFi + Jupiter fallback.

## Why Zerion?

1. **Unified schema across chains** — Solana returns same JSON structure as Ethereum, Base, Arbitrum. No conditional logic by chain in UI.
2. **Production-readiness** — Used by Privy, Uniswap Wallet, Trust Wallet. Handles rate limits, caching, and supports 40+ chains.
3. **Free tier sufficient** — 2,000 requests/day (~60,000/month) on Developer plan ($0). Zerion also offers $2,500 in early-access credits for Solana API usage.
4. **Fast integration** — One client library (`zerion` npm package) + single endpoint pattern. Portfolio fetch: 1 request vs building 10+ custom RPC calls.
5. **Transaction parsing done** — Decoded operation types, human-readable descriptions, labels. Perfect for activity feed in FundWise.
6. **Token metadata included** — Logos, symbols, decimals — no separate asset registry needed.
7. **x402 pay-per-use alternative** — If subscription too limiting, can switch to $0.01/request model without API key setup.

## Cost Analysis

| Plan | Price | Requests/month |适合FundWise? |
|------|-------|----------------|-------------|
| Developer (free) | $0 | ~60K | ✅ MVP + demo (100 users × 600 req = 60K) |
| Builder | $149 | 250K | Future growth |
| x402 pay-per-use | ~$0.01/req | unlimited | Edge fallback if rate-limited |

**Recommendation:** Start with Developer free tier. If rate limits hit during demo, temporarily upgrade to Builder ($149/mo) — unlikely for hackathon timeframe.

## Integration Architecture

```
┌────────────────────┐
│   React Component  │  ← useZerionWallet() hook
└─────────┬──────────┘
          │ fetch('/api/zerion/portfolio?address=...')
          ▼
┌────────────────────┐
│ Next.js API Route  │  (app/api/zerion/*) — server-side only
│  (Node.js runtime) │  keeps ZERION_API_KEY secret
└─────────┬──────────┘
          │ Zerion SDK client
          ▼
┌────────────────────┐
│ Zerion API         │  https://api.zerion.io/v1/wallets/{addr}/portfolio
└────────────────────┘
```

**Why proxy through API routes?**
- `ZERION_API_KEY` must not leak to browser bundle. Server routes keep it safe.
- Allows server-side caching (revalidation) to stay within rate limits.
- Uniform error handling and response shaping.

## Files Added

| File | Purpose |
|------|---------|
| `lib/zerion/client.ts` | Zerion client singleton initialization (idempotent) |
| `lib/zerion/types.ts` | TypeScript facade: `FundWisePortfolio`, `FundWiseTransaction`, parse functions |
| `lib/zerion/wallet-service.ts` | Server-side service methods: `fetchPortfolio()`, `fetchTransactions()`, `getTokenBalance()` |
| `lib/zerion/use-zerion-wallet.ts` | React hook for client components (calls `/api/zerion/*`) |
| `lib/zerion/index.ts` | Barrel exports |
| `app/api/zerion/portfolio/route.ts` | Server endpoint: GET portfolio by address |
| `app/api/zerion/transactions/route.ts` | Server endpoint: GET transaction history |
| `components/zerion/portfolio-card.tsx` | Example UI component showing how to display portfolio |

## Configuration

```bash
# .env.local (server-side only — Next.js loads automatically)
ZERION_API_KEY=zk_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get key at: https://dashboard.zerion.io → API Keys → Create (free Developer tier)

## Data Model Impact

**New Supabase table?** Not needed. Portfolio data is ephemeral (derived from on-chain state). Do not store in Supabase to avoid staleness.

**Where to show:**
- Header: total portfolio value dropdown on wallet connect
- Profile page: detailed token breakdown, transaction history table
- Settlement page: show wallet's USDC balance before initiating swap (calls `getTokenBalance()` directly from service, no need for full portfolio fetch)

## Error Handling

`useZerionWallet()` returns `{ portfolio, loading, error }`. On error (rate limit, API down):
- Show "Portfolio temporarily unavailable" (non-blocking)
- Fallback: display wallet address truncated only, no balances
- Log to console for debugging

## Alternatives Considered (Rejected)

| Alternative | Reason for rejection |
|-------------|---------------------|
| **Solana RPC only** | Covers SOL balance only; no EVM chains; no token prices; no transaction parsing — would need 5+ additional services |
| **Covalent** | Different schema for Solana vs EVM; inconsistent with what you already use; rate limits tighter |
| **CoinGecko** | Price only; no balances, no tx history, no multi-chain wallet aggregation |
| **Build custom indexer** | Weeks of work, indexer maintenance, oracle price feeds — out of scope for hackathon |

## Consequences

### Positive
- Rapid integration: <1 day to working portfolio display
- Consistent multi-chain UI: same component handles SOL, ETH, USDC across chains
- Offloads maintenance: Zerion handles RPC outages, token metadata updates, chain additions

### Negative
- Vendor lock-in: switching away later requires rework of all wallet-data calls
- API cost: Free tier may not sustain viral growth (but you can migrate to self-hosted later)
- Rate-limit sensitivity: cache aggressively; avoid polling faster than 30s

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Zerion API rate limit exceeded | Low (free tier 2K/day) | Medium (portfolio shows error) | Cache results in Next.js (revalidate: 60); client-side debounce |
| ZERION_API_KEY leaks to client | Very low (server-only) | High (quota theft) | Never reference `process.env.ZERION_API_KEY` in any `'use client'` file |
| Zerion goes down | Low (high uptime SLA) | Medium (no portfolio display) | Show fallback UI "Portfolio temporarily unavailable" |
| Solana token not indexed by Zerion | Low (Jupiter-verified tokens only) | Low | Display "N/A" or hide unknown tokens gracefully |

## Status

DECIDED — implementation in `lib/zerion/`. API routes wired up in `app/api/zerion/`. Pending frontend integration into header/profile.
