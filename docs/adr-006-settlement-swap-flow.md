---
title: ADR-006 — Settlement Flow: Swap-Based USDC Disbursement
status: DECIDED
decidedOn: 2026-04-26
authors: [fundwise-team, hermes-agent]
category: settlement
---

## Problem

How should FundWise convert user assets (SOL, SPL tokens) into USDC for debt settlement?

**Context:** Split Mode computes a simplified settlement graph (creditor → debtor). To settle:
1. Debtor pays into group treasury (original asset)
2. Treasury converts to USDC (via swap)
3. Treasury pays creditors in USDC

OR per-settlement direct: Debtor swaps directly to USDC and sends to creditor's USDC ATA.

We need to choose:
- Where swap executes (group treasury vs per-settlement individual)
- Which swap provider (single vs aggregator)
- Settlement transaction structure (single vs batched)
- Error handling and partial settlement policy

## Options Considered

| Option | Flow | Pros | Cons |
|--------|------|------|------|
| **Treasury-pool swap + batch payout** | All settlements batched → treasury swaps once → distribute USDC | Fewer swaps = lower fees; cleaner accounting | Requires treasury control; users wait for batch |
| **Individual debtor→creditor swap per edge** | Each settlement edge is a standalone swap+transfer to creditor | Immediate per-settlement autonomy; no treasury bottleneck | More transactions = more fees; UX fragmentation |
| **Zerion CLI orchestration** | Use zerion-cli to compute + execute multi-step bridges | CLI tooling quick to prototype | No Solana swap endpoint; unsuitable for direct settlement |
| **Anchor program in-program swap** | Smart contract calls Jupiter/LiFi via CPI | Trustless, audit trail on-chain | Extra program complexity; CPI size limits; not needed for MVP |

## Decision

**Per-settlement independent swap + transfer** — each settlement edge is executed as an atomic swap followed by USDC transfer to creditor.

### Why Per-Settlement Swap?

1. **Simplicity** — no treasury coordination needed. Settlement graph → execute each edge independently. Users can settle individually without waiting for others.
2. **Transparency** — each settlement has own transaction, eaiser to audit on Solscan.
3. **MVP scope** — avoids Treasury custody logic (already in Fund Mode). Split Mode focuses on pairwise settlement.
4. **Cost equivalent** — whether batching or individual, total swap volume identical; gas overhead negligible on Solana.
5. **Error isolation** — failed settlement edge doesn't block others; can retry independently.

### Why Not Treasury Pool?

- Adds complexity (Treasury PDA authority, multisig for Fund Mode interference)
- Waiting for all debtors to deposit before single swap introduces coordination delay
- Out of scope for Split Mode primary path

### Swap Provider Choice (see ADR-005)

Default to **LiFi** with automatic **Jupiter fallback**. Reasons documented in ADR-005.

## Settlement Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Split Mode Settlement Graph (computed front-end)            │
│  e.g. Alice owes Bob 5 USDC                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Settlement Execution (per edge)                             │
│   1. User clicks "Settle" for edge (debtor → creditor)     │
│   2. Wallet prompts: approve swap + transfer               │
│   3. SwapService.getBestRouteInfo()                         │
│      → LiFi quote (preferred)                               │
│      → if fails, Jupiter quote (fallback)                   │
│   4. User confirms rate + fee                               │
│   5. executeSettlementSwap()                                │
│      - Execute swap (SOL/token → USDC)                       │
│      - Record tx signature + provider used                  │
│      - Transfer USDC from debtor to creditor ATA            │
│   6. Persist Settlement record to Supabase                  │
│   7. Show receipt with Solscan link                         │
└─────────────────────────────────────────────────────────────┘
```

**Transaction sequence per settlement edge:**

1. **Quote** (off-chain): Get swap quote (SOL→USDC or SPL→USDC)
2. **Execute swap** (on-chain): Swap executed via chosen provider
3. **Transfer** (on-chain): `spl-token::transfer` from debtor's USDC ATA → creditor's USDC ATA (**OR** swap sends directly to creditor ATA as `toTokenAccount`)

We chose **direct swap to creditor ATA** (option 3 in `lib/swaps/SwapContext`). This is cheaper: single transaction vs swap+transfer.

### Atomicity & Partial Settlement

- **Atomic per-settlement**: swap execution and USDC delivery are in the same transaction (Jupiter/LiFi `toTokenAccount` param is the creditor ATA).
- **Partial failure**: If swap fails (slippage, no route), settlement edge marked `failed` and user may retry with adjusted slippage.
- **No batching**: Each edge independent; partial successes recorded individually.

## Data Model Changes

**`settlements` table** (existing):
```sql
ALTER TABLE settlements ADD COLUMN swap_provider TEXT; -- 'lifi' | 'jupiter'
ALTER TABLE settlements ADD COLUMN swap_tx_signature TEXT;
ALTER TABLE settlements ADD COLUMN swap_out_amount_min BIGINT;  -- guaranteed USDC
ALTER TABLE settlements ADD COLUMN swap_fee_bps INTEGER;
ALTER TABLE settlements ADD COLUMN swap_route_summary TEXT;
ALTER TABLE settlements ADD COLUMN swap_executed_at TIMESTAMPTZ;
```

These fields populate after successful swap. Receipt page displays:
- Amount settled (USDC)
- Fee paid (bps + USD equivalent)
- Provider used (LiFi or Jupiter)
- Transaction link (Solscan)
- Route summary (e.g. "SOL → USDC via Jupiter (Raydium+Orca)")

## Error Handling

See `lib/swaps/swap-provider.ts` for SwapErrorCode enum and retry policy.

**User-facing errors mapped to messages:**

| SwapErrorCode | Display Message | Action |
|---------------|----------------|--------|
| `INSUFFICIENT_BALANCE` | "Insufficient SOL/token balance to cover swap." | User tops up wallet |
| `INSUFFICIENT_GAS` | "Not enough SOL for transaction fees (~0.0005 SOL)." | User adds SOL |
| `TOKEN_NOT_SUPPORTED` | "Token not supported for swap. Try a different asset." | Choose different fromAsset |
| `QUOTE_RATE_LIMIT` | "Aggregator busy. Retrying..." | Auto-retry with backoff |
| `EXECUTE_SLIPPAGE` | "Price moved beyond slippage tolerance. Try again or increase tolerance." | User confirms retry with higher slippage |
| `QUOTE_PRICE_IMPACT_HIGH` | "Price impact too high (X%). Consider splitting into smaller amounts." | User reduces amount |

## Monitoring & Observability

- Frontend logs: `console.log('[SwapService] …')` with provider, txHash, feeBps
- Supabase `settlements` audit columns track success/failure
- Optional: telemetry event `settlement.swap.{provider}`

## Consequences

### Positive

- Clean per-settlement atomicity — easy to reason about
- No treasury custody complexity for Split Mode
- Fallback path built-in → higher reliability
- Direct-to-creditor transfer = 1 tx vs 2

### Negative

- More on-chain transactions overall (one per settlement edge vs one batch)
- No treasury means no bulk-discount fee negotiation (not relevant for MVP)

### Risks

| Risk | Mitigation |
|------|------------|
| User rejects wallet transaction | Clear pre-swap confirmation UI with fee + rate displayed |
| Network congestion → swap timeout | Retry with exponential backoff; show "retrying" toast |
| Provider outage (LiFi down) | Automatic Jupiter fallback; health checks on page load |
| Slippage exceeded in volatile market | Allow user to adjust slippage up to 3% in settings; auto-retry with fresh quote |

## Status

DECIDED — implementation in `lib/swaps/`. Integration into settlement page pending frontend sign-off.
