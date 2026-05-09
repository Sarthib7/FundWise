export const runtime = "edge"

import { NextResponse } from "next/server"
import { reviewProposalMutation } from "@/lib/server/fundwise-mutations"
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
      decision?: "approved" | "rejected"
    }

    if (!proposalId || !body.memberWallet || !body.decision) {
      throw new FundWiseError("Missing required Proposal review fields.")
    }

    if (body.memberWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Proposal reviewer.", 401)
    }

    const proposal = await reviewProposalMutation({
      proposalId,
      memberWallet: body.memberWallet,
      decision: body.decision,
    })

    return NextResponse.json(proposal)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to review Proposal.")
    return NextResponse.json({ error: message }, { status })
  }
}
