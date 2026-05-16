import { beforeEach, describe, expect, it, vi } from "vitest"
import { Keypair } from "@solana/web3.js"

// Mock the supabase admin before importing the SUT so the SUT picks up
// the mocked module.
const upsertMock = vi.fn<(payload: unknown, options: unknown) => Promise<{ error: unknown }>>(
  async () => ({ error: null })
)
const fromMock = vi.fn((_table: string) => ({ upsert: upsertMock }))
const getSupabaseAdminMock = vi.fn(() => ({ from: fromMock }))

vi.mock("@/lib/server/supabase-admin", () => ({
  getSupabaseAdmin: () => getSupabaseAdminMock(),
}))

import {
  DEFAULT_FEE_RATES,
  getUsdcMintForCluster,
  quoteCreationFee,
  recordFee,
  type FeeConfig,
} from "@/lib/fees"

const FEE_WALLET = Keypair.generate().publicKey
const PAYER = Keypair.generate().publicKey
const GROUP_ID = "00000000-0000-4000-8000-000000000bbb"

function makeConfig(): FeeConfig {
  return {
    cluster: "devnet",
    platformFeeWallet: FEE_WALLET,
    usdcMint: getUsdcMintForCluster("devnet"),
    rates: DEFAULT_FEE_RATES,
  }
}

beforeEach(() => {
  upsertMock.mockClear()
  fromMock.mockClear()
  getSupabaseAdminMock.mockClear()
  upsertMock.mockImplementation(async () => ({ error: null }))
})

describe("recordFee", () => {
  it("inserts the platform_fee_ledger row with the expected payload shape", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
      groupId: GROUP_ID,
    })

    await recordFee({ quote, txSig: "test-sig-1", cluster: "devnet" })

    expect(fromMock).toHaveBeenCalledWith("platform_fee_ledger")
    expect(upsertMock).toHaveBeenCalledTimes(1)
    const [payload, options] = upsertMock.mock.calls[0]!
    expect(payload).toEqual({
      kind: "creation",
      fee_amount: 5_000_000,
      mint: getUsdcMintForCluster("devnet").toBase58(),
      cluster: "devnet",
      fee_wallet: FEE_WALLET.toBase58(),
      payer_wallet: PAYER.toBase58(),
      group_id: GROUP_ID,
      tx_sig: "test-sig-1",
    })
    expect(options).toEqual({ onConflict: "tx_sig,kind", ignoreDuplicates: true })
  })

  it("converts bigint fee_amount to number for serialization", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
      groupId: GROUP_ID,
    })

    await recordFee({ quote, txSig: "test-sig-2", cluster: "devnet" })

    const [payload] = upsertMock.mock.calls[0]!
    expect(typeof (payload as { fee_amount: unknown }).fee_amount).toBe("number")
    expect((payload as { fee_amount: number }).fee_amount).toBe(5_000_000)
  })

  it("rejects empty txSig", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
    })

    await expect(
      recordFee({ quote, txSig: "", cluster: "devnet" })
    ).rejects.toThrow(/non-empty txSig/)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it("rejects whitespace-only txSig", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
    })

    await expect(
      recordFee({ quote, txSig: "   ", cluster: "devnet" })
    ).rejects.toThrow(/non-empty txSig/)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it("rejects cluster mismatch between quote and call", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
    })

    await expect(
      recordFee({ quote, txSig: "sig", cluster: "mainnet-beta" })
    ).rejects.toThrow(/cluster mismatch/)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it("surfaces supabase errors as FundWiseError", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
    })
    upsertMock.mockImplementationOnce(async () => ({
      error: { message: "Permission denied" },
    }))

    await expect(
      recordFee({ quote, txSig: "sig-err", cluster: "devnet" })
    ).rejects.toThrow(/Failed to record platform fee.*Permission denied/)
  })

  it("nulls group_id in the payload when the quote had no group context", async () => {
    const quote = quoteCreationFee({
      config: makeConfig(),
      payerWallet: PAYER,
    })

    await recordFee({ quote, txSig: "sig-no-group", cluster: "devnet" })

    const [payload] = upsertMock.mock.calls[0]!
    expect((payload as { group_id: unknown }).group_id).toBeNull()
  })
})
