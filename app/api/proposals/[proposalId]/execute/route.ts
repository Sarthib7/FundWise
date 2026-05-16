export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { executeProposalMutation } from "@/lib/server/mutations/proposal"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type ExecuteProposalBody = {
  executorWallet?: string
  txSig?: string
}

type ExecuteProposalParams = { proposalId: string }

export const POST = withAuthenticatedHandler<
  ExecuteProposalBody,
  ExecuteProposalParams
>(
  {
    fallbackMessage: "Failed to execute Proposal.",
    rateLimit: "proposal_execute",
    walletField: "executorWallet",
  },
  async ({ body, params }) => {
    if (!params.proposalId || !body.executorWallet) {
      throw new FundWiseError("Missing required Proposal execution fields.")
    }

    return executeProposalMutation({
      proposalId: params.proposalId,
      executorWallet: body.executorWallet,
      txSig: body.txSig,
    })
  }
)
