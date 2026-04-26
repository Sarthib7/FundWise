"use client"

import { useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { getBridgeQuote, executeBridgeRoute, getSupportedSourceChains, type BridgeQuote, type BridgeStatus } from "@/lib/lifi-bridge"
import {
  CHAIN_NAMES,
  ensureLifiChainsLoaded,
  getInjectedEvmWallet,
  isLifiSupportedForCurrentCluster,
  requestInjectedEvmWallet,
  setLifiEvmProvider,
  type InjectedEvmWallet,
} from "@/lib/lifi-config"
import { toast } from "sonner"
import { getFundWiseClusterLabel } from "@/lib/solana-cluster"

interface CrossChainBridgeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinationAddress: string
  groupName: string
  onSuccess?: (txHash: string, amount: string) => void
}

export function CrossChainBridgeModal({
  open,
  onOpenChange,
  destinationAddress,
  groupName,
  onSuccess,
}: CrossChainBridgeModalProps) {
  const sourceChains = getSupportedSourceChains()
  const lifiSupported = isLifiSupportedForCurrentCluster()
  const clusterLabel = getFundWiseClusterLabel()

  const [selectedChain, setSelectedChain] = useState(sourceChains[1]) // Default to Base
  const [amount, setAmount] = useState("")
  const [quote, setQuote] = useState<BridgeQuote | null>(null)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ status: "idle" })
  const [isQuoting, setIsQuoting] = useState(false)
  const [evmWallet, setEvmWallet] = useState<InjectedEvmWallet | null>(null)
  const [isConnectingEvmWallet, setIsConnectingEvmWallet] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    getInjectedEvmWallet()
      .then((wallet) => {
        setEvmWallet(wallet)
        setLifiEvmProvider(wallet)
      })
      .catch((error) => {
        console.error("[FundWise] Failed to read injected EVM wallet:", error)
      })
  }, [open])

  const handleConnectEvmWallet = async () => {
    setIsConnectingEvmWallet(true)
    try {
      await ensureLifiChainsLoaded()
      const wallet = await requestInjectedEvmWallet()
      setLifiEvmProvider(wallet)
      setEvmWallet(wallet)
      toast.success("EVM wallet connected")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect EVM wallet")
    } finally {
      setIsConnectingEvmWallet(false)
    }
  }

  const handleGetQuote = useCallback(async () => {
    if (!amount || !evmWallet || !destinationAddress) return
    setIsQuoting(true)
    setBridgeStatus({ status: "quoting" })
    try {
      await ensureLifiChainsLoaded()
      setLifiEvmProvider(evmWallet)

      const bridgeQuote = await getBridgeQuote({
        fromChain: selectedChain.chainId,
        fromAmount: amount,
        fromAddress: evmWallet.address,
        toAddress: destinationAddress,
      })
      setQuote(bridgeQuote)
      setBridgeStatus({ status: "idle" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get quote")
      setBridgeStatus({ status: "error", message: error instanceof Error ? error.message : "Quote failed" })
    } finally {
      setIsQuoting(false)
    }
  }, [amount, destinationAddress, evmWallet, selectedChain])

  const handleExecute = async () => {
    if (!quote || !evmWallet) return
    try {
      setLifiEvmProvider(evmWallet)
      const result = await executeBridgeRoute(quote.route, setBridgeStatus)
      if (result.txHash) {
        toast.success("Bridge submitted. Funds will arrive on Solana after confirmation.")
        onSuccess?.(result.txHash || "", quote.toAmount)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bridge failed")
    }
  }

  const handleClose = () => {
    if (bridgeStatus.status === "executing" || bridgeStatus.status === "signing") return
    setQuote(null)
    setAmount("")
    setBridgeStatus({ status: "idle" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bridge USDC To Solana</DialogTitle>
          <DialogDescription>
            Bridge USDC from an EVM chain into your connected Solana wallet so you can settle balances in {groupName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {!lifiSupported && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              LI.FI routes bridge into Solana mainnet. FundWise is currently configured for {clusterLabel}, so this flow is disabled until you switch the app to mainnet.
            </div>
          )}

          {lifiSupported && (
            <div className="space-y-2">
              <Label>EVM Source Wallet</Label>
              {evmWallet ? (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {evmWallet.address.slice(0, 6)}...{evmWallet.address.slice(-4)}
                    </span>
                    <Badge variant="secondary">
                      {CHAIN_NAMES[evmWallet.chainId] || `Chain ${evmWallet.chainId}`}
                    </Badge>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                  onClick={handleConnectEvmWallet}
                  disabled={isConnectingEvmWallet}
                >
                  {isConnectingEvmWallet ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting EVM wallet...
                    </>
                  ) : (
                    "Connect EVM wallet"
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Source Chain Selection */}
          <div className="space-y-2">
            <Label>Bridge From</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {sourceChains.map((chain) => (
                <Button
                  key={chain.chainId}
                  variant={selectedChain.chainId === chain.chainId ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedChain(chain)
                    setQuote(null)
                  }}
                  className={selectedChain.chainId === chain.chainId ? "bg-accent hover:bg-accent/90" : ""}
                >
                  {chain.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount (USDC)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setQuote(null)
                }}
              />
              <Button
                variant="outline"
                className="sm:min-w-24"
                onClick={handleGetQuote}
                disabled={!lifiSupported || !amount || !evmWallet || isQuoting}
              >
                {isQuoting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Quote"}
              </Button>
            </div>
          </div>

          {/* Bridge Route Display */}
          {quote && (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Route</span>
                <Badge variant="secondary">{quote.tool}</Badge>
              </div>

              <div className="flex flex-col items-center justify-center gap-3 py-2 text-center sm:flex-row">
                <div className="text-center">
                  <p className="font-semibold">{quote.fromAmount} USDC</p>
                  <p className="text-xs text-muted-foreground">{CHAIN_NAMES[quote.fromChain]}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-accent" />
                <div className="text-center">
                  <p className="font-semibold">{quote.toAmount} USDC</p>
                  <p className="text-xs text-muted-foreground">{CHAIN_NAMES[quote.toChain]}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Min received: {quote.toAmountMin} USDC</span>
                <span>~{quote.estimatedDuration}</span>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Destination: {destinationAddress.slice(0, 6)}...{destinationAddress.slice(-4)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Funds land in your connected Solana wallet, not directly in a group treasury.
                </p>
              </div>
            </div>
          )}

          {/* Status Display */}
          {bridgeStatus.status !== "idle" && bridgeStatus.status !== "quoting" && (
            <div className={`p-4 rounded-lg border ${
              bridgeStatus.status === "done" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" :
              bridgeStatus.status === "error" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
              "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}>
              <div className="flex items-start gap-2">
                {bridgeStatus.status === "done" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {bridgeStatus.status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
                {(bridgeStatus.status === "executing" || bridgeStatus.status === "signing") && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                <div>
                  <p className="font-medium text-sm">{bridgeStatus.message || bridgeStatus.status}</p>
                  {bridgeStatus.txLink && (
                    <a
                      href={bridgeStatus.txLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      View on explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          {quote && bridgeStatus.status !== "done" && bridgeStatus.status !== "executing" && (
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={handleExecute}
              disabled={
                !lifiSupported ||
                !evmWallet ||
                bridgeStatus.status === "signing" ||
                bridgeStatus.status === "executing"
              }
            >
              {bridgeStatus.status === "signing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Waiting for signature...
                </>
              ) : (
                <>
                  Bridge To My Solana Wallet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {/* LI.FI Attribution */}
          <p className="text-xs text-center text-muted-foreground">
            Powered by <span className="font-medium">LI.FI</span> — cross-chain bridge aggregation
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
