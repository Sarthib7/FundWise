export const runtime = "edge"

import { NextResponse } from "next/server"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceRateLimit, getClientIp } from "@/lib/server/rate-limit"
import {
  buildWalletChallengeMessage,
  createWalletChallengePayload,
  getRequestOrigin,
  normalizeWalletAddress,
  writeWalletChallengeCookie,
} from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { wallet?: string }
    const wallet = body.wallet?.trim()

    if (!wallet) {
      throw new FundWiseError("Wallet address is required.")
    }

    const normalizedWallet = normalizeWalletAddress(wallet)
    const clientIp = getClientIp(request)
    enforceRateLimit({ key: `wallet-challenge:ip:${clientIp}`, limit: 30, windowMs: 60_000 })
    enforceRateLimit({ key: `wallet-challenge:wallet:${normalizedWallet}`, limit: 10, windowMs: 60_000 })

    const challenge = createWalletChallengePayload(normalizedWallet, {
      origin: getRequestOrigin(request),
    })
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
