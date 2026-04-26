/**
 * lib/swaps/index.ts — public API surface
 *
 * Settlement swap integration for FundWise Split Mode.
 *
 * QUICK START
 *   import { getSwapService, SwapContext } from '@/lib/swaps';
 *
 *   const service = getSwapService();
 *   const result = await service.executeSettlementSwap({
 *     walletPublicKey: userWallet.publicKey,
 *     fromMint: SOL_MINT,
 *     toMint: USDC_MINT,
 *     fromAmount: '100000000', // lamports
 *     toTokenAccount: creditorUSDCAddress,
 *     slippageBps: 100,
 *   });
 *
 *   console.log('Settled:', result.signature);
 *
 * ARCHITECTURE
 *   - LiFiProvider: primary, cross-chain capable, uses Jupiter internally
 *   - JupiterProvider: direct, Solana-native, faster quote
 *   - SwapService: orchestrates LiFi→Jupiter fallback with retries
 *   - SwapProvider (base): error mapping + validation utilities
 *
 * ERROR HANDLING
 *   All swap operations throw SwapError with structured .code (SwapErrorCode)
 *   and .retryable boolean. Wrap calls with try/catch; display user messages.
 */

export {
  SwapProvider,
  type SwapContext,
  type SwapQuote,
  type SwapResult,
  SwapError,
  SwapErrorCode,
  withSwapRetry,
  validateQuote,
  categorizeError,
} from './swap-provider';

export { LiFiProvider, getLiFiProvider } from './lifi-provider';
export { JupiterProvider, getJupiterProvider } from './jupiter-provider';
export { SwapService, getSwapService } from './swap-service';

// Export constants for UI
export const SOL_MINT = new (require('@solana/web3.js')).PublicKey('So11111111111111111111111111111111111111112');
export const USDC_MINT = new (require('@solana/web3.js')).PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
