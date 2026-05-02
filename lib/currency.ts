/**
 * Currency conversion utility for FundWise expenses.
 *
 * Uses CoinGecko free tier (30 calls/min) to fetch live rates.
 * ADR-0020 Decision 4, ADR-0017.
 *
 * Supported currencies: USD, EUR, GBP, INR, AED
 * All rates are expressed as: 1 unit of source_currency = X USD
 */

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "AED"] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  AED: "د.إ",
}

export const CURRENCY_DECIMALS: Record<SupportedCurrency, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  AED: 2,
}

type RateCache = {
  rates: Record<string, number>
  fetchedAt: number
}

let rateCache: RateCache | null = null
const CACHE_TTL_MS = 60_000 // 1 minute

/**
 * Fetch USD rates from CoinGecko for all supported currencies.
 * Returns a map of currency code → USD rate (1 unit = X USD).
 */
export async function fetchUsdRates(): Promise<Record<string, number>> {
  // Return cached rates if fresh
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL_MS) {
    return rateCache.rates
  }

  const coinGeckoIds: Record<SupportedCurrency, string> = {
    USD: "usd",
    EUR: "eur",
    GBP: "british-pound",
    INR: "indian-rupee",
    AED: "united-arab-emirates-dirham",
  }

  const ids = Object.values(coinGeckoIds).join(",")
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`CoinGecko API returned ${response.status}`)
  }

  const data = await response.json() as Record<string, { usd: number }>

  // Map coinGecko IDs back to currency codes
  const rates: Record<string, number> = { USD: 1.0 }
  for (const [currency, geckoId] of Object.entries(coinGeckoIds)) {
    if (data[geckoId]?.usd !== undefined) {
      rates[currency] = data[geckoId].usd
    }
  }

  rateCache = { rates, fetchedAt: Date.now() }
  return rates
}

/**
 * Convert an amount from source currency to USD.
 * Returns the USD amount and the rate used.
 */
export async function convertToUsd(
  amount: number,
  sourceCurrency: SupportedCurrency
): Promise<{ usdAmount: number; rate: number }> {
  if (sourceCurrency === "USD") {
    return { usdAmount: amount, rate: 1.0 }
  }

  const rates = await fetchUsdRates()
  const rate = rates[sourceCurrency]

  if (!rate) {
    throw new Error(`No rate available for ${sourceCurrency}`)
  }

  return { usdAmount: amount * rate, rate }
}

/**
 * Format a currency amount for display.
 */
export function formatCurrencyAmount(amount: number, currency: SupportedCurrency): string {
  const decimals = CURRENCY_DECIMALS[currency]
  const symbol = CURRENCY_SYMBOLS[currency]
  const formatted = Math.abs(amount).toFixed(decimals)
  return `${symbol}${formatted}`
}

/**
 * Check if a currency needs conversion (non-USD).
 */
export function needsConversion(currency: SupportedCurrency): boolean {
  return currency !== "USD"
}
