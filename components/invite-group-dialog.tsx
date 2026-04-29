"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { AlertCircle, Copy, Loader2, QrCode, Share2 } from "lucide-react"
import { toast } from "sonner"
import { generateQRCode } from "@/lib/qr-code"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type InviteGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
  groupCode: string
}

export function InviteGroupDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  groupCode,
}: InviteGroupDialogProps) {
  const [inviteUrl, setInviteUrl] = useState("")
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [isCopyingLink, setIsCopyingLink] = useState(false)
  const [isCopyingCode, setIsCopyingCode] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const nextInviteUrl = new URL(`/groups/${groupId}`, window.location.origin)
    nextInviteUrl.searchParams.set("invite", "true")
    const nextInviteHref = nextInviteUrl.toString()

    setInviteUrl(nextInviteHref)
    setQrCodeDataUrl("")
    setQrError(null)
    setIsGeneratingQr(true)

    void generateQRCode(nextInviteHref)
      .then((dataUrl) => {
        setQrCodeDataUrl(dataUrl)
      })
      .catch((error) => {
        console.error("[FundWise] Failed to generate invite QR code:", error)
        setQrError("Couldn’t generate the invite QR code. The link still works.")
      })
      .finally(() => {
        setIsGeneratingQr(false)
      })
  }, [groupId, open])

  const copyInviteLink = async () => {
    if (!inviteUrl) {
      return
    }

    setIsCopyingLink(true)

    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success("Invite link copied")
    } catch {
      toast.error("Failed to copy invite link")
    } finally {
      setIsCopyingLink(false)
    }
  }

  const shareInviteLink = async () => {
    if (!inviteUrl) {
      return
    }

    setIsSharing(true)

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `Join ${groupName} on FundWise`,
          text: `Open this FundWise Group invite to review ${groupName} and join with your wallet.`,
          url: inviteUrl,
        })
        toast.success("Invite link shared")
        return
      }

      await navigator.clipboard.writeText(inviteUrl)
      toast.success("Invite link copied")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }

      toast.error("Failed to share invite link")
    } finally {
      setIsSharing(false)
    }
  }

  const copyGroupInviteCode = async () => {
    setIsCopyingCode(true)

    try {
      await navigator.clipboard.writeText(groupCode)
      toast.success("Group code copied")
    } catch {
      toast.error("Failed to copy Group code")
    } finally {
      setIsCopyingCode(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Share this invite for {groupName}. After wallet connect, FundWise returns people to this exact Group so they can confirm the Join action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="space-y-4 border-accent/25 bg-accent/5 p-4">
            <div className="flex items-center gap-2">
              <Badge className="border-accent/20 bg-accent/10 text-accent">Invite link</Badge>
              <Badge variant="outline">Primary path</Badge>
            </div>
            <div className="rounded-lg border bg-background/90 p-3">
              <p className="break-all font-mono text-xs text-muted-foreground">
                {inviteUrl || "Preparing invite link..."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                onClick={() => void shareInviteLink()}
                disabled={!inviteUrl || isSharing}
              >
                {isSharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Share Invite
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 sm:min-h-10"
                onClick={() => void copyInviteLink()}
                disabled={!inviteUrl || isCopyingLink}
              >
                {isCopyingLink ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy Link
              </Button>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">QR invite</Badge>
              <p className="text-sm text-muted-foreground">Scan this direct URL when someone is right there in person.</p>
            </div>
            <div className="flex justify-center rounded-xl border bg-muted/20 p-4">
              {isGeneratingQr ? (
                <div className="flex h-[260px] w-[260px] flex-col items-center justify-center gap-3 rounded-lg bg-background">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  <p className="text-xs text-muted-foreground">Generating QR code…</p>
                </div>
              ) : qrCodeDataUrl ? (
                <Image
                  src={qrCodeDataUrl}
                  alt={`QR code invite for ${groupName}`}
                  width={260}
                  height={260}
                  unoptimized
                  className="h-[260px] w-[260px] rounded-lg border bg-white p-2"
                />
              ) : (
                <div className="flex h-[260px] w-[260px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background text-center">
                  <QrCode className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="max-w-[14rem] text-xs text-muted-foreground">
                    The invite QR is unavailable right now. Share the link instead.
                  </p>
                </div>
              )}
            </div>

            {qrError ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>QR unavailable</AlertTitle>
                <AlertDescription>{qrError}</AlertDescription>
              </Alert>
            ) : null}
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Fallback code</Badge>
              <p className="text-sm text-muted-foreground">Keep the raw code handy if someone needs to copy it manually.</p>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border bg-background/90 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-sm font-medium tracking-[0.18em] text-foreground">
                {groupCode}
              </span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 sm:min-h-10"
                onClick={() => void copyGroupInviteCode()}
                disabled={isCopyingCode}
              >
                {isCopyingCode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy Code
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
