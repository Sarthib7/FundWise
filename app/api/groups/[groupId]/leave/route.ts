export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { leaveGroupMutation } from "@/lib/server/mutations/member"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type LeaveGroupBody = {
  exitSurvey?: {
    pricingFairness?: number
    wouldPayConfidence?: number
    featureRequests?: string
  }
}

type LeaveGroupParams = { groupId: string }

export const POST = withAuthenticatedHandler<LeaveGroupBody, LeaveGroupParams>(
  {
    fallbackMessage: "Failed to leave Group.",
    rateLimit: "group_leave",
  },
  async ({ session, body, params }) => {
    if (!params.groupId) {
      throw new FundWiseError("Missing Group id.")
    }

    await leaveGroupMutation({
      groupId: params.groupId,
      memberWallet: session.wallet,
      exitSurvey: body.exitSurvey,
    })

    return { ok: true }
  }
)
