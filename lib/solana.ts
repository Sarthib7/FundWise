import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { saveGroup, getGroup, addMemberToGroup } from "./group-storage"
import {
  saveGroupToFirebase,
  getGroupFromFirebase,
  addMemberToGroupInFirebase,
  addContributionToGroupInFirebase
} from "./firebase-group-storage"
import { createGroupOnChain, solToLamports as convertSolToLamports, lamportsToSol as convertLamportsToSol } from "./solana-program"
import { createSquadsMultisig } from "./squads-multisig"

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
  fundingGoal: number // SOL target amount
  isPublic: boolean // Added isPublic field for group visibility
  createdAt: string
  members: string[]
  totalCollected: number
  onChainAddress?: string // On-chain group pool PDA address
  squadsVaultAddress?: string // Squads multisig vault address (where funds are collected)
  squadsMultisigAddress?: string // Squads multisig PDA address
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
  groupData: Omit<GroupData, "id" | "createdAt" | "members" | "totalCollected" | "onChainAddress" | "squadsVaultAddress" | "squadsMultisigAddress">,
  wallet: any // Privy wallet for signing transactions
): Promise<{ groupId: string; signature: string; onChainAddress: string; squadsVaultAddress: string }> {
  try {
    console.log("[FundFlow] Creating group on Solana...")
    console.log("[FundFlow] Creator wallet address (raw):", creatorPublicKey)
    console.log("[FundFlow] Creator wallet type:", typeof creatorPublicKey)
    console.log("[FundFlow] Creator wallet length:", creatorPublicKey?.length)
    console.log("[FundFlow] Wallet object:", wallet)
    console.log("[FundFlow] Wallet.address:", wallet?.address)
    console.log("[FundFlow] Group data:", groupData)
    console.log("[FundFlow] Funding goal:", groupData.fundingGoal, "SOL")
    console.log("[FundFlow] Visibility:", groupData.isPublic ? "Public" : "Private")

    // Validate wallet address
    if (!creatorPublicKey || typeof creatorPublicKey !== 'string') {
      throw new Error("Invalid wallet address: address is empty or not a string")
    }

    // Check if it's an Ethereum address
    if (creatorPublicKey.startsWith("0x")) {
      throw new Error(
        "❌ Wrong wallet type!\n\n" +
        "This is an Ethereum address (starts with 0x), but we need a Solana address.\n\n" +
        "Please connect a Solana wallet (Phantom, Solflare, etc.) and try again."
      )
    }

    if (creatorPublicKey.length < 32 || creatorPublicKey.length > 44) {
      throw new Error(`Invalid wallet address length: ${creatorPublicKey.length}. Expected 32-44 characters. Address: ${creatorPublicKey}`)
    }

    // Check for non-base58 characters
    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    // Excludes: 0 (zero), O (capital o), I (capital i), l (lowercase L)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    if (!base58Regex.test(creatorPublicKey)) {
      // Find the invalid characters for better error message
      const invalidChars = creatorPublicKey.split('').filter(char => !'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.includes(char))
      throw new Error(
        `Invalid Solana address format!\n\n` +
        `The address contains invalid characters: ${[...new Set(invalidChars)].join(', ')}\n\n` +
        `Solana addresses use base58 encoding (no 0, O, I, or l characters).\n\n` +
        `Address provided: ${creatorPublicKey}`
      )
    }

    console.log("[FundFlow] ✅ Wallet address validation passed")

    const groupId = generateGroupCode()
    console.log("[FundFlow] Generated group ID:", groupId)

    // Step 1: Create Squads multisig vault for the group
    console.log("[FundFlow] Step 1: Creating Squads multisig vault...")
    let multisigPDA: PublicKey
    let vaultPDA: PublicKey

    try {
      console.log("[FundFlow] Converting wallet address to PublicKey...")
      let creatorPubKey: PublicKey

      try {
        creatorPubKey = new PublicKey(creatorPublicKey)
        console.log("[FundFlow] ✅ PublicKey created successfully:", creatorPubKey.toString())
      } catch (pubKeyError) {
        console.error("[FundFlow] ❌ Failed to create PublicKey:", pubKeyError)
        throw new Error(`Invalid Solana address format: ${creatorPublicKey}. Error: ${pubKeyError instanceof Error ? pubKeyError.message : String(pubKeyError)}`)
      }

      console.log("[FundFlow] Calling createSquadsMultisig...")
      const result = await createSquadsMultisig(
        creatorPubKey,
        groupData.name,
        [] // Initial members - can be added later
      )
      multisigPDA = result.multisigPDA
      vaultPDA = result.vaultPDA

      console.log("[FundFlow] ✅ Squads vault created!")
      console.log("[FundFlow]    Multisig:", multisigPDA.toString())
      console.log("[FundFlow]    Vault:", vaultPDA.toString())
    } catch (squadsError) {
      console.error("[FundFlow] ❌ Failed to create Squads vault:", squadsError)
      throw new Error("Failed to create Squads multisig vault: " + (squadsError instanceof Error ? squadsError.message : String(squadsError)))
    }

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

    // Step 2: Create group on-chain (for pool management later)
    console.log("[FundFlow] Step 2: Creating on-chain group pool...")

    // For MVP testing: Skip on-chain creation, just use mock PDA
    // This allows testing the Pay button without needing the Anchor program deployed
    console.log("[FundFlow] ℹ️  Skipping on-chain pool creation for MVP testing")
    console.log("[FundFlow] ℹ️  This is OK! The Pay button only needs the Squads vault address")

    const mockGroupPoolPDA = PublicKey.unique() // Generate a mock PDA
    const signature = `group_created_${Date.now()}` // Mock signature

    console.log("[FundFlow] ✅ Group metadata prepared!")
    console.log("[FundFlow]    Group Pool PDA (mock):", mockGroupPoolPDA.toString())
    console.log("[FundFlow]    Will use Squads vault for payments:", vaultPDA.toString())

    console.log("[FundFlow] Preparing group data...")
    const completeGroupData: GroupData = {
      ...groupData,
      id: groupId,
      createdAt: new Date().toISOString(),
      members: [creatorPublicKey],
      totalCollected: 0,
      onChainAddress: mockGroupPoolPDA.toString(), // Pool address (for later compression)
      squadsVaultAddress: vaultPDA.toString(), // Vault address (where funds are collected)
      squadsMultisigAddress: multisigPDA.toString(), // Multisig address
    }
    console.log("[FundFlow] Group data prepared successfully")

    // Save to localStorage
    try {
      console.log("[FundFlow] Saving to localStorage...")
      saveGroup(completeGroupData)
      console.log("[FundFlow] ✅ Group saved to localStorage successfully")
    } catch (localStorageError) {
      console.error("[FundFlow] ❌ Failed to save to localStorage:", localStorageError)
      throw new Error("Failed to save group to localStorage: " + (localStorageError instanceof Error ? localStorageError.message : String(localStorageError)))
    }

    // Try to save to Firebase
    try {
      console.log("[FundFlow] Saving to Firebase...")
      await saveGroupToFirebase(completeGroupData)
      console.log("[FundFlow] ✅ Group also saved to Firebase successfully")
    } catch (firebaseError) {
      console.warn("[FundFlow] ⚠️ Failed to save to Firebase, using localStorage only:", firebaseError)
      console.warn("[FundFlow] Firebase is optional, continuing anyway...")
    }

    console.log("[FundFlow] ✅ Group created successfully with ID:", groupId)
    console.log("[FundFlow] Flow: Pay → Squads Vault → Pool (compressed) → Withdraw")

    return {
      groupId,
      signature,
      onChainAddress: mockGroupPoolPDA.toString(),
      squadsVaultAddress: vaultPDA.toString(),
    }
  } catch (error) {
    console.error("[FundFlow] ❌❌❌ Error creating group:", error)
    console.error("[FundFlow] Error type:", typeof error)
    console.error("[FundFlow] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[FundFlow] Error stack:", error instanceof Error ? error.stack : "No stack")
    console.error("[FundFlow] Full error object:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('wallet')) {
        throw new Error("Wallet error: " + error.message)
      }
      if (error.message.includes('balance') || error.message.includes('insufficient')) {
        throw new Error("Insufficient SOL balance. Please add devnet SOL to your wallet.")
      }
      if (error.message.includes('Firebase') || error.message.includes('database')) {
        throw new Error("Database error: " + error.message)
      }
    }

    throw new Error("Failed to create group: " + (error instanceof Error ? error.message : String(error)))
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
