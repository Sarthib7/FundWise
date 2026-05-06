"use client"

import Link from "next/link"
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
  ChevronDown,
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
  lifiSupported: boolean
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
  activity: ActivityItem[]
  viewerBalance: Balance | null
  viewerOutgoingTransfers: SettlementTransfer[]
  viewerIncomingTransfers: SettlementTransfer[]
  memberNameByWallet: Map<string, string>
  onConnectWallet: () => void
  onJoin: () => void | Promise<void>
  onClearSettlementRequest: () => void
  onShareSettlementRequest: (transfer: SettlementTransfer) => void | Promise<void>
  onSettle: (transfer: SettlementTransfer) => boolean | Promise<boolean>
  onOpenSettlementFundingRoute: (transfer: SettlementTransfer) => void
  onOpenCreateExpenseDialog: () => void
  onOpenEditExpenseDialog: (expense: ActivityExpense) => void
  onDeleteExpense: (expense: ActivityExpense) => Promise<boolean>
  canDeleteExpense: (expense: ActivityExpense) => boolean
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const VISIBLE_ACTIVITY_COUNT = 5

export function SplitModeDashboard({
  connected,
  isWalletVerified,
  isMember,
  lifiSupported,
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
  onOpenSettlementFundingRoute,
  onOpenCreateExpenseDialog,
  onOpenEditExpenseDialog,
  onDeleteExpense,
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
  const expenseTotal = activity
    .filter((item): item is Extract<ActivityItem, { type: "expense" }> => item.type === "expense")
    .reduce((sum, item) => sum + item.data.amount, 0)
  const settledTotal = activity
    .filter((item): item is Extract<ActivityItem, { type: "settlement" }> => item.type === "settlement")
    .reduce((sum, item) => sum + item.data.amount, 0)
  const viewerBalanceAmount = viewerBalance?.amount ?? 0
  const primaryOutgoingTransfer = viewerOutgoingTransfers[0] ?? null
  const primaryIncomingTransfer = viewerIncomingTransfers[0] ?? null
  const hiddenOutgoingTransferCount = Math.max(0, viewerOutgoingTransferCount - 1)
  const hiddenIncomingTransferCount = Math.max(0, viewerIncomingTransferCount - 1)

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
                  <h2 className="text-lg font-semibold">A Settlement request is waiting</h2>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to see the live amount, settle in USDC, and close the loop with an on-chain Receipt.
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
                    FundWise reveals Member-only Balance context after one signed message confirms this browser session.
                  </p>
                </>
              ) : !isMember ? (
                <>
                  <h2 className="text-lg font-semibold">Join {groupName} to view the live settlement state</h2>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re seeing FundWise from a shared link. Join the Group to see what changed and create your own Group later.
                  </p>
                </>
              ) : requestedTransfer ? (
                <>
                  <h2 className="text-lg font-semibold">
                    {requestedDebtorLabel} currently owes {requestedCreditorLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This request resolves from the live Group Balance. Settle once, then the Receipt makes it final.
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
                    The Group Balance changed, so there is no longer anything to settle for this request.
                  </p>
                </>
              )}
              <div className="mt-4 grid gap-2 rounded-lg border border-accent/20 bg-background/70 p-3 text-xs text-muted-foreground sm:grid-cols-3">
                <span>Live amount</span>
                <span>Wallet-confirmed</span>
                <span>Receipt on Solana</span>
              </div>
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
              <Button asChild variant="ghost" className="w-full sm:w-auto">
                <Link href="/groups">Create your own Group</Link>
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="overflow-hidden border-brand-border-c bg-background">
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-xl tracking-tight text-foreground">
                {groupName}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {memberNameByWallet.size} Member{memberNameByWallet.size !== 1 ? "s" : ""}
                {" · "}
                {expenseCount} Expense{expenseCount !== 1 ? "s" : ""}
                {" · "}
                {settlementCount} Receipt{settlementCount !== 1 ? "s" : ""}
              </p>
            </div>
            {isMember ? (
              <Button
                size="sm"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                onClick={onOpenCreateExpenseDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            ) : null}
          </div>

          {isMember ? (
            <>
              <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                  <div className="mb-1 text-[10px] text-muted-foreground">
                    {viewerBalanceAmount < 0
                      ? "You owe"
                      : viewerBalanceAmount > 0
                        ? "You're owed"
                        : "Your Balance"}
                  </div>
                  <div
                    className={`text-[17px] font-extrabold ${
                      viewerBalanceAmount > 0
                        ? "text-green-600 dark:text-green-400"
                        : viewerBalanceAmount < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-foreground"
                    }`}
                  >
                    {formatTokenAmount(Math.abs(viewerBalanceAmount))} {tokenName}
                  </div>
                </div>
                <div className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                  <div className="mb-1 text-[10px] text-muted-foreground">Total Expenses</div>
                  <div className="text-[17px] font-extrabold text-foreground">
                    {formatTokenAmount(expenseTotal)} {tokenName}
                  </div>
                </div>
                <div className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                  <div className="mb-1 text-[10px] text-muted-foreground">Settled</div>
                  <div className="text-[17px] font-extrabold text-green-600 dark:text-green-400">
                    {formatTokenAmount(settledTotal)} {tokenName}
                  </div>
                </div>
              </div>

              {balances.length > 0 ? (
                <div className="mb-5 flex flex-wrap gap-2">
                  {balances.map((balance) => (
                    <div
                      key={balance.wallet}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                        balance.wallet === walletAddress
                          ? "border-accent/30 bg-accent/5"
                          : "border-brand-border-c bg-brand-surface"
                      }`}
                    >
                      <WalletAvatar address={balance.wallet} size={20} />
                      <span className="max-w-[90px] truncate font-medium text-sm">
                        {balance.displayName}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums ${
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
              ) : null}
            </>
          ) : null}

          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
            Recent expenses and Receipts
          </div>

        {activity.length === 0 ? (
          <div className="rounded-[12px] border border-dashed py-8 text-center text-muted-foreground">
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
                    className="flex flex-col gap-2 border-b border-brand-border-c py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-brand-surface-2 text-brand-deep">
                        <TrendingUp className="h-4 w-4" />
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
                  className="flex items-center justify-between border-b border-brand-border-c py-3 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Minus className="h-4 w-4" />
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

          {isMember ? (
            <div className="mt-4 flex flex-col gap-3 rounded-[12px] border border-brand-border-c bg-brand-surface p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {primaryOutgoingTransfer
                    ? `You pay ${primaryOutgoingTransfer.toName || shortWallet(primaryOutgoingTransfer.to)}`
                    : primaryIncomingTransfer
                      ? `${primaryIncomingTransfer.fromName || shortWallet(primaryIncomingTransfer.from)} can settle with you`
                      : "All settled"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {primaryOutgoingTransfer
                    ? hiddenOutgoingTransferCount > 0
                      ? `${hiddenOutgoingTransferCount} more Settlement${hiddenOutgoingTransferCount !== 1 ? "s" : ""} can follow after this one.`
                      : "Suggested from the live Group Balance."
                    : primaryIncomingTransfer
                      ? hiddenIncomingTransferCount > 0
                        ? `${hiddenIncomingTransferCount} more Member${hiddenIncomingTransferCount !== 1 ? "s" : ""} can settle after this nudge.`
                        : "Share a Settlement Request Link from the live Balance."
                      : "Add the next Expense when the Group spends again."}
                </div>
              </div>
              {primaryOutgoingTransfer ? (
                <Button
                  className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
                  disabled={isSettling}
                  onClick={() => setPreviewTransfer(primaryOutgoingTransfer)}
                >
                  {isSettling && settlingTransfer === primaryOutgoingTransfer ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Settle {formatTokenAmount(primaryOutgoingTransfer.amount)} {tokenName}
                </Button>
              ) : primaryIncomingTransfer ? (
                <Button
                  variant="outline"
                  className="min-h-11 sm:min-h-10"
                  disabled={sharingTransferKey === `${primaryIncomingTransfer.from}:${primaryIncomingTransfer.to}`}
                  onClick={() => onShareSettlementRequest(primaryIncomingTransfer)}
                >
                  {sharingTransferKey === `${primaryIncomingTransfer.from}:${primaryIncomingTransfer.to}` ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  Nudge
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="min-h-11 sm:min-h-10"
                  onClick={onOpenCreateExpenseDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : null}
        </div>
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
          lifiSupported={lifiSupported}
          onOpenFundingRoute={() => onOpenSettlementFundingRoute(previewTransfer)}
          onConfirm={async () => {
            const didSettle = await onSettle(previewTransfer)

            if (didSettle) {
              setPreviewTransfer(null)
            }

            return didSettle
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
