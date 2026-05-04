/**
 * Currency conversion utility for FundWise expenses.
 *
 * Uses a free fiat exchange-rate endpoint to fetch live rates.
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

type ExchangeRateApiResponse = {
  result?: string
  base_code?: string
  rates?: Partial<Record<SupportedCurrency, number>>
}

let rateCache: RateCache | null = null
const CACHE_TTL_MS = 60_000 // 1 minute

/**
 * Fetch USD conversion rates for all supported Source Currencies.
 * Returns a map of currency code → USD rate (1 unit = X USD).
 */
export async function fetchUsdRates(): Promise<Record<string, number>> {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL_MS) {
    return rateCache.rates
  }

  const response = await fetch("https://open.er-api.com/v6/latest/USD")

  if (!response.ok) {
    throw new Error(`Exchange-rate API returned ${response.status}`)
  }

  const data = (await response.json()) as ExchangeRateApiResponse

  if (data.result && data.result !== "success") {
    throw new Error("Exchange-rate API did not return a successful response")
  }

  if (data.base_code !== "USD" || !data.rates) {
    throw new Error("Exchange-rate API returned an unexpected payload")
  }

  const rates: Record<string, number> = { USD: 1.0 }
  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === "USD") {
      continue
    }

    const usdToCurrencyRate = data.rates[currency]
    if (typeof usdToCurrencyRate === "number" && Number.isFinite(usdToCurrencyRate) && usdToCurrencyRate > 0) {
      rates[currency] = 1 / usdToCurrencyRate
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
