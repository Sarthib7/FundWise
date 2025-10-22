"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { joinGroup } from "@/lib/solana"
import { Loader2, QrCode } from "lucide-react"
import { QrScannerDialog } from "./qr-scanner-dialog"
import { UsdcIcon } from "@/components/icons/usdc-icon"

interface JoinGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinGroupModal({ open, onOpenChange }: JoinGroupModalProps) {
  const router = useRouter()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const connectedWallet = wallets[0]

  const [isJoining, setIsJoining] = useState(false)
  const [groupCode, setGroupCode] = useState("")
  const [showQrScanner, setShowQrScanner] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authenticated || !connectedWallet) {
      alert("Please connect your wallet first")
      return
    }

    if (!groupCode.trim()) {
      alert("Please enter a group code")
      return
    }

    setIsJoining(true)

    try {
      const { signature } = await joinGroup(connectedWallet.address, groupCode, 10)

      console.log("[FundFlow] Successfully joined group with $10 tip!")
      console.log("[FundFlow] Transaction signature:", signature)

      router.push(`/group/${groupCode}`)
      onOpenChange(false)
      setGroupCode("")
    } catch (error) {
      console.error("[FundFlow] Error joining group:", error)
      alert("Failed to join group. Please check the code and try again.")
    } finally {
      setIsJoining(false)
    }
  }

  const handleQrScan = (scannedCode: string) => {
    setGroupCode(scannedCode.toUpperCase())
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Join a Group</DialogTitle>
            <DialogDescription>Enter the group code or scan a QR code to join</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="group-code">Group Code</Label>
              <Input
                id="group-code"
                placeholder="Enter 6-digit code"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
                required
              />
            </div>

            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <UsdcIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">Joining Tip</p>
                  <p className="text-sm text-muted-foreground">
                    A one-time tip of{" "}
                    <span className="font-semibold text-foreground inline-flex items-center gap-1">
                      <UsdcIcon className="h-3.5 w-3.5" />
                      $10 USDC
                    </span>{" "}
                    is required to join this group and support the collective fund.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setShowQrScanner(true)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isJoining || !authenticated}>
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join & Pay $10"
                )}
              </Button>
            </div>

            {!authenticated && (
              <p className="text-sm text-muted-foreground text-center">Please connect your wallet to join a group</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <QrScannerDialog open={showQrScanner} onOpenChange={setShowQrScanner} onScan={handleQrScan} />
    </>
  )
}
