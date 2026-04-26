# Swap Infrastructure — Technical Summary

**Status:** Infrastructure complete, pending UI integration
**Branch:** `feat/responsiveness-signoff`
**PR:** # (open PR referenced in repo)

---

## What Was Built

### 1. Core Swap Layer (`lib/swaps/`)

```
lib/swaps/
├── swap-provider.ts    (base: abstract class, error codes, retry logic, validators)
├── lifi-provider.ts    (LiFi SDK integration with Jupiter under the hood)
├── jupiter-provider.ts (direct Jupiter Aggregator v2: /order + /execute)
├── swap-service.ts     (orchestrator: LiFi with retry → Jupiter fallback)
└── index.ts            (public exports)
```

**Key features:**
- `SwapProvider` abstract base — all providers implement `getQuote()` + `execute()`
- `SwapError` + `SwapErrorCode` enum — structured error mapping (15 error types)
- `withSwapRetry()` — exponential backoff for transient failures
- `validateQuote()` — price-impact guard (default ≤5%), zero-output rejection
- `SwapService.executeSettlementSwap()` — single entry point for settlement edges

### 2. LiFi Provider (`lifi-provider.ts`)

- Wraps `@lifi/sdk` (already in `package.json`)
- Single-chain and cross-chain routes (EVM ↔ Solana ready)
- Rate-limit handling (unauthenticated: 75/2h; authenticated: 100 RPM)
- Progress hooks exposed via `updateRouteHook` (logged to console; UI can subscribe)
- Fee extraction from step estimates
- `healthCheck()` endpoint for monitoring

### 3. Jupiter Fallback Provider (`jupiter-provider.ts`)

- Direct HTTP to `https://api.jup.ag/swap/v2/order` + `/execute`
- Base64-encoded VersionedTransaction handling
- Four routing engines compete by default: Metis, JupiterZ (RFQ), Dflow, OKX
- JupiterZ RFQ often 5-20 bps better for major pairs (SOL/USDC)
- `executeSigned()` variant for wallet-signed txs (cleaner separation of signing)
- `healthCheck()` with dummy wallet

### 4. Swap Service (`swap-service.ts`)

Orchestrates retry + fallback:

```typescript
const result = await getSwapService().executeSettlementSwap({
  walletPublicKey: user.publicKey,
  fromMint: SOL_MINT,
  toMint: USDC_MINT,
  fromAmount: '100000000', // 0.1 SOL in lamports
  toTokenAccount: creditorUSDCAddress,
  slippageBps: 100,        // 1%
});
```

**Flow:**
1. Validate inputs (mints non-zero, PublicKey checks)
2. Try LiFi (up to 2 attempts, fresh quote each)
   - If `validateQuote()` fails (price impact > threshold) → fall through to Jupiter immediately
   - If permanent error (no balance, token unsupported) → fall through immediately
3. If LiFi exhausts → Jupiter (up to 3 attempts)
4. Return standardized `SwapResult` (signature, feeBps, provider, routeSummary)

### 5. ADRs

- **ADR-005:** Swap Provider Selection & Fallback Strategy
  - Decision: LiFi primary (cross-chain ready), Jupiter fallback (uptime)
  - Rejected: Zerion-only (no Solana swap API), Jupiter-only (no cross-chain), no fallback (single point of failure)
  - Cost: Free tier sufficient for demo

- **ADR-006:** Settlement Flow — Swap-Based USDC Disbursement
  - Decision: per-settlement atomic swap + transfer directly to creditor ATA
  - Rejected: Treasury-pool batch swap (adds custody complexity, coordination delay)
  - Integration: `executeSettlementSwap()` called from settlement confirmation UI
  - Data model: `settlements` table extended with `swap_*` audit columns

---

## Configuration Required (Environment)

```bash
# .env.local
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-endpoint (Helius/QuickNode)
LIFI_API_KEY=          # optional but raises rate limit (100 RPM vs 75/2h)
JUPITER_API_KEY=       # optional free tier ok; Developer tier $25/mo for 10 RPS
```

**Note:** Both providers work without API keys (unauthenticated), but rate limits tight for demo. Recommend setting `JUPITER_API_KEY` (free Developer tier signup at portal.jup.ag) for smooth UX.

---

## Integration Checklist (Next Steps)

| Step | Owner | Status |
|------|-------|--------|
| 1. UI: Settlement confirmation page calls `SwapService` | Frontend | pending |
| 2. UI: Loading + error states (rate-limit toast, Jupiter fallback notice) | Frontend | pending |
| 3. UI: Receipt page displays `swap_provider`, `swap_tx_signature`, `swap_fee_bps` | Frontend | pending |
| 4. Backend: Deploy Supabase Edge Functions (blocked on `SUPABASE_SERVICE_ROLE_KEY`) | Backend | blocked |
| 5. Backend: Integrate Supabase Auth for RLS + member-scoped settlement writes | Backend | blocked |
| 6. QA: Devnet smoke test — swap 0.01 SOL → USDC, creditor ATA receive | QA | pending |
| 7. Security: Price-impact threshold + slippage confirmation dialog UX | Frontend | pending |

---

## Error-Handling UX (User Messages)

| SwapErrorCode | Display to User | Suggested Action |
|---------------|----------------|-----------------|
| `INSUFFICIENT_BALANCE` | "Not enough SOL/token to cover swap." | Wallet top-up |
| `INSUFFICIENT_GAS` | "Add ~0.001 SOL for network fees." | Add SOL |
| `TOKEN_NOT_SUPPORTED` | "Token not supported by swap aggregator." | Choose different asset |
| `QUOTE_RATE_LIMIT` | "Aggregator busy — retrying..." | Auto-retry visible |
| `EXECUTE_SLIPPAGE` | "Price moved beyond slippage tolerance. Increase to 2% retry?" | Offer slippage override |
| `QUOTE_PRICE_IMPACT_HIGH` | "Price impact >5%. Consider splitting into smaller amounts." | Reduce amount |

---

## Files Modified Summary

```
lib/swaps/swap-provider.ts       (new, 283 lines)
lib/swaps/lifi-provider.ts       (new, ~260 lines)
lib/swaps/jupiter-provider.ts    (new, ~360 lines)
lib/swaps/swap-service.ts        (new, ~260 lines)
lib/swaps/index.ts               (new, 50 lines)
docs/adr-005-swap-provider-selection.md   (new)
docs/adr-006-settlement-swap-flow.md       (new)
STATUS.md                        (updated — swap infra progress section)
```

---

## Testing Notes

**Manual devnet test plan:**
```bash
# 1. Airdrop SOL to test wallet
solana airdrop 2 <PUBLIC_KEY> -u devnet

# 2. Get USDC devnet ATA for creditor
#    (USDC devnet mint: Et3wv6t9... different from mainnet!)

# 3. Run swap via SwapService
node -e "
import { getSwapService, SOL_MINT, USDC_MINT } from './lib/swaps';
const svc = getSwapService();
svc.executeSettlementSwap({
  walletPublicKey: wallet.publicKey,
  fromMint: SOL_MINT,
  toMint: USDC_MINT,
  fromAmount: '100000000',
  toTokenAccount: 'CREDITOR_USDC_ADDRESS',
  slippageBps: 200,
}).then(console.log).catch(console.error);
"
```

⚠️ **Mainnet vs Devnet:** USDC mint differs!
- Mainnet: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Devnet: `Et3wv6t9...` (verify current devnet USDC mint via Solana CLI)

---

## Monorepo Tree

```
/home/tokisaki/FundWise/
├── lib/
│   └── swaps/                    ← NEW — entire swap infrastructure
├── docs/
│   ├── adr-005-swap-provider-selection.md   ← NEW
│   └── adr-006-settlement-swap-flow.md       ← NEW
├── STATUS.md                     ← UPDATED
├── package.json                  (already includes @lifi/sdk)
└── programs/
    └── fundwise/                 (Anchor program – earlier work)
```

---

## Questions for User

1. Should we also add a simple "Test Swap" page at `/dev/swap` for quick QA on devnet?
2. Should `SwapService` also handle SOL → SOL (no-op) or reject non-USDC destination?
3. Do you want to add provider-specific fee toggles (e.g. allow user to force Jupiter if LiFi quote slow)?
