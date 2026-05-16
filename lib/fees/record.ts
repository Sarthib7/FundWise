/**
 * The Fees Module's single side-effectful operation (FW-066, ADR-0036).
 *
 * `recordFee` is the only place in the codebase that knows the
 * `platform_fee_ledger` table shape. Callers pass the `FeeQuote` they
 * produced via `quote*Fee`, the on-chain signature of the transaction
 * that included the fee leg, and the cluster. The insert is idempotent
 * on `(tx_sig, kind)` per the unique index — safe to retry after
 * on-chain success.
 */

import { getSupabaseAdmin } from "@/lib/server/supabase-admin"
import { FundWiseError } from "@/lib/server/fundwise-error"
import type { FeeCluster, FeeQuote } from "./types"

export type RecordFeeInput = {
  quote: FeeQuote
  txSig: string
  cluster: FeeCluster
}

export async function recordFee(input: RecordFeeInput): Promise<void> {
  const { quote, txSig, cluster } = input

  if (!txSig || txSig.trim().length === 0) {
    throw new FundWiseError("Fees.record requires a non-empty txSig.", 500)
  }

  if (cluster !== quote.ledgerRow.cluster) {
    throw new FundWiseError(
      `Fees.record cluster mismatch: quote=${quote.ledgerRow.cluster} call=${cluster}.`,
      500
    )
  }

  const supabase = getSupabaseAdmin()

  // bigint → number for serialization. The schema stores `fee_amount` as
  // bigint in Postgres, but Supabase serializes via JSON; we stay within
  // Number.MAX_SAFE_INTEGER for any realistic fee amount (max ~5 USDC for
  // creation, fractional percentages on the rest).
  const feeAmountNumber = Number(quote.ledgerRow.fee_amount)
  if (!Number.isFinite(feeAmountNumber) || feeAmountNumber < 0) {
    throw new FundWiseError(
      `Fees.record received non-finite fee_amount: ${quote.ledgerRow.fee_amount}`,
      500
    )
  }

  const payload = {
    kind: quote.ledgerRow.kind,
    fee_amount: feeAmountNumber,
    mint: quote.ledgerRow.mint,
    cluster: quote.ledgerRow.cluster,
    fee_wallet: quote.ledgerRow.fee_wallet,
    payer_wallet: quote.ledgerRow.payer_wallet,
    group_id: quote.ledgerRow.group_id,
    tx_sig: txSig,
  }

  // Idempotent on (tx_sig, kind) via unique index. On conflict we
  // silently no-op: a retry after a successful on-chain landing
  // shouldn't surface as an error to the caller.
  const { error } = await supabase
    .from("platform_fee_ledger")
    .upsert(payload, { onConflict: "tx_sig,kind", ignoreDuplicates: true })

  if (error) {
    throw new FundWiseError(
      `Failed to record platform fee: ${error.message}`,
      500
    )
  }
}
