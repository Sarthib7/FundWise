import { createConfig, Solana, EVM, config } from "@lifi/sdk"
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base"

let configured = false

export function initLifiConfig() {
  if (configured) return

  createConfig({
    integrator: "FundWise",
    // Default to mainnet chains for LI.FI routing
    // The actual on-chain settlement still uses the app's network (devnet/mainnet)
  })

  configured = true
}

/**
 * Configure LI.FI SDK providers with Solana wallet adapter.
 * Call this from a React effect when the wallet connects.
 */
export function setLifiSolanaProvider(walletAdapter: SignerWalletAdapter | null) {
  if (!walletAdapter) return

  config.setProviders([
    Solana({
      async getWalletAdapter() {
        return walletAdapter
      },
    }),
  ])
}

/**
 * Configure LI.FI SDK with an EVM wallet (for users bridging FROM Ethereum/Base).
 * This is used when we detect the user has tokens on another chain.
 */
export function setLifiEVMProvider(evmProvider: any) {
  config.setProviders([
    EVM({
      getWalletAdapter: () => evmProvider,
    }),
  ])
}

// Supported chains for cross-chain bridge UI
export const LIFI_CHAINS = {
  SOLANA: 1151111081099710,
  ETHEREUM: 1,
  BASE: 8453,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
} as const

// USDC addresses on each chain
export const USDC_ADDRESSES: Record<number, string> = {
  [LIFI_CHAINS.SOLANA]: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // mainnet USDC
  [LIFI_CHAINS.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [LIFI_CHAINS.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [LIFI_CHAINS.ARBITRUM]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [LIFI_CHAINS.OPTIMISM]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  [LIFI_CHAINS.POLYGON]: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
}

export const CHAIN_NAMES: Record<number, string> = {
  [LIFI_CHAINS.SOLANA]: "Solana",
  [LIFI_CHAINS.ETHEREUM]: "Ethereum",
  [LIFI_CHAINS.BASE]: "Base",
  [LIFI_CHAINS.ARBITRUM]: "Arbitrum",
  [LIFI_CHAINS.OPTIMISM]: "Optimism",
  [LIFI_CHAINS.POLYGON]: "Polygon",
}
