import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import { describe, expect, it, vi } from "vitest"
import * as Squads from "@/lib/squads/lifecycle"

type ProposalFromArgs = Parameters<typeof multisig.accounts.Proposal.fromArgs>[0]
type ProposalStatus = ProposalFromArgs["status"]

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

function makeProposalFixture(options: {
  statusKind?: "Draft" | "Active" | "Rejected" | "Approved" | "Executing" | "Executed" | "Cancelled"
  transactionIndex?: number
  approved?: PublicKey[]
  rejected?: PublicKey[]
  cancelled?: PublicKey[]
} = {}) {
  const transactionIndex = options.transactionIndex ?? 1
  const multisigPda = Keypair.generate().publicKey
  const transactionIndexBig = BigInt(transactionIndex)
  const [proposalPda] = multisig.getProposalPda({
    multisigPda,
    transactionIndex: transactionIndexBig,
  })
  const [transactionPda] = multisig.getTransactionPda({
    multisigPda,
    index: transactionIndexBig,
  })

  const statusKind = options.statusKind ?? "Active"
  // Squads `Executing` is the only variant without a payload; everything else
  // carries a `timestamp` field. Building the discriminated union by hand here
  // because the public types deliberately hide the constructor.
  const status: ProposalStatus =
    statusKind === "Executing"
      ? ({ __kind: "Executing" } as unknown as ProposalStatus)
      : ({
          __kind: statusKind,
          timestamp: BigInt(0) as unknown as ProposalStatus extends { timestamp: infer T } ? T : never,
        } as unknown as ProposalStatus)

  const [accountData] = multisig.accounts.Proposal.fromArgs({
    multisig: multisigPda,
    transactionIndex: transactionIndexBig as unknown as ProposalFromArgs["transactionIndex"],
    status,
    bump: 255,
    approved: options.approved ?? [],
    rejected: options.rejected ?? [],
    cancelled: options.cancelled ?? [],
  }).serialize()

  return {
    accountData,
    multisigAddress: multisigPda.toBase58(),
    proposalAddress: proposalPda.toBase58(),
    transactionAddress: transactionPda.toBase58(),
    transactionIndex,
  }
}

function makeAccountReader(account: { data: Buffer; owner: PublicKey; executable: boolean } | null) {
  return {
    getAccountInfo: vi.fn(async () => account),
  }
}

describe("Squads.verifyTreasury", () => {
  it("accepts a confirmed Squads-owned multisig with its index-0 vault PDA", async () => {
    const fixture = makeTreasuryFixture()

    await expect(
      Squads.verifyTreasury(
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
      Squads.verifyTreasury(
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
      Squads.verifyTreasury(
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
      Squads.verifyTreasury(
        {
          creatorWallet: fixture.creatorWallet,
          multisigAddress: fixture.multisigAddress,
          treasuryAddress: fixture.treasuryAddress,
        },
        makeAccountReader(null)
      )
    ).rejects.toThrow("Squads Multisig account is not confirmed on the configured Solana RPC.")

    await expect(
      Squads.verifyTreasury(
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
      Squads.verifyTreasury(
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
      Squads.verifyTreasury(
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

describe("Squads.verifyProposalMetadata", () => {
  it("accepts a Squads-owned Proposal whose PDA matches the multisig and index", async () => {
    const fixture = makeProposalFixture()

    await expect(
      Squads.verifyProposalMetadata(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
          transactionAddress: fixture.transactionAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).resolves.toBeUndefined()
  })

  it("rejects non-positive Squads transaction indexes before any RPC call", async () => {
    const fixture = makeProposalFixture()

    await expect(
      Squads.verifyProposalMetadata(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: 0,
          proposalAddress: fixture.proposalAddress,
          transactionAddress: fixture.transactionAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads transaction index must be a positive safe integer.")
  })

  it("rejects a Proposal address that is not the expected PDA", async () => {
    const fixture = makeProposalFixture()

    await expect(
      Squads.verifyProposalMetadata(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: Keypair.generate().publicKey.toBase58(),
          transactionAddress: fixture.transactionAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads Proposal address does not match the expected PDA.")
  })

  it("rejects a transaction address that is not the expected PDA", async () => {
    const fixture = makeProposalFixture()

    await expect(
      Squads.verifyProposalMetadata(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
          transactionAddress: Keypair.generate().publicKey.toBase58(),
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads transaction address does not match the expected PDA.")
  })

  it("rejects a Proposal account that is not owned by the Squads program", async () => {
    const fixture = makeProposalFixture()

    await expect(
      Squads.verifyProposalMetadata(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
          transactionAddress: fixture.transactionAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: SystemProgram.programId,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads Proposal account is not owned by the Squads program.")
  })
})

describe("Squads.verifyProposalReview", () => {
  it("returns the FundWise status when the reviewer wallet appears in the Squads approval set", async () => {
    const reviewer = Keypair.generate().publicKey
    const fixture = makeProposalFixture({
      statusKind: "Approved",
      approved: [reviewer],
    })

    await expect(
      Squads.verifyProposalReview(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
          memberWallet: reviewer.toBase58(),
          decision: "approved",
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).resolves.toBe("approved")
  })

  it("rejects when the reviewer wallet is missing from the Squads decision set", async () => {
    const reviewer = Keypair.generate().publicKey
    const fixture = makeProposalFixture({
      statusKind: "Active",
      approved: [],
    })

    await expect(
      Squads.verifyProposalReview(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
          memberWallet: reviewer.toBase58(),
          decision: "approved",
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads Proposal does not include this wallet review yet.")
  })

  it("maps each Squads status to the matching FundWise status", async () => {
    type Case = {
      statusKind: "Approved" | "Rejected" | "Executed" | "Cancelled" | "Active"
      decision: "approved" | "rejected"
      pick: "approved" | "rejected"
      expected: Squads.FundWiseProposalStatus
    }
    const cases: Case[] = [
      { statusKind: "Approved", decision: "approved", pick: "approved", expected: "approved" },
      { statusKind: "Rejected", decision: "rejected", pick: "rejected", expected: "rejected" },
      { statusKind: "Executed", decision: "approved", pick: "approved", expected: "executed" },
      { statusKind: "Cancelled", decision: "approved", pick: "approved", expected: "cancelled" },
      // Fallthrough: Active is not Approved/Rejected/Executed/Cancelled, so it
      // collapses to FundWise's "pending" bucket.
      { statusKind: "Active", decision: "approved", pick: "approved", expected: "pending" },
    ]

    for (const testCase of cases) {
      const reviewer = Keypair.generate().publicKey
      const fixture = makeProposalFixture({
        statusKind: testCase.statusKind,
        approved: testCase.pick === "approved" ? [reviewer] : [],
        rejected: testCase.pick === "rejected" ? [reviewer] : [],
      })

      await expect(
        Squads.verifyProposalReview(
          {
            multisigAddress: fixture.multisigAddress,
            transactionIndex: fixture.transactionIndex,
            proposalAddress: fixture.proposalAddress,
            memberWallet: reviewer.toBase58(),
            decision: testCase.decision,
          },
          makeAccountReader({
            data: fixture.accountData,
            owner: multisig.PROGRAM_ID,
            executable: false,
          })
        )
      ).resolves.toBe(testCase.expected)
    }
  })

  it("rejects when the Squads Proposal multisig does not match the Group multisig", async () => {
    const reviewer = Keypair.generate().publicKey
    const fixture = makeProposalFixture({
      statusKind: "Approved",
      approved: [reviewer],
    })

    await expect(
      Squads.verifyProposalReview(
        {
          multisigAddress: Keypair.generate().publicKey.toBase58(),
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
          memberWallet: reviewer.toBase58(),
          decision: "approved",
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads Proposal does not belong to this Group Multisig.")
  })
})

describe("Squads.verifyExecution", () => {
  it("accepts a Squads Proposal whose status is Executed", async () => {
    const fixture = makeProposalFixture({ statusKind: "Executed" })

    await expect(
      Squads.verifyExecution(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).resolves.toBeUndefined()
  })

  it("rejects a Squads Proposal that has not yet been executed on-chain", async () => {
    const fixture = makeProposalFixture({ statusKind: "Approved" })

    await expect(
      Squads.verifyExecution(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: fixture.transactionIndex,
          proposalAddress: fixture.proposalAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads Proposal has not been executed on-chain yet.")
  })

  it("rejects when the executed Proposal index does not match the FundWise Proposal index", async () => {
    const fixture = makeProposalFixture({ statusKind: "Executed", transactionIndex: 4 })

    await expect(
      Squads.verifyExecution(
        {
          multisigAddress: fixture.multisigAddress,
          transactionIndex: 5,
          proposalAddress: fixture.proposalAddress,
        },
        makeAccountReader({
          data: fixture.accountData,
          owner: multisig.PROGRAM_ID,
          executable: false,
        })
      )
    ).rejects.toThrow("Squads Proposal transaction index does not match the FundWise Proposal.")
  })
})
