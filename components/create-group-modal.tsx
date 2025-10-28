"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// PHASE 1: Using Solana Wallet Adapter (Active)
import { useWallet } from "@solana/wallet-adapter-react"
// PHASE 2: Privy (Commented out)
// import { usePrivy, useWallets } from "@privy-io/react-auth"
import { createGroup } from "@/lib/solana"
import { Loader2, Lock, Globe } from "lucide-react"
import { UsdcIcon } from "@/components/icons/usdc-icon"

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const router = useRouter()
  // PHASE 1: Solana Wallet Adapter
  const { publicKey, connected } = useWallet()
  // PHASE 2: Privy (commented out)
  // const { authenticated } = usePrivy()
  // const { wallets } = useWallets()
  // const connectedWallet = wallets[0]

  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    recurringPeriod: "",
    amountPerRecurrence: "",
    riskLevel: "low",
    totalDuration: "",
    fundingGoal: "",
    isPublic: true, // Added public/private option
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // PHASE 1: Check Solana wallet connection
    if (!connected || !publicKey) {
      alert("Please connect your Solana wallet first. Click the 'Connect Wallet' button in the top right corner.")
      return
    }

    setIsCreating(true)

    try {
      const walletAddress = publicKey.toString()
      console.log("[CreateGroup] ✅ Solana wallet connected:", walletAddress)
      console.log("[CreateGroup] Using Solana Wallet Adapter (Phase 1)")

      const { groupId, signature, onChainAddress, squadsVaultAddress } = await createGroup(
        walletAddress,
        {
          name: formData.name,
          creator: walletAddress,
          recurringPeriod: formData.recurringPeriod,
          amountPerRecurrence: Number.parseFloat(formData.amountPerRecurrence),
          riskLevel: formData.riskLevel,
          totalDuration: formData.totalDuration,
          fundingGoal: Number.parseFloat(formData.fundingGoal),
          isPublic: formData.isPublic,
        },
        null // No wallet object needed for Phase 1 (simple wallet generation)
      )

      console.log("[FundFlow] ✅ Group created successfully!")
      console.log("[FundFlow] Group ID:", groupId)
      console.log("[FundFlow] On-chain address:", onChainAddress)
      console.log("[FundFlow] Squads vault address:", squadsVaultAddress)
      console.log("[FundFlow] Transaction signature:", signature)

      router.push(`/group/${groupId}`)
      onOpenChange(false)

      setFormData({
        name: "",
        recurringPeriod: "",
        amountPerRecurrence: "",
        riskLevel: "low",
        totalDuration: "",
        fundingGoal: "",
        isPublic: true,
      })
    } catch (error) {
      console.error("[FundFlow] ❌ Error creating group:", error)
      console.error("[FundFlow] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      })

      // Show detailed error to user
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Failed to create group:\n\n${errorMessage}\n\nCheck console (F12) for more details.`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Group</DialogTitle>
          <DialogDescription>Set up your fundraising group with recurring contributions</DialogDescription>
        </DialogHeader>

        {isCreating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Creating Your Group</h3>
              <p className="text-sm text-muted-foreground">
                Setting up your fundraising group on Solana...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Team Vacation Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Group Visibility</Label>
            <RadioGroup
              value={formData.isPublic ? "public" : "private"}
              onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Globe className="h-4 w-4 text-accent" />
                    Public
                  </div>
                  <div className="text-sm text-muted-foreground">Anyone can discover and join this group</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 font-medium">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Private
                  </div>
                  <div className="text-sm text-muted-foreground">Only people with the code can join</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="funding-goal">Funding Goal (SOL)</Label>
            <Select
              value={formData.fundingGoal}
              onValueChange={(value) => setFormData({ ...formData, fundingGoal: value })}
              required
            >
              <SelectTrigger id="funding-goal">
                <SelectValue placeholder="Select target amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">
                  <span>10 SOL</span>
                </SelectItem>
                <SelectItem value="50">
                  <span>50 SOL</span>
                </SelectItem>
                <SelectItem value="100">
                  <span>100 SOL</span>
                </SelectItem>
                <SelectItem value="500">
                  <span>500 SOL</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring-period">Recurring Period</Label>
            <Select
              value={formData.recurringPeriod}
              onValueChange={(value) => setFormData({ ...formData, recurringPeriod: value })}
              required
            >
              <SelectTrigger id="recurring-period">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              Amount Per Recurrence (SOL)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.1"
              value={formData.amountPerRecurrence}
              onChange={(e) => setFormData({ ...formData, amountPerRecurrence: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Risk Level</Label>
            <RadioGroup
              value={formData.riskLevel}
              onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="flex-1 cursor-pointer">
                  <div className="font-medium">Low Risk</div>
                  <div className="text-sm text-muted-foreground">Conservative, stable returns</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="flex-1 cursor-pointer">
                  <div className="font-medium">Medium Risk</div>
                  <div className="text-sm text-muted-foreground">Balanced growth potential</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="flex-1 cursor-pointer">
                  <div className="font-medium">High Risk</div>
                  <div className="text-sm text-muted-foreground">Aggressive, higher returns</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Total Duration</Label>
            <Select
              value={formData.totalDuration}
              onValueChange={(value) => setFormData({ ...formData, totalDuration: value })}
              required
            >
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3 Months">3 Months</SelectItem>
                <SelectItem value="6 Months">6 Months</SelectItem>
                <SelectItem value="1 Year">1 Year</SelectItem>
                <SelectItem value="3 Years">3 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isCreating || !connected}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </div>

          {!connected && (
            <p className="text-sm text-muted-foreground text-center">Please connect your Solana wallet to create a group</p>
          )}
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
