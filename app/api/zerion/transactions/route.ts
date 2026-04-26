/**
 * Next.js API Route — GET /api/zerion/transactions
 *
 * Proxies Zerion transaction history request (server-side only).
 *
 * Query params:
 *   ?address=0x... or SOL_PUBLIC_KEY_BASE58
 *   &limit=10 (default 10, max 100)
 *
 * Response: [ { id, type, description, amount, amountUSD, timestamp, txHash, success, iconUrl }, ... ]
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchTransactions } from '@/lib/zerion/wallet-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');
  const limitParam = searchParams.get('limit');

  if (!address) {
    return NextResponse.json(
      { error: 'Address query parameter required' },
      { status: 400 }
    );
  }

  const limit = Math.min(parseInt(limitParam || '10', 10), 100);

  try {
    const transactions = await fetchTransactions(address, limit);
    return NextResponse.json(transactions);
  } catch (err) {
    console.error('[api/zerion/transactions] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
