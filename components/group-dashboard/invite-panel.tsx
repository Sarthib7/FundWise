"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Copy, Share2 } from "lucide-react"

type InvitePanelProps = {
  groupCode: string
  copied: boolean
  onCopy: () => void
  onOpenInviteDialog: () => void
}

export function InvitePanel({
  groupCode,
  copied,
  onCopy,
  onOpenInviteDialog,
}: InvitePanelProps) {
  return (
    <Card className="border-brand-border-c bg-background p-5">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
        Group invite
      </div>
      <div className="rounded-xl border border-dashed border-brand-border-2 bg-brand-surface px-3 py-2.5 font-mono text-[13px] font-semibold text-brand-green-forest">
        {groupCode}
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1"
          onClick={onCopy}
          aria-label="Copy group code"
        >
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1"
          onClick={onOpenInviteDialog}
          aria-label="Open invite share dialog"
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Share
        </Button>
      </div>
    </Card>
  )
}
