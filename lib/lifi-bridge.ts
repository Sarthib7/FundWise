import { getQuote, executeRoute, convertQuoteToRoute, type Route } from "@lifi/sdk"
import { initLifiConfig, USDC_ADDRESSES, CHAIN_NAMES, LIFI_CHAINS } from "./lifi-config"

initLifiConfig()

export interface BridgeQuote {
  fromChain: number
  toChain: number
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  toAmountMin: string
  estimatedDuration: string
  tool: string
  route: Route
}

export interface BridgeStatus {
  status: "idle" | "quoting" | "signing" | "executing" | "done" | "error"
  txHash?: string
  message?: string
}

/**
 * Get a quote for bridging USDC from one chain to Solana.
 */
export async function getBridgeQuote(params: {
  fromChain: number
  fromAmount: string // in human-readable (e.g., "10" for 10 USDC)
  fromAddress: string
}): Promise<BridgeQuote> {
  const fromToken = USDC_ADDRESSES[params.fromChain]
  const toToken = USDC_ADDRESSES[LIFI_CHAINS.SOLANA]

  if (!fromToken || !toToken) {
    throw new Error(`Unsupported chain: ${CHAIN_NAMES[params.fromChain] || params.fromChain}`)
  }

  // Convert human-readable amount to smallest unit (USDC has 6 decimals)
  const amountInSmallestUnit = (parseFloat(params.fromAmount) * 1e6).toString()

  const quote = await getQuote({
    fromChain: params.fromChain,
    toChain: LIFI_CHAINS.SOLANA,
    fromToken,
    toToken,
    fromAmount: amountInSmallestUnit,
    fromAddress: params.fromAddress,
  })

  const route = convertQuoteToRoute(quote)

  return {
    fromChain: params.fromChain,
    toChain: LIFI_CHAINS.SOLANA,
    fromToken,
    toToken,
    fromAmount: params.fromAmount,
    toAmount: (Number(quote.estimate.toAmount) / 1e6).toFixed(2),
    toAmountMin: (Number(quote.estimate.toAmountMin) / 1e6).toFixed(2),
    estimatedDuration: quote.estimate.executionDuration?.toString() || "~2 min",
    tool: quote.tool || "LI.FI",
    route,
  }
}

/**
 * Execute a bridge route. The SDK handles wallet popup for signing.
 * Returns the execution result with tx hashes.
 */
export async function executeBridgeRoute(
  route: Route,
  onStatusChange: (status: BridgeStatus) => void
): Promise<{ txHash?: string }> {
  onStatusChange({ status: "executing" })

  try {
    const result = await executeRoute(route, {
      updateRouteHook: (updatedRoute) => {
        const step = updatedRoute.steps[0]
        if (step?.execution) {
          switch (step.execution.status) {
            case "ACTION_REQUIRED":
              onStatusChange({ status: "signing", message: "Please sign in your wallet" })
              break
            case "WAIT_USER":
              onStatusChange({ status: "signing", message: "Confirm in wallet" })
              break
            case "PENDING":
              onStatusChange({
                status: "executing",
                txHash: step.execution.txHash,
                message: "Bridge in progress...",
              })
              break
            case "DONE":
              onStatusChange({
                status: "done",
                txHash: step.execution.txHash,
                message: "Bridge complete!",
              })
              break
            case "FAILED":
              onStatusChange({
                status: "error",
                message: step.execution.process[0]?.message || "Bridge failed",
              })
              break
          }
        }
      },
    })

    const txHash = result.steps[0]?.execution?.txHash
    return { txHash }
  } catch (error) {
    onStatusChange({
      status: "error",
      message: error instanceof Error ? error.message : "Bridge execution failed",
    })
    throw error
  }
}

/**
 * Get list of supported source chains for bridging to Solana.
 */
export function getSupportedSourceChains() {
  return [
    { chainId: LIFI_CHAINS.ETHEREUM, name: "Ethereum" },
    { chainId: LIFI_CHAINS.BASE, name: "Base" },
    { chainId: LIFI_CHAINS.ARBITRUM, name: "Arbitrum" },
    { chainId: LIFI_CHAINS.OPTIMISM, name: "Optimism" },
    { chainId: LIFI_CHAINS.POLYGON, name: "Polygon" },
  ]
}
