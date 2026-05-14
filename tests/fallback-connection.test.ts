import { describe, it, expect, vi } from "vitest"
import { Connection, PublicKey, type Commitment } from "@solana/web3.js"
import {
  createFundWiseConnection,
  __isRetriableRpcError as isRetriableRpcError,
} from "../lib/fallback-connection"

const FAKE_WALLET = new PublicKey("11111111111111111111111111111111")

function makeFakeConnection() {
  return new Connection("http://fake.invalid")
}

describe("isRetriableRpcError", () => {
  it("recognizes 429 by numeric status property", () => {
    expect(isRetriableRpcError({ status: 429 })).toBe(true)
  })

  it("recognizes 503 by numeric status property", () => {
    expect(isRetriableRpcError({ status: 503 })).toBe(true)
  })

  it("recognizes ECONNRESET by code", () => {
    expect(isRetriableRpcError({ code: "ECONNRESET" })).toBe(true)
  })

  it("recognizes rate-limit phrases in error messages", () => {
    expect(isRetriableRpcError(new Error("Server responded with 429 Too Many Requests"))).toBe(true)
    expect(isRetriableRpcError(new Error("rate limit exceeded"))).toBe(true)
    expect(isRetriableRpcError(new Error("fetch failed"))).toBe(true)
    expect(isRetriableRpcError(new Error("request timed out"))).toBe(true)
  })

  it("rejects non-retriable application errors", () => {
    expect(isRetriableRpcError(new Error("Account not found"))).toBe(false)
    expect(isRetriableRpcError(new Error("Invalid public key"))).toBe(false)
    expect(isRetriableRpcError({ status: 404 })).toBe(false)
    expect(isRetriableRpcError({ status: 400 })).toBe(false)
  })

  it("handles null and undefined safely", () => {
    expect(isRetriableRpcError(null)).toBe(false)
    expect(isRetriableRpcError(undefined)).toBe(false)
  })
})

describe("createFundWiseConnection — single endpoint", () => {
  it("returns the inner connection without wrapping when only one endpoint is supplied", () => {
    const fake = makeFakeConnection()
    const factory = vi.fn((_url: string, _commitment: Commitment) => fake)
    const conn = createFundWiseConnection("confirmed", {
      endpoints: ["http://primary.invalid"],
      connectionFactory: factory,
    })
    expect(conn).toBe(fake)
    expect(factory).toHaveBeenCalledTimes(1)
  })
})

describe("createFundWiseConnection — fallback proxy", () => {
  it("uses the primary endpoint when it succeeds", async () => {
    const primary = makeFakeConnection()
    const secondary = makeFakeConnection()
    const primarySpy = vi.spyOn(primary, "getBalance").mockResolvedValue(123)
    const secondarySpy = vi.spyOn(secondary, "getBalance").mockResolvedValue(456)

    const conn = createFundWiseConnection("confirmed", {
      endpoints: ["http://primary.invalid", "http://secondary.invalid"],
      connectionFactory: (url) =>
        url === "http://primary.invalid" ? primary : secondary,
      onFallback: () => {},
    })

    expect(await conn.getBalance(FAKE_WALLET)).toBe(123)
    expect(primarySpy).toHaveBeenCalledTimes(1)
    expect(secondarySpy).not.toHaveBeenCalled()
  })

  it("falls through to the next endpoint on a retriable error", async () => {
    const primary = makeFakeConnection()
    const secondary = makeFakeConnection()
    vi.spyOn(primary, "getBalance").mockRejectedValue(new Error("429 Too Many Requests"))
    const secondarySpy = vi.spyOn(secondary, "getBalance").mockResolvedValue(999)
    const onFallback = vi.fn()

    const conn = createFundWiseConnection("confirmed", {
      endpoints: ["http://primary.invalid", "http://secondary.invalid"],
      connectionFactory: (url) =>
        url === "http://primary.invalid" ? primary : secondary,
      onFallback,
    })

    expect(await conn.getBalance(FAKE_WALLET)).toBe(999)
    expect(secondarySpy).toHaveBeenCalledTimes(1)
    expect(onFallback).toHaveBeenCalledTimes(1)
    expect(onFallback.mock.calls[0][0]).toMatchObject({
      endpoint: "http://primary.invalid",
      method: "getBalance",
    })
  })

  it("throws the last error when every endpoint fails with retriable errors", async () => {
    const primary = makeFakeConnection()
    const secondary = makeFakeConnection()
    vi.spyOn(primary, "getBalance").mockRejectedValue(new Error("429 first"))
    vi.spyOn(secondary, "getBalance").mockRejectedValue(new Error("503 second"))

    const conn = createFundWiseConnection("confirmed", {
      endpoints: ["http://primary.invalid", "http://secondary.invalid"],
      connectionFactory: (url) =>
        url === "http://primary.invalid" ? primary : secondary,
      onFallback: () => {},
    })

    await expect(conn.getBalance(FAKE_WALLET)).rejects.toThrow("503 second")
  })

  it("does not retry on non-retriable errors", async () => {
    const primary = makeFakeConnection()
    const secondary = makeFakeConnection()
    vi.spyOn(primary, "getBalance").mockRejectedValue(new Error("Invalid public key"))
    const secondarySpy = vi.spyOn(secondary, "getBalance").mockResolvedValue(1)

    const conn = createFundWiseConnection("confirmed", {
      endpoints: ["http://primary.invalid", "http://secondary.invalid"],
      connectionFactory: (url) =>
        url === "http://primary.invalid" ? primary : secondary,
      onFallback: () => {},
    })

    await expect(conn.getBalance(FAKE_WALLET)).rejects.toThrow("Invalid public key")
    expect(secondarySpy).not.toHaveBeenCalled()
  })
})
