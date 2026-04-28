import { NextResponse } from "next/server"
import { createGroupMutation } from "@/lib/server/fundwise-mutations"
import { getGroupByCodeLookup, getGroupsForWalletRead } from "@/lib/server/fundwise-reads"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

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

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    const body = (await request.json()) as {
      name?: string
      mode?: "split" | "fund"
      stablecoinMint?: string
      createdBy?: string
      fundingGoal?: number
      approvalThreshold?: number
    }

    if (!body.name || !body.mode || !body.stablecoinMint || !body.createdBy) {
      throw new FundWiseError("Missing required Group fields.")
    }

    if (body.createdBy !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the requested Group creator.", 401)
    }

    const group = await createGroupMutation({
      name: body.name,
      mode: body.mode,
      stablecoinMint: body.stablecoinMint,
      createdBy: body.createdBy,
      fundingGoal: body.fundingGoal,
      approvalThreshold: body.approvalThreshold,
    })

    return NextResponse.json(group)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create Group.")
    return NextResponse.json({ error: message }, { status })
  }
}
