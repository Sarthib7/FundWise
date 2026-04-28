import { NextResponse } from "next/server"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import {
  buildWalletChallengeMessage,
  createWalletChallengePayload,
  writeWalletChallengeCookie,
} from "@/lib/server/wallet-session"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { wallet?: string }
    const wallet = body.wallet?.trim()

    if (!wallet) {
      throw new FundWiseError("Wallet address is required.")
    }

    const challenge = createWalletChallengePayload(wallet)
    await writeWalletChallengeCookie(challenge)

    return NextResponse.json({
      message: buildWalletChallengeMessage(challenge),
      expiresAt: challenge.expiresAt,
    })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create wallet challenge.")
    return NextResponse.json({ error: message }, { status })
  }
}
