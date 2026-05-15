export const runtime = "edge"

import { NextResponse } from "next/server"
import { recordMonetizationResponseMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

const KINDS = new Set(["monthly_fee_wtp", "free_tier_cap", "exit_survey"] as const)

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("monetization_response", session.wallet)
    const body = (await request.json()) as {
      kind?: string
      groupId?: string | null
      emulatedUsdCents?: number | null
      payload?: Record<string, unknown>
    }

    if (!body.kind || !KINDS.has(body.kind as never)) {
      throw new FundWiseError("Unknown monetization response kind.")
    }

    const inserted = await recordMonetizationResponseMutation({
      kind: body.kind as "monthly_fee_wtp" | "free_tier_cap" | "exit_survey",
      memberWallet: session.wallet,
      groupId: body.groupId ?? null,
      emulatedUsdCents: body.emulatedUsdCents ?? null,
      payload: body.payload ?? {},
    })

    return NextResponse.json(inserted)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to record monetization response.")
    return NextResponse.json({ error: message }, { status })
  }
}
