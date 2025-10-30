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
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
// PHASE 1: Using Solana Wallet Adapter (Active)
import { useWallet } from "@solana/wallet-adapter-react"
// PHASE 2: Privy (Commented out)
// import { usePrivy, useWallets } from "@privy-io/react-auth"
import { createGroup } from "@/lib/solana"
import { Loader2, Lock, Globe } from "lucide-react"
import { SolIcon } from "@/components/icons/sol-icon"

interface CreateCircleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCircleModal({ open, onOpenChange }: CreateCircleModalProps) {
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
    riskLevel: "low",
    totalDuration: "6 Months", // Default duration
    fundingGoal: 10, // Changed to number for slider, default 10 SOL
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
      console.log("[CreateCircle] ✅ Solana wallet connected:", walletAddress)
      console.log("[CreateCircle] Using Solana Wallet Adapter (Phase 1)")

      const { groupId, signature, onChainAddress, squadsVaultAddress } = await createGroup(
        walletAddress,
        {
          name: formData.name,
          creator: walletAddress,
          recurringPeriod: "monthly", // Default value since removed from form
          amountPerRecurrence: 10, // Default value since removed from form
          riskLevel: formData.riskLevel,
          totalDuration: formData.totalDuration,
          fundingGoal: formData.fundingGoal, // Already a number from slider
          isPublic: formData.isPublic,
        },
        null // No wallet object needed for Phase 1 (simple wallet generation)
      )

      console.log("[FundFlow] ✅ Circle created successfully!")
      console.log("[FundFlow] Circle ID:", groupId)
      console.log("[FundFlow] On-chain address:", onChainAddress)
      console.log("[FundFlow] Squads vault address:", squadsVaultAddress)
      console.log("[FundFlow] Transaction signature:", signature)

      router.push(`/circle/${groupId}`)
      onOpenChange(false)

      setFormData({
        name: "",
        riskLevel: "low",
        totalDuration: "6 Months",
        fundingGoal: 10,
        isPublic: true,
      })
    } catch (error) {
      console.error("[FundFlow] ❌ Error creating circle:", error)
      console.error("[FundFlow] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      })

      // Show detailed error to user
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Failed to create circle:\n\n${errorMessage}\n\nCheck console (F12) for more details.`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Circle</DialogTitle>
          <DialogDescription>Set up your private betting market or shared treasury for your friend group</DialogDescription>
        </DialogHeader>

        {isCreating ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Creating Your Circle</h3>
              <p className="text-sm text-muted-foreground">
                Setting up your private prediction market on Solana...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Circle Name</Label>
            <Input
              id="name"
              placeholder="e.g., Team Vacation Fund"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              {formData.isPublic ? (
                <Globe className="h-5 w-5 text-accent" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-base font-medium">
                  {formData.isPublic ? "Public Circle" : "Private Circle"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isPublic ? "Anyone can discover and join" : "Only people with code can join"}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Funding Goal (SOL)
                <SolIcon className="h-4 w-4" />
              </Label>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <SolIcon className="h-5 w-5" />
                <span>{formData.fundingGoal.toFixed(1)} SOL</span>
              </div>
            </div>
            <Slider
              value={[formData.fundingGoal]}
              onValueChange={(value) => setFormData({ ...formData, fundingGoal: value[0] })}
              min={0.1}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1 SOL</span>
              <span>100 SOL</span>
            </div>
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

          <div className="space-y-3">
            <Label>Total Duration</Label>
            <RadioGroup
              value={formData.totalDuration}
              onValueChange={(value) => setFormData({ ...formData, totalDuration: value })}
              className="grid grid-cols-4 gap-2"
            >
              <label className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${formData.totalDuration === "3 Months" ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/50"}`}>
                <RadioGroupItem value="3 Months" id="3months" className="sr-only" />
                <div className="text-sm font-medium">3 Months</div>
              </label>
              <label className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${formData.totalDuration === "6 Months" ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/50"}`}>
                <RadioGroupItem value="6 Months" id="6months" className="sr-only" />
                <div className="text-sm font-medium">6 Months</div>
              </label>
              <label className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${formData.totalDuration === "1 Year" ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/50"}`}>
                <RadioGroupItem value="1 Year" id="1year" className="sr-only" />
                <div className="text-sm font-medium">1 Year</div>
              </label>
              <label className={`flex items-center justify-center p-3 rounded-lg border transition-colors cursor-pointer ${formData.totalDuration === "3 Years" ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/50"}`}>
                <RadioGroupItem value="3 Years" id="3years" className="sr-only" />
                <div className="text-sm font-medium">3 Years</div>
              </label>
            </RadioGroup>
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
            <Button type="submit" className="flex-1 text-white bg-[#00ab79] hover:bg-[#009368]" disabled={isCreating || !connected}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Circle"
              )}
            </Button>
          </div>

          {!connected && (
            <p className="text-sm text-muted-foreground text-center">Please connect your Solana wallet to create a circle</p>
          )}
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
