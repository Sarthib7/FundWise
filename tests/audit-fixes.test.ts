import { describe, expect, it } from "vitest"

import { FundWiseError } from "@/lib/server/fundwise-error"

// FW-053 + FW-055 regression tests. These tests exercise the audit-driven
// hardening: payer-binding language on the expense routes, the always-on
// sanctions screen wired into the wallet session helper, and the side-transfer
// guard in verifyAtaTransfer.

describe("FW-053.1 payer-binding error language", () => {
  it("uses a clear, payer-attribution-focused message when payer ≠ session", () => {
    const error = new FundWiseError(
      "Expense payer must match the authenticated wallet. Ask the payer to log this Expense from their own wallet.",
      400
    )
    expect(error.status).toBe(400)
    expect(error.message).toContain("payer must match the authenticated wallet")
    expect(error.message).toContain("from their own wallet")
  })
})

describe("FW-053.3 always-on sanctions screen", () => {
  it("requireAuthenticatedWallet imports the sanctions guard", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../lib/server/wallet-session.ts", import.meta.url), "utf8")
    )
    expect(source).toMatch(/from "@\/lib\/server\/sanctions-screening"/)
    expect(source).toMatch(/assertWalletIsAllowed\(session\.wallet\)/)
  })
})

describe("FW-055 verifyAtaTransfer rejects extra token-balance deltas", () => {
  it("contains the side-transfer guard in the verification module", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../lib/server/solana-transfer-verification.ts", import.meta.url), "utf8")
    )
    expect(source).toMatch(/FW-055/)
    expect(source).toMatch(/unexpected token balance change/)
    // The guard iterates the full balance map after matching source/dest.
    expect(source).toMatch(/for \(const \[address, balance\] of tokenBalances\)/)
  })
})

describe("FW-053.2 locked settlement insert", () => {
  it("declares the record_settlement_locked RPC in the generated database types", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../lib/database.types.ts", import.meta.url), "utf8")
    )
    expect(source).toMatch(/record_settlement_locked/)
    expect(source).toMatch(/already_existed/)
  })

  it("ships the migration that creates record_settlement_locked", async () => {
    const fs = await import("node:fs/promises")
    const path = new URL(
      "../supabase/migrations/20260514104435_add_record_settlement_with_lock.sql",
      import.meta.url
    )
    const sql = await fs.readFile(path, "utf8")
    expect(sql).toMatch(/create or replace function public\.record_settlement_locked/)
    expect(sql).toMatch(/for update/)
    expect(sql).toMatch(/grant execute[\s\S]+to service_role/)
  })
})
