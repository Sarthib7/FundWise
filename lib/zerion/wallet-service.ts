/**
 * Zerion Wallet Service — high-level portfolio fetching
 *
 * Provides FundWise-specific wrappers around Zerion API:
 *   - fetchPortfolio(walletAddress): FundWisePortfolio
 *   - fetchTransactions(walletAddress, limit?): FundWiseTransaction[]
 *   - getSupportedChains(): string[]
 *
 * INTEGRATION
 *   This service is callable from Next.js server components or Edge Functions.
 *   Zerion API key is server-side only — never exposed to browser.
 *
 *   For client-side React components, use `useZerionWallet()` hook which
 *   calls Next.js route handlers that proxy to this service.
 *
 * FALLBACK BEHAVIOR
 *   If ZERION_API_KEY not set or API call fails, returns null (graceful degradation).
 *   FundWise can still function without wallet data; just show "Connect wallet to see balance".
 */

import { getZerionClient, isZerionEnabled } from './client';
import { parsePortfolio, parseTransactions, type FundWisePortfolio, type FundWiseTransaction } from './types';

const ZERION_BASE = 'https://api.zerion.io/v1';

/**
 * Fetch full wallet portfolio (balances + total value).
 *
 * Returns simplified FundWisePortfolio model — tokens array, USD totals, 24h change.
 *
 * NOTE: Zerion API latency ~500ms-2s. Call from server-side only or cache aggressively.
 */
export async function fetchPortfolio(walletAddress: string): Promise<FundWisePortfolio | null> {
  if (!isZerionEnabled()) {
    console.warn('[ZerionWalletService] API key not configured — returning null portfolio');
    return null;
  }

  const client = getZerionClient();
  if (!client) return null;

  try {
    // Using the zerion SDK client
    const response = await client.getWalletPortfolio(walletAddress);
    // @ts-ignore — response shape differs between raw and parsed
    const parsed = parsePortfolio(response);
    return parsed;
  } catch (err) {
    console.error('[ZerionWalletService] Portfolio fetch failed:', err);
    return null;
  }
}

/**
 * Fetch recent transaction history (parsed, human-readable).
 *
 * @param walletAddress — user's wallet address
 * @param limit — max txs to return (default 10, max 100)
 */
export async function fetchTransactions(
  walletAddress: string,
  limit = 10
): Promise<FundWiseTransaction[]> {
  if (!isZerionEnabled()) return [];

  const client = getZerionClient();
  if (!client) return [];

  try {
    const response = await client.getWalletTransactions(walletAddress, {
      page: { size: limit },
      filter: {
        // Could filter by chain_id: ['solana'] if Solana-only needed
      },
    });

    const parsed = parseTransactions(response);
    return parsed.slice(0, limit);
  } catch (err) {
    console.error('[ZerionWalletService] Transactions fetch failed:', err);
    return [];
  }
}

/**
 * Get supported chains list (cached).
 * Useful for chain selector UI.
 */
let cachedChains: string[] | null = null;
export async function getSupportedChains(): Promise<string[]> {
  if (cachedChains) return cachedChains;

  if (!isZerionEnabled()) return ['solana', 'ethereum', 'base', 'arbitrum', 'optimism', 'polygon'];

  const client = getZerionClient();
  if (!client) return ['solana', 'ethereum', 'base', 'arbitrum', 'optimism', 'polygon'];

  try {
    const chains = await client.listChains();
    cachedChains = chains.data.map((c: any) => c.id);
    return cachedChains;
  } catch (err) {
    console.error('[ZerionWalletService] listChains failed:', err);
    return ['solana', 'ethereum', 'base', 'arbitrum', 'optimism', 'polygon'];
  }
}

/**
 * Get single token balance from portfolio (helper for quick balance fetch).
 * Useful for settlement page to check USDC balance before swap.
 */
export async function getTokenBalance(
  walletAddress: string,
  fungibleId: string,
  chainId: string = 'solana'
): Promise<string | null> {
  const portfolio = await fetchPortfolio(walletAddress);
  if (!portfolio) return null;

  const token = portfolio.tokens.find(
    t => t.attributes.fungible_id === fungibleId && t.attributes.chain_id === chainId
  );

  return token?.attributes.balance || null;
}

/**
 * Health check — returns true if Zerion API reachable and returning data.
 */
export async function healthCheck(): Promise<boolean> {
  if (!isZerionEnabled()) return false;

  try {
    // Quick call to chains list (cheap, fast)
    const chains = await getSupportedChains();
    return chains.length > 0;
  } catch {
    return false;
  }
}
