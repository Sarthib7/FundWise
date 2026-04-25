"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WalletAvatar } from "@/components/avatar"
import {
  getGroup,
  getMembers,
  addMember,
  getExpenses,
  addExpense as dbAddExpense,
  getExpenseSplits,
  addSettlement as dbAddSettlement,
  getSettlements,
  isMember as checkIsMember,
  getActivityFeed,
  type ActivityItem,
} from "@/lib/db"
import {
  computeGroupBalances,
  simplifySettlements,
  calculateSplits,
  executeSettlement,
  formatTokenAmount,
  parseTokenAmount,
  STABLECOIN_MINTS,
  DEFAULT_STABLECOIN,
  type Balance,
  type SettlementTransfer,
} from "@/lib/expense-engine"
import type { Database } from "@/lib/database.types"
import { toast } from "sonner"
import {
  Users,
  Receipt,
  ArrowRightLeft,
  Plus,
  Loader2,
  AlertCircle,
  Share2,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]

export default function GroupDashboard() {
  const params = useParams()
  const router = useRouter()
  const { publicKey, connected, signTransaction } = useWallet()

  const walletAddress = publicKey?.toString() || ""

  // Data state
  const [group, setGroup] = useState<GroupRow | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [transfers, setTransfers] = useState<SettlementTransfer[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  // Modal states
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [copied, setCopied] = useState(false)

  // Expense form
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseMemo, setExpenseMemo] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("general")
  const [splitMethod, setSplitMethod] = useState<"equal" | "exact" | "shares" | "percentage">("equal")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Settlement state
  const [settlingTransfer, setSettlingTransfer] = useState<SettlementTransfer | null>(null)
  const [isSettling, setIsSettling] = useState(false)

  const groupId = params.id as string

  const loadData = useCallback(async () => {
    if (!groupId) return
    setIsLoading(true)
    try {
      const [groupData, memberData] = await Promise.all([
        getGroup(groupId),
        getMembers(groupId),
      ])
      setGroup(groupData)
      setMembers(memberData)

      // Check membership
      if (walletAddress) {
        const memberCheck = await checkIsMember(groupId, walletAddress)
        setIsMember(memberCheck)
      }

      // Load balances and activity only for members
      if (walletAddress && memberData.some((m) => m.wallet === walletAddress)) {
        const [bal, act] = await Promise.all([
          computeGroupBalances(groupId),
          getActivityFeed(groupId),
        ])
        setBalances(bal)
        setTransfers(simplifySettlements(bal))
        setActivity(act)
      }
    } catch (error) {
      console.error("[FundWise] Failed to load group:", error)
      toast.error("Failed to load group")
    } finally {
      setIsLoading(false)
    }
  }, [groupId, walletAddress])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handlers
  const handleCopyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.code)
      setCopied(true)
      toast.success("Group code copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleJoin = async () => {
    if (!connected || !walletAddress) {
      toast.error("Connect your wallet first")
      return
    }
    try {
      await addMember(groupId, walletAddress)
      toast.success("Joined group!")
      setShowJoinGroup(false)
      loadData()
    } catch (error) {
      toast.error("Failed to join group")
    }
  }

  const handleAddExpense = async () => {
    if (!connected || !walletAddress || !expenseAmount) return
    setIsSubmitting(true)
    try {
      const amount = parseTokenAmount(expenseAmount)
      const participantWallets = members.map((m) => m.wallet)
      const splits = calculateSplits(amount, participantWallets, splitMethod)

      await dbAddExpense({
        groupId,
        payer: walletAddress,
        amount,
        mint: group?.stablecoin_mint || DEFAULT_STABLECOIN.mint,
        memo: expenseMemo,
        category: expenseCategory,
        splitMethod,
        splits,
      })

      toast.success(`Expense of $${expenseAmount} added!`)
      setShowAddExpense(false)
      setExpenseAmount("")
      setExpenseMemo("")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSettle = async (transfer: SettlementTransfer) => {
    if (!connected || !publicKey) return
    setIsSettling(true)
    setSettlingTransfer(transfer)
    try {
      const wallet = (window as any).solana
      if (!wallet) throw new Error("No wallet found")

      const { signature } = await executeSettlement(
        wallet,
        walletAddress,
        transfer.to,
        transfer.amount,
        group?.stablecoin_mint || DEFAULT_STABLECOIN.mint
      )

      await dbAddSettlement({
        groupId,
        fromWallet: walletAddress,
        toWallet: transfer.to,
        amount: transfer.amount,
        mint: group?.stablecoin_mint || DEFAULT_STABLECOIN.mint,
        txSig: signature,
      })

      toast.success(`Settled $${formatTokenAmount(transfer.amount)}!`, {
        description: `TX: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
      })
      loadData()
    } catch (error) {
      if (error instanceof Error && error.message === "TRANSACTION_CANCELLED") {
        toast.info("Transaction cancelled")
      } else {
        toast.error(error instanceof Error ? error.message : "Settlement failed")
      }
    } finally {
      setIsSettling(false)
      setSettlingTransfer(null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Group Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This group doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={() => router.push("/groups")} className="bg-accent hover:bg-accent/90">
              View Groups
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const mintInfo = Object.values(STABLECOIN_MINTS).find((m) => m.mint === group.stablecoin_mint)
  const tokenName = mintInfo?.name || "Token"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Group Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <Badge className="bg-accent/10 text-accent border-accent/20">
                {group.mode === "split" ? "Split Mode" : "Fund Mode"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <button onClick={handleCopyCode} className="flex items-center gap-1 hover:text-foreground transition-colors">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : group.code}
              </button>
              <span>·</span>
              <span>{tokenName}</span>
              <span>·</span>
              <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              <Share2 className="h-4 w-4 mr-2" />
              Invite
            </Button>
            {isMember && (
              <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={() => setShowAddExpense(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            )}
          </div>
        </div>

        {/* Join prompt if not a member */}
        {!isMember && connected && (
          <Card className="p-6 mb-6 border-accent/30 bg-accent/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Join this group</h3>
                <p className="text-sm text-muted-foreground">
                  You&apos;re not a member yet. Join to start splitting expenses.
                </p>
              </div>
              <Button className="bg-accent hover:bg-accent/90" onClick={handleJoin}>
                Join Group
              </Button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balances */}
            {isMember && balances.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Balances</h2>
                <div className="space-y-3">
                  {balances.map((bal) => (
                    <div key={bal.wallet} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <WalletAvatar address={bal.wallet} size={32} />
                        <span className="font-medium">{bal.displayName}</span>
                        {bal.wallet === walletAddress && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <span className={`font-semibold ${bal.amount > 0 ? "text-green-600 dark:text-green-400" : bal.amount < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                        {bal.amount > 0 ? "+" : ""}{formatTokenAmount(bal.amount)} {tokenName}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Settlement Suggestions */}
                {transfers.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Suggested Settlements</h3>
                    <div className="space-y-2">
                      {transfers.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{t.fromName || `${t.from.slice(0, 4)}...`}</span>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            <span>{t.toName || `${t.to.slice(0, 4)}...`}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{formatTokenAmount(t.amount)} {tokenName}</span>
                            {t.from === walletAddress && (
                              <Button
                                size="sm"
                                className="bg-accent hover:bg-accent/90"
                                disabled={isSettling}
                                onClick={() => handleSettle(t)}
                              >
                                {isSettling && settlingTransfer === t ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Settle"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Activity Feed */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Activity</h2>
              {activity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No expenses yet</p>
                  {isMember && (
                    <Button variant="outline" className="mt-3" onClick={() => setShowAddExpense(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add the first expense
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.map((item, i) => {
                    if (item.type === "expense") {
                      const e = item.data
                      return (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{e.memo || e.category}</p>
                              <p className="text-xs text-muted-foreground">
                                {`${e.payer.slice(0, 4)}...${e.payer.slice(-4)}`} paid · {new Date(e.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">{formatTokenAmount(e.amount)} {tokenName}</span>
                        </div>
                      )
                    } else {
                      const s = item.data
                      return (
                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                              <Minus className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Settlement</p>
                              <p className="text-xs text-muted-foreground">
                                {`${s.from_wallet.slice(0, 4)}...`} → {`${s.to_wallet.slice(0, 4)}...`} · {new Date(s.confirmed_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatTokenAmount(s.amount)} {tokenName}
                          </span>
                        </div>
                      )
                    }
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Members */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Members</h2>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <WalletAvatar address={member.wallet} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.display_name || `${member.wallet.slice(0, 6)}...${member.wallet.slice(-4)}`}
                      </p>
                      {member.wallet === group.created_by && (
                        <p className="text-xs text-accent">Creator</p>
                      )}
                    </div>
                    {member.wallet === walletAddress && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Expense Modal */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount ({tokenName})</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g., Dinner, Uber, Groceries"
                value={expenseMemo}
                onChange={(e) => setExpenseMemo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Split Method</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["equal", "exact", "shares", "percentage"] as const).map((method) => (
                  <Button
                    key={method}
                    variant={splitMethod === method ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitMethod(method)}
                    className={splitMethod === method ? "bg-accent hover:bg-accent/90" : ""}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {["general", "food", "transport", "shopping", "accommodation", "entertainment"].map((cat) => (
                  <Button
                    key={cat}
                    variant={expenseCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExpenseCategory(cat)}
                    className={expenseCategory === cat ? "bg-accent hover:bg-accent/90 text-xs" : "text-xs"}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Split equally among {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            <Button
              className="w-full bg-accent hover:bg-accent/90"
              onClick={handleAddExpense}
              disabled={isSubmitting || !expenseAmount}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
