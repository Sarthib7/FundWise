"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react"
import { getBridgeQuote, executeBridgeRoute, getSupportedSourceChains, type BridgeQuote, type BridgeStatus } from "@/lib/lifi-bridge"
import { CHAIN_NAMES } from "@/lib/lifi-config"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "sonner"

interface CrossChainBridgeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinationAddress: string // Solana address receiving the funds
  groupId: string
  groupName: string
  onSuccess?: (txHash: string, amount: string) => void
}

export function CrossChainBridgeModal({
  open,
  onOpenChange,
  destinationAddress,
  groupId,
  groupName,
  onSuccess,
}: CrossChainBridgeModalProps) {
  const { publicKey, connected } = useWallet()
  const sourceChains = getSupportedSourceChains()

  const [selectedChain, setSelectedChain] = useState(sourceChains[1]) // Default to Base
  const [amount, setAmount] = useState("")
  const [quote, setQuote] = useState<BridgeQuote | null>(null)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({ status: "idle" })
  const [isQuoting, setIsQuoting] = useState(false)

  const walletAddress = publicKey?.toString() || ""

  const handleGetQuote = useCallback(async () => {
    if (!amount || !walletAddress) return
    setIsQuoting(true)
    setBridgeStatus({ status: "quoting" })
    try {
      const bridgeQuote = await getBridgeQuote({
        fromChain: selectedChain.chainId,
        fromAmount: amount,
        fromAddress: walletAddress, // For MVP, we use the Solana address; in production, detect EVM wallet
      })
      setQuote(bridgeQuote)
      setBridgeStatus({ status: "idle" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get quote")
      setBridgeStatus({ status: "error", message: error instanceof Error ? error.message : "Quote failed" })
    } finally {
      setIsQuoting(false)
    }
  }, [amount, walletAddress, selectedChain])

  const handleExecute = async () => {
    if (!quote) return
    try {
      const result = await executeBridgeRoute(quote.route, setBridgeStatus)
      if (bridgeStatus.status === "done" || result.txHash) {
        toast.success("Bridge complete! USDC is on Solana.")
        onSuccess?.(result.txHash || "", quote.toAmount)
      }
    } catch (error) {
      toast.error("Bridge failed")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cross-Chain Contribution</DialogTitle>
          <DialogDescription>
            Bridge USDC from {CHAIN_NAMES[selectedChain.chainId]} to Solana and contribute to {groupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Source Chain Selection */}
          <div className="space-y-2">
            <Label>Bridge From</Label>
            <div className="grid grid-cols-3 gap-2">
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
            <div className="flex gap-2">
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
                onClick={handleGetQuote}
                disabled={!amount || isQuoting}
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

              <div className="flex items-center gap-3 justify-center py-2">
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
              <div className="flex items-center gap-2">
                {bridgeStatus.status === "done" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                {bridgeStatus.status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
                {(bridgeStatus.status === "executing" || bridgeStatus.status === "signing") && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
                <div>
                  <p className="font-medium text-sm">{bridgeStatus.message || bridgeStatus.status}</p>
                  {bridgeStatus.txHash && (
                    <a
                      href={`https://solscan.io/tx/${bridgeStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline flex items-center gap-1 mt-1"
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
              disabled={bridgeStatus.status === "signing" || bridgeStatus.status === "executing"}
            >
              {bridgeStatus.status === "signing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Waiting for signature...
                </>
              ) : (
                <>
                  Bridge & Contribute
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
