"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { PublicKey } from "@solana/web3.js"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WalletAvatar } from "@/components/avatar"
import { CrossChainBridgeModal } from "@/components/cross-chain-bridge-modal"
import {
  getFundWiseClusterLabel,
  getSolanaExplorerTxUrl,
} from "@/lib/solana-cluster"
import { isLifiSupportedForCurrentCluster } from "@/lib/lifi-config"
import {
  addContribution as dbAddContribution,
  addExpense as dbAddExpense,
  addMember,
  addSettlement as dbAddSettlement,
  deleteExpense as dbDeleteExpense,
  getActivityFeed,
  getContributions,
  getGroup,
  getMembers,
  isMember as checkIsMember,
  type ActivityItem,
  updateExpense as dbUpdateExpense,
  updateGroupTreasury,
} from "@/lib/db"
import {
  calculateSplits,
  computeGroupBalances,
  DEFAULT_STABLECOIN,
  executeSettlement,
  formatTokenAmount,
  parseTokenAmount,
  simplifySettlements,
  STABLECOIN_MINTS,
  type Balance,
  type SettlementTransfer,
} from "@/lib/expense-engine"
import {
  contributeStablecoinToTreasury,
  createSquadsMultisig,
  getTreasuryStablecoinBalance,
} from "@/lib/squads-multisig"
import type { Database } from "@/lib/database.types"
import { toast } from "sonner"
import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  Copy,
  ExternalLink,
  Landmark,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Receipt,
  Share2,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]
type ActivityExpense = Extract<ActivityItem, { type: "expense" }>["data"]
type SplitMethod = Database["public"]["Enums"]["split_method"]
type ExpenseCustomSplitValues = Record<string, string>

const EXPENSE_CATEGORIES = [
  "general",
  "food",
  "transport",
  "shopping",
  "accommodation",
  "entertainment",
] as const

const EXPENSE_SPLIT_METHODS: SplitMethod[] = ["equal", "exact", "shares", "percentage"]
const PERCENTAGE_BASIS_POINTS = 10_000

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function isRequestedTransfer(
  transfer: SettlementTransfer,
  requestedFromWallet: string,
  requestedToWallet: string
) {
  return transfer.from === requestedFromWallet && transfer.to === requestedToWallet
}

function formatEditableTokenAmount(amount: number, decimals: number = 6) {
  const formatted = (amount / Math.pow(10, decimals)).toFixed(decimals)
  return formatted.replace(/\.?0+$/, "") || "0"
}

function formatEditableNumber(value: number, decimals: number = 4) {
  const formatted = value.toFixed(decimals)
  return formatted.replace(/\.?0+$/, "") || "0"
}

function buildEqualExactSplitInputs(
  totalAmount: number,
  participantWallets: string[]
): ExpenseCustomSplitValues {
  if (participantWallets.length === 0) {
    return {}
  }

  return Object.fromEntries(
    calculateSplits(totalAmount, participantWallets, "equal").map((split) => [
      split.wallet,
      formatEditableTokenAmount(split.share),
    ])
  )
}

function buildEqualPercentageSplitInputs(participantWallets: string[]): ExpenseCustomSplitValues {
  if (participantWallets.length === 0) {
    return {}
  }

  return Object.fromEntries(
    calculateSplits(PERCENTAGE_BASIS_POINTS, participantWallets, "equal").map((split) => [
      split.wallet,
      formatEditableNumber(split.share / 100, 2),
    ])
  )
}

function buildShareSplitInputsFromExpense(expense: ActivityExpense): ExpenseCustomSplitValues {
  const positiveShares = expense.splits.filter((split) => split.share > 0).map((split) => split.share)
  const smallestPositiveShare = positiveShares.length > 0 ? Math.min(...positiveShares) : 1

  return Object.fromEntries(
    expense.splits.map((split) => [
      split.wallet,
      split.share === 0 ? "0" : formatEditableNumber(split.share / smallestPositiveShare),
    ])
  )
}

function buildCustomSplitInputValues(params: {
  participantWallets: string[]
  splitMethod: SplitMethod
  totalAmount: number
  expense?: ActivityExpense | null
}): ExpenseCustomSplitValues {
  const { participantWallets, splitMethod, totalAmount, expense } = params

  if (splitMethod === "equal") {
    return {}
  }

  if (expense) {
    const splitByWallet = new Map(expense.splits.map((split) => [split.wallet, split.share]))

    if (splitMethod === "exact") {
      return Object.fromEntries(
        participantWallets.map((wallet) => [
          wallet,
          formatEditableTokenAmount(splitByWallet.get(wallet) || 0),
        ])
      )
    }

    if (splitMethod === "percentage") {
      let allocatedPercentage = 0

      return Object.fromEntries(
        participantWallets.map((wallet, index) => {
          const share = splitByWallet.get(wallet) || 0
          const percentage =
            expense.amount <= 0
              ? 0
              : index === participantWallets.length - 1
                ? Math.max(0, 100 - allocatedPercentage)
                : (share / expense.amount) * 100

          allocatedPercentage += index === participantWallets.length - 1 ? 0 : percentage

          return [wallet, formatEditableNumber(percentage, 2)]
        })
      )
    }

    if (splitMethod === "shares") {
      return buildShareSplitInputsFromExpense(expense)
    }
  }

  if (splitMethod === "exact") {
    return totalAmount > 0
      ? buildEqualExactSplitInputs(totalAmount, participantWallets)
      : Object.fromEntries(participantWallets.map((wallet) => [wallet, "0"]))
  }

  if (splitMethod === "percentage") {
    return buildEqualPercentageSplitInputs(participantWallets)
  }

  return Object.fromEntries(participantWallets.map((wallet) => [wallet, "1"]))
}

export default function GroupDashboard() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { publicKey, connected, wallet } = useWallet()

  const walletAddress = publicKey?.toString() || ""
  const groupId = params.id as string
  const lifiSupported = isLifiSupportedForCurrentCluster()
  const clusterLabel = getFundWiseClusterLabel()

  const [group, setGroup] = useState<GroupRow | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [transfers, setTransfers] = useState<SettlementTransfer[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)

  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showBridge, setShowBridge] = useState(false)
  const [copied, setCopied] = useState(false)

  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseMemo, setExpenseMemo] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("general")
  const [expensePayer, setExpensePayer] = useState("")
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal")
  const [customSplitValues, setCustomSplitValues] = useState<ExpenseCustomSplitValues>({})
  const [editingExpense, setEditingExpense] = useState<ActivityExpense | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [contributionAmount, setContributionAmount] = useState("")
  const [isCreatingTreasury, setIsCreatingTreasury] = useState(false)
  const [isContributing, setIsContributing] = useState(false)

  const [settlingTransfer, setSettlingTransfer] = useState<SettlementTransfer | null>(null)
  const [isSettling, setIsSettling] = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [sharingTransferKey, setSharingTransferKey] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!groupId) {
      return
    }

    setIsLoading(true)

    try {
      const [groupData, memberData] = await Promise.all([
        getGroup(groupId),
        getMembers(groupId),
      ])

      setGroup(groupData)
      setMembers(memberData)

      const memberCheck = walletAddress ? await checkIsMember(groupId, walletAddress) : false
      setIsMember(memberCheck)

      if (groupData.mode === "split") {
        setContributions([])
        setTreasuryBalance(0)

        if (memberCheck) {
          const [nextBalances, nextActivity] = await Promise.all([
            computeGroupBalances(groupId),
            getActivityFeed(groupId),
          ])

          setBalances(nextBalances)
          setTransfers(simplifySettlements(nextBalances))
          setActivity(nextActivity)
        } else {
          setBalances([])
          setTransfers([])
          setActivity([])
        }

        return
      }

      setBalances([])
      setTransfers([])
      setActivity([])

      const [nextContributions, nextTreasuryBalance] = await Promise.all([
        getContributions(groupId),
        groupData.treasury_address
          ? getTreasuryStablecoinBalance(groupData.treasury_address, groupData.stablecoin_mint)
          : Promise.resolve(0),
      ])

      setContributions(nextContributions)
      setTreasuryBalance(nextTreasuryBalance)
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

  const settlementTimestamps = useMemo(() => {
    return activity
      .filter(
        (item): item is Extract<ActivityItem, { type: "settlement" }> => item.type === "settlement"
      )
      .map((item) => new Date(item.data.confirmed_at).getTime())
  }, [activity])

  const totalSettledVolume = useMemo(() => {
    return activity
      .filter(
        (item): item is Extract<ActivityItem, { type: "settlement" }> => item.type === "settlement"
      )
      .reduce((sum, item) => sum + item.data.amount, 0)
  }, [activity])

  const memberNameByWallet = useMemo(() => {
    return new Map(
      members.map((member) => [
        member.wallet,
        member.display_name || shortWallet(member.wallet),
      ])
    )
  }, [members])

  const requestedFromWallet = searchParams.get("settleFrom") || ""
  const requestedToWallet = searchParams.get("settleTo") || ""
  const hasSettlementRequest = Boolean(requestedFromWallet && requestedToWallet)
  const requestedTransfer = useMemo(
    () =>
      transfers.find((transfer) =>
        isRequestedTransfer(transfer, requestedFromWallet, requestedToWallet)
      ) || null,
    [requestedFromWallet, requestedToWallet, transfers]
  )

  const expenseDialogParticipantWallets = useMemo(() => {
    return editingExpense
      ? editingExpense.splits.map((split) => split.wallet)
      : members.map((member) => member.wallet)
  }, [editingExpense, members])

  const canDeleteExpense = useCallback(
    (expense: ActivityExpense) => {
      const expenseTimestamp = new Date(expense.edited_at || expense.created_at).getTime()
      return !settlementTimestamps.some((settlementTimestamp) => settlementTimestamp > expenseTimestamp)
    },
    [settlementTimestamps]
  )

  const resetExpenseForm = useCallback(() => {
    setEditingExpense(null)
    setExpenseAmount("")
    setExpenseMemo("")
    setExpenseCategory("general")
    setExpensePayer(walletAddress)
    setSplitMethod("equal")
    setCustomSplitValues({})
  }, [walletAddress])

  const openCreateExpenseDialog = useCallback(() => {
    setEditingExpense(null)
    setExpenseAmount("")
    setExpenseMemo("")
    setExpenseCategory("general")
    setExpensePayer(walletAddress)
    setSplitMethod("equal")
    setCustomSplitValues({})
    setShowExpenseDialog(true)
  }, [walletAddress])

  const openEditExpenseDialog = useCallback((expense: ActivityExpense) => {
    const participantWallets = expense.splits.map((split) => split.wallet)

    setEditingExpense(expense)
    setExpenseAmount(formatEditableTokenAmount(expense.amount))
    setExpenseMemo(expense.memo || "")
    setExpenseCategory(expense.category || "general")
    setExpensePayer(expense.payer)
    setSplitMethod(expense.split_method)
    setCustomSplitValues(
      buildCustomSplitInputValues({
        participantWallets,
        splitMethod: expense.split_method,
        totalAmount: expense.amount,
        expense,
      })
    )
    setShowExpenseDialog(true)
  }, [])

  const handleExpenseDialogOpenChange = useCallback((open: boolean) => {
    setShowExpenseDialog(open)

    if (!open) {
      resetExpenseForm()
    }
  }, [resetExpenseForm])

  const handleSplitMethodChange = useCallback((nextMethod: SplitMethod) => {
    const parsedAmount = Number(expenseAmount)
    const totalAmount =
      Number.isFinite(parsedAmount) && parsedAmount > 0 ? parseTokenAmount(expenseAmount) : 0

    setSplitMethod(nextMethod)
    setCustomSplitValues(
      buildCustomSplitInputValues({
        participantWallets: expenseDialogParticipantWallets,
        splitMethod: nextMethod,
        totalAmount,
        expense: editingExpense,
      })
    )
  }, [editingExpense, expenseAmount, expenseDialogParticipantWallets])

  const handleCopyCode = () => {
    if (!group) {
      return
    }

    navigator.clipboard.writeText(group.code)
    setCopied(true)
    toast.success("Group code copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoin = async () => {
    if (!connected || !walletAddress) {
      toast.error("Connect your wallet first")
      return
    }

    try {
      await addMember(groupId, walletAddress)
      toast.success(group?.mode === "fund" ? "Joined Fund Mode group!" : "Joined group!")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join group")
    }
  }

  const handleSubmitExpense = async () => {
    if (!connected || !walletAddress || !expenseAmount || group?.mode !== "split") {
      return
    }

    setIsSubmitting(true)

    try {
      const parsedAmount = Number(expenseAmount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid Expense amount")
      }

      if (!expensePayer) {
        throw new Error("Choose who paid this Expense")
      }

      const amount = parseTokenAmount(expenseAmount)
      const customValues =
        splitMethod === "equal"
          ? undefined
          : Object.fromEntries(
              expenseDialogParticipantWallets.map((participantWallet) => {
                const rawValue = customSplitValues[participantWallet]?.trim() || "0"
                const parsedValue = Number(rawValue)

                if (!Number.isFinite(parsedValue) || parsedValue < 0) {
                  throw new Error(
                    splitMethod === "exact"
                      ? "Enter valid exact amounts for every Member"
                      : splitMethod === "percentage"
                        ? "Enter valid percentages for every Member"
                        : "Enter valid share values for every Member"
                  )
                }

                return [
                  participantWallet,
                  splitMethod === "exact" ? parseTokenAmount(rawValue) : parsedValue,
                ]
              })
            )
      const splits = calculateSplits(
        amount,
        expenseDialogParticipantWallets,
        splitMethod,
        customValues
      )
      const expensePayload = {
        payer: expensePayer,
        amount,
        mint: group.stablecoin_mint || DEFAULT_STABLECOIN.mint,
        memo: expenseMemo,
        category: expenseCategory,
        splitMethod,
        splits,
      }

      if (editingExpense) {
        await dbUpdateExpense({
          expenseId: editingExpense.id,
          actorWallet: walletAddress,
          ...expensePayload,
        })

        toast.success("Expense updated")
      } else {
        await dbAddExpense({
          groupId,
          createdBy: walletAddress,
          ...expensePayload,
        })

        toast.success(`Expense of ${expenseAmount} added!`)
      }

      handleExpenseDialogOpenChange(false)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Expense")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSettle = async (transfer: SettlementTransfer) => {
    if (!connected || !walletAddress || group?.mode !== "split") {
      return
    }

    setIsSettling(true)
    setSettlingTransfer(transfer)

    try {
      const signingWallet = wallet?.adapter ?? (window as { solana?: unknown }).solana

      if (!signingWallet) {
        throw new Error("No wallet found")
      }

      const { signature } = await executeSettlement(
        signingWallet,
        walletAddress,
        transfer.to,
        transfer.amount,
        group.stablecoin_mint || DEFAULT_STABLECOIN.mint
      )

      const settlement = await dbAddSettlement({
        groupId,
        fromWallet: walletAddress,
        toWallet: transfer.to,
        amount: transfer.amount,
        mint: group.stablecoin_mint || DEFAULT_STABLECOIN.mint,
        txSig: signature,
      })

      router.push(`/groups/${groupId}/settlements/${settlement.id}`)
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

  const handleDeleteExpense = async (expense: ActivityExpense, tokenName: string) => {
    if (expense.created_by !== walletAddress) {
      toast.error("Only the Expense creator can delete this Expense")
      return
    }

    if (!canDeleteExpense(expense)) {
      toast.error("This Expense is locked because a later Settlement already exists")
      return
    }

    const confirmed = window.confirm(
      `Delete "${expense.memo || expense.category}" for ${formatTokenAmount(expense.amount)} ${tokenName}?`
    )

    if (!confirmed) {
      return
    }

    setDeletingExpenseId(expense.id)

    try {
      await dbDeleteExpense(expense.id, walletAddress)
      toast.success("Expense deleted")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete expense")
    } finally {
      setDeletingExpenseId(null)
    }
  }

  const handleCreateTreasury = async () => {
    if (!group || group.mode !== "fund" || !connected || !publicKey || !walletAddress) {
      return
    }

    if (group.created_by !== walletAddress) {
      toast.error("Only the group creator can initialize the Treasury")
      return
    }

    const approvalThreshold = group.approval_threshold ?? 1
    if (approvalThreshold > members.length) {
      toast.error(`Invite at least ${approvalThreshold} Members before initializing the Treasury`)
      return
    }

    const signingWallet = wallet?.adapter ?? (window as { solana?: unknown }).solana
    if (!signingWallet) {
      toast.error("No wallet found")
      return
    }

    setIsCreatingTreasury(true)

    try {
      const memberKeys = members.map((member) => new PublicKey(member.wallet))
      const result = await createSquadsMultisig(
        publicKey,
        group.name,
        memberKeys,
        approvalThreshold,
        signingWallet
      )

      await updateGroupTreasury({
        groupId,
        creatorWallet: walletAddress,
        multisigAddress: result.multisigPDA.toString(),
        treasuryAddress: result.vaultPDA.toString(),
      })

      toast.success("Treasury initialized")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to initialize Treasury")
    } finally {
      setIsCreatingTreasury(false)
    }
  }

  const handleContribute = async () => {
    if (!group || group.mode !== "fund" || !connected || !walletAddress || !contributionAmount) {
      return
    }

    if (!isMember) {
      toast.error("Join this Group before making a Contribution")
      return
    }

    if (!group.treasury_address) {
      toast.error("Treasury is not initialized yet")
      return
    }

    const signingWallet = wallet?.adapter ?? (window as { solana?: unknown }).solana
    if (!signingWallet) {
      toast.error("No wallet found")
      return
    }

    setIsContributing(true)

    try {
      const amount = parseTokenAmount(contributionAmount)

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid Contribution amount")
      }

      const { signature } = await contributeStablecoinToTreasury(
        signingWallet,
        walletAddress,
        group.treasury_address,
        group.stablecoin_mint,
        amount
      )

      await dbAddContribution({
        groupId,
        memberWallet: walletAddress,
        amount,
        mint: group.stablecoin_mint,
        txSig: signature,
      })

      toast.success(`Contribution of ${contributionAmount} confirmed`)
      setContributionAmount("")
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to contribute")
    } finally {
      setIsContributing(false)
    }
  }

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
              This Group doesn&apos;t exist or has been removed.
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

  const mintInfo = Object.values(STABLECOIN_MINTS).find((mint) => mint.mint === group.stablecoin_mint)
  const tokenName = mintInfo?.name || "Token"
  const isFundMode = group.mode === "fund"
  const isGroupCreator = group.created_by === walletAddress
  const approvalThreshold = group.approval_threshold ?? 1
  const missingMembersForTreasury = Math.max(0, approvalThreshold - members.length)
  const contributionTotal = contributions.reduce((sum, contribution) => sum + contribution.amount, 0)
  const contributorCount = new Set(contributions.map((contribution) => contribution.member_wallet)).size
  const fundingProgress = group.funding_goal
    ? Math.min(100, Math.round((contributionTotal / group.funding_goal) * 100))
    : 0
  const requestedDebtorLabel =
    memberNameByWallet.get(requestedFromWallet) || (requestedFromWallet ? shortWallet(requestedFromWallet) : "")
  const requestedCreditorLabel =
    memberNameByWallet.get(requestedToWallet) || (requestedToWallet ? shortWallet(requestedToWallet) : "")

  const clearSettlementRequest = () => {
    router.replace(`/groups/${groupId}`, { scroll: false })
  }

  const handleShareSettlementRequest = async (transfer: SettlementTransfer) => {
    const transferKey = `${transfer.from}:${transfer.to}`
    const settlementRequestUrl = new URL(`/groups/${groupId}`, window.location.origin)
    settlementRequestUrl.searchParams.set("settleFrom", transfer.from)
    settlementRequestUrl.searchParams.set("settleTo", transfer.to)

    const debtorLabel = transfer.fromName || shortWallet(transfer.from)
    const creditorLabel = transfer.toName || shortWallet(transfer.to)
    const shareText = `${debtorLabel} owes ${creditorLabel} ${formatTokenAmount(transfer.amount)} ${tokenName} in ${group.name}.`

    setSharingTransferKey(transferKey)

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `${group.name} Settlement Request`,
          text: shareText,
          url: settlementRequestUrl.toString(),
        })
        toast.success("Settlement Request Link shared")
        return
      }

      if (!navigator.clipboard) {
        throw new Error("Clipboard unavailable")
      }

      await navigator.clipboard.writeText(settlementRequestUrl.toString())
      toast.success("Settlement Request Link copied")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }

      try {
        if (!navigator.clipboard) {
          throw new Error("Clipboard unavailable")
        }

        await navigator.clipboard.writeText(settlementRequestUrl.toString())
        toast.success("Settlement Request Link copied")
      } catch {
        toast.error("Failed to share Settlement Request Link")
      }
    } finally {
      setSharingTransferKey(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
              <Badge className="bg-accent/10 text-accent border-accent/20">
                {isFundMode ? "Fund Mode" : "Split Mode"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              <button
                onClick={handleCopyCode}
                className="inline-flex min-h-10 items-center gap-1 rounded-md px-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : group.code}
              </button>
              <span>·</span>
              <span>{tokenName}</span>
              <span>·</span>
              <span>
                {members.length} Member{members.length !== 1 ? "s" : ""}
              </span>
              {!isFundMode && totalSettledVolume > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Receipt className="h-3.5 w-3.5" />
                    {formatTokenAmount(totalSettledVolume)} {tokenName} settled
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
            <Button variant="outline" size="sm" className="min-h-11 sm:min-h-10" onClick={handleCopyCode}>
              <Share2 className="h-4 w-4 mr-2" />
              Invite
            </Button>
            {!isFundMode && isMember && (
              <Button
                size="sm"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                onClick={openCreateExpenseDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            )}
            {isFundMode && isMember && isGroupCreator && !group.treasury_address && (
              <Button
                size="sm"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                onClick={handleCreateTreasury}
                disabled={isCreatingTreasury || missingMembersForTreasury > 0}
              >
                {isCreatingTreasury ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Landmark className="h-4 w-4 mr-2" />
                )}
                Initialize Treasury
              </Button>
            )}
          </div>
        </div>

        {!isMember && connected && (
          <Card className="p-6 mb-6 border-accent/30 bg-accent/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold mb-1">
                  {isFundMode ? "Join this Fund Mode Group" : "Join this Group"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isFundMode
                    ? "Join to make Contributions and participate in this Group Treasury."
                    : "Join to start tracking Expenses and Settlements in this Group."}
                </p>
              </div>
              <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto" onClick={handleJoin}>
                Join Group
              </Button>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isFundMode && hasSettlementRequest && (
              <Card className="p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-accent/10 text-accent border-accent/20">
                        Settlement Request Link
                      </Badge>
                      <Badge variant="outline">Live Balance</Badge>
                    </div>
                    {!connected ? (
                      <>
                        <h2 className="text-lg font-semibold">Connect your wallet to open this request</h2>
                        <p className="text-sm text-muted-foreground">
                          This link resolves against the Group&apos;s current live Balance state, not a fixed amount.
                        </p>
                      </>
                    ) : !isMember ? (
                      <>
                        <h2 className="text-lg font-semibold">Join this Group to view the live settlement state</h2>
                        <p className="text-sm text-muted-foreground">
                          Once you join, FundWise will show whether this debtor still owes this creditor and the current settleable amount.
                        </p>
                      </>
                    ) : requestedTransfer ? (
                      <>
                        <h2 className="text-lg font-semibold">
                          {requestedDebtorLabel} currently owes {requestedCreditorLabel}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          The request resolves from the live simplified settlement graph for this Group.
                        </p>
                        <p className="text-2xl font-semibold">
                          {formatTokenAmount(requestedTransfer.amount)} {tokenName}
                        </p>
                        {walletAddress !== requestedTransfer.from && (
                          <p className="text-xs text-muted-foreground">
                            Only the debtor can sign this Settlement. Other Members can still share the request link.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold">This Settlement Request Link is no longer active</h2>
                        <p className="text-sm text-muted-foreground">
                          The live Group Balance no longer contains this exact debtor-to-creditor transfer edge.
                        </p>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="self-start" onClick={clearSettlementRequest}>
                    Dismiss
                  </Button>
                </div>

                {connected && isMember && requestedTransfer && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => handleShareSettlementRequest(requestedTransfer)}
                      disabled={sharingTransferKey === `${requestedTransfer.from}:${requestedTransfer.to}`}
                    >
                      {sharingTransferKey === `${requestedTransfer.from}:${requestedTransfer.to}` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4 mr-2" />
                      )}
                      Share Link
                    </Button>
                    {walletAddress === requestedTransfer.from && (
                      <Button
                        className="w-full bg-accent hover:bg-accent/90 sm:w-auto"
                        disabled={isSettling}
                        onClick={() => handleSettle(requestedTransfer)}
                      >
                        {isSettling && settlingTransfer === requestedTransfer ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Settle Now
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )}

            {!isFundMode && isMember && balances.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Balances</h2>
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div key={balance.wallet} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <WalletAvatar address={balance.wallet} size={32} />
                        <span className="truncate font-medium">{balance.displayName}</span>
                        {balance.wallet === walletAddress && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <span
                        className={`font-semibold ${
                          balance.amount > 0
                            ? "text-green-600 dark:text-green-400"
                            : balance.amount < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                        } sm:text-right`}
                      >
                        {balance.amount > 0 ? "+" : ""}
                        {formatTokenAmount(balance.amount)} {tokenName}
                      </span>
                    </div>
                  ))}
                </div>

                {transfers.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Suggested Settlements
                    </h3>
                    <div className="space-y-2">
                      {transfers.map((transfer, index) => {
                        const isRequested = isRequestedTransfer(
                          transfer,
                          requestedFromWallet,
                          requestedToWallet
                        )
                        const transferKey = `${transfer.from}:${transfer.to}`

                        return (
                          <div
                            key={`${transfer.from}-${transfer.to}-${index}`}
                            className={`flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center sm:justify-between ${
                              isRequested ? "border border-accent/40 bg-accent/5" : "bg-muted/50"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span>{transfer.fromName || shortWallet(transfer.from)}</span>
                              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                              <span>{transfer.toName || shortWallet(transfer.to)}</span>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Share settlement request link for ${transfer.fromName || shortWallet(transfer.from)} to ${transfer.toName || shortWallet(transfer.to)}`}
                                className="min-h-10 justify-start text-muted-foreground hover:text-foreground sm:min-h-9 sm:justify-center"
                                disabled={sharingTransferKey === transferKey}
                                onClick={() => handleShareSettlementRequest(transfer)}
                              >
                                {sharingTransferKey === transferKey ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Share2 className="h-4 w-4" />
                                )}
                              </Button>
                              <span className="font-semibold">
                                {formatTokenAmount(transfer.amount)} {tokenName}
                              </span>
                              {transfer.from === walletAddress && (
                                <Button
                                  size="sm"
                                  className="min-h-10 bg-accent hover:bg-accent/90 sm:min-h-9"
                                  disabled={isSettling}
                                  onClick={() => handleSettle(transfer)}
                                >
                                  {isSettling && settlingTransfer === transfer ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Settle"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {!isFundMode && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Activity</h2>
                {activity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No Expenses yet</p>
                    {isMember && (
                      <Button variant="outline" className="mt-3" onClick={openCreateExpenseDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add the first Expense
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activity.map((item, index) => {
                      if (item.type === "expense") {
                        const expense = item.data
                        const expenseCanBeDeleted = canDeleteExpense(expense)
                        const isExpenseOwnedByWallet = expense.created_by === walletAddress
                        const payerLabel =
                          memberNameByWallet.get(expense.payer) || shortWallet(expense.payer)
                        const creatorLabel =
                          memberNameByWallet.get(expense.created_by) || shortWallet(expense.created_by)

                        return (
                          <div
                            key={`${item.type}-${expense.id}-${index}`}
                            className="flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-sm">{expense.memo || expense.category}</p>
                                <p className="text-xs text-muted-foreground">
                                  {payerLabel} paid
                                  {expense.created_by !== expense.payer ? ` · ${creatorLabel} logged` : ""} ·{" "}
                                  {new Date(expense.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {expense.edited_at && (
                                <Badge variant="outline" className="text-[10px]">
                                  Edited
                                </Badge>
                              )}
                              <span className="font-semibold">
                                {formatTokenAmount(expense.amount)} {tokenName}
                              </span>
                              {isExpenseOwnedByWallet &&
                                (expenseCanBeDeleted ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Edit ${expense.memo || expense.category}`}
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      disabled={isSubmitting}
                                      onClick={() => openEditExpenseDialog(expense)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Delete ${expense.memo || expense.category}`}
                                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                      disabled={deletingExpenseId === expense.id}
                                      onClick={() => handleDeleteExpense(expense, tokenName)}
                                    >
                                      {deletingExpenseId === expense.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    Locked After Settlement
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )
                      }

                      const settlement = item.data
                      return (
                        <div
                          key={`${item.type}-${settlement.id}-${index}`}
                          className="flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                              <Minus className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Settlement</p>
                              <p className="text-xs text-muted-foreground">
                                {shortWallet(settlement.from_wallet)} → {shortWallet(settlement.to_wallet)} ·{" "}
                                {new Date(settlement.confirmed_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatTokenAmount(settlement.amount)} {tokenName}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )}

            {isFundMode && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Landmark className="h-4 w-4 text-accent" />
                      Treasury Balance
                    </div>
                    <p className="mt-3 text-2xl font-semibold">
                      {formatTokenAmount(treasuryBalance)} {tokenName}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {group.treasury_address
                        ? `Vault ${shortWallet(group.treasury_address)}`
                        : "Treasury not initialized yet"}
                    </p>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4 text-accent" />
                      Funding Goal
                    </div>
                    <p className="mt-3 text-2xl font-semibold">
                      {group.funding_goal ? `${formatTokenAmount(group.funding_goal)} ${tokenName}` : "No goal"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatTokenAmount(contributionTotal)} {tokenName} contributed
                    </p>
                    {group.funding_goal && (
                      <div className="mt-3 space-y-2">
                        <Progress value={fundingProgress} />
                        <p className="text-[11px] text-muted-foreground">{fundingProgress}% funded</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      Approval Threshold
                    </div>
                    <p className="mt-3 text-2xl font-semibold">
                      {approvalThreshold} of {members.length}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {contributorCount} contributor{contributorCount === 1 ? "" : "s"} so far
                    </p>
                  </Card>
                </div>

                {!group.treasury_address ? (
                  <Card className="p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold">Initialize Treasury</h2>
                        <p className="text-sm text-muted-foreground">
                          Create the Squads multisig and Treasury vault for this Fund Mode Group.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Treasury signers are captured from the current Member list when initialization happens.
                        </p>
                        {missingMembersForTreasury > 0 && (
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            Invite {missingMembersForTreasury} more Member{missingMembersForTreasury === 1 ? "" : "s"} before a {approvalThreshold}-of-{members.length + missingMembersForTreasury} Treasury can be initialized.
                          </p>
                        )}
                      </div>
                      {isGroupCreator ? (
                        <Button
                          className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto"
                          onClick={handleCreateTreasury}
                          disabled={isCreatingTreasury || missingMembersForTreasury > 0}
                        >
                          {isCreatingTreasury ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Landmark className="h-4 w-4 mr-2" />
                          )}
                          Initialize Treasury
                        </Button>
                      ) : (
                        <Badge variant="outline">Creator Action</Badge>
                      )}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6">
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">Make a Contribution</h2>
                        <p className="text-sm text-muted-foreground">
                          Transfer stablecoins from your connected Solana wallet into this Group Treasury.
                        </p>
                      </div>
                      <Badge className="bg-accent/10 text-accent border-accent/20">Treasury Live</Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-5">
                      <div className="rounded-lg border p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          Vault Address
                        </p>
                        <p className="font-mono text-sm break-all">{group.treasury_address}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          Multisig Address
                        </p>
                        <p className="font-mono text-sm break-all">{group.multisig_address}</p>
                      </div>
                    </div>

                    {isMember ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 space-y-2">
                          <Label>Contribution Amount ({tokenName})</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="25.00"
                            value={contributionAmount}
                            onChange={(event) => setContributionAmount(event.target.value)}
                          />
                        </div>
                        <Button
                          className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:self-end"
                          disabled={isContributing || !contributionAmount}
                          onClick={handleContribute}
                        >
                          {isContributing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Wallet className="h-4 w-4 mr-2" />
                          )}
                          Contribute
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Join this Group first to make a Contribution.
                      </div>
                    )}
                  </Card>
                )}

                <Card className="p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">Contributions</h2>
                      <p className="text-sm text-muted-foreground">
                        Every Contribution recorded for this Group Treasury.
                      </p>
                    </div>
                    <Badge variant="outline">
                      {contributions.length} Contribution{contributions.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {contributions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No Contributions yet</p>
                      <p className="mt-1 text-xs">
                        Bridge into Solana or contribute directly once the Treasury is live.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contributions.map((contribution) => (
                        <div
                          key={contribution.id}
                          className="flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <WalletAvatar address={contribution.member_wallet} size={32} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-sm">{shortWallet(contribution.member_wallet)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(contribution.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatTokenAmount(contribution.amount)} {tokenName}
                            </p>
                            <a
                              href={getSolanaExplorerTxUrl(contribution.tx_sig)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                            >
                              View tx
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>

          <div className="space-y-6">
            {isMember && (
              <Card className="p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
                <h3 className="text-lg font-semibold mb-2">
                  {isFundMode ? "Bridge USDC To Contribute" : "Bridge USDC To Solana"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isFundMode
                    ? "Top up your Solana wallet from Base, Ethereum, or another EVM chain before making a Contribution to this Group Treasury."
                    : "Top up your Solana wallet from Base, Ethereum, or another EVM chain before settling in this Group."}
                </p>
                {!lifiSupported && (
                  <p className="mb-4 text-xs text-muted-foreground">
                    LI.FI only routes into Solana mainnet. FundWise is currently using {clusterLabel}, so this bridge stays disabled until the app moves to mainnet.
                  </p>
                )}
                <Button
                  className="min-h-11 w-full bg-accent hover:bg-accent/90"
                  onClick={() => setShowBridge(true)}
                  disabled={!lifiSupported}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Bridge To My Wallet
                </Button>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Members</h2>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <WalletAvatar address={member.wallet} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.display_name || shortWallet(member.wallet)}
                      </p>
                      {member.wallet === group.created_by && (
                        <p className="text-xs text-accent">Creator</p>
                      )}
                    </div>
                    {member.wallet === walletAddress && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {!isFundMode && (
        <Dialog open={showExpenseDialog} onOpenChange={handleExpenseDialogOpenChange}>
          <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Amount ({tokenName})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={expenseAmount}
                      onChange={(event) => setExpenseAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paid By</Label>
                  <Select value={expensePayer} onValueChange={setExpensePayer}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select the payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.wallet}>
                          {member.display_name || shortWallet(member.wallet)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="e.g., Dinner, Uber, Groceries"
                  value={expenseMemo}
                  onChange={(event) => setExpenseMemo(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Split Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_SPLIT_METHODS.map((method) => (
                    <Button
                      key={method}
                      variant={splitMethod === method ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSplitMethodChange(method)}
                      className={splitMethod === method ? "bg-accent hover:bg-accent/90" : ""}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              {splitMethod !== "equal" && (
                <div className="space-y-3">
                  <Label>
                    {splitMethod === "exact"
                      ? `Exact ${tokenName} amounts`
                      : splitMethod === "percentage"
                        ? "Percentages"
                        : "Relative shares"}
                  </Label>
                  <div className="space-y-3 rounded-lg border p-4">
                    {expenseDialogParticipantWallets.map((participantWallet) => (
                      <div
                        key={participantWallet}
                        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center sm:gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {memberNameByWallet.get(participantWallet) || shortWallet(participantWallet)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participantWallet === expensePayer ? "Selected as payer" : "Included in this Expense"}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          step={splitMethod === "shares" ? "0.1" : "0.01"}
                          placeholder={splitMethod === "shares" ? "1" : "0.00"}
                          value={customSplitValues[participantWallet] || ""}
                          onChange={(event) =>
                            setCustomSplitValues((current) => ({
                              ...current,
                              [participantWallet]: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <Button
                      key={category}
                      variant={expenseCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpenseCategory(category)}
                      className={expenseCategory === category ? "bg-accent hover:bg-accent/90 text-xs" : "text-xs"}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {splitMethod === "equal"
                  ? `Split equally among ${expenseDialogParticipantWallets.length} Member${expenseDialogParticipantWallets.length !== 1 ? "s" : ""}`
                  : `This Expense currently includes ${expenseDialogParticipantWallets.length} Member${expenseDialogParticipantWallets.length !== 1 ? "s" : ""}.`}
              </p>
              <Button
                className="min-h-11 w-full bg-accent hover:bg-accent/90"
                onClick={handleSubmitExpense}
                disabled={isSubmitting || !expenseAmount || !expensePayer}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingExpense ? "Save Changes" : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CrossChainBridgeModal
        open={showBridge}
        onOpenChange={setShowBridge}
        destinationAddress={walletAddress}
        groupName={group.name}
        onSuccess={(txHash, amount) => {
          toast.success(
            isFundMode
              ? `Bridged ${amount} USDC toward your Solana wallet. Continue with a Contribution next.`
              : `Bridged ${amount} USDC toward your Solana wallet.`,
            {
              description: `Source tx: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
            }
          )
        }}
      />

      <Footer />
    </div>
  )
}
