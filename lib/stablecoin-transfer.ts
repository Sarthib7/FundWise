import { LAMPORTS_PER_SOL, PublicKey, Transaction, Connection } from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token"
import { getSolanaRpcUrl } from "@/lib/solana-cluster"

const STABLECOIN_TRANSFER_COMMITMENT = "confirmed"

const connection = new Connection(getSolanaRpcUrl(), STABLECOIN_TRANSFER_COMMITMENT)

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
}

async function getOptionalTokenAccountAmount(address: PublicKey) {
  try {
    const account = await getAccount(connection, address)
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
  const mint = new PublicKey(params.mintAddress)
  const fromPubkey = new PublicKey(params.fromAddress)
  const toPubkey = new PublicKey(params.toAddress)

  const fromAta = await getAssociatedTokenAddress(mint, fromPubkey)
  const toAta = await getAssociatedTokenAddress(
    mint,
    toPubkey,
    params.recipientOwnerOffCurve ?? false
  )

  const sourceAccount = await getOptionalTokenAccountAmount(fromAta)
  const destinationAccount = await getOptionalTokenAccountAmount(toAta)
  const walletSolBalanceLamports = await connection.getBalance(fromPubkey, STABLECOIN_TRANSFER_COMMITMENT)

  const transaction = new Transaction()

  if (!destinationAccount.exists) {
    transaction.add(
      createAssociatedTokenAccountInstruction(fromPubkey, toAta, toPubkey, mint)
    )
  }

  transaction.add(
    createTransferInstruction(fromAta, toAta, fromPubkey, BigInt(params.amount))
  )

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
    STABLECOIN_TRANSFER_COMMITMENT
  )

  transaction.recentBlockhash = blockhash
  transaction.feePayer = fromPubkey

  const feeForMessage = await connection.getFeeForMessage(
    transaction.compileMessage(),
    STABLECOIN_TRANSFER_COMMITMENT
  )

  const estimatedFeeLamports = feeForMessage.value ?? 0
  const ataRentLamports = destinationAccount.exists
    ? 0
    : await getMinimumBalanceForRentExemptAccount(
        connection,
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

function normalizeStablecoinTransferError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error)
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

  if (errorMessage.toLowerCase().includes("insufficient")) {
    return new Error("Insufficient SOL balance to cover the required network fees.")
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
      signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: STABLECOIN_TRANSFER_COMMITMENT,
      })
    } else {
      throw new Error("Wallet does not support transaction signing")
    }

    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      STABLECOIN_TRANSFER_COMMITMENT
    )

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`)
    }

    return { signature, preview }
  } catch (error) {
    throw normalizeStablecoinTransferError(error)
  }
}

export function formatSolAmountFromLamports(lamports: number, fractionDigits: number = 4) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(fractionDigits)
}
