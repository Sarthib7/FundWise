import { supabase } from "./supabase"
import type { Database } from "./database.types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
type ExpenseSplitRow = Database["public"]["Tables"]["expense_splits"]["Row"]
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"]

// =============================================
// GROUPS
// =============================================

export async function createGroup(data: {
  name: string
  mode: "split" | "fund"
  stablecoinMint: string
  createdBy: string
  fundingGoal?: number
  approvalThreshold?: number
}): Promise<{ id: string; code: string }> {
  const insert: GroupInsert = {
    name: data.name,
    mode: data.mode,
    stablecoin_mint: data.stablecoinMint,
    created_by: data.createdBy,
    funding_goal: data.fundingGoal ?? null,
    approval_threshold: data.approvalThreshold ?? null,
  }

  const { data: group, error } = await supabase
    .from("groups")
    .insert(insert)
    .select("id, code")
    .single()

  if (error) throw new Error(`Failed to create group: ${error.message}`)

  // Add creator as first member
  await addMember(group.id, data.createdBy)

  return { id: group.id, code: group.code }
}

export async function updateGroupTreasury(data: {
  groupId: string
  creatorWallet: string
  multisigAddress: string
  treasuryAddress: string
}) {
  const { data: updatedGroup, error } = await supabase
    .from("groups")
    .update({
      multisig_address: data.multisigAddress,
      treasury_address: data.treasuryAddress,
    })
    .eq("id", data.groupId)
    .eq("created_by", data.creatorWallet)
    .select("id")
    .maybeSingle()

  if (error) throw new Error(`Failed to update treasury addresses: ${error.message}`)
  if (!updatedGroup) {
    throw new Error("Only the group creator can initialize the Treasury")
  }
}

export async function getGroup(groupId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single()

  if (error) throw new Error(`Failed to get group: ${error.message}`)
  return data
}

export async function getGroupByCode(code: string) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("code", code.toUpperCase())
    .single()

  if (error) return null
  return data
}

export async function getGroupsForWallet(wallet: string) {
  // Get all group IDs where the wallet is a member
  const { data: memberships, error: memberError } = await supabase
    .from("members")
    .select("group_id")
    .eq("wallet", wallet)

  if (memberError) throw new Error(`Failed to get memberships: ${memberError.message}`)
  if (!memberships || memberships.length === 0) return []

  const groupIds = memberships.map((m) => m.group_id)

  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to get groups: ${error.message}`)
  return groups
}

// =============================================
// MEMBERS
// =============================================

export async function addMember(
  groupId: string,
  wallet: string,
  displayName?: string
) {
  const { error } = await supabase.from("members").insert({
    group_id: groupId,
    wallet,
    display_name: displayName || null,
  })

  if (error) {
    // Ignore duplicate key errors (already a member)
    if (error.code === "23505") return
    throw new Error(`Failed to add member: ${error.message}`)
  }
}

export async function getMembers(groupId: string) {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true })

  if (error) throw new Error(`Failed to get members: ${error.message}`)
  return data
}

export async function isMember(groupId: string, wallet: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("members")
    .select("id")
    .eq("group_id", groupId)
    .eq("wallet", wallet)
    .single()

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to check membership: ${error.message}`)
  }
  return !!data
}

// =============================================
// EXPENSES
// =============================================

export async function addExpense(data: {
  groupId: string
  payer: string
  amount: number
  mint: string
  memo?: string
  category?: string
  splitMethod: "equal" | "exact" | "shares" | "percentage"
  splits: { wallet: string; share: number }[]
}) {
  // Insert expense
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      group_id: data.groupId,
      payer: data.payer,
      amount: data.amount,
      mint: data.mint,
      memo: data.memo || null,
      category: data.category || "general",
      split_method: data.splitMethod,
    })
    .select("id")
    .single()

  if (expenseError) throw new Error(`Failed to add expense: ${expenseError.message}`)

  // Insert splits
  const splits = data.splits.map((s) => ({
    expense_id: expense.id,
    wallet: s.wallet,
    share: s.share,
  }))

  const { error: splitsError } = await supabase.from("expense_splits").insert(splits)

  if (splitsError) throw new Error(`Failed to add splits: ${splitsError.message}`)

  return expense
}

export async function getExpenses(groupId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to get expenses: ${error.message}`)
  return data
}

export async function getExpenseSplits(expenseId: string) {
  const { data, error } = await supabase
    .from("expense_splits")
    .select("*")
    .eq("expense_id", expenseId)

  if (error) throw new Error(`Failed to get splits: ${error.message}`)
  return data
}

export async function getAllSplitsForGroup(groupId: string) {
  const { data, error } = await supabase
    .from("expense_splits")
    .select("*, expenses!inner(group_id)")
    .eq("expenses.group_id", groupId)

  if (error) throw new Error(`Failed to get group splits: ${error.message}`)
  return data
}

export async function deleteExpense(expenseId: string) {
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .select("id, group_id, created_at, edited_at, deleted_at")
    .eq("id", expenseId)
    .maybeSingle()

  if (expenseError) {
    throw new Error(`Failed to load expense before delete: ${expenseError.message}`)
  }

  if (!expense || expense.deleted_at) {
    throw new Error("Expense not found")
  }

  // Conservative guard: once a later settlement exists in the group, deleting
  // this expense would rewrite the balance history that settlement relied on.
  const expenseLockTimestamp = expense.edited_at || expense.created_at

  const { data: laterSettlement, error: settlementError } = await supabase
    .from("settlements")
    .select("id")
    .eq("group_id", expense.group_id)
    .gt("confirmed_at", expenseLockTimestamp)
    .limit(1)
    .maybeSingle()

  if (settlementError) {
    throw new Error(`Failed to validate expense delete guard: ${settlementError.message}`)
  }

  if (laterSettlement) {
    throw new Error(
      "This expense is locked because a later settlement has already been recorded in the group"
    )
  }

  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId)

  if (error) throw new Error(`Failed to delete expense: ${error.message}`)
}

// =============================================
// SETTLEMENTS
// =============================================

export async function addSettlement(data: {
  groupId: string
  fromWallet: string
  toWallet: string
  amount: number
  mint: string
  txSig: string
}) {
  const { data: settlement, error } = await supabase
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

  if (error) throw new Error(`Failed to add settlement: ${error.message}`)
  return settlement
}

export async function getSettlements(groupId: string) {
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("confirmed_at", { ascending: false })

  if (error) throw new Error(`Failed to get settlements: ${error.message}`)
  return data
}

export async function addContribution(data: {
  groupId: string
  memberWallet: string
  amount: number
  mint: string
  txSig: string
}) {
  const { data: contribution, error } = await supabase
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

  if (error) throw new Error(`Failed to add contribution: ${error.message}`)
  return contribution
}

export async function getContributions(groupId: string) {
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to get contributions: ${error.message}`)
  return data
}

export async function getSettlementById(settlementId: string) {
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .single()

  if (error) throw new Error(`Failed to get settlement: ${error.message}`)
  return data
}

// =============================================
// ACTIVITY FEED
// =============================================

export type ActivityItem =
  | { type: "expense"; data: ExpenseRow & { splits: ExpenseSplitRow[] } }
  | { type: "settlement"; data: SettlementRow }

export async function getActivityFeed(groupId: string): Promise<ActivityItem[]> {
  const [expenses, expenseSplitsData, settlements] = await Promise.all([
    getExpenses(groupId),
    getAllSplitsForGroup(groupId),
    getSettlements(groupId),
  ])

  // Group splits by expense_id
  const splitsByExpense: Record<string, ExpenseSplitRow[]> = {}
  for (const split of expenseSplitsData) {
    const eid = split.expense_id
    if (!splitsByExpense[eid]) splitsByExpense[eid] = []
    splitsByExpense[eid].push(split)
  }

  const items: ActivityItem[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      data: { ...e, splits: splitsByExpense[e.id] || [] },
    })),
    ...settlements.map((s) => ({
      type: "settlement" as const,
      data: s,
    })),
  ]

  // Sort by created_at / confirmed_at descending
  items.sort((a, b) => {
    const dateA = a.type === "expense" ? a.data.created_at : a.data.confirmed_at
    const dateB = b.type === "expense" ? b.data.created_at : b.data.confirmed_at
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  return items
}
