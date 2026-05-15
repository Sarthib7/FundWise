"use client"

export const runtime = "edge"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { ExpenseCurrencyState } from "@/components/group-dashboard/expense-dialog"
import { FundModeBetaSurfaces } from "@/components/group-dashboard/fund-mode-beta-surfaces"
import { GroupSidebar } from "@/components/group-dashboard/group-sidebar"
import { ProfileNameDialog } from "@/components/group-dashboard/profile-name-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGroupDashboard, PROFILE_DISPLAY_NAME_MAX_LENGTH } from "@/hooks/use-group-dashboard"
import { addExpense as dbAddExpense, type ActivityItem, updateExpense as dbUpdateExpense } from "@/lib/db"
import {
  calculateSplits,
  DEFAULT_STABLECOIN,
  formatTokenAmount,
  getClusterForGroupMode,
  parseTokenAmount,
  type SettlementTransfer,
} from "@/lib/expense-engine"
import type { Database } from "@/lib/database.types"
import { toast } from "sonner"
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  Landmark,
  Loader2,
  Receipt,
  Share2,
  Wallet,
} from "lucide-react"

const SplitModeDashboard = dynamic(
  () =>
    import("@/components/group-dashboard/split-mode-dashboard").then(
      (module) => module.SplitModeDashboard
    ),
  {
    loading: () => (
      <Card className="p-6 text-sm text-muted-foreground">Loading Split Mode...</Card>
    ),
  }
)

const FundModeDashboard = dynamic(
  () =>
    import("@/components/group-dashboard/fund-mode-dashboard").then(
      (module) => module.FundModeDashboard
    ),
  {
    loading: () => (
      <Card className="p-6 text-sm text-muted-foreground">Loading Fund Mode...</Card>
    ),
  }
)

const ExpenseDialog = dynamic(
  () =>
    import("@/components/group-dashboard/expense-dialog").then(
      (module) => module.ExpenseDialog
    ),
  { ssr: false }
)

const CrossChainBridgeModal = dynamic(
  () =>
    import("@/components/cross-chain-bridge-modal").then(
      (module) => module.CrossChainBridgeModal
    ),
  { ssr: false }
)

const InviteGroupDialog = dynamic(
  () =>
    import("@/components/invite-group-dialog").then(
      (module) => module.InviteGroupDialog
    ),
  { ssr: false }
)

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

function buildRedistributedPercentageSplitInputs(
  participantWallets: string[],
  editedWallet: string,
  rawValue: string
): ExpenseCustomSplitValues {
  if (participantWallets.length === 0) {
    return {}
  }

  const trimmedValue = rawValue.trim()
  const parsedPercentage = Number(trimmedValue)
  const editedBasisPoints =
    trimmedValue === "" || !Number.isFinite(parsedPercentage)
      ? 0
      : Math.min(PERCENTAGE_BASIS_POINTS, Math.max(0, Math.round(parsedPercentage * 100)))
  const otherWallets = participantWallets.filter((wallet) => wallet !== editedWallet)
  const redistributedBasisPoints = PERCENTAGE_BASIS_POINTS - editedBasisPoints
  const redistributedSplits =
    otherWallets.length > 0
      ? calculateSplits(redistributedBasisPoints, otherWallets, "equal")
      : []
  const redistributedByWallet = new Map(
    redistributedSplits.map((split) => [split.wallet, split.share])
  )

  return Object.fromEntries(
    participantWallets.map((wallet) => {
      if (wallet === editedWallet) {
        return [
          wallet,
          trimmedValue === "" ? "" : formatEditableNumber(editedBasisPoints / 100, 2),
        ]
      }

      return [
        wallet,
        formatEditableNumber((redistributedByWallet.get(wallet) || 0) / 100, 2),
      ]
    })
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
      const displayRate =
        expense.source_currency && expense.source_currency !== "USD" && expense.exchange_rate
          ? expense.exchange_rate
          : 1

      return Object.fromEntries(
        participantWallets.map((wallet) => [
          wallet,
          formatEditableTokenAmount(Math.round((splitByWallet.get(wallet) || 0) / displayRate)),
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
  const dashboard = useGroupDashboard()
  const {
    groupId,
    lifiSupported,
    connected,
    walletAddress,
    group,
    members,
    memberCount,
    balances,
    transfers,
    activity,
    contributions,
    proposals,
    treasuryBalance,
    isLoading,
    isMember,
    isWalletVerified,
    copied,
    isSavingProfileName,
    isCreatingTreasury,
    isContributing,
    isCreatingProposal,
    reviewingProposalId,
    executingProposalId,
    editingProposalId,
    commentingProposalId,
    settlingTransfer,
    isSettling,
    pendingSettlementReceipt,
    deletingExpenseId,
    sharingTransferKey,
    tokenName,
    isFundMode,
    isGroupCreator,
    approvalThreshold,
    missingMembersForTreasury,
    treasuryInitReadiness,
    contributionTotal,
    fundingProgress,
    totalSettledVolume,
    memberNameByWallet,
    requestedFromWallet,
    requestedToWallet,
    isInviteLink,
    requestedTransfer,
    requestedDebtorLabel,
    requestedCreditorLabel,
    viewerBalance,
    viewerOutgoingTransfers,
    viewerIncomingTransfers,
    viewerDisplayName,
    suggestedReimbursements,
    connectWallet,
    verifyWalletAccess,
    ensureWalletWriteAccess,
    viewGroups,
    refresh,
    copyGroupCode,
    joinGroup,
    saveProfileName,
    settle,
    recoverSettlementReceipt,
    canDeleteExpense,
    deleteExpense,
    createTreasury,
    contribute,
    createProposal,
    updateProposalMetadata,
    addProposalComment,
    reviewProposal,
    executeProposal,
    clearSettlementRequest,
    shareSettlementRequest,
  } = dashboard
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showBridge, setShowBridge] = useState(false)
  const [bridgeFlow, setBridgeFlow] = useState<"settlement" | "contribution">("settlement")
  const [bridgeInitialAmount, setBridgeInitialAmount] = useState("")
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [fundyLinkCode, setFundyLinkCode] = useState<string | null>(null)
  const [fundyLinkCodeExpiresAt, setFundyLinkCodeExpiresAt] = useState<string | null>(null)
  const [isCreatingFundyLinkCode, setIsCreatingFundyLinkCode] = useState(false)
  const [fundyLinkCommandCopied, setFundyLinkCommandCopied] = useState(false)

  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseMemo, setExpenseMemo] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("general")
  const [expensePayer, setExpensePayer] = useState("")
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal")
  const [customSplitValues, setCustomSplitValues] = useState<ExpenseCustomSplitValues>({})
  const [editingExpense, setEditingExpense] = useState<ActivityExpense | null>(null)
  const [expenseCurrencyState, setExpenseCurrencyState] = useState<ExpenseCurrencyState>({
    sourceCurrency: "USD",
    conversionRate: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [contributionAmount, setContributionAmount] = useState("")

  const expenseDialogParticipantWallets = useMemo(() => {
    return editingExpense
      ? editingExpense.splits.map((split) => split.wallet)
      : members.map((member) => member.wallet)
  }, [editingExpense, members])

  const resetExpenseForm = useCallback(() => {
    setEditingExpense(null)
    setExpenseAmount("")
    setExpenseMemo("")
    setExpenseCategory("general")
    setExpensePayer(walletAddress)
    setSplitMethod("equal")
    setCustomSplitValues({})
    setExpenseCurrencyState({ sourceCurrency: "USD", conversionRate: null })
  }, [walletAddress])

  const openProfileDialog = useCallback(() => {
    setProfileName(viewerDisplayName)
    setShowProfileDialog(true)
  }, [viewerDisplayName])

  const handleSaveProfileDialog = useCallback(async () => {
    const saved = await saveProfileName(profileName)
    if (saved) {
      setShowProfileDialog(false)
    }
  }, [profileName, saveProfileName])

  const copyFundyLinkCommand = useCallback(async (code: string) => {
    const command = `/link ${code}`
    await navigator.clipboard.writeText(command)
    setFundyLinkCommandCopied(true)
    toast.success("Fundy link command copied", { description: command })
  }, [])

  const createFundyLinkCode = useCallback(async () => {
    setIsCreatingFundyLinkCode(true)
    setFundyLinkCommandCopied(false)

    try {
      const response = await fetch("/api/telegram/link-code", { method: "POST" })
      const payload = (await response.json()) as { code?: string; expiresAt?: string; error?: string }

      if (!response.ok || !payload.code || !payload.expiresAt) {
        throw new Error(payload.error || "Failed to create Fundy link code")
      }

      setFundyLinkCode(payload.code)
      setFundyLinkCodeExpiresAt(payload.expiresAt)
      await copyFundyLinkCommand(payload.code)
      toast.success("Fundy link code ready", {
        description: "Paste the copied /link command in your Fundy Telegram DM.",
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create Fundy link code")
    } finally {
      setIsCreatingFundyLinkCode(false)
    }
  }, [copyFundyLinkCommand])

  const handleContribute = useCallback(async () => {
    const contributed = await contribute(contributionAmount)
    if (contributed) {
      setContributionAmount("")
    }
  }, [contribute, contributionAmount])

  const handleCreateProposalFromSuggestion = useCallback(async (
    suggestion: { payerWallet: string; amount: number; memo: string }
  ) => {
    const amountStr = (suggestion.amount / 1e6).toString()
    return createProposal({
      recipientWallet: suggestion.payerWallet,
      amount: amountStr,
      memo: suggestion.memo,
    })
  }, [createProposal])

  const openSettlementFundingRoute = useCallback((transfer: SettlementTransfer) => {
    setBridgeFlow("settlement")
    setBridgeInitialAmount(formatEditableTokenAmount(transfer.amount))
    setShowBridge(true)
  }, [])

  const openContributionFundingRoute = useCallback((amount: string) => {
    setBridgeFlow("contribution")
    setBridgeInitialAmount(amount)
    setShowBridge(true)
  }, [])

  const openCreateExpenseDialog = useCallback(() => {
    setEditingExpense(null)
    setExpenseAmount("")
    setExpenseMemo("")
    setExpenseCategory("general")
    setExpensePayer(walletAddress)
    setSplitMethod("equal")
    setCustomSplitValues({})
    setExpenseCurrencyState({ sourceCurrency: "USD", conversionRate: null })
    setShowExpenseDialog(true)
  }, [walletAddress])

  const openEditExpenseDialog = useCallback((expense: ActivityExpense) => {
    const participantWallets = expense.splits.map((split) => split.wallet)

    setEditingExpense(expense)
    setExpenseAmount(formatEditableTokenAmount(expense.source_amount ?? expense.amount))
    setExpenseMemo(expense.memo || "")
    setExpenseCategory(expense.category || "general")
    setExpensePayer(expense.payer)
    setSplitMethod(expense.split_method)
    setExpenseCurrencyState({
      sourceCurrency: (expense.source_currency as ExpenseCurrencyState["sourceCurrency"] | null) || "USD",
      conversionRate: expense.exchange_rate,
    })
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

  const handleCustomSplitValueChange = useCallback((wallet: string, value: string) => {
    if (splitMethod === "percentage") {
      setCustomSplitValues(
        buildRedistributedPercentageSplitInputs(
          expenseDialogParticipantWallets,
          wallet,
          value
        )
      )
      return
    }

    setCustomSplitValues((current) => ({
      ...current,
      [wallet]: value,
    }))
  }, [expenseDialogParticipantWallets, splitMethod])

  const handleSubmitExpense = async () => {
    if (!connected || !walletAddress || !expenseAmount || !group) {
      return
    }

    setIsSubmitting(true)

    try {
      await ensureWalletWriteAccess()
      const parsedAmount = Number(expenseAmount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid Expense amount")
      }

      if (!expensePayer) {
        throw new Error("Choose who paid this Expense")
      }

      const { sourceCurrency, conversionRate } = expenseCurrencyState
      const isNonUsd = sourceCurrency !== "USD"

      if (isNonUsd && (conversionRate == null || conversionRate <= 0)) {
        throw new Error("Wait for the Source Currency conversion quote before saving this Expense")
      }

      const exchangeRate = isNonUsd ? conversionRate! : 1.0
      const exchangeRateSource = isNonUsd ? "open.er-api.com" : "default"
      const usdAmount = parsedAmount * exchangeRate

      const amount = parseTokenAmount(usdAmount.toFixed(6))
      const sourceAmount = parseTokenAmount(expenseAmount)
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
                  splitMethod === "exact"
                    ? parseTokenAmount((parsedValue * exchangeRate).toFixed(6))
                    : parsedValue,
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
        sourceCurrency,
        sourceAmount,
        exchangeRate,
        exchangeRateSource,
        exchangeRateAt: new Date().toISOString(),
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

        toast.success(`Expense of ${expenseAmount} ${isNonUsd ? sourceCurrency : tokenName} added!`)
      }

      handleExpenseDialogOpenChange(false)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Expense")
    } finally {
      setIsSubmitting(false)
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
          <Card className="max-w-lg p-8 text-center sm:p-10">
            <Badge variant="outline" className="mb-4">
              Group link issue
            </Badge>
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="text-3xl font-bold tracking-tight">Group Not Found</h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              This Group link may be old, the invite may belong to a different wallet, or the Group may have been removed.
            </p>
            <div className="mt-6 rounded-xl border border-dashed p-4 text-left">
              <p className="text-sm font-medium">Try this next</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Open your Groups list to check whether you already joined with this wallet, or go back home and enter a fresh invite code.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={viewGroups} className="bg-accent hover:bg-accent/90">
                View Groups
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back Home</Link>
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header cluster={getClusterForGroupMode(group.mode)} />

      <main className="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {connected && !isWalletVerified && (
          <Card className="p-6 mb-6 border-accent/30 bg-accent/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant="outline" className="mb-2">
                  Wallet verification
                </Badge>
                <h3 className="font-semibold mb-1">
                  {isInviteLink ? `Verify your wallet for ${group.name}` : "Verify your wallet to open this Group"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  FundWise reveals Group ledgers only to wallets that verify this browser session. Sign one short message to load the live Balance, Treasury, and Member state.
                </p>
              </div>
              <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto" onClick={() => void verifyWalletAccess()}>
                Verify Wallet
              </Button>
            </div>
          </Card>
        )}

        {!isMember && connected && isWalletVerified && (
          <Card className="p-6 mb-6 border-accent/30 bg-accent/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isInviteLink ? (
                  <Badge variant="outline" className="mb-2">
                    Invite link
                  </Badge>
                ) : null}
                <h3 className="font-semibold mb-1">
                  {`Join ${group.name}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isFundMode
                    ? isInviteLink
                      ? "This invite returns you to the Group Treasury context after wallet connect. Join to start making Contributions."
                      : "Join to make Contributions and participate in this Group Treasury."
                    : isInviteLink
                      ? "This is FundWise in action: a private Group ledger, exact Balances, and wallet-confirmed Settlements. Join to see how this Group works."
                      : "Join to start tracking Expenses and Settlements in this Group."}
                </p>
              </div>
              <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto" onClick={() => void joinGroup()}>
                Join {group.name}
              </Button>
            </div>
          </Card>
        )}

        {!connected && (
          <Card className="mb-6 overflow-hidden border-accent/20 bg-gradient-to-br from-accent/8 via-background to-background">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Badge className="bg-accent/10 text-accent border-accent/20">
                  {isInviteLink ? "Invite link" : "Wallet required"}
                </Badge>
                <h2 className="text-xl font-semibold">
                  {isInviteLink ? "Connect your wallet to open this invite" : "Connect your wallet to open this Group"}
                </h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {isInviteLink
                    ? `Someone invited you to ${group.name}. Connect first, then join from this exact Group context and see the ledger before anything moves.`
                    : "FundWise is wallet-native. Connect first, then join this Group, view the live Balance state, and settle exact USDC amounts from the same screen."}
                </p>
              </div>
              <Button
                type="button"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto"
                onClick={connectWallet}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          </Card>
        )}

        <div className="overflow-hidden rounded-[22px] border border-brand-border-c bg-card shadow-[0_0_0_1px_#d5e8da,0_32px_72px_rgba(13,31,20,0.08),0_12px_24px_rgba(13,31,20,0.05)]">
          <div className="flex items-center gap-[7px] border-b border-brand-border-c bg-brand-surface px-[18px] py-3">
            <div className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <div className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <div className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
          </div>

          <div className="grid xl:grid-cols-[320px_1fr]">
            <aside className="order-2 border-t border-brand-border-c bg-brand-surface/70 p-4 sm:p-5 xl:order-1 xl:border-r xl:border-t-0">
              <GroupSidebar
                isFundMode={isFundMode}
                isMember={isMember}
                walletAddress={walletAddress}
                memberCount={memberCount}
                members={members}
                groupCreatorWallet={group.created_by}
                onInvite={() => setShowInviteDialog(true)}
                onEditProfile={openProfileDialog}
              />
            </aside>

            <section className="order-1 min-w-0 space-y-6 p-4 sm:p-6 xl:order-2 xl:p-7">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      {isFundMode ? "Fund Mode" : "Split Mode"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                    <button
                      onClick={copyGroupCode}
                      className="inline-flex min-h-10 items-center gap-1 rounded-md px-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : group.code}
                    </button>
                    <span>·</span>
                    <span>{tokenName}</span>
                    <span>·</span>
                    <span>
                      {memberCount} Member{memberCount !== 1 ? "s" : ""}
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
                  {isMember && walletAddress ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 sm:min-h-10"
                      onClick={() => void createFundyLinkCode()}
                      disabled={isCreatingFundyLinkCode}
                    >
                      {isCreatingFundyLinkCode ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Bot className="h-4 w-4 mr-2" />
                      )}
                      Link Fundy
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-11 sm:min-h-10"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                  {isFundMode && isMember && group.treasury_address && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-11 sm:min-h-10"
                      onClick={openCreateExpenseDialog}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Log Expense
                    </Button>
                  )}
                  {isFundMode && isMember && isGroupCreator && !group.treasury_address && (
                    <Button
                      size="sm"
                      className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                      onClick={() => void createTreasury()}
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

              {fundyLinkCode ? (
                <Card className="border-accent/20 bg-accent/5 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Fundy link code ready</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        DM Fundy this command to connect Telegram to your FundWise wallet.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <code className="rounded-md border bg-background px-3 py-2 font-mono text-sm">
                        /link {fundyLinkCode}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11 sm:min-h-10"
                        onClick={() => void copyFundyLinkCommand(fundyLinkCode)}
                      >
                        {fundyLinkCommandCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy
                      </Button>
                    </div>
                  </div>
                  {fundyLinkCodeExpiresAt ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Expires at {new Date(fundyLinkCodeExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
                    </p>
                  ) : null}
                </Card>
              ) : null}

              {!isFundMode && (
                <SplitModeDashboard
                  connected={connected}
                  isWalletVerified={isWalletVerified}
                  isMember={isMember}
                  lifiSupported={lifiSupported}
                  walletAddress={walletAddress}
                  groupName={group.name}
                  tokenName={tokenName}
                  requestedFromWallet={requestedFromWallet}
                  requestedToWallet={requestedToWallet}
                  requestedDebtorLabel={requestedDebtorLabel}
                  requestedCreditorLabel={requestedCreditorLabel}
                  requestedTransfer={requestedTransfer}
                  sharingTransferKey={sharingTransferKey}
                  isSettling={isSettling}
                  pendingSettlementReceipt={pendingSettlementReceipt}
                  settlingTransfer={settlingTransfer}
                  isSubmitting={isSubmitting}
                  deletingExpenseId={deletingExpenseId}
                  balances={balances}
                  activity={activity}
                  viewerBalance={viewerBalance}
                  viewerOutgoingTransfers={viewerOutgoingTransfers}
                  viewerIncomingTransfers={viewerIncomingTransfers}
                  memberNameByWallet={memberNameByWallet}
                  onConnectWallet={connectWallet}
                  onJoin={joinGroup}
                  onClearSettlementRequest={clearSettlementRequest}
                  onShareSettlementRequest={shareSettlementRequest}
                  onSettle={settle}
                  onRecoverSettlementReceipt={recoverSettlementReceipt}
                  onOpenSettlementFundingRoute={openSettlementFundingRoute}
                  onOpenCreateExpenseDialog={openCreateExpenseDialog}
                  onOpenEditExpenseDialog={openEditExpenseDialog}
                  onDeleteExpense={deleteExpense}
                  canDeleteExpense={canDeleteExpense}
                />
              )}

              {isFundMode && isMember && walletAddress && (
                <FundModeBetaSurfaces
                  groupId={group.id}
                  authenticatedWallet={walletAddress}
                  groupCreatedAt={group.created_at}
                  memberCount={memberCount}
                  contributionTotal={contributionTotal}
                  isGroupCreator={isGroupCreator}
                />
              )}

              {isFundMode && (
                <FundModeDashboard
                  tokenName={tokenName}
                  treasuryAddress={group.treasury_address}
                  multisigAddress={group.multisig_address}
                  fundingGoal={group.funding_goal}
                  treasuryBalance={treasuryBalance}
                  contributionTotal={contributionTotal}
                  fundingProgress={fundingProgress}
                  approvalThreshold={approvalThreshold}
                  membersCount={memberCount}
                  missingMembersForTreasury={missingMembersForTreasury}
                  treasuryInitReadiness={treasuryInitReadiness}
                  contributions={contributions}
                  proposals={proposals}
                  members={members}
                  memberNameByWallet={memberNameByWallet}
                  walletAddress={walletAddress}
                  isGroupCreator={isGroupCreator}
                  isMember={isMember}
                  connected={connected}
                  isWalletVerified={isWalletVerified}
                  lifiSupported={lifiSupported}
                  isCreatingTreasury={isCreatingTreasury}
                  isContributing={isContributing}
                  isCreatingProposal={isCreatingProposal}
                  reviewingProposalId={reviewingProposalId}
                  executingProposalId={executingProposalId}
                  editingProposalId={editingProposalId}
                  commentingProposalId={commentingProposalId}
                  contributionAmount={contributionAmount}
                  onContributionAmountChange={setContributionAmount}
                  onOpenContributionFundingRoute={openContributionFundingRoute}
                  onCreateTreasury={createTreasury}
                  onContribute={handleContribute}
                  onCreateProposal={createProposal}
                  onUpdateProposalMetadata={updateProposalMetadata}
                  onAddProposalComment={addProposalComment}
                  onReviewProposal={reviewProposal}
                  onExecuteProposal={executeProposal}
                  onJoin={joinGroup}
                  suggestedReimbursements={suggestedReimbursements}
                  onCreateProposalFromSuggestion={handleCreateProposalFromSuggestion}
                />
              )}
            </section>
          </div>
        </div>
      </main>

      {showExpenseDialog && (
        <ExpenseDialog
          open={showExpenseDialog}
          onOpenChange={handleExpenseDialogOpenChange}
          editingExpense={editingExpense}
          tokenName={tokenName}
          members={members}
          expenseAmount={expenseAmount}
          expenseMemo={expenseMemo}
          expenseCategory={expenseCategory}
          expensePayer={expensePayer}
          splitMethod={splitMethod}
          customSplitValues={customSplitValues}
          expenseDialogParticipantWallets={expenseDialogParticipantWallets}
          memberNameByWallet={memberNameByWallet}
          expenseCategories={EXPENSE_CATEGORIES}
          expenseSplitMethods={EXPENSE_SPLIT_METHODS}
          isSubmitting={isSubmitting}
          onExpenseAmountChange={setExpenseAmount}
          onExpenseMemoChange={setExpenseMemo}
          onExpenseCategoryChange={setExpenseCategory}
          onExpensePayerChange={setExpensePayer}
          onSplitMethodChange={handleSplitMethodChange}
          onCustomSplitValueChange={handleCustomSplitValueChange}
          onCurrencyStateChange={setExpenseCurrencyState}
          onSubmit={handleSubmitExpense}
        />
      )}

      {showBridge && (
        <CrossChainBridgeModal
          open={showBridge}
          onOpenChange={setShowBridge}
          destinationAddress={walletAddress}
          groupName={group.name}
          flow={bridgeFlow}
          initialAmount={bridgeInitialAmount}
          onSuccess={(txHash, amount) => {
            if (bridgeFlow === "contribution") {
              setContributionAmount(amount)
            }

            toast.success(
              bridgeFlow === "contribution"
                ? `Top-up submitted for ${amount} USDC. Continue with a Contribution after funds arrive.`
                : `Route submitted for ${amount} USDC. Continue the Settlement after funds arrive.`,
              {
                description: `Source tx: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
              }
            )
          }}
        />
      )}

      <ProfileNameDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        profileName={profileName}
        maxLength={PROFILE_DISPLAY_NAME_MAX_LENGTH}
        isSaving={isSavingProfileName}
        onProfileNameChange={setProfileName}
        onSave={handleSaveProfileDialog}
      />

      {showInviteDialog && (
        <InviteGroupDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          groupId={groupId}
          groupName={group.name}
          groupCode={group.code}
        />
      )}

      <Footer />
    </div>
  )
}
