import { describe, expect, it } from "vitest"
import { assertSettlementMatchesCurrentGraph } from "@/lib/server/mutations/settlement"
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
    role: "admin",
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    group_id: groupId,
    wallet: "bob",
    display_name: "Bob",
    joined_at: "2026-05-06T00:00:00.000Z",
    role: "member",
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
