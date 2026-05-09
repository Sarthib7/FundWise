export const runtime = "edge"

import { NextResponse } from "next/server"
import { executeProposalMutation } from "@/lib/server/fundwise-mutations"
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
      executorWallet?: string
      txSig?: string
    }

    if (!proposalId || !body.executorWallet || !body.txSig) {
      throw new FundWiseError("Missing required Proposal execution fields.")
    }

    if (body.executorWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Proposal executor.", 401)
    }

    const proposal = await executeProposalMutation({
      proposalId,
      executorWallet: body.executorWallet,
      txSig: body.txSig,
    })

    return NextResponse.json(proposal)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to execute Proposal.")
    return NextResponse.json({ error: message }, { status })
  }
}
