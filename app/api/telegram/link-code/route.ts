export const runtime = "edge"

import { NextResponse } from "next/server"

import { createTelegramLinkCodeRecord } from "@/lib/server/fundy-telegram-auth"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

export const POST = withAuthenticatedHandler(
  { fallbackMessage: "Failed to create Telegram link code.", parseBody: false },
  async ({ session }) => createTelegramLinkCodeRecord(session.wallet)
)

export async function GET() {
  return NextResponse.json(
    { error: "Use POST to create a short-lived Telegram link code." },
    { status: 405 }
  )
}
