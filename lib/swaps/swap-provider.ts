/**
 * Swap Provider Interface — FundWise Settlement Layer
 *
 * DEFINITION
 *   Abstraction over swap execution providers for USDC settlement.
 *   Primary: LiFi SDK (cross-chain + Jupiter under the hood).
 *   Fallback: Jupiter Aggregator API (direct Solana swap execution).
 *
 * WHY ABSTRACT
 *   - LiFi occasionally hits rate limits (75 req / 2h unauthenticated, 100 RPM authenticated).
 *   - Jupiter fallback ensures swap always possible during LiFi downtime or quote failures.
 *   - Isolates swap logic from UI components; testable provider swap.
 *
 * CONTRACT
 *   All providers must return identical output shape:
 *   { signature, routeUsed, feeBps, outAmountMin, executedAt }
 *
 * ERROR HANDLING
 *   Providers throw SwapError with .code (see SwapErrorCode enum) and .retryable flag.
 *   Callers implement exponential backoff: 1s, 2s, 4s, 8s (max 3 retries).
 *
 * SETTLEMENT CONTEXT
 *   Used exclusively for Split Mode settlement: after expense graph computes
 *   who owes whom, user confirms settlement → call executeSettlementSwap().
 *   All swaps settle to USDC (ephemeral treasury → creditor USDC ATA).
 *
 * TOKEN ADDRESSES (mainnet-beta)
 *   USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
 *   SOL (for gas): native (no mint address)
 */

import type { PublicKey } from '@solana/web3.js';

/**
 * Standardized swap result shape.
 */
export interface SwapResult {
  /** Solana transaction signature (base58) */
  signature: string;
  /** Which provider executed the swap ('lifi' | 'jupiter') */
  routeUsed: 'lifi' | 'jupiter';
  /** Total fee in basis points (bps) — includes protocol + any integrator fee */
  feeBps: number;
  /** Guaranteed minimum out amount (in token smallest units) */
  outAmountMin: string;
  /** ISO timestamp of execution */
  executedAt: string;
  /** Optional: human-readable route breakdown for receipt */
  routeSummary?: string;
}

/**
 * Quote returned by providers before execution.
 * Used for UI: display expected output + fees before user confirms.
 */
export interface SwapQuote {
  /** Expected output amount before slippage */
  outAmount: string;
  /** Minimum guaranteed output after slippage tolerance */
  outAmountMin: string;
  /** Input amount in smallest units */
  inAmount: string;
  /** Fee in basis points */
  feeBps: number;
  /** Expected price impact percentage (0-100) */
  priceImpactPct: number;
  /** Provider that generated this quote */
  provider: 'lifi' | 'jupiter';
  /** Route description (e.g. "SOL → USDC via Jupiter (Raydium+Orca)") */
  routeDescription?: string;
  /** Quote freshness window in milliseconds (client should stale after this) */
  validForMs: number;
}

/**
 * Swap context — all data needed to execute a settlement swap.
 */
export interface SwapContext {
  /** Wallet that executes the swap (payer + signer) */
  walletPublicKey: PublicKey;
  /** Token mint being sold */
  fromMint: PublicKey;
  /** Token mint being bought (always USDC for settlement) */
  toMint: PublicKey;
  /** Amount to sell (in smallest units) */
  fromAmount: string;
  /** Target receiving token account (USDC ATA of creditor or group treasury) */
  toTokenAccount: PublicKey;
  /** Slippage tolerance in basis points (e.g. 100 = 1%) */
  slippageBps: number;
  /** Optional: referral account for integrator fee (requires Jupiter with referral setup) */
  referralAccount?: PublicKey;
}

/**
 * SwapError — structured error with retry guidance.
 */
export class SwapError extends Error {
  constructor(
    public code: SwapErrorCode,
    message: string,
    public retryable: boolean = false,
    public cause?: Error
  ) {
    super(message);
    this.name = 'SwapError';
  }
}

/**
 * Swap error codes — map to recovery actions.
 */
export enum SwapErrorCode {
  // Quote failures (retryable with fresh quote)
  QUOTE_RATE_LIMIT = 'QUOTE_RATE_LIMIT',     // 429 from LiFi/Jupiter — exponential backoff
  QUOTE_STALE = 'QUOTE_STALE',                // Quote expired (>validForMs) — refresh
  QUOTE_NO_ROUTE = 'QUOTE_NO_ROUTE',          // No liquidity path — increase slippage or check balance
  QUOTE_PRICE_IMPACT_HIGH = 'PRICE_IMPACT_HIGH', // > threshold — warn user

  // Execution failures (retryable with fresh transaction)
  EXECUTE_TRANSACTION_EXPIRED = 'TX_EXPIRED',   // Stale requestId / blockheight — re-quote
  EXECUTE_SIGNING_FAILED = 'SIGN_FAILED',       // Wallet reject / bad key — user action needed
  EXECUTE_SUBMIT_FAILED = 'SUBMIT_FAILED',      // RPC error — retry with backoff
  EXECUTE_CONFIRMATION_FAILED = 'CONFIRM_FAILED', // TX dropped / sim failure — retry
  EXECUTE_SLIPPAGE = 'SLIPPAGE_EXCEEDED',       // Output < min — user may confirm override (risky)

  // Permanent failures (no retry)
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE', // User lacks funds
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS',         // Not enough SOL for fees
  TOKEN_NOT_SUPPORTED = 'TOKEN_NOT_SUPPORTED',   // SPL token not whitelisted by aggregator
  INVALID_INPUT = 'INVALID_INPUT',               // Bad addresses/amount zero
  RPC_UNAVAILABLE = 'RPC_UNAVAILABLE',           // Endpoint down — switch RPC
}

/**
 * SwapProvider — abstract interface.
 * Implementations: LiFiProvider, JupiterFallbackProvider.
 */
export abstract class SwapProvider {
  abstract get name(): string;

  /** Fetch a quote without executing. */
  abstract getQuote(ctx: SwapContext): Promise<SwapQuote>;

  /** Execute a swap. Throws SwapError on failure. */
  abstract execute(ctx: SwapContext, quote?: SwapQuote): Promise<SwapResult>;

  /** Health check — returns true if provider reachable. */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getQuote({
        walletPublicKey: new PublicKey('11111111111111111111111111111111'),
        fromMint: new PublicKey('So11111111111111111111111111111111111111112'),
        toMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        fromAmount: '1000000',
        toTokenAccount: new PublicKey('11111111111111111111111111111111'),
        slippageBps: 100,
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Retry wrapper for swap operations.
 * Transient errors (rate limit, network, stale quote) → exponential backoff.
 * Permanent errors → re-throw immediately.
 */
export async function withSwapRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const swapErr = err instanceof SwapError ? err : new SwapError(
        SwapErrorCode.EXECUTE_SUBMIT_FAILED,
        err instanceof Error ? err.message : 'Unknown swap error',
        false,
        err
      );

      // Permanent errors — do not retry
      const permanent = [
        SwapErrorCode.INSUFFICIENT_BALANCE,
        SwapErrorCode.INSUFFICIENT_GAS,
        SwapErrorCode.TOKEN_NOT_SUPPORTED,
        SwapErrorCode.INVALID_INPUT,
      ];
      if (permanent.includes(swapErr.code)) {
        throw swapErr;
      }

      lastError = swapErr;

      // If last attempt, throw
      if (attempt === maxAttempts) break;

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}

/**
 * Validate quote before execution.
 * Prevents executing obviously bad trades.
 */
export function validateQuote(quote: SwapQuote, maxPriceImpactPct = 5): void {
  if (parseFloat(quote.outAmountMin) <= 0) {
    throw new SwapError(
      SwapErrorCode.QUOTE_NO_ROUTE,
      'Quote returned zero output — no liquidity route available.'
    );
  }

  if (quote.priceImpactPct > maxPriceImpactPct) {
    throw new SwapError(
      SwapErrorCode.QUOTE_PRICE_IMPACT_HIGH,
      `Price impact ${quote.priceImpactPct.toFixed(2)}% exceeds safe threshold ${maxPriceImpactPct}%.`
    );
  }
}

/**
 * Map provider-specific error to SwapErrorCode.
 * Each provider implementation calls this helper in catch blocks.
 */
export function categorizeError(err: unknown, provider: 'lifi' | 'jupiter'): SwapError {
  const msg = err instanceof Error ? err.message : String(err);

  // Rate limit / quota errors
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
    return new SwapError(SwapErrorCode.QUOTE_RATE_LIMIT, 'API rate limit exceeded. Retrying...', true, err);
  }

  // Quote-specific failures
  if (msg.includes('no route') || msg.includes('insufficient liquidity')) {
    return new SwapError(SwapErrorCode.QUOTE_NO_ROUTE, 'No swap route found. Try increasing slippage or a different token pair.', false, err);
  }

  if (msg.includes('insufficient balance') || msg.includes('InsufficientFunds')) {
    return new SwapError(SwapErrorCode.INSUFFICIENT_BALANCE, 'Insufficient token balance to execute swap.', false, err);
  }

  if (msg.includes('insufficient lamports') || msg.includes('insufficient funds for gas')) {
    return new SwapError(SwapErrorCode.INSUFFICIENT_GAS, 'Insufficient SOL for transaction fees.', false, err);
  }

  // Execution-specific failures
  if (msg.includes('slippage') || msg.includes('SlippageError')) {
    return new SwapError(SwapErrorCode.EXECUTE_SLIPPAGE, 'Slippage tolerance exceeded. Market moved against the trade.', true, err);
  }

  if (msg.includes('expired') || msg.includes('stale')) {
    return new SwapError(SwapErrorCode.EXECUTE_TRANSACTION_EXPIRED, 'Transaction expired. Getting fresh quote...', true, err);
  }

  if (msg.includes('sign') || msg.includes('User rejected')) {
    return new SwapError(SwapErrorCode.EXECUTE_SIGNING_FAILED, 'Wallet signing failed or rejected.', false, err);
  }

  // RPC / network errors
  if (msg.includes('RPC') || msg.includes('timeout') || msg.includes('unreachable')) {
    return new SwapError(SwapErrorCode.RPC_UNAVAILABLE, 'RPC endpoint unavailable. Retrying with fallback...', true, err);
  }

  // Fallback
  return new SwapError(
    SwapErrorCode.EXECUTE_SUBMIT_FAILED,
    `Swap failed: ${msg}`,
    true,
    err
  );
}
