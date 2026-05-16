export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { reviewProposalMutation } from "@/lib/server/mutations/proposal"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type ReviewProposalBody = {
  memberWallet?: string
  decision?: "approved" | "rejected"
  txSig?: string
}

type ReviewProposalParams = { proposalId: string }

export const POST = withAuthenticatedHandler<
  ReviewProposalBody,
  ReviewProposalParams
>(
  {
    fallbackMessage: "Failed to review Proposal.",
    rateLimit: "proposal_review",
    walletField: "memberWallet",
  },
  async ({ body, params }) => {
    if (!params.proposalId || !body.memberWallet || !body.decision) {
      throw new FundWiseError("Missing required Proposal review fields.")
    }

    return reviewProposalMutation({
      proposalId: params.proposalId,
      memberWallet: body.memberWallet,
      decision: body.decision,
      txSig: body.txSig,
    })
  }
)
