export const runtime = "edge"

import { NextResponse } from "next/server"
import { updateGroupTreasuryMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("treasury_init", session.wallet)
    const { groupId } = await context.params
    const body = (await request.json()) as {
      creatorWallet?: string
      multisigAddress?: string
      treasuryAddress?: string
    }

    if (!groupId || !body.creatorWallet || !body.multisigAddress || !body.treasuryAddress) {
      throw new FundWiseError("Missing Treasury update details.")
    }

    if (body.creatorWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Treasury creator.", 401)
    }

    await updateGroupTreasuryMutation({
      groupId,
      creatorWallet: body.creatorWallet,
      multisigAddress: body.multisigAddress,
      treasuryAddress: body.treasuryAddress,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to update Treasury.")
    return NextResponse.json({ error: message }, { status })
  }
}
