/**
 * Squads Protocol treasury helpers for FundWise Fund Mode.
 *
 * Treasury funds live in the Squads vault PDA while governance actions target
 * the Squads multisig PDA.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  Keypair,
} from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import * as multisig from "@sqds/multisig"
import { executeStablecoinTransfer } from "@/lib/stablecoin-transfer"
import { createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import type { FundWiseCluster } from "@/lib/solana-cluster"

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

type WalletSigner = {
  sendTransaction?: (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: unknown
  ) => Promise<string>
  signAndSendTransaction?: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<string | { signature: string }>
  signTransaction?: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<Transaction | VersionedTransaction>
}

async function sendWalletTransaction(
  wallet: WalletSigner,
  transaction: Transaction | VersionedTransaction,
  blockhash: string,
  lastValidBlockHeight: number
) {
  let signature: string

  if (wallet.sendTransaction) {
    signature = await wallet.sendTransaction(transaction, connection)
  } else if (wallet.signAndSendTransaction) {
    const result = await wallet.signAndSendTransaction(transaction)
    signature = typeof result === "string" ? result : result.signature
  } else if (wallet.signTransaction) {
    const signed = await wallet.signTransaction(transaction)
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    })
  } else {
    throw new Error("Wallet does not support transaction signing")
  }

  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, "confirmed")

  if (confirmation.value.err) {
    throw new Error("Squads transaction failed: " + JSON.stringify(confirmation.value.err))
  }

  return signature
}

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
    const { PublicKey } = await import("@solana/web3.js")
    const { LAMPORTS_PER_SOL } = await import("@solana/web3.js")
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
 * Create a new Squads multisig for a group
 * This is the group's treasury where all funds are collected
 *
 * For MVP: creates the Squads multisig and its first vault PDA on-chain.
 */
export async function createSquadsMultisig(
  creator: PublicKey,
  groupName: string,
  members: PublicKey[] = [],
  threshold: number = 1,
  wallet?: any // Optional wallet for on-chain initialization
): Promise<{ multisigPDA: PublicKey; vaultPDA: PublicKey; signature: string }> {
  try {
    console.log("[Squads] Creating multisig for group:", groupName)
    console.log("[Squads] Creator:", creator.toString())
    console.log("[Squads] Initial members:", members.length)

    // Squads requires createKey to sign the creation transaction.
    const createKey = Keypair.generate()

    // Derive multisig PDA
    const [multisigPda] = multisig.getMultisigPda({
      createKey: createKey.publicKey,
    })

    console.log("[Squads] Multisig PDA:", multisigPda.toString())

    // Derive vault PDA (index 0)
    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    })

    console.log("[Squads] Vault PDA:", vaultPda.toString())

    const uniqueMembers = Array.from(
      new Set([creator.toString(), ...members.map((member) => member.toString())])
    ).map((member) => new PublicKey(member))

    const multisigMembers = uniqueMembers.map((member) => ({
      key: member,
      permissions: multisig.types.Permissions.all(),
    }))

    if (threshold < 1) {
      throw new Error("Approval threshold must be at least 1")
    }

    if (threshold > multisigMembers.length) {
      throw new Error(
        `Approval threshold ${threshold} exceeds current member count ${multisigMembers.length}`
      )
    }

    const resolvedThreshold = threshold

    console.log(`[Squads] Configuring ${resolvedThreshold}/${multisigMembers.length} multisig`)

    // If wallet is provided, actually create the multisig on-chain
    if (wallet) {
      console.log("[Squads] Creating multisig on-chain...")

      const [programConfigPda] = multisig.getProgramConfigPda({})
      const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
        connection,
        programConfigPda
      )
      const createMultisigIx = multisig.instructions.multisigCreateV2({
        treasury: programConfig.treasury,
        createKey: createKey.publicKey,
        creator,
        multisigPda,
        configAuthority: null,
        threshold: resolvedThreshold,
        members: multisigMembers,
        timeLock: 0,
        rentCollector: null,
      })

      const tx = new Transaction().add(createMultisigIx)

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
      tx.recentBlockhash = blockhash
      tx.feePayer = creator

      console.log("[Squads] 🎉 WALLET POPUP WILL APPEAR - Please approve multisig creation")

      let signature: string

      if (wallet.sendTransaction) {
        signature = await wallet.sendTransaction(tx, connection, {
          signers: [createKey],
        })
      } else {
        tx.partialSign(createKey)
        const signedTx = await wallet.signTransaction(tx)
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        })
      }

      console.log("[Squads] Waiting for confirmation...")

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, "confirmed")

      if (confirmation.value.err) {
        throw new Error("Multisig creation failed: " + JSON.stringify(confirmation.value.err))
      }

      console.log("[Squads] ✅ Multisig created on-chain!")
      console.log("[Squads] Transaction:", signature)
      console.log("[Squads] Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

      return {
        multisigPDA: multisigPda,
        vaultPDA: vaultPda,
        signature,
      }
    }

    // If no wallet provided, just return the PDAs (for offline/testing)
    console.log("[Squads] ℹ️  No wallet provided - returning PDAs only")
    console.log("[Squads] ⚠️  Multisig NOT initialized on-chain")
    console.log("[Squads] Vault address can still receive payments")

    return {
      multisigPDA: multisigPda,
      vaultPDA: vaultPda,
      signature: `multisig_pda_only_${Date.now()}`,
    }
  } catch (error) {
    console.error("[Squads] Error creating multisig:", error)
    throw new Error("Failed to create Squads multisig: " + (error instanceof Error ? error.message : String(error)))
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

export async function createSquadsReimbursementProposal(
  wallet: WalletSigner,
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
  const creator = new PublicKey(creatorAddress)
  const multisigPda = new PublicKey(multisigAddress)
  const treasuryPda = new PublicKey(treasuryAddress)
  const recipient = new PublicKey(recipientAddress)
  const mint = new PublicKey(mintAddress)

  const [expectedTreasuryPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  })

  if (!treasuryPda.equals(expectedTreasuryPda)) {
    throw new Error("Treasury address does not match the Squads vault PDA")
  }

  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda
  )
  const nextTransactionIndex = BigInt(Number(multisigInfo.transactionIndex) + 1)
  const [proposalPda] = multisig.getProposalPda({
    multisigPda,
    transactionIndex: nextTransactionIndex,
  })
  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: nextTransactionIndex,
  })

  const treasuryAta = await getAssociatedTokenAddress(mint, treasuryPda, true)
  const recipientAta = await getAssociatedTokenAddress(mint, recipient)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const transaction = new Transaction()

  try {
    await getAccount(connection, recipientAta)
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(creator, recipientAta, recipient, mint)
    )
  }

  const transferInstruction = createTransferInstruction(
    treasuryAta,
    recipientAta,
    treasuryPda,
    BigInt(amount)
  )

  transaction.add(
    multisig.instructions.vaultTransactionCreate({
      multisigPda,
      transactionIndex: nextTransactionIndex,
      creator,
      rentPayer: creator,
      vaultIndex: 0,
      ephemeralSigners: 0,
      transactionMessage: new TransactionMessage({
        payerKey: treasuryPda,
        recentBlockhash: blockhash,
        instructions: [transferInstruction],
      }),
    }),
    multisig.instructions.proposalCreate({
      multisigPda,
      transactionIndex: nextTransactionIndex,
      creator,
      isDraft: false,
    })
  )

  transaction.recentBlockhash = blockhash
  transaction.feePayer = creator

  const signature = await sendWalletTransaction(
    wallet,
    transaction,
    blockhash,
    lastValidBlockHeight
  )

  return {
    signature,
    transactionIndex: Number(nextTransactionIndex),
    proposalAddress: proposalPda.toString(),
    transactionAddress: transactionPda.toString(),
  }
}

export async function reviewSquadsProposal(
  wallet: WalletSigner,
  memberAddress: string,
  multisigAddress: string,
  transactionIndex: number,
  decision: "approved" | "rejected"
): Promise<{ signature: string }> {
  const member = new PublicKey(memberAddress)
  const multisigPda = new PublicKey(multisigAddress)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const instruction =
    decision === "approved"
      ? multisig.instructions.proposalApprove({
          multisigPda,
          transactionIndex: BigInt(transactionIndex),
          member,
        })
      : multisig.instructions.proposalReject({
          multisigPda,
          transactionIndex: BigInt(transactionIndex),
          member,
        })

  const transaction = new Transaction().add(instruction)
  transaction.recentBlockhash = blockhash
  transaction.feePayer = member

  const signature = await sendWalletTransaction(
    wallet,
    transaction,
    blockhash,
    lastValidBlockHeight
  )

  return { signature }
}

export async function executeSquadsReimbursementProposal(
  wallet: WalletSigner,
  memberAddress: string,
  multisigAddress: string,
  transactionIndex: number
): Promise<{ signature: string }> {
  const member = new PublicKey(memberAddress)
  const multisigPda = new PublicKey(multisigAddress)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const transaction = await multisig.transactions.vaultTransactionExecute({
    connection,
    blockhash,
    feePayer: member,
    multisigPda,
    transactionIndex: BigInt(transactionIndex),
    member,
  })

  const signature = await sendWalletTransaction(
    wallet,
    transaction,
    blockhash,
    lastValidBlockHeight
  )

  return { signature }
}
