export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { updateProposalMetadataMutation } from "@/lib/server/mutations/proposal"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type UpdateProposalBody = {
  editorWallet?: string
  memo?: string | null
  proofUrl?: string | null
}

type UpdateProposalParams = { proposalId: string }

export const PATCH = withAuthenticatedHandler<UpdateProposalBody, UpdateProposalParams>(
  { fallbackMessage: "Failed to update Proposal.", walletField: "editorWallet" },
  async ({ body, params }) => {
    if (!params.proposalId || !body.editorWallet) {
      throw new FundWiseError("Missing required Proposal edit fields.")
    }

    return updateProposalMetadataMutation({
      proposalId: params.proposalId,
      editorWallet: body.editorWallet,
      memo: body.memo,
      proofUrl: body.proofUrl,
    })
  }
)
