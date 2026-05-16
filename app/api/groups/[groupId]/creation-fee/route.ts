export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { recordCreationFeeMutation } from "@/lib/server/mutations/monetization"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type CreationFeeBody = {
  outcome?: "paid" | "skipped"
  amount?: number
  mint?: string
  txSig?: string
  emulatedUsdCents?: number
  notes?: string
}

type CreationFeeParams = { groupId: string }

export const POST = withAuthenticatedHandler<CreationFeeBody, CreationFeeParams>(
  {
    fallbackMessage: "Failed to record creation fee.",
    rateLimit: "creation_fee",
  },
  async ({ session, body, params }) => {
    if (!params.groupId) {
      throw new FundWiseError("Missing Group id.")
    }

    if (body.outcome !== "paid" && body.outcome !== "skipped") {
      throw new FundWiseError("Creation fee outcome must be 'paid' or 'skipped'.")
    }

    return recordCreationFeeMutation({
      groupId: params.groupId,
      payerWallet: session.wallet,
      outcome: body.outcome,
      amount: body.amount ?? null,
      mint: body.mint ?? null,
      txSig: body.txSig ?? null,
      emulatedUsdCents: body.emulatedUsdCents ?? null,
      notes: body.notes ?? null,
    })
  }
)
