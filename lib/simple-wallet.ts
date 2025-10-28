/**
 * SIMPLE WALLET GENERATION FOR GROUPS
 *
 * This is the BASIC implementation - no multisig, no compression
 * Just generates a new Solana wallet for each group
 */

import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
export const connection = new Connection(SOLANA_RPC_URL, "confirmed")

/**
 * Generate a new wallet for a group
 * Returns the public key (address) to store in the database
 *
 * NOTE: We only store the PUBLIC KEY, not the private key
 * This means the group wallet can RECEIVE funds but cannot SEND
 * For withdrawals, we'll implement multisig later
 */
export function generateGroupWallet(): { address: string } {
  const keypair = Keypair.generate()

  console.log("[SimpleWallet] Generated new group wallet")
  console.log("[SimpleWallet] Address:", keypair.publicKey.toString())

  return {
    address: keypair.publicKey.toString()
  }
}

/**
 * Get the balance of a group wallet
 */
export async function getGroupBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    const solBalance = balance / LAMPORTS_PER_SOL

    console.log("[SimpleWallet] Balance for", walletAddress, ":", solBalance, "SOL")

    return solBalance
  } catch (error) {
    console.error("[SimpleWallet] Error fetching balance:", error)
    return 0
  }
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}
