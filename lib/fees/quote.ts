/**
 * Pure fee quote functions for the FundWise Fees Module (FW-066, ADR-0036).
 *
 * Each surface (Creation, Contribution, Reimbursement, Routing) computes
 * a `FeeQuote` deterministically from `FeeConfig` plus the per-call
 * inputs. No I/O, no RPC, no signing. The caller assembles the legs into
 * a transaction the user (or Squads vault) signs.
 *
 * USDC math is buyer-pays per ADR-0032: the principal leg moves the
 * full requested amount; the fee leg is added on top. For reimbursement
 * the fee is paid from Treasury (same `owner` as the principal leg).
 *
 * The platform fee wallet's ATA is created via
 * `createAssociatedTokenAccountIdempotentInstruction`. First fee per
 * cluster pays ~0.0021 SOL rent; every subsequent fee is a no-op.
 */

import { PublicKey, type TransactionInstruction } from "@solana/web3.js"
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"
import type { FeeConfig } from "./config"
import { getUsdcMintForCluster } from "./config"
import type { FeeCluster, FeeKind, FeeQuote, TransferLeg } from "./types"

const USDC_DECIMALS = 6
const BPS_DENOMINATOR = 10_000n
const USDC_CENTS_PER_BASE = 10_000n // 1 cent = 10_000 base units at 6 decimals

function isUsdcMint(mint: PublicKey, cluster: FeeCluster) {
  return mint.equals(getUsdcMintForCluster(cluster))
}

function formatUsdcAmount(baseUnits: bigint): string {
  const whole = baseUnits / 1_000_000n
  const fraction = baseUnits % 1_000_000n
  // Display 2 decimals for UI legibility.
  const cents = (fraction + 5_000n) / 10_000n // round to 2 decimals
  const centsClamped = cents >= 100n ? 99n : cents
  const wholeStr = whole.toString()
  const centsStr = centsClamped.toString().padStart(2, "0")
  return `${wholeStr}.${centsStr} USDC`
}

function feeUsdCents(feeAmount: bigint, mint: PublicKey, cluster: FeeCluster): number {
  if (!isUsdcMint(mint, cluster)) {
    return 0
  }
  const cents = feeAmount / USDC_CENTS_PER_BASE
  // Clamp to Number range; fees are tiny so this is always safe in practice.
  return Number(cents)
}

function buildDisplay(
  feeAmount: bigint,
  mint: PublicKey,
  cluster: FeeCluster
): FeeQuote["display"] {
  return {
    feeUsdCents: feeUsdCents(feeAmount, mint, cluster),
    feeMint: mint.toBase58(),
    feeAmountFormatted: isUsdcMint(mint, cluster)
      ? formatUsdcAmount(feeAmount)
      : `${feeAmount.toString()} (decimals unknown)`,
  }
}

function buildLedgerRow(
  kind: FeeKind,
  feeAmount: bigint,
  config: FeeConfig,
  payerWallet: PublicKey,
  groupId: string | null
): FeeQuote["ledgerRow"] {
  return {
    kind,
    fee_amount: feeAmount,
    mint: config.usdcMint.toBase58(),
    cluster: config.cluster,
    fee_wallet: config.platformFeeWallet.toBase58(),
    payer_wallet: payerWallet.toBase58(),
    group_id: groupId,
  }
}

function buildFeeWalletAtaCreate(config: FeeConfig, payer: PublicKey) {
  const feeWalletAta = getAssociatedTokenAddressSync(
    config.usdcMint,
    config.platformFeeWallet
  )
  const instruction = createAssociatedTokenAccountIdempotentInstruction(
    payer,
    feeWalletAta,
    config.platformFeeWallet,
    config.usdcMint
  )
  return { feeWalletAta, instruction }
}

// =================================================================
// Creation fee — flat $5 USDC at Treasury init (FW-069 will wire it).
// =================================================================
//
// Creation has no principal leg — Treasury init itself isn't a transfer
// of funds to the Treasury. The fee is a single SPL transfer from the
// payer's USDC ATA to the platform fee wallet's USDC ATA, plus an
// idempotent ATA-create for the destination.

export type QuoteCreationFeeInput = {
  config: FeeConfig
  payerWallet: PublicKey
  groupId?: string | null
}

export function quoteCreationFee(input: QuoteCreationFeeInput): FeeQuote {
  const { config, payerWallet } = input
  const groupId = input.groupId ?? null
  const feeAmount = config.rates.creationFlatUsdc

  const payerAta = getAssociatedTokenAddressSync(config.usdcMint, payerWallet)
  const { feeWalletAta, instruction: ataCreate } = buildFeeWalletAtaCreate(
    config,
    payerWallet
  )

  const feeLeg: TransferLeg = {
    source: payerAta,
    destination: feeWalletAta,
    owner: payerWallet,
    mint: config.usdcMint,
    amount: feeAmount,
    label: "fee",
  }

  return {
    kind: "creation",
    feeAmount,
    mint: config.usdcMint,
    transfers: [feeLeg],
    atatCreateInstructions: [ataCreate],
    ledgerRow: buildLedgerRow("creation", feeAmount, config, payerWallet, groupId),
    display: buildDisplay(feeAmount, config.usdcMint, config.cluster),
  }
}

// =================================================================
// Contribution fee — 0.5% buyer-pays (FW-067 will wire it).
// =================================================================
//
// Principal: payer → Treasury (the contribution itself). Fee: payer →
// platform fee wallet (added on top, so Treasury sees the full
// contributionAmount). Both legs are owner=payerWallet.

export type QuoteContributionFeeInput = {
  config: FeeConfig
  payerWallet: PublicKey
  /** The Treasury ATA the contribution principal lands in. */
  treasuryWallet: PublicKey
  /** Principal contribution amount in USDC base units. */
  contributionAmount: bigint
  groupId: string
}

export function quoteContributionFee(input: QuoteContributionFeeInput): FeeQuote {
  const { config, payerWallet, treasuryWallet, contributionAmount, groupId } = input

  if (contributionAmount < 0n) {
    throw new Error("contributionAmount must be non-negative")
  }

  const feeAmount =
    (contributionAmount * BigInt(config.rates.contributionBps)) / BPS_DENOMINATOR

  const payerAta = getAssociatedTokenAddressSync(config.usdcMint, payerWallet)
  // Treasury PDA is off-curve; allow that on the ATA derivation.
  const treasuryAta = getAssociatedTokenAddressSync(
    config.usdcMint,
    treasuryWallet,
    true
  )
  const { feeWalletAta, instruction: ataCreate } = buildFeeWalletAtaCreate(
    config,
    payerWallet
  )

  const principalLeg: TransferLeg = {
    source: payerAta,
    destination: treasuryAta,
    owner: payerWallet,
    mint: config.usdcMint,
    amount: contributionAmount,
    label: "principal",
  }

  const feeLeg: TransferLeg = {
    source: payerAta,
    destination: feeWalletAta,
    owner: payerWallet,
    mint: config.usdcMint,
    amount: feeAmount,
    label: "fee",
  }

  return {
    kind: "contribution",
    feeAmount,
    mint: config.usdcMint,
    transfers: [principalLeg, feeLeg],
    atatCreateInstructions: [ataCreate],
    ledgerRow: buildLedgerRow("contribution", feeAmount, config, payerWallet, groupId),
    display: buildDisplay(feeAmount, config.usdcMint, config.cluster),
  }
}

// =================================================================
// Reimbursement fee — 0.5% paid from Treasury (FW-068, Squads-coordinated).
// =================================================================
//
// Principal: Treasury → recipient. Fee: Treasury → platform fee wallet.
// Both legs are `owner = treasuryPda` — they'll be consumed by the
// Squads vault tx, not signed directly by a wallet. `payerWallet` in
// the ledger row is the Treasury PDA (paying the fee), per ADR-0036.

export type QuoteReimbursementFeeInput = {
  config: FeeConfig
  /** Treasury PDA (Squads vault PDA) — owns the source ATA and signs via Squads. */
  treasuryPda: PublicKey
  recipientWallet: PublicKey
  /** Principal reimbursement amount in USDC base units. */
  reimbursementAmount: bigint
  groupId: string
}

export function quoteReimbursementFee(input: QuoteReimbursementFeeInput): FeeQuote {
  const { config, treasuryPda, recipientWallet, reimbursementAmount, groupId } = input

  if (reimbursementAmount < 0n) {
    throw new Error("reimbursementAmount must be non-negative")
  }

  const feeAmount =
    (reimbursementAmount * BigInt(config.rates.reimbursementBps)) / BPS_DENOMINATOR

  // Treasury PDA is off-curve.
  const treasuryAta = getAssociatedTokenAddressSync(
    config.usdcMint,
    treasuryPda,
    true
  )
  const recipientAta = getAssociatedTokenAddressSync(
    config.usdcMint,
    recipientWallet
  )
  // The Squads vault tx will pay rent for the fee-wallet ATA; the
  // creator/rentPayer in that flow is the executing wallet, but the
  // ATA-create itself is owner-agnostic (idempotent + payer is just
  // who pays rent). Use treasuryPda as the conceptual payer here;
  // callers can rewrite to the executing wallet when assembling.
  const { feeWalletAta, instruction: ataCreate } = buildFeeWalletAtaCreate(
    config,
    treasuryPda
  )

  const principalLeg: TransferLeg = {
    source: treasuryAta,
    destination: recipientAta,
    owner: treasuryPda,
    mint: config.usdcMint,
    amount: reimbursementAmount,
    label: "principal",
  }

  const feeLeg: TransferLeg = {
    source: treasuryAta,
    destination: feeWalletAta,
    owner: treasuryPda,
    mint: config.usdcMint,
    amount: feeAmount,
    label: "fee",
  }

  return {
    kind: "reimbursement",
    feeAmount,
    mint: config.usdcMint,
    transfers: [principalLeg, feeLeg],
    atatCreateInstructions: [ataCreate],
    // payer_wallet here is the Treasury PDA — it's paying the fee.
    ledgerRow: buildLedgerRow("reimbursement", feeAmount, config, treasuryPda, groupId),
    display: buildDisplay(feeAmount, config.usdcMint, config.cluster),
  }
}

// =================================================================
// Routing fee — 25 bps on CCTP/LI.FI inbound (FW-070 will wire it).
// =================================================================
//
// After the inbound bridge settles funds to the payer's USDC ATA, the
// payer signs one extra leg: payer → platform fee wallet. The routed
// funds reach the destination separately via LI.FI; the Module is not
// involved in routing the principal.

export type QuoteRoutingFeeInput = {
  config: FeeConfig
  payerWallet: PublicKey
  /** Routed amount in USDC base units (the LI.FI/CCTP inbound). */
  routedAmount: bigint
  groupId?: string | null
}

export function quoteRoutingFee(input: QuoteRoutingFeeInput): FeeQuote {
  const { config, payerWallet, routedAmount } = input
  const groupId = input.groupId ?? null

  if (routedAmount < 0n) {
    throw new Error("routedAmount must be non-negative")
  }

  const feeAmount = (routedAmount * BigInt(config.rates.routingBps)) / BPS_DENOMINATOR

  const payerAta = getAssociatedTokenAddressSync(config.usdcMint, payerWallet)
  const { feeWalletAta, instruction: ataCreate } = buildFeeWalletAtaCreate(
    config,
    payerWallet
  )

  const feeLeg: TransferLeg = {
    source: payerAta,
    destination: feeWalletAta,
    owner: payerWallet,
    mint: config.usdcMint,
    amount: feeAmount,
    label: "fee",
  }

  return {
    kind: "routing",
    feeAmount,
    mint: config.usdcMint,
    transfers: [feeLeg],
    atatCreateInstructions: [ataCreate],
    ledgerRow: buildLedgerRow("routing", feeAmount, config, payerWallet, groupId),
    display: buildDisplay(feeAmount, config.usdcMint, config.cluster),
  }
}

// Re-export so callers can write `Fees.USDC_DECIMALS` etc. if needed.
export { USDC_DECIMALS }
