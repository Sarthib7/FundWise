import { describe, it, expect } from "vitest"
import { parseUsdcAmount } from "../lib/parse-usdc-amount"

describe("parseUsdcAmount", () => {
  // ── Valid inputs ──

  it("parses a whole number", () => {
    const result = parseUsdcAmount("10")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.human).toBe("10")
      expect(result.smallestUnit).toBe("10000000")
    }
  })

  it("parses a decimal amount", () => {
    const result = parseUsdcAmount("10.5")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.smallestUnit).toBe("10500000")
    }
  })

  it("parses one microcent", () => {
    const result = parseUsdcAmount("0.000001")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.smallestUnit).toBe("1")
    }
  })

  it("parses zero-padded input", () => {
    const result = parseUsdcAmount("0010.5")
    expect(result.ok).toBe(false)
  })

  it("parses a large but safe amount", () => {
    const result = parseUsdcAmount("1000000")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.smallestUnit).toBe("1000000000000")
    }
  })

  it("parses an amount with trailing zeros", () => {
    const result = parseUsdcAmount("1.100")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.smallestUnit).toBe("1100000")
    }
  })

  it("parses a single digit zero prefix decimal", () => {
    const result = parseUsdcAmount("0.5")
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.smallestUnit).toBe("500000")
    }
  })

  it("parses integer zero is rejected", () => {
    const result = parseUsdcAmount("0")
    expect(result.ok).toBe(false)
  })

  // ── Invalid inputs ──

  it("rejects empty string", () => {
    const result = parseUsdcAmount("")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/enter/i)
  })

  it("rejects whitespace-only", () => {
    const result = parseUsdcAmount("   ")
    expect(result.ok).toBe(false)
  })

  it("rejects negative numbers", () => {
    const result = parseUsdcAmount("-5")
    expect(result.ok).toBe(false)
  })

  it("rejects too many decimal places", () => {
    const result = parseUsdcAmount("1.0000001")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/6 decimal/)
  })

  it("rejects alphabetic input", () => {
    const result = parseUsdcAmount("abc")
    expect(result.ok).toBe(false)
  })

  it("rejects exponential notation", () => {
    const result = parseUsdcAmount("1e6")
    expect(result.ok).toBe(false)
  })

  it("rejects a bare '.' (FW-056 audit)", () => {
    const result = parseUsdcAmount(".")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/plain number/)
  })

  it("accepts leading decimal like '.5'", () => {
    const result = parseUsdcAmount(".5")
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.smallestUnit).toBe("500000")
  })

  it("rejects special characters", () => {
    const result = parseUsdcAmount("10,00")
    expect(result.ok).toBe(false)
  })

  it("rejects multiple decimal points", () => {
    const result = parseUsdcAmount("1.2.3")
    expect(result.ok).toBe(false)
  })

  it("rejects leading zeros on multi-digit integer", () => {
    const result = parseUsdcAmount("010")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/leading zero/)
  })

  it("rejects amount that would exceed safe integer range", () => {
    const result = parseUsdcAmount("9999999999999999")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/too large/i)
  })

  it("rejects 0.0000000 (all-zero fractional)", () => {
    const result = parseUsdcAmount("0.000000")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/greater than zero/)
  })

  it("rejects Infinity", () => {
    const result = parseUsdcAmount("Infinity")
    expect(result.ok).toBe(false)
  })
})
