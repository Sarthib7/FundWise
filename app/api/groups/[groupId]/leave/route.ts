export const runtime = "edge"

import { NextResponse } from "next/server"
import { leaveGroupMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("group_leave", session.wallet)
    const { groupId } = await context.params
    const body = (await request.json().catch(() => ({}))) as {
      exitSurvey?: {
        pricingFairness?: number
        wouldPayConfidence?: number
        featureRequests?: string
      }
    }

    if (!groupId) {
      throw new FundWiseError("Missing Group id.")
    }

    await leaveGroupMutation({
      groupId,
      memberWallet: session.wallet,
      exitSurvey: body.exitSurvey,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to leave Group.")
    return NextResponse.json({ error: message }, { status })
  }
}
