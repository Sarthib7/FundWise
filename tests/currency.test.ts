import { afterEach, describe, expect, it, vi } from "vitest"
import { convertToUsd, fetchUsdRates } from "@/lib/currency"

describe("currency conversion", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("converts supported Source Currencies into USD rates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            result: "success",
            base_code: "USD",
            rates: {
              USD: 1,
              EUR: 0.8,
              GBP: 0.5,
              INR: 100,
              AED: 4,
            },
          }),
          { status: 200 }
        )
      )
    )

    const rates = await fetchUsdRates()

    expect(rates.USD).toBe(1)
    expect(rates.EUR).toBe(1.25)
    expect(rates.GBP).toBe(2)
    expect(rates.INR).toBe(0.01)
    expect(rates.AED).toBe(0.25)
  })

  it("returns the converted USD amount and Exchange Rate Snapshot", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            result: "success",
            base_code: "USD",
            rates: {
              USD: 1,
              EUR: 0.8,
            },
          }),
          { status: 200 }
        )
      )
    )

    const result = await convertToUsd(10, "EUR")

    expect(result).toEqual({ usdAmount: 12.5, rate: 1.25 })
  })
})
