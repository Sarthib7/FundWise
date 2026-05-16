import { describe, expect, it } from "vitest"
import { Keypair, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"

import {
  DEFAULT_FEE_RATES,
  getUsdcMintForCluster,
  quoteContributionFee,
  quoteCreationFee,
  quoteReimbursementFee,
  quoteRoutingFee,
  type FeeConfig,
} from "@/lib/fees"

const GROUP_ID = "00000000-0000-4000-8000-000000000aaa"

// Deterministic fixtures — derive once at module load. Tests assert pure
// determinism by calling each quote function twice.
const FEE_WALLET = Keypair.generate().publicKey
const PAYER = Keypair.generate().publicKey
const RECIPIENT = Keypair.generate().publicKey
const TREASURY = Keypair.generate().publicKey

function makeConfig(overrides: Partial<FeeConfig> = {}): FeeConfig {
  return {
    cluster: "devnet",
    platformFeeWallet: FEE_WALLET,
    usdcMint: getUsdcMintForCluster("devnet"),
    rates: DEFAULT_FEE_RATES,
    ...overrides,
  }
}

describe("quoteCreationFee", () => {
  it("returns exactly $5 USDC (5_000_000 base units)", () => {
    const config = makeConfig()
    const quote = quoteCreationFee({ config, payerWallet: PAYER, groupId: GROUP_ID })

    expect(quote.kind).toBe("creation")
    expect(quote.feeAmount).toBe(5_000_000n)
    expect(quote.display.feeUsdCents).toBe(500)
    expect(quote.display.feeAmountFormatted).toBe("5.00 USDC")
    expect(quote.mint.equals(config.usdcMint)).toBe(true)
  })

  it("uses the platform fee wallet's USDC ATA as the fee destination", () => {
    const config = makeConfig()
    const quote = quoteCreationFee({ config, payerWallet: PAYER })

    const expectedFeeAta = getAssociatedTokenAddressSync(config.usdcMint, FEE_WALLET)
    const expectedPayerAta = getAssociatedTokenAddressSync(config.usdcMint, PAYER)

    expect(quote.transfers).toHaveLength(1)
    const feeLeg = quote.transfers[0]!
    expect(feeLeg.label).toBe("fee")
    expect(feeLeg.source.equals(expectedPayerAta)).toBe(true)
    expect(feeLeg.destination.equals(expectedFeeAta)).toBe(true)
    expect(feeLeg.owner.equals(PAYER)).toBe(true)
    expect(feeLeg.amount).toBe(5_000_000n)
  })

  it("includes the idempotent ATA-create instruction", () => {
    const config = makeConfig()
    const quote = quoteCreationFee({ config, payerWallet: PAYER })
    expect(quote.atatCreateInstructions).toHaveLength(1)
    // The ATA program id is associated-token-program. We just assert one
    // instruction exists, has accounts, and matches the destination ATA
    // shape by checking it includes the fee wallet's ATA as an account.
    const ix = quote.atatCreateInstructions[0]!
    const expectedFeeAta = getAssociatedTokenAddressSync(config.usdcMint, FEE_WALLET)
    const accountKeys = ix.keys.map((k) => k.pubkey.toBase58())
    expect(accountKeys).toContain(expectedFeeAta.toBase58())
    expect(accountKeys).toContain(FEE_WALLET.toBase58())
    expect(accountKeys).toContain(config.usdcMint.toBase58())
  })

  it("builds the correct ledgerRow payload", () => {
    const config = makeConfig()
    const quote = quoteCreationFee({ config, payerWallet: PAYER, groupId: GROUP_ID })

    expect(quote.ledgerRow).toEqual({
      kind: "creation",
      fee_amount: 5_000_000n,
      mint: config.usdcMint.toBase58(),
      cluster: "devnet",
      fee_wallet: FEE_WALLET.toBase58(),
      payer_wallet: PAYER.toBase58(),
      group_id: GROUP_ID,
    })
  })

  it("nulls group_id when omitted", () => {
    const config = makeConfig()
    const quote = quoteCreationFee({ config, payerWallet: PAYER })
    expect(quote.ledgerRow.group_id).toBeNull()
  })

  it("is pure (same inputs → identical outputs)", () => {
    const config = makeConfig()
    const a = quoteCreationFee({ config, payerWallet: PAYER, groupId: GROUP_ID })
    const b = quoteCreationFee({ config, payerWallet: PAYER, groupId: GROUP_ID })
    expect(a).toEqual(b)
  })
})

describe("quoteContributionFee", () => {
  it("computes 0.5% of 10_000_000 = 50_000", () => {
    const config = makeConfig()
    const quote = quoteContributionFee({
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 10_000_000n,
      groupId: GROUP_ID,
    })
    expect(quote.feeAmount).toBe(50_000n)
  })

  it("truncates on small amounts (0.5% of 1_000 = 5)", () => {
    const config = makeConfig()
    const quote = quoteContributionFee({
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 1_000n,
      groupId: GROUP_ID,
    })
    expect(quote.feeAmount).toBe(5n)
  })

  it("returns zero fee on zero contribution", () => {
    const config = makeConfig()
    const quote = quoteContributionFee({
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 0n,
      groupId: GROUP_ID,
    })
    expect(quote.feeAmount).toBe(0n)
  })

  it("emits a principal leg + a fee leg, both owned by the payer", () => {
    const config = makeConfig()
    const quote = quoteContributionFee({
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 10_000_000n,
      groupId: GROUP_ID,
    })

    expect(quote.transfers).toHaveLength(2)
    const [principal, fee] = quote.transfers
    expect(principal!.label).toBe("principal")
    expect(principal!.amount).toBe(10_000_000n)
    expect(principal!.owner.equals(PAYER)).toBe(true)
    expect(fee!.label).toBe("fee")
    expect(fee!.amount).toBe(50_000n)
    expect(fee!.owner.equals(PAYER)).toBe(true)
  })

  it("uses the treasury's off-curve ATA as the principal destination", () => {
    const config = makeConfig()
    const quote = quoteContributionFee({
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 1_000_000n,
      groupId: GROUP_ID,
    })
    const expectedTreasuryAta = getAssociatedTokenAddressSync(
      config.usdcMint,
      TREASURY,
      true
    )
    expect(quote.transfers[0]!.destination.equals(expectedTreasuryAta)).toBe(true)
  })

  it("rejects negative contribution amounts", () => {
    const config = makeConfig()
    expect(() =>
      quoteContributionFee({
        config,
        payerWallet: PAYER,
        treasuryWallet: TREASURY,
        contributionAmount: -1n,
        groupId: GROUP_ID,
      })
    ).toThrow()
  })

  it("is pure", () => {
    const config = makeConfig()
    const args = {
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 10_000_000n,
      groupId: GROUP_ID,
    }
    expect(quoteContributionFee(args)).toEqual(quoteContributionFee(args))
  })
})

describe("quoteReimbursementFee", () => {
  it("computes 0.5% of the reimbursement amount", () => {
    const config = makeConfig()
    const quote = quoteReimbursementFee({
      config,
      treasuryPda: TREASURY,
      recipientWallet: RECIPIENT,
      reimbursementAmount: 20_000_000n,
      groupId: GROUP_ID,
    })
    expect(quote.feeAmount).toBe(100_000n)
  })

  it("emits both legs with owner=Treasury PDA", () => {
    const config = makeConfig()
    const quote = quoteReimbursementFee({
      config,
      treasuryPda: TREASURY,
      recipientWallet: RECIPIENT,
      reimbursementAmount: 20_000_000n,
      groupId: GROUP_ID,
    })

    expect(quote.transfers).toHaveLength(2)
    const [principal, fee] = quote.transfers
    expect(principal!.label).toBe("principal")
    expect(principal!.owner.equals(TREASURY)).toBe(true)
    expect(fee!.label).toBe("fee")
    expect(fee!.owner.equals(TREASURY)).toBe(true)
  })

  it("derives the source ATA off-curve for the Treasury PDA", () => {
    const config = makeConfig()
    const quote = quoteReimbursementFee({
      config,
      treasuryPda: TREASURY,
      recipientWallet: RECIPIENT,
      reimbursementAmount: 1_000_000n,
      groupId: GROUP_ID,
    })
    const expectedTreasuryAta = getAssociatedTokenAddressSync(
      config.usdcMint,
      TREASURY,
      true
    )
    expect(quote.transfers[0]!.source.equals(expectedTreasuryAta)).toBe(true)
    expect(quote.transfers[1]!.source.equals(expectedTreasuryAta)).toBe(true)
  })

  it("records the Treasury PDA as payer_wallet in the ledgerRow", () => {
    const config = makeConfig()
    const quote = quoteReimbursementFee({
      config,
      treasuryPda: TREASURY,
      recipientWallet: RECIPIENT,
      reimbursementAmount: 1_000_000n,
      groupId: GROUP_ID,
    })
    expect(quote.ledgerRow.payer_wallet).toBe(TREASURY.toBase58())
    expect(quote.ledgerRow.kind).toBe("reimbursement")
  })

  it("is pure", () => {
    const config = makeConfig()
    const args = {
      config,
      treasuryPda: TREASURY,
      recipientWallet: RECIPIENT,
      reimbursementAmount: 20_000_000n,
      groupId: GROUP_ID,
    }
    expect(quoteReimbursementFee(args)).toEqual(quoteReimbursementFee(args))
  })
})

describe("quoteRoutingFee", () => {
  it("computes 25 bps (0.25%) of the routed amount", () => {
    const config = makeConfig()
    const quote = quoteRoutingFee({
      config,
      payerWallet: PAYER,
      routedAmount: 10_000_000n,
    })
    expect(quote.feeAmount).toBe(25_000n)
  })

  it("emits exactly one fee leg (no principal)", () => {
    const config = makeConfig()
    const quote = quoteRoutingFee({
      config,
      payerWallet: PAYER,
      routedAmount: 100_000_000n,
    })

    expect(quote.transfers).toHaveLength(1)
    const leg = quote.transfers[0]!
    expect(leg.label).toBe("fee")
    expect(leg.owner.equals(PAYER)).toBe(true)
    expect(leg.amount).toBe(250_000n)
  })

  it("allows null group_id for pre-Group routing contexts", () => {
    const config = makeConfig()
    const quote = quoteRoutingFee({
      config,
      payerWallet: PAYER,
      routedAmount: 10_000_000n,
    })
    expect(quote.ledgerRow.group_id).toBeNull()
    expect(quote.ledgerRow.kind).toBe("routing")
  })

  it("is pure", () => {
    const config = makeConfig()
    const args = {
      config,
      payerWallet: PAYER,
      routedAmount: 10_000_000n,
      groupId: null,
    }
    expect(quoteRoutingFee(args)).toEqual(quoteRoutingFee(args))
  })
})

describe("display rendering", () => {
  it("formats $5 USDC creation fee as '5.00 USDC' / 500 cents", () => {
    const config = makeConfig()
    const quote = quoteCreationFee({ config, payerWallet: PAYER })
    expect(quote.display.feeAmountFormatted).toBe("5.00 USDC")
    expect(quote.display.feeUsdCents).toBe(500)
  })

  it("formats sub-cent contribution fee as 0 cents", () => {
    const config = makeConfig()
    // 0.5% of 1_000 = 5 base units = 0.00005 USDC = 0 cents (truncated).
    const quote = quoteContributionFee({
      config,
      payerWallet: PAYER,
      treasuryWallet: TREASURY,
      contributionAmount: 1_000n,
      groupId: GROUP_ID,
    })
    expect(quote.feeAmount).toBe(5n)
    expect(quote.display.feeUsdCents).toBe(0)
  })

  it("returns 0 cents for a non-USDC mint (guard for stablecoin-only valuation)", () => {
    const config = makeConfig({
      // Pretend a different mint is the fee mint by overriding usdcMint;
      // helper detects this via cluster-vs-mint mismatch.
      usdcMint: new PublicKey("11111111111111111111111111111111"),
    })
    const quote = quoteCreationFee({ config, payerWallet: PAYER })
    expect(quote.display.feeUsdCents).toBe(0)
  })
})
