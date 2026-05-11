"use client"

import { useCallback, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { getBridgeQuote, executeBridgeRoute, getSupportedSourceChains, type BridgeQuote, type BridgeStatus } from "@/lib/lifi-bridge"
import { parseUsdcAmount } from "@/lib/parse-usdc-amount"
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
  flow?: "settlement" | "contribution"
  initialAmount?: string
  onSuccess?: (txHash: string, amount: string) => void
}

export function CrossChainBridgeModal({
  open,
  onOpenChange,
  destinationAddress,
  groupName,
  flow = "settlement",
  initialAmount = "",
  onSuccess,
}: CrossChainBridgeModalProps) {
  const sourceChains = getSupportedSourceChains()
  const lifiSupported = isLifiSupportedForCurrentCluster()
  const clusterLabel = getFundWiseClusterLabel()

  const [selectedChain, setSelectedChain] = useState(sourceChains[1] ?? sourceChains[0])
  const [amount, setAmount] = useState("")
  const [quote, setQuote] = useState<BridgeQuote | null>(null)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ status: "idle" })
  const [isQuoting, setIsQuoting] = useState(false)
  const [evmWallet, setEvmWallet] = useState<InjectedEvmWallet | null>(null)
  const [isConnectingEvmWallet, setIsConnectingEvmWallet] = useState(false)

  const needsWalletConnection = !evmWallet
  const needsAmount = !amount.trim()
  const flowLabel = flow === "contribution" ? "Contribution" : "Settlement"
  const finalActionLabel = flow === "contribution" ? "Contribute" : "Settle"

  useEffect(() => {
    if (!open) {
      return
    }

    setAmount(initialAmount)
    setQuote(null)
    setBridgeStatus({ status: "idle" })

    getInjectedEvmWallet()
      .then((wallet) => {
        setEvmWallet(wallet)
        setLifiEvmProvider(wallet)
      })
      .catch((error) => {
        console.error("[FundWise] Failed to read injected EVM wallet:", error)
      })
  }, [initialAmount, open])

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

  const [amountError, setAmountError] = useState<string | null>(null)

  const handleGetQuote = useCallback(async () => {
    if (!amount || !evmWallet || !destinationAddress) return

    const parsed = parseUsdcAmount(amount)
    if (!parsed.ok) {
      setAmountError(parsed.error)
      return
    }
    setAmountError(null)

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
        toast.success(`Route submitted. Return to the ${flowLabel} after confirmation.`)
        onSuccess?.(result.txHash || "", quote.toAmount)
        setQuote(null)
        setAmount("")
        onOpenChange(false)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Funding route failed")
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
          <DialogTitle>Route Funds For {flowLabel}</DialogTitle>
          <DialogDescription>
            If the USDC for this {flowLabel} is on another supported network, FundWise uses LI.FI to route it and then returns you to {groupName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {!lifiSupported && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              LI.FI routes into Solana mainnet. FundWise is currently configured for {clusterLabel}, so this funding route is disabled until the app moves to mainnet.
            </div>
          )}

          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Destination Wallet</p>
            <p className="mt-2 break-all font-mono text-sm">{destinationAddress}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              This is the wallet that will complete the final FundWise {flowLabel}.
            </p>
          </div>

          {lifiSupported && (
            <div className="space-y-2">
              <Label>Wallet holding your USDC</Label>
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
                  className="min-h-11 w-full justify-between bg-transparent"
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
            <Label>Funds are currently on</Label>
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
                  className={`min-h-10 ${selectedChain.chainId === chain.chainId ? "bg-accent hover:bg-accent/90" : ""}`}
                >
                  {chain.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick the network where your USDC already sits before previewing the route.
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="bridge-amount">Amount (USDC)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="bridge-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setQuote(null)
                  setAmountError(null)
                }}
              />
              <Button
                variant="outline"
                className="min-h-11 sm:min-w-28"
                onClick={handleGetQuote}
                disabled={!lifiSupported || !amount || !evmWallet || isQuoting}
              >
                {isQuoting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview route"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This should match the {flowLabel} amount unless you want to route extra USDC.
            </p>
            {amountError && (
              <p className="text-xs text-red-600 dark:text-red-400">{amountError}</p>
            )}
          </div>

          {lifiSupported && !quote && (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm">
              <p className="font-medium">
                {needsWalletConnection
                  ? "Step 1: connect the EVM wallet that holds your USDC"
                  : needsAmount
                    ? "Step 2: enter a USDC amount to preview the route"
                    : isQuoting
                      ? "Finding the best route into Solana"
                      : "Step 3: review the route before funds move"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {needsWalletConnection
                  ? "FundWise uses your injected EVM wallet to source the LI.FI route and request the needed signatures."
                  : needsAmount
                    ? "We only fetch the route once you provide an amount, so the min received and estimated timing stay accurate."
                    : isQuoting
                      ? "This usually takes a moment while LI.FI compares routes and fees."
                      : "You’ll see the expected amount out, minimum received, and provider before funds move."}
              </p>
            </div>
          )}

          {/* Funding route display */}
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
                  Destination wallet: {destinationAddress.slice(0, 6)}...{destinationAddress.slice(-4)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  After routing confirms, return here and press {finalActionLabel}.
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
              className="min-h-11 w-full bg-accent hover:bg-accent/90"
              onClick={handleExecute}
              disabled={
                !lifiSupported ||
                !evmWallet ||
                bridgeStatus.status === "signing"
              }
            >
              {bridgeStatus.status === "signing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Waiting for signature...
                </>
              ) : (
                <>
                  Route Funds For {flowLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {/* LI.FI Attribution */}
          <p className="text-xs text-center text-muted-foreground">
            Powered by <span className="font-medium">LI.FI</span> — cross-chain routing
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
