import { NextResponse } from "next/server"
import { addMemberMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { groupId } = await context.params
    const body = (await request.json()) as {
      wallet?: string
      displayName?: string
    }

    if (!groupId || !body.wallet) {
      throw new FundWiseError("Missing Group or wallet details.")
    }

    if (body.wallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the joining Member.", 401)
    }

    await addMemberMutation({
      groupId,
      wallet: body.wallet,
      displayName: body.displayName,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to join Group.")
    return NextResponse.json({ error: message }, { status })
  }
}
