import { describe, expect, it } from "vitest"
import { computeMemberExitRefund } from "@/lib/fund-mode-exit"
import type { Database } from "@/lib/database.types"

type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]

const groupId = "00000000-0000-4000-8000-000000000001"
const mint = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

function contrib(
  member: string,
  amount: number,
  index: number
): ContributionRow {
  return {
    id: `c-${index}`,
    group_id: groupId,
    member_wallet: member,
    amount,
    mint,
    tx_sig: `tx-${index}`,
    created_at: "2026-05-14T00:00:00.000Z",
  }
}

describe("computeMemberExitRefund", () => {
  it("returns zero refund when the Member has no Contributions", () => {
    const suggestion = computeMemberExitRefund({
      member: { wallet: "alice", display_name: "Alice" },
      contributions: [contrib("bob", 1_000_000, 1)],
      treasuryBalance: 1_000_000,
    })

    expect(suggestion.totalContributed).toBe(0)
    expect(suggestion.suggestedRefund).toBe(0)
    expect(suggestion.memo).toBe("Exit refund for Alice")
  })

  it("falls back to wallet snippet when display_name is missing", () => {
    const suggestion = computeMemberExitRefund({
      member: { wallet: "AAAA1111BBBB2222CCCC3333DDDD4444", display_name: null },
      contributions: [],
      treasuryBalance: 0,
    })
    expect(suggestion.memberDisplayName).toBe("AAAA...4444")
  })

  it("refunds the full contribution when the pro-rata share exceeds it", () => {
    // Alice contributed 1, Bob contributed 1, Treasury now sits at 10
    // (e.g. someone else donated). Alice's pro-rata = 10 * (1/2) = 5,
    // but her contribution was only 1 — she should never get more back than
    // she put in.
    const suggestion = computeMemberExitRefund({
      member: { wallet: "alice", display_name: "Alice" },
      contributions: [contrib("alice", 1, 1), contrib("bob", 1, 2)],
      treasuryBalance: 10,
    })

    expect(suggestion.totalContributed).toBe(1)
    expect(suggestion.proRataShare).toBe(5)
    expect(suggestion.suggestedRefund).toBe(1)
    expect(suggestion.rationale).toContain("Refunding full Contributions")
  })

  it("refunds the pro-rata share when others have been reimbursed already", () => {
    // Alice contributed 6, Bob contributed 4. Total = 10. Treasury currently
    // holds 5 (5 already went out as reimbursements). Alice's fair share is
    // 6/10 * 5 = 3.
    const suggestion = computeMemberExitRefund({
      member: { wallet: "alice", display_name: "Alice" },
      contributions: [contrib("alice", 6, 1), contrib("bob", 4, 2)],
      treasuryBalance: 5,
    })

    expect(suggestion.totalContributed).toBe(6)
    expect(suggestion.proRataShare).toBe(3)
    expect(suggestion.suggestedRefund).toBe(3)
    expect(suggestion.rationale).toContain("live pro-rata share")
  })

  it("never exceeds the Treasury balance when both Member share and balance are low", () => {
    // Alice contributed 100, but the Treasury only holds 2. She can't get
    // more than what's in the vault, even though her contribution + pro-rata
    // are both higher than the live balance.
    const suggestion = computeMemberExitRefund({
      member: { wallet: "alice", display_name: "Alice" },
      contributions: [contrib("alice", 100, 1)],
      treasuryBalance: 2,
    })

    expect(suggestion.suggestedRefund).toBe(2)
  })

  it("returns zero refund when the Treasury balance is zero", () => {
    const suggestion = computeMemberExitRefund({
      member: { wallet: "alice", display_name: "Alice" },
      contributions: [contrib("alice", 5, 1)],
      treasuryBalance: 0,
    })

    expect(suggestion.suggestedRefund).toBe(0)
    expect(suggestion.rationale).toContain("Treasury is empty")
  })
})
