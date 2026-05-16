import { describe, expect, it } from "vitest"
import { computeSuggestedReimbursements } from "@/lib/expense-suggestions"

const stablecoinMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

function makeExpense(
  overrides: Partial<{
    id: string
    payer: string
    amount: number
    mint: string
    memo: string | null
    category: string | null
    created_at: string
    deleted_at: string | null
  }> = {}
) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    payer: "alice",
    amount: 1_000_000,
    mint: stablecoinMint,
    memo: "Dinner",
    category: "pool",
    created_at: "2026-05-15T00:00:00.000Z",
    deleted_at: null,
    ...overrides,
  }
}

describe("computeSuggestedReimbursements", () => {
  it("returns empty list for Split Mode Groups", () => {
    expect(
      computeSuggestedReimbursements({
        groupMode: "split",
        stablecoinMint,
        expenses: [makeExpense()],
        proposals: [],
      })
    ).toEqual([])
  })

  it("suggests reimbursement for pool-tagged expenses with no covering Proposal", () => {
    const suggestions = computeSuggestedReimbursements({
      groupMode: "fund",
      stablecoinMint,
      expenses: [makeExpense()],
      proposals: [],
    })
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0]).toMatchObject({
      payerWallet: "alice",
      amount: 1_000_000,
      mint: stablecoinMint,
    })
    expect(suggestions[0].memo).toMatch(/Dinner/)
  })

  it("ignores non-pool expenses", () => {
    const suggestions = computeSuggestedReimbursements({
      groupMode: "fund",
      stablecoinMint,
      expenses: [makeExpense({ category: "general" })],
      proposals: [],
    })
    expect(suggestions).toEqual([])
  })

  it("hides expenses already covered by a non-rejected Proposal", () => {
    const suggestions = computeSuggestedReimbursements({
      groupMode: "fund",
      stablecoinMint,
      expenses: [makeExpense({ id: "e1" })],
      proposals: [
        {
          recipient_wallet: "alice",
          amount: 1_000_000,
          mint: stablecoinMint,
          status: "pending",
          kind: "reimbursement",
        },
      ],
    })
    expect(suggestions).toEqual([])
  })

  it("still suggests when only a rejected Proposal covered it", () => {
    const suggestions = computeSuggestedReimbursements({
      groupMode: "fund",
      stablecoinMint,
      expenses: [makeExpense({ id: "e1" })],
      proposals: [
        {
          recipient_wallet: "alice",
          amount: 1_000_000,
          mint: stablecoinMint,
          status: "rejected",
          kind: "reimbursement",
        },
      ],
    })
    expect(suggestions).toHaveLength(1)
  })

  it("skips deleted expenses", () => {
    expect(
      computeSuggestedReimbursements({
        groupMode: "fund",
        stablecoinMint,
        expenses: [makeExpense({ deleted_at: "2026-05-15T01:00:00.000Z" })],
        proposals: [],
      })
    ).toEqual([])
  })

  it("skips expenses with a non-matching mint", () => {
    expect(
      computeSuggestedReimbursements({
        groupMode: "fund",
        stablecoinMint,
        expenses: [makeExpense({ mint: "different" })],
        proposals: [],
      })
    ).toEqual([])
  })
})
