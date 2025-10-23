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
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { createGroup } from "@/lib/solana"
import { Loader2, Lock, Globe } from "lucide-react"
import { UsdcIcon } from "@/components/icons/usdc-icon"

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const router = useRouter()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const connectedWallet = wallets[0]

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

    if (!authenticated || !connectedWallet) {
      alert("Please connect your wallet first. Click the 'Connect Wallet' button in the top right corner.")
      return
    }

    setIsCreating(true)

    try {
      const { groupId, signature } = await createGroup(connectedWallet.address, {
        name: formData.name,
        creator: connectedWallet.address,
        recurringPeriod: formData.recurringPeriod,
        amountPerRecurrence: Number.parseFloat(formData.amountPerRecurrence),
        riskLevel: formData.riskLevel,
        totalDuration: formData.totalDuration,
        fundingGoal: Number.parseFloat(formData.fundingGoal),
        isPublic: formData.isPublic, // Pass isPublic to createGroup
      })

      console.log("[FundFlow] Group created successfully!")
      console.log("[FundFlow] Group ID:", groupId)
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
      console.error("[FundFlow] Error creating group:", error)
      alert("Failed to create group. Please try again.")
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
            <Label htmlFor="funding-goal">Funding Goal</Label>
            <Select
              value={formData.fundingGoal}
              onValueChange={(value) => setFormData({ ...formData, fundingGoal: value })}
              required
            >
              <SelectTrigger id="funding-goal">
                <SelectValue placeholder="Select target amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">
                  <div className="flex items-center gap-2">
                    <UsdcIcon className="h-4 w-4" />
                    <span>1,000 USDC</span>
                  </div>
                </SelectItem>
                <SelectItem value="3000">
                  <div className="flex items-center gap-2">
                    <UsdcIcon className="h-4 w-4" />
                    <span>3,000 USDC</span>
                  </div>
                </SelectItem>
                <SelectItem value="5000">
                  <div className="flex items-center gap-2">
                    <UsdcIcon className="h-4 w-4" />
                    <span>5,000 USDC</span>
                  </div>
                </SelectItem>
                <SelectItem value="10000">
                  <div className="flex items-center gap-2">
                    <UsdcIcon className="h-4 w-4" />
                    <span>10,000 USDC</span>
                  </div>
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
              Amount Per Recurrence
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <UsdcIcon className="h-3.5 w-3.5" />
                USDC
              </span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
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
            <Button type="submit" className="flex-1" disabled={isCreating || !authenticated}>
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

          {!authenticated && (
            <p className="text-sm text-muted-foreground text-center">Please connect your wallet to create a group</p>
          )}
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
