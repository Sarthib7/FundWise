import { supabase } from "./supabase"
import type { Database } from "./database.types"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"]
type ExpenseSplitRow = Database["public"]["Tables"]["expense_splits"]["Row"]
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"]
type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"]
type ProposalReviewRow = Database["public"]["Tables"]["proposal_approvals"]["Row"]

export type ProposalWithReviews = ProposalRow & { reviews: ProposalReviewRow[] }

export type ActivityItem =
  | { type: "expense"; data: ExpenseRow & { splits: ExpenseSplitRow[] } }
  | { type: "settlement"; data: SettlementRow }

export type GroupDashboardSnapshot = {
  authenticated: boolean
  isMember: boolean
  memberCount: number
  group: GroupRow | null
  members: MemberRow[]
  activity: ActivityItem[]
  contributions: ContributionRow[]
  proposals: ProposalWithReviews[]
}

export type SettlementReceiptView = {
  group: GroupRow
  members: MemberRow[]
  settlement: SettlementRow
}

async function requestJson<T>(input: string, init: RequestInit = {}) {
  const response = await fetch(input, {
    cache: init.cache ?? "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })

  const text = await response.text()
  const body = text ? (JSON.parse(text) as { error?: string } & T) : null

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`)
  }

  return body as T
}

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
  return requestJson<{ id: string; code: string }>("/api/groups", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateGroupTreasury(data: {
  groupId: string
  creatorWallet: string
  multisigAddress: string
  treasuryAddress: string
}) {
  await requestJson<{ ok: true }>(`/api/groups/${data.groupId}/treasury`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function getGroup(groupId: string, wallet?: string) {
  const snapshot = await getGroupDashboardSnapshot(groupId, wallet)

  if (!snapshot.group) {
    throw new Error("Group not found")
  }

  return snapshot.group
}

export async function getGroupByCode(code: string) {
  return requestJson<GroupRow | null>(`/api/groups?code=${encodeURIComponent(code.toUpperCase())}`)
}

export async function getGroupsForWallet(wallet: string) {
  return requestJson<GroupRow[]>(`/api/groups?wallet=${encodeURIComponent(wallet)}`)
}

export async function getGroupDashboardSnapshot(groupId: string, wallet?: string) {
  const search = wallet ? `?wallet=${encodeURIComponent(wallet)}` : ""
  return requestJson<GroupDashboardSnapshot>(`/api/groups/${groupId}${search}`)
}

// =============================================
// MEMBERS
// =============================================

async function getProfile(wallet: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    console.warn("[FundWise] Failed to load profile:", error.message)
    return null
  }

  return data
}

async function getProfileDisplayNames(wallets: string[]) {
  if (wallets.length === 0) {
    return new Map<string, string>()
  }

  const uniqueWallets = Array.from(new Set(wallets))
  const { data, error } = await supabase
    .from("profiles")
    .select("wallet, display_name")
    .in("wallet", uniqueWallets)

  if (error) {
    console.warn("[FundWise] Failed to load profile display names:", error.message)
    return new Map<string, string>()
  }

  return new Map(
    ((data || []) as Pick<ProfileRow, "wallet" | "display_name">[])
      .filter((profile) => Boolean(profile.display_name))
      .map((profile) => [profile.wallet, profile.display_name as string])
  )
}

export async function addMember(
  groupId: string,
  wallet: string,
  displayName?: string
) {
  await requestJson<{ ok: true }>(`/api/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({
      wallet,
      displayName,
    }),
  })
}

export async function getMembers(groupId: string) {
  const snapshot = await getGroupDashboardSnapshot(groupId)
  return snapshot.members
}

export async function isMember(groupId: string, wallet: string): Promise<boolean> {
  const snapshot = await getGroupDashboardSnapshot(groupId)
  return Boolean(wallet) && snapshot.authenticated && snapshot.isMember
}

export async function updateProfileDisplayName(wallet: string, displayName: string) {
  await requestJson<{ ok: true }>("/api/profile/display-name", {
    method: "POST",
    body: JSON.stringify({
      wallet,
      displayName,
    }),
  })
}

// =============================================
// EXPENSES
// =============================================

export async function addExpense(data: {
  groupId: string
  payer: string
  createdBy: string
  amount: number
  mint: string
  memo?: string
  category?: string
  splitMethod: "equal" | "exact" | "shares" | "percentage"
  splits: { wallet: string; share: number }[]
  sourceCurrency?: string
  sourceAmount?: number
  exchangeRate?: number
  exchangeRateSource?: string
  exchangeRateAt?: string
}) {
  return requestJson<{ id: string }>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  })
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

export async function deleteExpense(expenseId: string, actorWallet: string) {
  await requestJson<{ ok: true }>(`/api/expenses/${expenseId}`, {
    method: "DELETE",
    body: JSON.stringify({ actorWallet }),
  })
}

export async function updateExpense(data: {
  expenseId: string
  actorWallet: string
  payer: string
  amount: number
  mint: string
  memo?: string
  category?: string
  splitMethod: "equal" | "exact" | "shares" | "percentage"
  splits: { wallet: string; share: number }[]
  sourceCurrency?: string
  sourceAmount?: number
  exchangeRate?: number
  exchangeRateSource?: string
  exchangeRateAt?: string
}) {
  await requestJson<{ ok: true }>(`/api/expenses/${data.expenseId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
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
  return requestJson<{ id: string }>("/api/settlements", {
    method: "POST",
    body: JSON.stringify(data),
  })
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
  return requestJson<{ id: string }>("/api/contributions", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getContributions(groupId: string) {
  const snapshot = await getGroupDashboardSnapshot(groupId)
  return snapshot.contributions
}

export async function addProposal(data: {
  groupId: string
  proposerWallet: string
  recipientWallet: string
  amount: number
  mint: string
  squadsTransactionIndex: number
  squadsProposalAddress: string
  squadsTransactionAddress: string
  squadsCreateTxSig: string
  memo?: string
}) {
  return requestJson<ProposalRow>("/api/proposals", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getProposals(groupId: string) {
  const snapshot = await getGroupDashboardSnapshot(groupId)
  return snapshot.proposals
}

export async function reviewProposal(data: {
  proposalId: string
  memberWallet: string
  decision: "approved" | "rejected"
  txSig: string
}) {
  return requestJson<ProposalRow>(`/api/proposals/${data.proposalId}/review`, {
    method: "POST",
    body: JSON.stringify({
      memberWallet: data.memberWallet,
      decision: data.decision,
      txSig: data.txSig,
    }),
  })
}

export async function executeProposal(data: {
  proposalId: string
  executorWallet: string
  txSig: string
}) {
  return requestJson<ProposalRow>(`/api/proposals/${data.proposalId}/execute`, {
    method: "POST",
    body: JSON.stringify({
      executorWallet: data.executorWallet,
      txSig: data.txSig,
    }),
  })
}

export async function getSettlementById(settlementId: string) {
  const receipt = await getSettlementReceiptView(settlementId)
  return receipt.settlement
}

export async function getSettlementReceiptView(settlementId: string) {
  return requestJson<SettlementReceiptView>(`/api/settlements/${settlementId}`)
}

// =============================================
// ACTIVITY FEED
// =============================================

export async function getActivityFeed(groupId: string): Promise<ActivityItem[]> {
  const snapshot = await getGroupDashboardSnapshot(groupId)
  return snapshot.activity
}
