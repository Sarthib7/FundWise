/**
 * Shared types for the FundWise Fees Module (FW-066, ADR-0036).
 *
 * Quote functions are pure: given a `FeeConfig` and the inputs for a
 * specific surface, they return a `FeeQuote` describing the transfer
 * legs the caller must include in the user-signed (or Squads-proposed)
 * transaction. The Module never signs anything; only `Fees.record`
 * has a side effect (insert into `platform_fee_ledger`).
 */

import type { PublicKey, TransactionInstruction } from "@solana/web3.js"

export type FeeKind = "creation" | "contribution" | "reimbursement" | "routing"

export type FeeCluster = "mainnet-beta" | "devnet" | "custom"

/**
 * A discrete SPL transfer instruction the caller will assemble into the
 * user-signed tx. The Module produces these blueprints but does NOT
 * construct the on-chain `TransferInstruction` directly — that lives at
 * the caller boundary so the Module stays independent of `@solana/spl-token`
 * imports beyond the type surface, and the caller controls ordering.
 *
 * `label = "principal"` is the main transfer (e.g., contribution amount
 * Member → Treasury, or reimbursement Treasury → Member). `label = "fee"`
 * is the platform fee leg (→ FUNDWISE_PLATFORM_FEE_WALLET).
 */
export type TransferLeg = {
  source: PublicKey
  destination: PublicKey
  owner: PublicKey
  mint: PublicKey
  amount: bigint
  label: "principal" | "fee"
}

/**
 * The shape a fee surface returns. `transfers` is the full ordered list
 * a caller can prepend to the tx (including any ATA-create instructions);
 * `atatCreateInstructions` exposes the same ATA creates separately so
 * callers who want to control ordering can interleave them.
 *
 * `ledgerRow` is the payload `Fees.record` will insert after on-chain
 * success. `tx_sig` and `recorded_at` are filled at write time, not here.
 *
 * `display.feeUsdCents` is only valid for stablecoin mints (USDC at
 * launch per ADR-0032). Non-stablecoin mints set this to 0 — callers
 * should not render a USD value in that case.
 */
export type FeeQuote = {
  kind: FeeKind
  feeAmount: bigint
  mint: PublicKey
  transfers: TransferLeg[]
  atatCreateInstructions: TransactionInstruction[]
  ledgerRow: {
    kind: FeeKind
    fee_amount: bigint
    mint: string
    cluster: FeeCluster
    fee_wallet: string
    payer_wallet: string
    group_id: string | null
  }
  display: {
    feeUsdCents: number
    feeMint: string
    feeAmountFormatted: string
  }
}
