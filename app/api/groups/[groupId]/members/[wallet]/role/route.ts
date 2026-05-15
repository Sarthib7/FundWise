export const runtime = "edge"

import { NextResponse } from "next/server"
import { setMemberRoleMutation } from "@/lib/server/fundwise-mutations"
import { isFundModeRole } from "@/lib/fund-mode-roles"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { enforceFundWiseRateLimit } from "@/lib/server/rate-limit"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string; wallet: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    await enforceFundWiseRateLimit("member_role", session.wallet)
    const { groupId, wallet } = await context.params
    const body = (await request.json()) as { role?: string }

    if (!groupId || !wallet) {
      throw new FundWiseError("Missing Group or target wallet.")
    }

    if (!body.role || !isFundModeRole(body.role)) {
      throw new FundWiseError("Role must be admin, member, or viewer.")
    }

    const updated = await setMemberRoleMutation({
      groupId,
      actorWallet: session.wallet,
      targetWallet: wallet,
      role: body.role,
    })

    return NextResponse.json(updated)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to update Member role.")
    return NextResponse.json({ error: message }, { status })
  }
}
