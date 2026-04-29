/**
 * Squads Protocol treasury helpers for FundWise Fund Mode.
 *
 * Treasury funds live in the Squads vault PDA while governance actions target
 * the Squads multisig PDA.
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
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

/**
 * Withdraw from Squads vault to user wallet
 * This is called when user clicks "Withdraw" button
 *
 * Creates a multisig withdrawal proposal that requires approval
 */
export async function withdrawFromSquadsVault(
  wallet: any, // Privy wallet
  multisigAddress: PublicKey,
  vaultAddress: PublicKey,
  recipientAddress: PublicKey,
  amount: number // in lamports
): Promise<{ signature: string; proposalAddress?: string }> {
  try {
    console.log("[Squads Withdraw] Initiating withdrawal from vault...")
    console.log("[Squads Withdraw] Multisig:", multisigAddress.toString())
    console.log("[Squads Withdraw] From (Vault):", vaultAddress.toString())
    console.log("[Squads Withdraw] To (Recipient):", recipientAddress.toString())
    console.log("[Squads Withdraw] Amount:", amount, "lamports (", amount / LAMPORTS_PER_SOL, "SOL )")

    // Step 1: Create a vault transaction (withdrawal instruction)
    console.log("[Squads Withdraw] Step 1: Creating vault transaction...")

    // The withdrawal instruction
    const withdrawInstruction = SystemProgram.transfer({
      fromPubkey: vaultAddress,
      toPubkey: recipientAddress,
      lamports: amount,
    })

    // Get the current transaction index for the multisig
    const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
      connection,
      multisigAddress
    )

    const currentTransactionIndex = Number(multisigInfo.transactionIndex)
    const newTransactionIndex = BigInt(currentTransactionIndex + 1)

    console.log("[Squads Withdraw] Current transaction index:", currentTransactionIndex)
    console.log("[Squads Withdraw] New transaction index:", newTransactionIndex)

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")

    // Create vault transaction for withdrawal
    const createVaultTransactionIx = multisig.instructions.vaultTransactionCreate({
      multisigPda: multisigAddress,
      transactionIndex: newTransactionIndex,
      creator: new PublicKey(wallet.address),
      vaultIndex: 0, // Using default vault
      ephemeralSigners: 0,
      transactionMessage: new TransactionMessage({
        payerKey: vaultAddress,
        recentBlockhash: blockhash,
        instructions: [withdrawInstruction],
      }),
    })

    console.log("[Squads Withdraw] Step 2: Creating proposal...")

    // Create proposal for this transaction
    const createProposalIx = await multisig.instructions.proposalCreate({
      multisigPda: multisigAddress,
      transactionIndex: newTransactionIndex,
      creator: new PublicKey(wallet.address),
    })

    console.log("[Squads Withdraw] Step 3: Auto-approving as creator...")

    // Auto-approve as the creator
    const approveProposalIx = await multisig.instructions.proposalApprove({
      multisigPda: multisigAddress,
      transactionIndex: newTransactionIndex,
      member: new PublicKey(wallet.address),
    })

    // Combine all instructions
    const transaction = new Transaction()
    transaction.add(createVaultTransactionIx)
    transaction.add(createProposalIx)
    transaction.add(approveProposalIx)

    // Get recent blockhash
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(wallet.address)

    console.log("[Squads Withdraw] 🎉 WALLET POPUP WILL APPEAR - Please approve the withdrawal proposal")

    // Sign and send transaction
    let signature: string

    if (wallet.sendTransaction) {
      signature = await wallet.sendTransaction(transaction, connection)
    } else {
      const signedTransaction = await wallet.signTransaction(transaction)
      signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })
    }

    console.log("[Squads Withdraw] Waiting for confirmation...")

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed")

    if (confirmation.value.err) {
      throw new Error("Transaction failed: " + JSON.stringify(confirmation.value.err))
    }

    // Derive proposal address for reference
    const [proposalPda] = multisig.getProposalPda({
      multisigPda: multisigAddress,
      transactionIndex: newTransactionIndex,
    })

    console.log("[Squads Withdraw] ✅ Withdrawal proposal created!")
    console.log("[Squads Withdraw] Transaction signature:", signature)
    console.log("[Squads Withdraw] Proposal address:", proposalPda.toString())
    console.log("[Squads Withdraw] Transaction index:", newTransactionIndex.toString())
    console.log("[Squads Withdraw]")
    console.log("[Squads Withdraw] ⚠️  NEXT STEPS:")
    console.log("[Squads Withdraw]    1. Other multisig members need to approve")
    console.log("[Squads Withdraw]    2. Once threshold is met, execute the withdrawal")
    console.log("[Squads Withdraw]    3. Use Squads UI: https://v4.squads.so/")
    console.log("[Squads Withdraw]")
    console.log("[Squads Withdraw] For single-signer multisig, executing now...")

    // If this is a 1/1 multisig (single signer), try to execute immediately
    if (multisigInfo.threshold === 1) {
      try {
        const { instruction: executeIx } = await multisig.instructions.vaultTransactionExecute({
          connection,
          multisigPda: multisigAddress,
          transactionIndex: newTransactionIndex,
          member: new PublicKey(wallet.address),
        })

        const executeTx = new Transaction().add(executeIx)
        const { blockhash: execBlockhash } = await connection.getLatestBlockhash("confirmed")
        executeTx.recentBlockhash = execBlockhash
        executeTx.feePayer = new PublicKey(wallet.address)

        const execSignature = wallet.sendTransaction
          ? await wallet.sendTransaction(executeTx, connection)
          : await (async () => {
              const signed = await wallet.signTransaction(executeTx)
              return await connection.sendRawTransaction(signed.serialize())
            })()

        await connection.confirmTransaction(execSignature, "confirmed")

        console.log("[Squads Withdraw] ✅ Withdrawal EXECUTED (1/1 multisig)!")
        console.log("[Squads Withdraw] Execution signature:", execSignature)
        console.log("[Squads Withdraw] Explorer:", `https://explorer.solana.com/tx/${execSignature}?cluster=devnet`)

        return {
          signature,
          proposalAddress: proposalPda.toString(),
        }
      } catch (execError) {
        console.warn("[Squads Withdraw] Could not auto-execute:", execError)
        console.log("[Squads Withdraw] Proposal created but execution failed")
      }
    }

    console.log("[Squads Withdraw] Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`)

    return {
      signature,
      proposalAddress: proposalPda.toString(),
    }
  } catch (error) {
    console.error("[Squads Withdraw] ❌ Error:", error)

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error("Withdrawal proposal cancelled by user")
      }
      if (error.message.includes('AccountNotFound') || error.message.includes('not found')) {
        throw new Error("Multisig account not found. The group may not have been properly initialized.")
      }
    }

    throw new Error("Failed to create withdrawal proposal: " + (error instanceof Error ? error.message : String(error)))
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
