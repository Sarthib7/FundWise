/**
 * Next.js API Route — GET /api/zerion/portfolio
 *
 * Proxies Zerion wallet portfolio request (server-side only).
 * Keeps ZERION_API_KEY out of browser bundle.
 *
 * Query params:
 *   ?address=0x... or SOL_PUBLIC_KEY_BASE58
 *
 * Response: { address, totalValueUSD, change24hUSD, change24hPercent, tokens: [...], lastUpdated }
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPortfolio } from '@/lib/zerion/wallet-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address query parameter required' },
      { status: 400 }
    );
  }

  try {
    const portfolio = await fetchPortfolio(address);

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Zerion API unavailable or wallet not found' },
        { status: 502 }
      );
    }

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error('[api/zerion/portfolio] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
