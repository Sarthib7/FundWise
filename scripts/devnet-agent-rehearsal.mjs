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
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token"

const DEVNET_HINT = "devnet"
const DEFAULT_BASE_URL = "http://127.0.0.1:3000"
const DECIMALS = 6
const USDC = 1_000_000

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

function assertDevnet(rpcUrl) {
  if (!rpcUrl.toLowerCase().includes(DEVNET_HINT)) {
    throw new Error(`Refusing to run Settlement rehearsal outside devnet. RPC URL: ${rpcUrl}`)
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

function loadLocalDevnetFunder() {
  const configuredPath =
    process.env.FUNDWISE_REHEARSAL_FUNDER_KEYPAIR ||
    `${homedir()}/.config/solana/id.json`

  if (!existsSync(configuredPath)) {
    return null
  }

  const secretKey = JSON.parse(readFileSync(configuredPath, "utf8"))
  return Keypair.fromSecretKey(Uint8Array.from(secretKey))
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

async function fundWallet(connection, wallet, solAmount, label) {
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
      label,
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

async function main() {
  loadDotEnvLocal()

  const baseUrl = process.env.FUNDWISE_BASE_URL || DEFAULT_BASE_URL
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet")
  assertDevnet(rpcUrl)

  const connection = new Connection(rpcUrl, "confirmed")
  const alice = Keypair.generate()
  const bob = Keypair.generate()
  const aliceSession = new FundWiseSession(baseUrl, alice, "Alice")
  const bobSession = new FundWiseSession(baseUrl, bob, "Bob")
  const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)

  console.log("FundWise devnet agent rehearsal")
  console.log(`Base URL: ${baseUrl}`)
  console.log(`RPC: ${rpcUrl}`)
  console.log(`Alice wallet: ${aliceSession.wallet}`)
  console.log(`Bob wallet:   ${bobSession.wallet}`)

  await aliceSession.request("/api/health")
  console.log("1. API health check passed.")

  const aliceFunding = await fundWallet(connection, alice, 1, "Alice")
  const bobFunding = await fundWallet(connection, bob, 1, "Bob")
  console.log(`2. Funded Alice with ${aliceFunding.solAmount} devnet SOL via ${aliceFunding.source}: ${explorerTx(aliceFunding.signature)}`)
  if (aliceFunding.airdropError) {
    console.log(`   Alice public airdrop fallback reason: ${aliceFunding.airdropError}`)
  }
  console.log(`   Funded Bob with ${bobFunding.solAmount} devnet SOL via ${bobFunding.source}: ${explorerTx(bobFunding.signature)}`)
  if (bobFunding.airdropError) {
    console.log(`   Bob public airdrop fallback reason: ${bobFunding.airdropError}`)
  }

  await aliceSession.verifyWallet()
  await bobSession.verifyWallet()
  console.log("3. Created wallet-session cookies from signed challenges.")

  await aliceSession.json("/api/profile/display-name", "POST", {
    wallet: aliceSession.wallet,
    displayName: `Agent Alice ${runId}`,
  })
  await bobSession.json("/api/profile/display-name", "POST", {
    wallet: bobSession.wallet,
    displayName: `Agent Bob ${runId}`,
  })
  console.log("4. Set profile display names.")

  const mint = await createMint(connection, alice, alice.publicKey, null, DECIMALS)
  const aliceAta = await getOrCreateAssociatedTokenAccount(connection, alice, mint, alice.publicKey)
  const bobAta = await getOrCreateAssociatedTokenAccount(connection, alice, mint, bob.publicKey)
  await mintTo(connection, alice, mint, bobAta.address, alice, 100 * USDC)
  console.log(`5. Created rehearsal stablecoin mint: ${mint.toBase58()}`)
  console.log(`   Mint explorer: ${explorerAddress(mint.toBase58())}`)
  console.log(`   Minted 100.00 test units to Bob for Settlement.`)

  const group = await aliceSession.json("/api/groups", "POST", {
    name: `Agent Rehearsal ${runId}`,
    mode: "split",
    stablecoinMint: mint.toBase58(),
    createdBy: aliceSession.wallet,
  })
  console.log(`6. Created Split Mode Group: ${group.id}`)
  console.log(`   Invite code: ${group.code}`)

  const invitePreview = await bobSession.request(`/api/groups?code=${encodeURIComponent(group.code)}`)
  await bobSession.json(`/api/groups/${group.id}/members`, "POST", {
    wallet: bobSession.wallet,
    displayName: `Agent Bob ${runId}`,
  })
  console.log(`7. Bob resolved invite for "${invitePreview.name}" and joined via Group invite.`)

  const dinnerAmount = 42 * USDC
  const ridesAmount = 10 * USDC
  await aliceSession.json("/api/expenses", "POST", {
    groupId: group.id,
    payer: aliceSession.wallet,
    createdBy: aliceSession.wallet,
    amount: dinnerAmount,
    mint: mint.toBase58(),
    memo: "Agent dinner rehearsal",
    category: "food",
    splitMethod: "equal",
    splits: [
      { wallet: aliceSession.wallet, share: dinnerAmount / 2 },
      { wallet: bobSession.wallet, share: dinnerAmount / 2 },
    ],
  })
  console.log("8. Alice added Expense: 42.00 split equally.")

  await bobSession.json("/api/expenses", "POST", {
    groupId: group.id,
    payer: bobSession.wallet,
    createdBy: bobSession.wallet,
    amount: ridesAmount,
    mint: mint.toBase58(),
    memo: "Agent rideshare rehearsal",
    category: "transport",
    splitMethod: "equal",
    splits: [
      { wallet: aliceSession.wallet, share: ridesAmount / 2 },
      { wallet: bobSession.wallet, share: ridesAmount / 2 },
    ],
  })
  console.log("9. Bob added Expense: 10.00 split equally.")

  const ledger = await bobSession.request(`/api/groups/${group.id}/ledger`)
  const settlement = ledger.suggestedSettlements?.[0]

  if (!settlement) {
    throw new Error("No suggested Settlement found after Expenses.")
  }

  console.log("10. Live suggested Settlement:")
  console.log(`    From:   ${settlement.from}`)
  console.log(`    To:     ${settlement.to}`)
  console.log(`    Amount: ${formatUnits(settlement.amount)} test stablecoin units`)

  if (settlement.from !== bobSession.wallet || settlement.to !== aliceSession.wallet) {
    throw new Error("Unexpected Settlement direction. Refusing to send transaction.")
  }

  console.log("11. Transaction summary before send:")
  console.log(`    Cluster: devnet`)
  console.log(`    Sender:  ${settlement.from}`)
  console.log(`    Recipient: ${settlement.to}`)
  console.log(`    Mint:    ${mint.toBase58()}`)
  console.log(`    Amount:  ${formatUnits(settlement.amount)}`)

  const signature = await transfer(
    connection,
    bob,
    bobAta.address,
    aliceAta.address,
    bob.publicKey,
    settlement.amount
  )
  await confirmSignature(connection, signature)
  console.log(`12. Settlement transaction confirmed: ${signature}`)
  console.log(`    Explorer: ${explorerTx(signature)}`)

  const receipt = await bobSession.json("/api/settlements", "POST", {
    groupId: group.id,
    fromWallet: settlement.from,
    toWallet: settlement.to,
    amount: settlement.amount,
    mint: mint.toBase58(),
    txSig: signature,
  })
  console.log(`13. Recorded FundWise Settlement Receipt: ${receipt.id}`)

  const finalLedger = await bobSession.request(`/api/groups/${group.id}/ledger`)
  console.log(`14. Final suggested Settlements: ${finalLedger.suggestedSettlements.length}`)
  console.log("")
  console.log("RESULT")
  console.log(`Group ID: ${group.id}`)
  console.log(`Receipt ID: ${receipt.id}`)
  console.log(`Devnet transaction URL: ${explorerTx(signature)}`)
  console.log(`FundWise receipt path: /groups/${group.id}/settlements/${receipt.id}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
