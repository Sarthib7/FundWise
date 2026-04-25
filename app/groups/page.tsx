"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GroupAvatar } from "@/components/avatar"
import { getGroupsForWallet } from "@/lib/db"
import { STABLECOIN_MINTS, formatTokenAmount } from "@/lib/expense-engine"
import { Users, Plus, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]

export default function GroupsPage() {
  const { publicKey, connected } = useWallet()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const walletAddress = publicKey?.toString() || ""

  useEffect(() => {
    if (!connected || !walletAddress) {
      setIsLoading(false)
      return
    }

    const loadGroups = async () => {
      setIsLoading(true)
      try {
        const userGroups = await getGroupsForWallet(walletAddress)
        setGroups(userGroups)
      } catch (error) {
        console.error("[FundWise] Failed to load groups:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGroups()
  }, [connected, walletAddress])

  const getMintName = (mint: string) => {
    for (const [, data] of Object.entries(STABLECOIN_MINTS)) {
      if (data.mint === mint) return data.name
    }
    return "Unknown"
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Connect your Solana wallet to view and manage your groups.
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-20">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Your Groups</h1>
              <p className="text-muted-foreground mt-1">
                {groups.length} group{groups.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link href="/?create=true">
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : groups.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create a group to start splitting expenses with friends.
              </p>
              <Link href="/?create=true">
                <Button className="bg-accent hover:bg-accent/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="p-5 hover:border-accent/50 transition-all hover:shadow-md cursor-pointer">
                    <div className="flex items-center gap-4">
                      <GroupAvatar name={group.name} size={48} className="h-12 w-12 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{group.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                            {group.mode === "split" ? "Split Mode" : "Fund Mode"}
                          </span>
                          <span>{getMintName(group.stablecoin_mint)}</span>
                          <span>Code: {group.code}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
