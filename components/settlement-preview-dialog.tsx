"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { formatTokenAmount } from "@/lib/expense-engine"
import type { SettlementTransfer } from "@/lib/expense-engine"
import {
  Loader2,
  Wallet,
  ArrowRight,
  Check,
  AlertTriangle,
} from "lucide-react"

type SettlementPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer: SettlementTransfer
  tokenName: string
  viewerWallet: string
  isSettling: boolean
  lifiSupported?: boolean
  onConfirm: () => void | Promise<void>
  onOpenFundingRoute?: () => void
}

export function SettlementPreviewDialog({
  open,
  onOpenChange,
  transfer,
  tokenName,
  viewerWallet,
  isSettling,
  lifiSupported = false,
  onConfirm,
  onOpenFundingRoute,
}: SettlementPreviewDialogProps) {
  const [confirmed, setConfirmed] = useState(false)

  const isDebtor = viewerWallet === transfer.from
  const fromLabel = transfer.fromName || `${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)}`
  const toLabel = transfer.toName || `${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)}`
  const shortFrom = `${transfer.from.slice(0, 4)}...${transfer.from.slice(-4)}`
  const shortTo = `${transfer.to.slice(0, 4)}...${transfer.to.slice(-4)}`

  const handleConfirm = async () => {
    setConfirmed(true)
    try {
      await onConfirm()
    } catch {
      setConfirmed(false)
    }
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !isSettling) {
      setConfirmed(false)
      onOpenChange(isOpen)
    }
  }

  const handleOpenFundingRoute = () => {
    if (!onOpenFundingRoute || isSettling) {
      return
    }

    setConfirmed(false)
    onOpenChange(false)
    onOpenFundingRoute()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand-mid" />
            Settlement Preview
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              {/* Amount */}
              <div className="text-center py-2">
                <p className="text-3xl font-extrabold">
                  {formatTokenAmount(transfer.amount)} {tokenName}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isDebtor ? "You will send" : `${fromLabel} will send`}
                </p>
              </div>

              {/* Flow */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="text-center">
                  <div className="text-sm font-semibold">{fromLabel}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{shortFrom}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-sm font-semibold">{toLabel}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{shortTo}</div>
                </div>
              </div>

              {/* Details */}
              <div className="rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">{formatTokenAmount(transfer.amount)} {tokenName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funding</span>
                  <span className="font-medium text-right">Wallet first, LI.FI if needed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. fee</span>
                  <span className="font-medium">~0.000005 SOL ≈ $0.001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Finality</span>
                  <span className="font-medium">Instant</span>
                </div>
              </div>

              {/* What happens */}
              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>FundWise checks the funds available for this Settlement</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>If funds are elsewhere, LI.FI can route them before the final transfer</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  <span>You confirm once the Settlement is ready and a Receipt is generated</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {confirmed ? (
          <AlertDialogFooter>
            <div className="flex items-center gap-2 w-full justify-center py-2 text-sm text-muted-foreground">
              {isSettling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirming Settlement…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Settlement submitted
                </>
              )}
            </div>
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettling}>Cancel</AlertDialogCancel>
            {lifiSupported && onOpenFundingRoute ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSettling}
                onClick={handleOpenFundingRoute}
              >
                Route from another network
              </Button>
            ) : null}
            <Button
              className="bg-brand-mid hover:bg-brand-mid/90 text-white"
              onClick={() => void handleConfirm()}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Settle {formatTokenAmount(transfer.amount)} {tokenName}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
