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
import {
  ArrowRightLeft,
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

export function SplitModeDashboard({
  connected,
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

  const hasSettlementRequest = Boolean(requestedFromWallet && requestedToWallet)
  const viewerOutgoingTransferCount = viewerOutgoingTransfers.length
  const viewerIncomingTransferCount = viewerIncomingTransfers.length
  const expenseCount = activity.filter((item) => item.type === "expense").length

  const scrollToBalances = () => {
    document.getElementById("balances-card")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

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
                  onClick={() => onSettle(requestedTransfer)}
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

      {isMember && (
        <Card className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/8 via-background to-background">
          <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <Badge className="bg-accent/10 text-accent border-accent/20">Your next step</Badge>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                {!viewerBalance || viewerBalance.amount === 0
                  ? "You’re all settled"
                  : viewerBalance.amount < 0
                    ? `You owe ${formatTokenAmount(Math.abs(viewerBalance.amount))} ${tokenName}`
                    : `You’re owed ${formatTokenAmount(viewerBalance.amount)} ${tokenName}`}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {!viewerBalance || viewerBalance.amount === 0
                  ? "You can log the next Expense or invite another Member without clearing anything first."
                  : viewerBalance.amount < 0
                    ? viewerOutgoingTransferCount === 1
                      ? "One Settlement is ready right now. Confirm it to get your Group Balance back to zero."
                      : `${viewerOutgoingTransferCount} Settlements are ready. Review them below and clear what you owe in the smallest number of transfers.`
                    : viewerIncomingTransferCount === 0
                      ? "You’re ahead in this Group. FundWise will update this card again when another Member needs to settle with you."
                      : viewerIncomingTransferCount === 1
                        ? "One Member can settle with you right now. Share the request link if you want to nudge them."
                        : `${viewerIncomingTransferCount} Members can settle with you right now. Share request links from the suggested Settlements list.`}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
              {viewerOutgoingTransferCount === 1 ? (
                <Button
                  className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                  disabled={isSettling}
                  onClick={() => onSettle(viewerOutgoingTransfers[0])}
                >
                  {isSettling && settlingTransfer === viewerOutgoingTransfers[0] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Settle {formatTokenAmount(viewerOutgoingTransfers[0].amount)} {tokenName}
                </Button>
              ) : viewerOutgoingTransferCount > 1 ? (
                <Button className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10" onClick={scrollToBalances}>
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
                  Share Request Link
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
                Invite a Member
              </Button>
            </div>
          </div>
          <div className="grid gap-3 border-t border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/80 bg-background/90 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Group Members
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{memberNameByWallet.size}</p>
              <p className="mt-1 text-xs text-muted-foreground">Everyone who can log an Expense or settle.</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/90 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Logged Expenses
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{expenseCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">The ledger driving the current live Balances.</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/90 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Suggested Settlements
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{transfers.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                The smallest set of transfers needed to simplify the Group.
              </p>
            </div>
          </div>
        </Card>
      )}

      {isMember && balances.length > 0 && (
        <Card id="balances-card" className="p-6">
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
                  } font-mono tabular-nums sm:text-right`}
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
                          onClick={() => onShareSettlementRequest(transfer)}
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
                            onClick={() => onSettle(transfer)}
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Activity</h2>
        {activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-foreground">No Expenses yet</p>
            <p className="mt-1 text-xs">
              {isMember
                ? "Log the first Expense to generate live Balances and suggested Settlements."
                : connected
                  ? "Join this Group to start tracking Expenses and Settlements with the other Members."
                  : "Connect your wallet to join this Group and start tracking shared Expenses."}
            </p>
            {isMember ? (
              <Button variant="outline" className="mt-4 min-h-11" onClick={onOpenCreateExpenseDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add the first Expense
              </Button>
            ) : connected ? (
              <Button className="mt-4 min-h-11 bg-accent hover:bg-accent/90" onClick={() => void onJoin()}>
                Join Group
              </Button>
            ) : (
              <Button
                type="button"
                className="mt-4 min-h-11 bg-accent hover:bg-accent/90"
                onClick={onConnectWallet}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
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
                              className="h-10 w-10 text-muted-foreground hover:text-foreground"
                              disabled={isSubmitting}
                              onClick={() => onOpenEditExpenseDialog(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${expense.memo || expense.category}`}
                              className="h-10 w-10 text-muted-foreground hover:text-red-600"
                              disabled={deletingExpenseId === expense.id}
                              onClick={() => setPendingDeleteExpense(expense)}
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
              const settlementFromLabel =
                memberNameByWallet.get(settlement.from_wallet) || shortWallet(settlement.from_wallet)
              const settlementToLabel =
                memberNameByWallet.get(settlement.to_wallet) || shortWallet(settlement.to_wallet)

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
                        {settlementFromLabel} → {settlementToLabel} ·{" "}
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
