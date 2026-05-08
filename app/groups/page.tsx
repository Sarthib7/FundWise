"use client"

import { startTransition, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { JoinGroupDialog } from "@/components/join-group-dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GroupAvatar } from "@/components/avatar"
import { createGroup, getGroupByCode, getGroupsForWallet } from "@/lib/db"
import { DEFAULT_STABLECOIN, STABLECOIN_MINTS } from "@/lib/expense-engine"
import {
  Users,
  Plus,
  LogIn,
  ArrowRight,
  Loader2,
  AlertCircle,
  Wallet,
  Receipt,
  ArrowRightLeft,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Database } from "@/lib/database.types"
import { ensureWalletSession } from "@/lib/wallet-session-client"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]

export default function GroupsPage() {
  const router = useRouter()
  const { publicKey, connected, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isJoiningGroup, setIsJoiningGroup] = useState(false)
  const [isWalletVerified, setIsWalletVerified] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [hasAutoOpenedZeroStateCreate, setHasAutoOpenedZeroStateCreate] = useState(false)
  const [hasCreateIntent, setHasCreateIntent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = publicKey?.toString() || ""

  const loadGroups = useCallback(async () => {
    if (!connected || !walletAddress) {
      setGroups([])
      setError(null)
      setIsWalletVerified(false)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await ensureWalletSession({
        walletAddress,
        walletAdapter: wallet?.adapter,
      })

      setIsWalletVerified(true)
      const userGroups = await getGroupsForWallet(walletAddress)
      setGroups(userGroups)
    } catch (error) {
      console.error("[FundWise] Failed to load groups:", error)
      setIsWalletVerified(false)
      setGroups([])
      setError(error instanceof Error ? error.message : "Failed to load your Groups.")
    } finally {
      setIsLoading(false)
    }
  }, [connected, wallet?.adapter, walletAddress])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    setHasAutoOpenedZeroStateCreate(false)
  }, [walletAddress])

  useEffect(() => {
    const syncCreateIntentFromUrl = () => {
      const nextCreateIntent = new URLSearchParams(window.location.search).get("create") === "true"
      setHasCreateIntent(nextCreateIntent)
    }

    syncCreateIntentFromUrl()
    window.addEventListener("popstate", syncCreateIntentFromUrl)

    return () => window.removeEventListener("popstate", syncCreateIntentFromUrl)
  }, [])

  const replaceCreateIntent = useCallback(
    (enabled: boolean) => {
      setHasCreateIntent(enabled)
      router.replace(enabled ? "/groups?create=true" : "/groups", { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    if (!connected || isLoading || !isWalletVerified) {
      return
    }

    if (hasCreateIntent) {
      setIsCreateDialogOpen(true)
      return
    }

    if (groups.length === 0 && !hasAutoOpenedZeroStateCreate) {
      setIsCreateDialogOpen(true)
      setHasAutoOpenedZeroStateCreate(true)
    }
  }, [connected, groups.length, hasAutoOpenedZeroStateCreate, hasCreateIntent, isLoading, isWalletVerified])

  const handleCreateDialogChange = useCallback(
    (open: boolean) => {
      setIsCreateDialogOpen(open)

      if (!open && hasCreateIntent) {
        replaceCreateIntent(false)
      }
    },
    [hasCreateIntent, replaceCreateIntent]
  )

  const handleJoinDialogChange = useCallback((open: boolean) => {
    setIsJoinDialogOpen(open)
    if (!open) {
      setJoinError(null)
    }
  }, [])

  const openCreateDialog = useCallback(() => {
    setHasAutoOpenedZeroStateCreate(true)
    setIsCreateDialogOpen(true)
    replaceCreateIntent(true)
  }, [replaceCreateIntent])

  const openJoinDialog = useCallback(() => {
    setJoinError(null)
    setIsJoinDialogOpen(true)
  }, [])

  const handleCreateGroup = useCallback(
    async (values: {
      name: string
      mode: "split" | "fund"
      fundingGoal?: number
      approvalThreshold?: number
    }) => {
      if (!walletAddress) {
        return
      }

      setIsCreatingGroup(true)

      try {
        await ensureWalletSession({
          walletAddress,
          walletAdapter: wallet?.adapter,
        })

        const createdGroup = await createGroup({
          name: values.name,
          mode: values.mode,
          stablecoinMint: DEFAULT_STABLECOIN.mint,
          createdBy: walletAddress,
          fundingGoal: values.fundingGoal,
          approvalThreshold: values.approvalThreshold,
        })

        setIsCreateDialogOpen(false)
        replaceCreateIntent(false)
        toast.success(values.mode === "fund" ? "Fund Mode Group created" : "Group created")
        startTransition(() => {
          router.push(`/groups/${createdGroup.id}`)
        })
      } catch (error) {
        console.error("[FundWise] Failed to create group:", error)
        toast.error(error instanceof Error ? error.message : "Failed to create your Group.")
      } finally {
        setIsCreatingGroup(false)
      }
    },
    [replaceCreateIntent, router, wallet?.adapter, walletAddress]
  )

  const handleJoinGroup = useCallback(
    async (inviteValue: string) => {
      const trimmedInviteValue = inviteValue.trim()

      if (!trimmedInviteValue) {
        setJoinError("Enter an invite link or Group code.")
        return
      }

      setIsJoiningGroup(true)
      setJoinError(null)

      try {
        const buildInviteRoute = (pathname: string, search: string = "") => {
          const nextSearchParams = new URLSearchParams(search)
          nextSearchParams.set("invite", "true")
          const nextQuery = nextSearchParams.toString()
          return nextQuery ? `${pathname}?${nextQuery}` : pathname
        }

        if (trimmedInviteValue.startsWith("/groups/")) {
          setIsJoinDialogOpen(false)
          router.push(buildInviteRoute(trimmedInviteValue.split("?")[0], trimmedInviteValue.split("?")[1] || ""))
          return
        }

        try {
          const inviteUrl = new URL(trimmedInviteValue)

          if (inviteUrl.pathname.startsWith("/groups/")) {
            setIsJoinDialogOpen(false)
            router.push(buildInviteRoute(inviteUrl.pathname, inviteUrl.search))
            return
          }
        } catch {}

        const group = await getGroupByCode(trimmedInviteValue.toUpperCase())

        if (!group) {
          throw new Error("We couldn’t find a Group for that invite code.")
        }

        setIsJoinDialogOpen(false)
        router.push(`/groups/${group.id}?invite=true`)
      } catch (error) {
        setJoinError(error instanceof Error ? error.message : "Failed to open that invite.")
      } finally {
        setIsJoiningGroup(false)
      }
    },
    [router]
  )

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
                    <p className="mt-2 text-sm text-foreground">Enter with an invite code or start a new Split Mode Group for a trip, tab, or shared expense run.</p>
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
                {isWalletVerified
                  ? `${groups.length} group${groups.length !== 1 ? "s" : ""}`
                  : "Verify your wallet to load your Groups"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="min-h-11" onClick={openJoinDialog}>
                <LogIn className="h-4 w-4 mr-2" />
                Join Group
              </Button>
              <Button className="min-h-11 bg-accent hover:bg-accent/90" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </div>
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
              <h3 className="text-xl font-semibold">
                {isWalletVerified ? "Couldn&apos;t load your Groups" : "Verify your wallet"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {error}
              </p>
              <Button variant="outline" className="mt-6 min-h-11" onClick={loadGroups}>
                {isWalletVerified ? "Try Again" : "Verify Wallet"}
              </Button>
            </Card>
          ) : groups.length === 0 ? (
            <Card className="p-8 text-center sm:p-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start a trip, dinner tab, or shared expense Group, then invite Members with one code.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button variant="outline" className="min-h-11" onClick={openJoinDialog}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Join a Group
                </Button>
                <Button className="min-h-11 bg-accent hover:bg-accent/90" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
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
      <CreateGroupDialog
        open={isCreateDialogOpen}
        onOpenChange={handleCreateDialogChange}
        isSubmitting={isCreatingGroup}
        onSubmit={handleCreateGroup}
      />
      <JoinGroupDialog
        open={isJoinDialogOpen}
        onOpenChange={handleJoinDialogChange}
        isSubmitting={isJoiningGroup}
        errorMessage={joinError}
        onSubmit={handleJoinGroup}
      />
      <Footer />
    </div>
  )
}
