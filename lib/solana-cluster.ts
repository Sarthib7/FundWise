const DEFAULT_SOLANA_RPC_URL = "https://api.devnet.solana.com"

export type FundWiseCluster = "mainnet-beta" | "devnet" | "custom"

export function getSolanaRpcUrl() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL
}

export function getFundWiseClusterName(rpcUrl: string = getSolanaRpcUrl()): FundWiseCluster {
  const normalizedRpcUrl = rpcUrl.toLowerCase()

  if (normalizedRpcUrl.includes("mainnet")) {
    return "mainnet-beta"
  }

  if (normalizedRpcUrl.includes("devnet")) {
    return "devnet"
  }

  return "custom"
}

export function getFundWiseClusterLabel(rpcUrl: string = getSolanaRpcUrl()) {
  const cluster = getFundWiseClusterName(rpcUrl)

  if (cluster === "mainnet-beta") {
    return "mainnet"
  }

  if (cluster === "devnet") {
    return "devnet"
  }

  return "custom RPC"
}

export function isSolanaMainnetCluster(rpcUrl: string = getSolanaRpcUrl()) {
  return getFundWiseClusterName(rpcUrl) === "mainnet-beta"
}

export function getSolanaExplorerTxUrl(
  signature: string,
  rpcUrl: string = getSolanaRpcUrl()
) {
  const cluster = getFundWiseClusterName(rpcUrl)

  if (cluster === "mainnet-beta") {
    return `https://explorer.solana.com/tx/${signature}`
  }

  if (cluster === "devnet") {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`
  }

  return `https://explorer.solana.com/tx/${signature}?cluster=custom`
}
