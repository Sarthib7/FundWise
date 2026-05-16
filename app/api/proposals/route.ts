export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { addProposalMutation } from "@/lib/server/mutations/proposal"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type AddProposalBody = {
  groupId?: string
  proposerWallet?: string
  recipientWallet?: string
  amount?: number
  mint?: string
  kind?: "reimbursement" | "threshold_change" | "exit_refund"
  targetThreshold?: number
  squadsTransactionIndex?: number
  squadsProposalAddress?: string
  squadsTransactionAddress?: string
  squadsCreateTxSig?: string
  proofUrl?: string
  memo?: string
}

export const POST = withAuthenticatedHandler<AddProposalBody>(
  {
    fallbackMessage: "Failed to create Proposal.",
    rateLimit: "proposal_create",
    walletField: "proposerWallet",
  },
  async ({ body }) => {
    if (!body.groupId || !body.proposerWallet) {
      throw new FundWiseError("Missing required Proposal fields.")
    }

    const kind = body.kind ?? "reimbursement"

    if (kind === "threshold_change") {
      if (typeof body.targetThreshold !== "number") {
        throw new FundWiseError("Threshold-change Proposals require targetThreshold.")
      }

      return addProposalMutation({
        groupId: body.groupId,
        proposerWallet: body.proposerWallet,
        kind,
        targetThreshold: body.targetThreshold,
        memo: body.memo,
      })
    }

    if (
      !body.recipientWallet ||
      typeof body.amount !== "number" ||
      !body.mint ||
      typeof body.squadsTransactionIndex !== "number" ||
      !body.squadsProposalAddress ||
      !body.squadsTransactionAddress ||
      !body.squadsCreateTxSig
    ) {
      throw new FundWiseError("Missing required reimbursement Proposal fields.")
    }

    return addProposalMutation({
      groupId: body.groupId,
      proposerWallet: body.proposerWallet,
      recipientWallet: body.recipientWallet,
      amount: body.amount,
      mint: body.mint,
      kind,
      squadsTransactionIndex: body.squadsTransactionIndex,
      squadsProposalAddress: body.squadsProposalAddress,
      squadsTransactionAddress: body.squadsTransactionAddress,
      squadsCreateTxSig: body.squadsCreateTxSig,
      proofUrl: body.proofUrl,
      memo: body.memo,
    })
  }
)
