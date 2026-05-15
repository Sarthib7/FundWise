export const runtime = "edge"

import { NextResponse } from "next/server"
import { addProposalMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("proposal_create", session.wallet)
    const body = (await request.json()) as {
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

    if (!body.groupId || !body.proposerWallet) {
      throw new FundWiseError("Missing required Proposal fields.")
    }

    if (body.proposerWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Proposal creator.", 401)
    }

    const kind = body.kind ?? "reimbursement"

    if (kind === "threshold_change") {
      if (typeof body.targetThreshold !== "number") {
        throw new FundWiseError("Threshold-change Proposals require targetThreshold.")
      }

      const proposal = await addProposalMutation({
        groupId: body.groupId,
        proposerWallet: body.proposerWallet,
        kind,
        targetThreshold: body.targetThreshold,
        memo: body.memo,
      })

      return NextResponse.json(proposal)
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

    const proposal = await addProposalMutation({
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

    return NextResponse.json(proposal)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create Proposal.")
    return NextResponse.json({ error: message }, { status })
  }
}
