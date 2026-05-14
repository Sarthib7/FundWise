export const runtime = "edge"

import { NextResponse } from "next/server"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceRateLimit, getClientIp } from "@/lib/server/rate-limit"
import {
  assertWalletChallengeContext,
  buildWalletChallengeMessage,
  clearWalletChallengeCookie,
  createWalletSessionPayload,
  getRequestOrigin,
  normalizeWalletAddress,
  readWalletChallenge,
  verifyWalletSignature,
  writeWalletSessionCookie,
} from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { wallet?: string; signature?: string }
    const wallet = body.wallet?.trim()
    const signature = body.signature?.trim()

    if (!wallet || !signature) {
      throw new FundWiseError("Wallet and signature are required.")
    }

    const normalizedWallet = normalizeWalletAddress(wallet)
    const clientIp = getClientIp(request)
    enforceRateLimit({ key: `wallet-verify:ip:${clientIp}`, limit: 60, windowMs: 60_000 })
    enforceRateLimit({ key: `wallet-verify:wallet:${normalizedWallet}`, limit: 12, windowMs: 60_000 })

    const challenge = await readWalletChallenge()

    if (!challenge) {
      throw new FundWiseError("Wallet challenge expired. Start verification again.", 401)
    }

    if (challenge.wallet !== normalizedWallet) {
      throw new FundWiseError("Wallet challenge does not match the connected wallet.", 401)
    }

    assertWalletChallengeContext(challenge, {
      origin: getRequestOrigin(request),
    })

    const verified = await verifyWalletSignature(
      normalizedWallet,
      buildWalletChallengeMessage(challenge),
      signature
    )

    if (!verified) {
      throw new FundWiseError("Wallet signature verification failed.", 401)
    }

    await clearWalletChallengeCookie()
    await writeWalletSessionCookie(createWalletSessionPayload(normalizedWallet))

    return NextResponse.json({ wallet: normalizedWallet })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to verify wallet session.")
    return NextResponse.json({ error: message }, { status })
  }
}
