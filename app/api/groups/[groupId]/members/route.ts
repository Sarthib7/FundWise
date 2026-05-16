export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { addMemberMutation } from "@/lib/server/mutations/member"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type AddMemberBody = {
  wallet?: string
  displayName?: string
}

type AddMemberParams = { groupId: string }

export const POST = withAuthenticatedHandler<AddMemberBody, AddMemberParams>(
  { fallbackMessage: "Failed to join Group.", walletField: "wallet" },
  async ({ body, params }) => {
    if (!params.groupId || !body.wallet) {
      throw new FundWiseError("Missing Group or wallet details.")
    }

    await addMemberMutation({
      groupId: params.groupId,
      wallet: body.wallet,
      displayName: body.displayName,
    })

    return { ok: true }
  }
)
