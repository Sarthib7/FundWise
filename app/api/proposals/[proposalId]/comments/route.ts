export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { addProposalCommentMutation } from "@/lib/server/mutations/proposal"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type AddProposalCommentBody = {
  memberWallet?: string
  body?: string
}

type AddProposalCommentParams = { proposalId: string }

export const POST = withAuthenticatedHandler<
  AddProposalCommentBody,
  AddProposalCommentParams
>(
  {
    fallbackMessage: "Failed to add Proposal comment.",
    walletField: "memberWallet",
  },
  async ({ body, params }) => {
    if (!params.proposalId || !body.memberWallet || !body.body) {
      throw new FundWiseError("Missing required Proposal comment fields.")
    }

    return addProposalCommentMutation({
      proposalId: params.proposalId,
      memberWallet: body.memberWallet,
      body: body.body,
    })
  }
)
