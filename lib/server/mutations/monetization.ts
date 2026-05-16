import type { Json } from "@/lib/database.types"
import {
  FUND_MODE_BETA_PRICING,
  fundModeCreationFeeWallet,
  type FundModeMonetizationKind,
} from "@/lib/fund-mode-monetization"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { verifyContributionTransfer } from "@/lib/server/solana-transfer-verification"
import {
  assertMemberCan,
  assertWalletIsMember,
  getAdmin,
  getGroupOrThrow,
  isMissingColumnSchemaCacheError,
} from "./_internal"

// =============================================
// FW-047: Creation fee + opt-out telemetry
// =============================================
export async function recordCreationFeeMutation(data: {
  groupId: string
  payerWallet: string
  outcome: "paid" | "skipped"
  amount?: number | null
  mint?: string | null
  txSig?: string | null
  emulatedUsdCents?: number | null
  notes?: string | null
}) {
  if (data.outcome !== "paid" && data.outcome !== "skipped") {
    throw new FundWiseError("Creation fee outcome must be 'paid' or 'skipped'.")
  }

  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Creation fees are only tracked for Fund Mode Groups.")
  }

  await assertMemberCan(
    data.groupId,
    data.payerWallet,
    "contribute",
    "Viewers cannot record creation fees."
  )

  if (data.outcome === "paid") {
    if (typeof data.amount !== "number" || data.amount <= 0) {
      throw new FundWiseError("Paid creation fees must include a positive token amount.")
    }
    if (!data.mint) {
      throw new FundWiseError("Paid creation fees must include the stablecoin mint.")
    }
    if (data.mint !== group.stablecoin_mint) {
      throw new FundWiseError("Creation fee mint does not match the Group stablecoin.")
    }
    if (!data.txSig) {
      throw new FundWiseError("Paid creation fees must include the on-chain transaction signature.")
    }

    const feeRecipient = fundModeCreationFeeWallet()
    if (feeRecipient) {
      await verifyContributionTransfer({
        txSig: data.txSig,
        mint: data.mint,
        memberWallet: data.payerWallet,
        treasuryAddress: feeRecipient,
        amount: data.amount,
      })
    }
  }

  const { data: inserted, error } = await getAdmin()
    .from("fund_mode_creation_fees")
    .insert({
      group_id: data.groupId,
      payer_wallet: data.payerWallet,
      amount: data.outcome === "paid" ? data.amount ?? null : null,
      mint: data.outcome === "paid" ? data.mint ?? null : null,
      tx_sig: data.outcome === "paid" ? data.txSig ?? null : null,
      outcome: data.outcome,
      emulated_usd_cents: data.emulatedUsdCents ?? FUND_MODE_BETA_PRICING.creationFeeUsdCents,
      notes: data.notes ?? null,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new FundWiseError(`This Group already has a recorded ${data.outcome} creation fee outcome.`)
    }
    if (isMissingColumnSchemaCacheError(error, "outcome") || error.message?.includes("fund_mode_creation_fees")) {
      throw new FundWiseError(
        "Creation fee telemetry requires migration 20260515100000_fund_mode_beta_completion.sql to be replayed on this Supabase project.",
        503
      )
    }
    throw new FundWiseError(`Failed to record creation fee: ${error.message}`)
  }

  return inserted
}

// =============================================
// FW-061 / FW-062 / FW-063: Monetization telemetry
// =============================================
export async function recordMonetizationResponseMutation(data: {
  kind: FundModeMonetizationKind
  memberWallet: string
  groupId?: string | null
  emulatedUsdCents?: number | null
  payload?: Record<string, unknown>
}) {
  if (!["monthly_fee_wtp", "free_tier_cap", "exit_survey"].includes(data.kind)) {
    throw new FundWiseError("Unknown monetization response kind.")
  }

  // If a groupId is supplied the wallet must be a Member; otherwise it's an
  // anonymous response that the admin dashboard still aggregates.
  if (data.groupId) {
    await assertWalletIsMember(
      data.groupId,
      data.memberWallet,
      "Only Group Members can submit monetization responses for this Group."
    )
  }

  const { data: inserted, error } = await getAdmin()
    .from("monetization_responses")
    .insert({
      kind: data.kind,
      group_id: data.groupId ?? null,
      member_wallet: data.memberWallet,
      emulated_usd_cents: data.emulatedUsdCents ?? null,
      payload: (data.payload ?? {}) as Json,
    })
    .select("*")
    .single()

  if (error) {
    if (error.message?.includes("monetization_responses")) {
      throw new FundWiseError(
        "Monetization telemetry requires migration 20260515100000_fund_mode_beta_completion.sql to be replayed on this Supabase project.",
        503
      )
    }
    throw new FundWiseError(`Failed to record monetization response: ${error.message}`)
  }

  return inserted
}
