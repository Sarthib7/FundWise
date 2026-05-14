import { getAssociatedTokenAddress } from "@solana/spl-token"
import { Connection, PublicKey, type ParsedTransactionWithMeta, type TokenBalance } from "@solana/web3.js"
import { createFundWiseConnection, createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import { FundWiseError } from "@/lib/server/fundwise-error"

const VERIFICATION_COMMITMENT = "confirmed"
const MAX_VERIFICATION_ATTEMPTS = 12
const VERIFICATION_RETRY_DELAY_MS = 1000

const connection = createFundWiseConnection(VERIFICATION_COMMITMENT)
const fundModeConnection = createFundWiseConnectionForCluster("devnet", VERIFICATION_COMMITMENT)

type TokenBalanceSnapshot = {
  mint?: string
  owner?: string
  preAmount: bigint
  postAmount: bigint
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toBase58(value: PublicKey | string) {
  return typeof value === "string" ? value : value.toBase58()
}

function parseRawTokenAmount(value?: string) {
  if (!value) {
    return BigInt(0)
  }

  return BigInt(value)
}

function getParsedAccountKeys(transaction: ParsedTransactionWithMeta) {
  return transaction.transaction.message.accountKeys.map((account) => ({
    address: account.pubkey.toBase58(),
    signer: account.signer,
    writable: account.writable,
  }))
}

function buildTokenBalanceMap(transaction: ParsedTransactionWithMeta) {
  const tokenBalances = new Map<string, TokenBalanceSnapshot>()
  const accountKeys = getParsedAccountKeys(transaction)

  const applyTokenBalance = (
    balance: TokenBalance,
    key: "preAmount" | "postAmount"
  ) => {
    const account = accountKeys[balance.accountIndex]

    if (!account) {
      return
    }

    const current = tokenBalances.get(account.address) || {
      preAmount: BigInt(0),
      postAmount: BigInt(0),
    }

    tokenBalances.set(account.address, {
      ...current,
      mint: balance.mint || current.mint,
      owner: balance.owner || current.owner,
      [key]: parseRawTokenAmount(balance.uiTokenAmount.amount),
    })
  }

  for (const balance of transaction.meta?.preTokenBalances || []) {
    applyTokenBalance(balance, "preAmount")
  }

  for (const balance of transaction.meta?.postTokenBalances || []) {
    applyTokenBalance(balance, "postAmount")
  }

  return tokenBalances
}

function assertSigner(transaction: ParsedTransactionWithMeta, walletAddress: string, label: string) {
  const signer = getParsedAccountKeys(transaction).find((account) => account.address === walletAddress)

  if (!signer?.signer) {
    throw new FundWiseError(`${label} wallet did not sign the on-chain transaction.`)
  }
}

async function loadParsedTransaction(signature: string, transactionConnection: Connection) {
  for (let attempt = 0; attempt < MAX_VERIFICATION_ATTEMPTS; attempt += 1) {
    const transaction = await transactionConnection.getParsedTransaction(signature, {
      commitment: VERIFICATION_COMMITMENT,
      maxSupportedTransactionVersion: 0,
    })

    if (transaction?.meta) {
      if (transaction.meta.err) {
        throw new FundWiseError(
          `On-chain transaction failed: ${JSON.stringify(transaction.meta.err)}`
        )
      }

      return transaction
    }

    if (attempt < MAX_VERIFICATION_ATTEMPTS - 1) {
      await sleep(VERIFICATION_RETRY_DELAY_MS)
    }
  }

  throw new FundWiseError("On-chain transaction is not confirmed on the configured Solana RPC yet.")
}

async function verifyAtaTransfer(params: {
  txSig: string
  mint: string
  senderWallet: string
  recipientWallet: string
  senderOwnerOffCurve?: boolean
  recipientOwnerOffCurve?: boolean
  signerWallet?: string
  expectedAmount: number
  actionLabel: string
  transactionConnection?: Connection
}) {
  const {
    txSig,
    mint,
    senderWallet,
    recipientWallet,
    senderOwnerOffCurve = false,
    recipientOwnerOffCurve = false,
    signerWallet,
    expectedAmount,
    actionLabel,
    transactionConnection = connection,
  } = params

  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0 || !Number.isInteger(expectedAmount)) {
    throw new FundWiseError(`${actionLabel} amount must be a positive integer token amount.`)
  }

  const transaction = await loadParsedTransaction(txSig, transactionConnection)
  const mintPubkey = new PublicKey(mint)
  const senderPubkey = new PublicKey(senderWallet)
  const recipientPubkey = new PublicKey(recipientWallet)
  const expectedSourceAta = toBase58(
    await getAssociatedTokenAddress(mintPubkey, senderPubkey, senderOwnerOffCurve)
  )
  const expectedDestinationAta = toBase58(
    await getAssociatedTokenAddress(mintPubkey, recipientPubkey, recipientOwnerOffCurve)
  )
  const tokenBalances = buildTokenBalanceMap(transaction)
  const sourceBalance = tokenBalances.get(expectedSourceAta)
  const destinationBalance = tokenBalances.get(expectedDestinationAta)
  const expectedAmountRaw = BigInt(expectedAmount)

  assertSigner(transaction, signerWallet || senderWallet, actionLabel)

  if (!sourceBalance) {
    throw new FundWiseError(`${actionLabel} source token account was not present in the on-chain transaction.`)
  }

  if (!destinationBalance) {
    throw new FundWiseError(`${actionLabel} destination token account was not present in the on-chain transaction.`)
  }

  if (sourceBalance.mint && sourceBalance.mint !== mint) {
    throw new FundWiseError(`${actionLabel} source token account mint did not match the expected Group stablecoin.`)
  }

  if (destinationBalance.mint && destinationBalance.mint !== mint) {
    throw new FundWiseError(`${actionLabel} destination token account mint did not match the expected Group stablecoin.`)
  }

  const sourceDelta = sourceBalance.postAmount - sourceBalance.preAmount
  const destinationDelta = destinationBalance.postAmount - destinationBalance.preAmount

  if (sourceDelta !== -expectedAmountRaw) {
    throw new FundWiseError(
      `${actionLabel} source token delta did not match the requested amount.`
    )
  }

  if (destinationDelta !== expectedAmountRaw) {
    throw new FundWiseError(
      `${actionLabel} destination token delta did not match the requested amount.`
    )
  }

  // FW-055: reject any side transfer that piggy-backs on the same signed tx.
  // A correct settlement / contribution / proposal-execution touches exactly the
  // two ATAs above. Any other ATA delta means an attacker (or a compromised
  // wallet extension) tacked on an extra transfer before the user signed.
  for (const [address, balance] of tokenBalances) {
    if (address === expectedSourceAta || address === expectedDestinationAta) {
      continue
    }

    if (balance.postAmount !== balance.preAmount) {
      throw new FundWiseError(
        `${actionLabel} transaction includes an unexpected token balance change on ${address}. FundWise only records transfers that move exactly the expected amount between the listed accounts.`
      )
    }
  }
}

export async function verifySettlementTransfer(params: {
  txSig: string
  mint: string
  fromWallet: string
  toWallet: string
  amount: number
}) {
  await verifyAtaTransfer({
    txSig: params.txSig,
    mint: params.mint,
    senderWallet: params.fromWallet,
    recipientWallet: params.toWallet,
    expectedAmount: params.amount,
    actionLabel: "Settlement",
  })
}

export async function verifyContributionTransfer(params: {
  txSig: string
  mint: string
  memberWallet: string
  treasuryAddress: string
  amount: number
}) {
  await verifyAtaTransfer({
    txSig: params.txSig,
    mint: params.mint,
    senderWallet: params.memberWallet,
    recipientWallet: params.treasuryAddress,
    recipientOwnerOffCurve: true,
    expectedAmount: params.amount,
    actionLabel: "Contribution",
    transactionConnection: fundModeConnection,
  })
}

export async function verifyProposalExecutionTransfer(params: {
  txSig: string
  mint: string
  treasuryAddress: string
  recipientWallet: string
  executorWallet: string
  amount: number
}) {
  await verifyAtaTransfer({
    txSig: params.txSig,
    mint: params.mint,
    senderWallet: params.treasuryAddress,
    recipientWallet: params.recipientWallet,
    senderOwnerOffCurve: true,
    signerWallet: params.executorWallet,
    expectedAmount: params.amount,
    actionLabel: "Proposal execution",
    transactionConnection: fundModeConnection,
  })
}
