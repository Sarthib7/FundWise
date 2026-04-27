"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GroupAvatar } from "@/components/avatar"
import { getGroupsForWallet } from "@/lib/db"
import { STABLECOIN_MINTS } from "@/lib/expense-engine"
import {
  Users,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wallet,
  Receipt,
  ArrowRightLeft,
} from "lucide-react"
import Link from "next/link"
import type { Database } from "@/lib/database.types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]

export default function GroupsPage() {
  const { publicKey, connected } = useWallet()
  const { setVisible } = useWalletModal()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = publicKey?.toString() || ""

  const loadGroups = async () => {
    if (!connected || !walletAddress) {
      setGroups([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const userGroups = await getGroupsForWallet(walletAddress)
      setGroups(userGroups)
    } catch (error) {
      console.error("[FundWise] Failed to load groups:", error)
      setError(error instanceof Error ? error.message : "Failed to load your Groups.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
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
        <main className="flex flex-1 items-center px-4 py-10 sm:px-6">
          <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
            <div className="space-y-5">
              <Badge className="bg-accent/10 text-accent border-accent/20">Wallet required</Badge>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
                  Open your Groups with one wallet connect
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                  No email setup, no hidden account layer. Connect the Solana wallet you use with FundWise, then jump straight into shared Expenses, live Balances, and exact Settlements.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10" onClick={() => setVisible(true)}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
                <Button asChild variant="outline" className="min-h-11 sm:min-h-10">
                  <Link href="/#how">See how it works</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="p-4">
                  <Users className="h-5 w-5 text-accent" />
                  <p className="mt-3 text-sm font-medium">Private Groups</p>
                  <p className="mt-1 text-xs text-muted-foreground">Join by invite code and see only the Groups tied to your wallet.</p>
                </Card>
                <Card className="p-4">
                  <Receipt className="h-5 w-5 text-accent" />
                  <p className="mt-3 text-sm font-medium">Shared Expenses</p>
                  <p className="mt-1 text-xs text-muted-foreground">Log dinners, trips, and house costs with clean split inputs.</p>
                </Card>
                <Card className="p-4">
                  <ArrowRightLeft className="h-5 w-5 text-accent" />
                  <p className="mt-3 text-sm font-medium">Exact Settlements</p>
                  <p className="mt-1 text-xs text-muted-foreground">Pay the live net amount in USDC instead of reconciling by hand.</p>
                </Card>
              </div>
            </div>

            <Card className="border-accent/20 bg-gradient-to-br from-accent/6 via-background to-background p-6 sm:p-7">
              <div className="space-y-4">
                <Badge variant="outline">What happens next</Badge>
                <div className="space-y-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      1. Connect
                    </p>
                    <p className="mt-2 text-sm text-foreground">Use your Solana wallet to unlock the Groups tied to that address.</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      2. Join or create
                    </p>
                    <p className="mt-2 text-sm text-foreground">Enter with an invite code or start a new Group for a trip, tab, or house fund.</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      3. Settle cleanly
                    </p>
                    <p className="mt-2 text-sm text-foreground">FundWise computes the live Balance graph so each Member sees the simplest next payment.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Your Groups</h1>
              <p className="text-muted-foreground mt-1">
                {groups.length} group{groups.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button asChild className="min-h-11 bg-accent hover:bg-accent/90">
              <Link href="/?create=true">
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-56 animate-pulse rounded bg-muted" />
                    </div>
                    <Loader2 className="mt-1 h-5 w-5 animate-spin text-accent" />
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h3 className="text-xl font-semibold">Couldn&apos;t load your Groups</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {error}
              </p>
              <Button variant="outline" className="mt-6 min-h-11" onClick={loadGroups}>
                Try Again
              </Button>
            </Card>
          ) : groups.length === 0 ? (
            <Card className="p-8 text-center sm:p-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start a trip, dinner tab, or house fund, then invite Members with one code.
              </p>
              <Button asChild className="min-h-11 bg-accent hover:bg-accent/90">
                <Link href="/?create=true">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="cursor-pointer p-5 transition-all hover:border-accent/50 hover:shadow-md">
                    <div className="flex items-start gap-4 sm:items-center">
                      <GroupAvatar name={group.name} size={48} className="h-12 w-12 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{group.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                            {group.mode === "split" ? "Split Mode" : "Fund Mode"}
                          </span>
                          <span>{getMintName(group.stablecoin_mint)}</span>
                          <span>Code: {group.code}</span>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground sm:mt-0" />
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
