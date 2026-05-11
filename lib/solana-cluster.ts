const DEFAULT_SOLANA_RPC_URL = "https://api.devnet.solana.com"

export type FundWiseCluster = "mainnet-beta" | "devnet" | "custom"

export function getSolanaRpcUrl() {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    DEFAULT_SOLANA_RPC_URL
  )
}

export function getSolanaRpcFallbackUrls(): string[] {
  const raw =
    process.env.SOLANA_RPC_FALLBACK_URLS ??
    process.env.NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS ??
    ""
  return raw
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}

export function getSolanaRpcUrls(): string[] {
  const primary = getSolanaRpcUrl()
  const fallbacks = getSolanaRpcFallbackUrls()
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const url of [primary, ...fallbacks]) {
    if (!seen.has(url)) {
      seen.add(url)
      ordered.push(url)
    }
  }
  return ordered
}

export function getSolanaRpcFallbackUrls(): string[] {
  const raw = process.env.NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS ?? ""
  return raw
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}

export function getSolanaRpcUrls(): string[] {
  const primary = getSolanaRpcUrl()
  const fallbacks = getSolanaRpcFallbackUrls()
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const url of [primary, ...fallbacks]) {
    if (!seen.has(url)) {
      seen.add(url)
      ordered.push(url)
    }
  }
  return ordered
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

export function getSolanaExplorerAddressUrl(
  address: string,
  rpcUrl: string = getSolanaRpcUrl()
) {
  const cluster = getFundWiseClusterName(rpcUrl)

  if (cluster === "mainnet-beta") {
    return `https://explorer.solana.com/address/${address}`
  }

  if (cluster === "devnet") {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`
  }

  return `https://explorer.solana.com/address/${address}?cluster=custom`
}
