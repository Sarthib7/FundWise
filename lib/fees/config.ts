/**
 * Fees Module config (FW-066, ADR-0036).
 *
 * Resolves the platform fee wallet and per-cluster USDC mint at the
 * caller boundary, so the quote functions stay pure. `FUNDWISE_PLATFORM_FEE_WALLET`
 * is read lazily here — its absence is a clear error only when fees are
 * quoted, not at server boot. This keeps non-Fund-Mode surfaces (Split
 * Mode, public reads) bootable in environments where the fee wallet
 * hasn't been provisioned yet.
 */

import { PublicKey } from "@solana/web3.js"
import { FundWiseError } from "@/lib/server/fundwise-error"
import type { FeeCluster } from "./types"

// Mainnet USDC and devnet test USDC per ADR-0032. Custom clusters fall
// back to the devnet mint so local tests with a custom RPC still get a
// valid mint without operator config.
const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

export type FeeRates = {
  /** Flat creation fee in USDC base units. $5.00 = 5_000_000 (6 decimals). */
  creationFlatUsdc: bigint
  /** Buyer-pays contribution fee. 50 bps = 0.5%. */
  contributionBps: number
  /** Reimbursement fee paid from Treasury alongside the principal leg. */
  reimbursementBps: number
  /** Cross-chain routing fee on CCTP/LI.FI inbound. */
  routingBps: number
}

export type FeeConfig = {
  cluster: FeeCluster
  platformFeeWallet: PublicKey
  /** Only billable stablecoin at launch per ADR-0032. */
  usdcMint: PublicKey
  rates: FeeRates
}

export const DEFAULT_FEE_RATES: FeeRates = {
  creationFlatUsdc: 5_000_000n, // $5.00 USDC at 6 decimals
  contributionBps: 50, // 0.5%
  reimbursementBps: 50, // 0.5%
  routingBps: 25, // 0.25%
}

export function getUsdcMintForCluster(cluster: FeeCluster): PublicKey {
  if (cluster === "mainnet-beta") {
    return new PublicKey(USDC_MINT_MAINNET)
  }
  // Devnet + custom clusters use the devnet USDC mint by default.
  return new PublicKey(USDC_MINT_DEVNET)
}

/**
 * Reads `FUNDWISE_PLATFORM_FEE_WALLET` lazily; throws a `FundWiseError(500)`
 * if it isn't configured or isn't a valid base58 Solana pubkey. Callers
 * should treat this as an operator-config failure, not user input.
 */
export function getFeeConfig(cluster: FeeCluster): FeeConfig {
  const raw = process.env.FUNDWISE_PLATFORM_FEE_WALLET?.trim()

  if (!raw) {
    throw new FundWiseError(
      "FUNDWISE_PLATFORM_FEE_WALLET is not configured. Fees cannot be quoted until the operator provisions a platform fee wallet.",
      500
    )
  }

  let platformFeeWallet: PublicKey
  try {
    platformFeeWallet = new PublicKey(raw)
  } catch {
    throw new FundWiseError(
      "FUNDWISE_PLATFORM_FEE_WALLET is not a valid base58 Solana pubkey.",
      500
    )
  }

  return {
    cluster,
    platformFeeWallet,
    usdcMint: getUsdcMintForCluster(cluster),
    rates: DEFAULT_FEE_RATES,
  }
}
