import { describe, expect, it } from "vitest"
import { validateProposalInput } from "@/lib/server/mutations/proposal"

const expectedMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

describe("validateProposalInput", () => {
  it("accepts positive integer reimbursement Proposal amounts and trims memo text", () => {
    expect(
      validateProposalInput({
        amount: 2500,
        mint: expectedMint,
        expectedMint,
        memo: "  Hotel deposit  ",
        proofUrl: " https://example.com/receipt ",
      })
    ).toEqual({ memo: "Hotel deposit", proofUrl: "https://example.com/receipt" })
  })

  it("rejects invalid Proposal amounts, mints, long memos, and invalid proof links", () => {
    expect(() =>
      validateProposalInput({
        amount: 0,
        mint: expectedMint,
        expectedMint,
      })
    ).toThrow("Proposal amount must be a positive integer token amount.")

    expect(() =>
      validateProposalInput({
        amount: 2500,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ",
        expectedMint,
      })
    ).toThrow("Proposal mint does not match this Group stablecoin.")

    expect(() =>
      validateProposalInput({
        amount: 2500,
        mint: expectedMint,
        expectedMint,
        memo: "x".repeat(241),
      })
    ).toThrow("Proposal memo must be 240 characters or fewer.")

    expect(() =>
      validateProposalInput({
        amount: 2500,
        mint: expectedMint,
        expectedMint,
        proofUrl: "javascript:alert(1)",
      })
    ).toThrow("Proposal proof link must use HTTP or HTTPS.")
  })
})
