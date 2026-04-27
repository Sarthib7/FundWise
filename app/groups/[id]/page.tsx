"use client"

import { useCallback, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ExpenseDialog } from "@/components/group-dashboard/expense-dialog"
import { FundModeDashboard } from "@/components/group-dashboard/fund-mode-dashboard"
import { GroupSidebar } from "@/components/group-dashboard/group-sidebar"
import { ProfileNameDialog } from "@/components/group-dashboard/profile-name-dialog"
import { SplitModeDashboard } from "@/components/group-dashboard/split-mode-dashboard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CrossChainBridgeModal } from "@/components/cross-chain-bridge-modal"
import { useGroupDashboard, PROFILE_DISPLAY_NAME_MAX_LENGTH } from "@/hooks/use-group-dashboard"
import { addExpense as dbAddExpense, type ActivityItem, updateExpense as dbUpdateExpense } from "@/lib/db"
import {
  calculateSplits,
  DEFAULT_STABLECOIN,
  formatTokenAmount,
  parseTokenAmount,
} from "@/lib/expense-engine"
import type { Database } from "@/lib/database.types"
import { toast } from "sonner"
import {
  AlertCircle,
  Check,
  Copy,
  Landmark,
  Loader2,
  Plus,
  Receipt,
  Share2,
  Wallet,
} from "lucide-react"

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
  const dashboard = useGroupDashboard()
  const {
    groupId,
    clusterLabel,
    lifiSupported,
    connected,
    walletAddress,
    group,
    members,
    balances,
    transfers,
    activity,
    contributions,
    treasuryBalance,
    isLoading,
    isMember,
    copied,
    isSavingProfileName,
    isCreatingTreasury,
    isContributing,
    settlingTransfer,
    isSettling,
    deletingExpenseId,
    sharingTransferKey,
    tokenName,
    isFundMode,
    isGroupCreator,
    approvalThreshold,
    missingMembersForTreasury,
    contributionTotal,
    contributorCount,
    fundingProgress,
    totalSettledVolume,
    memberNameByWallet,
    requestedFromWallet,
    requestedToWallet,
    requestedTransfer,
    requestedDebtorLabel,
    requestedCreditorLabel,
    viewerBalance,
    viewerOutgoingTransfers,
    viewerIncomingTransfers,
    viewerDisplayName,
    connectWallet,
    viewGroups,
    refresh,
    copyGroupCode,
    joinGroup,
    saveProfileName,
    settle,
    canDeleteExpense,
    deleteExpense,
    createTreasury,
    contribute,
    clearSettlementRequest,
    shareSettlementRequest,
  } = dashboard
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [showBridge, setShowBridge] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [profileName, setProfileName] = useState("")

  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseMemo, setExpenseMemo] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("general")
  const [expensePayer, setExpensePayer] = useState("")
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal")
  const [customSplitValues, setCustomSplitValues] = useState<ExpenseCustomSplitValues>({})
  const [editingExpense, setEditingExpense] = useState<ActivityExpense | null>(null)
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
  }, [walletAddress])

  const openProfileDialog = useCallback(() => {
    setProfileName(viewerDisplayName)
    setShowProfileDialog(true)
  }, [viewerDisplayName])

  const handleSaveProfileDialog = useCallback(async () => {
    try {
      await saveProfileName(profileName)
      setShowProfileDialog(false)
    } catch {
      // The hook already surfaces the failure to the user.
    }
  }, [profileName, saveProfileName])

  const handleContribute = useCallback(async () => {
    await contribute(contributionAmount)
    setContributionAmount("")
  }, [contribute, contributionAmount])

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
          <Card className="p-8 max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Group Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This Group doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={viewGroups} className="bg-accent hover:bg-accent/90">
              View Groups
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    )
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
            <Button variant="outline" size="sm" className="min-h-11 sm:min-h-10" onClick={copyGroupCode}>
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
              <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto" onClick={() => void joinGroup()}>
                Join Group
              </Button>
            </div>
          </Card>
        )}

        {!connected && (
          <Card className="mb-6 overflow-hidden border-accent/20 bg-gradient-to-br from-accent/8 via-background to-background">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Badge className="bg-accent/10 text-accent border-accent/20">Wallet required</Badge>
                <h2 className="text-xl font-semibold">Connect your wallet to open this Group</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  FundWise is wallet-native. Connect first, then join this Group, view the live Balance state, and settle exact USDC amounts from the same screen.
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

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            {!isFundMode && (
              <SplitModeDashboard
                connected={connected}
                isMember={isMember}
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
                settlingTransfer={settlingTransfer}
                isSubmitting={isSubmitting}
                deletingExpenseId={deletingExpenseId}
                balances={balances}
                transfers={transfers}
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
                onOpenCreateExpenseDialog={openCreateExpenseDialog}
                onOpenEditExpenseDialog={openEditExpenseDialog}
                onDeleteExpense={deleteExpense}
                onInvite={copyGroupCode}
                canDeleteExpense={canDeleteExpense}
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
                membersCount={members.length}
                contributorCount={contributorCount}
                missingMembersForTreasury={missingMembersForTreasury}
                contributions={contributions}
                memberNameByWallet={memberNameByWallet}
                isGroupCreator={isGroupCreator}
                isMember={isMember}
                connected={connected}
                isCreatingTreasury={isCreatingTreasury}
                isContributing={isContributing}
                contributionAmount={contributionAmount}
                onContributionAmountChange={setContributionAmount}
                onCreateTreasury={createTreasury}
                onContribute={handleContribute}
                onJoin={joinGroup}
              />
            )}
          </div>

          <GroupSidebar
            isFundMode={isFundMode}
            isMember={isMember}
            walletAddress={walletAddress}
            lifiSupported={lifiSupported}
            clusterLabel={clusterLabel}
            members={members}
            groupCreatorWallet={group.created_by}
            onOpenBridge={() => setShowBridge(true)}
            onInvite={copyGroupCode}
            onEditProfile={openProfileDialog}
          />
        </div>
      </main>

      {!isFundMode && (
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
          onCustomSplitValueChange={(wallet, value) =>
            setCustomSplitValues((current) => ({
              ...current,
              [wallet]: value,
            }))
          }
          onSubmit={handleSubmitExpense}
        />
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

      <ProfileNameDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        profileName={profileName}
        maxLength={PROFILE_DISPLAY_NAME_MAX_LENGTH}
        isSaving={isSavingProfileName}
        onProfileNameChange={setProfileName}
        onSave={handleSaveProfileDialog}
      />

      <Footer />
    </div>
  )
}
