export const runtime = "edge"

import { NextResponse } from "next/server"
import { isFundModeBetaAdminWallet } from "@/lib/fund-mode-monetization"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

type BetaRow = {
  group_id: string
  group_name: string
  group_code: string
  group_template: string | null
  approval_threshold: number | null
  created_by: string
  created_at: string
  treasury_initialized: boolean
  member_count: number
  contribution_count: number
  contribution_total: number
  proposal_count: number
  proposals_executed: number
  last_contribution_at: string | null
  last_execution_at: string | null
  creation_fees_paid: number
  creation_fees_skipped: number
}

export async function GET() {
  try {
    const session = await requireAuthenticatedWallet()

    if (!isFundModeBetaAdminWallet(session.wallet)) {
      throw new FundWiseError("This wallet is not configured as a Fund Mode beta admin.", 403)
    }

    const admin = getSupabaseAdmin()

    const { data: rows, error: rowsError } = await admin
      .from("fund_mode_beta_admin_view")
      .select("*")
      .order("created_at", { ascending: false })

    if (rowsError) {
      throw new FundWiseError(`Failed to load beta dashboard rows: ${rowsError.message}`)
    }

    const { data: wtpResponses, error: wtpError } = await admin
      .from("monetization_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (wtpError && !wtpError.message?.includes("monetization_responses")) {
      throw new FundWiseError(`Failed to load monetization responses: ${wtpError.message}`)
    }

    return NextResponse.json({
      pools: (rows ?? []) as BetaRow[],
      monetizationResponses: wtpResponses ?? [],
    })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to load beta admin dashboard.")
    return NextResponse.json({ error: message }, { status })
  }
}
