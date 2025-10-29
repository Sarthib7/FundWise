import { NextRequest, NextResponse } from 'next/server'

const KALSHI_API_KEY = process.env.NEXT_PUBLIC_KALSHI_API_KEY || ''
const KALSHI_BASE_PATH = process.env.NEXT_PUBLIC_KALSHI_BASE_PATH || 'https://demo-api.kalshi.co/trade-api/v2'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    
    console.log('[Kalshi API Route] Searching for:', query)
    
    if (!KALSHI_API_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Kalshi API key not configured',
        markets: [] 
      })
    }
    
    // Per Kalshi OpenAPI spec, /markets endpoint supports:
    // - limit: 1-1000 (default 100)
    // - status: unopened, open, closed, settled
    // - series_ticker, event_ticker, tickers (exact match only)
    // - min_close_ts, max_close_ts (timestamp filters)
    // NO text search parameter exists - must fetch and filter server-side
    
    const params = new URLSearchParams({
      limit: '500', // Reduced to avoid 2MB cache limit (was causing 3.8MB response)
      status: 'open'  // Only fetch open/tradeable markets
    })
    
    const kalshiUrl = `${KALSHI_BASE_PATH}/markets?${params.toString()}`
    console.log('[Kalshi API Route] Fetching from Kalshi API (limit=500, status=open)')
    
    // Fetch from Kalshi API (server-side, no CORS issues)
    const response = await fetch(kalshiUrl, {
      headers: {
        'Authorization': `Bearer ${KALSHI_API_KEY}`,
        'Content-Type': 'application/json'
      }
      // Note: Removed cache config - response is too large (>2MB) for Next.js cache
    })
    
    if (!response.ok) {
      console.error('[Kalshi API Route] API returned status:', response.status)
      return NextResponse.json({ 
        success: false, 
        error: `API returned ${response.status}`,
        markets: [] 
      })
    }
    
    const data = await response.json()
    
    // Handle both /markets and /events endpoint responses
    const items = data?.markets || data?.events || []
    
    if (Array.isArray(items) && items.length > 0) {
      console.log('[Kalshi API Route] ✅ Received', items.length, 'items from Kalshi')
      
      // If no query, return first 20 markets (no filtering needed)
      if (!query || query.trim().length === 0) {
        const allMarkets = items.slice(0, 20).map((item: any) => ({
          ticker: item.ticker || `MARKET-${Date.now()}`,
          event_ticker: item.event_ticker || '',
          // Use actual Kalshi fields: yes_sub_title and no_sub_title
          title: item.yes_sub_title || item.ticker || 'Untitled Market',
          subtitle: item.no_sub_title || '',
          yes_bid: item.yes_bid || 50,
          yes_ask: item.yes_ask || 52,
          no_bid: item.no_bid || 48,
          no_ask: item.no_ask || 50,
          last_price: item.last_price || 50,
          volume: item.volume || 0,
          open_time: item.open_time || new Date().toISOString(),
          close_time: item.close_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiration_time: item.expected_expiration_time || item.close_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: item.status || 'open'
        }))
        
        return NextResponse.json({
          success: true,
          markets: allMarkets
        })
      }
      
      const searchLower = query.toLowerCase().trim()
      const searchWords = searchLower.split(/\s+/)
      
      // Optimized relevance scoring using ACTUAL Kalshi API fields
      const scoreMarket = (item: any): number => {
        // Kalshi API fields (per OpenAPI spec):
        const yesSub = (item.yes_sub_title || '').toLowerCase()
        const noSub = (item.no_sub_title || '').toLowerCase()
        const ticker = (item.ticker || '').toLowerCase()
        const eventTicker = (item.event_ticker || '').toLowerCase()
        
        // Combine all searchable text
        const allText = `${yesSub} ${noSub} ${ticker} ${eventTicker}`.toLowerCase()
        
        let score = 0
        
        // Exact match in any field
        if (yesSub === searchLower || noSub === searchLower) return 1000
        
        // All search words present
        if (searchWords.every(word => allText.includes(word))) score += 500
        
        // Yes subtitle matches (primary field)
        if (yesSub.startsWith(searchLower)) score += 300
        if (yesSub.includes(searchLower)) score += 200
        searchWords.forEach(word => {
          if (yesSub.includes(word)) score += 100
        })
        
        // No subtitle matches
        if (noSub.includes(searchLower)) score += 150
        searchWords.forEach(word => {
          if (noSub.includes(word)) score += 75
        })
        
        // Ticker matches
        if (ticker.includes(searchLower) || eventTicker.includes(searchLower)) score += 50
        
        return score
      }
      
      // Score and filter markets efficiently
      const scoredMarkets = items
        .map((item: any) => ({
          item,
          score: scoreMarket(item)
        }))
        .filter(({ score }) => score > 0) // Only include relevant results
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .slice(0, 20) // Top 20 results
        .map(({ item }) => ({
          ticker: item.ticker || `MARKET-${Date.now()}`,
          event_ticker: item.event_ticker || '',
          // Use actual Kalshi fields: yes_sub_title and no_sub_title
          title: item.yes_sub_title || item.ticker || 'Untitled Market',
          subtitle: item.no_sub_title || '',
          yes_bid: item.yes_bid || 50,
          yes_ask: item.yes_ask || 52,
          no_bid: item.no_bid || 48,
          no_ask: item.no_ask || 50,
          last_price: item.last_price || 50,
          volume: item.volume || 0,
          open_time: item.open_time || new Date().toISOString(),
          close_time: item.close_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expiration_time: item.expected_expiration_time || item.close_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: item.status || 'open'
        }))
      
      console.log('[Kalshi API Route] ✅ Found', scoredMarkets.length, 'relevant markets for:', query)
      
      return NextResponse.json({
        success: true,
        markets: scoredMarkets
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'No events in response',
      markets: [] 
    })
    
  } catch (error: any) {
    console.error('[Kalshi API Route] Error:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      markets: [] 
    })
  }
}

