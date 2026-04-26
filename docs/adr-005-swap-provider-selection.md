---
title: ADR-005 — Swap Provider Selection & Fallback Strategy
status: DECIDED
decidedOn: 2026-04-26
authors: [fundwise-team, hermes-agent]
category: settlement
---

## Problem

FundWise Split Mode requires users to settle debts by swapping assets (SOL, other SPL tokens) into USDC. We need a reliable swap infrastructure that:

1. Works on Solana mainnet-beta with best available price
2. Handles rate limits, service outages, and degraded aggregator performance
3. Supports future cross-chain expansion (EVM→Solana bridging)
4. Fits hackathon timeline (≤24h build)
5. Costs reasonable for demo (free tier sufficient)

## Options Considered

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Jupiter Direct** | Jupiter Aggregator API (`/order` + `/execute`) | Fast quotes, Solana-native, 0 platform fee, simple | EVM-only; no cross-chain; service-specific lock-in |
| **LiFi SDK** | `@lifi/sdk` unified API (wraps Jupiter internally) | Multi-chain, Jupiter under the hood, unified interface, good docs | Rate-limited free tier (75 req/2h unauthenticated), indirect layer |
| **Zerion API/CLI** | Zerion swap aggregation API | Multichain portfolio data + EVM swaps; portfolio tracking | No direct Solana swap endpoint (uses Jupiter internally only via Wallet product); CLI only for read-only |
| **Paraswap/0x** | EVM aggregators only | Excellent EVM pricing | No Solana support |

## Decision

**Primary:** LiFi SDK → **Fallback:** Jupiter Aggregator API direct

### Why LiFi Primary?

- **Cross-chain capability**: EVM→Solana bridge+swap in one call. Future-proofs for multichain groups.
- **Jupiter under the hood**: LiFi routes Solana swaps through Jupiter anyway, so we get Jupiter's liquidity with abstraction.
- **Unified API**: Same interface for all chains — simplifies codebase vs. mixing Zerion + Jupiter.
- **Production-ready**: Used by Uniswap Wallet, Trust Wallet, etc. Audited contracts.
- **Cost**: Free tier sufficient for demo (75 quotes/2h); add API key if needed ($25/mo Developer tier raises to 100 RPM).

### Why Jupiter Fallback?

- **Independence**: If LiFi service degraded or rate-limited, swap still works.
- **Performance**: Direct Jupiter faster (~2-3× quote latency) and rate-limited independently.
- **Cost**: Jupiter charges 0 platform fee; only pool trading fees (~0.05-0.3%).
- **Composability**: Simple HTTP + VersionedTx integration.

### Why Not Zerion?

- No public Solana swap execution API (only Jupiter-powered through their Wallet app).
- CLI is read-only (portfolio/transactions) not transaction-building.
- EVM swap support good, but we're Solana-first for this MVP.

## Implementation Summary

**Files added:**

- `lib/swaps/swap-provider.ts` — abstract base class, error codes, retry logic
- `lib/swaps/lifi-provider.ts` — LiFi SDK wrapper
- `lib/swaps/jupiter-provider.ts` — Jupiter API v2 client (`/order` + `/execute`)
- `lib/swaps/swap-service.ts` — orchestrator (LiFi with retry → Jupiter fallback)
- `lib/swaps/index.ts` — public exports

**Integration point:**

- Settlement flow in `app/groups/[id]/settlements/` calls `getSwapService().executeSettlementSwap(...)` after user confirms.

**Retry + fallback logic:**

- LiFi: up to 2 quote attempts (transient errors only), then Jupiter fallback
- Individual providers: exponential backoff within retryable errors
- Permanent errors (insufficient funds, token unsupported) fail fast

**Validation:**

- Price impact capped at 5% (configurable per call)
- Slippage default 1% (100 bps), settable
- Mint address validation preflight

**Monitoring:**

- Provider `healthCheck()` calls on app init (lightweight)
- Logging: route used, feeBps, txHash, provider fallback events

## Consequences

### Positive

- High availability: fallback ensures swaps work even if one aggregator down
- Cost-efficient: Jupiter free tier + LiFi free tier cover demo
- Future extensible: add Bridge provider (Wormhole/Mayan) easily via interface
- Clean separation: swap logic decoupled from UI components

### Negative

- Dual integration effort: ~2 provider implementations + orchestration
- Potential price divergence: LiFi may find better bridge+swap combo than Jupiter direct, but fallback still works
- Rate limit coordination: need to monitor both RPS limits

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LiFi rate limit (75/2h) | Fall back to Jupiter; consider paid tier for demo day |
| Jupiter API key required for production | Add JUPITER_API_KEY to Supabase secrets; free Developer tier sufficient ($25/mo) |
| Wallet signing integration complexity | ExecuteSigned pattern separates signing from execution; UI layer handles wallet adapter |
| Token decimal mismatches | All amounts in smallest units; validate against SPL token decimals before calling swap |

## Alternatives Considered (Rejected)

- **Zerion-only**: No direct Solana swap API; ruled out.
- **Jupiter-only**: No cross-chain EVM→Solana; tight coupling to one provider.
- **Zero fallback**: Single provider risk — too risky for hackathon demo live stage.

## Status

DECIDED — implementation in progress (in `lib/swaps/`). Pending integration into settlement page and UI feedback.
