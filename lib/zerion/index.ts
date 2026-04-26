/**
 * lib/zerion/index.ts — public API
 *
 * Export layer for Zerion wallet data integration:
 *   - Portfolio fetching (balances + USD value)
 *   - Transaction history
 *   - Chain support list
 *   - React hook for client-side usage
 */

export { getZerionClient, isZerionEnabled } from './client';
export {
  fetchPortfolio,
  fetchTransactions,
  getSupportedChains,
  getTokenBalance,
  healthCheck,
} from './wallet-service';
export type {
  FundWisePortfolio,
  FundWiseTransaction,
  ZerionTokenPosition,
  ZerionPrice,
  ZerionTransaction,
  ZerionTransactionAsset,
} from './types';
export { parsePortfolio, parseTransactions } from './types';

export { useZerionWallet, formatUSD } from './use-zerion-wallet';
