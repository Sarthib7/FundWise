export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { updateGroupTreasuryMutation } from "@/lib/server/mutations/group"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type UpdateTreasuryBody = {
  creatorWallet?: string
  multisigAddress?: string
  treasuryAddress?: string
}

type UpdateTreasuryParams = { groupId: string }

export const PATCH = withAuthenticatedHandler<UpdateTreasuryBody, UpdateTreasuryParams>(
  {
    fallbackMessage: "Failed to update Treasury.",
    rateLimit: "treasury_init",
    walletField: "creatorWallet",
  },
  async ({ body, params }) => {
    if (
      !params.groupId ||
      !body.creatorWallet ||
      !body.multisigAddress ||
      !body.treasuryAddress
    ) {
      throw new FundWiseError("Missing Treasury update details.")
    }

    await updateGroupTreasuryMutation({
      groupId: params.groupId,
      creatorWallet: body.creatorWallet,
      multisigAddress: body.multisigAddress,
      treasuryAddress: body.treasuryAddress,
    })

    return { ok: true }
  }
)
