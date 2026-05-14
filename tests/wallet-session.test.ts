import { Keypair } from "@solana/web3.js"
import { describe, expect, it, vi } from "vitest"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit"
import {
  assertWalletChallengeContext,
  buildWalletChallengeMessage,
  createSignedCookieValue,
  createWalletChallengePayload,
  readSignedCookieValue,
  verifyWalletSignature,
} from "@/lib/server/wallet-session"

const origin = "https://fundwise.fun"
const wallet = Keypair.generate().publicKey.toBase58()

describe("wallet challenge message", () => {
  it("binds the signed message to origin, cluster, wallet, nonce, and expiry", () => {
    const challenge = createWalletChallengePayload(wallet, {
      origin,
      cluster: "mainnet-beta",
    })

    const message = buildWalletChallengeMessage(challenge)

    expect(message).toContain("FundWise wallet verification")
    expect(message).toContain(`Origin: ${origin}`)
    expect(message).toContain("Cluster: mainnet-beta")
    expect(message).toContain(`Wallet: ${wallet}`)
    expect(message).toContain(`Nonce: ${challenge.nonce}`)
    expect(message).toContain("Sign this message to authorize protected FundWise actions in this browser.")
  })

  it("rejects a challenge replayed on a different origin", () => {
    const challenge = createWalletChallengePayload(wallet, {
      origin,
      cluster: "mainnet-beta",
    })

    expect(() =>
      assertWalletChallengeContext(challenge, {
        origin: "https://evil.example",
        cluster: "mainnet-beta",
      })
    ).toThrow(FundWiseError)
  })

  it("rejects a challenge replayed on a different Solana cluster", () => {
    const challenge = createWalletChallengePayload(wallet, {
      origin,
      cluster: "mainnet-beta",
    })

    expect(() =>
      assertWalletChallengeContext(challenge, {
        origin,
        cluster: "devnet",
      })
    ).toThrow(FundWiseError)
  })

  it("rejects expired signed cookie payloads", async () => {
    vi.stubEnv("FUNDWISE_SESSION_SECRET", "test-secret")
    const signed = await createSignedCookieValue({
      wallet,
      issuedAt: 1,
      expiresAt: 2,
    })

    await expect(readSignedCookieValue<{ wallet: string; issuedAt: number; expiresAt: number }>(signed)).resolves.toBeNull()
    vi.unstubAllEnvs()
  })

  it("returns false for an invalid wallet signature", async () => {
    const signature = Buffer.from(new Uint8Array(64)).toString("base64")

    await expect(
      verifyWalletSignature(wallet, "FundWise test message", signature)
    ).resolves.toBe(false)
  })
})

describe("wallet auth rate limiting", () => {
  it("allows requests until the configured bucket limit is reached", () => {
    const store = new Map()
    const first = checkRateLimit({
      key: "wallet-challenge:wallet:abc",
      limit: 2,
      windowMs: 60_000,
      now: 1_000,
      store,
    })
    const second = checkRateLimit({
      key: "wallet-challenge:wallet:abc",
      limit: 2,
      windowMs: 60_000,
      now: 2_000,
      store,
    })
    const third = checkRateLimit({
      key: "wallet-challenge:wallet:abc",
      limit: 2,
      windowMs: 60_000,
      now: 3_000,
      store,
    })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
  })

  it("resets the bucket after the configured window", () => {
    const store = new Map()
    expect(
      checkRateLimit({ key: "wallet-verify:ip:1", limit: 1, windowMs: 1_000, now: 1_000, store }).allowed
    ).toBe(true)
    expect(
      checkRateLimit({ key: "wallet-verify:ip:1", limit: 1, windowMs: 1_000, now: 1_500, store }).allowed
    ).toBe(false)
    expect(
      checkRateLimit({ key: "wallet-verify:ip:1", limit: 1, windowMs: 1_000, now: 2_001, store }).allowed
    ).toBe(true)
  })

  it("uses Cloudflare IP before forwarded headers", () => {
    const request = new Request("https://fundwise.fun/api/auth/wallet/challenge", {
      headers: {
        "cf-connecting-ip": "203.0.113.1",
        "x-forwarded-for": "198.51.100.1, 198.51.100.2",
      },
    })

    expect(getClientIp(request)).toBe("203.0.113.1")
  })
})
