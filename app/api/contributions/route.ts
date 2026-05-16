export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { addContributionMutation } from "@/lib/server/mutations/contribution"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type AddContributionBody = {
  groupId?: string
  memberWallet?: string
  amount?: number
  mint?: string
  txSig?: string
}

export const POST = withAuthenticatedHandler<AddContributionBody>(
  {
    fallbackMessage: "Failed to record Contribution.",
    rateLimit: "contribution_create",
    walletField: "memberWallet",
  },
  async ({ body }) => {
    if (
      !body.groupId ||
      !body.memberWallet ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.txSig
    ) {
      throw new FundWiseError("Missing required Contribution fields.")
    }

    return addContributionMutation({
      groupId: body.groupId,
      memberWallet: body.memberWallet,
      amount: body.amount,
      mint: body.mint,
      txSig: body.txSig,
    })
  }
)
