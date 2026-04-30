import { describe, it, expect } from "vitest"
import {
  calculateSplits,
  simplifySettlements,
  computeBalancesFromActivity,
  formatTokenAmount,
  parseTokenAmount,
} from "../lib/expense-engine"
import type { Balance } from "../lib/expense-engine"

// ─── Split Calculation Tests ───────────────────────────────────────

describe("calculateSplits — equal", () => {
  it("splits equally among 2 people", () => {
    const result = calculateSplits(1000, ["alice", "bob"], "equal")
    expect(result).toEqual([
      { wallet: "alice", share: 500 },
      { wallet: "bob", share: 500 },
    ])
  })

  it("splits equally among 3 people with no remainder", () => {
    const result = calculateSplits(900, ["alice", "bob", "carol"], "equal")
    expect(result).toEqual([
      { wallet: "alice", share: 300 },
      { wallet: "bob", share: 300 },
      { wallet: "carol", share: 300 },
    ])
  })

  it("distributes remainder to first participants (3 people, 1000 units)", () => {
    const result = calculateSplits(1000, ["alice", "bob", "carol"], "equal")
    // 1000 / 3 = 333 remainder 1
    expect(result).toEqual([
      { wallet: "alice", share: 334 },
      { wallet: "bob", share: 333 },
      { wallet: "carol", share: 333 },
    ])
    const total = result.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBe(1000)
  })

  it("handles single participant", () => {
    const result = calculateSplits(500, ["alice"], "equal")
    expect(result).toEqual([{ wallet: "alice", share: 500 }])
  })

  it("splits equally among 10 people", () => {
    const wallets = Array.from({ length: 10 }, (_, i) => `person${i}`)
    const result = calculateSplits(10000, wallets, "equal")
    const total = result.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBe(10000)
    // Each should get 1000
    expect(result.every((s) => s.share === 1000)).toBe(true)
  })

  it("distributes remainder correctly for 7 people splitting 100", () => {
    const wallets = Array.from({ length: 7 }, (_, i) => `p${i}`)
    const result = calculateSplits(100, wallets, "equal")
    const total = result.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBe(100)
    // 100 / 7 = 14 remainder 2 → first 2 get 15, rest get 14
    expect(result[0].share).toBe(15)
    expect(result[1].share).toBe(15)
    expect(result[2].share).toBe(14)
  })
})

describe("calculateSplits — exact", () => {
  it("splits by exact amounts", () => {
    const custom = { alice: 600, bob: 400 }
    const result = calculateSplits(1000, ["alice", "bob"], "exact", custom)
    expect(result).toEqual([
      { wallet: "alice", share: 600 },
      { wallet: "bob", share: 400 },
    ])
  })

  it("throws if exact amounts don't sum to total", () => {
    const custom = { alice: 500, bob: 400 }
    expect(() => calculateSplits(1000, ["alice", "bob"], "exact", custom)).toThrow(
      "Exact split must add up to the full Expense amount"
    )
  })

  it("throws on negative exact amounts", () => {
    const custom = { alice: 1200, bob: -200 }
    expect(() => calculateSplits(1000, ["alice", "bob"], "exact", custom)).toThrow(
      "Exact split amounts cannot be negative"
    )
  })

  it("throws if custom values are missing", () => {
    expect(() => calculateSplits(1000, ["alice", "bob"], "exact")).toThrow(
      "Custom values required for exact split"
    )
  })
})

describe("calculateSplits — percentage", () => {
  it("splits by percentage", () => {
    const custom = { alice: 60, bob: 40 }
    const result = calculateSplits(1000, ["alice", "bob"], "percentage", custom)
    expect(result).toEqual([
      { wallet: "alice", share: 600 },
      { wallet: "bob", share: 400 },
    ])
  })

  it("throws if percentages don't sum to 100", () => {
    const custom = { alice: 50, bob: 40 }
    expect(() => calculateSplits(1000, ["alice", "bob"], "percentage", custom)).toThrow(
      "Percentages must add up to 100"
    )
  })

  it("throws on negative percentages", () => {
    const custom = { alice: 120, bob: -20 }
    expect(() => calculateSplits(1000, ["alice", "bob"], "percentage", custom)).toThrow(
      "Percentages cannot be negative"
    )
  })

  it("handles 3-way percentage split", () => {
    const custom = { alice: 50, bob: 30, carol: 20 }
    const result = calculateSplits(10000, ["alice", "bob", "carol"], "percentage", custom)
    const total = result.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBe(10000)
    expect(result[0].share).toBe(5000)
    expect(result[1].share).toBe(3000)
    expect(result[2].share).toBe(2000)
  })

  it("gives last participant the remainder to avoid rounding drift", () => {
    const custom = { alice: 33.33, bob: 33.33, carol: 33.34 }
    const result = calculateSplits(99999, ["alice", "bob", "carol"], "percentage", custom)
    const total = result.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBe(99999)
  })
})

describe("calculateSplits — shares", () => {
  it("splits proportionally by shares", () => {
    const custom = { alice: 2, bob: 1 }
    const result = calculateSplits(900, ["alice", "bob"], "shares", custom)
    expect(result).toEqual([
      { wallet: "alice", share: 600 },
      { wallet: "bob", share: 300 },
    ])
  })

  it("throws on zero total shares", () => {
    const custom = { alice: 0, bob: 0 }
    expect(() => calculateSplits(1000, ["alice", "bob"], "shares", custom)).toThrow(
      "Total shares cannot be zero"
    )
  })

  it("throws on negative shares", () => {
    const custom = { alice: 2, bob: -1 }
    expect(() => calculateSplits(1000, ["alice", "bob"], "shares", custom)).toThrow(
      "Share values cannot be negative"
    )
  })

  it("handles unequal 3-way share split", () => {
    const custom = { alice: 5, bob: 3, carol: 2 }
    const result = calculateSplits(10000, ["alice", "bob", "carol"], "shares", custom)
    const total = result.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBe(10000)
    expect(result[0].share).toBe(5000)
    expect(result[1].share).toBe(3000)
    expect(result[2].share).toBe(2000)
  })
})

// ─── Settlement Graph Tests ────────────────────────────────────────

describe("simplifySettlements", () => {
  it("produces one transfer for 2-person debt", () => {
    const balances: Balance[] = [
      { wallet: "alice", displayName: "Alice", amount: 500 },
      { wallet: "bob", displayName: "Bob", amount: -500 },
    ]
    const transfers = simplifySettlements(balances)
    expect(transfers).toEqual([
      { from: "bob", to: "alice", amount: 500, fromName: "Bob", toName: "Alice" },
    ])
  })

  it("produces minimum transfers for 3-person group", () => {
    const balances: Balance[] = [
      { wallet: "alice", displayName: "Alice", amount: 500 },
      { wallet: "bob", displayName: "Bob", amount: -200 },
      { wallet: "carol", displayName: "Carol", amount: -300 },
    ]
    const transfers = simplifySettlements(balances)
    expect(transfers).toEqual([
      { from: "carol", to: "alice", amount: 300, fromName: "Carol", toName: "Alice" },
      { from: "bob", to: "alice", amount: 200, fromName: "Bob", toName: "Alice" },
    ])
  })

  it("nets out complex 4-person group", () => {
    const balances: Balance[] = [
      { wallet: "alice", displayName: "Alice", amount: 400 },
      { wallet: "bob", displayName: "Bob", amount: 100 },
      { wallet: "carol", displayName: "Carol", amount: -200 },
      { wallet: "dave", displayName: "Dave", amount: -300 },
    ]
    const transfers = simplifySettlements(balances)

    // Verify sum: total transferred should cover all debts
    const totalToCreditors = transfers.reduce((sum, t) => sum + t.amount, 0)
    expect(totalToCreditors).toBe(500) // 400 + 100 = 200 + 300

    // Verify all transfers are valid (from debtor to creditor)
    for (const t of transfers) {
      expect(t.amount).toBeGreaterThan(0)
      const fromBalance = balances.find((b) => b.wallet === t.from)
      const toBalance = balances.find((b) => b.wallet === t.to)
      expect(fromBalance!.amount).toBeLessThan(0)
      expect(toBalance!.amount).toBeGreaterThan(0)
    }
  })

  it("returns empty for zero balances", () => {
    const balances: Balance[] = [
      { wallet: "alice", displayName: "Alice", amount: 0 },
      { wallet: "bob", displayName: "Bob", amount: 0 },
    ]
    const transfers = simplifySettlements(balances)
    expect(transfers).toEqual([])
  })

  it("handles 5-person group correctly", () => {
    const balances: Balance[] = [
      { wallet: "alice", displayName: "Alice", amount: 1000 },
      { wallet: "bob", displayName: "Bob", amount: 500 },
      { wallet: "carol", displayName: "Carol", amount: -300 },
      { wallet: "dave", displayName: "Dave", amount: -700 },
      { wallet: "eve", displayName: "Eve", amount: -500 },
    ]
    const transfers = simplifySettlements(balances)

    const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0)
    expect(totalTransferred).toBe(1500) // sum of positive balances

    // Verify net effect: each person's transfers net to their balance
    const netByWallet: Record<string, number> = {}
    for (const b of balances) netByWallet[b.wallet] = 0
    for (const t of transfers) {
      netByWallet[t.from] = (netByWallet[t.from] || 0) - t.amount
      netByWallet[t.to] = (netByWallet[t.to] || 0) + t.amount
    }
    for (const b of balances) {
      expect(netByWallet[b.wallet]).toBe(b.amount)
    }
  })
})

// ─── Token Formatting Tests ────────────────────────────────────────

describe("formatTokenAmount / parseTokenAmount", () => {
  it("formats USDC (6 decimals)", () => {
    expect(formatTokenAmount(5000000, 6)).toBe("5.00")
    expect(formatTokenAmount(1234567, 6)).toBe("1.23")
    expect(formatTokenAmount(0, 6)).toBe("0.00")
  })

  it("parses USDC (6 decimals)", () => {
    expect(parseTokenAmount("5.00", 6)).toBe(5000000)
    expect(parseTokenAmount("1.234567", 6)).toBe(1234567)
    expect(parseTokenAmount("0", 6)).toBe(0)
  })

  it("round-trips correctly", () => {
    const original = 1234567
    const formatted = formatTokenAmount(original, 6)
    const parsed = parseTokenAmount(formatted, 6)
    expect(parsed).toBe(1230000) // formatting to 2 decimals loses precision — expected
  })
})

// ─── Balance Computation from Activity ─────────────────────────────

describe("computeBalancesFromActivity", () => {
  const members = [
    { wallet: "alice", display_name: "Alice", group_id: "g1", joined_at: "", role: "member" },
    { wallet: "bob", display_name: "Bob", group_id: "g1", joined_at: "", role: "member" },
    { wallet: "carol", display_name: "Carol", group_id: "g1", joined_at: "", role: "member" },
  ] as any[]

  it("returns zero balances for no activity", () => {
    const balances = computeBalancesFromActivity(members, [])
    expect(balances).toEqual([
      { wallet: "alice", displayName: "Alice", amount: 0 },
      { wallet: "bob", displayName: "Bob", amount: 0 },
      { wallet: "carol", displayName: "Carol", amount: 0 },
    ])
  })

  it("computes balance from a single expense", () => {
    const activity = [
      {
        type: "expense",
        data: {
          payer: "alice",
          amount: 3000,
          splits: [
            { wallet: "alice", share: 1000 },
            { wallet: "bob", share: 1000 },
            { wallet: "carol", share: 1000 },
          ],
        },
      },
    ] as any[]

    const balances = computeBalancesFromActivity(members, activity)
    // Alice paid 3000, each owes 1000 → Alice net +2000, Bob -1000, Carol -1000
    const byWallet = Object.fromEntries(balances.map((b) => [b.wallet, b.amount]))
    expect(byWallet["alice"]).toBe(2000)
    expect(byWallet["bob"]).toBe(-1000)
    expect(byWallet["carol"]).toBe(-1000)
  })

  it("computes net balance after settlement", () => {
    const activity = [
      {
        type: "expense",
        data: {
          payer: "alice",
          amount: 3000,
          splits: [
            { wallet: "alice", share: 1000 },
            { wallet: "bob", share: 1000 },
            { wallet: "carol", share: 1000 },
          ],
        },
      },
      {
        type: "settlement",
        data: {
          from_wallet: "bob",
          to_wallet: "alice",
          amount: 1000,
        },
      },
    ] as any[]

    const balances = computeBalancesFromActivity(members, activity)
    const byWallet = Object.fromEntries(balances.map((b) => [b.wallet, b.amount]))
    expect(byWallet["alice"]).toBe(1000) // 2000 - 1000 settled
    expect(byWallet["bob"]).toBe(0) // -1000 + 1000 settled
    expect(byWallet["carol"]).toBe(-1000) // still owes
  })

  it("handles multiple expenses correctly", () => {
    const activity = [
      {
        type: "expense",
        data: {
          payer: "alice",
          amount: 3000,
          splits: [
            { wallet: "alice", share: 1500 },
            { wallet: "bob", share: 1500 },
          ],
        },
      },
      {
        type: "expense",
        data: {
          payer: "bob",
          amount: 2000,
          splits: [
            { wallet: "bob", share: 1000 },
            { wallet: "carol", share: 1000 },
          ],
        },
      },
    ] as any[]

    const balances = computeBalancesFromActivity(members, activity)
    const byWallet = Object.fromEntries(balances.map((b) => [b.wallet, b.amount]))
    // Alice: +3000 (paid) -1500 (split) = +1500
    // Bob: +2000 (paid) -1500 (split from exp1) -1000 (split from exp2) = -500
    // Carol: -1000 (split from exp2)
    expect(byWallet["alice"]).toBe(1500)
    expect(byWallet["bob"]).toBe(-500)
    expect(byWallet["carol"]).toBe(-1000)
  })

  it("all balances sum to zero (conservation)", () => {
    const activity = [
      {
        type: "expense",
        data: {
          payer: "alice",
          amount: 10000,
          splits: [
            { wallet: "alice", share: 2500 },
            { wallet: "bob", share: 2500 },
            { wallet: "carol", share: 2500 },
            { wallet: "dave", share: 2500 },
          ],
        },
      },
    ] as any[]

    const members4 = [
      { wallet: "alice", display_name: "Alice", group_id: "g1", joined_at: "", role: "member" },
      { wallet: "bob", display_name: "Bob", group_id: "g1", joined_at: "", role: "member" },
      { wallet: "carol", display_name: "Carol", group_id: "g1", joined_at: "", role: "member" },
      { wallet: "dave", display_name: "Dave", group_id: "g1", joined_at: "", role: "member" },
    ] as any[]

    const balances = computeBalancesFromActivity(members4, activity)
    const total = balances.reduce((sum, b) => sum + b.amount, 0)
    expect(total).toBe(0)
  })
})
