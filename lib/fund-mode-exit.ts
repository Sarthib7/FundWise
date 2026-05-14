import type { Database } from "@/lib/database.types"

type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

export type ExitRefundSuggestion = {
  memberWallet: string
  memberDisplayName: string
  totalContributed: number
  proRataShare: number
  suggestedRefund: number
  memo: string
  rationale: string
}

/**
 * FW-046: compute a suggested exit refund for a leaving Member.
 *
 * The suggestion follows the most defensible interpretation of "what does this
 * Member get back when they leave the pool":
 *
 *   - Sum the Member's recorded Contributions to this Group (`totalContributed`).
 *   - Compute their pro-rata share of the live Treasury balance based on the
 *     fraction of total Contributions they put in. If others have proposed
 *     out reimbursements since, the Treasury balance reflects that; the
 *     pro-rata share is therefore "fair share of what's left in the vault".
 *   - The suggested refund is the smaller of the two: never pay back more than
 *     the Treasury currently holds AND never refund a Member more than they
 *     contributed. Groups can override this number — the helper just gives a
 *     defensible starting point.
 *
 * All amounts are in the smallest token unit (USDC has 6 decimals). The caller
 * is responsible for formatting via `formatTokenAmount`.
 */
export function computeMemberExitRefund(params: {
  member: Pick<MemberRow, "wallet" | "display_name">
  contributions: ContributionRow[]
  treasuryBalance: number
}): ExitRefundSuggestion {
  const { member, contributions, treasuryBalance } = params

  const memberContributions = contributions.filter(
    (contribution) => contribution.member_wallet === member.wallet
  )
  const totalContributed = memberContributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  )
  const totalAllContributions = contributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0
  )

  const memberDisplayName =
    member.display_name ||
    `${member.wallet.slice(0, 4)}...${member.wallet.slice(-4)}`

  if (totalContributed === 0 || totalAllContributions === 0 || treasuryBalance <= 0) {
    return {
      memberWallet: member.wallet,
      memberDisplayName,
      totalContributed,
      proRataShare: 0,
      suggestedRefund: 0,
      memo: `Exit refund for ${memberDisplayName}`,
      rationale:
        "No Contributions recorded from this Member, or the Treasury is empty. Set a custom amount if Members agreed to a different exit value.",
    }
  }

  const proRataShare = Math.floor(
    (totalContributed * treasuryBalance) / totalAllContributions
  )
  const suggestedRefund = Math.min(totalContributed, proRataShare, treasuryBalance)

  return {
    memberWallet: member.wallet,
    memberDisplayName,
    totalContributed,
    proRataShare,
    suggestedRefund,
    memo: `Exit refund for ${memberDisplayName}`,
    rationale:
      suggestedRefund === totalContributed
        ? "Refunding full Contributions because the live pro-rata share is higher and the Group has not yet earned beyond their contribution."
        : suggestedRefund === proRataShare
          ? "Refunding the live pro-rata share of the Treasury after prior reimbursements."
          : "Refunding the available Treasury balance (less than both the Member's Contributions and their pro-rata share).",
  }
}
