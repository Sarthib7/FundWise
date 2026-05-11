import { FundWiseError } from "@/lib/server/fundwise-error"

/**
 * Minimal mainnet-launch sanctions screen.
 *
 * Source: OFAC SDN XML (`https://www.treasury.gov/ofac/downloads/sdn.xml`),
 * field `Digital Currency Address - SOL`, checked on 2026-05-11.
 * Refresh cadence for launch: re-check before mainnet rehearsal and then monthly
 * until a managed compliance provider replaces this static list.
 */
export const SANCTIONED_SOLANA_WALLETS = new Set<string>([
  "42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi",
])

export function isSanctionedSolanaWallet(wallet: string) {
  return SANCTIONED_SOLANA_WALLETS.has(wallet)
}

export function assertWalletIsAllowed(wallet: string) {
  if (isSanctionedSolanaWallet(wallet)) {
    throw new FundWiseError("This wallet is not supported by FundWise.", 403)
  }
}
