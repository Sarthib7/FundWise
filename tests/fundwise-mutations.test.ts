import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import { describe, expect, it, vi } from "vitest"
import {
  assertSettlementMatchesCurrentGraph,
  validateExpenseLedgerInput,
  verifyFundModeTreasuryAddresses,
} from "@/lib/server/fundwise-mutations"
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
  },
  {
    id: "00000000-0000-4000-8000-000000000012",
    group_id: groupId,
    wallet: "bob",
    display_name: "Bob",
    joined_at: "2026-05-06T00:00:00.000Z",
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

describe("validateExpenseLedgerInput", () => {
  it("accepts positive integer amounts with splits that sum exactly", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: 600 },
          { wallet: "bob", share: 400 },
        ],
      })
    ).not.toThrow()
  })

  it("rejects non-positive or unsafe Expense amounts", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 0,
        mint: expectedMint,
        expectedMint,
        splits: [{ wallet: "alice", share: 0 }],
      })
    ).toThrow("Expense amount must be a positive integer token amount.")

    expect(() =>
      validateExpenseLedgerInput({
        amount: Number.MAX_SAFE_INTEGER + 1,
        mint: expectedMint,
        expectedMint,
        splits: [{ wallet: "alice", share: Number.MAX_SAFE_INTEGER + 1 }],
      })
    ).toThrow("Expense amount must be a positive integer token amount.")
  })

  it("rejects split totals that do not match the Expense amount", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: 500 },
          { wallet: "bob", share: 400 },
        ],
      })
    ).toThrow("Expense split shares must add up to the full Expense amount.")
  })

  it("rejects split totals that exceed the safe integer range", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: Number.MAX_SAFE_INTEGER,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: Number.MAX_SAFE_INTEGER },
          { wallet: "bob", share: 1 },
        ],
      })
    ).toThrow("Expense split shares total exceeds the safe integer range.")
  })

  it("rejects negative, unsafe, empty, or duplicate split shares", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [{ wallet: "alice", share: -1000 }],
      })
    ).toThrow("Expense split shares must be non-negative integer token amounts.")

    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [],
      })
    ).toThrow("Expense must include at least one split.")

    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: expectedMint,
        expectedMint,
        splits: [
          { wallet: "alice", share: 500 },
          { wallet: "alice", share: 500 },
        ],
      })
    ).toThrow("Expense split wallets must be unique.")
  })

  it("rejects Expenses for the wrong Group stablecoin mint", () => {
    expect(() =>
      validateExpenseLedgerInput({
        amount: 1000,
        mint: "Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ",
        expectedMint,
        splits: [{ wallet: "alice", share: 1000 }],
      })
    ).toThrow("Expense mint does not match this Group stablecoin.")
  })
})

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
      transactionIndex: BigInt(0),
      staleTransactionIndex: BigInt(0),
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
