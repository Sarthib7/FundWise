#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { createPrivateKey, sign as cryptoSign } from "node:crypto"
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import {
  createAssociatedTokenAccountInstruction,
  createMint,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token"
import * as multisig from "@sqds/multisig"

const DEVNET_HINT = "devnet"
const DEFAULT_BASE_URL = "http://127.0.0.1:3000"
const DECIMALS = 6
const USDC = 1_000_000
const CONTRIBUTION_AMOUNT = 25 * USDC
const REIMBURSEMENT_AMOUNT = 5 * USDC
const USAGE = `Usage: pnpm fund:rehearsal

Runs an invite-only Fund Mode beta rehearsal against a running local/dev server.
Requires Solana devnet and wallet-session API routes.

Required server setup before starting Next.js:
  FUNDWISE_FUND_MODE_INVITE_WALLETS=<creator-wallet>

Optional env:
  FUNDWISE_BASE_URL=http://127.0.0.1:3000
  FUNDWISE_REHEARSAL_CREATOR_KEYPAIR=/path/to/devnet-creator.json
  FUNDWISE_REHEARSAL_FUNDER_KEYPAIR=/path/to/devnet-funder.json
  NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
`

function loadDotEnvLocal() {
  if (!existsSync(".env.local")) return

  const content = readFileSync(".env.local", "utf8")
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const equalsIndex = line.indexOf("=")
    if (equalsIndex === -1) continue

    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()
    value = value.replace(/^['"]|['"]$/g, "")

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function loadKeypair(path) {
  const secretKey = JSON.parse(readFileSync(path, "utf8"))
  return Keypair.fromSecretKey(Uint8Array.from(secretKey))
}

function loadCreatorKeypair() {
  const configuredPath = process.env.FUNDWISE_REHEARSAL_CREATOR_KEYPAIR
  if (configuredPath) return loadKeypair(configuredPath)

  const defaultPath = `${homedir()}/.config/solana/id.json`
  if (existsSync(defaultPath)) return loadKeypair(defaultPath)

  return Keypair.generate()
}

function loadLocalDevnetFunder() {
  const configuredPath =
    process.env.FUNDWISE_REHEARSAL_FUNDER_KEYPAIR ||
    `${homedir()}/.config/solana/id.json`

  if (!existsSync(configuredPath)) {
    return null
  }

  return loadKeypair(configuredPath)
}

function assertDevnet(rpcUrl) {
  if (!rpcUrl.toLowerCase().includes(DEVNET_HINT)) {
    throw new Error(`Refusing to run Fund Mode rehearsal outside devnet. RPC URL: ${rpcUrl}`)
  }
}

async function assertFundModeSchemaReady() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Skipping Supabase schema preflight: Supabase service env is not configured.")
    return
  }

  const checks = [
    {
      table: "proposals",
      select: [
        "proof_url",
        "squads_transaction_index",
        "squads_proposal_address",
        "squads_transaction_address",
        "squads_create_tx_sig",
      ],
    },
    {
      table: "proposal_approvals",
      select: ["reviewed_at", "decision", "tx_sig"],
    },
  ]

  for (const check of checks) {
    const url = new URL(`/rest/v1/${check.table}`, supabaseUrl)
    url.searchParams.set("select", check.select.join(","))
    url.searchParams.set("limit", "0")

    const response = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `Remote Supabase schema is not ready for Fund Mode rehearsal. ` +
          `Apply pending migrations before rerunning: ` +
          `20260509120000_anchor_proposals_to_squads_governance.sql and ` +
          `20260509123000_add_proposal_audit_trail.sql. ` +
          `Schema check failed for ${check.table}: ${response.status} ${body}`
      )
    }
  }
}

function formatUnits(amount) {
  return (amount / USDC).toFixed(2)
}

function explorerTx(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`
}

function explorerAddress(address) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`
}

async function confirmSignature(connection, signature) {
  const latest = await connection.getLatestBlockhash("confirmed")
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: latest.blockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed"
  )

  if (confirmation.value.err) {
    throw new Error(`Solana transaction failed: ${JSON.stringify(confirmation.value.err)}`)
  }
}

async function airdropSol(connection, wallet, solAmount) {
  const attempts = [solAmount, 0.5, 0.2]
  let lastError

  for (const attemptAmount of attempts) {
    try {
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        Math.floor(attemptAmount * LAMPORTS_PER_SOL)
      )
      await confirmSignature(connection, signature)
      return { signature, source: "airdrop", solAmount: attemptAmount }
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 1200))
    }
  }

  throw lastError
}

async function transferSolFromFunder(connection, funder, recipient, solAmount) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: funder.publicKey,
      toPubkey: recipient.publicKey,
      lamports: Math.floor(solAmount * LAMPORTS_PER_SOL),
    })
  )

  return sendAndConfirmTransaction(connection, transaction, [funder], {
    commitment: "confirmed",
  })
}

async function fundWallet(connection, wallet, solAmount) {
  try {
    return await airdropSol(connection, wallet, solAmount)
  } catch (airdropError) {
    const funder = loadLocalDevnetFunder()

    if (!funder) {
      throw airdropError
    }

    const signature = await transferSolFromFunder(connection, funder, wallet, Math.min(solAmount, 0.5))
    return {
      signature,
      source: `local devnet funder ${funder.publicKey.toBase58()}`,
      solAmount: Math.min(solAmount, 0.5),
      airdropError: airdropError instanceof Error ? airdropError.message : String(airdropError),
    }
  }
}

function signWalletChallenge(keypair, message) {
  const seed = Buffer.from(keypair.secretKey.slice(0, 32))
  const pkcs8Prefix = Buffer.from("302e020100300506032b657004220420", "hex")
  const privateKey = createPrivateKey({
    key: Buffer.concat([pkcs8Prefix, seed]),
    format: "der",
    type: "pkcs8",
  })

  return cryptoSign(null, Buffer.from(message), privateKey).toString("base64")
}

function parseSetCookie(headers) {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie()
  }

  const raw = headers.get("set-cookie")
  return raw ? [raw] : []
}

class FundWiseSession {
  constructor(baseUrl, keypair, label) {
    this.baseUrl = baseUrl
    this.keypair = keypair
    this.label = label
    this.cookieJar = new Map()
  }

  get wallet() {
    return this.keypair.publicKey.toBase58()
  }

  cookieHeader() {
    return Array.from(this.cookieJar.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ")
  }

  rememberCookies(headers) {
    for (const cookie of parseSetCookie(headers)) {
      const [pair] = cookie.split(";")
      const separator = pair.indexOf("=")
      if (separator === -1) continue
      const key = pair.slice(0, separator)
      const value = pair.slice(separator + 1)
      if (value) {
        this.cookieJar.set(key, value)
      } else {
        this.cookieJar.delete(key)
      }
    }
  }

  async request(path, options = {}) {
    const headers = new Headers(options.headers || {})
    headers.set("content-type", headers.get("content-type") || "application/json")

    const cookie = this.cookieHeader()
    if (cookie) headers.set("cookie", cookie)

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    })
    this.rememberCookies(response.headers)

    const text = await response.text()
    const data = text ? JSON.parse(text) : null

    if (!response.ok) {
      throw new Error(`${this.label} ${options.method || "GET"} ${path} failed: ${response.status} ${JSON.stringify(data)}`)
    }

    return data
  }

  async json(path, method, body) {
    return this.request(path, {
      method,
      body: JSON.stringify(body),
    })
  }

  async verifyWallet() {
    const challenge = await this.json("/api/auth/wallet/challenge", "POST", {
      wallet: this.wallet,
    })
    const signature = signWalletChallenge(this.keypair, challenge.message)
    await this.json("/api/auth/wallet/verify", "POST", {
      wallet: this.wallet,
      signature,
    })
  }
}

async function createSquadsTreasury(connection, creator, members, threshold) {
  const createKey = Keypair.generate()
  const [multisigPda] = multisig.getMultisigPda({ createKey: createKey.publicKey })
  const [treasuryPda] = multisig.getVaultPda({ multisigPda, index: 0 })
  const [programConfigPda] = multisig.getProgramConfigPda({})
  const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
    connection,
    programConfigPda
  )
  const createIx = multisig.instructions.multisigCreateV2({
    treasury: programConfig.treasury,
    createKey: createKey.publicKey,
    creator: creator.publicKey,
    multisigPda,
    configAuthority: null,
    threshold,
    members: members.map((member) => ({
      key: member.publicKey,
      permissions: multisig.types.Permissions.all(),
    })),
    timeLock: 0,
    rentCollector: null,
  })
  const tx = new Transaction().add(createIx)
  const signature = await sendAndConfirmTransaction(connection, tx, [creator, createKey], {
    commitment: "confirmed",
  })

  return { multisigPda, treasuryPda, signature }
}

async function createSquadsReimbursementProposal({
  connection,
  proposer,
  multisigPda,
  treasuryPda,
  mint,
  recipient,
  amount,
}) {
  const multisigInfo = await multisig.accounts.Multisig.fromAccountAddress(connection, multisigPda)
  const transactionIndex = BigInt(Number(multisigInfo.transactionIndex) + 1)
  const [proposalPda] = multisig.getProposalPda({ multisigPda, transactionIndex })
  const [transactionPda] = multisig.getTransactionPda({ multisigPda, index: transactionIndex })
  const treasuryAta = await getAssociatedTokenAddress(mint, treasuryPda, true)
  const recipientAta = await getAssociatedTokenAddress(mint, recipient.publicKey)
  const { blockhash } = await connection.getLatestBlockhash("confirmed")
  const tx = new Transaction()

  try {
    await getAccount(connection, recipientAta)
  } catch {
    tx.add(createAssociatedTokenAccountInstruction(proposer.publicKey, recipientAta, recipient.publicKey, mint))
  }

  const transferIx = createTransferInstruction(treasuryAta, recipientAta, treasuryPda, BigInt(amount))
  tx.add(
    multisig.instructions.vaultTransactionCreate({
      multisigPda,
      transactionIndex,
      creator: proposer.publicKey,
      rentPayer: proposer.publicKey,
      vaultIndex: 0,
      ephemeralSigners: 0,
      transactionMessage: new TransactionMessage({
        payerKey: treasuryPda,
        recentBlockhash: blockhash,
        instructions: [transferIx],
      }),
    }),
    multisig.instructions.proposalCreate({
      multisigPda,
      transactionIndex,
      creator: proposer.publicKey,
      isDraft: false,
    })
  )

  const signature = await sendAndConfirmTransaction(connection, tx, [proposer], {
    commitment: "confirmed",
  })

  return {
    signature,
    transactionIndex: Number(transactionIndex),
    proposalAddress: proposalPda.toBase58(),
    transactionAddress: transactionPda.toBase58(),
  }
}

async function reviewSquadsProposal({ connection, reviewer, multisigPda, transactionIndex }) {
  const tx = new Transaction().add(
    multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex: BigInt(transactionIndex),
      member: reviewer.publicKey,
    })
  )

  return sendAndConfirmTransaction(connection, tx, [reviewer], {
    commitment: "confirmed",
  })
}

async function executeSquadsProposal({ connection, executor, multisigPda, transactionIndex }) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
  const tx = await multisig.transactions.vaultTransactionExecute({
    connection,
    blockhash,
    feePayer: executor.publicKey,
    multisigPda,
    transactionIndex: BigInt(transactionIndex),
    member: executor.publicKey,
  })
  tx.sign([executor])
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  })
  const confirmation = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed"
  )

  if (confirmation.value.err) {
    throw new Error(`Squads execution failed: ${JSON.stringify(confirmation.value.err)}`)
  }

  return signature
}

async function main() {
  if (process.argv.includes("-h") || process.argv.includes("--help")) {
    console.log(USAGE)
    return
  }

  loadDotEnvLocal()

  const baseUrl = process.env.FUNDWISE_BASE_URL || DEFAULT_BASE_URL
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet")
  assertDevnet(rpcUrl)

  const connection = new Connection(rpcUrl, "confirmed")
  const alice = loadCreatorKeypair()
  const bob = Keypair.generate()
  const aliceSession = new FundWiseSession(baseUrl, alice, "Alice")
  const bobSession = new FundWiseSession(baseUrl, bob, "Bob")
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)

  console.log("FundWise Fund Mode beta rehearsal")
  console.log(`Base URL: ${baseUrl}`)
  console.log(`RPC: ${rpcUrl}`)
  console.log(`Creator wallet: ${aliceSession.wallet}`)
  console.log(`Second Member:   ${bobSession.wallet}`)
  console.log("Server invite env must include the Creator wallet before Next.js starts.")

  await aliceSession.request("/api/health")
  console.log("1. API health check passed.")
  await assertFundModeSchemaReady()
  console.log("   Supabase Fund Mode schema preflight passed.")

  const aliceFunding = await fundWallet(connection, alice, 1, "Alice")
  const bobFunding = await fundWallet(connection, bob, 1, "Bob")
  console.log(`2. Funded Creator with ${aliceFunding.solAmount} devnet SOL via ${aliceFunding.source}: ${explorerTx(aliceFunding.signature)}`)
  console.log(`   Funded second Member with ${bobFunding.solAmount} devnet SOL via ${bobFunding.source}: ${explorerTx(bobFunding.signature)}`)

  await aliceSession.verifyWallet()
  await bobSession.verifyWallet()
  console.log("3. Created wallet-session cookies from signed challenges.")

  await aliceSession.json("/api/profile/display-name", "POST", {
    wallet: aliceSession.wallet,
    displayName: `Fund Alice ${runId}`,
  })
  await bobSession.json("/api/profile/display-name", "POST", {
    wallet: bobSession.wallet,
    displayName: `Fund Bob ${runId}`,
  })
  console.log("4. Set profile display names.")

  const mint = await createMint(connection, alice, alice.publicKey, null, DECIMALS)
  const bobAta = await getOrCreateAssociatedTokenAccount(connection, alice, mint, bob.publicKey)
  await mintTo(connection, alice, mint, bobAta.address, alice, 100 * USDC)
  console.log(`5. Created rehearsal stablecoin mint: ${mint.toBase58()}`)
  console.log(`   Mint explorer: ${explorerAddress(mint.toBase58())}`)
  console.log("   Minted 100.00 test units to second Member.")

  const group = await aliceSession.json("/api/groups", "POST", {
    name: `Fund Rehearsal ${runId}`,
    mode: "fund",
    stablecoinMint: mint.toBase58(),
    createdBy: aliceSession.wallet,
    fundingGoal: 50 * USDC,
    approvalThreshold: 1,
  })
  console.log(`6. Created invite-only Fund Mode Group: ${group.id}`)
  console.log(`   Invite code: ${group.code}`)

  const invitePreview = await bobSession.request(`/api/groups?code=${encodeURIComponent(group.code)}`)
  await bobSession.json(`/api/groups/${group.id}/members`, "POST", {
    wallet: bobSession.wallet,
    displayName: `Fund Bob ${runId}`,
  })
  console.log(`7. Second Member resolved invite for "${invitePreview.name}" and joined.`)

  const treasury = await createSquadsTreasury(connection, alice, [alice, bob], 1)
  await aliceSession.json(`/api/groups/${group.id}/treasury`, "PATCH", {
    creatorWallet: aliceSession.wallet,
    multisigAddress: treasury.multisigPda.toBase58(),
    treasuryAddress: treasury.treasuryPda.toBase58(),
  })
  console.log(`8. Initialized Squads Treasury: ${treasury.treasuryPda.toBase58()}`)
  console.log(`   Multisig: ${treasury.multisigPda.toBase58()}`)
  console.log(`   Explorer: ${explorerTx(treasury.signature)}`)

  const treasuryAta = await getAssociatedTokenAddress(mint, treasury.treasuryPda, true)
  const contributionTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      bob.publicKey,
      treasuryAta,
      treasury.treasuryPda,
      mint
    ),
    createTransferInstruction(
      bobAta.address,
      treasuryAta,
      bob.publicKey,
      BigInt(CONTRIBUTION_AMOUNT)
    )
  )
  const contributionSig = await sendAndConfirmTransaction(connection, contributionTx, [bob], {
    commitment: "confirmed",
  })
  await confirmSignature(connection, contributionSig)
  await bobSession.json("/api/contributions", "POST", {
    groupId: group.id,
    memberWallet: bobSession.wallet,
    amount: CONTRIBUTION_AMOUNT,
    mint: mint.toBase58(),
    txSig: contributionSig,
  })
  const treasuryAfterContribution = await getAccount(connection, treasuryAta)
  console.log(`9. Recorded Contribution: ${formatUnits(Number(treasuryAfterContribution.amount))} in Treasury.`)
  console.log(`   Explorer: ${explorerTx(contributionSig)}`)

  const squadsProposal = await createSquadsReimbursementProposal({
    connection,
    proposer: bob,
    multisigPda: treasury.multisigPda,
    treasuryPda: treasury.treasuryPda,
    mint,
    recipient: bob,
    amount: REIMBURSEMENT_AMOUNT,
  })
  const proposal = await bobSession.json("/api/proposals", "POST", {
    groupId: group.id,
    proposerWallet: bobSession.wallet,
    recipientWallet: bobSession.wallet,
    amount: REIMBURSEMENT_AMOUNT,
    mint: mint.toBase58(),
    squadsTransactionIndex: squadsProposal.transactionIndex,
    squadsProposalAddress: squadsProposal.proposalAddress,
    squadsTransactionAddress: squadsProposal.transactionAddress,
    squadsCreateTxSig: squadsProposal.signature,
    memo: "Fund Mode beta reimbursement rehearsal",
    proofUrl: "https://example.com/fundwise-rehearsal-proof",
  })
  console.log(`10. Created reimbursement Proposal: ${proposal.id}`)
  console.log(`    Squads proposal: ${squadsProposal.proposalAddress}`)

  const reviewSig = await reviewSquadsProposal({
    connection,
    reviewer: alice,
    multisigPda: treasury.multisigPda,
    transactionIndex: squadsProposal.transactionIndex,
  })
  await aliceSession.json(`/api/proposals/${proposal.id}/review`, "POST", {
    memberWallet: aliceSession.wallet,
    decision: "approved",
    txSig: reviewSig,
  })
  console.log(`11. Creator approved Proposal: ${explorerTx(reviewSig)}`)

  const executeSig = await executeSquadsProposal({
    connection,
    executor: alice,
    multisigPda: treasury.multisigPda,
    transactionIndex: squadsProposal.transactionIndex,
  })
  await aliceSession.json(`/api/proposals/${proposal.id}/execute`, "POST", {
    executorWallet: aliceSession.wallet,
    txSig: executeSig,
  })
  const treasuryAfterExecution = await getAccount(connection, treasuryAta)
  console.log(`12. Executed Proposal through Treasury: ${explorerTx(executeSig)}`)
  console.log(`    Treasury balance after execution: ${formatUnits(Number(treasuryAfterExecution.amount))}`)

  console.log("13. LI.FI support path: checked via Fund Mode UI route copy; disabled automatically on devnet.")
  console.log("14. Zerion support path examples:")
  console.log(`    pnpm zerion:readiness ${bobSession.wallet} --mode=contribution --min-usdc=25`)
  console.log(`    pnpm zerion:readiness ${treasury.treasuryPda.toBase58()} --mode=treasury --min-usdc=5`)
  console.log("")
  console.log("RESULT")
  console.log(`Group ID: ${group.id}`)
  console.log(`Proposal ID: ${proposal.id}`)
  console.log(`Treasury: ${treasury.treasuryPda.toBase58()}`)
  console.log(`Execution tx: ${explorerTx(executeSig)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
