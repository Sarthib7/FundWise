export const runtime = "edge"

import { NextResponse } from "next/server"
import { recordCreationFeeMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("creation_fee", session.wallet)
    const { groupId } = await context.params
    const body = (await request.json()) as {
      outcome?: "paid" | "skipped"
      amount?: number
      mint?: string
      txSig?: string
      emulatedUsdCents?: number
      notes?: string
    }

    if (!groupId) {
      throw new FundWiseError("Missing Group id.")
    }

    if (body.outcome !== "paid" && body.outcome !== "skipped") {
      throw new FundWiseError("Creation fee outcome must be 'paid' or 'skipped'.")
    }

    const inserted = await recordCreationFeeMutation({
      groupId,
      payerWallet: session.wallet,
      outcome: body.outcome,
      amount: body.amount ?? null,
      mint: body.mint ?? null,
      txSig: body.txSig ?? null,
      emulatedUsdCents: body.emulatedUsdCents ?? null,
      notes: body.notes ?? null,
    })

    return NextResponse.json(inserted)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to record creation fee.")
    return NextResponse.json({ error: message }, { status })
  }
}
