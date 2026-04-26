/**
 * PortfolioCard — example component showing wallet portfolio via Zerion
 *
 * USAGE
 *   Place in header, group page, or profile dropdown.
 *   Shows total portfolio value + top 3 token positions.
 *   Pulls data through Next.js API route (server-side Zerion key).
 */

'use client';

import { useZerionWallet, formatUSD } from '@/lib/zerion';
import { Wallet, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

interface Props {
  walletAddress: string | null;
  className?: string;
}

export function PortfolioCard({ walletAddress, className = '' }: Props) {
  const { portfolio, loading, error } = useZerionWallet({
    walletAddress,
    enabled: !!walletAddress,
  });

  if (!walletAddress) {
    return (
      <div className={`rounded-lg border bg-card p-4 text-muted ${className}`}>
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4" />
          <span>Connect wallet to see portfolio</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`rounded-lg border bg-card p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading portfolio…</span>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className={`rounded-lg border bg-destructive/10 p-4 text-destructive ${className}`}>
        <div className="text-sm">Portfolio unavailable</div>
      </div>
    );
  }

  const changeColor = portfolio.change24hPercent >= 0 ? 'text-green-500' : 'text-red-500';
  const changeIcon = portfolio.change24hPercent >= 0
    ? <TrendingUp className="h-3 w-3" />
    : <TrendingDown className="h-3 w-3" />;

  // Show top 3 tokens only
  const topTokens = portfolio.tokens.slice(0, 3);

  return (
    <div className={`rounded-lg border bg-card p-4 shadow-sm ${className}`}>
      {/* Total Value */}
      <div className="mb-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          Total Balance
        </div>
        <div className="text-2xl font-semibold tracking-tight">
          {formatUSD(portfolio.totalValueUSD)}
        </div>
        <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
          {changeIcon}
          <span>
            {portfolio.change24hPercent >= 0 ? '+' : ''}
            {portfolio.change24hPercent.toFixed(2)}% ($
            {formatUSD(Math.abs(portfolio.change24hUSD))})
          </span>
        </div>
      </div>

      {/* Top Tokens */}
      {topTokens.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Top Holdings
          </div>
          {topTokens.map(token => (
            <div key={token.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {token.attributes.icon_url && (
                  <img
                    src={token.attributes.icon_url}
                    alt={token.attributes.symbol}
                    className="h-5 w-5 rounded-full"
                  />
                )}
                <span className="font-medium">{token.attributes.symbol}</span>
              </div>
              <div className="flex flex-col items-end">
                <span>
                  {parseFloat(token.attributes.balance).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{' '}
                  {token.attributes.symbol}
                </span>
                <span className="text-xs text-muted">
                  {formatUSD(parseFloat(token.attributes.value?.value || '0'))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link to full portfolio */}
      {portfolio.tokens.length > 3 && (
        <div className="mt-2 text-center">
          <a
            href={`https://zerion.io/portfolio/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View full portfolio on Zerion →
          </a>
        </div>
      )}
    </div>
  );
}
