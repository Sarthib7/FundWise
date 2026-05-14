import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token"
import { createFundWiseConnection, createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import type { FundWiseCluster } from "@/lib/solana-cluster"

const STABLECOIN_TRANSFER_COMMITMENT = "confirmed"

const connection = createFundWiseConnection(STABLECOIN_TRANSFER_COMMITMENT)

export type StablecoinTransferPreview = {
  fromAta: PublicKey
  toAta: PublicKey
  sourceTokenAccountExists: boolean
  sourceTokenBalance: number
  destinationTokenAccountExists: boolean
  requiresDestinationAtaCreation: boolean
  walletSolBalanceLamports: number
  estimatedFeeLamports: number
  ataRentLamports: number
  estimatedTotalSolLamports: number
}

type StablecoinTransferParams = {
  fromAddress: string
  toAddress: string
  mintAddress: string
  amount: number
  recipientOwnerOffCurve?: boolean
  cluster?: FundWiseCluster
}

function getTransferConnection(cluster?: FundWiseCluster) {
  return cluster ? createFundWiseConnectionForCluster(cluster, STABLECOIN_TRANSFER_COMMITMENT) : connection
}

async function getOptionalTokenAccountAmount(address: PublicKey, transactionConnection = connection) {
  try {
    const account = await getAccount(transactionConnection, address)
    return {
      exists: true,
      amount: Number(account.amount),
    }
  } catch {
    return {
      exists: false,
      amount: 0,
    }
  }
}

async function buildStablecoinTransferTransaction(params: StablecoinTransferParams) {
  const transactionConnection = getTransferConnection(params.cluster)
  const mint = new PublicKey(params.mintAddress)
  const fromPubkey = new PublicKey(params.fromAddress)
  const toPubkey = new PublicKey(params.toAddress)

  const fromAta = await getAssociatedTokenAddress(mint, fromPubkey)
  const toAta = await getAssociatedTokenAddress(
    mint,
    toPubkey,
    params.recipientOwnerOffCurve ?? false
  )

  const sourceAccount = await getOptionalTokenAccountAmount(fromAta, transactionConnection)
  const destinationAccount = await getOptionalTokenAccountAmount(toAta, transactionConnection)
  const walletSolBalanceLamports = await transactionConnection.getBalance(fromPubkey, STABLECOIN_TRANSFER_COMMITMENT)

  const transaction = new Transaction()

  if (!destinationAccount.exists) {
    transaction.add(
      createAssociatedTokenAccountInstruction(fromPubkey, toAta, toPubkey, mint)
    )
  }

  transaction.add(
    createTransferInstruction(fromAta, toAta, fromPubkey, BigInt(params.amount))
  )

  const { blockhash, lastValidBlockHeight } = await transactionConnection.getLatestBlockhash(
    STABLECOIN_TRANSFER_COMMITMENT
  )

  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromPubkey

  const feeForMessage = await transactionConnection.getFeeForMessage(
    transaction.compileMessage(),
    STABLECOIN_TRANSFER_COMMITMENT
  )

  const estimatedFeeLamports = feeForMessage.value ?? 0
  const ataRentLamports = destinationAccount.exists
    ? 0
    : await getMinimumBalanceForRentExemptAccount(
        transactionConnection,
        STABLECOIN_TRANSFER_COMMITMENT
      )

  return {
    transaction,
    blockhash,
    lastValidBlockHeight,
    preview: {
      fromAta,
      toAta,
      sourceTokenAccountExists: sourceAccount.exists,
      sourceTokenBalance: sourceAccount.amount,
      destinationTokenAccountExists: destinationAccount.exists,
      requiresDestinationAtaCreation: !destinationAccount.exists,
      walletSolBalanceLamports,
      estimatedFeeLamports,
      ataRentLamports,
      estimatedTotalSolLamports: estimatedFeeLamports + ataRentLamports,
    } satisfies StablecoinTransferPreview,
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function normalizeStablecoinTransferError(error: unknown) {
  const errorMessage = getErrorMessage(error)
  const lowerMessage = errorMessage.toLowerCase()
  const errorCode = typeof error === "object" && error !== null && "code" in error
    ? (error as { code?: unknown }).code
    : undefined

  if (
    errorCode === 4001 ||
    errorMessage.includes("User rejected") ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("rejected the request") ||
    errorMessage.includes("cancelled")
  ) {
    return new Error("TRANSACTION_CANCELLED")
  }

  if (lowerMessage.includes("insufficient funds for rent")) {
    return new Error("This wallet needs more SOL to create the recipient token account and pay Solana network fees.")
  }

  if (lowerMessage.includes("insufficient")) {
    return new Error("This wallet needs more SOL for Solana network fees.")
  }

  if (
    lowerMessage.includes("transaction simulation failed") ||
    lowerMessage.includes("simulation failed") ||
    lowerMessage.includes("failed to simulate")
  ) {
    return new Error("Solana simulation failed before the transfer was submitted. Refresh the Group, check USDC and SOL balances, then try again.")
  }

  if (
    lowerMessage.includes("blockhash not found") ||
    lowerMessage.includes("transaction expired") ||
    lowerMessage.includes("lastvalidblockheight")
  ) {
    return new Error("The Solana transaction expired before confirmation. Refresh the Group and try again.")
  }

  if (
    lowerMessage.includes("failed to send transaction") ||
    lowerMessage.includes("send transaction failed") ||
    lowerMessage.includes("failed to submit")
  ) {
    return new Error("FundWise could not submit the signed transaction to Solana. Check your connection and try again.")
  }

  if (lowerMessage.includes("solana confirmed the transaction as failed")) {
    return new Error("The transfer was submitted, but Solana confirmed it as failed. No FundWise Receipt was recorded. Refresh balances before retrying.")
  }

  return error instanceof Error ? error : new Error(errorMessage)
}

export async function previewStablecoinTransfer(params: StablecoinTransferParams) {
  const { preview } = await buildStablecoinTransferTransaction(params)
  return preview
}

export async function executeStablecoinTransfer(
  wallet: {
    signAndSendTransaction?: (transaction: Transaction) => Promise<string | { signature: string }>
    signTransaction?: (transaction: Transaction) => Promise<Transaction>
  },
  params: StablecoinTransferParams
): Promise<{ signature: string; preview: StablecoinTransferPreview }> {
  try {
    const { transaction, blockhash, lastValidBlockHeight, preview } =
      await buildStablecoinTransferTransaction(params)

    let signature: string

    if (wallet.signAndSendTransaction) {
      const result = await wallet.signAndSendTransaction(transaction)
      signature = typeof result === "string" ? result : result.signature
    } else if (wallet.signTransaction) {
      const signed = await wallet.signTransaction(transaction)
      const transactionConnection = getTransferConnection(params.cluster)
      signature = await transactionConnection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: STABLECOIN_TRANSFER_COMMITMENT,
      })
    } else {
      throw new Error("Wallet does not support transaction signing")
    }

    const transactionConnection = getTransferConnection(params.cluster)
    const confirmation = await transactionConnection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      STABLECOIN_TRANSFER_COMMITMENT
    )

    if (confirmation.value.err) {
      throw new Error(
        `Solana confirmed the transaction as failed: ${JSON.stringify(confirmation.value.err)}`
      )
    }

    return { signature, preview }
  } catch (error) {
    throw normalizeStablecoinTransferError(error)
  }
}

export function formatSolAmountFromLamports(lamports: number, fractionDigits: number = 4) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(fractionDigits)
}
