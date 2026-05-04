import { getQuote, executeRoute, convertQuoteToRoute, type RouteExtended } from "@lifi/sdk"
import {
  CHAIN_NAMES,
  ensureLifiChainsLoaded,
  LIFI_CHAINS,
  USDC_ADDRESSES,
} from "./lifi-config"

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
  route: RouteExtended
}

export interface BridgeStatus {
  status: "idle" | "quoting" | "signing" | "executing" | "done" | "error"
  txHash?: string
  txLink?: string
  message?: string
}

/**
 * Get a quote for bridging USDC from one chain to Solana.
 */
export async function getBridgeQuote(params: {
  fromChain: number
  fromAmount: string // in human-readable (e.g., "10" for 10 USDC)
  fromAddress: string
  toAddress: string
}): Promise<BridgeQuote> {
  await ensureLifiChainsLoaded()

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
    toAddress: params.toAddress,
    slippage: 0.005,
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
  route: RouteExtended,
  onStatusChange: (status: BridgeStatus) => void
): Promise<{ txHash?: string }> {
  await ensureLifiChainsLoaded()
  onStatusChange({ status: "executing", message: "Preparing top-up..." })

  try {
    const result = await executeRoute(route, {
      updateRouteHook: (updatedRoute) => {
        const processes = updatedRoute.steps.flatMap((step) => step.execution?.process || [])
        const latestProcessWithTx = [...processes].reverse().find((process) => process.txHash)
        const failedProcess = processes.find((process) => process.status === "FAILED")
        const requiresAction = processes.find(
          (process) =>
            process.status === "ACTION_REQUIRED" ||
            process.status === "MESSAGE_REQUIRED" ||
            process.status === "RESET_REQUIRED"
        )
        const pendingProcess = [...processes].reverse().find(
          (process) => process.status === "PENDING"
        )
        const isDone = updatedRoute.steps.every((step) => step.execution?.status === "DONE")

        if (failedProcess) {
          onStatusChange({
            status: "error",
            txHash: latestProcessWithTx?.txHash,
            txLink: latestProcessWithTx?.txLink,
            message: failedProcess.error?.message || failedProcess.message || "Top-up failed",
          })
          return
        }

        if (requiresAction) {
          onStatusChange({
            status: "signing",
            txHash: latestProcessWithTx?.txHash,
            txLink: latestProcessWithTx?.txLink,
            message: requiresAction.message || "Approve the transaction in your wallet",
          })
          return
        }

        if (isDone) {
          onStatusChange({
            status: "done",
            txHash: latestProcessWithTx?.txHash,
            txLink: latestProcessWithTx?.txLink,
            message: "Top-up complete!",
          })
          return
        }

        if (pendingProcess) {
          onStatusChange({
            status: "executing",
            txHash: latestProcessWithTx?.txHash,
            txLink: latestProcessWithTx?.txLink,
            message: pendingProcess.message || "Top-up in progress...",
          })
        }
      },
    })

    const txHash = [...result.steps.flatMap((step) => step.execution?.process || [])]
      .reverse()
      .find((process) => process.txHash)?.txHash
    return { txHash }
  } catch (error) {
    onStatusChange({
      status: "error",
      message: error instanceof Error ? error.message : "Top-up failed",
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
