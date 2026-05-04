export const runtime = "edge"

import { NextResponse } from "next/server"
import { getErrorDetails } from "@/lib/server/fundwise-error"
import { getGroupDashboardSnapshot } from "@/lib/server/fundwise-reads"
import { readWalletSession } from "@/lib/server/wallet-session"

export async function GET(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params
    const url = new URL(request.url)
    const requestedWallet = url.searchParams.get("wallet")?.trim()
    const session = await readWalletSession()
    const viewerWallet =
      requestedWallet && session?.wallet === requestedWallet ? session.wallet : undefined
    const snapshot = await getGroupDashboardSnapshot(groupId, viewerWallet)

    return NextResponse.json(snapshot)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to load Group.")
    return NextResponse.json({ error: message }, { status })
  }
}
