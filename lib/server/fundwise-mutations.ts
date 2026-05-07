import type { Database, Json } from "@/lib/database.types"
import { FundWiseError } from "@/lib/server/fundwise-error"
import {
  verifyContributionTransfer,
  verifySettlementTransfer,
} from "@/lib/server/solana-transfer-verification"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"]

type SupabaseMutationError = {
  code?: string
  message?: string
}

type ExpenseSplitInput = {
  wallet: string
  share: number
}

type ExpenseUpdateRpcSplit = Json

function getAdmin() {
  return getSupabaseAdmin()
}

function isMissingExpenseCurrencyColumnError(error: SupabaseMutationError | null) {
  if (!error?.message) {
    return false
  }

  const message = error.message.toLowerCase()
  const missingColumnCodes = new Set(["42703", "PGRST204"])

  return (
    (error.code ? missingColumnCodes.has(error.code) : false) &&
    [
      "source_currency",
      "source_amount",
      "exchange_rate",
      "exchange_rate_source",
      "exchange_rate_at",
    ].some((columnName) => message.includes(columnName))
  )
}

function isFundModeInviteWallet(wallet: string) {
  const inviteWallets = (process.env.FUNDWISE_FUND_MODE_INVITE_WALLETS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  return inviteWallets.includes(wallet)
}

async function getGroupOrThrow(groupId: string) {
  const { data, error } = await getAdmin()
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load group: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError("Group not found")
  }

  return data
}

async function getExpenseOrThrow(expenseId: string) {
  const { data, error } = await getAdmin()
    .from("expenses")
    .select("id, group_id, created_by, created_at, edited_at, deleted_at")
    .eq("id", expenseId)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load expense: ${error.message}`)
  }

  if (!data || data.deleted_at) {
    throw new FundWiseError("Expense not found")
  }

  return data
}

async function getProfile(wallet: string): Promise<ProfileRow | null> {
  const { data, error } = await getAdmin()
    .from("profiles")
    .select("*")
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load profile: ${error.message}`)
  }

  return data
}

async function assertWalletIsMember(groupId: string, wallet: string, message: string) {
  const { data, error } = await getAdmin()
    .from("members")
    .select("id")
    .eq("group_id", groupId)
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to validate Group membership: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError(message)
  }
}

async function assertWalletsAreMembers(groupId: string, wallets: string[], message: string) {
  const uniqueWallets = Array.from(new Set(wallets))

  if (uniqueWallets.length === 0) {
    throw new FundWiseError(message)
  }

  const { data, error } = await getAdmin()
    .from("members")
    .select("wallet")
    .eq("group_id", groupId)
    .in("wallet", uniqueWallets)

  if (error) {
    throw new FundWiseError(`Failed to validate Group members: ${error.message}`)
  }

  if ((data || []).length !== uniqueWallets.length) {
    throw new FundWiseError(message)
  }
}

async function addMemberInternal(groupId: string, wallet: string, displayName?: string) {
  const profile = displayName ? null : await getProfile(wallet)

  const { error } = await getAdmin().from("members").insert({
    group_id: groupId,
    wallet,
    display_name: displayName || profile?.display_name || null,
  })

  if (error && error.code !== "23505") {
    throw new FundWiseError(`Failed to add member: ${error.message}`)
  }
}

export async function createGroupMutation(data: {
  name: string
  mode: "split" | "fund"
  stablecoinMint: string
  createdBy: string
  fundingGoal?: number
  approvalThreshold?: number
}) {
  if (data.mode === "fund" && !isFundModeInviteWallet(data.createdBy)) {
    throw new FundWiseError(
      "Fund Mode is currently invite-only while the treasury Proposal lifecycle is being finished."
    )
  }

  const insert: GroupInsert = {
    name: data.name,
    mode: data.mode,
    stablecoin_mint: data.stablecoinMint,
    created_by: data.createdBy,
    funding_goal: data.fundingGoal ?? null,
    approval_threshold: data.approvalThreshold ?? null,
  }

  const { data: group, error } = await getAdmin()
    .from("groups")
    .insert(insert)
    .select("id, code")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to create group: ${error.message}`)
  }

  await addMemberInternal(group.id, data.createdBy)

  return group
}

export async function addMemberMutation(data: {
  groupId: string
  wallet: string
  displayName?: string
}) {
  await getGroupOrThrow(data.groupId)
  await addMemberInternal(data.groupId, data.wallet, data.displayName)
}

export async function updateProfileDisplayNameMutation(wallet: string, displayName: string) {
  const trimmedDisplayName = displayName.trim()

  if (!trimmedDisplayName) {
    throw new FundWiseError("Display name cannot be empty.")
  }

  if (trimmedDisplayName.length > 32) {
    throw new FundWiseError("Display name must be 32 characters or fewer.")
  }

  const { error: profileError } = await getAdmin().from("profiles").upsert(
    {
      wallet,
      display_name: trimmedDisplayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "wallet" }
  )

  if (profileError) {
    throw new FundWiseError(`Failed to update profile: ${profileError.message}`)
  }

  const { error: memberError } = await getAdmin()
    .from("members")
    .update({ display_name: trimmedDisplayName })
    .eq("wallet", wallet)

  if (memberError) {
    throw new FundWiseError(`Failed to sync display name across Groups: ${memberError.message}`)
  }
}

export async function addExpenseMutation(data: {
  groupId: string
  payer: string
  createdBy: string
  amount: number
  mint: string
  memo?: string
  category?: string
  splitMethod: "equal" | "exact" | "shares" | "percentage"
  splits: ExpenseSplitInput[]
  sourceCurrency?: string
  sourceAmount?: number
  exchangeRate?: number
  exchangeRateSource?: string
  exchangeRateAt?: string
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "split") {
    throw new FundWiseError("Expenses can only be added to Split Mode Groups.")
  }

  await assertWalletIsMember(
    data.groupId,
    data.createdBy,
    "Only Group Members can create Expenses."
  )
  await assertWalletsAreMembers(
    data.groupId,
    [data.payer, ...data.splits.map((split) => split.wallet)],
    "Every Expense participant must already be a Member of this Group."
  )

  const expenseInsertBase: ExpenseInsert = {
    group_id: data.groupId,
    payer: data.payer,
    created_by: data.createdBy,
    amount: data.amount,
    mint: data.mint,
    memo: data.memo || null,
    category: data.category || "general",
    split_method: data.splitMethod,
  }
  const expenseInsertWithCurrency: ExpenseInsert = {
    ...expenseInsertBase,
    source_currency: data.sourceCurrency || "USD",
    source_amount: data.sourceAmount ?? data.amount,
    exchange_rate: data.exchangeRate ?? 1.0,
    exchange_rate_source:
      data.exchangeRateSource ||
      (data.sourceCurrency && data.sourceCurrency !== "USD" ? "open.er-api.com" : "default"),
    exchange_rate_at: data.exchangeRateAt || new Date().toISOString(),
  }

  let { data: expense, error: expenseError } = await getAdmin()
    .from("expenses")
    .insert(expenseInsertWithCurrency)
    .select("id")
    .single()

  if (expenseError && isMissingExpenseCurrencyColumnError(expenseError)) {
    const fallbackResult = await getAdmin()
      .from("expenses")
      .insert(expenseInsertBase)
      .select("id")
      .single()

    expense = fallbackResult.data
    expenseError = fallbackResult.error
  }

  if (expenseError || !expense) {
    throw new FundWiseError(`Failed to add expense: ${expenseError?.message || "unknown error"}`)
  }

  const { error: splitsError } = await getAdmin().from("expense_splits").insert(
    data.splits.map((split) => ({
      expense_id: expense.id,
      wallet: split.wallet,
      share: split.share,
    }))
  )

  if (splitsError) {
    throw new FundWiseError(`Failed to add expense splits: ${splitsError.message}`)
  }

  return expense
}

export async function updateExpenseMutation(data: {
  expenseId: string
  actorWallet: string
  payer: string
  amount: number
  mint: string
  memo?: string
  category?: string
  splitMethod: "equal" | "exact" | "shares" | "percentage"
  splits: ExpenseSplitInput[]
  sourceCurrency?: string
  sourceAmount?: number
  exchangeRate?: number
  exchangeRateSource?: string
  exchangeRateAt?: string
}) {
  const expense = await getExpenseOrThrow(data.expenseId)

  await assertWalletsAreMembers(
    expense.group_id,
    [data.payer, ...data.splits.map((split) => split.wallet)],
    "Every updated Expense participant must already be a Member of this Group."
  )

  const { error } = await getAdmin().rpc("update_expense_with_splits", {
    p_expense_id: data.expenseId,
    p_actor_wallet: data.actorWallet,
    p_payer: data.payer,
    p_amount: data.amount,
    p_mint: data.mint,
    p_memo: data.memo || null,
    p_category: data.category || null,
    p_split_method: data.splitMethod,
    p_splits: data.splits as ExpenseUpdateRpcSplit[],
  })

  if (error) {
    throw new FundWiseError(`Failed to update expense: ${error.message}`)
  }

  // Update currency fields separately (not in the RPC)
  if (data.sourceCurrency || data.sourceAmount || data.exchangeRate) {
    const { error: currencyError } = await getAdmin()
      .from("expenses")
      .update({
        source_currency: data.sourceCurrency || "USD",
        source_amount: data.sourceAmount ?? data.amount,
        exchange_rate: data.exchangeRate ?? 1.0,
        exchange_rate_source:
          data.exchangeRateSource ||
          (data.sourceCurrency && data.sourceCurrency !== "USD" ? "open.er-api.com" : "default"),
        exchange_rate_at: data.exchangeRateAt || new Date().toISOString(),
      })
      .eq("id", data.expenseId)

    if (currencyError) {
      if (isMissingExpenseCurrencyColumnError(currencyError)) {
        return
      }

      throw new FundWiseError(`Failed to update expense currency fields: ${currencyError.message}`)
    }
  }
}

export async function deleteExpenseMutation(expenseId: string, actorWallet: string) {
  const { data: expense, error: expenseError } = await getAdmin()
    .from("expenses")
    .select("id, group_id, created_at, edited_at, deleted_at, created_by")
    .eq("id", expenseId)
    .maybeSingle()

  if (expenseError) {
    throw new FundWiseError(`Failed to load expense before delete: ${expenseError.message}`)
  }

  if (!expense || expense.deleted_at) {
    throw new FundWiseError("Expense not found")
  }

  if (expense.created_by !== actorWallet) {
    throw new FundWiseError("Only the Expense creator can delete this Expense")
  }

  const expenseLockTimestamp = expense.edited_at || expense.created_at

  const { data: laterSettlement, error: settlementError } = await getAdmin()
    .from("settlements")
    .select("id")
    .eq("group_id", expense.group_id)
    .gt("confirmed_at", expenseLockTimestamp)
    .limit(1)
    .maybeSingle()

  if (settlementError) {
    throw new FundWiseError(`Failed to validate expense delete guard: ${settlementError.message}`)
  }

  if (laterSettlement) {
    throw new FundWiseError(
      "This expense is locked because a later settlement has already been recorded in the group"
    )
  }

  const { error } = await getAdmin()
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId)

  if (error) {
    throw new FundWiseError(`Failed to delete expense: ${error.message}`)
  }
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

  const { data: existingSettlement, error: existingSettlementError } = await getAdmin()
    .from("settlements")
    .select("id")
    .eq("tx_sig", data.txSig)
    .maybeSingle()

  if (existingSettlementError) {
    throw new FundWiseError(`Failed to check for duplicate Settlement transaction: ${existingSettlementError.message}`)
  }

  if (existingSettlement) {
    throw new FundWiseError("This Settlement transaction has already been recorded.")
  }

  await verifySettlementTransfer({
    txSig: data.txSig,
    mint: data.mint,
    fromWallet: data.fromWallet,
    toWallet: data.toWallet,
    amount: data.amount,
  })

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

export async function addContributionMutation(data: {
  groupId: string
  memberWallet: string
  amount: number
  mint: string
  txSig: string
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Contributions can only be recorded for Fund Mode Groups.")
  }

  if (!Number.isFinite(data.amount) || data.amount <= 0 || !Number.isInteger(data.amount)) {
    throw new FundWiseError("Contribution amount must be a positive integer token amount.")
  }

  if (data.mint !== group.stablecoin_mint) {
    throw new FundWiseError("Contribution mint does not match this Group stablecoin.")
  }

  if (!group.treasury_address) {
    throw new FundWiseError("Treasury is not initialized for this Group.")
  }

  await assertWalletIsMember(
    data.groupId,
    data.memberWallet,
    "Only Group Members can record Contributions."
  )

  const { data: existingContribution, error: existingContributionError } = await getAdmin()
    .from("contributions")
    .select("id")
    .eq("tx_sig", data.txSig)
    .maybeSingle()

  if (existingContributionError) {
    throw new FundWiseError(`Failed to check for duplicate Contribution transaction: ${existingContributionError.message}`)
  }

  if (existingContribution) {
    throw new FundWiseError("This Contribution transaction has already been recorded.")
  }

  await verifyContributionTransfer({
    txSig: data.txSig,
    mint: data.mint,
    memberWallet: data.memberWallet,
    treasuryAddress: group.treasury_address,
    amount: data.amount,
  })

  const { data: contribution, error } = await getAdmin()
    .from("contributions")
    .insert({
      group_id: data.groupId,
      member_wallet: data.memberWallet,
      amount: data.amount,
      mint: data.mint,
      tx_sig: data.txSig,
    })
    .select("id")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to add contribution: ${error.message}`)
  }

  return contribution
}

export async function updateGroupTreasuryMutation(data: {
  groupId: string
  creatorWallet: string
  multisigAddress: string
  treasuryAddress: string
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Only Fund Mode Groups can initialize a Treasury.")
  }

  const { data: updatedGroup, error } = await getAdmin()
    .from("groups")
    .update({
      multisig_address: data.multisigAddress,
      treasury_address: data.treasuryAddress,
    })
    .eq("id", data.groupId)
    .eq("created_by", data.creatorWallet)
    .select("id")
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to update treasury addresses: ${error.message}`)
  }

  if (!updatedGroup) {
    throw new FundWiseError("Only the Group creator can initialize the Treasury")
  }
}
