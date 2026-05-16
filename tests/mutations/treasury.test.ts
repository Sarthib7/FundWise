import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import { describe, expect, it, vi } from "vitest"
import { verifyFundModeTreasuryAddresses } from "@/lib/server/mutations/treasury"

describe("verifyFundModeTreasuryAddresses", () => {
  function makeTreasuryFixture() {
    const multisigPda = Keypair.generate().publicKey
    const creatorWallet = Keypair.generate().publicKey
    const [treasuryPda] = multisig.getVaultPda({
      multisigPda,
      index: 0,
    })
    const [accountData] = multisig.accounts.Multisig.fromArgs({
      createKey: Keypair.generate().publicKey,
      configAuthority: PublicKey.default,
      threshold: 1,
      timeLock: 0,
      transactionIndex: BigInt(0) as unknown as Parameters<typeof multisig.accounts.Multisig.fromArgs>[0]['transactionIndex'],
      staleTransactionIndex: BigInt(0) as unknown as Parameters<typeof multisig.accounts.Multisig.fromArgs>[0]['staleTransactionIndex'],
      rentCollector: null,
      bump: 255,
      members: [
        {
          key: creatorWallet,
          permissions: multisig.types.Permissions.all(),
        },
      ],
    }).serialize()

    return {
      accountData,
      creatorWallet: creatorWallet.toBase58(),
      multisigAddress: multisigPda.toBase58(),
      treasuryAddress: treasuryPda.toBase58(),
    }
  }

  function makeAccountReader(account: { data: Buffer; owner: PublicKey; executable: boolean } | null) {
    return {
      getAccountInfo: vi.fn(async () => account),
    }
  }

  it("accepts a confirmed Squads-owned multisig with its index-0 vault PDA", async () => {
    const fixture = makeTreasuryFixture()

    await expect(
      verifyFundModeTreasuryAddresses(
        {
          creatorWallet: fixture.creatorWallet,
          multisigAddress: fixture.multisigAddress,
          treasuryAddress: fixture.treasuryAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).resolves.toBeUndefined()
  })

  it("rejects invalid Solana addresses before checking RPC state", async () => {
    await expect(
      verifyFundModeTreasuryAddresses(
        {
          creatorWallet: Keypair.generate().publicKey.toBase58(),
          multisigAddress: "not-a-solana-address",
          treasuryAddress: Keypair.generate().publicKey.toBase58(),
        },
        makeAccountReader({
          data: makeTreasuryFixture().accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Multisig address is not a valid Solana address.")
  })

  it("rejects a Treasury address that is not the multisig vault PDA", async () => {
    await expect(
      verifyFundModeTreasuryAddresses(
        {
          multisigAddress: Keypair.generate().publicKey.toBase58(),
          treasuryAddress: Keypair.generate().publicKey.toBase58(),
        },
        makeAccountReader({
          data: makeTreasuryFixture().accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Treasury address does not match the Squads vault PDA for this Multisig.")
  })

  it("rejects multisig accounts that are missing, wrong-owner, or executable", async () => {
    const fixture = makeTreasuryFixture()

    await expect(
      verifyFundModeTreasuryAddresses(
        {
          creatorWallet: fixture.creatorWallet,
          multisigAddress: fixture.multisigAddress,
          treasuryAddress: fixture.treasuryAddress,
        },
        makeAccountReader(null)
      )
    ).rejects.toThrow("Squads Multisig account is not confirmed on the configured Solana RPC.")

    await expect(
      verifyFundModeTreasuryAddresses(
        {
          creatorWallet: fixture.creatorWallet,
          multisigAddress: fixture.multisigAddress,
          treasuryAddress: fixture.treasuryAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: SystemProgram.programId,
          executable: false,
        })
      )
    ).rejects.toThrow("Multisig account is not owned by the Squads program.")

    await expect(
      verifyFundModeTreasuryAddresses(
        {
          creatorWallet: fixture.creatorWallet,
          multisigAddress: fixture.multisigAddress,
          treasuryAddress: fixture.treasuryAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: true,
        })
      )
    ).rejects.toThrow("Multisig address points to an executable account, not a Squads Multisig.")
  })

  it("rejects creator wallets that are not configured Squads members", async () => {
    const fixture = makeTreasuryFixture()

    await expect(
      verifyFundModeTreasuryAddresses(
        {
          creatorWallet: Keypair.generate().publicKey.toBase58(),
          multisigAddress: fixture.multisigAddress,
          treasuryAddress: fixture.treasuryAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Treasury creator wallet is not a configured Squads Multisig Member.")
  })
})
