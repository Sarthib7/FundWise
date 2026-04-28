import { NextResponse } from "next/server"
import { updateProfileDisplayNameMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    const body = (await request.json()) as {
      wallet?: string
      displayName?: string
    }

    if (!body.wallet || typeof body.displayName !== "string") {
      throw new FundWiseError("Missing profile update details.")
    }

    if (body.wallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the requested profile wallet.", 401)
    }

    await updateProfileDisplayNameMutation(body.wallet, body.displayName)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to update profile display name.")
    return NextResponse.json({ error: message }, { status })
  }
}
