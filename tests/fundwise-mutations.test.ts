import { describe, expect, it } from "vitest"
import {
  assertSettlementMatchesCurrentGraph,
  validateExpenseLedgerInput,
} from "@/lib/server/fundwise-mutations"
import type { Database } from "@/lib/database.types"

const expectedMint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
const groupId = "00000000-0000-4000-8000-000000000001"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type Activity = Parameters<typeof assertSettlementMatchesCurrentGraph>[0]["activity"]

const members: MemberRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000011",
    group_id: groupId,
    wallet: "alice",
    display_name: "Alice",
    joined_at: "2026-05-06T00:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    group_id: groupId,
    wallet: "bob",
    display_name: "Bob",
    joined_at: "2026-05-06T00:00:00.000Z",
  },
]

const activity: Activity = [
  {
    type: "expense",
    data: {
      id: "00000000-0000-4000-8000-000000000021",
      group_id: groupId,
      payer: "alice",
      created_by: "alice",
      amount: 1000,
      mint: expectedMint,
      memo: "Dinner",
      category: "general",
      split_method: "equal",
      source_currency: "USD",
      source_amount: 1000,
      exchange_rate: 1,
      exchange_rate_source: "default",
      exchange_rate_at: "2026-05-06T00:00:00.000Z",
      created_at: "2026-05-06T00:00:00.000Z",
      edited_at: null,
      deleted_at: null,
      splits: [
        {
          id: "00000000-0000-4000-8000-000000000031",
          expense_id: "00000000-0000-4000-8000-000000000021",
          wallet: "alice",
          share: 500,
        },
        {
          id: "00000000-0000-4000-8000-000000000032",
          expense_id: "00000000-0000-4000-8000-000000000021",
          wallet: "bob",
          share: 500,
        },
      ],
    },
  },
]

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

  it("rejects split totals that exceed the safe integer range", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: Number.MAX_SAFE_INTEGER,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: Number.MAX_SAFE_INTEGER },
          { wallet: "bob", share: 1 },
        ],
      })
    ).toThrow("Expense split shares total exceeds the safe integer range.")
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

describe("assertSettlementMatchesCurrentGraph", () => {
  it("accepts a Settlement that exactly matches the current graph edge", () => {
    expect(() =>
      assertSettlementMatchesCurrentGraph({
        members,
        activity,
        fromWallet: "bob",
        toWallet: "alice",
        amount: 500,
      })
    ).not.toThrow()
  })

  it("rejects stale, wrong-direction, or overpaid Settlement records", () => {
    expect(() =>
      assertSettlementMatchesCurrentGraph({
        members,
        activity,
        fromWallet: "alice",
        toWallet: "bob",
        amount: 500,
      })
    ).toThrow("Settlement does not match the current live Group Balance.")

    expect(() =>
      assertSettlementMatchesCurrentGraph({
        members,
        activity,
        fromWallet: "bob",
        toWallet: "alice",
        amount: 600,
      })
    ).toThrow("Settlement does not match the current live Group Balance.")
  })
})
