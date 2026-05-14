import { cookies } from "next/headers"
import { PublicKey } from "@solana/web3.js"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { assertWalletIsAllowed } from "@/lib/server/sanctions-screening"
import { getFundWiseClusterName, type FundWiseCluster } from "@/lib/solana-cluster"

const WALLET_CHALLENGE_COOKIE_NAME = "fundwise_wallet_challenge"
const WALLET_SESSION_COOKIE_NAME = "fundwise_wallet_session"

export const FUNDWISE_WALLET_CHALLENGE_COOKIE =
  process.env.NODE_ENV === "production"
    ? `__Host-${WALLET_CHALLENGE_COOKIE_NAME}`
    : WALLET_CHALLENGE_COOKIE_NAME
export const FUNDWISE_WALLET_SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? `__Host-${WALLET_SESSION_COOKIE_NAME}`
    : WALLET_SESSION_COOKIE_NAME

const CHALLENGE_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export type WalletChallengePayload = {
  wallet: string
  nonce: string
  issuedAt: number
  expiresAt: number
  origin: string
  cluster: FundWiseCluster
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

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ""
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize))
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64Decode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function createNonce() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

async function getHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

async function signCookiePayload(payload: string) {
  const key = await getHmacKey()
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload))
  return base64UrlEncode(new Uint8Array(signature))
}

export async function createSignedCookieValue(
  payload: WalletChallengePayload | WalletSessionPayload
) {
  const encodedPayload = base64UrlEncode(textEncoder.encode(JSON.stringify(payload)))
  const signature = await signCookiePayload(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export async function readSignedCookieValue<T extends { expiresAt: number }>(rawValue?: string) {
  if (!rawValue) {
    return null
  }

  const [encodedPayload, signature] = rawValue.split(".")

  if (!encodedPayload || !signature) {
    return null
  }

  try {
    const key = await getHmacKey()
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      textEncoder.encode(encodedPayload)
    )

    if (!verified) {
      return null
    }

    const payload = JSON.parse(textDecoder.decode(base64UrlDecode(encodedPayload))) as T

    if (payload.expiresAt <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function normalizeWalletAddress(wallet: string) {
  return new PublicKey(wallet).toBase58()
}

export function getRequestOrigin(request: Request) {
  return new URL(request.url).origin
}

export function createWalletChallengePayload(
  wallet: string,
  context: { origin: string; cluster?: FundWiseCluster }
): WalletChallengePayload {
  const issuedAt = Date.now()
  return {
    wallet: normalizeWalletAddress(wallet),
    nonce: createNonce(),
    issuedAt,
    expiresAt: issuedAt + CHALLENGE_TTL_MS,
    origin: context.origin,
    cluster: context.cluster ?? getFundWiseClusterName(),
  }
}

export function assertWalletChallengeContext(
  payload: WalletChallengePayload,
  context: { origin: string; cluster?: FundWiseCluster }
) {
  const expectedCluster = context.cluster ?? getFundWiseClusterName()

  if (payload.origin !== context.origin) {
    throw new FundWiseError("Wallet challenge does not match this FundWise origin. Start verification again.", 401)
  }

  if (payload.cluster !== expectedCluster) {
    throw new FundWiseError("Wallet challenge does not match this Solana cluster. Start verification again.", 401)
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
    `Origin: ${payload.origin}`,
    `Cluster: ${payload.cluster}`,
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
  const publicKey = new Uint8Array(new PublicKey(wallet).toBytes())
  const signature = new Uint8Array(base64Decode(signatureBase64))
  const cryptoKey = await crypto.subtle.importKey("raw", publicKey, "Ed25519", false, ["verify"])

  return crypto.subtle.verify(
    "Ed25519",
    cryptoKey,
    signature,
    textEncoder.encode(message)
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

  assertWalletIsAllowed(session.wallet)

  return session
}

export async function writeWalletChallengeCookie(payload: WalletChallengePayload) {
  const cookieStore = await cookies()
  cookieStore.set(
    FUNDWISE_WALLET_CHALLENGE_COOKIE,
    await createSignedCookieValue(payload),
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
    await createSignedCookieValue(payload),
    getCookieOptions(payload.expiresAt)
  )
}
