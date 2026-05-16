import { Keypair, PublicKey } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import { describe, expect, it } from "vitest"
import * as Squads from "@/lib/squads/governance"

describe("Squads.deriveMultisigAddresses", () => {
  it("returns valid PublicKey instances and a usable createKey", () => {
    const creator = Keypair.generate().publicKey
    const result = Squads.deriveMultisigAddresses({
      creator,
      threshold: 1,
      members: [],
    })

    expect(result.multisigPda).toBeInstanceOf(PublicKey)
    expect(result.treasuryPda).toBeInstanceOf(PublicKey)
    expect(result.createKey.publicKey).toBeInstanceOf(PublicKey)
    expect(result.createKey.secretKey.length).toBe(64)
  })

  it("is deterministic for the same createKey", () => {
    const creator = Keypair.generate().publicKey
    const createKey = Keypair.generate()
    const first = Squads.deriveMultisigAddresses({
      creator,
      threshold: 1,
      members: [],
      createKey,
    })
    const second = Squads.deriveMultisigAddresses({
      creator,
      threshold: 1,
      members: [],
      createKey,
    })

    expect(first.multisigPda.equals(second.multisigPda)).toBe(true)
    expect(first.treasuryPda.equals(second.treasuryPda)).toBe(true)
    expect(first.createKey.publicKey.equals(second.createKey.publicKey)).toBe(true)
  })

  it("returns the index-0 vault PDA derived by @sqds/multisig directly", () => {
    const creator = Keypair.generate().publicKey
    const createKey = Keypair.generate()
    const { multisigPda, treasuryPda } = Squads.deriveMultisigAddresses({
      creator,
      threshold: 1,
      members: [],
      createKey,
    })

    const [expectedTreasury] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    })

    expect(treasuryPda.equals(expectedTreasury)).toBe(true)
  })

  it("rejects thresholds below 1 before deriving any PDA", () => {
    const creator = Keypair.generate().publicKey

    expect(() =>
      Squads.deriveMultisigAddresses({
        creator,
        threshold: 0,
        members: [],
      })
    ).toThrow("Approval threshold must be at least 1")
  })

  it("rejects thresholds that exceed the unique member count", () => {
    const creator = Keypair.generate().publicKey
    const otherMember = Keypair.generate().publicKey

    expect(() =>
      Squads.deriveMultisigAddresses({
        creator,
        threshold: 3,
        members: [otherMember],
      })
    ).toThrow("Approval threshold 3 exceeds current member count 2")
  })
})

describe("Squads.proposeReimbursement", () => {
  it("throws the FW-068 guard when a platformFee is supplied", async () => {
    const signer = {
      publicKey: Keypair.generate().publicKey,
      signTransaction: async <T>(tx: T) => tx,
    }

    await expect(
      Squads.proposeReimbursement({
        signer,
        multisigAddress: Keypair.generate().publicKey.toBase58(),
        recipient: Keypair.generate().publicKey,
        amount: BigInt(1_000_000),
        mint: Keypair.generate().publicKey,
        platformFee: {
          feeWallet: Keypair.generate().publicKey,
          feeAmount: BigInt(5_000),
        },
      })
    ).rejects.toThrow("Squads.proposeReimbursement: platformFee support ships in FW-068")
  })
})
