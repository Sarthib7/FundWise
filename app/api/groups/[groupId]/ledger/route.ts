export const runtime = "edge"

import { NextResponse } from "next/server"
import { computeBalancesFromActivity, simplifySettlements } from "@/lib/expense-engine"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { getGroupDashboardSnapshot } from "@/lib/server/fundwise-reads"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function GET(
  _request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { groupId } = await context.params
    const snapshot = await getGroupDashboardSnapshot(groupId, session.wallet)

    if (!snapshot.isMember) {
      throw new FundWiseError("Only Group Members can read this Group ledger.", 403)
    }

    if (snapshot.group?.mode !== "split") {
      return NextResponse.json({
        ...snapshot,
        balances: [],
        suggestedSettlements: [],
        totalSettledVolume: 0,
      })
    }

    const balances = computeBalancesFromActivity(snapshot.members, snapshot.activity)
    const suggestedSettlements = simplifySettlements(balances)
    const totalSettledVolume = snapshot.activity
      .filter((item) => item.type === "settlement")
      .reduce((sum, item) => sum + item.data.amount, 0)

    return NextResponse.json({
      ...snapshot,
      balances,
      suggestedSettlements,
      totalSettledVolume,
    })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to load Group ledger.")
    return NextResponse.json({ error: message }, { status })
  }
}
