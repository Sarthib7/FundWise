/**
 * LiFi Provider Implementation
 *
 * Integrates @lifi/sdk for cross-chain swap aggregation including Solana.
 * LiFi routes through Jupiter under the hood for Solana swaps, providing
 * unified API for both EVM→Solana and Solana→EVM bridge+swap flows.
 *
 * SETUP
 *   npm install @lifi/sdk
 *
 * CONFIG
 *   Create config once at app init:
 *   import { createConfig, Solana, ChainId } from '@lifi/sdk';
 *   createConfig({
 *     integrator: 'FundWise',
 *     apiKey: process.env.LIFI_API_KEY, // optional but raises rate limits
 *   });
 *
 * RATE LIMITS (as of April 2026)
 *   - Unauthenticated: 75 requests per 2 hours (rateLimitDurationMs = 7_200_000)
 *   - Authenticated: 100 RPM default, 500 RPM enterprise
 *
 *   When limit exceeded → LiFiDataError with code 'RATE_LIMIT_EXCEEDED'
 *   → categorized as QUOTE_RATE_LIMIT → retry with backoff.
 *
 * SOLANA SUPPORT
 *   ChainId.SOL = 1 (mainnet)
 *   Supports single-step swaps (no multi-hop within Solana ecosystem)
 *   Token addresses: use Jupiter-verified SPL token mints (USDC, SOL, BONK, JUP, etc.)
 *
 * ERROR MAPPING
 *   LiFi throws LiFiDataError / LiFiExecutionError — these are mapped to
 *   SwapError codes in execute() catch block.
 */

import {
  createConfig,
  Solana,
  ChainId,
  type RoutesRequest,
  type QuoteRequest,
  type Route,
  getRoutes,
  getQuote,
  executeRoute,
  convertQuoteToRoute,
  type LiFiDataError,
  type LiFiExecutionError,
} from '@lifi/sdk';
import { PublicKey } from '@solana/web3.js';
import { SwapProvider, type SwapContext, type SwapQuote, type SwapResult, SwapError, SwapErrorCode, categorizeError } from './swap-provider';

/**
 * LiFiProvider — LiFi SDK wrapper with FundWise conventions.
 *
 * USAGE
 *   const lifi = new LiFiProvider();
 *   const quote = await lifi.getQuote(ctx);
 *   const result = await lifi.execute(ctx, quote);
 */
export class LiFiProvider extends SwapProvider {
  name = 'LiFi';

  /**
   * Initialize LiFi config on first instantiation.
   * Config is global singleton — subsequent calls no-op.
   */
  constructor() {
    super();
    // Idempotent config — safe to call multiple times
    createConfig({
      integrator: 'FundWise',
      apiKey: process.env.LIFI_API_KEY, // undefined → use public rate limits
      // Custom RPCs recommended in production
      rpcUrls: {
        [ChainId.SOL]: process.env.NEXT_PUBLIC_SOLANA_RPC_URL
          ? [process.env.NEXT_PUBLIC_SOLANA_RPC_URL]
          : undefined,
      },
      // Default options can be overridden per-request
      routeOptions: {
        fee: 0, // No integrator fee. Set >0 if monetizing.
      },
    });
  }

  /**
   * GET_QUOTE — fetch multiple routes, pick best by output amount.
   *
   * For Solana settlement, ctx.fromMint is typically SOL or a wrapped token,
   * ctx.toMint is always USDC. LiFi will include bridge step if fromChain !== SOL.
   *
   * THROWS SwapError — rate limit, no route, insufficient balance.
   */
  async getQuote(ctx: SwapContext): Promise<SwapQuote> {
    const fromAmountNum = BigInt(ctx.fromAmount);
    const toAddress = ctx.toTokenAccount.toBase58();

    // Map FundWise SwapContext → LiFi RoutesRequest
    const request: RoutesRequest = {
      fromChainId: ChainId.SOL,
      toChainId: ChainId.SOL,
      fromTokenAddress: ctx.fromMint.toBase58(),
      toTokenAddress: ctx.toMint.toBase58(),
      fromAmount: ctx.fromAmount,
      fromAddress: ctx.walletPublicKey.toBase58(),
      toAddress,
      options: {
        slippage: ctx.slippageBps / 10000, // bps → decimal (100 bps = 0.01)
        order: 'CHEAPEST', // maximize output amount
        maxPriceImpact: 0.1, // 10% hard cap — reject worse
      },
    };

    try {
      const result = await getRoutes(request);
      const routes = result.routes;

      if (!routes || routes.length === 0) {
        throw new SwapError(SwapErrorCode.QUOTE_NO_ROUTE, 'LiFi returned no routes — insufficient liquidity or invalid token pair.');
      }

      // Select best route (highest toAmount)
      const best = routes.reduce((a, b) => {
        const aOut = BigInt(a.toAmount || '0');
        const bOut = BigInt(b.toAmount || '0');
        return aOut > bOut ? a : b;
      });

      // Extract fee: sum of estimated fees across steps (protocol + bridge)
      let feeBps = 0;
      for (const step of best.steps) {
        const fee = (step as any)?.estimate?.fee ?? 0;
        if (typeof fee === 'number' && fee > feeBps) feeBps = fee;
      }

      // Price impact from first step swap (if present)
      const firstSwap = best.steps.find(s => s.type === 'swap' || s.tool.includes('swap'));
      const priceImpact = firstSwap ? (firstSwap as any).estimate?.priceImpact ?? 0 : 0;

      // Estimate route summary for receipt
      const routeSummary = best.steps.map(s => `${s.type}:${s.tool}`).join(' → ');

      return {
        outAmount: best.toAmount,
        outAmountMin: best.toAmountMin || best.toAmount, // LiFi uses toAmountMin
        inAmount: ctx.fromAmount,
        feeBps,
        priceImpactPct: priceImpact * 100,
        provider: 'lifi',
        routeDescription: routeSummary,
        validForMs: 15_000, // LiFi quotes stale quickly — 15s buffer
      };
    } catch (err) {
      throw categorizeError(err, 'lifi');
    }
  }

  /**
   * EXECUTE — execute a LiFi route with status tracking.
   *
   * Requires Solana wallet adapter passed via provider config (setProviders).
   * If not set, throws SWalletNotConfigured.
   *
   * THROWS SwapError — execution failures mapped to codes.
   */
  async execute(ctx: SwapContext, quote?: SwapQuote): Promise<SwapResult> {
    try {
      // Convert SwapContext → LiFi Route.
      // If quote supplied, convert it; otherwise fetch fresh quote first.
      let route: Route;
      if (quote) {
        route = convertQuoteToRoute({
          ...quote,
          fromChainId: ChainId.SOL,
          toChainId: ChainId.SOL,
          fromTokenAddress: ctx.fromMint.toBase58(),
          toTokenAddress: ctx.toMint.toBase58(),
          fromAddress: ctx.walletPublicKey.toBase58(),
          toAddress: ctx.toTokenAccount.toBase58(),
        });
      } else {
        // Fetch and execute atomically (prevents quote staleness)
        route = convertQuoteToRoute(await this.getQuote(ctx));
      }

      // Execute with progress hooks (logs only — UI can subscribe separately)
      const executed = await executeRoute(route, {
        updateRouteHook: (updatedRoute) => {
          for (const step of updatedRoute.steps) {
            const process = step.execution?.process?.[step.execution.process.length - 1];
            if (process?.txHash) {
              console.log(`[LiFi] Step ${step.tool} tx: ${process.txHash} status=${process.status}`);
            }
          }
        },
        // Don't auto-approve — handle approvals upstream if needed
        infiniteApproval: false,
        // Slipage already set in quote options, but can update here
      });

      // Find final successful step
      const finalStep = executed.steps[executed.steps.length - 1];
      const txHash = finalStep?.execution?.process?.[finalStep.execution.process.length - 1]?.txHash;

      if (!txHash) {
        throw new SwapError(SwapErrorCode.EXECUTE_CONFIRMATION_FAILED, 'Swap completed but no transaction hash found.');
      }

      // Estimate fee from route (LiFi bundles fees in step estimates)
      let feeBps = 0;
      for (const step of executed.steps) {
        const stepFee = (step as any)?.estimate?.fee ?? 0;
        if (typeof stepFee === 'number' && stepFee > feeBps) feeBps = stepFee;
      }

      return {
        signature: txHash,
        routeUsed: 'lifi',
        feeBps,
        outAmountMin: executed.toAmountMin || executed.toAmount,
        executedAt: new Date().toISOString(),
        routeSummary: executed.steps.map(s => `${s.type}:${s.tool}`).join(' → '),
      };
    } catch (err) {
      throw categorizeError(err, 'lifi');
    }
  }

  /**
   * Health check — attempts a minimal quote request.
   * Returns false on rate limit or network error (retryable later).
   */
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
    } catch (err) {
      console.warn('[LiFiProvider] health check failed:', err);
      return false;
    }
  }
}

/**
 * Convenience factory — singleton per app lifecycle.
 */
let lifiInstance: LiFiProvider | null = null;
export function getLiFiProvider(): LiFiProvider {
  if (!lifiInstance) lifiInstance = new LiFiProvider();
  return lifiInstance;
}
