import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { saveGroup, getGroup, addMemberToGroup } from "./group-storage"
import {
  saveGroupToFirebase,
  getGroupFromFirebase,
  addMemberToGroupInFirebase,
  addContributionToGroupInFirebase
} from "./firebase-group-storage"
import { createGroupOnChain, solToLamports as convertSolToLamports, lamportsToSol as convertLamportsToSol } from "./solana-program"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"

export const connection = new Connection(SOLANA_RPC_URL, "confirmed")

export interface GroupData {
  id: string
  name: string
  creator: string
  recurringPeriod: string
  amountPerRecurrence: number
  riskLevel: string
  totalDuration: string
  fundingGoal: number // USDC target amount
  isPublic: boolean // Added isPublic field for group visibility
  createdAt: string
  members: string[]
  totalCollected: number
  onChainAddress?: string // On-chain group pool PDA address
}

export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}

export function generateGroupCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createGroup(
  creatorPublicKey: string,
  groupData: Omit<GroupData, "id" | "createdAt" | "members" | "totalCollected" | "onChainAddress">,
  wallet: any // Privy wallet for signing transactions
): Promise<{ groupId: string; signature: string; onChainAddress: string }> {
  try {
    console.log("[FundFlow] Creating group on Solana...")
    console.log("[FundFlow] Creator:", creatorPublicKey)
    console.log("[FundFlow] Group data:", groupData)
    console.log("[FundFlow] Funding goal:", groupData.fundingGoal, "SOL")
    console.log("[FundFlow] Visibility:", groupData.isPublic ? "Public" : "Private")

    const groupId = generateGroupCode()

    // Create wallet adapter for Anchor
    const walletAdapter = {
      publicKey: new PublicKey(creatorPublicKey),
      signTransaction: async (tx: any) => {
        const signedTx = await wallet.signTransaction(tx)
        return signedTx
      },
      signAllTransactions: async (txs: any[]) => {
        const signedTxs = await wallet.signAllTransactions(txs)
        return signedTxs
      },
    }

    // Map payment schedule
    const paymentScheduleMap: Record<string, "weekly" | "monthly" | "quarterly" | "oneTime"> = {
      "weekly": "weekly",
      "biweekly": "weekly", // Map biweekly to weekly for now
      "monthly": "monthly",
      "quarterly": "quarterly",
      "daily": "weekly", // Map daily to weekly for now
    }

    // Create group on-chain
    const { groupPoolPDA, signature } = await createGroupOnChain(walletAdapter, {
      name: groupData.name,
      fundraisingTarget: convertSolToLamports(groupData.fundingGoal), // Convert SOL to lamports
      paymentSchedule: paymentScheduleMap[groupData.recurringPeriod] || "weekly",
      contributionAmount: convertSolToLamports(groupData.amountPerRecurrence), // Convert SOL to lamports
      allocationStrategy: "fullyCompressed" // Default to fully compressed
    })

    console.log("[FundFlow] On-chain group created!")
    console.log("[FundFlow] Group Pool PDA:", groupPoolPDA.toString())
    console.log("[FundFlow] Transaction:", signature)

    const completeGroupData: GroupData = {
      ...groupData,
      id: groupId,
      createdAt: new Date().toISOString(),
      members: [creatorPublicKey],
      totalCollected: 0,
      onChainAddress: groupPoolPDA.toString(), // Store on-chain address
    }

    // Save to localStorage
    saveGroup(completeGroupData)
    console.log("[FundFlow] Group saved to localStorage successfully")

    // Try to save to Firebase
    try {
      await saveGroupToFirebase(completeGroupData)
      console.log("[FundFlow] Group also saved to Firebase successfully")
    } catch (firebaseError) {
      console.warn("[FundFlow] Failed to save to Firebase, using localStorage only:", firebaseError)
    }

    console.log("[FundFlow] Group created successfully with ID:", groupId)

    return {
      groupId,
      signature,
      onChainAddress: groupPoolPDA.toString(),
    }
  } catch (error) {
    console.error("[FundFlow] Error creating group:", error)
    throw new Error("Failed to create group on Solana: " + (error instanceof Error ? error.message : String(error)))
  }
}

export async function joinGroup(
  memberPublicKey: string,
  groupId: string,
  joiningTipAmount = 10, // $10 USDC tip
): Promise<{ signature: string }> {
  try {
    console.log("[FundFlow] Joining group on Solana...")
    console.log("[FundFlow] Member:", memberPublicKey)
    console.log("[FundFlow] Group ID:", groupId)
    console.log("[FundFlow] Joining tip:", joiningTipAmount, "USDC")

    const group = getGroup(groupId)
    if (!group) {
      throw new Error("Group not found")
    }

    // Add member to both localStorage (fallback) and Firebase
    addMemberToGroup(groupId, memberPublicKey)
    
            try {
              await addMemberToGroupInFirebase(groupId, memberPublicKey)
              console.log("[FundFlow] Member added to Firebase Realtime Database successfully")
            } catch (firebaseError) {
              console.warn("[FundFlow] Failed to add member to Firebase, using localStorage only:", firebaseError)
            }
    
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[FundFlow] Successfully joined group:", groupId)

    return {
      signature: "mock_signature_join_" + Date.now(),
    }
  } catch (error) {
    console.error("[FundFlow] Error joining group:", error)
    throw new Error("Failed to join group")
  }
}

export async function joinGroupWithTip(
  memberPublicKey: string,
  groupTreasuryAddress: PublicKey,
  tipAmount: number,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
): Promise<{ signature: string }> {
  try {
    console.log("[FundFlow] Joining group with tip...")
    console.log("[FundFlow] Member:", memberPublicKey)
    console.log("[FundFlow] Treasury:", groupTreasuryAddress.toString())
    console.log("[FundFlow] Tip amount:", tipAmount, "USDC")

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(memberPublicKey),
        toPubkey: groupTreasuryAddress,
        lamports: solToLamports(tipAmount * 0.01), // Convert USDC to SOL equivalent (mock conversion)
      }),
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(memberPublicKey)

    const signedTransaction = await signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signedTransaction.serialize())
    await connection.confirmTransaction(signature, "confirmed")

    console.log("[FundFlow] Join with tip successful:", signature)

    return { signature }
  } catch (error) {
    console.error("[FundFlow] Error joining group with tip:", error)
    throw new Error("Failed to join group with tip")
  }
}

export async function contributeToGroup(
  memberPublicKey: string,
  groupTreasuryAddress: PublicKey,
  amount: number,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
): Promise<{ signature: string }> {
  try {
    console.log("[FundFlow] Contributing to group...")
    console.log("[FundFlow] From:", memberPublicKey)
    console.log("[FundFlow] To:", groupTreasuryAddress.toString())
    console.log("[FundFlow] Amount:", amount, "USDC")

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(memberPublicKey),
        toPubkey: groupTreasuryAddress,
        lamports: solToLamports(amount * 0.01), // Convert USDC to SOL equivalent (mock conversion)
      }),
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(memberPublicKey)

    const signedTransaction = await signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signedTransaction.serialize())
    await connection.confirmTransaction(signature, "confirmed")

            // Add contribution to Firebase Realtime Database
            try {
              await addContributionToGroupInFirebase(groupTreasuryAddress.toString(), amount)
              console.log("[FundFlow] Contribution added to Firebase Realtime Database successfully")
            } catch (firebaseError) {
              console.warn("[FundFlow] Failed to add contribution to Firebase:", firebaseError)
            }

    console.log("[FundFlow] Contribution successful:", signature)

    return { signature }
  } catch (error) {
    console.error("[FundFlow] Error contributing to group:", error)
    throw new Error("Failed to contribute to group")
  }
}

export async function getGroupBalance(treasuryAddress: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(treasuryAddress)
    return lamportsToSol(balance)
  } catch (error) {
    console.error("[FundFlow] Error fetching group balance:", error)
    return 0
  }
}

export async function fetchGroupData(groupId: string): Promise<GroupData | null> {
  try {
    console.log("[FundFlow] Fetching group data for:", groupId)

            // Try Firebase Realtime Database first, fallback to localStorage
            try {
              const firebaseGroup = await getGroupFromFirebase(groupId)
              if (firebaseGroup) {
                console.log("[FundFlow] Group found in Firebase Realtime Database:", firebaseGroup)
                return firebaseGroup
              }
            } catch (firebaseError) {
              console.warn("[FundFlow] Failed to fetch from Firebase, trying localStorage:", firebaseError)
            }

    // Fallback to localStorage
    const group = getGroup(groupId)

    if (group) {
      console.log("[FundFlow] Group found in localStorage:", group)
      return group
    }

    console.log("[FundFlow] Group not found in storage")
    return null

  } catch (error) {
    console.error("[FundFlow] Error fetching group data:", error)
    return null
  }
}
