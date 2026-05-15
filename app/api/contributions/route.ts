export const runtime = "edge"

import { NextResponse } from "next/server"
import { addContributionMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("contribution_create", session.wallet)
    const body = (await request.json()) as {
      groupId?: string
      memberWallet?: string
      amount?: number
      mint?: string
      txSig?: string
    }

    if (
      !body.groupId ||
      !body.memberWallet ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.txSig
    ) {
      throw new FundWiseError("Missing required Contribution fields.")
    }

    if (body.memberWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Contribution sender.", 401)
    }

    const contribution = await addContributionMutation({
      groupId: body.groupId,
      memberWallet: body.memberWallet,
      amount: body.amount,
      mint: body.mint,
      txSig: body.txSig,
    })

    return NextResponse.json(contribution)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to record Contribution.")
    return NextResponse.json({ error: message }, { status })
  }
}
