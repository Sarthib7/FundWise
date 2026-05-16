/**
 * Squads Protocol wallet-signed governance operations for FundWise Fund Mode.
 *
 * This Module owns the full wallet flow (build + sign + send + confirm) for
 * every Squads governance action the product takes. Callers see only the
 * high-level operations: `deriveMultisigAddresses`, `createMultisig`,
 * `proposeReimbursement`, `review`, `execute`. They never touch
 * `@sqds/multisig` directly, never construct PDAs by hand, and never assemble
 * a `TransactionMessage`. The Module's Interface is the unit-test surface
 * (the verify path in `./lifecycle` ships with an injectable `AccountReader`;
 * the wallet ops here ship with an injectable `connectionFactory`).
 *
 * Per ADR-0035, `@sqds/multisig` and `TransactionMessage`/
 * `VersionedTransaction` SDK usage live only inside `lib/squads/`. The
 * transitional `lib/squads-multisig.ts` re-export shim is allowed to reach
 * back in here while consumers migrate.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token"
import * as multisig from "@sqds/multisig"
import { createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import type { FundWiseCluster } from "@/lib/solana-cluster"

// Browser-safe Fund Mode cluster lookup. The wallet ops run in the
// browser, so the public `NEXT_PUBLIC_*` env var is the source of truth; the
// server-only var is checked as a fallback for server callers. Kept in sync
// with the legacy `getFundModeCluster` in `lib/squads-multisig.ts` while the
// shim is alive.
function getFundModeCluster(): FundWiseCluster {
  const raw =
    (typeof process !== "undefined" && process.env
      ? process.env.NEXT_PUBLIC_FUNDWISE_FUND_MODE_CLUSTER ??
        process.env.FUNDWISE_FUND_MODE_CLUSTER ??
        ""
      : ""
    )
      .trim()
      .toLowerCase()
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta"
  if (raw === "custom") return "custom"
  return "devnet"
}

// Structural Wallet signer. Wallet-adapter, Privy embedded wallets, and
// future server signers all satisfy this shape — the Module never depends on
// `WalletContextState` from any specific wallet library. The optional
// `sendTransaction` and `signAndSendTransaction` methods cover the wallet
// surfaces FundWise has encountered in production; callers that provide
// neither will exercise the `signTransaction` fallback.
export type WalletSigner = {
  publicKey: PublicKey
  signTransaction?: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
  // Optional convenience methods exposed by some wallets. They are not part
  // of the canonical structural Interface — only `publicKey` + a sign method
  // is — but the Module uses them when present so production wallet-adapter
  // flows keep working unchanged.
  sendTransaction?: (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: unknown
  ) => Promise<string>
  signAndSendTransaction?: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<string | { signature: string }>
}

export type ConnectionFactory = () => Connection

function defaultConnectionFactory(): Connection {
  return createFundWiseConnectionForCluster(getFundModeCluster(), "confirmed")
}

async function sendWalletTransaction(
  wallet: WalletSigner,
  transaction: Transaction | VersionedTransaction,
  blockhash: string,
  lastValidBlockHeight: number,
  connection: Connection
): Promise<string> {
  let signature: string

  if (wallet.sendTransaction) {
    signature = await wallet.sendTransaction(transaction, connection)
  } else if (wallet.signAndSendTransaction) {
    const result = await wallet.signAndSendTransaction(transaction)
    signature = typeof result === "string" ? result : result.signature
  } else if (wallet.signTransaction) {
    const signed = await wallet.signTransaction(transaction)
    signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    })
  } else {
    throw new Error("Wallet does not support transaction signing")
  }

  const confirmation = await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, "confirmed")

  if (confirmation.value.err) {
    throw new Error("Squads transaction failed: " + JSON.stringify(confirmation.value.err))
  }

  return signature
}

export type DeriveMultisigAddressesInput = {
  creator: PublicKey
  threshold: number
  members: PublicKey[]
  // Callers can supply their own createKey when they want to derive the same
  // PDAs they will later sign with — for example, to display the addresses
  // before the wallet popup. When omitted, a fresh keypair is generated.
  createKey?: Keypair
}

export type DeriveMultisigAddressesOutput = {
  multisigPda: PublicKey
  treasuryPda: PublicKey
  createKey: Keypair
}

/**
 * Pure PDA derivation for a Squads v4 multisig + vault. No network calls,
 * no wallet flow. Useful for showing the Member the addresses they are
 * about to materialize before they sign the initialization transaction.
 */
export function deriveMultisigAddresses(
  input: DeriveMultisigAddressesInput
): DeriveMultisigAddressesOutput {
  if (input.threshold < 1) {
    throw new Error("Approval threshold must be at least 1")
  }

  const uniqueMemberKeys = Array.from(
    new Set([input.creator.toString(), ...input.members.map((member) => member.toString())])
  ).map((member) => new PublicKey(member))

  if (input.threshold > uniqueMemberKeys.length) {
    throw new Error(
      `Approval threshold ${input.threshold} exceeds current member count ${uniqueMemberKeys.length}`
    )
  }

  const createKey = input.createKey ?? Keypair.generate()
  const [multisigPda] = multisig.getMultisigPda({
    createKey: createKey.publicKey,
  })
  const [treasuryPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  })

  return {
    multisigPda,
    treasuryPda,
    createKey,
  }
}

export type CreateMultisigInput = {
  signer: WalletSigner
  threshold: number
  members: PublicKey[]
  createKey?: Keypair
  connectionFactory?: ConnectionFactory
}

export type CreateMultisigOutput = {
  multisigPda: PublicKey
  treasuryPda: PublicKey
  signature: string
}

/**
 * Create a new Squads v4 multisig and its first vault PDA on-chain.
 *
 * Derives the PDAs, builds the createV2 transaction, signs and confirms it.
 * Returns the on-chain addresses plus the confirmation signature. The signer
 * pays for rent and signs as the multisig creator.
 */
export async function createMultisig(
  input: CreateMultisigInput
): Promise<CreateMultisigOutput> {
  try {
    const connectionFactory = input.connectionFactory ?? defaultConnectionFactory
    const connection = connectionFactory()
    const creator = input.signer.publicKey

    console.log("[Squads] Creating multisig")
    console.log("[Squads] Creator:", creator.toString())
    console.log("[Squads] Initial members:", input.members.length)

    const { multisigPda, treasuryPda, createKey } = deriveMultisigAddresses({
      creator,
      threshold: input.threshold,
      members: input.members,
      createKey: input.createKey,
    })

    console.log("[Squads] Multisig PDA:", multisigPda.toString())
    console.log("[Squads] Vault PDA:", treasuryPda.toString())

    const uniqueMembers = Array.from(
      new Set([creator.toString(), ...input.members.map((member) => member.toString())])
    ).map((member) => new PublicKey(member))

    const multisigMembers = uniqueMembers.map((member) => ({
      key: member,
      permissions: multisig.types.Permissions.all(),
    }))

    console.log(`[Squads] Configuring ${input.threshold}/${multisigMembers.length} multisig`)

    console.log("[Squads] Creating multisig on-chain...")

    const [programConfigPda] = multisig.getProgramConfigPda({})
    const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
      connection,
      programConfigPda
    )
    const createMultisigIx = multisig.instructions.multisigCreateV2({
      treasury: programConfig.treasury,
      createKey: createKey.publicKey,
      creator,
      multisigPda,
      configAuthority: null,
      threshold: input.threshold,
      members: multisigMembers,
      timeLock: 0,
      rentCollector: null,
    })

    const tx = new Transaction().add(createMultisigIx)

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
    tx.recentBlockhash = blockhash
    tx.feePayer = creator

    console.log("[Squads] 🎉 WALLET POPUP WILL APPEAR - Please approve multisig creation")

    let signature: string

    if (input.signer.sendTransaction) {
      signature = await input.signer.sendTransaction(tx, connection, {
        signers: [createKey],
      })
    } else if (input.signer.signTransaction) {
      tx.partialSign(createKey)
      const signedTx = await input.signer.signTransaction(tx)
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })
    } else {
      throw new Error("Wallet does not support transaction signing")
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
      multisigPda,
      treasuryPda,
      signature,
    }
  } catch (error) {
    console.error("[Squads] Error creating multisig:", error)
    throw new Error("Failed to create Squads multisig: " + (error instanceof Error ? error.message : String(error)))
  }
}

export type ProposeReimbursementPlatformFee = {
  feeWallet: PublicKey
  feeAmount: bigint
}

export type ProposeReimbursementInput = {
  signer: WalletSigner
  multisigAddress: string
  recipient: PublicKey
  amount: bigint
  mint: PublicKey
  treasuryAddress?: string
  memo?: string
  // Reserved for FW-068's two-leg vault transactions (a Fee leg routed to the
  // Platform Fee Wallet alongside the reimbursement leg to the recipient).
  // Wiring lives in a later PR — the slot is present here so the Module
  // Interface is stable from the start.
  platformFee?: ProposeReimbursementPlatformFee
  connectionFactory?: ConnectionFactory
}

export type ProposeReimbursementOutput = {
  signature: string
  transactionIndex: number
  proposalAddress: string
  transactionAddress: string
}

/**
 * Create a Squads vault transaction + Proposal that reimburses `recipient`
 * with `amount` base units of `mint` out of the Group treasury. The signer
 * pays for rent and signs as the Proposal creator.
 *
 * `platformFee` is reserved for FW-068. Passing it before that PR ships
 * throws explicitly so callers fail loud instead of silently dropping the
 * fee leg.
 */
export async function proposeReimbursement(
  input: ProposeReimbursementInput
): Promise<ProposeReimbursementOutput> {
  if (input.platformFee) {
    throw new Error("Squads.proposeReimbursement: platformFee support ships in FW-068")
  }

  const connectionFactory = input.connectionFactory ?? defaultConnectionFactory
  const connection = connectionFactory()
  const creator = input.signer.publicKey
  const multisigPda = new PublicKey(input.multisigAddress)
  const recipient = input.recipient
  const mint = input.mint

  const [treasuryPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  })

  if (input.treasuryAddress) {
    const supplied = new PublicKey(input.treasuryAddress)
    if (!treasuryPda.equals(supplied)) {
      throw new Error("Treasury address does not match the Squads vault PDA")
    }
  }

  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda
  )
  const nextTransactionIndex = BigInt(Number(multisigInfo.transactionIndex) + 1)
  const [proposalPda] = multisig.getProposalPda({
    multisigPda,
    transactionIndex: nextTransactionIndex,
  })
  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: nextTransactionIndex,
  })

  const treasuryAta = await getAssociatedTokenAddress(mint, treasuryPda, true)
  const recipientAta = await getAssociatedTokenAddress(mint, recipient)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const transaction = new Transaction()

  try {
    await getAccount(connection, recipientAta)
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(creator, recipientAta, recipient, mint)
    )
  }

  const transferInstruction = createTransferInstruction(
    treasuryAta,
    recipientAta,
    treasuryPda,
    input.amount
  )

  transaction.add(
    multisig.instructions.vaultTransactionCreate({
      multisigPda,
      transactionIndex: nextTransactionIndex,
      creator,
      rentPayer: creator,
      vaultIndex: 0,
      ephemeralSigners: 0,
      transactionMessage: new TransactionMessage({
        payerKey: treasuryPda,
        recentBlockhash: blockhash,
        instructions: [transferInstruction],
      }),
    }),
    multisig.instructions.proposalCreate({
      multisigPda,
      transactionIndex: nextTransactionIndex,
      creator,
      isDraft: false,
    })
  )

  transaction.recentBlockhash = blockhash
  transaction.feePayer = creator

  const signature = await sendWalletTransaction(
    input.signer,
    transaction,
    blockhash,
    lastValidBlockHeight,
    connection
  )

  return {
    signature,
    transactionIndex: Number(nextTransactionIndex),
    proposalAddress: proposalPda.toString(),
    transactionAddress: transactionPda.toString(),
  }
}

export type ReviewInput = {
  signer: WalletSigner
  multisigAddress: string
  transactionIndex: number
  decision: "approved" | "rejected"
  connectionFactory?: ConnectionFactory
}

export type ReviewOutput = {
  signature: string
}

/**
 * Approve or reject a pending Squads Proposal. The signer is the reviewing
 * Member. Squads enforces threshold accounting on-chain — this function just
 * records this Member's vote.
 */
export async function review(input: ReviewInput): Promise<ReviewOutput> {
  const connectionFactory = input.connectionFactory ?? defaultConnectionFactory
  const connection = connectionFactory()
  const member = input.signer.publicKey
  const multisigPda = new PublicKey(input.multisigAddress)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const instruction =
    input.decision === "approved"
      ? multisig.instructions.proposalApprove({
          multisigPda,
          transactionIndex: BigInt(input.transactionIndex),
          member,
        })
      : multisig.instructions.proposalReject({
          multisigPda,
          transactionIndex: BigInt(input.transactionIndex),
          member,
        })

  const transaction = new Transaction().add(instruction)
  transaction.recentBlockhash = blockhash
  transaction.feePayer = member

  const signature = await sendWalletTransaction(
    input.signer,
    transaction,
    blockhash,
    lastValidBlockHeight,
    connection
  )

  return { signature }
}

export type ExecuteInput = {
  signer: WalletSigner
  multisigAddress: string
  transactionIndex: number
  connectionFactory?: ConnectionFactory
}

export type ExecuteOutput = {
  signature: string
}

/**
 * Execute an approved Squads vault transaction. The signer pays for the
 * execution and signs as the Member triggering the on-chain transfer.
 */
export async function execute(input: ExecuteInput): Promise<ExecuteOutput> {
  const connectionFactory = input.connectionFactory ?? defaultConnectionFactory
  const connection = connectionFactory()
  const member = input.signer.publicKey
  const multisigPda = new PublicKey(input.multisigAddress)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const transaction = await multisig.transactions.vaultTransactionExecute({
    connection,
    blockhash,
    feePayer: member,
    multisigPda,
    transactionIndex: BigInt(input.transactionIndex),
    member,
  })

  const signature = await sendWalletTransaction(
    input.signer,
    transaction,
    blockhash,
    lastValidBlockHeight,
    connection
  )

  return { signature }
}
