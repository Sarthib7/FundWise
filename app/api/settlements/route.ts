export const runtime = "edge"

import { NextResponse } from "next/server"
import { addSettlementMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    const body = (await request.json()) as {
      groupId?: string
      fromWallet?: string
      toWallet?: string
      amount?: number
      mint?: string
      txSig?: string
    }

    if (
      !body.groupId ||
      !body.fromWallet ||
      !body.toWallet ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.txSig
    ) {
      throw new FundWiseError("Missing required Settlement fields.")
    }

    if (body.fromWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Settlement sender.", 401)
    }

    const settlement = await addSettlementMutation({
      groupId: body.groupId,
      fromWallet: body.fromWallet,
      toWallet: body.toWallet,
      amount: body.amount,
      mint: body.mint,
      txSig: body.txSig,
    })

    return NextResponse.json(settlement)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to record Settlement.")
    return NextResponse.json({ error: message }, { status })
  }
}
