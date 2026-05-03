"use client"

import { useState } from "react"
import { WalletAvatar } from "@/components/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ActivityItem } from "@/lib/db"
import {
  formatTokenAmount,
  type Balance,
  type SettlementTransfer,
} from "@/lib/expense-engine"
import { SettlementPreviewDialog } from "@/components/settlement-preview-dialog"
import {
  ArrowRightLeft,
  ChevronDown,
  Copy,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Receipt,
  Share2,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react"

type ActivityExpense = Extract<ActivityItem, { type: "expense" }>["data"]

type SplitModeDashboardProps = {
  connected: boolean
  isWalletVerified: boolean
  isMember: boolean
  walletAddress: string
  groupName: string
  tokenName: string
  requestedFromWallet: string
  requestedToWallet: string
  requestedDebtorLabel: string
  requestedCreditorLabel: string
  requestedTransfer: SettlementTransfer | null
  sharingTransferKey: string | null
  isSettling: boolean
  settlingTransfer: SettlementTransfer | null
  isSubmitting: boolean
  deletingExpenseId: string | null
  balances: Balance[]
  transfers: SettlementTransfer[]
  activity: ActivityItem[]
  viewerBalance: Balance | null
  viewerOutgoingTransfers: SettlementTransfer[]
  viewerIncomingTransfers: SettlementTransfer[]
  memberNameByWallet: Map<string, string>
  onConnectWallet: () => void
  onJoin: () => void | Promise<void>
  onClearSettlementRequest: () => void
  onShareSettlementRequest: (transfer: SettlementTransfer) => void | Promise<void>
  onSettle: (transfer: SettlementTransfer) => void | Promise<void>
  onOpenCreateExpenseDialog: () => void
  onOpenEditExpenseDialog: (expense: ActivityExpense) => void
  onDeleteExpense: (expense: ActivityExpense) => Promise<boolean>
  onInvite: () => void
  canDeleteExpense: (expense: ActivityExpense) => boolean
}

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

const VISIBLE_ACTIVITY_COUNT = 5

export function SplitModeDashboard({
  connected,
  isWalletVerified,
  isMember,
  walletAddress,
  groupName,
  tokenName,
  requestedFromWallet,
  requestedToWallet,
  requestedDebtorLabel,
  requestedCreditorLabel,
  requestedTransfer,
  sharingTransferKey,
  isSettling,
  settlingTransfer,
  isSubmitting,
  deletingExpenseId,
  balances,
  transfers,
  activity,
  viewerBalance,
  viewerOutgoingTransfers,
  viewerIncomingTransfers,
  memberNameByWallet,
  onConnectWallet,
  onJoin,
  onClearSettlementRequest,
  onShareSettlementRequest,
  onSettle,
  onOpenCreateExpenseDialog,
  onOpenEditExpenseDialog,
  onDeleteExpense,
  onInvite,
  canDeleteExpense,
}: SplitModeDashboardProps) {
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState<ActivityExpense | null>(null)
  const [previewTransfer, setPreviewTransfer] = useState<SettlementTransfer | null>(null)
  const [showAllActivity, setShowAllActivity] = useState(false)

  const hasSettlementRequest = Boolean(requestedFromWallet && requestedToWallet)
  const viewerOutgoingTransferCount = viewerOutgoingTransfers.length
  const viewerIncomingTransferCount = viewerIncomingTransfers.length
  const expenseCount = activity.filter((item) => item.type === "expense").length
  const settlementCount = activity.filter((item) => item.type === "settlement").length

  const visibleActivity = showAllActivity ? activity : activity.slice(0, VISIBLE_ACTIVITY_COUNT)
  const hasMoreActivity = activity.length > VISIBLE_ACTIVITY_COUNT

  const handleConfirmDelete = async () => {
    if (!pendingDeleteExpense) {
      return
    }

    const deleted = await onDeleteExpense(pendingDeleteExpense)
    if (deleted) {
      setPendingDeleteExpense(null)
    }
  }

  return (
    <>
      {/* Section 1: Settlement request banner (unchanged — only from deep links) */}
      {hasSettlementRequest && (
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
                  <Button
                    type="button"
                    className="mt-2 min-h-11 w-full bg-accent hover:bg-accent/90 sm:w-auto"
                    onClick={onConnectWallet}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                </>
              ) : !isWalletVerified ? (
                <>
                  <h2 className="text-lg font-semibold">Verify your wallet to open this request</h2>
                  <p className="text-sm text-muted-foreground">
                    FundWise only reveals the live settlement state after your connected wallet is verified for this browser session.
                  </p>
                </>
              ) : !isMember ? (
                <>
                  <h2 className="text-lg font-semibold">Join {groupName} to view the live settlement state</h2>
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
            <Button variant="ghost" size="sm" className="self-start" onClick={onClearSettlementRequest}>
              Dismiss
            </Button>
          </div>

          {connected && isMember && requestedTransfer && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onShareSettlementRequest(requestedTransfer)}
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
                  onClick={() => setPreviewTransfer(requestedTransfer)}
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

      {/* Section 2: Merged hero card — balance + stats + balances + settlements */}
      {isMember && (
        <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/8 via-background to-background">
          <div className="p-6 pb-4 space-y-4">
            {/* Balance headline */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                {!viewerBalance || viewerBalance.amount === 0
                  ? "You're all settled"
                  : viewerBalance.amount < 0
                    ? `You owe ${formatTokenAmount(Math.abs(viewerBalance.amount))} ${tokenName}`
                    : `You're owed ${formatTokenAmount(viewerBalance.amount)} ${tokenName}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {!viewerBalance || viewerBalance.amount === 0
                  ? "Log the next Expense or invite another Member."
                  : viewerBalance.amount < 0
                    ? viewerOutgoingTransferCount === 1
                      ? "One Settlement ready right now."
                      : `${viewerOutgoingTransferCount} Settlements ready to clear.`
                    : viewerIncomingTransferCount === 0
                      ? "You're ahead. We'll update when another Member needs to settle."
                      : viewerIncomingTransferCount === 1
                        ? "One Member can settle with you now. Nudge them."
                        : `${viewerIncomingTransferCount} Members can settle with you. Nudge from the list below.`}
              </p>
            </div>

            {/* Primary actions */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {viewerOutgoingTransferCount === 1 ? (
                <Button
                  className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                  disabled={isSettling}
                  onClick={() => setPreviewTransfer(viewerOutgoingTransfers[0])}
                >
                  {isSettling && settlingTransfer === viewerOutgoingTransfers[0] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Settle {formatTokenAmount(viewerOutgoingTransfers[0].amount)} {tokenName}
                </Button>
              ) : viewerOutgoingTransferCount > 1 ? (
                <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10">
                  Review {viewerOutgoingTransferCount} Settlements
                </Button>
              ) : viewerIncomingTransferCount === 1 ? (
                <Button
                  variant="outline"
                  className="min-h-11 sm:min-h-10"
                  disabled={sharingTransferKey === `${viewerIncomingTransfers[0].from}:${viewerIncomingTransfers[0].to}`}
                  onClick={() => onShareSettlementRequest(viewerIncomingTransfers[0])}
                >
                  {sharingTransferKey === `${viewerIncomingTransfers[0].from}:${viewerIncomingTransfers[0].to}` ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Nudge
                </Button>
              ) : (
                <Button
                  className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                  onClick={onOpenCreateExpenseDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
              <Button variant="outline" className="min-h-11 sm:min-h-10" onClick={onInvite}>
                <Copy className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>

            {/* Inline stats */}
            <p className="text-xs text-muted-foreground">
              {memberNameByWallet.size} member{memberNameByWallet.size !== 1 ? "s" : ""}
              {" · "}
              {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
              {" · "}
              {settlementCount} settled
            </p>
          </div>

          {/* Balance chips */}
          {balances.length > 0 && (
            <div className="border-t border-border/50 px-6 py-3">
              <div className="flex flex-wrap gap-2">
                {balances.map((balance) => (
                  <div
                    key={balance.wallet}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      balance.wallet === walletAddress
                        ? "border-accent/30 bg-accent/5"
                        : "border-border/60 bg-muted/30"
                    }`}
                  >
                    <WalletAvatar address={balance.wallet} size={20} />
                    <span className="truncate max-w-[80px] font-medium text-sm">
                      {balance.displayName}
                    </span>
                    <span
                      className={`font-mono tabular-nums font-semibold text-xs ${
                        balance.amount > 0
                          ? "text-green-600 dark:text-green-400"
                          : balance.amount < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {balance.amount > 0 ? "+" : ""}
                      {formatTokenAmount(balance.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settlement rows */}
          {transfers.length > 0 && (
            <div className="border-t border-border/50 px-6 py-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Suggested Settlements
              </p>
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
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                      isRequested ? "border border-accent/40 bg-accent/5" : "bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{transfer.fromName || shortWallet(transfer.from)}</span>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{transfer.toName || shortWallet(transfer.to)}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold font-mono tabular-nums">
                        {formatTokenAmount(transfer.amount)}
                      </span>
                      {transfer.from === walletAddress ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-accent hover:bg-accent/90"
                          disabled={isSettling}
                          onClick={() => setPreviewTransfer(transfer)}
                        >
                          {isSettling && settlingTransfer === transfer ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Settle"
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          disabled={sharingTransferKey === transferKey}
                          onClick={() => onShareSettlementRequest(transfer)}
                        >
                          {sharingTransferKey === transferKey ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Nudge"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Section 3: Compact Activity Feed */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Activity</h2>
            {activity.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {expenseCount} expense{expenseCount !== 1 ? "s" : ""} · {settlementCount} settlement{settlementCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {isMember && activity.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={onOpenCreateExpenseDialog}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>

        {activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-foreground">No Expenses yet</p>
            <p className="mt-1 text-xs">
              {isMember
                ? "Log the first Expense to generate live Balances and suggested Settlements."
                : connected && isWalletVerified
                  ? "Join this Group to start tracking Expenses and Settlements."
                  : connected
                    ? "Verify your wallet to reveal the live Group ledger."
                    : "Connect your wallet to join this Group and start tracking shared Expenses."}
            </p>
            {isMember ? (
              <Button variant="outline" className="mt-4 min-h-11" onClick={onOpenCreateExpenseDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add the first Expense
              </Button>
            ) : connected && isWalletVerified ? (
              <Button className="mt-4 min-h-11 bg-accent hover:bg-accent/90" onClick={() => void onJoin()}>
                Join {groupName}
              </Button>
            ) : !connected ? (
              <Button
                type="button"
                className="mt-4 min-h-11 bg-accent hover:bg-accent/90"
                onClick={onConnectWallet}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-0">
            {visibleActivity.map((item, index) => {
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
                    className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{expense.memo || expense.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {payerLabel} paid
                          {expense.created_by !== expense.payer ? ` · ${creatorLabel} logged` : ""} · {" "}
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
                      <span className="font-semibold font-mono tabular-nums">
                        {formatTokenAmount(expense.amount)} {tokenName}
                        {expense.source_currency && expense.source_currency !== "USD" && expense.source_amount != null && (
                          <>{" "}({formatTokenAmount(expense.source_amount)} {expense.source_currency})</>
                        )}
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
                              onClick={() => onOpenEditExpenseDialog(expense)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${expense.memo || expense.category}`}
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              disabled={deletingExpenseId === expense.id}
                              onClick={() => setPendingDeleteExpense(expense)}
                            >
                              {deletingExpenseId === expense.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Locked
                          </Badge>
                        ))}
                    </div>
                  </div>
                )
              }

              const settlement = item.data
              const settlementFromLabel =
                memberNameByWallet.get(settlement.from_wallet) || shortWallet(settlement.from_wallet)
              const settlementToLabel =
                memberNameByWallet.get(settlement.to_wallet) || shortWallet(settlement.to_wallet)

              return (
                <div
                  key={`${item.type}-${settlement.id}-${index}`}
                  className="flex items-center justify-between border-b py-3 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                      <Minus className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Settlement</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {settlementFromLabel} → {settlementToLabel} · {" "}
                        {new Date(settlement.confirmed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400 font-mono tabular-nums flex-shrink-0">
                    {formatTokenAmount(settlement.amount)} {tokenName}
                  </span>
                </div>
              )
            })}

            {/* Show N more */}
            {hasMoreActivity && !showAllActivity && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllActivity(true)}
                >
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show {activity.length - VISIBLE_ACTIVITY_COUNT} more
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Settlement preview dialog */}
      {previewTransfer && (
        <SettlementPreviewDialog
          open={Boolean(previewTransfer)}
          onOpenChange={(isOpen) => { if (!isOpen) setPreviewTransfer(null) }}
          transfer={previewTransfer}
          tokenName={tokenName}
          viewerWallet={walletAddress}
          isSettling={isSettling}
          onConfirm={() => {
            const t = previewTransfer
            setPreviewTransfer(null)
            return onSettle(t)
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(pendingDeleteExpense)}
        onOpenChange={(open) => {
          if (!open && !deletingExpenseId) {
            setPendingDeleteExpense(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteExpense
                ? `This will remove "${pendingDeleteExpense.memo || pendingDeleteExpense.category}" for ${formatTokenAmount(pendingDeleteExpense.amount)} ${tokenName} from ${groupName}. This cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingExpenseId)}>Keep Expense</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={Boolean(deletingExpenseId)}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmDelete()
              }}
            >
              {pendingDeleteExpense && deletingExpenseId === pendingDeleteExpense.id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
