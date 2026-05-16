import type { Database, Json } from "@/lib/database.types"
import { FundWiseError } from "@/lib/server/fundwise-error"
import {
  assertWalletIsMember,
  assertWalletsAreMembers,
  getAdmin,
  getGroupOrThrow,
  type SupabaseMutationError,
} from "./_internal"

export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"]
export type ExpenseSplitInput = {
  wallet: string
  share: number
}
export type ExpenseUpdateRpcSplit = Json

export function validateExpenseLedgerInput(data: {
  amount: number
  mint: string
  expectedMint: string
  splits: ExpenseSplitInput[]
}) {
  if (!Number.isSafeInteger(data.amount) || data.amount <= 0) {
    throw new FundWiseError("Expense amount must be a positive integer token amount.")
  }

  if (data.mint !== data.expectedMint) {
    throw new FundWiseError("Expense mint does not match this Group stablecoin.")
  }

  if (data.splits.length === 0) {
    throw new FundWiseError("Expense must include at least one split.")
  }

  const seenWallets = new Set<string>()
  let splitTotal = 0

  for (const split of data.splits) {
    if (!split.wallet) {
      throw new FundWiseError("Every Expense split must include a Member wallet.")
    }

    if (seenWallets.has(split.wallet)) {
      throw new FundWiseError("Expense split wallets must be unique.")
    }

    seenWallets.add(split.wallet)

    if (!Number.isSafeInteger(split.share) || split.share < 0) {
      throw new FundWiseError("Expense split shares must be non-negative integer token amounts.")
    }

    splitTotal += split.share

    if (!Number.isSafeInteger(splitTotal)) {
      throw new FundWiseError("Expense split shares total exceeds the safe integer range.")
    }
  }

  if (splitTotal !== data.amount) {
    throw new FundWiseError("Expense split shares must add up to the full Expense amount.")
  }
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

  validateExpenseLedgerInput({
    amount: data.amount,
    mint: data.mint,
    expectedMint: group.stablecoin_mint,
    splits: data.splits,
  })

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
  const group = await getGroupOrThrow(expense.group_id)

  validateExpenseLedgerInput({
    amount: data.amount,
    mint: data.mint,
    expectedMint: group.stablecoin_mint,
    splits: data.splits,
  })

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
