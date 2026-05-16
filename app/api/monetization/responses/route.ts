export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { recordMonetizationResponseMutation } from "@/lib/server/mutations/monetization"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

const KINDS = new Set(["monthly_fee_wtp", "free_tier_cap", "exit_survey"] as const)

type MonetizationResponseBody = {
  kind?: string
  groupId?: string | null
  emulatedUsdCents?: number | null
  payload?: Record<string, unknown>
}

export const POST = withAuthenticatedHandler<MonetizationResponseBody>(
  {
    fallbackMessage: "Failed to record monetization response.",
    rateLimit: "monetization_response",
  },
  async ({ session, body }) => {
    if (!body.kind || !KINDS.has(body.kind as never)) {
      throw new FundWiseError("Unknown monetization response kind.")
    }

    return recordMonetizationResponseMutation({
      kind: body.kind as "monthly_fee_wtp" | "free_tier_cap" | "exit_survey",
      memberWallet: session.wallet,
      groupId: body.groupId ?? null,
      emulatedUsdCents: body.emulatedUsdCents ?? null,
      payload: body.payload ?? {},
    })
  }
)
