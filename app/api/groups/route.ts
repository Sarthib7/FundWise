export const runtime = "edge"

import { NextResponse } from "next/server"

import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { getGroupByCodeLookup, getGroupsForWalletRead } from "@/lib/server/fundwise-reads"
import { createGroupMutation } from "@/lib/server/mutations/group"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

// GET stays raw because the `?code=<inviteCode>` branch is intentionally
// public — wrapping the handler would force auth on the invite-code lookup
// path used by users joining a Group before they've authenticated.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const inviteCode = url.searchParams.get("code")?.trim()

    if (inviteCode) {
      const group = await getGroupByCodeLookup(inviteCode)
      return NextResponse.json(group)
    }

    const session = await requireAuthenticatedWallet()
    const requestedWallet = url.searchParams.get("wallet")?.trim()

    if (requestedWallet && requestedWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the requested Group list.", 401)
    }

    const groups = await getGroupsForWalletRead(session.wallet)
    return NextResponse.json(groups)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to load Groups.")
    return NextResponse.json({ error: message }, { status })
  }
}

type CreateGroupBody = {
  name?: string
  mode?: "split" | "fund"
  stablecoinMint?: string
  createdBy?: string
  fundingGoal?: number
  approvalThreshold?: number
  groupTemplate?: "trip_pool" | "friend_fund" | "dao_grant" | "family_budget" | null
}

export const POST = withAuthenticatedHandler<CreateGroupBody>(
  { fallbackMessage: "Failed to create Group.", walletField: "createdBy" },
  async ({ body }) => {
    if (!body.name || !body.mode || !body.stablecoinMint || !body.createdBy) {
      throw new FundWiseError("Missing required Group fields.")
    }

    return createGroupMutation({
      name: body.name,
      mode: body.mode,
      stablecoinMint: body.stablecoinMint,
      createdBy: body.createdBy,
      fundingGoal: body.fundingGoal,
      approvalThreshold: body.approvalThreshold,
      groupTemplate: body.groupTemplate,
    })
  }
)
