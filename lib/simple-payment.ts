/**
 * SIMPLE PAYMENT IMPLEMENTATION
 *
 * Direct wallet-to-wallet SOL transfers
 * No multisig, no compression - just basic transfers
 */

import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createFundWiseConnection } from "@/lib/fallback-connection"

export const connection = createFundWiseConnection("confirmed")

/**
 * Pay from user wallet to group wallet
 *
 * PHASE 1: Uses Solana Wallet Adapter (for Phantom, Solflare, etc.)
 * PHASE 2: Will use Privy wallet
 *
 * @param fromWallet - User's wallet adapter (optional for Phase 1)
 * @param fromAddress - User's wallet address (PublicKey string)
 * @param toAddress - Group wallet address (PublicKey string)
 * @param amountSol - Amount in SOL to transfer
 * @returns Transaction signature
 */
export async function payToGroupWallet(
  fromWallet: any, // Wallet object (can be null for Solana Wallet Adapter)
  fromAddress: string,
  toAddress: string,
  amountSol: number
): Promise<{ signature: string }> {
  console.log("🚀 [SimplePayment] Starting payment transaction")
  console.log("[SimplePayment] From:", fromAddress)
  console.log("[SimplePayment] To:", toAddress)
  console.log("[SimplePayment] Amount:", amountSol, "SOL")

  try {
    // Convert addresses to PublicKey
    const fromPubkey = new PublicKey(fromAddress)
    const toPubkey = new PublicKey(toAddress)

    // Convert SOL to lamports
    const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL)

    console.log("[SimplePayment] Lamports:", lamports)

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    })

    // Create transaction
    const transaction = new Transaction().add(transferInstruction)

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey

    console.log("[SimplePayment] ⏳ Sending transaction (wallet popup should appear)...")

    // PHASE 1: Use global Solana Wallet Adapter
    // Get the wallet from window.solana (Phantom, Solflare, etc.)
    let signature: string

    if (typeof window !== 'undefined' && (window as any).solana) {
      const solanaWallet = (window as any).solana
      console.log("[SimplePayment] Using Solana Wallet Adapter (Phantom/Solflare)")

      if (solanaWallet.signAndSendTransaction) {
        // Some wallets support signAndSendTransaction
        const { signature: sig } = await solanaWallet.signAndSendTransaction(transaction)
        signature = sig
      } else if (solanaWallet.signTransaction) {
        // Standard wallet adapter flow
        const signedTx = await solanaWallet.signTransaction(transaction)
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        })
      } else {
        throw new Error("Wallet does not support transaction signing")
      }
    } else if (fromWallet && fromWallet.sendTransaction) {
      // PHASE 2: Privy wallet adapter
      console.log("[SimplePayment] Using Privy wallet")
      signature = await fromWallet.sendTransaction(transaction, connection)
    } else if (fromWallet && fromWallet.signTransaction) {
      // Alternative: sign then send
      console.log("[SimplePayment] Using alternative signing method")
      const signedTx = await fromWallet.signTransaction(transaction)
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })
    } else {
      throw new Error("No wallet found. Please connect your Solana wallet (Phantom, Solflare, etc.)")
    }

    console.log("[SimplePayment] ⏳ Transaction sent:", signature)
    console.log("[SimplePayment] Waiting for confirmation...")

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed")

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`)
    }

    console.log("✅ [SimplePayment] Payment successful!")
    console.log("[SimplePayment] Signature:", signature)
    console.log("[SimplePayment] Explorer:", `https://solscan.io/tx/${signature}?cluster=devnet`)

    return { signature }

  } catch (error: any) {
    console.error("❌ [SimplePayment] Payment failed:", error)

    // Provide helpful error messages
    const errorMessage = error.message || error.toString() || ""
    
    // User cancelled/rejected transaction
    if (errorMessage.includes("User rejected") || 
        errorMessage.includes("user rejected") ||
        errorMessage.includes("rejected the request") ||
        errorMessage.includes("Transaction cancelled") ||
        error.code === 4001) {
      throw new Error("TRANSACTION_CANCELLED")
    }
    
    // Insufficient funds
    if (errorMessage.includes("insufficient") || errorMessage.includes("Insufficient")) {
      throw new Error("Insufficient SOL balance. Please add devnet SOL to your wallet.")
    }

    throw new Error(`Payment failed: ${errorMessage}`)
  }
}

/**
 * Get balance of any wallet
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const publicKey = new PublicKey(address)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error("[SimplePayment] Error fetching balance:", error)
    return 0
  }
}
