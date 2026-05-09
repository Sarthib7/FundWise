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
  Keypair,
} from "@solana/web3.js"
import {
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import * as multisig from "@sqds/multisig"
import { executeStablecoinTransfer } from "@/lib/stablecoin-transfer"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

export const connection = new Connection(SOLANA_RPC_URL, "confirmed")

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

      const createMultisigIx = multisig.instructions.multisigCreate({
        createKey: createKey.publicKey,
        creator,
        multisigPda,
        configAuthority: null,
        threshold: resolvedThreshold,
        members: multisigMembers,
        timeLock: 0,
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
