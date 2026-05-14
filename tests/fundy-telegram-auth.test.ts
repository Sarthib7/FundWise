import { describe, expect, it, vi } from "vitest"
import { FundWiseError } from "@/lib/server/fundwise-error"
import {
  createTelegramLinkCode,
  hashTelegramLinkCode,
  normalizeTelegramId,
  normalizeTelegramLinkCode,
  requireFundyServiceAuth,
  TELEGRAM_LINK_CODE_TTL_MS,
} from "@/lib/server/fundy-telegram-auth"

describe("Fundy Telegram auth helpers", () => {
  it("uses five-minute Telegram link-code TTLs", () => {
    expect(TELEGRAM_LINK_CODE_TTL_MS).toBe(5 * 60 * 1000)
  })

  it("creates readable FW-prefixed codes", () => {
    const code = createTelegramLinkCode(new Uint8Array([0, 1, 2, 3, 4, 5]))

    expect(code).toBe("FW-ABCDEF")
  })

  it("normalizes link codes before hashing", async () => {
    await expect(hashTelegramLinkCode(" fw-abc234 ")).resolves.toBe(
      await hashTelegramLinkCode("FW-ABC234")
    )
  })

  it("rejects malformed link codes", () => {
    expect(() => normalizeTelegramLinkCode("FW-TOO-LONG")).toThrow(FundWiseError)
    expect(() => normalizeTelegramLinkCode("NOPE12")).toThrow(FundWiseError)
    expect(() => normalizeTelegramLinkCode(null)).toThrow(FundWiseError)
  })

  it("normalizes Telegram user ids without losing precision", () => {
    expect(normalizeTelegramId(12345)).toBe("12345")
    expect(normalizeTelegramId("9876543210123456789")).toBe("9876543210123456789")
  })

  it("rejects invalid Telegram user ids", () => {
    expect(() => normalizeTelegramId(0)).toThrow(FundWiseError)
    expect(() => normalizeTelegramId("-100123")).toThrow(FundWiseError)
    expect(() => normalizeTelegramId("abc")).toThrow(FundWiseError)
  })

  it("requires the configured Fundy service bearer token", async () => {
    vi.stubEnv("FUNDWISE_SERVICE_API_KEY", "service-secret")

    await expect(
      requireFundyServiceAuth(
        new Request("https://fundwise.fun/api/telegram/link", {
          headers: { authorization: "Bearer service-secret" },
        })
      )
    ).resolves.toBeUndefined()

    await expect(
      requireFundyServiceAuth(
        new Request("https://fundwise.fun/api/telegram/link", {
          headers: { authorization: "Bearer wrong" },
        })
      )
    ).rejects.toThrow(FundWiseError)

    vi.unstubAllEnvs()
  })
})
