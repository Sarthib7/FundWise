import { NextResponse } from "next/server"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import {
  buildWalletChallengeMessage,
  clearWalletChallengeCookie,
  createWalletSessionPayload,
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

    const challenge = await readWalletChallenge()

    if (!challenge) {
      throw new FundWiseError("Wallet challenge expired. Start verification again.", 401)
    }

    if (challenge.wallet !== wallet) {
      throw new FundWiseError("Wallet challenge does not match the connected wallet.", 401)
    }

    const verified = await verifyWalletSignature(
      wallet,
      buildWalletChallengeMessage(challenge),
      signature
    )

    if (!verified) {
      throw new FundWiseError("Wallet signature verification failed.", 401)
    }

    await clearWalletChallengeCookie()
    await writeWalletSessionCookie(createWalletSessionPayload(wallet))

    return NextResponse.json({ wallet })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to verify wallet session.")
    return NextResponse.json({ error: message }, { status })
  }
}
