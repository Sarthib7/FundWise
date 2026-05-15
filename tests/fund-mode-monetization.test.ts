import { describe, expect, it } from "vitest"
import {
  FUND_MODE_BETA_PRICING,
  evaluateFreeTier,
  fundModeBetaAdminWallets,
  isFundModeBetaAdminWallet,
  tokenAmountToUsdCents,
} from "@/lib/fund-mode-monetization"

describe("FUND_MODE_BETA_PRICING", () => {
  it("uses sane defaults for the devnet beta", () => {
    expect(FUND_MODE_BETA_PRICING.creationFeeUsdCents).toBe(500)
    expect(FUND_MODE_BETA_PRICING.creationFeeTokenAmount).toBe(5_000_000)
    expect(FUND_MODE_BETA_PRICING.monthlySubscriptionUsdCents).toBe(1_200)
    expect(FUND_MODE_BETA_PRICING.freeTierMaxMembers).toBe(5)
    expect(FUND_MODE_BETA_PRICING.freeTierMaxAumUsdCents).toBe(100_000)
  })
})

describe("evaluateFreeTier", () => {
  it("returns over-limit when member cap is reached", () => {
    const result = evaluateFreeTier({
      memberCount: 5,
      contributionTotalTokens: 0,
      contributionTotalUsdCents: 0,
    })
    expect(result.memberLimitReached).toBe(true)
    expect(result.aumLimitReached).toBe(false)
    expect(result.overLimit).toBe(true)
  })

  it("returns over-limit when AUM cap is reached", () => {
    const result = evaluateFreeTier({
      memberCount: 1,
      contributionTotalTokens: 0,
      contributionTotalUsdCents: FUND_MODE_BETA_PRICING.freeTierMaxAumUsdCents,
    })
    expect(result.aumLimitReached).toBe(true)
    expect(result.overLimit).toBe(true)
  })

  it("stays under the limit when both caps are unmet", () => {
    const result = evaluateFreeTier({
      memberCount: 3,
      contributionTotalTokens: 0,
      contributionTotalUsdCents: 50_000,
    })
    expect(result.memberLimitReached).toBe(false)
    expect(result.aumLimitReached).toBe(false)
    expect(result.overLimit).toBe(false)
  })
})

describe("tokenAmountToUsdCents", () => {
  it("converts 6-decimal stablecoin amounts to cents", () => {
    // 1 USDC = 1_000_000 smallest units = 100 cents.
    expect(tokenAmountToUsdCents(1_000_000)).toBe(100)
    // 12.34 USDC -> 1234 cents
    expect(tokenAmountToUsdCents(12_340_000)).toBe(1234)
    // 0 token => 0 cents
    expect(tokenAmountToUsdCents(0)).toBe(0)
  })

  it("rejects malformed input", () => {
    expect(tokenAmountToUsdCents(Number.NaN)).toBe(0)
    expect(tokenAmountToUsdCents(-1_000_000)).toBe(0)
  })
})

describe("isFundModeBetaAdminWallet", () => {
  it("reads FUNDWISE_BETA_ADMIN_WALLETS from env", () => {
    const previous = process.env.FUNDWISE_BETA_ADMIN_WALLETS
    process.env.FUNDWISE_BETA_ADMIN_WALLETS = "AdminWalletA, AdminWalletB"

    try {
      expect(fundModeBetaAdminWallets()).toEqual(["AdminWalletA", "AdminWalletB"])
      expect(isFundModeBetaAdminWallet("AdminWalletA")).toBe(true)
      expect(isFundModeBetaAdminWallet("Stranger")).toBe(false)
    } finally {
      if (previous === undefined) {
        delete process.env.FUNDWISE_BETA_ADMIN_WALLETS
      } else {
        process.env.FUNDWISE_BETA_ADMIN_WALLETS = previous
      }
    }
  })

  it("treats an empty env var as empty allowlist", () => {
    const previous = process.env.FUNDWISE_BETA_ADMIN_WALLETS
    process.env.FUNDWISE_BETA_ADMIN_WALLETS = ""
    try {
      expect(fundModeBetaAdminWallets()).toEqual([])
      expect(isFundModeBetaAdminWallet("AdminWalletA")).toBe(false)
    } finally {
      if (previous === undefined) {
        delete process.env.FUNDWISE_BETA_ADMIN_WALLETS
      } else {
        process.env.FUNDWISE_BETA_ADMIN_WALLETS = previous
      }
    }
  })
})
