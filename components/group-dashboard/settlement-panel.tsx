"use client"

import { useState } from "react"
import { WalletAvatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SettlementPreviewDialog } from "@/components/settlement-preview-dialog"
import {
  formatTokenAmount,
  type SettlementTransfer,
} from "@/lib/expense-engine"
import { ArrowRight, Loader2, Send, Share2, Sparkles } from "lucide-react"

type SettlementPanelProps = {
  outgoing: SettlementTransfer[]
  incoming: SettlementTransfer[]
  tokenName: string
  walletAddress: string
  isSettling: boolean
  settlingTransfer: SettlementTransfer | null
  lifiSupported: boolean
  sharingTransferKey: string | null
  memberNameByWallet: Map<string, string>
  onSettle: (transfer: SettlementTransfer) => boolean | Promise<boolean>
  onShareSettlementRequest: (transfer: SettlementTransfer) => void | Promise<void>
  onOpenSettlementFundingRoute: (transfer: SettlementTransfer) => void
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function SettlementPanel({
  outgoing,
  incoming,
  tokenName,
  walletAddress,
  isSettling,
  settlingTransfer,
  lifiSupported,
  sharingTransferKey,
  memberNameByWallet,
  onSettle,
  onShareSettlementRequest,
  onOpenSettlementFundingRoute,
}: SettlementPanelProps) {
  const [previewTransfer, setPreviewTransfer] = useState<SettlementTransfer | null>(null)

  if (outgoing.length === 0 && incoming.length === 0) {
    return null
  }

  const totalCount = outgoing.length + incoming.length

  return (
    <Card className="border-brand-border-c bg-background p-5">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-green-mid" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-green-mid">
          Suggested settlement
        </p>
      </div>
      <p className="mb-4 text-xs text-brand-text-2">
        {totalCount} {totalCount === 1 ? "transfer" : "transfers"} will clear your Balance.
      </p>

      <div className="flex flex-col gap-2">
        {outgoing.map((transfer) => {
          const toName =
            memberNameByWallet.get(transfer.to) || shortWallet(transfer.to)
          return (
            <div
              key={`out-${transfer.from}-${transfer.to}`}
              className="flex items-center gap-2.5 rounded-xl border border-brand-border-c bg-brand-surface p-2.5"
            >
              <WalletAvatar address={transfer.from} size={26} />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-text-3" aria-hidden />
              <WalletAvatar address={transfer.to} size={26} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-foreground">
                  You → {toName}
                </div>
                <div className="font-serif text-sm tabular-nums tracking-[-0.2px] text-brand-red">
                  {formatTokenAmount(transfer.amount)} {tokenName}
                </div>
              </div>
              <Button
                size="sm"
                className="h-9 w-9 shrink-0 bg-accent p-0 hover:bg-accent/90"
                disabled={isSettling}
                onClick={() => setPreviewTransfer(transfer)}
                aria-label={`Settle ${formatTokenAmount(transfer.amount)} ${tokenName} to ${toName}`}
              >
                {isSettling && settlingTransfer === transfer ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
            </div>
          )
        })}

        {incoming.map((transfer) => {
          const fromName =
            memberNameByWallet.get(transfer.from) || shortWallet(transfer.from)
          const key = `${transfer.from}:${transfer.to}`
          const isSharing = sharingTransferKey === key
          return (
            <div
              key={`in-${key}`}
              className="flex items-center gap-2.5 rounded-xl border border-brand-border-c bg-brand-surface p-2.5"
            >
              <WalletAvatar address={transfer.from} size={26} />
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-brand-text-3" aria-hidden />
              <WalletAvatar address={transfer.to} size={26} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-foreground">
                  {fromName} → You
                </div>
                <div className="font-serif text-sm tabular-nums tracking-[-0.2px] text-brand-green-mid">
                  {formatTokenAmount(transfer.amount)} {tokenName}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 shrink-0 p-0"
                disabled={isSharing}
                onClick={() => onShareSettlementRequest(transfer)}
                aria-label={`Nudge ${fromName} to settle`}
              >
                {isSharing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                )}
              </Button>
            </div>
          )
        })}
      </div>

      {previewTransfer ? (
        <SettlementPreviewDialog
          open={Boolean(previewTransfer)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setPreviewTransfer(null)
          }}
          transfer={previewTransfer}
          tokenName={tokenName}
          viewerWallet={walletAddress}
          isSettling={isSettling}
          lifiSupported={lifiSupported}
          onOpenFundingRoute={() => onOpenSettlementFundingRoute(previewTransfer)}
          onConfirm={async () => {
            const didSettle = await onSettle(previewTransfer)
            if (didSettle) setPreviewTransfer(null)
            return didSettle
          }}
        />
      ) : null}
    </Card>
  )
}
