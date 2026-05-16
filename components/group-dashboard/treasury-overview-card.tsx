"use client"

import { useMemo } from "react"
import { MoneyCounter } from "@/components/brand/money-counter"
import { ContributorStrip } from "@/components/group-dashboard/contributor-strip"
import { Card } from "@/components/ui/card"
import { formatTokenAmount } from "@/lib/expense-engine"
import type { Database } from "@/lib/database.types"
import type { ProposalWithReviews } from "@/lib/api-types"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  Clock,
  HandCoins,
  Lock,
  Send,
  XCircle,
} from "lucide-react"

type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]

type ActivityEvent = {
  id: string
  at: string
  icon: "contribution" | "proposed" | "approved" | "executed" | "rejected"
  label: string
  amount: number | null
}

type TopContributor = {
  wallet: string
  name: string
  amount: number
}

type TreasuryOverviewCardProps = {
  tokenName: string
  treasuryBalance: number
  contributionTotal: number
  fundingGoal: number | null
  fundingProgress: number
  contributions: ContributionRow[]
  proposals: ProposalWithReviews[]
  approvalThreshold: number
  memberNameByWallet: Map<string, string>
  walletAddress: string
  canPropose: boolean
  onProposeReimbursement?: () => void
  onViewProposals?: () => void
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function displayName(
  wallet: string,
  memberNameByWallet: Map<string, string>,
  selfWallet: string,
) {
  const name = memberNameByWallet.get(wallet) || shortWallet(wallet)
  return wallet === selfWallet ? `${name} (you)` : name
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

export function TreasuryOverviewCard({
  tokenName,
  treasuryBalance,
  contributionTotal,
  fundingGoal,
  fundingProgress,
  contributions,
  proposals,
  approvalThreshold,
  memberNameByWallet,
  walletAddress,
  canPropose,
  onProposeReimbursement,
  onViewProposals,
}: TreasuryOverviewCardProps) {
  const proposalStats = useMemo(() => {
    let pendingCount = 0
    let pendingAmount = 0
    let approvedCount = 0
    let approvedAmount = 0

    for (const proposal of proposals) {
      if (proposal.status === "pending") {
        pendingCount += 1
        pendingAmount += proposal.amount ?? 0
      } else if (proposal.status === "approved") {
        approvedCount += 1
        approvedAmount += proposal.amount ?? 0
      }
    }

    return { pendingCount, pendingAmount, approvedCount, approvedAmount }
  }, [proposals])

  const topContributors = useMemo<TopContributor[]>(() => {
    const totals = new Map<string, number>()
    for (const contribution of contributions) {
      totals.set(
        contribution.member_wallet,
        (totals.get(contribution.member_wallet) || 0) + contribution.amount,
      )
    }
    return Array.from(totals.entries())
      .map(([wallet, amount]) => ({
        wallet,
        amount,
        name: displayName(wallet, memberNameByWallet, walletAddress),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
  }, [contributions, memberNameByWallet, walletAddress])

  const recentEvents = useMemo<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = []

    for (const contribution of contributions) {
      events.push({
        id: `c-${contribution.id}`,
        at: contribution.created_at,
        icon: "contribution",
        label: `${displayName(contribution.member_wallet, memberNameByWallet, walletAddress)} contributed`,
        amount: contribution.amount,
      })
    }

    for (const proposal of proposals) {
      const proposerName = displayName(proposal.proposer_wallet, memberNameByWallet, walletAddress)
      const recipientName = proposal.recipient_wallet
        ? displayName(proposal.recipient_wallet, memberNameByWallet, walletAddress)
        : "—"
      const kind = (proposal as { kind?: string }).kind ?? "reimbursement"
      const subject =
        kind === "threshold_change"
          ? `threshold change to ${(proposal as { target_threshold?: number | null }).target_threshold ?? "?"}`
          : `reimbursement to ${recipientName}`
      events.push({
        id: `p-${proposal.id}`,
        at: proposal.created_at,
        icon: "proposed",
        label: `${proposerName} proposed ${subject}`,
        amount: proposal.amount ?? 0,
      })
      if (proposal.status === "executed" && proposal.executed_at) {
        events.push({
          id: `pe-${proposal.id}`,
          at: proposal.executed_at,
          icon: "executed",
          label: `${subject} executed`,
          amount: proposal.amount ?? 0,
        })
      }

      for (const review of proposal.reviews) {
        const reviewerName = displayName(review.member_wallet, memberNameByWallet, walletAddress)
        events.push({
          id: `pr-${review.id}`,
          at: review.reviewed_at,
          icon: review.decision,
          label: `${reviewerName} ${review.decision} ${subject}`,
          amount: proposal.amount ?? 0,
        })
      }
    }

    return events
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5)
  }, [contributions, proposals, memberNameByWallet, walletAddress])

  const goalPercent = fundingGoal && fundingGoal > 0
    ? Math.min(100, Math.max(0, fundingProgress))
    : null

  const contributingMembersCount = topContributors.length

  return (
    <div className="mb-6 space-y-4">
      {/* Treasury hero — navy gradient with Vault chip */}
      <Card className="relative overflow-hidden border-transparent bg-brand-fund-grad p-6 text-white shadow-[0_18px_48px_rgba(42,79,168,0.22)] sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]">
                <Lock className="h-3 w-3" aria-hidden /> Vault
              </span>
              <span className="text-[11px] text-white/70">Solana · {tokenName}</span>
            </div>
            <div className="pt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-white/80">
              Treasury balance
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <div className="font-serif text-[48px] leading-none tracking-[-1.5px] sm:text-[60px] sm:tracking-[-1.8px]">
                <MoneyCounter
                  value={treasuryBalance / 1e6}
                />
              </div>
              {fundingGoal ? (
                <span className="pl-0.5 text-sm text-white/75">
                  of {formatTokenAmount(fundingGoal)} {tokenName}
                </span>
              ) : null}
            </div>
            {goalPercent !== null ? (
              <div className="pt-4">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/16">
                  <div
                    className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-[width] duration-500"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-white/80">
                  {formatTokenAmount(contributionTotal)} of {formatTokenAmount(fundingGoal!)}{" "}
                  {tokenName} contributed · {goalPercent}% to goal
                </p>
              </div>
            ) : (
              <p className="pt-2 text-xs text-white/80">
                {formatTokenAmount(contributionTotal)} {tokenName} contributed
              </p>
            )}
          </div>

          {canPropose && onProposeReimbursement ? (
            <div className="flex flex-col gap-2 sm:items-end">
              <button
                type="button"
                onClick={onProposeReimbursement}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold tracking-tight text-brand-blue-mid shadow transition-[transform,filter] duration-150 ease-out hover:-translate-y-px hover:brightness-105 sm:min-h-10"
              >
                <HandCoins className="h-4 w-4" aria-hidden />
                Reimburse me
              </button>
              {onViewProposals ? (
                <button
                  type="button"
                  onClick={onViewProposals}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold tracking-tight text-white transition-[background-color,border-color] duration-150 hover:bg-white/20 sm:min-h-10"
                >
                  View proposals
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      {/* Contributor chip strip — per-member contribution amounts */}
      <ContributorStrip
        contributions={contributions}
        tokenName={tokenName}
        memberNameByWallet={memberNameByWallet}
        walletAddress={walletAddress}
      />

      {/* Stats row — proposals + top contributors side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-brand-border-c bg-background p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
              Proposals
            </p>
            <span className="inline-flex items-center rounded-full border border-brand-amber/40 bg-brand-amber-pale px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-brand-amber">
              {proposalStats.pendingCount} pending
            </span>
          </div>
          <button
            type="button"
            onClick={onViewProposals}
            className="flex w-full items-baseline justify-between rounded-md py-1 text-left transition-colors hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="text-sm font-medium text-foreground">Pending</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {proposalStats.pendingCount} · {formatTokenAmount(proposalStats.pendingAmount)}{" "}
              {tokenName}
            </span>
          </button>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-medium text-foreground">Approved, not executed</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {proposalStats.approvedCount} · {formatTokenAmount(proposalStats.approvedAmount)}{" "}
              {tokenName}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-brand-text-3">
            Needs {approvalThreshold} approval{approvalThreshold === 1 ? "" : "s"} per Proposal
          </p>
        </Card>

        <Card className="border-brand-border-c bg-background p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
            Top contributors
          </p>
          {contributingMembersCount === 0 ? (
            <p className="text-sm text-brand-text-2">No contributions yet.</p>
          ) : (
            <ol className="space-y-2">
              {topContributors.map((contributor, index) => (
                <li
                  key={contributor.wallet}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                        index === 0
                          ? "bg-brand-gold-pale text-brand-gold"
                          : "bg-brand-surface text-brand-text-2",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate text-foreground">{contributor.name}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums text-foreground">
                    {formatTokenAmount(contributor.amount)} {tokenName}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="border-brand-border-c bg-background p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-brand-text-3" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
            Recent activity
          </p>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-brand-text-2">No Treasury activity yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {recentEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    event.icon === "executed"
                      ? "bg-brand-green-pale text-brand-green-forest"
                      : event.icon === "approved"
                        ? "bg-brand-blue-pale text-brand-blue-mid"
                        : event.icon === "rejected"
                          ? "bg-brand-red-pale text-brand-red"
                          : "bg-brand-surface text-brand-text-2",
                  )}
                >
                  {event.icon === "contribution" ? (
                    <HandCoins className="h-3.5 w-3.5" />
                  ) : event.icon === "executed" ? (
                    <Send className="h-3.5 w-3.5" />
                  ) : event.icon === "approved" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : event.icon === "rejected" ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="flex-1 truncate text-foreground">{event.label}</span>
                {event.amount !== null ? (
                  <span className="font-mono text-xs tabular-nums text-brand-text-2">
                    {formatTokenAmount(event.amount)} {tokenName}
                  </span>
                ) : null}
                <span className="shrink-0 text-xs text-brand-text-3">
                  {formatEventDate(event.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
