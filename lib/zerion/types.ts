/**
 * Zerion Types — FundWise-specific facade over Zerion API schema
 *
 * We only need a small subset of Zerion's full response. These types
 * capture what FundWise displays: total portfolio value, token balances,
 * and recent transaction history (for activity feed).
 *
 * Full Zerion schema: https://developers.zerion.io/schema
 */

/** Normalized price object (USD value + currency) */
export interface ZerionPrice {
  value: string;           // e.g. "123.45"
  currency: 'usd' | 'eur' | 'gbp';
  type: 'blockchain' | 'fiat' | 'none';
}

/** Single fungible token position */
export interface ZerionTokenPosition {
  id: string;
  type: 'fungible';
  attributes: {
    name: string;
    symbol: string;
    icon_url: string;
    decimals: number;
    balance: string;       // raw string (may be decimal or int, Zerion normalizes)
    price: ZerionPrice;
    value: ZerionPrice;    // balance * price
    quantity: string;      // same as balance
    liquidity: 'high' | 'medium' | 'low' | null;
    fungible_id: string;   // Zerion's ID (e.g. 'eth', 'usdc')
    asset_address?: string; // contract address (if EVM)
    chain_id: string;      // 'solana' | 'ethereum' | 'base' etc.
  };
}

/** Parsed transaction record */
export interface ZerionTransaction {
  id: string;
  type: string;            // 'swap' | 'transfer' | 'approve' | 'claim' etc.
  attributes: {
    sent?: ZerionTransactionAsset;
    received?: ZerionTransactionAsset;
    fee?: {
      amount: string;
      currency: { id: string; type: string };
    };
    block_signed_at: string; // ISO timestamp
    tx_hash: string;
    success: boolean;
    description?: string;
  };
}

export interface ZerionTransactionAsset {
  amount: string;
  decimals: number;
  fungible: {
    id: string;
    name: string;
    symbol: string;
    icon_url: string;
  };
}

/** Portfolio summary response */
export interface FundWisePortfolio {
  address: string;
  totalValueUSD: number;
  change24hUSD: number;
  change24hPercent: number;
  tokens: ZerionTokenPosition[];
  lastUpdated: string;
}

/** Map Zerion full response → FundWise simplified model */
export function parsePortfolio(
  zerionResponse: any
): FundWisePortfolio {
  // Zerion returns JSON:API { data: {...}, included?: [...] }
  const main = zerionResponse?.data?.attributes;

  if (!main) {
    throw new Error('Invalid Zerion portfolio response structure');
  }

  const totalValue = parseFloat(main.total?.value || '0');
  const change24h = parseFloat(main.change_24h?.absolute || '0');
  const changePct = parseFloat(main.change_24h?.percent || '0');

  // Extract token positions from `included` array (type: 'fungible')
  const positions: ZerionTokenPosition[] = [];
  for (const item of zerionResponse?.included || []) {
    if (item.type === 'fungible') {
      positions.push(item as ZerionTokenPosition);
    }
  }

  return {
    address: zerionResponse.data.id,
    totalValueUSD: totalValue,
    change24hUSD: change24h,
    change24hPercent: changePct,
    tokens: positions,
    lastUpdated: main.updated_at || new Date().toISOString(),
  };
}

/** Transaction list → simplified */
export interface FundWiseTransaction {
  id: string;
  type: string;
  description: string;
  amount: string;
  amountUSD: string;
  timestamp: string;
  txHash: string;
  success: boolean;
  iconUrl: string;
}

export function parseTransactions(zerionResponse: any): FundWiseTransaction[] {
  if (!zerionResponse?.data) return [];

  // Zerion may paginate; data is array for /transactions
  const txList = Array.isArray(zerionResponse.data)
    ? zerionResponse.data
    : [zerionResponse.data];

  return txList.map((tx: any) => {
    const attrs = tx.attributes;
    const sent = attrs.sent;
    const received = attrs.received;

    let amount = '';
    let amountUSD = '';
    let description = attrs.description || `${tx.type} transaction`;

    if (sent && received) {
      amount = `-${sent.amount} ${sent.fungible.symbol} → +${received.amount} ${received.fungible.symbol}`;
      description = `Swap ${sent.fungible.symbol} → ${received.fungible.symbol}`;
    } else if (sent) {
      amount = `-${sent.amount} ${sent.fungible.symbol}`;
      description = `Send ${sent.fungible.symbol}`;
    } else if (received) {
      amount = `+${received.amount} ${received.fungible.symbol}`;
      description = `Receive ${received.fungible.symbol}`;
    }

    // USD value from fee? Zerion doesn't include USD in tx directly. Caller can compute.
    amountUSD = '';

    return {
      id: tx.id,
      type: tx.type,
      description,
      amount,
      amountUSD,
      timestamp: attrs.block_signed_at,
      txHash: attrs.tx_hash,
      success: attrs.success,
      iconUrl: sent?.fungible.icon_url || received?.fungible.icon_url || '',
    };
  });
}
