import { describe, expect, it } from "vitest"
import { validateExpenseLedgerInput } from "@/lib/server/fundwise-mutations"

const expectedMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

describe("validateExpenseLedgerInput", () => {
  it("accepts positive integer amounts with splits that sum exactly", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: 600 },
          { wallet: "bob", share: 400 },
        ],
      })
    ).not.toThrow()
  })

  it("rejects non-positive or unsafe Expense amounts", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 0,
        mint: expectedMint,
        expectedMint,
        splits: [{ wallet: "alice", share: 0 }],
      })
    ).toThrow("Expense amount must be a positive integer token amount.")

    expect(() =>
      validateExpenseLedgerInput({
        amount: Number.MAX_SAFE_INTEGER + 1,
        mint: expectedMint,
        expectedMint,
        splits: [{ wallet: "alice", share: Number.MAX_SAFE_INTEGER + 1 }],
      })
    ).toThrow("Expense amount must be a positive integer token amount.")
  })

  it("rejects split totals that do not match the Expense amount", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: 500 },
          { wallet: "bob", share: 400 },
        ],
      })
    ).toThrow("Expense split shares must add up to the full Expense amount.")
  })

  it("rejects negative, unsafe, empty, or duplicate split shares", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [{ wallet: "alice", share: -1000 }],
      })
    ).toThrow("Expense split shares must be non-negative integer token amounts.")

    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [],
      })
    ).toThrow("Expense must include at least one split.")

    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: 500 },
          { wallet: "alice", share: 500 },
        ],
      })
    ).toThrow("Expense split wallets must be unique.")
  })

  it("rejects Expenses for the wrong Group stablecoin mint", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ",
        expectedMint,
        splits: [{ wallet: "alice", share: 1000 }],
      })
    ).toThrow("Expense mint does not match this Group stablecoin.")
  })
})
