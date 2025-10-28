"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// PHASE 1: Using Solana Wallet Adapter (Active)
import { useWallet } from "@solana/wallet-adapter-react"
// PHASE 2: Privy (Commented out)
// import { usePrivy, useWallets } from "@privy-io/react-auth"
import { joinGroup } from "@/lib/solana"
import { Loader2, QrCode, CheckCircle2, ArrowRight, Wallet } from "lucide-react"
import { QrScannerDialog } from "./qr-scanner-dialog"
import { UsdcIcon } from "@/components/icons/usdc-icon"

interface JoinGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinGroupModal({ open, onOpenChange }: JoinGroupModalProps) {
  const router = useRouter()
  // PHASE 1: Solana Wallet Adapter
  const { publicKey, connected } = useWallet()
  // PHASE 2: Privy (commented out)
  // const { authenticated } = usePrivy()
  // const { wallets } = useWallets()
  // const connectedWallet = wallets[0]

  const [isJoining, setIsJoining] = useState(false)
  const [groupCode, setGroupCode] = useState("")
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [showTransactionSimulation, setShowTransactionSimulation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // PHASE 1: Check Solana wallet connection
    if (!connected || !publicKey) {
      alert("Please connect your Solana wallet first. Click the 'Connect Wallet' button in the top right corner.")
      return
    }

    if (!groupCode.trim()) {
      alert("Please enter a group code")
      return
    }

    setIsJoining(true)
    setShowTransactionSimulation(true)

    try {
      const walletAddress = publicKey.toString()
      console.log("[FundFlow] Processing joining payment...")
      console.log("[FundFlow] From:", walletAddress)
      console.log("[FundFlow] To: Group Treasury")
      console.log("[FundFlow] Amount: 0.01 SOL")

      const { signature } = await joinGroup(walletAddress, groupCode, 0.01)

      console.log("[FundFlow] ✅ Payment successful!")
      console.log("[FundFlow] Successfully joined group with 0.01 SOL tip!")
      console.log("[FundFlow] Transaction signature:", signature)

      setShowTransactionSimulation(false)
      router.push(`/group/${groupCode}`)
      onOpenChange(false)
      setGroupCode("")
    } catch (error) {
      console.error("[FundFlow] Error joining group:", error)
      setShowTransactionSimulation(false)
      const errorMessage = error instanceof Error ? error.message : "Please check the code and try again."
      alert(`Failed to join group: ${errorMessage}`)
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
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">Joining Tip</p>
                  <p className="text-sm text-muted-foreground">
                    A one-time tip of{" "}
                    <span className="font-semibold text-foreground">
                      0.01 SOL
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
              <Button type="submit" className="flex-1" disabled={isJoining || !connected}>
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join & Pay 0.01 SOL"
                )}
              </Button>
            </div>

            {!connected && (
              <p className="text-sm text-muted-foreground text-center">Please connect your Solana wallet to join a group</p>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <QrScannerDialog open={showQrScanner} onOpenChange={setShowQrScanner} onScan={handleQrScan} />
      
      {/* Transaction Processing Dialog */}
      <Dialog open={showTransactionSimulation} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Processing Transaction</DialogTitle>
            <DialogDescription>Sending 0.01 SOL joining tip to the group</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Transaction Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">From</span>
                <span className="text-sm font-mono">
                  {publicKey ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-mono">Group Wallet</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold">
                  0.01 SOL
                </span>
              </div>
            </div>

            {/* Processing Animation */}
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <span className="text-sm text-muted-foreground">Confirming transaction on Solana...</span>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              Please confirm the transaction in your wallet popup.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
