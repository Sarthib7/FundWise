/**
 * Squads Protocol Multisig Integration for FundFlow
 *
 * Flow:
 * 1. Pay: User wallet → Squads multisig vault
 * 2. Later: Multisig → Pool (with compression)
 * 3. Withdraw: Pool → Multisig → User wallet (with decompression)
 */

import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

export const connection = new Connection(SOLANA_RPC_URL, "confirmed")

/**
 * Create a new Squads multisig for a group
 * This is the group's treasury where all funds are collected
 */
export async function createSquadsMultisig(
  creator: PublicKey,
  groupName: string,
  members: PublicKey[] = []
): Promise<{ multisigPDA: PublicKey; vaultPDA: PublicKey; signature: string }> {
  try {
    console.log("[Squads] Creating multisig for group:", groupName)
    console.log("[Squads] Creator:", creator.toString())
    console.log("[Squads] Initial members:", members.length)

    // Generate unique multisig seed
    const createKey = PublicKey.unique()

    // Derive multisig PDA
    const [multisigPda] = multisig.getMultisigPda({
      createKey,
    })

    console.log("[Squads] Multisig PDA:", multisigPda.toString())

    // Derive vault PDA (index 0)
    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    })

    console.log("[Squads] Vault PDA:", vaultPda.toString())

    // For devnet testing, we'll use a simpler approach
    // In production, you'd create the actual multisig transaction

    // Store these addresses for the group
    return {
      multisigPDA: multisigPda,
      vaultPDA: vaultPda,
      signature: `multisig_created_${Date.now()}`, // Mock signature for now
    }
  } catch (error) {
    console.error("[Squads] Error creating multisig:", error)
    throw new Error("Failed to create Squads multisig: " + (error instanceof Error ? error.message : String(error)))
  }
}

/**
 * Transfer SOL from user wallet to group's Squads vault
 * This is called when user clicks "Pay" button
 *
 * Uses simple SystemProgram.transfer() to trigger wallet signing popup
 */
export async function payToSquadsVault(
  wallet: any, // Privy wallet
  vaultAddress: PublicKey,
  amount: number // in lamports
): Promise<{ signature: string }> {
  try {
    console.log("[Squads Pay] Initiating payment to vault...")
    console.log("[Squads Pay] From:", wallet.address)
    console.log("[Squads Pay] To (Vault):", vaultAddress.toString())
    console.log("[Squads Pay] Amount:", amount, "lamports (", amount / LAMPORTS_PER_SOL, "SOL )")

    // Create simple transfer transaction
    const transaction = new Transaction()

    // Add transfer instruction (this is the actual payment)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.address),
        toPubkey: vaultAddress,
        lamports: amount,
      })
    )

    console.log("[Squads Pay] Transaction created with SystemProgram.transfer()")

    // Get recent blockhash and set fee payer
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(wallet.address)

    console.log("[Squads Pay] Requesting wallet to sign transaction...")
    console.log("[Squads Pay] 🎉 WALLET POPUP SHOULD APPEAR NOW!")

    // Use sendTransaction which triggers the wallet popup for signing
    // This is the key method that shows the signing prompt
    let signature: string

    if (wallet.sendTransaction) {
      // If wallet has sendTransaction method, use it (triggers popup automatically)
      console.log("[Squads Pay] Using wallet.sendTransaction() - popup will show")
      signature = await wallet.sendTransaction(transaction, connection)
      console.log("[Squads Pay] Transaction sent! Signature:", signature)
    } else {
      // Fallback: sign then send
      console.log("[Squads Pay] Using wallet.signTransaction() - popup will show")
      const signedTransaction = await wallet.signTransaction(transaction)
      console.log("[Squads Pay] Transaction signed, broadcasting...")
      signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed"
      })
      console.log("[Squads Pay] Transaction sent! Signature:", signature)
    }

    console.log("[Squads Pay] Waiting for confirmation...")

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed")

    if (confirmation.value.err) {
      throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err))
    }

    console.log("[Squads Pay] ✅ Payment confirmed!")
    console.log("[Squads Pay] Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    return { signature }
  } catch (error) {
    console.error("[Squads Pay] ❌ Error:", error)

    // Provide more detailed error messages
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error("Transaction cancelled by user")
      }
      if (error.message.includes('Insufficient funds')) {
        throw new Error("Insufficient SOL balance. Please add devnet SOL to your wallet.")
      }
    }

    throw new Error("Failed to pay to Squads vault: " + (error instanceof Error ? error.message : String(error)))
  }
}

/**
 * Withdraw from Squads vault to user wallet
 * This is called when user clicks "Withdraw" button
 *
 * Note: This requires multisig approval in production
 * For devnet testing, we're using a simplified flow
 */
export async function withdrawFromSquadsVault(
  wallet: any, // Privy wallet
  vaultAddress: PublicKey,
  amount: number // in lamports
): Promise<{ signature: string }> {
  try {
    console.log("[Squads Withdraw] Initiating withdrawal from vault...")
    console.log("[Squads Withdraw] From (Vault):", vaultAddress.toString())
    console.log("[Squads Withdraw] To:", wallet.address)
    console.log("[Squads Withdraw] Amount:", amount, "lamports (", amount / LAMPORTS_PER_SOL, "SOL )")

    // In production, this would:
    // 1. Create a proposal transaction
    // 2. Get multisig member approvals
    // 3. Execute when threshold reached

    // For devnet testing with direct vault control:
    // We'll simulate the withdrawal by creating a proposal

    console.log("[Squads Withdraw] Note: In production, this requires multisig approval")
    console.log("[Squads Withdraw] For testing, simulating withdrawal...")

    // Mock signature for now - in production you'd execute the multisig transaction
    const signature = `withdrawal_${Date.now()}_${amount}`

    console.log("[Squads Withdraw] ✅ Withdrawal initiated!")
    console.log("[Squads Withdraw] Signature:", signature)

    return { signature }
  } catch (error) {
    console.error("[Squads Withdraw] ❌ Error:", error)
    throw new Error("Failed to withdraw from Squads vault: " + (error instanceof Error ? error.message : String(error)))
  }
}

/**
 * Get vault balance
 */
export async function getVaultBalance(vaultAddress: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(vaultAddress)
    console.log("[Squads] Vault balance:", balance, "lamports (", balance / LAMPORTS_PER_SOL, "SOL )")
    return balance
  } catch (error) {
    console.error("[Squads] Error getting vault balance:", error)
    return 0
  }
}

/**
 * Utility: Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

/**
 * Utility: Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}
