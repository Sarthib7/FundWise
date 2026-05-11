import { describe, expect, it } from "vitest"
import { FundWiseError } from "@/lib/server/fundwise-error"
import {
  assertWalletIsAllowed,
  isSanctionedSolanaWallet,
  SANCTIONED_SOLANA_WALLETS,
} from "@/lib/server/sanctions-screening"

const KNOWN_OFAC_SOL_ADDRESS = "42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi"
const KNOWN_CLEAN_SOL_ADDRESS = "11111111111111111111111111111111"

describe("minimal sanctions screening", () => {
  it("loads the known OFAC Solana address into memory", () => {
    expect(SANCTIONED_SOLANA_WALLETS.has(KNOWN_OFAC_SOL_ADDRESS)).toBe(true)
  })

  it("detects a known sanctioned Solana wallet", () => {
    expect(isSanctionedSolanaWallet(KNOWN_OFAC_SOL_ADDRESS)).toBe(true)
  })

  it("does not flag a known clean Solana address", () => {
    expect(isSanctionedSolanaWallet(KNOWN_CLEAN_SOL_ADDRESS)).toBe(false)
    expect(() => assertWalletIsAllowed(KNOWN_CLEAN_SOL_ADDRESS)).not.toThrow()
  })

  it("blocks a known sanctioned Solana wallet with a generic 403", () => {
    expect(() => assertWalletIsAllowed(KNOWN_OFAC_SOL_ADDRESS)).toThrow(FundWiseError)

    try {
      assertWalletIsAllowed(KNOWN_OFAC_SOL_ADDRESS)
    } catch (error) {
      expect(error).toBeInstanceOf(FundWiseError)
      expect((error as FundWiseError).status).toBe(403)
      expect((error as FundWiseError).message).toBe("This wallet is not supported by FundWise.")
    }
  })
})
