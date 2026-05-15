"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatTokenAmount } from "@/lib/expense-engine"
import type { Database } from "@/lib/database.types"
import type { ProposalWithReviews } from "@/lib/db"
import { Activity, CheckCircle2, Clock, HandCoins, Send, XCircle } from "lucide-react"

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
  selfWallet: string
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
        (totals.get(contribution.member_wallet) || 0) + contribution.amount
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

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 5)
  }, [contributions, proposals, memberNameByWallet, walletAddress])

  return (
    <Card className="mb-6 p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <h2 className="text-base font-semibold">Treasury Overview</h2>
        </div>
        {canPropose && onProposeReimbursement ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9"
            onClick={onProposeReimbursement}
          >
            <HandCoins className="mr-2 h-3.5 w-3.5" />
            Reimburse me
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">at a glance</span>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Available Balance</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
            {formatTokenAmount(treasuryBalance)} {tokenName}
          </p>
          {fundingGoal ? (
            <div className="mt-3 space-y-2">
              <Progress value={fundingProgress} />
              <p className="text-[11px] text-muted-foreground">
                {formatTokenAmount(contributionTotal)} of {formatTokenAmount(fundingGoal)}{" "}
                {tokenName} contributed ({fundingProgress}%)
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatTokenAmount(contributionTotal)} {tokenName} contributed
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Proposals</p>
            <Badge variant="outline">{proposalStats.pendingCount} pending</Badge>
          </div>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              className="flex w-full items-baseline justify-between rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onViewProposals}
            >
              <span className="text-sm font-medium">Pending</span>
              <span className="font-mono text-sm tabular-nums">
                {proposalStats.pendingCount} · {formatTokenAmount(proposalStats.pendingAmount)}{" "}
                {tokenName}
              </span>
            </button>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">Approved, not executed</span>
              <span className="font-mono text-sm tabular-nums">
                {proposalStats.approvedCount} · {formatTokenAmount(proposalStats.approvedAmount)}{" "}
                {tokenName}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Needs {approvalThreshold} approval{approvalThreshold === 1 ? "" : "s"} per Proposal
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Contributors</p>
          {topContributors.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No contributions yet.</p>
          ) : (
            <ol className="mt-2 space-y-1.5">
              {topContributors.map((contributor, index) => (
                <li
                  key={contributor.wallet}
                  className="flex items-baseline justify-between text-sm"
                >
                  <span className="truncate">
                    <span className="inline-flex w-5 text-muted-foreground tabular-nums">
                      {index + 1}.
                    </span>
                    {contributor.name}
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {formatTokenAmount(contributor.amount)} {tokenName}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recent activity</p>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Treasury activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentEvents.map((event) => (
              <li key={event.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground" aria-hidden="true">
                  {event.icon === "contribution" ? (
                    <HandCoins className="h-3.5 w-3.5" />
                  ) : event.icon === "executed" ? (
                    <Send className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : event.icon === "approved" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  ) : event.icon === "rejected" ? (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="flex-1 truncate">{event.label}</span>
                {event.amount !== null && (
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTokenAmount(event.amount)} {tokenName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{formatEventDate(event.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
