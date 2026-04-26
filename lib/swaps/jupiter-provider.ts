/**
 * Jupiter Fallback Provider
 *
 * Direct integration with Jupiter Aggregator API v2 (Solana native).
 * Used when LiFi is unavailable or rate-limited. Also serves as the
 * reference implementation for pure-Solana swap paths without cross-chain overhead.
 *
 * WHY SEPARATE PROVIDER
 *   - LiFi wraps Jupiter internally, but indirect → quote latency ~2-3x slower
 *   - Jupiter direct: ~200-500ms quote, single HTTP round-trip
 *   - Fallback ensures swap always works even if LiFi API incidents occur
 *
 * API REFERENCE
 *   https://docs.jup.ag/ (Swap API v2)
 *   - GET /swap/v2/order  → quote + assembled transaction (base64)
 *   - POST /swap/v2/execute → execute signed transaction
 *
 * RATE LIMITS (April 2026)
 *   Keyless: 0.5 RPS (no API key)
 *   Free: 1 RPS ($0/mo)
 *   Developer: 10 RPS ($25/mo)
 *   Launch: 50 RPS ($100/mo)
 *   Pro: 150 RPS ($500/mo)
 *
 *   Recommend: Developer tier for hackathon demo (smooth UX, higher limits).
 *   API key: https://portal.jup.ag/
 *
 * ROUTING ENGINES (Meta-Aggregator)
 *   Metis     — on-chain routing across all Solana DEXes
 *   JupiterZ  — RFQ market makers (often 5-20 bps better on major pairs)
 *   Dflow     — third-party on-chain router
 *   OKX       — centralized exchange liquidity
 *
 *   Default (`/order` without restrictions) → all engines compete → best price.
 *   Adding `referralAccount` / `payer` / `receiver` disables JupiterZ RFQ.
 *
 * ERROR CODES (execute response)
 *   0      Success
 *  -1      Invalid requestId
 *  -2      Invalid signed transaction
 *  -3      Invalid message bytes
 *  -1000   Failed to land (retry with fresh quote)
 *  -1003   Transaction not fully signed
 *  -2003   Quote expired (get fresh order)
 *  -2004   Swap rejected by market maker
 *   6001   Slippage tolerance exceeded
 *
 * TRANSACTION FLOW
 *   1. GET /swap/v2/order?… (with taker=wallet)
 *   2. Decode base64 transaction → VersionedTransaction
 *   3. Sign with @solana/web3.js wallet
 *   4. POST /swap/v2/execute { signedTransaction, requestId }
 *   5. Poll / confirm on-chain
 */

import {
  Connection,
  VersionedTransaction,
  PublicKey,
  type ConfirmedSignature,
} from '@solana/web3.js';
import { SwapProvider, type SwapContext, type SwapQuote, type SwapResult, SwapError, SwapErrorCode, categorizeError } from './swap-provider';

const JUPITER_BASE_URL = 'https://api.jup.ag/swap/v2';

/**
 * JupiterProvider — direct Jupiter Aggregator API integration.
 *
 * USAGE
 *   const jup = new JupiterProvider();
 *   const quote = await jup.getQuote(ctx);
 *   const result = await jup.execute(ctx, quote);
 */
export class JupiterProvider extends SwapProvider {
  name = 'Jupiter';

  private connection: Connection;
  private apiKey: string | undefined;

  constructor(connection?: Connection, apiKey?: string) {
    super();
    this.connection = connection ?? new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      { commitment: 'confirmed' }
    );
    this.apiKey = apiKey ?? process.env.JUPITER_API_KEY;
  }

  /**
   * GET_QUOTE — fetch swap quote + pre-assembled transaction.
   *
   * GET /swap/v2/order returns both route data and base64 transaction ready for signing.
   *
   * Important params:
   * - inputMint / outputMint: SPL token mint addresses (SOL = So111...12)
   * - amount: in smallest units (lamports or token decimals)
   * - taker: user wallet (required for transaction assembly)
   * - slippageBps: 50 = 0.5%, typical range 50-500
   *
   * THROWS SwapError — rate limit, no route, insufficient balance.
   */
  async getQuote(ctx: SwapContext): Promise<SwapQuote> {
    const params = new URLSearchParams({
      inputMint: ctx.fromMint.toBase58(),
      outputMint: ctx.toMint.toBase58(),
      amount: ctx.fromAmount,
      taker: ctx.walletPublicKey.toBase58(),
      slippageBps: ctx.slippageBps.toString(),
      // Avoid restrictions that disable JupiterZ RFQ:
      // Only set these if you need specific behavior:
      // onlyDirectRoutes: 'false',
      // restrictIntermediateTokens: 'none',
    });

    const headers: HeadersInit = {};
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    try {
      const res = await fetch(`${JUPITER_BASE_URL}/order?${params}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Jupiter API error ${res.status}: ${text}`);
      }

      const order = await res.json();

      // Check for embedded error (e.g. insufficient funds, below minimum)
      if (order.errorCode) {
        switch (order.errorCode) {
          case 1: // Insufficient funds
            throw new SwapError(SwapErrorCode.INSUFFICIENT_BALANCE, order.errorMessage || 'Insufficient token balance.');
          case 2: // Not enough SOL for gas
            throw new SwapError(SwapErrorCode.INSUFFICIENT_GAS, order.errorMessage || 'Insufficient SOL for transaction fees.');
          case 3: // Below gasless minimum
            throw new SwapError(SwapErrorCode.INVALID_INPUT, order.errorMessage || 'Swap amount below gasless minimum (~$10).');
          default:
            throw new SwapError(SwapErrorCode.QUOTE_NO_ROUTE, order.errorMessage || 'Quote generation failed.');
        }
      }

      if (!order.transaction || !order.outAmount) {
        throw new SwapError(SwapErrorCode.QUOTE_NO_ROUTE, 'No transaction returned — no viable route found.');
      }

      // Parse feeBps: platformFee.feeBps, else 0
      const feeBps = order.platformFee?.feeBps ?? order.feeBps ?? 0;

      // Price impact as percentage (0-100)
      const priceImpactPct = order.priceImpactPct
        ? parseFloat(order.priceImpactPct) * 100
        : 0;

      // Build human-readable route summary
      const routePlan = order.routePlan?.map(rp => `${rp.swapInfo.label} (${rp.swapInfo.inputMint.slice(0, 6)}→${rp.swapInfo.outputMint.slice(0, 6)})`) || [];
      const routeSummary = routePlan.length > 0
        ? `Jupiter: ${routePlan.join(' → ')}`
        : `Jupiter ${order.router ? `[${order.router}]` : ''}`;

      return {
        outAmount: order.outAmount,
        outAmountMin: order.otherAmountThreshold || order.outAmount,
        inAmount: ctx.fromAmount,
        feeBps,
        priceImpactPct,
        provider: 'jupiter',
        routeDescription: order.mode === 'ultra' ? `${routeSummary} (all engines)` : routeSummary,
        validForMs: 10_000, // Jupiter quotes valid ~10-15 seconds
      };
    } catch (err) {
      throw categorizeError(err, 'jupiter');
    }
  }

  /**
   * EXECUTE — sign and submit Jupiter transaction via /execute.
   *
   * Step-by-step:
   * 1. Decode base64 transaction → VersionedTransaction
   * 2. Sign (full signature for standard swaps; partial for JupiterZ RFQ handled by SDK)
   * 3. POST /execute with signedTransaction (base64) + requestId
   * 4. Poll transaction status on-chain
   *
   * THROWS SwapError — execution failures mapped to Jupiter error codes.
   */
  async execute(ctx: SwapContext, quote?: SwapQuote): Promise<SwapResult> {
    const startTime = Date.now();

    try {
      // Step 1: get fresh quote if not provided
      const orderQuote = quote ?? await this.getQuote(ctx);
      const txBase64 = orderQuote as any; // cast hack: quote IS the order response

      // We need the full order response, not just the cleaned quote.
      // Re-fetch to get transaction and requestId.
      const params = new URLSearchParams({
        inputMint: ctx.fromMint.toBase58(),
        outputMint: ctx.toMint.toBase58(),
        amount: ctx.fromAmount,
        taker: ctx.walletPublicKey.toBase58(),
        slippageBps: ctx.slippageBps.toString(),
      });

      const headers: HeadersInit = {};
      if (this.apiKey) headers['x-api-key'] = this.apiKey;

      const orderRes = await fetch(`${JUPITER_BASE_URL}/order?${params}`, { headers });
      const order = await orderRes.json();

      if (!order.transaction) {
        throw new SwapError(SwapErrorCode.QUOTE_NO_ROUTE, 'No transaction in Jupiter order response.');
      }

      // Step 2: decode transaction
      const txBytes = Buffer.from(order.transaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBytes);

      // Step 3: sign transaction
      // Note: wallet.signTransaction() must be injected via config or passed as parameter.
      // For now we expect wallet adapter via provider params.
      // This method signature will need wallet parameter — see DESIGN NOTE below.
      throw new Error('JupiterProvider.execute() requires wallet adapter — see DESIGN NOTE in file. Bridge through wallet-native signing layer.');
    } catch (err) {
      throw categorizeError(err, 'jupiter');
    }
  }

  /**
   * SIGN_AND_EXECUTE — helper that takes pre-signed transaction.
   *
   * Use this when signing is handled upstream by wallet adapter UI.
   * Flow: getQuote() → UI shows → user approves → wallet signs → call this.
   */
  async executeSigned(signedTxBase64: string, requestId: string): Promise<SwapResult> {
    try {
      const res = await fetch(`${JUPITER_BASE_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
        },
        body: JSON.stringify({
          signedTransaction: signedTxBase64,
          requestId,
        }),
      });

      const result = await res.json();

      if (result.status === 'Success') {
        return {
          signature: result.signature,
          routeUsed: 'jupiter',
          feeBps: result.platformFee?.feeBps ?? 0,
          outAmountMin: '0', // Not returned; fetch receipt separately
          executedAt: new Date().toISOString(),
          routeSummary: `Jupiter ${result.signature ? '(confirmed)' : ''}`,
        };
      }

      // Map Jupiter error codes → SwapErrorCode
      let code = SwapErrorCode.EXECUTE_SUBMIT_FAILED;
      if (result.code === -1000) code = SwapErrorCode.EXECUTE_SUBMIT_FAILED;
      if (result.code === -2003) code = SwapErrorCode.EXECUTE_TRANSACTION_EXPIRED;
      if (result.code === -2004) code = SwapErrorCode.EXECUTE_SLIPPAGE;
      if (result.code === 6001) code = SwapErrorCode.EXECUTE_SLIPPAGE;

      throw new SwapError(code, result.error || 'Jupiter execution failed.');
    } catch (err) {
      throw categorizeError(err, 'jupiter');
    }
  }

  /**
   * HEALTH_CHECK — lightweight quote (no signer needed).
   * Jupiter GET /order requires taker, so use a dummy wallet.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const dummyWallet = new PublicKey('11111111111111111111111111111111');
      await this.getQuote({
        walletPublicKey: dummyWallet,
        fromMint: new PublicKey('So11111111111111111111111111111111111111112'),
        toMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
        fromAmount: '1000000',
        toTokenAccount: dummyWallet,
        slippageBps: 100,
      });
      return true;
    } catch (err) {
      console.warn('[JupiterProvider] health check failed:', err);
      return false;
    }
  }
}

/**
 * DESIGN NOTE: Wallet Integration
 *
 * PROBLEM: SwapProvider.execute() needs to sign a transaction. Wallet adapter
 * lives in React layer (useWallet() from @solana/wallet-adapter-react). Providers
 * are pure lib/ classes without React context.
 *
 * SOLUTION (current):
 *   - getQuote() doesn't need wallet
 *   - execute() accepts pre-signed transaction via executeSigned()
 *   - UI layer: getQuote → show to user → wallet.signTransaction() → executeSigned()
 *
 * Alternative: inject signer fn into constructor:
 *   new JupiterProvider({ signTransaction: async tx => wallet.signTransaction(tx) })
 *
 * Current approach keeps providers framework-agnostic.
 */

let jupiterInstance: JupiterProvider | null = null;
export function getJupiterProvider(connection?: Connection, apiKey?: string): JupiterProvider {
  if (!jupiterInstance) jupiterInstance = new JupiterProvider(connection, apiKey);
  return jupiterInstance;
}
