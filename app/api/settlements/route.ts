export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { addSettlementMutation } from "@/lib/server/mutations/settlement"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type AddSettlementBody = {
  groupId?: string
  fromWallet?: string
  toWallet?: string
  amount?: number
  mint?: string
  txSig?: string
}

export const POST = withAuthenticatedHandler<AddSettlementBody>(
  {
    fallbackMessage: "Failed to record Settlement.",
    rateLimit: "settlement_create",
    walletField: "fromWallet",
  },
  async ({ body }) => {
    if (
      !body.groupId ||
      !body.fromWallet ||
      !body.toWallet ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.txSig
    ) {
      throw new FundWiseError("Missing required Settlement fields.")
    }

    return addSettlementMutation({
      groupId: body.groupId,
      fromWallet: body.fromWallet,
      toWallet: body.toWallet,
      amount: body.amount,
      mint: body.mint,
      txSig: body.txSig,
    })
  }
)
