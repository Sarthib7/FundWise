"use client"

import dynamic from "next/dynamic"
import { useEffect, useId, useState } from "react"
import { Camera, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const QrScannerDialog = dynamic(
  () => import("@/components/qr-scanner-dialog").then((module) => module.QrScannerDialog),
  { ssr: false }
)

type JoinGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  errorMessage: string | null
  onSubmit: (inviteValue: string) => Promise<void> | void
}

export function JoinGroupDialog({
  open,
  onOpenChange,
  isSubmitting,
  errorMessage,
  onSubmit,
}: JoinGroupDialogProps) {
  const inviteFieldId = useId()
  const [inviteValue, setInviteValue] = useState("")
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    if (!open) {
      setInviteValue("")
      setShowScanner(false)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(inviteValue)
  }

  const handleScan = (value: string) => {
    setInviteValue(value)
    void onSubmit(value)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Group</DialogTitle>
            <DialogDescription>
              Paste an invite link, enter the Group code, or scan the QR to open the right Group context.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={inviteFieldId}>Invite link or Group code</Label>
              <Input
                id={inviteFieldId}
                value={inviteValue}
                onChange={(event) => setInviteValue(event.target.value)}
                placeholder="https://... or ABC123"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={errorMessage ? "true" : undefined}
                aria-describedby={errorMessage ? `${inviteFieldId}-error` : `${inviteFieldId}-hint`}
              />
              {errorMessage ? (
                <p id={`${inviteFieldId}-error`} className="text-xs text-destructive">
                  {errorMessage}
                </p>
              ) : (
                <p id={`${inviteFieldId}-hint`} className="text-xs text-muted-foreground">
                  FundWise will send you to the invite-linked Group so you can review it and confirm the Join action.
                </p>
              )}
            </div>

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 sm:min-h-10"
                onClick={() => setShowScanner(true)}
                disabled={isSubmitting}
              >
                <Camera className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
              <Button
                type="submit"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Open Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <QrScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleScan}
      />
    </>
  )
}
