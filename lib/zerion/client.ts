/**
 * Zerion API Client — singleton configuration
 *
 * PURPOSE
 *   FundWise uses Zerion to fetch wallet portfolio data (balances, positions,
 *   transaction history) across both EVM chains and Solana in a unified schema.
 *   Swap execution is handled by LiFi, not Zerion — Zerion is read-only data.
 *
 * AUTH
 *   HTTP Basic Auth: API key as username, empty password.
 *   Key stored in env var ZERION_API_KEY (server-side only; never expose to client).
 *
 * RATE LIMITS (April 2026)
 *   - Developer: 2K/day (~60K/mo), 10 RPS — free
 *   - Builder: $149/mo, 250K requests, 50 RPS
 *   - Startup: $499/mo, 1M requests, 150 RPS
 *   - x402 pay-per-use: $0.01 USDC per request (no subscription)
 *
 *   Recommendation: Developer tier sufficient for demo (2K/day ≈ 60K/mo).
 *   Sign up: https://dashboard.zerion.io
 *
 * ENDPOINTS USED
 *   GET /v1/wallets/{address}/portfolio  — aggregated balances + USD value
 *   GET /v1/wallets/{address}/positions  — fungible + DeFi + NFT positions
 *   GET /v1/wallets/{address}/transactions — parsed transaction history
 *   GET /v1/chains                           — supported chain list (cached)
 *
 * UNIFORM SCHEMA
 *   All chains return same JSON:API structure. Solana support matches EVM.
 */

import type { ZerionClient as ZerionClientType, createZerionClient, type GetWalletPortfolioResponse } from 'zerion';

let zerionClient: ReturnType<typeof createZerionClient> | null = null;

/**
 * Initialize Zerion client singleton.
 *
 * Call once at app bootstrap (server-side or Node-only context).
 * NEVER call in browser — API key must stay server-side.
 */
function initZerionClient(): void {
  if (zerionClient) return;

  const apiKey = process.env.ZERION_API_KEY;

  if (!apiKey) {
    console.warn('[Zerion] ZERION_API_KEY not set — Zerion client disabled');
    return;
  }

  // @ts-ignore — zerion package types may have module mismatch; runtime works
  zerionClient = createZerionClient({
    apiKey,
    // Optional: customize timeout, retry logic globally
  });
}

/**
 * getZerionClient — returns initialized client or null.
 * Gracefully handles missing API key.
 */
export function getZerionClient(): ReturnType<typeof createZerionClient> | null {
  if (!zerionClient) initZerionClient();
  return zerionClient;
}

/**
 * isZerionEnabled — feature flag
 */
export function isZerionEnabled(): boolean {
  return Boolean(process.env.ZERION_API_KEY && getZerionClient());
}

// Re-export useful types for consumers
export type { GetWalletPortfolioResponse, type WalletPortfolio } from 'zerion';
