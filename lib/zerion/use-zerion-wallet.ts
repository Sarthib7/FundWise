/**
 * useZerionWallet — React hook for wallet portfolio data
 *
 * USAGE
 *   const { portfolio, transactions, loading, error } = useZerionWallet({
 *     walletAddress: userWallet?.publicKey?.toBase58(),
 *     enabled: !!userWallet,
 *   });
 *
 * INTEGRATION
 *   Client-side components call this hook → which calls Next.js route handlers
 *   (`app/api/zerion/portfolio/route.ts` etc.) that use ZerionWalletService
 *   (server-side only, keeping API key secure).
 *
 * PATTERN
 *   Browser (hook) → /api/zerion/* (Next.js server route) → ZerionWalletService (server) → Zerion API
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseZerionWalletOptions {
  walletAddress: string | null | undefined;
  enabled?: boolean;
  refreshIntervalMs?: number;
}

export interface UseZerionWalletReturn {
  portfolio: FundWisePortfolio | null;
  transactions: FundWiseTransaction[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * useZerionWallet — fetches portfolio + transactions for connected wallet
 */
export function useZerionWallet({
  walletAddress,
  enabled = true,
  refreshIntervalMs,
}: UseZerionWalletOptions): UseZerionWalletReturn {
  const [portfolio, setPortfolio] = useState<FundWisePortfolio | null>(null);
  const [transactions, setTransactions] = useState<FundWiseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!walletAddress || !enabled) {
      setPortfolio(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fire parallel requests
      const [portfolioRes, txsRes] = await Promise.all([
        fetch(`/api/zerion/portfolio?address=${encodeURIComponent(walletAddress)}`).then(r => {
          if (!r.ok) throw new Error(`Portfolio API error ${r.status}`);
          return r.json();
        }),
        fetch(`/api/zerion/transactions?address=${encodeURIComponent(walletAddress)}&limit=10`).then(r => {
          if (!r.ok) throw new Error(`Transactions API error ${r.status}`);
          return r.json();
        }),
      ]);

      setPortfolio(portfolioRes);
      setTransactions(txsRes);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown Zerion fetch error'));
    } finally {
      setLoading(false);
    }
  }, [walletAddress, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optional polling
  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return;
    const interval = setInterval(fetchData, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, refreshIntervalMs]);

  return {
    portfolio,
    transactions,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * formatUSD — helper to display portfolio value
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
