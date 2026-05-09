export const runtime = "edge"

import { NextResponse } from "next/server"
import { addProposalMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    const body = (await request.json()) as {
      groupId?: string
      proposerWallet?: string
      recipientWallet?: string
      amount?: number
      mint?: string
      squadsTransactionIndex?: number
      squadsProposalAddress?: string
      squadsTransactionAddress?: string
      squadsCreateTxSig?: string
      proofUrl?: string
      memo?: string
    }

    if (
      !body.groupId ||
      !body.proposerWallet ||
      !body.recipientWallet ||
      typeof body.amount !== "number" ||
      !body.mint ||
      typeof body.squadsTransactionIndex !== "number" ||
      !body.squadsProposalAddress ||
      !body.squadsTransactionAddress ||
      !body.squadsCreateTxSig
    ) {
      throw new FundWiseError("Missing required Proposal fields.")
    }

    if (body.proposerWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Proposal creator.", 401)
    }

    const proposal = await addProposalMutation({
      groupId: body.groupId,
      proposerWallet: body.proposerWallet,
      recipientWallet: body.recipientWallet,
      amount: body.amount,
      mint: body.mint,
      squadsTransactionIndex: body.squadsTransactionIndex,
      squadsProposalAddress: body.squadsProposalAddress,
      squadsTransactionAddress: body.squadsTransactionAddress,
      squadsCreateTxSig: body.squadsCreateTxSig,
      proofUrl: body.proofUrl,
      memo: body.memo,
    })

    return NextResponse.json(proposal)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create Proposal.")
    return NextResponse.json({ error: message }, { status })
  }
}
