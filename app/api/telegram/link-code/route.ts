export const runtime = "edge"

import { NextResponse } from "next/server"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { createTelegramLinkCodeRecord } from "@/lib/server/fundy-telegram-auth"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST() {
  try {
    const session = await requireAuthenticatedWallet()
    const linkCode = await createTelegramLinkCodeRecord(session.wallet)

    return NextResponse.json(linkCode)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create Telegram link code.")
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST to create a short-lived Telegram link code." },
    { status: 405 }
  )
}
