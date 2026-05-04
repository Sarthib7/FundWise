export const runtime = "edge"

import { NextResponse } from "next/server"
import { readWalletSession } from "@/lib/server/wallet-session"

export async function GET() {
  const session = await readWalletSession()

  return NextResponse.json({
    authenticated: Boolean(session),
    wallet: session?.wallet || null,
  })
}
