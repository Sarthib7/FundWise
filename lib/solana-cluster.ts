const DEFAULT_SOLANA_RPC_URL = "https://api.devnet.solana.com"
const DEFAULT_SOLANA_DEVNET_RPC_URL = "https://api.devnet.solana.com"
const DEFAULT_SOLANA_MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com"

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

function dedupeRpcUrls(urls: string[]) {
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const url of urls) {
    if (!seen.has(url)) {
      seen.add(url)
      ordered.push(url)
    }
  }

  return ordered
}

export function getSolanaRpcUrls(): string[] {
  return dedupeRpcUrls([getSolanaRpcUrl(), ...getSolanaRpcFallbackUrls()])
}

export function getSolanaRpcUrlForCluster(cluster: FundWiseCluster) {
  if (cluster === "devnet") {
    return (
      process.env.SOLANA_DEVNET_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL ||
      (getFundWiseClusterName(getSolanaRpcUrl()) === "devnet" ? getSolanaRpcUrl() : null) ||
      DEFAULT_SOLANA_DEVNET_RPC_URL
    )
  }

  if (cluster === "mainnet-beta") {
    return (
      process.env.SOLANA_MAINNET_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL ||
      (getFundWiseClusterName(getSolanaRpcUrl()) === "mainnet-beta" ? getSolanaRpcUrl() : null) ||
      DEFAULT_SOLANA_MAINNET_RPC_URL
    )
  }

  return getSolanaRpcUrl()
}

export function getSolanaRpcFallbackUrlsForCluster(cluster: FundWiseCluster): string[] {
  if (cluster === "devnet") {
    const raw =
      process.env.SOLANA_DEVNET_RPC_FALLBACK_URLS ??
      process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_FALLBACK_URLS ??
      ""
    return raw
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
  }

  if (cluster === "mainnet-beta") {
    const raw =
      process.env.SOLANA_MAINNET_RPC_FALLBACK_URLS ??
      process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_FALLBACK_URLS ??
      ""
    return raw
      .split(",")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
  }

  return getSolanaRpcFallbackUrls()
}

export function getSolanaRpcUrlsForCluster(cluster: FundWiseCluster): string[] {
  return dedupeRpcUrls([
    getSolanaRpcUrlForCluster(cluster),
    ...getSolanaRpcFallbackUrlsForCluster(cluster),
  ])
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
