// Pricing scaffolding for the Fund Mode devnet beta. None of these values
// are billed. They drive the willingness-to-pay banners and the free-tier
// cap emulation so beta findings can inform real mainnet pricing.

export type FundModeMonetizationKind =
  | "monthly_fee_wtp"
  | "free_tier_cap"
  | "exit_survey"

export const FUND_MODE_BETA_PRICING = {
  // Devnet creation fee paid in test stablecoin to FUNDWISE_BETA_FEE_WALLET.
  // The mainnet-equivalent value is purely advisory at this stage.
  creationFeeUsdCents: 500, // $5.00
  creationFeeTokenAmount: 5_000_000, // 5 USDC at 6 decimals
  // Monthly subscription emulation surfaced to the operator.
  monthlySubscriptionUsdCents: 1_200, // $12.00 / mo
  // Free-tier limits enforced by FW-062.
  freeTierMaxMembers: 5,
  freeTierMaxAumUsdCents: 100_000, // $1,000.00 simulated AUM
} as const

export type FundModeMonetizationPricing = typeof FUND_MODE_BETA_PRICING

export function getFundModeBetaPricing(): FundModeMonetizationPricing {
  return FUND_MODE_BETA_PRICING
}

export type FreeTierUsage = {
  memberCount: number
  contributionTotalTokens: number
  // Contribution total expressed in USD cents using a 1 stablecoin = $1 floor.
  // We use 6 decimals (USDC) as the default; if a Group ships a stablecoin
  // with different decimals later we can wire decimals through here.
  contributionTotalUsdCents: number
}

export function evaluateFreeTier(usage: FreeTierUsage) {
  const memberLimitReached = usage.memberCount >= FUND_MODE_BETA_PRICING.freeTierMaxMembers
  const aumLimitReached =
    usage.contributionTotalUsdCents >= FUND_MODE_BETA_PRICING.freeTierMaxAumUsdCents

  return {
    memberLimitReached,
    aumLimitReached,
    overLimit: memberLimitReached || aumLimitReached,
  }
}

export function tokenAmountToUsdCents(tokenAmount: number, decimals: number = 6) {
  if (!Number.isFinite(tokenAmount) || tokenAmount < 0) {
    return 0
  }
  const denominator = 10 ** Math.max(0, decimals - 2) // 6 - 2 = 4 -> divide by 10000
  return Math.round(tokenAmount / denominator)
}

export function fundModeCreationFeeWallet(): string | null {
  return process.env.FUNDWISE_BETA_FEE_WALLET?.trim() || null
}

export function fundModeBetaAdminWallets(): string[] {
  return (process.env.FUNDWISE_BETA_ADMIN_WALLETS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

export function isFundModeBetaAdminWallet(wallet: string) {
  return fundModeBetaAdminWallets().includes(wallet)
}
