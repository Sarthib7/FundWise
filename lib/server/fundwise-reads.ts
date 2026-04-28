import type { Database } from "@/lib/database.types"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
type ExpenseSplitRow = Database["public"]["Tables"]["expense_splits"]["Row"]
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"]
type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]

type ActivityItem =
  | { type: "expense"; data: ExpenseRow & { splits: ExpenseSplitRow[] } }
  | { type: "settlement"; data: SettlementRow }

function getAdmin() {
  return getSupabaseAdmin()
}

async function getGroupOrNull(groupId: string): Promise<GroupRow | null> {
  const { data, error } = await getAdmin()
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load group: ${error.message}`)
  }

  return (data as GroupRow | null) ?? null
}

async function getSettlementOrNull(settlementId: string): Promise<SettlementRow | null> {
  const { data, error } = await getAdmin()
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load settlement: ${error.message}`)
  }

  return (data as SettlementRow | null) ?? null
}

async function getProfileDisplayNames(wallets: string[]) {
  if (wallets.length === 0) {
    return new Map<string, string>()
  }

  const uniqueWallets = Array.from(new Set(wallets))
  const { data, error } = await getAdmin()
    .from("profiles")
    .select("wallet, display_name")
    .in("wallet", uniqueWallets)

  if (error) {
    throw new FundWiseError(`Failed to load profile display names: ${error.message}`)
  }

  return new Map(
    ((data || []) as Pick<ProfileRow, "wallet" | "display_name">[])
      .filter((profile) => Boolean(profile.display_name))
      .map((profile) => [profile.wallet, profile.display_name as string])
  )
}

async function listMembers(groupId: string): Promise<MemberRow[]> {
  const { data, error } = await getAdmin()
    .from("members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true })

  if (error) {
    throw new FundWiseError(`Failed to load group members: ${error.message}`)
  }

  const members = (data || []) as MemberRow[]
  const profileDisplayNames = await getProfileDisplayNames(members.map((member) => member.wallet))

  return members.map((member) => ({
    ...member,
    display_name: profileDisplayNames.get(member.wallet) || member.display_name,
  }))
}

async function getMemberCount(groupId: string) {
  const { data, error } = await getAdmin()
    .from("members")
    .select("id")
    .eq("group_id", groupId)

  if (error) {
    throw new FundWiseError(`Failed to count group members: ${error.message}`)
  }

  return (data || []).length
}

async function isWalletGroupMember(groupId: string, wallet: string) {
  const { data, error } = await getAdmin()
    .from("members")
    .select("id")
    .eq("group_id", groupId)
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to validate group membership: ${error.message}`)
  }

  return Boolean(data)
}

async function listExpenses(groupId: string): Promise<ExpenseRow[]> {
  const { data, error } = await getAdmin()
    .from("expenses")
    .select("*")
    .eq("group_id", groupId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    throw new FundWiseError(`Failed to load expenses: ${error.message}`)
  }

  return (data || []) as ExpenseRow[]
}

async function listExpenseSplits(expenseIds: string[]): Promise<ExpenseSplitRow[]> {
  if (expenseIds.length === 0) {
    return [] as ExpenseSplitRow[]
  }

  const { data, error } = await getAdmin()
    .from("expense_splits")
    .select("*")
    .in("expense_id", expenseIds)

  if (error) {
    throw new FundWiseError(`Failed to load expense splits: ${error.message}`)
  }

  return (data || []) as ExpenseSplitRow[]
}

async function listSettlements(groupId: string): Promise<SettlementRow[]> {
  const { data, error } = await getAdmin()
    .from("settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("confirmed_at", { ascending: false })

  if (error) {
    throw new FundWiseError(`Failed to load settlements: ${error.message}`)
  }

  return (data || []) as SettlementRow[]
}

async function listContributions(groupId: string): Promise<ContributionRow[]> {
  const { data, error } = await getAdmin()
    .from("contributions")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new FundWiseError(`Failed to load contributions: ${error.message}`)
  }

  return (data || []) as ContributionRow[]
}

async function buildActivityFeed(groupId: string): Promise<ActivityItem[]> {
  const expenses = await listExpenses(groupId)
  const expenseSplits = await listExpenseSplits(expenses.map((expense) => expense.id))
  const settlements = await listSettlements(groupId)

  const splitsByExpense = new Map<string, ExpenseSplitRow[]>()

  for (const split of expenseSplits) {
    const currentSplits = splitsByExpense.get(split.expense_id) || []
    currentSplits.push(split)
    splitsByExpense.set(split.expense_id, currentSplits)
  }

  const activity: ActivityItem[] = [
    ...expenses.map((expense) => ({
      type: "expense" as const,
      data: {
        ...expense,
        splits: splitsByExpense.get(expense.id) || [],
      },
    })),
    ...settlements.map((settlement) => ({
      type: "settlement" as const,
      data: settlement,
    })),
  ]

  activity.sort((left, right) => {
    const leftTimestamp =
      left.type === "expense" ? new Date(left.data.created_at).getTime() : new Date(left.data.confirmed_at).getTime()
    const rightTimestamp =
      right.type === "expense" ? new Date(right.data.created_at).getTime() : new Date(right.data.confirmed_at).getTime()

    return rightTimestamp - leftTimestamp
  })

  return activity
}

export async function getGroupByCodeLookup(code: string): Promise<GroupRow | null> {
  const normalizedCode = code.trim().toUpperCase()

  if (!normalizedCode) {
    return null
  }

  const { data, error } = await getAdmin()
    .from("groups")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load group by code: ${error.message}`)
  }

  return (data as GroupRow | null) ?? null
}

export async function getGroupsForWalletRead(wallet: string): Promise<GroupRow[]> {
  const { data: memberships, error: membershipError } = await getAdmin()
    .from("members")
    .select("group_id")
    .eq("wallet", wallet)

  if (membershipError) {
    throw new FundWiseError(`Failed to load group memberships: ${membershipError.message}`)
  }

  const groupIds = ((memberships || []) as Array<{ group_id: string }>).map(
    (membership) => membership.group_id
  )

  if (groupIds.length === 0) {
    return [] as GroupRow[]
  }

  const { data, error } = await getAdmin()
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw new FundWiseError(`Failed to load groups: ${error.message}`)
  }

  return (data || []) as GroupRow[]
}

export async function getGroupDashboardSnapshot(groupId: string, viewerWallet?: string) {
  const group = await getGroupOrNull(groupId)

  if (!group) {
    throw new FundWiseError("Group not found", 404)
  }

  const authenticated = Boolean(viewerWallet)

  if (!viewerWallet || !(await isWalletGroupMember(groupId, viewerWallet))) {
    return {
      authenticated,
      isMember: false,
      memberCount: await getMemberCount(groupId),
      group,
      members: [] as MemberRow[],
      activity: [] as ActivityItem[],
      contributions: [] as ContributionRow[],
    }
  }

  const members = await listMembers(groupId)

  if (group.mode === "split") {
    return {
      authenticated: true,
      isMember: true,
      memberCount: members.length,
      group,
      members,
      activity: await buildActivityFeed(groupId),
      contributions: [] as ContributionRow[],
    }
  }

  return {
    authenticated: true,
    isMember: true,
    memberCount: members.length,
    group,
    members,
    activity: [] as ActivityItem[],
    contributions: await listContributions(groupId),
  }
}

export async function getSettlementReceiptView(settlementId: string, viewerWallet: string) {
  const settlement = await getSettlementOrNull(settlementId)

  if (!settlement) {
    throw new FundWiseError("Settlement not found", 404)
  }

  const isMember = await isWalletGroupMember(settlement.group_id, viewerWallet)

  if (!isMember) {
    throw new FundWiseError("Only Group Members can view this Settlement receipt.", 403)
  }

  const group = await getGroupOrNull(settlement.group_id)

  if (!group) {
    throw new FundWiseError("Group not found", 404)
  }

  return {
    group,
    members: await listMembers(settlement.group_id),
    settlement,
  }
}
