export const runtime = "edge"

import { NextResponse } from "next/server"
import { addProposalCommentMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(
  request: Request,
  context: { params: Promise<{ proposalId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { proposalId } = await context.params
    const body = (await request.json()) as {
      memberWallet?: string
      body?: string
    }

    if (!proposalId || !body.memberWallet || !body.body) {
      throw new FundWiseError("Missing required Proposal comment fields.")
    }

    if (body.memberWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Proposal commenter.", 401)
    }

    const comment = await addProposalCommentMutation({
      proposalId,
      memberWallet: body.memberWallet,
      body: body.body,
    })

    return NextResponse.json(comment)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to add Proposal comment.")
    return NextResponse.json({ error: message }, { status })
  }
}
