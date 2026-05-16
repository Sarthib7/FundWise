export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { updateProfileDisplayNameMutation } from "@/lib/server/mutations/member"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type UpdateDisplayNameBody = {
  wallet?: string
  displayName?: string
}

export const POST = withAuthenticatedHandler<UpdateDisplayNameBody>(
  { fallbackMessage: "Failed to update profile display name.", walletField: "wallet" },
  async ({ body }) => {
    if (!body.wallet || typeof body.displayName !== "string") {
      throw new FundWiseError("Missing profile update details.")
    }

    await updateProfileDisplayNameMutation(body.wallet, body.displayName)

    return { ok: true }
  }
)
