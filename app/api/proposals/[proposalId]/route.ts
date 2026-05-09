export const runtime = "edge"

import { NextResponse } from "next/server"
import { updateProposalMetadataMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ proposalId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { proposalId } = await context.params
    const body = (await request.json()) as {
      editorWallet?: string
      memo?: string | null
      proofUrl?: string | null
    }

    if (!proposalId || !body.editorWallet) {
      throw new FundWiseError("Missing required Proposal edit fields.")
    }

    if (body.editorWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Proposal editor.", 401)
    }

    const proposal = await updateProposalMetadataMutation({
      proposalId,
      editorWallet: body.editorWallet,
      memo: body.memo,
      proofUrl: body.proofUrl,
    })

    return NextResponse.json(proposal)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to update Proposal.")
    return NextResponse.json({ error: message }, { status })
  }
}
