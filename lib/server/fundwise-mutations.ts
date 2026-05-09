import type { Database, Json } from "@/lib/database.types"
import { Connection, PublicKey, type AccountInfo } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import {
  computeBalancesFromActivity,
  simplifySettlements,
} from "@/lib/expense-engine"
import { getSolanaRpcUrl } from "@/lib/solana-cluster"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getGroupDashboardSnapshot } from "@/lib/server/fundwise-reads"
import {
  verifyContributionTransfer,
  verifyProposalExecutionTransfer,
  verifySettlementTransfer,
} from "@/lib/server/solana-transfer-verification"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"]
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"]
type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"]
type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"]
type SettlementGraphActivity = Parameters<typeof computeBalancesFromActivity>[1]

type SupabaseMutationError = {
  code?: string
  message?: string
}

type ExpenseSplitInput = {
  wallet: string
  share: number
}

type ExpenseUpdateRpcSplit = Json
type SolanaAccountInfo = {
  data: Buffer
  owner: PublicKey
  executable: boolean
}
type TreasuryAccountReader = {
  getAccountInfo(address: PublicKey, commitment: "confirmed"): Promise<SolanaAccountInfo | null>
}
type SquadsProposalReader = {
  getAccountInfo(address: PublicKey, commitment: "confirmed"): Promise<SolanaAccountInfo | null>
}

function getAdmin() {
  return getSupabaseAdmin()
}

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

export function validateProposalInput(data: {
  amount: number
  mint: string
  expectedMint: string
  memo?: string | null
}) {
  if (!Number.isSafeInteger(data.amount) || data.amount <= 0) {
    throw new FundWiseError("Proposal amount must be a positive integer token amount.")
  }

  if (data.mint !== data.expectedMint) {
    throw new FundWiseError("Proposal mint does not match this Group stablecoin.")
  }

  const memo = data.memo?.trim() || null

  if (memo && memo.length > 240) {
    throw new FundWiseError("Proposal memo must be 240 characters or fewer.")
  }

  return { memo }
}

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

function parsePublicKey(address: string, label: string) {
  try {
    return new PublicKey(address)
  } catch {
    throw new FundWiseError(`${label} is not a valid Solana address.`)
  }
}

export async function verifyFundModeTreasuryAddresses(
  data: {
    creatorWallet?: string
    multisigAddress: string
    treasuryAddress: string
  },
  accountReader: TreasuryAccountReader = new Connection(getSolanaRpcUrl(), "confirmed")
) {
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const treasuryPubkey = parsePublicKey(data.treasuryAddress, "Treasury address")
  const [expectedTreasuryPda] = multisig.getVaultPda({
    multisigPda: multisigPubkey,
    index: 0,
  })

  if (!treasuryPubkey.equals(expectedTreasuryPda)) {
    throw new FundWiseError("Treasury address does not match the Squads vault PDA for this Multisig.")
  }

  const multisigAccount = await accountReader.getAccountInfo(multisigPubkey, "confirmed")

  if (!multisigAccount) {
    throw new FundWiseError("Squads Multisig account is not confirmed on the configured Solana RPC.")
  }

  if (!multisigAccount.owner.equals(multisig.PROGRAM_ID)) {
    throw new FundWiseError("Multisig account is not owned by the Squads program.")
  }

  if (multisigAccount.executable) {
    throw new FundWiseError("Multisig address points to an executable account, not a Squads Multisig.")
  }

  if (data.creatorWallet) {
    const creatorPubkey = parsePublicKey(data.creatorWallet, "Creator wallet")
    let decodedMultisig: multisig.accounts.Multisig

    try {
      ;[decodedMultisig] = multisig.accounts.Multisig.fromAccountInfo(
        multisigAccount as AccountInfo<Buffer>
      )
    } catch {
      throw new FundWiseError("Multisig account data could not be decoded as a Squads Multisig.")
    }

    const creatorIsMultisigMember = decodedMultisig.members.some((member) =>
      member.key.equals(creatorPubkey)
    )

    if (!creatorIsMultisigMember) {
      throw new FundWiseError("Treasury creator wallet is not a configured Squads Multisig Member.")
    }
  }
}

async function loadSquadsProposal(
  proposalAddress: string,
  accountReader: SquadsProposalReader = new Connection(getSolanaRpcUrl(), "confirmed")
) {
  const proposalPubkey = parsePublicKey(proposalAddress, "Squads Proposal address")
  const proposalAccount = await accountReader.getAccountInfo(proposalPubkey, "confirmed")

  if (!proposalAccount) {
    throw new FundWiseError("Squads Proposal account is not confirmed on the configured Solana RPC.")
  }

  if (!proposalAccount.owner.equals(multisig.PROGRAM_ID)) {
    throw new FundWiseError("Squads Proposal account is not owned by the Squads program.")
  }

  try {
    const [proposal] = multisig.accounts.Proposal.fromAccountInfo(
      proposalAccount as AccountInfo<Buffer>
    )
    return proposal
  } catch {
    throw new FundWiseError("Squads Proposal account data could not be decoded.")
  }
}

async function verifySquadsProposalMetadata(data: {
  multisigAddress: string
  transactionIndex: number
  proposalAddress: string
  transactionAddress: string
}) {
  if (!Number.isSafeInteger(data.transactionIndex) || data.transactionIndex < 1) {
    throw new FundWiseError("Squads transaction index must be a positive safe integer.")
  }

  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const proposalPubkey = parsePublicKey(data.proposalAddress, "Squads Proposal address")
  const transactionPubkey = parsePublicKey(data.transactionAddress, "Squads transaction address")
  const transactionIndex = BigInt(data.transactionIndex)
  const [expectedProposalPda] = multisig.getProposalPda({
    multisigPda: multisigPubkey,
    transactionIndex,
  })
  const [expectedTransactionPda] = multisig.getTransactionPda({
    multisigPda: multisigPubkey,
    index: transactionIndex,
  })

  if (!proposalPubkey.equals(expectedProposalPda)) {
    throw new FundWiseError("Squads Proposal address does not match the expected PDA.")
  }

  if (!transactionPubkey.equals(expectedTransactionPda)) {
    throw new FundWiseError("Squads transaction address does not match the expected PDA.")
  }

  const proposal = await loadSquadsProposal(data.proposalAddress)

  if (!proposal.multisig.equals(multisigPubkey)) {
    throw new FundWiseError("Squads Proposal does not belong to this Group Multisig.")
  }

  if (BigInt(proposal.transactionIndex.toString()) !== transactionIndex) {
    throw new FundWiseError("Squads Proposal transaction index does not match the FundWise Proposal.")
  }
}

async function verifySquadsProposalReview(data: {
  multisigAddress: string
  transactionIndex: number
  proposalAddress: string
  memberWallet: string
  decision: "approved" | "rejected"
}) {
  const proposal = await loadSquadsProposal(data.proposalAddress)
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const memberPubkey = parsePublicKey(data.memberWallet, "Reviewer wallet")

  if (!proposal.multisig.equals(multisigPubkey)) {
    throw new FundWiseError("Squads Proposal does not belong to this Group Multisig.")
  }

  if (BigInt(proposal.transactionIndex.toString()) !== BigInt(data.transactionIndex)) {
    throw new FundWiseError("Squads Proposal transaction index does not match the FundWise Proposal.")
  }

  const reviewedWallets = data.decision === "approved" ? proposal.approved : proposal.rejected
  const hasReview = reviewedWallets.some((wallet) => wallet.equals(memberPubkey))

  if (!hasReview) {
    throw new FundWiseError("Squads Proposal does not include this wallet review yet.")
  }

  return proposal.pretty().status
}

async function verifySquadsProposalExecuted(data: {
  multisigAddress: string
  transactionIndex: number
  proposalAddress: string
}) {
  const proposal = await loadSquadsProposal(data.proposalAddress)
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")

  if (!proposal.multisig.equals(multisigPubkey)) {
    throw new FundWiseError("Squads Proposal does not belong to this Group Multisig.")
  }

  if (BigInt(proposal.transactionIndex.toString()) !== BigInt(data.transactionIndex)) {
    throw new FundWiseError("Squads Proposal transaction index does not match the FundWise Proposal.")
  }

  if (proposal.pretty().status !== "Executed") {
    throw new FundWiseError("Squads Proposal has not been executed on-chain yet.")
  }
}

function mapSquadsStatusToFundWiseStatus(
  status: "Draft" | "Active" | "Rejected" | "Approved" | "Executing" | "Executed" | "Cancelled"
) {
  if (status === "Approved") return "approved"
  if (status === "Rejected") return "rejected"
  if (status === "Executed") return "executed"
  if (status === "Cancelled") return "cancelled"
  return "pending"
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

async function getProposalOrThrow(proposalId: string): Promise<ProposalRow> {
  const { data, error } = await getAdmin()
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load Proposal: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError("Proposal not found")
  }

  return data as ProposalRow
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

  const latestSettlementSnapshot = await getGroupDashboardSnapshot(data.groupId, data.fromWallet)
  assertSettlementMatchesCurrentGraph({
    members: latestSettlementSnapshot.members,
    activity: latestSettlementSnapshot.activity,
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

export async function addProposalMutation(data: {
  groupId: string
  proposerWallet: string
  recipientWallet: string
  amount: number
  mint: string
  squadsTransactionIndex: number
  squadsProposalAddress: string
  squadsTransactionAddress: string
  squadsCreateTxSig: string
  memo?: string | null
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Proposals can only be created for Fund Mode Groups.")
  }

  if (!group.multisig_address || !group.treasury_address) {
    throw new FundWiseError("Treasury must be initialized before creating reimbursement Proposals.")
  }

  const { memo } = validateProposalInput({
    amount: data.amount,
    mint: data.mint,
    expectedMint: group.stablecoin_mint,
    memo: data.memo,
  })

  await assertWalletIsMember(
    data.groupId,
    data.proposerWallet,
    "Only Group Members can create reimbursement Proposals."
  )

  await assertWalletIsMember(
    data.groupId,
    data.recipientWallet,
    "Reimbursement recipient must be a current Group Member."
  )

  await verifySquadsProposalMetadata({
    multisigAddress: group.multisig_address,
    transactionIndex: data.squadsTransactionIndex,
    proposalAddress: data.squadsProposalAddress,
    transactionAddress: data.squadsTransactionAddress,
  })

  const insert: ProposalInsert = {
    group_id: data.groupId,
    proposer_wallet: data.proposerWallet,
    recipient_wallet: data.recipientWallet,
    amount: data.amount,
    mint: data.mint,
    memo,
    status: "pending",
    squads_transaction_index: data.squadsTransactionIndex,
    squads_proposal_address: data.squadsProposalAddress,
    squads_transaction_address: data.squadsTransactionAddress,
    squads_create_tx_sig: data.squadsCreateTxSig,
    tx_sig: null,
    executed_at: null,
  }

  const { data: proposal, error } = await getAdmin()
    .from("proposals")
    .insert(insert)
    .select("*")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to create Proposal: ${error.message}`)
  }

  return proposal
}

export async function reviewProposalMutation(data: {
  proposalId: string
  memberWallet: string
  decision: "approved" | "rejected"
  txSig: string
}) {
  if (data.decision !== "approved" && data.decision !== "rejected") {
    throw new FundWiseError("Proposal review decision must be approved or rejected.")
  }

  const proposal = await getProposalOrThrow(data.proposalId)
  const group = await getGroupOrThrow(proposal.group_id)

  if (group.mode !== "fund") {
    throw new FundWiseError("Only Fund Mode Proposals can be reviewed.")
  }

  if (proposal.status !== "pending") {
    throw new FundWiseError("Only pending Proposals can be reviewed.")
  }

  if (
    !group.multisig_address ||
    proposal.squads_transaction_index === null ||
    !proposal.squads_proposal_address
  ) {
    throw new FundWiseError("Proposal is missing Squads governance metadata.")
  }

  await assertWalletIsMember(
    proposal.group_id,
    data.memberWallet,
    "Only Group Members can review Proposals."
  )

  if (proposal.proposer_wallet === data.memberWallet) {
    throw new FundWiseError("Proposal creator cannot review their own Proposal.")
  }

  const squadsStatus = await verifySquadsProposalReview({
    multisigAddress: group.multisig_address,
    transactionIndex: proposal.squads_transaction_index,
    proposalAddress: proposal.squads_proposal_address,
    memberWallet: data.memberWallet,
    decision: data.decision,
  })
  const nextStatus = mapSquadsStatusToFundWiseStatus(squadsStatus)

  const { error: reviewError } = await getAdmin()
    .from("proposal_approvals")
    .insert({
      proposal_id: data.proposalId,
      member_wallet: data.memberWallet,
      decision: data.decision,
      tx_sig: data.txSig,
    })

  if (reviewError?.code === "23505") {
    throw new FundWiseError("Each Member can review a Proposal at most once.")
  }

  if (reviewError) {
    throw new FundWiseError(`Failed to record Proposal review: ${reviewError.message}`)
  }

  const { data: reviewedProposal, error } = await getAdmin()
    .from("proposals")
    .update({ status: nextStatus })
    .eq("id", data.proposalId)
    .select("*")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to update Proposal status: ${error.message}`)
  }

  return reviewedProposal
}

export async function executeProposalMutation(data: {
  proposalId: string
  executorWallet: string
  txSig: string
}) {
  const proposal = await getProposalOrThrow(data.proposalId)
  const group = await getGroupOrThrow(proposal.group_id)

  if (group.mode !== "fund") {
    throw new FundWiseError("Only Fund Mode Proposals can be executed.")
  }

  if (proposal.status === "executed") {
    throw new FundWiseError("Proposal is already executed.")
  }

  if (proposal.status !== "approved") {
    throw new FundWiseError("Only approved Proposals can be executed.")
  }

  if (
    !group.multisig_address ||
    !group.treasury_address ||
    proposal.squads_transaction_index === null ||
    !proposal.squads_proposal_address
  ) {
    throw new FundWiseError("Proposal is missing Squads execution metadata.")
  }

  await assertWalletIsMember(
    proposal.group_id,
    data.executorWallet,
    "Only Group Members can execute approved Proposals."
  )

  const { data: existingExecution, error: existingExecutionError } = await getAdmin()
    .from("proposals")
    .select("id")
    .eq("tx_sig", data.txSig)
    .maybeSingle()

  if (existingExecutionError) {
    throw new FundWiseError(`Failed to check for duplicate Proposal execution transaction: ${existingExecutionError.message}`)
  }

  if (existingExecution) {
    throw new FundWiseError("This Proposal execution transaction has already been recorded.")
  }

  await verifySquadsProposalExecuted({
    multisigAddress: group.multisig_address,
    transactionIndex: proposal.squads_transaction_index,
    proposalAddress: proposal.squads_proposal_address,
  })

  await verifyProposalExecutionTransfer({
    txSig: data.txSig,
    mint: proposal.mint,
    treasuryAddress: group.treasury_address,
    recipientWallet: proposal.recipient_wallet,
    executorWallet: data.executorWallet,
    amount: proposal.amount,
  })

  const { data: executedProposal, error } = await getAdmin()
    .from("proposals")
    .update({
      status: "executed",
      tx_sig: data.txSig,
      executed_at: new Date().toISOString(),
    })
    .eq("id", data.proposalId)
    .eq("status", "approved")
    .select("*")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to mark Proposal executed: ${error.message}`)
  }

  return executedProposal
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

  if (group.multisig_address || group.treasury_address) {
    throw new FundWiseError("Treasury is already initialized for this Group.")
  }

  await verifyFundModeTreasuryAddresses({
    creatorWallet: data.creatorWallet,
    multisigAddress: data.multisigAddress,
    treasuryAddress: data.treasuryAddress,
  })

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
