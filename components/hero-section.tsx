"use client"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { FlowBackground } from "@/components/flow-background"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createGroup } from "@/lib/db"
import { STABLECOIN_MINTS, DEFAULT_STABLECOIN } from "@/lib/expense-engine"
import { toast } from "sonner"
import { ArrowRight, Users, QrCode, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedMint, setSelectedMint] = useState(DEFAULT_STABLECOIN.mint)
  const [isCreating, setIsCreating] = useState(false)
  const { publicKey, connected } = useWallet()
  const router = useRouter()

  const handleCreate = async () => {
    if (!connected || !publicKey || !groupName.trim()) return
    setIsCreating(true)
    try {
      const { id } = await createGroup({
        name: groupName.trim(),
        mode: "split",
        stablecoinMint: selectedMint,
        createdBy: publicKey.toString(),
      })
      toast.success("Group created!")
      setCreateModalOpen(false)
      setGroupName("")
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
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={handleCreate}
              disabled={isCreating || !groupName.trim()}
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
