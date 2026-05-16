"use client"

import Link from "next/link"
import { useState } from "react"
import { WalletAvatar } from "@/components/avatar"
import { MoneyCounter } from "@/components/brand/money-counter"
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
import { cn } from "@/lib/utils"
import {
  Check,
  ChevronDown,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Share2,
  Trash2,
  Wallet,
} from "lucide-react"

type ActivityExpense = Extract<ActivityItem, { type: "expense" }>["data"]
type PendingSettlementReceipt = {
  txSig: string
  toWallet: string
  amount: number
}

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
  pendingSettlementReceipt: PendingSettlementReceipt | null
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
  onRecoverSettlementReceipt: () => boolean | Promise<boolean>
  onOpenSettlementFundingRoute: (transfer: SettlementTransfer) => void
  onOpenCreateExpenseDialog: () => void
  onOpenEditExpenseDialog: (expense: ActivityExpense) => void
  onDeleteExpense: (expense: ActivityExpense) => Promise<boolean>
  canDeleteExpense: (expense: ActivityExpense) => boolean
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽",
  transport: "🚕",
  shopping: "🛒",
  accommodation: "🏨",
  entertainment: "🎨",
  general: "💰",
}

function getCategoryEmoji(category: string | null | undefined): string {
  return CATEGORY_EMOJI[category || "general"] || "💰"
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
  pendingSettlementReceipt,
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
  onRecoverSettlementReceipt,
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
  const primaryOutgoingTransfer = viewerOutgoingTransfers[0] ?? null
  const primaryIncomingTransfer = viewerIncomingTransfers[0] ?? null
  const hiddenOutgoingTransferCount = Math.max(0, viewerOutgoingTransferCount - 1)
  const hiddenIncomingTransferCount = Math.max(0, viewerIncomingTransferCount - 1)
  const viewerBalanceAmount = viewerBalance?.amount ?? 0
  const isOwed = viewerBalanceAmount > 0
  const isOweing = viewerBalanceAmount < 0

  const otherMemberCount = Math.max(0, memberNameByWallet.size - 1)

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
    <div className="space-y-5">
      {/* Legacy settlement request banner — deep-link flow */}
      {hasSettlementRequest && (
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="border-accent/20 bg-accent/10 text-accent">
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
                    <Wallet className="mr-2 h-4 w-4" />
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Hero balance card — gradient when you're owed; surface otherwise */}
      {isMember ? (
        <Card
          className={cn(
            "relative overflow-hidden p-6 sm:p-7",
            isOwed
              ? "border-transparent bg-brand-grad text-white shadow-[0_18px_48px_rgba(13,107,58,0.18)]"
              : "border-brand-border-c bg-background",
          )}
        >
          {isOwed && (
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl"
            />
          )}
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div
                className={cn(
                  "text-[11px] font-bold uppercase tracking-[0.08em]",
                  isOwed
                    ? "text-white/85"
                    : isOweing
                      ? "text-brand-red"
                      : "text-brand-text-2",
                )}
              >
                {isOwed ? "You are owed" : isOweing ? "You owe" : "All settled up"}
              </div>
              <div
                className={cn(
                  "font-serif text-[44px] leading-none tracking-[-1.2px] sm:text-[56px] sm:tracking-[-1.5px]",
                  isOwed
                    ? "text-white"
                    : isOweing
                      ? "text-brand-red"
                      : "text-foreground",
                )}
              >
                <MoneyCounter
                  value={Math.abs(viewerBalanceAmount) / 1e6}
                />
              </div>
              <p
                className={cn(
                  "text-sm",
                  isOwed ? "text-white/85" : "text-brand-text-2",
                )}
              >
                {otherMemberCount > 0
                  ? `Across ${otherMemberCount} ${otherMemberCount === 1 ? "other" : "others"} · ${tokenName} on Solana`
                  : `${tokenName} on Solana`}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {primaryOutgoingTransfer ? (
                <Button
                  className={cn(
                    "min-h-11 sm:min-h-10",
                    isOwed
                      ? "bg-white text-brand-green-forest shadow hover:bg-white/95"
                      : "bg-accent hover:bg-accent/90",
                  )}
                  disabled={isSettling}
                  onClick={() => setPreviewTransfer(primaryOutgoingTransfer)}
                >
                  {isSettling && settlingTransfer === primaryOutgoingTransfer ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Settle up · {formatTokenAmount(primaryOutgoingTransfer.amount)} {tokenName}
                </Button>
              ) : isOwed && primaryIncomingTransfer ? (
                <Button
                  className={cn(
                    "min-h-11 sm:min-h-10",
                    "bg-white text-brand-green-forest shadow hover:bg-white/95",
                  )}
                  disabled={
                    sharingTransferKey ===
                    `${primaryIncomingTransfer.from}:${primaryIncomingTransfer.to}`
                  }
                  onClick={() => onShareSettlementRequest(primaryIncomingTransfer)}
                >
                  {sharingTransferKey ===
                  `${primaryIncomingTransfer.from}:${primaryIncomingTransfer.to}` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="mr-2 h-4 w-4" />
                  )}
                  Nudge to settle
                </Button>
              ) : null}
              <Button
                variant="outline"
                className={cn(
                  "min-h-11 sm:min-h-10",
                  isOwed && "border-white/40 bg-white/10 text-white hover:bg-white/20",
                )}
                onClick={onOpenCreateExpenseDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add expense
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Member balance chips — horizontal scroll on mobile */}
      {isMember && balances.length > 0 ? (
        <Card className="border-brand-border-c bg-background p-4 sm:p-5">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
            Member balances
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {balances.map((balance) => {
              const isMe = balance.wallet === walletAddress
              const owed = balance.amount > 0
              return (
                <div
                  key={balance.wallet}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2",
                    isMe
                      ? "border-accent/30 bg-accent/5"
                      : "border-brand-border-c bg-brand-surface",
                  )}
                >
                  <WalletAvatar address={balance.wallet} size={28} />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold leading-tight text-foreground">
                      {isMe ? "You" : balance.displayName}
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-[10px] text-brand-text-3">
                        {owed ? "gets" : balance.amount < 0 ? "owes" : "even"}
                      </span>
                      <span
                        className={cn(
                          "font-serif text-sm tracking-tight",
                          owed
                            ? "text-brand-green-mid"
                            : balance.amount < 0
                              ? "text-brand-red"
                              : "text-brand-text-3",
                        )}
                      >
                        {formatTokenAmount(Math.abs(balance.amount))}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      {/* Pending settlement receipt banner */}
      {isMember && pendingSettlementReceipt ? (
        <Card className="border-brand-amber/40 bg-brand-amber-pale p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Settlement reached Solana
              </div>
              <div className="mt-0.5 text-xs text-brand-text-2">
                Record the Receipt for {formatTokenAmount(pendingSettlementReceipt.amount)} {tokenName}{" "}
                sent to{" "}
                {memberNameByWallet.get(pendingSettlementReceipt.toWallet) ||
                  shortWallet(pendingSettlementReceipt.toWallet)}.
                Tx {shortWallet(pendingSettlementReceipt.txSig)}.
              </div>
            </div>
            <Button
              variant="outline"
              className="min-h-11 bg-background sm:min-h-10"
              disabled={isSettling}
              onClick={() => void onRecoverSettlementReceipt()}
            >
              {isSettling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="mr-2 h-4 w-4" />
              )}
              Retry Receipt
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Expense + settlement activity */}
      <Card className="overflow-hidden border-brand-border-c bg-background">
        <div className="flex items-center justify-between border-b border-brand-border-c px-4 py-3 sm:px-5">
          <h3 className="font-serif text-lg tracking-tight text-foreground">
            Recent expenses
          </h3>
          {isMember ? (
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              onClick={onOpenCreateExpenseDialog}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          ) : null}
        </div>

        {activity.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <Receipt className="mx-auto mb-2 h-8 w-8 text-brand-text-3" />
            <p className="font-medium text-foreground">No Expenses yet</p>
            <p className="mt-1 text-xs text-brand-text-2">
              {isMember
                ? "Log the first Expense to generate live Balances and suggested Settlements."
                : connected && isWalletVerified
                  ? "Join this Group to start tracking Expenses and Settlements."
                  : connected
                    ? "Verify your wallet to reveal the live Group ledger."
                    : "Connect your wallet to join this Group and start tracking shared Expenses."}
            </p>
            {isMember ? (
              <Button
                variant="outline"
                className="mt-4 min-h-11"
                onClick={onOpenCreateExpenseDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add the first Expense
              </Button>
            ) : connected && isWalletVerified ? (
              <Button
                className="mt-4 min-h-11 bg-accent hover:bg-accent/90"
                onClick={() => void onJoin()}
              >
                Join {groupName}
              </Button>
            ) : !connected ? (
              <Button
                type="button"
                className="mt-4 min-h-11 bg-accent hover:bg-accent/90"
                onClick={onConnectWallet}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            ) : null}
          </div>
        ) : (
          <div>
            {visibleActivity.map((item, index) => {
              const isLast = index === visibleActivity.length - 1
              if (item.type === "expense") {
                const expense = item.data
                const expenseCanBeDeleted = canDeleteExpense(expense)
                const isExpenseOwnedByWallet = expense.created_by === walletAddress
                const payerLabel =
                  memberNameByWallet.get(expense.payer) || shortWallet(expense.payer)
                const creatorLabel =
                  memberNameByWallet.get(expense.created_by) || shortWallet(expense.created_by)
                const emoji = getCategoryEmoji(expense.category)

                return (
                  <div
                    key={`${item.type}-${expense.id}-${index}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 sm:px-5",
                      !isLast && "border-b border-brand-border-c",
                    )}
                  >
                    <div
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-surface text-lg"
                    >
                      {emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {expense.memo || expense.category || "Expense"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-brand-text-2">
                        {payerLabel} paid
                        {expense.created_by !== expense.payer ? ` · ${creatorLabel} logged` : ""}
                        {" · "}
                        {new Date(expense.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <div className="text-right">
                        <div className="font-serif text-base tabular-nums tracking-tight text-foreground">
                          {formatTokenAmount(expense.amount)} {tokenName}
                        </div>
                        {expense.source_currency &&
                        expense.source_currency !== "USD" &&
                        expense.source_amount != null ? (
                          <div className="mt-0.5 text-[10px] text-brand-text-3 tabular-nums">
                            {formatTokenAmount(expense.source_amount)} {expense.source_currency}
                          </div>
                        ) : null}
                      </div>
                      {expense.edited_at ? (
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          Edited
                        </Badge>
                      ) : null}
                      {isExpenseOwnedByWallet ? (
                        expenseCanBeDeleted ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${expense.memo || expense.category || ""}`}
                              className="h-8 w-8 text-brand-text-3 hover:text-foreground"
                              disabled={isSubmitting}
                              onClick={() => onOpenEditExpenseDialog(expense)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${expense.memo || expense.category || ""}`}
                              className="h-8 w-8 text-brand-text-3 hover:text-brand-red"
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
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            Locked
                          </Badge>
                        )
                      ) : null}
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
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 sm:px-5",
                    !isLast && "border-b border-brand-border-c",
                  )}
                >
                  <div
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-pale text-brand-green-forest"
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">Settlement</p>
                    <p className="mt-0.5 truncate text-xs text-brand-text-2">
                      {settlementFromLabel} → {settlementToLabel}
                      {" · "}
                      {new Date(settlement.confirmed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-base tabular-nums tracking-tight text-brand-green-mid">
                      {formatTokenAmount(settlement.amount)} {tokenName}
                    </div>
                  </div>
                </div>
              )
            })}

            {hasMoreActivity && !showAllActivity ? (
              <div className="border-t border-brand-border-c px-4 py-2 sm:px-5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-brand-text-2 hover:text-foreground"
                  onClick={() => setShowAllActivity(true)}
                >
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show {activity.length - VISIBLE_ACTIVITY_COUNT} more
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {/* Settlement nudge — bottom prompt when there is exactly something to do */}
      {isMember && !isOwed && (primaryOutgoingTransfer || primaryIncomingTransfer) ? (
        <Card className="border-brand-border-c bg-brand-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">
                {primaryOutgoingTransfer
                  ? `You pay ${memberNameByWallet.get(primaryOutgoingTransfer.to) || shortWallet(primaryOutgoingTransfer.to)}`
                  : primaryIncomingTransfer
                    ? `${memberNameByWallet.get(primaryIncomingTransfer.from) || shortWallet(primaryIncomingTransfer.from)} can settle with you`
                    : "All settled"}
              </div>
              <div className="mt-0.5 text-xs text-brand-text-2">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Settle {formatTokenAmount(primaryOutgoingTransfer.amount)} {tokenName}
              </Button>
            ) : primaryIncomingTransfer ? (
              <Button
                variant="outline"
                className="min-h-11 sm:min-h-10"
                disabled={
                  sharingTransferKey ===
                  `${primaryIncomingTransfer.from}:${primaryIncomingTransfer.to}`
                }
                onClick={() => onShareSettlementRequest(primaryIncomingTransfer)}
              >
                {sharingTransferKey ===
                `${primaryIncomingTransfer.from}:${primaryIncomingTransfer.to}` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Nudge
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Settlement preview dialog */}
      {previewTransfer && (
        <SettlementPreviewDialog
          open={Boolean(previewTransfer)}
          onOpenChange={(isOpen) => {
            if (!isOpen) setPreviewTransfer(null)
          }}
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
            <AlertDialogCancel disabled={Boolean(deletingExpenseId)}>
              Keep Expense
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={Boolean(deletingExpenseId)}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmDelete()
              }}
            >
              {pendingDeleteExpense && deletingExpenseId === pendingDeleteExpense.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
