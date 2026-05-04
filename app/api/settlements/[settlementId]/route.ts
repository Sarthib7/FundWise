export const runtime = "edge"

import { NextResponse } from "next/server"
import { getErrorDetails } from "@/lib/server/fundwise-error"
import { getSettlementReceiptView } from "@/lib/server/fundwise-reads"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function GET(
  _request: Request,
  context: { params: Promise<{ settlementId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { settlementId } = await context.params
    const receipt = await getSettlementReceiptView(settlementId, session.wallet)

    return NextResponse.json(receipt)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to load Settlement receipt.")
    return NextResponse.json({ error: message }, { status })
  }
}
