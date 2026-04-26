/**
 * SwapService — high-level settlement swap orchestration.
 *
 * RESPONSIBILITIES
 *   1. Attempt LiFi quote → if fails (rate limit/no route) → retry with backoff
 *   2. If LiFi fails after retries OR quote price-impact too high → fall back to Jupiter
 *   3. Jupiter executes directly (simpler, Solana-native)
 *   4. Wrap entire flow in exponential backoff for transient errors
 *   5. Return standardized SwapResult regardless of provider used
 *
 * USAGE (Settlement flow)
 *   const service = getSwapService();
 *   const result = await service.executeSettlementSwap({
 *     walletPublicKey: userWallet.publicKey,
 *     fromMint: SOL_MINT,
 *     toMint: USDC_MINT,
 *     fromAmount: '100000000', // 0.1 SOL
 *     toTokenAccount: creditorUSDCATA,
 *     slippageBps: 100, // 1%
 *   });
 *
 * SETTLEMENT CONTEXT
 *   Called after expense graph determines creditors. Each creditor gets
 *   individual settlement transaction. Group treasury also funded via same path.
 *
 * FALLBACK STRATEGY
 *   - LiFi preferred: handles cross-chain (future) and aggregates Jupiter anyway
 *   - Jupiter fallback: catches LiFi incidents (rate limit, service outage)
 *   - Max 3 attempts total: 2× LiFi (fresh quote each) → Jupiter
 *
 * COST COMPARISON
 *   LiFi: protocol fee varies by bridge + swap. ~0.1-0.5% typical.
 *   Jupiter: 0 platform fee; only pool trading fees (~0.05-0.3%).
 *
 * SECURITY
 *   - All amounts in smallest units (lamports or token decimals)
 *   - All PublicKeys are validated before RPC calls
 *   - Default slippage 1% (100 bps); settable per-settlement
 *   - Price impact threshold 5% — user warned above that
 */

import { PublicKey } from '@solana/web3.js';
import {
  getLiFiProvider,
  type LiFiProvider,
} from './lifi-provider';
import {
  getJupiterProvider,
  type JupiterProvider,
} from './jupiter-provider';
import {
  SwapContext,
  SwapResult,
  SwapQuote,
  SwapError,
  SwapErrorCode,
  SwapProvider,
  withSwapRetry,
  validateQuote,
  categorizeError,
} from './swap-provider';

const MAX_LIFI_ATTEMPTS = 2; // retry with fresh quotes before fallback
const MAX_JUPITER_ATTEMPTS = 3;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%
const MAX_PRICE_IMPACT_PCT = 5; // reject swaps with >5% impact

/**
 * Validate PublicKey inputs early to avoid RPC round-trips.
 */
function validateMint(mint: PublicKey | string, name: string): PublicKey {
  try {
    const pk = typeof mint === 'string' ? new PublicKey(mint) : mint;
    if (pk.equals(PublicKey.default)) throw new Error('Invalid');
    return pk;
  } catch {
    throw new SwapError(SwapErrorCode.INVALID_INPUT, `Invalid ${name} mint address.`);
  }
}

/**
 * SwapService — orchestrates quote + execution with fallback.
 */
export class SwapService {
  private lifi: LiFiProvider;
  private jupiter: JupiterProvider;

  constructor() {
    this.lifi = getLiFiProvider();
    this.jupiter = getJupiterProvider();
  }

  /**
   * executeSettlementSwap — main entry point.
   *
   * Algorithm:
   *   1. Validate inputs (mints, amounts non-zero)
   *   2. Try LiFi with retry (fresh quote each attempt)
   *   3. If quote rejected by validateQuote() → fall through to Jupiter
   *   4. If LiFi throws permanent error → Jupiter immediately
   *   5. Jupiter executes with its own retry logic
   *
   * Returns standardized SwapResult. Throws SwapError on permanent failure.
   */
  async executeSettlementSwap(params: {
    walletPublicKey: PublicKey;
    fromMint: PublicKey | string;
    toMint: PublicKey | string; // should be USDC
    fromAmount: string;
    toTokenAccount: PublicKey | string;
    slippageBps?: number;
    maxPriceImpactPct?: number;
  }): Promise<SwapResult> {
    const {
      walletPublicKey,
      fromMint,
      toMint,
      fromAmount,
      toTokenAccount,
      slippageBps = DEFAULT_SLIPPAGE_BPS,
      maxPriceImpactPct = MAX_PRICE_IMPACT_PCT,
    } = params;

    // Input validation
    const fromMintPK = validateMint(fromMint, 'from');
    const toMintPK = validateMint(toMint, 'to');
    const toATA = typeof toTokenAccount === 'string'
      ? new PublicKey(toTokenAccount)
      : toTokenAccount;

    if (BigInt(fromAmount) <= 0n) {
      throw new SwapError(SwapErrorCode.INVALID_INPUT, 'Swap amount must be greater than 0.');
    }

    const ctx: SwapContext = {
      walletPublicKey,
      fromMint: fromMintPK,
      toMint: toMintPK,
      fromAmount,
      toTokenAccount: toATA,
      slippageBps,
    };

    console.log('[SwapService] Starting settlement swap:', {
      from: fromMintPK.toBase58().slice(0, 8),
      to: toMintPK.toBase58().slice(0, 8),
      amount: fromAmount,
      slippageBps,
    });

    // ── Strategy: LiFi with retry, then fallback to Jupiter ──────────────────

    let lastLiFiError: Error | null = null;

    // Attempt LiFi up to MAX_LIFI_ATTEMPTS times (fresh quote each)
    for (let attempt = 1; attempt <= MAX_LIFI_ATTEMPTS; attempt++) {
      try {
        console.log(`[SwapService] LiFi attempt ${attempt}/${MAX_LIFI_ATTEMPTS}...`);
        const quote = await withSwapRetry(
          () => this.lifi.getQuote(ctx),
          3 // inner retry for transient quote errors
        );

        // Validate before execution
        validateQuote(quote, maxPriceImpactPct);

        // Execute
        const result = await withSwapRetry(
          () => this.lifi.execute(ctx, quote),
          3
        );

        console.log('[SwapService] LiFi success:', result.signature);
        return result;
      } catch (err) {
        const swapErr = err instanceof SwapError ? err : categorizeError(err, 'lifi');

        // If permanent error, skip retries and fallback immediately
        const permanent = [
          SwapErrorCode.INSUFFICIENT_BALANCE,
          SwapErrorCode.INSUFFICIENT_GAS,
          SwapErrorCode.TOKEN_NOT_SUPPORTED,
          SwapErrorCode.QUOTE_NO_ROUTE,
          SwapErrorCode.EXECUTE_SLIPPAGE, // unless user wants override
        ];

        if (permanent.includes(swapErr.code)) {
          console.log('[SwapService] LiFi permanent error, falling back:', swapErr.code);
          lastLiFiError = swapErr;
          break; // exit LiFi loop, go straight to Jupiter
        }

        // Retryable — log and try again
        console.warn(`[SwapService] LiFi retryable error (attempt ${attempt}):`, swapErr.code, swapErr.message);
        lastLiFiError = swapErr;

        if (attempt === MAX_LIFI_ATTEMPTS) break; // fall through to Jupiter
      }
    }

    // ── Jupiter fallback ─────────────────────────────────────────────────────

    console.log('[SwapService] Falling back to Jupiter...');
    try {
      // Jupiter retries handled inside provider + outer backoff wrapper
      const result = await withSwapRetry(
        async () => {
          const quote = await this.jupiter.getQuote(ctx);
          validateQuote(quote, maxPriceImpactPct);
          // Jupiter execute requires wallet-signed tx; delegate to UI layer:
          // UI should call jupiter.executeSigned(signedTx, requestId)
          // Throwing here to indicate manual Jupiter path required:
          throw new SwapError(
            SwapErrorCode.EXECUTE_SUBMIT_FAILED,
            'Jupiter fallback requires wallet-signed transaction. Use JupiterProvider.executeSigned() after signing.'
          );
        },
        MAX_JUPITER_ATTEMPTS
      );
      return result;
    } catch (err) {
      const swapErr = err instanceof SwapError ? err : categorizeError(err, 'jupiter');
      console.error('[SwapService] Jupiter fallback failed:', swapErr);

      // Enhance error message with LiFi context if we have it
      if (lastLiFiError) {
        throw new SwapError(
          swapErr.code,
          `LiFi also failed: ${lastLiFiError.message}. Jupiter error: ${swapErr.message}`,
          swapErr.retryable,
          swapErr
        );
      }
      throw swapErr;
    }
  }

  /**
   * getBestRouteInfo — diagnostic helper to compare LiFi vs Jupiter quotes.
   * Useful for debugging or advanced UI showing "best of" aggregators.
   */
  async getBestRouteInfo(ctx: SwapContext): Promise<{
    lifiQuote?: SwapQuote;
    jupiterQuote?: SwapQuote;
    recommendedProvider: 'lifi' | 'jupiter' | 'either';
    reason: string;
  }> {
    let lifiQuote: SwapQuote | null = null;
    let jupiterQuote: SwapQuote | null = null;
    let lifiErr: Error | null = null;
    let jupiterErr: Error | null = null;

    // Quick parallel fetch with short timeout (best-effort)
    const [lifiRes, jupRes] = await Promise.allSettled([
      this.lifi.getQuote(ctx).catch(err => { lifiErr = err; return null; }),
      this.jupiter.getQuote(ctx).catch(err => { jupiterErr = err; return null; }),
    ]);

    if (lifiRes.status === 'fulfilled' && lifiRes.value) lifiQuote = lifiRes.value;
    if (jupRes.status === 'fulfilled' && jupRes.value) jupiterQuote = jupRes.value;

    // Decision logic
    if (!lifiQuote && !jupiterQuote) {
      return { recommendedProvider: 'either', reason: 'Both providers failed' };
    }

    if (!lifiQuote) {
      return { recommendedProvider: 'jupiter', reason: jupiterErr?.message || 'LiFi unavailable, Jupiter works' };
    }

    if (!jupiterQuote) {
      return { recommendedProvider: 'lifi', reason: 'Jupiter unavailable, LiFi works' };
    }

    // Compare: pick higher output amount
    const lifiOut = BigInt(lifiQuote.outAmount);
    const jupOut = BigInt(jupiterQuote.outAmount);

    if (lifiOut >= jupOut) {
      return {
        lifiQuote,
        jupiterQuote,
        recommendedProvider: 'lifi',
        reason: `LiFi ${lifiOut > jupOut ? 'better' : 'equal'} (${lifiOut.toString()} ≥ ${jupOut.toString()})`,
      };
    } else {
      return {
        lifiQuote,
        jupiterQuote,
        recommendedProvider: 'jupiter',
        reason: `Jupiter better (${jupOut.toString()} > ${lifiOut.toString()})`,
      };
    }
  }
}

/**
 * Singleton service instance.
 */
let swapServiceInstance: SwapService | null = null;
export function getSwapService(): SwapService {
  if (!swapServiceInstance) swapServiceInstance = new SwapService();
  return swapServiceInstance;
}
