export const runtime = "edge"

import { computeBalancesFromActivity, simplifySettlements } from "@/lib/expense-engine"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getGroupDashboardSnapshot } from "@/lib/server/fundwise-reads"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type GroupLedgerParams = { groupId: string }

export const GET = withAuthenticatedHandler<Record<string, unknown>, GroupLedgerParams>(
  { fallbackMessage: "Failed to load Group ledger." },
  async ({ session, params }) => {
    const snapshot = await getGroupDashboardSnapshot(params.groupId, session.wallet)

    if (!snapshot.isMember) {
      throw new FundWiseError("Only Group Members can read this Group ledger.", 403)
    }

    if (snapshot.group?.mode !== "split") {
      return {
        ...snapshot,
        balances: [],
        suggestedSettlements: [],
        totalSettledVolume: 0,
      }
    }

    const balances = computeBalancesFromActivity(snapshot.members, snapshot.activity)
    const suggestedSettlements = simplifySettlements(balances)
    const totalSettledVolume = snapshot.activity
      .filter((item) => item.type === "settlement")
      .reduce((sum, item) => sum + item.data.amount, 0)

    return {
      ...snapshot,
      balances,
      suggestedSettlements,
      totalSettledVolume,
    }
  }
)
