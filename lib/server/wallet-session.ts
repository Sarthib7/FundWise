import { createHmac, randomBytes, timingSafeEqual, webcrypto } from "node:crypto"
import { cookies } from "next/headers"
import { PublicKey } from "@solana/web3.js"
import { FundWiseError } from "@/lib/server/fundwise-error"

export const FUNDWISE_WALLET_CHALLENGE_COOKIE = "fundwise_wallet_challenge"
export const FUNDWISE_WALLET_SESSION_COOKIE = "fundwise_wallet_session"

const CHALLENGE_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export type WalletChallengePayload = {
  wallet: string
  nonce: string
  issuedAt: number
  expiresAt: number
}

export type WalletSessionPayload = {
  wallet: string
  issuedAt: number
  expiresAt: number
}

function getSessionSecret() {
  const secret = process.env.FUNDWISE_SESSION_SECRET

  if (!secret) {
    throw new FundWiseError("FUNDWISE_SESSION_SECRET is not configured.", 500)
  }

  return secret
}

function getCookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  }
}

function signCookiePayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")
}

export function createSignedCookieValue(payload: WalletChallengePayload | WalletSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = signCookiePayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function readSignedCookieValue<T extends { expiresAt: number }>(rawValue?: string) {
  if (!rawValue) {
    return null
  }

  const [encodedPayload, signature] = rawValue.split(".")

  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signCookiePayload(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null
  }

  if (!timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as T

    if (payload.expiresAt <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function createWalletChallengePayload(wallet: string): WalletChallengePayload {
  const issuedAt = Date.now()
  return {
    wallet,
    nonce: randomBytes(18).toString("base64url"),
    issuedAt,
    expiresAt: issuedAt + CHALLENGE_TTL_MS,
  }
}

export function createWalletSessionPayload(wallet: string): WalletSessionPayload {
  const issuedAt = Date.now()
  return {
    wallet,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_MS,
  }
}

export function buildWalletChallengeMessage(payload: WalletChallengePayload) {
  return [
    "FundWise wallet verification",
    "",
    `Wallet: ${payload.wallet}`,
    `Nonce: ${payload.nonce}`,
    `Issued At: ${new Date(payload.issuedAt).toISOString()}`,
    `Expires At: ${new Date(payload.expiresAt).toISOString()}`,
    "",
    "Sign this message to authorize protected FundWise actions in this browser.",
  ].join("\n")
}

export async function verifyWalletSignature(
  wallet: string,
  message: string,
  signatureBase64: string
) {
  const publicKey = new PublicKey(wallet).toBytes()
  const signature = Buffer.from(signatureBase64, "base64")
  const cryptoKey = await webcrypto.subtle.importKey("raw", publicKey, "Ed25519", false, ["verify"])

  return webcrypto.subtle.verify(
    "Ed25519",
    cryptoKey,
    signature,
    new TextEncoder().encode(message)
  )
}

export async function readWalletSession() {
  const cookieStore = await cookies()
  return readSignedCookieValue<WalletSessionPayload>(
    cookieStore.get(FUNDWISE_WALLET_SESSION_COOKIE)?.value
  )
}

export async function requireAuthenticatedWallet() {
  const session = await readWalletSession()

  if (!session) {
    throw new FundWiseError("Wallet verification required before accessing protected FundWise data.", 401)
  }

  return session
}

export async function writeWalletChallengeCookie(payload: WalletChallengePayload) {
  const cookieStore = await cookies()
  cookieStore.set(
    FUNDWISE_WALLET_CHALLENGE_COOKIE,
    createSignedCookieValue(payload),
    getCookieOptions(payload.expiresAt)
  )
}

export async function readWalletChallenge() {
  const cookieStore = await cookies()
  return readSignedCookieValue<WalletChallengePayload>(
    cookieStore.get(FUNDWISE_WALLET_CHALLENGE_COOKIE)?.value
  )
}

export async function clearWalletChallengeCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(FUNDWISE_WALLET_CHALLENGE_COOKIE)
}

export async function writeWalletSessionCookie(payload: WalletSessionPayload) {
  const cookieStore = await cookies()
  cookieStore.set(
    FUNDWISE_WALLET_SESSION_COOKIE,
    createSignedCookieValue(payload),
    getCookieOptions(payload.expiresAt)
  )
}
