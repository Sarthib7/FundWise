import type { Database } from "@/lib/database.types"
import {
  computeBalancesFromActivity,
  simplifySettlements,
} from "@/lib/expense-engine"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getGroupDashboardSnapshot } from "@/lib/server/fundwise-reads"
import { verifySettlementTransfer } from "@/lib/server/solana-transfer-verification"
import {
  assertWalletsAreMembers,
  getAdmin,
  getGroupOrThrow,
} from "./_internal"

export type SettlementGraphActivity = Parameters<typeof computeBalancesFromActivity>[1]

export function assertSettlementMatchesCurrentGraph(data: {
  members: Database["public"]["Tables"]["members"]["Row"][]
  activity: SettlementGraphActivity
  fromWallet: string
  toWallet: string
  amount: number
}) {
  const balances = computeBalancesFromActivity(data.members, data.activity)
  const matchingTransfer = simplifySettlements(balances).find(
    (transfer) =>
      transfer.from === data.fromWallet &&
      transfer.to === data.toWallet &&
      transfer.amount === data.amount
  )

  if (!matchingTransfer) {
    throw new FundWiseError("Settlement does not match the current live Group Balance.", 409)
  }
}

async function insertSettlementWithoutLock(data: {
  groupId: string
  fromWallet: string
  toWallet: string
  amount: number
  mint: string
  txSig: string
}) {
  const { data: existingSettlement, error: existingSettlementError } = await getAdmin()
    .from("settlements")
    .select("id, group_id, from_wallet, to_wallet, amount, mint")
    .eq("tx_sig", data.txSig)
    .maybeSingle()

  if (existingSettlementError) {
    throw new FundWiseError(`Failed to check for duplicate Settlement transaction: ${existingSettlementError.message}`)
  }

  if (existingSettlement) {
    if (
      existingSettlement.group_id === data.groupId &&
      existingSettlement.from_wallet === data.fromWallet &&
      existingSettlement.to_wallet === data.toWallet &&
      existingSettlement.amount === data.amount &&
      existingSettlement.mint === data.mint
    ) {
      return { id: existingSettlement.id }
    }

    throw new FundWiseError("This Settlement transaction has already been recorded.")
  }

  const { data: settlement, error } = await getAdmin()
    .from("settlements")
    .insert({
      group_id: data.groupId,
      from_wallet: data.fromWallet,
      to_wallet: data.toWallet,
      amount: data.amount,
      mint: data.mint,
      tx_sig: data.txSig,
    })
    .select("id")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to add settlement: ${error.message}`)
  }

  return settlement
}

export async function addSettlementMutation(data: {
  groupId: string
  fromWallet: string
  toWallet: string
  amount: number
  mint: string
  txSig: string
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "split") {
    throw new FundWiseError("Settlements can only be recorded for Split Mode Groups.")
  }

  if (!Number.isFinite(data.amount) || data.amount <= 0 || !Number.isInteger(data.amount)) {
    throw new FundWiseError("Settlement amount must be a positive integer token amount.")
  }

  if (data.fromWallet === data.toWallet) {
    throw new FundWiseError("Settlement sender and recipient must be different Members.")
  }

  if (data.mint !== group.stablecoin_mint) {
    throw new FundWiseError("Settlement mint does not match this Group stablecoin.")
  }

  await assertWalletsAreMembers(
    data.groupId,
    [data.fromWallet, data.toWallet],
    "Settlement wallets must both be Members of this Group."
  )

  const settlementSnapshot = await getGroupDashboardSnapshot(data.groupId, data.fromWallet)
  assertSettlementMatchesCurrentGraph({
    members: settlementSnapshot.members,
    activity: settlementSnapshot.activity,
    fromWallet: data.fromWallet,
    toWallet: data.toWallet,
    amount: data.amount,
  })

  await verifySettlementTransfer({
    txSig: data.txSig,
    mint: data.mint,
    fromWallet: data.fromWallet,
    toWallet: data.toWallet,
    amount: data.amount,
  })

  // FW-053: dedupe + insert atomically under a row lock on the parent group.
  // The Postgres function takes `for update` on the group row, looks up an
  // existing settlement by tx_sig, and either returns the existing row or
  // inserts a new one. Two concurrent settlement calls for the same group
  // serialise on the lock; two calls for the same tx_sig return the same id.
  const { data: lockedResult, error: lockedError } = await getAdmin()
    .rpc("record_settlement_locked", {
      p_group_id: data.groupId,
      p_from_wallet: data.fromWallet,
      p_to_wallet: data.toWallet,
      p_amount: data.amount,
      p_mint: data.mint,
      p_tx_sig: data.txSig,
    })
    .single()

  if (lockedError) {
    if (lockedError.code === "23505") {
      throw new FundWiseError("This Settlement transaction has already been recorded with a different payload.")
    }

    if (lockedError.code === "PGRST202" || lockedError.message?.includes("record_settlement_locked")) {
      // Migration 20260514104435_add_record_settlement_with_lock.sql has not been
      // replayed on this database yet — fall back to the non-locked insert path
      // so devnet rehearsals keep moving while the migration lands on prod.
      return await insertSettlementWithoutLock(data)
    }

    throw new FundWiseError(`Failed to add settlement: ${lockedError.message}`)
  }

  if (!lockedResult) {
    throw new FundWiseError("Settlement insert returned no row from record_settlement_locked.")
  }

  return { id: (lockedResult as { settlement_id: string }).settlement_id }
}
