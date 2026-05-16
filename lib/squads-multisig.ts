/**
 * Transitional re-export shim for the Squads governance Module.
 *
 * The wallet-signed Squads ops moved into `lib/squads/governance.ts` per
 * ADR-0035; the verify helpers moved into `lib/squads/lifecycle.ts`. This
 * file keeps the legacy export names (`createSquadsMultisig`,
 * `createSquadsReimbursementProposal`, `reviewSquadsProposal`,
 * `executeSquadsReimbursementProposal`) wired up so existing callers
 * continue working unchanged. Squads PR3 deletes this file once callers
 * migrate to `@/lib/squads`.
 *
 * Non-governance helpers used by `hooks/use-group-dashboard.ts`
 * (`contributeStablecoinToTreasury`, `readTreasuryInitReadiness`,
 * `getTreasuryStablecoinBalance`) and the constants
 * (`FUND_MODE_CLUSTER`, `connection`, `TREASURY_INIT_SOL_ESTIMATE`) still
 * live here. They are out of scope for the Squads Module — Squads owns the
 * governance plumbing, not generic SPL-token transfers or treasury reads.
 */

import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import {
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import { executeStablecoinTransfer } from "@/lib/stablecoin-transfer"
import { createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import type { FundWiseCluster } from "@/lib/solana-cluster"
import {
  createMultisig,
  execute as squadsExecute,
  proposeReimbursement,
  review as squadsReview,
  type WalletSigner,
} from "@/lib/squads/governance"

// Fund Mode cluster is env-driven so the same Squads helpers can target
// mainnet once the beta graduates without recompiling anything.
function getFundModeCluster(): FundWiseCluster {
  const raw =
    (typeof process !== "undefined" && process.env
      ? process.env.NEXT_PUBLIC_FUNDWISE_FUND_MODE_CLUSTER ??
        process.env.FUNDWISE_FUND_MODE_CLUSTER ??
        ""
      : ""
    )
      .trim()
      .toLowerCase()
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta"
  if (raw === "custom") return "custom"
  return "devnet"
}

export const FUND_MODE_CLUSTER: FundWiseCluster = getFundModeCluster()
export const connection = createFundWiseConnectionForCluster(FUND_MODE_CLUSTER, "confirmed")

/**
 * Approximate SOL cost to create a new Squads v4 multisig + vault PDA on
 * devnet, based on observed rehearsals on 2026-05-10:
 *   - Multisig account rent: ~0.014 SOL
 *   - First vault PDA rent: ~0.002 SOL
 *   - Tx fees + signature: ~0.001 SOL
 * Total is rounded up so the UI never under-quotes a Member who is about to
 * sign a Treasury initialization that will fail mid-flow on insufficient SOL.
 */
export const TREASURY_INIT_SOL_ESTIMATE = 0.02

export type TreasuryReadinessCheck = {
  walletSolBalance: number
  estimatedTreasurySol: number
  hasEnoughSol: boolean
  shortfallSol: number
}

export async function readTreasuryInitReadiness(
  walletAddress: string
): Promise<TreasuryReadinessCheck> {
  try {
    const pubkey = new PublicKey(walletAddress)
    const lamports = await connection.getBalance(pubkey, "confirmed")
    const walletSolBalance = lamports / LAMPORTS_PER_SOL
    const shortfallSol = Math.max(0, TREASURY_INIT_SOL_ESTIMATE - walletSolBalance)
    return {
      walletSolBalance,
      estimatedTreasurySol: TREASURY_INIT_SOL_ESTIMATE,
      hasEnoughSol: walletSolBalance >= TREASURY_INIT_SOL_ESTIMATE,
      shortfallSol,
    }
  } catch {
    return {
      walletSolBalance: 0,
      estimatedTreasurySol: TREASURY_INIT_SOL_ESTIMATE,
      hasEnoughSol: false,
      shortfallSol: TREASURY_INIT_SOL_ESTIMATE,
    }
  }
}

/**
 * Legacy wrapper around `Squads.createMultisig`. Preserves the original
 * positional signature so existing callers (and PR3-targeted call sites)
 * keep working without touching the call. The `groupName` argument is
 * still accepted for log compatibility; the `wallet` argument remains
 * optional so PDAs-only mode keeps working for offline/testing flows.
 */
export async function createSquadsMultisig(
  creator: PublicKey,
  groupName: string,
  members: PublicKey[] = [],
  threshold: number = 1,
  // Legacy callers pass wallet-adapter objects that satisfy `WalletSigner`
  // structurally. The optional `any` is kept for backward compatibility so
  // browser-side dynamic imports keep their loose typing.
  wallet?: any
): Promise<{ multisigPDA: PublicKey; vaultPDA: PublicKey; signature: string }> {
  console.log("[Squads] Creating multisig for group:", groupName)

  if (wallet) {
    const signer: WalletSigner = wallet as WalletSigner
    if (!signer.publicKey) {
      // Some wallet-adapter shapes expose `publicKey` only after connect.
      // The original implementation relied on `creator` for `feePayer`, so
      // we forward `creator` as the signer's public key when the wallet
      // object does not surface its own.
      signer.publicKey = creator
    }
    const result = await createMultisig({
      signer,
      threshold,
      members,
    })
    return {
      multisigPDA: result.multisigPda,
      vaultPDA: result.treasuryPda,
      signature: result.signature,
    }
  }

  // PDAs-only fallback used by offline/test flows: derive the addresses
  // and return a synthetic signature so the caller can persist the
  // addresses without a real on-chain initialization.
  const { deriveMultisigAddresses } = await import("@/lib/squads/governance")
  const { multisigPda, treasuryPda } = deriveMultisigAddresses({
    creator,
    threshold,
    members,
  })

  console.log("[Squads] Multisig PDA:", multisigPda.toString())
  console.log("[Squads] Vault PDA:", treasuryPda.toString())
  console.log("[Squads] ℹ️  No wallet provided - returning PDAs only")
  console.log("[Squads] ⚠️  Multisig NOT initialized on-chain")
  console.log("[Squads] Vault address can still receive payments")

  return {
    multisigPDA: multisigPda,
    vaultPDA: treasuryPda,
    signature: `multisig_pda_only_${Date.now()}`,
  }
}

export async function contributeStablecoinToTreasury(
  wallet: any,
  contributorAddress: string,
  treasuryAddress: string,
  mintAddress: string,
  amount: number
): Promise<{ signature: string }> {
  const { signature } = await executeStablecoinTransfer(wallet, {
    fromAddress: contributorAddress,
    toAddress: treasuryAddress,
    mintAddress,
    amount,
    recipientOwnerOffCurve: true,
    cluster: FUND_MODE_CLUSTER,
  })

  return { signature }
}

export async function getTreasuryStablecoinBalance(
  treasuryAddress: string,
  mintAddress: string
): Promise<number> {
  try {
    const treasuryPubkey = new PublicKey(treasuryAddress)
    const mintPubkey = new PublicKey(mintAddress)
    const treasuryAta = await getAssociatedTokenAddress(mintPubkey, treasuryPubkey, true)
    const account = await getAccount(connection, treasuryAta)
    return Number(account.amount)
  } catch {
    return 0
  }
}

// Browser wallets reach here through `getSigningWallet(wallet?.adapter)` and
// can be loosely typed as `unknown` at the call site. The shim accepts that
// looseness and forces the wallet object's `publicKey` to the caller-supplied
// address so the new `WalletSigner` contract is satisfied without touching
// the caller code paths.
function adaptLegacyWallet(wallet: unknown, fallbackPublicKey: PublicKey): WalletSigner {
  const signer = wallet as WalletSigner
  if (!signer.publicKey) {
    signer.publicKey = fallbackPublicKey
  }
  return signer
}

/**
 * Legacy wrapper around `Squads.proposeReimbursement`. Translates the old
 * positional, all-string-addresses signature into the named-argument
 * Module Interface. The `wallet` parameter stays loosely typed so legacy
 * browser callers that thread `unknown` wallets through dynamic imports
 * keep compiling without modification.
 */
export async function createSquadsReimbursementProposal(
  wallet: unknown,
  creatorAddress: string,
  multisigAddress: string,
  treasuryAddress: string,
  recipientAddress: string,
  mintAddress: string,
  amount: number
): Promise<{
  signature: string
  transactionIndex: number
  proposalAddress: string
  transactionAddress: string
}> {
  return proposeReimbursement({
    signer: adaptLegacyWallet(wallet, new PublicKey(creatorAddress)),
    multisigAddress,
    treasuryAddress,
    recipient: new PublicKey(recipientAddress),
    amount: BigInt(amount),
    mint: new PublicKey(mintAddress),
  })
}

/**
 * Legacy wrapper around `Squads.review`. Translates the positional
 * signature into the named-argument Module Interface.
 */
export async function reviewSquadsProposal(
  wallet: unknown,
  memberAddress: string,
  multisigAddress: string,
  transactionIndex: number,
  decision: "approved" | "rejected"
): Promise<{ signature: string }> {
  return squadsReview({
    signer: adaptLegacyWallet(wallet, new PublicKey(memberAddress)),
    multisigAddress,
    transactionIndex,
    decision,
  })
}

/**
 * Legacy wrapper around `Squads.execute`. Translates the positional
 * signature into the named-argument Module Interface.
 */
export async function executeSquadsReimbursementProposal(
  wallet: unknown,
  memberAddress: string,
  multisigAddress: string,
  transactionIndex: number
): Promise<{ signature: string }> {
  return squadsExecute({
    signer: adaptLegacyWallet(wallet, new PublicKey(memberAddress)),
    multisigAddress,
    transactionIndex,
  })
}
