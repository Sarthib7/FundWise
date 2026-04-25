"use client"

import { useEffect, useMemo, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { FlowBackground } from "@/components/flow-background"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGroup } from "@/lib/db"
import { STABLECOIN_MINTS, DEFAULT_STABLECOIN, parseTokenAmount } from "@/lib/expense-engine"
import { toast } from "sonner"
import { ArrowRight, Users, QrCode, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

type GroupMode = "split" | "fund"

export function HeroSection() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [groupMode, setGroupMode] = useState<GroupMode>("split")
  const [groupName, setGroupName] = useState("")
  const [selectedMint, setSelectedMint] = useState(DEFAULT_STABLECOIN.mint)
  const [fundingGoal, setFundingGoal] = useState("")
  const [approvalThreshold, setApprovalThreshold] = useState("1")
  const [isCreating, setIsCreating] = useState(false)
  const { publicKey, connected } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateModalOpen(true)
    }
  }, [searchParams])

  const canCreate = useMemo(() => {
    if (!groupName.trim()) {
      return false
    }

    if (groupMode === "split") {
      return true
    }

    const numericFundingGoal = Number(fundingGoal)
    const numericApprovalThreshold = Number(approvalThreshold)

    return (
      fundingGoal.trim().length > 0 &&
      Number.isFinite(numericFundingGoal) &&
      numericFundingGoal > 0 &&
      Number.isInteger(numericApprovalThreshold) &&
      numericApprovalThreshold > 0
    )
  }, [approvalThreshold, fundingGoal, groupMode, groupName])

  const resetForm = () => {
    setGroupMode("split")
    setGroupName("")
    setSelectedMint(DEFAULT_STABLECOIN.mint)
    setFundingGoal("")
    setApprovalThreshold("1")
  }

  const handleCreate = async () => {
    if (!connected || !publicKey || !canCreate) return

    setIsCreating(true)
    try {
      const nextGroupMode = groupMode
      const { id } = await createGroup({
        name: groupName.trim(),
        mode: nextGroupMode,
        stablecoinMint: selectedMint,
        createdBy: publicKey.toString(),
        fundingGoal: nextGroupMode === "fund" ? parseTokenAmount(fundingGoal) : undefined,
        approvalThreshold: nextGroupMode === "fund" ? Number(approvalThreshold) : undefined,
      })

      toast.success(nextGroupMode === "split" ? "Split Mode group created!" : "Fund Mode group created!")
      setCreateModalOpen(false)
      resetForm()
      router.push(`/groups/${id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create group")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <section className="relative py-24 md:py-32 overflow-hidden">
        <FlowBackground height="clamp(360px, 52vw, 720px)" top="clamp(8px, 2vw, 48px)" />
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Split it, <span className="text-accent">settle on-chain</span>
          </h1>

          <p className="mb-10 text-lg md:text-xl text-muted-foreground text-balance leading-relaxed">
            Splitwise on Solana. Track group expenses with friends and settle in stablecoins — one click, no IOUs. Or pool a shared treasury and spend from it together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-base"
              onClick={() => {
                if (!connected) {
                  toast.info("Connect your wallet first")
                  return
                }
                setCreateModalOpen(true)
              }}
            >
              Create a Group
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base bg-transparent"
              onClick={() => router.push("/groups")}
            >
              View My Groups
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-accent" />
              <span>Invite by code or link</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <span>Stablecoin settlements</span>
            </div>
          </div>
        </div>
      </section>

      {/* Create Group Modal */}
      <Dialog
        open={createModalOpen}
        onOpenChange={(open) => {
          setCreateModalOpen(open)
          if (!open && !isCreating) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Group</DialogTitle>
            <DialogDescription>
              Choose Split Mode for shared expenses or Fund Mode for a shared Treasury with Contributions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={groupMode === "split" ? "default" : "outline"}
                  onClick={() => setGroupMode("split")}
                  className={groupMode === "split" ? "bg-accent hover:bg-accent/90" : ""}
                >
                  Split Mode
                </Button>
                <Button
                  variant={groupMode === "fund" ? "default" : "outline"}
                  onClick={() => setGroupMode("fund")}
                  className={groupMode === "fund" ? "bg-accent hover:bg-accent/90" : ""}
                >
                  Fund Mode
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {groupMode === "split"
                  ? "Track Expenses first, then settle Balances on-chain."
                  : "Collect Contributions into a shared Treasury before spending."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="e.g., Berlin Trip, Flat 4B"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-2">
              <Label>Stablecoin</Label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(STABLECOIN_MINTS).map(([key, data]) => (
                  <Button
                    key={key}
                    variant={selectedMint === data.mint ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMint(data.mint)}
                    className={selectedMint === data.mint ? "bg-accent hover:bg-accent/90" : ""}
                  >
                    {data.name}
                  </Button>
                ))}
              </div>
            </div>
            {groupMode === "fund" && (
              <>
                <div className="space-y-2">
                  <Label>Funding Goal ({DEFAULT_STABLECOIN.name})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="250.00"
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Approval Threshold</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={approvalThreshold}
                    onChange={(e) => setApprovalThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Treasury initialization uses the current Member list. Invite everyone before you initialize if you want a multi-approval Treasury.
                  </p>
                </div>
              </>
            )}
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={handleCreate}
              disabled={isCreating || !canCreate}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
