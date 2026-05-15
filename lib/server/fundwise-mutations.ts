import type { Database, Json } from "@/lib/database.types"
import { PublicKey, type AccountInfo } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import {
  computeBalancesFromActivity,
  simplifySettlements,
} from "@/lib/expense-engine"
import { createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import type { FundWiseCluster } from "@/lib/solana-cluster"
import { isFundModeTemplateId, type FundModeTemplateId } from "@/lib/fund-mode-templates"
import {
  FUND_MODE_ROLES,
  isFundModeRole,
  roleCan,
  type FundModeAction,
  type FundModeRole,
} from "@/lib/fund-mode-roles"
import {
  FUND_MODE_BETA_PRICING,
  evaluateFreeTier,
  fundModeCreationFeeWallet,
  tokenAmountToUsdCents,
  type FundModeMonetizationKind,
} from "@/lib/fund-mode-monetization"
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
type ProposalEditInsert = Database["public"]["Tables"]["proposal_edits"]["Insert"]
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

// Fund Mode currently runs on devnet for the invite-only beta, but the
// graduation path needs an env-driven cluster choice so flipping to mainnet
// after the beta requires zero code changes.
function getFundModeCluster(): FundWiseCluster {
  const raw = (process.env.FUNDWISE_FUND_MODE_CLUSTER ?? "").trim().toLowerCase()
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta"
  if (raw === "custom") return "custom"
  return "devnet"
}

function isMissingColumnSchemaCacheError(error: SupabaseMutationError, column: string) {
  return (
    error.code === "PGRST204" ||
    error.message?.includes(`'${column}' column`) ||
    error.message?.includes(`"${column}" column`)
  )
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
  proofUrl?: string | null
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

  return { memo, proofUrl: normalizeProofUrl(data.proofUrl) }
}

function normalizeProofUrl(proofUrl?: string | null) {
  const trimmedProofUrl = proofUrl?.trim() || null

  if (!trimmedProofUrl) {
    return null
  }

  if (trimmedProofUrl.length > 500) {
    throw new FundWiseError("Proposal proof link must be 500 characters or fewer.")
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(trimmedProofUrl)
  } catch {
    throw new FundWiseError("Proposal proof link must be a valid URL.")
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new FundWiseError("Proposal proof link must use HTTP or HTTPS.")
  }

  return parsedUrl.toString()
}

function normalizeProposalComment(body?: string | null) {
  const trimmedBody = body?.trim() || ""

  if (!trimmedBody) {
    throw new FundWiseError("Proposal comment cannot be empty.")
  }

  if (trimmedBody.length > 1000) {
    throw new FundWiseError("Proposal comment must be 1000 characters or fewer.")
  }

  return trimmedBody
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
  accountReader: TreasuryAccountReader = createFundWiseConnectionForCluster(getFundModeCluster(), "confirmed")
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
  accountReader: SquadsProposalReader = createFundWiseConnectionForCluster(getFundModeCluster(), "confirmed")
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

async function getMemberRoleOrThrow(
  groupId: string,
  wallet: string,
  message: string
): Promise<FundModeRole> {
  const { data, error } = await getAdmin()
    .from("members")
    .select("role")
    .eq("group_id", groupId)
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    // Schema cache returns PGRST204 when the `role` column has not been added
    // yet — fall back to "member" so devnet rehearsals continue while the
    // operator replays migration 20260515100000_fund_mode_beta_completion.sql.
    if (isMissingColumnSchemaCacheError(error, "role")) {
      return "member"
    }
    throw new FundWiseError(`Failed to load Member role: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError(message)
  }

  const value = (data as { role?: string }).role
  return isFundModeRole(value) ? value : "member"
}

async function assertMemberCan(
  groupId: string,
  wallet: string,
  action: FundModeAction,
  deniedMessage: string
): Promise<FundModeRole> {
  const role = await getMemberRoleOrThrow(
    groupId,
    wallet,
    "Only Group Members can perform this action."
  )
  if (!roleCan(role, action)) {
    throw new FundWiseError(deniedMessage, 403)
  }
  return role
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

async function addMemberInternal(
  groupId: string,
  wallet: string,
  displayName?: string,
  role: FundModeRole = "member"
) {
  const profile = displayName ? null : await getProfile(wallet)

  const insertWithRole = {
    group_id: groupId,
    wallet,
    display_name: displayName || profile?.display_name || null,
    role,
  }

  let { error } = await getAdmin().from("members").insert(insertWithRole)

  if (error && isMissingColumnSchemaCacheError(error, "role")) {
    // Fallback for projects that have not replayed the FW-045 migration yet.
    const { role: _role, ...insertWithoutRole } = insertWithRole
    const fallback = await getAdmin().from("members").insert(insertWithoutRole)
    error = fallback.error
  }

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
  groupTemplate?: FundModeTemplateId | null
}) {
  if (data.mode === "fund" && !isFundModeInviteWallet(data.createdBy)) {
    throw new FundWiseError(
      "Fund Mode is currently invite-only while the treasury Proposal lifecycle is being finished."
    )
  }

  if (data.groupTemplate && !isFundModeTemplateId(data.groupTemplate)) {
    throw new FundWiseError("Unknown Fund Mode template.")
  }

  const insert: GroupInsert = {
    name: data.name,
    mode: data.mode,
    stablecoin_mint: data.stablecoinMint,
    created_by: data.createdBy,
    funding_goal: data.fundingGoal ?? null,
    approval_threshold: data.approvalThreshold ?? null,
    group_template: data.mode === "fund" ? data.groupTemplate ?? null : null,
  }

  let { data: group, error } = await getAdmin()
    .from("groups")
    .insert(insert)
    .select("id, code")
    .single()

  if (error && isMissingColumnSchemaCacheError(error, "group_template")) {
    // Some early Supabase projects were provisioned before migration
    // `20260511150000_add_fund_mode_template_to_groups.sql` shipped. Retry
    // without the column so devnet rehearsals are not blocked while the
    // operator replays the migration.
    const { group_template: _groupTemplate, ...insertWithoutTemplate } = insert
    const fallback = await getAdmin()
      .from("groups")
      .insert(insertWithoutTemplate as GroupInsert)
      .select("id, code")
      .single()

    group = fallback.data
    error = fallback.error
  }

  if (error) {
    throw new FundWiseError(`Failed to create group: ${error.message}`)
  }

  if (!group) {
    throw new FundWiseError("Failed to create group: no row returned.")
  }

  await addMemberInternal(group.id, data.createdBy, undefined, "admin")

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

export type ProposalKind = "reimbursement" | "threshold_change" | "exit_refund"

export async function addProposalMutation(data: {
  groupId: string
  proposerWallet: string
  recipientWallet?: string | null
  amount?: number | null
  mint?: string | null
  kind?: ProposalKind
  targetThreshold?: number | null
  squadsTransactionIndex?: number | null
  squadsProposalAddress?: string | null
  squadsTransactionAddress?: string | null
  squadsCreateTxSig?: string | null
  proofUrl?: string | null
  memo?: string | null
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Proposals can only be created for Fund Mode Groups.")
  }

  if (!group.multisig_address || !group.treasury_address) {
    throw new FundWiseError("Treasury must be initialized before creating Proposals.")
  }

  await assertMemberCan(
    data.groupId,
    data.proposerWallet,
    "create_proposal",
    "Viewers cannot create Proposals."
  )

  const kind: ProposalKind = data.kind ?? "reimbursement"

  if (kind === "threshold_change") {
    return await addThresholdChangeProposalInternal({
      groupId: data.groupId,
      proposerWallet: data.proposerWallet,
      targetThreshold: data.targetThreshold ?? 0,
      memo: data.memo ?? null,
    })
  }

  // reimbursement + exit_refund both require Squads metadata and a Member
  // recipient.
  if (
    !data.recipientWallet ||
    typeof data.amount !== "number" ||
    !data.mint ||
    typeof data.squadsTransactionIndex !== "number" ||
    !data.squadsProposalAddress ||
    !data.squadsTransactionAddress ||
    !data.squadsCreateTxSig
  ) {
    throw new FundWiseError("Reimbursement Proposals require recipient, amount, mint, and Squads metadata.")
  }

  const { memo, proofUrl } = validateProposalInput({
    amount: data.amount,
    mint: data.mint,
    expectedMint: group.stablecoin_mint,
    memo: data.memo,
    proofUrl: data.proofUrl,
  })

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
    proof_url: proofUrl,
    status: "pending",
    kind,
    squads_transaction_index: data.squadsTransactionIndex,
    squads_proposal_address: data.squadsProposalAddress,
    squads_transaction_address: data.squadsTransactionAddress,
    squads_create_tx_sig: data.squadsCreateTxSig,
    tx_sig: null,
    executed_at: null,
  }

  const proposal = await insertProposalWithSchemaFallback(insert)
  return proposal
}

async function insertProposalWithSchemaFallback(insert: ProposalInsert) {
  let attempt: ProposalInsert = { ...insert }
  const droppable: Array<keyof ProposalInsert> = [
    "kind",
    "target_threshold",
    "proof_url",
  ]

  // Progressive fallback for projects that haven't replayed the latest
  // migrations. We try the full insert, then drop one optional column at a
  // time until the insert succeeds or we run out of optional columns.
  for (let safety = 0; safety <= droppable.length; safety++) {
    const { data, error } = await getAdmin()
      .from("proposals")
      .insert(attempt)
      .select("*")
      .single()

    if (!error) {
      return data
    }

    const missingColumn = droppable.find((column) =>
      isMissingColumnSchemaCacheError(error, column as string)
    )

    if (!missingColumn) {
      throw new FundWiseError(`Failed to create Proposal: ${error.message}`)
    }

    const { [missingColumn]: _dropped, ...rest } = attempt as Record<string, unknown>
    attempt = rest as ProposalInsert
  }

  throw new FundWiseError("Failed to create Proposal after schema fallback.")
}

async function addThresholdChangeProposalInternal(data: {
  groupId: string
  proposerWallet: string
  targetThreshold: number
  memo: string | null
}) {
  if (!Number.isInteger(data.targetThreshold) || data.targetThreshold < 1) {
    throw new FundWiseError("Threshold-change Proposals require a positive integer target threshold.")
  }

  // Only Admins can propose changing the approval threshold.
  const proposerRole = await getMemberRoleOrThrow(
    data.groupId,
    data.proposerWallet,
    "Only Group Admins can propose threshold changes."
  )
  if (proposerRole !== "admin") {
    throw new FundWiseError("Only Group Admins can propose threshold changes.", 403)
  }

  const { count: memberCount, error: countError } = await getAdmin()
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", data.groupId)

  if (countError) {
    throw new FundWiseError(`Failed to count Group Members: ${countError.message}`)
  }

  if (data.targetThreshold > (memberCount ?? 0)) {
    throw new FundWiseError("Target threshold cannot exceed the number of current Members.")
  }

  const memo = data.memo?.trim() || null
  if (memo && memo.length > 240) {
    throw new FundWiseError("Proposal memo must be 240 characters or fewer.")
  }

  const insert: ProposalInsert = {
    group_id: data.groupId,
    proposer_wallet: data.proposerWallet,
    recipient_wallet: null,
    amount: null,
    mint: null,
    memo,
    proof_url: null,
    status: "pending",
    kind: "threshold_change",
    target_threshold: data.targetThreshold,
    squads_transaction_index: null,
    squads_proposal_address: null,
    squads_transaction_address: null,
    squads_create_tx_sig: null,
    tx_sig: null,
    executed_at: null,
  }

  return await insertProposalWithSchemaFallback(insert)
}

export async function reviewProposalMutation(data: {
  proposalId: string
  memberWallet: string
  decision: "approved" | "rejected"
  txSig?: string | null
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

  await assertMemberCan(
    proposal.group_id,
    data.memberWallet,
    "review_proposal",
    "Viewers cannot review Proposals."
  )

  if (proposal.proposer_wallet === data.memberWallet) {
    throw new FundWiseError("Proposal creator cannot review their own Proposal.")
  }

  const kind = (proposal as { kind?: ProposalKind }).kind ?? "reimbursement"

  if (kind === "threshold_change") {
    return await reviewThresholdChangeInternal({
      proposal,
      group,
      memberWallet: data.memberWallet,
      decision: data.decision,
    })
  }

  if (
    !group.multisig_address ||
    proposal.squads_transaction_index === null ||
    !proposal.squads_proposal_address
  ) {
    throw new FundWiseError("Proposal is missing Squads governance metadata.")
  }

  if (!data.txSig) {
    throw new FundWiseError("Reimbursement Proposal reviews must include a Squads review transaction signature.")
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

async function reviewThresholdChangeInternal(data: {
  proposal: ProposalRow
  group: GroupRow
  memberWallet: string
  decision: "approved" | "rejected"
}) {
  // Threshold-change proposals are FundWise-internal governance: no Squads
  // transaction. We use a synthetic tx_sig so the proposal_approvals table
  // (which requires tx_sig) keeps a unique-per-review row.
  const syntheticTxSig = `internal:threshold_change:${data.proposal.id}:${data.memberWallet}`

  const { error: reviewError } = await getAdmin()
    .from("proposal_approvals")
    .insert({
      proposal_id: data.proposal.id,
      member_wallet: data.memberWallet,
      decision: data.decision,
      tx_sig: syntheticTxSig,
    })

  if (reviewError?.code === "23505") {
    throw new FundWiseError("Each Member can review a Proposal at most once.")
  }

  if (reviewError) {
    throw new FundWiseError(`Failed to record Proposal review: ${reviewError.message}`)
  }

  // Count current approvals; flip the status when we hit the Group threshold.
  const { count: approvalsCount, error: countError } = await getAdmin()
    .from("proposal_approvals")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", data.proposal.id)
    .eq("decision", "approved")

  if (countError) {
    throw new FundWiseError(`Failed to count Proposal approvals: ${countError.message}`)
  }

  const requiredApprovals = data.group.approval_threshold ?? 1
  let nextStatus: "pending" | "approved" | "rejected" = "pending"

  if (data.decision === "rejected") {
    nextStatus = "rejected"
  } else if ((approvalsCount ?? 0) >= requiredApprovals) {
    nextStatus = "approved"
  }

  const { data: reviewedProposal, error } = await getAdmin()
    .from("proposals")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", data.proposal.id)
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
  txSig?: string | null
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

  await assertMemberCan(
    proposal.group_id,
    data.executorWallet,
    "execute_proposal",
    "Viewers cannot execute Proposals."
  )

  const kind = (proposal as { kind?: ProposalKind }).kind ?? "reimbursement"

  if (kind === "threshold_change") {
    return await executeThresholdChangeInternal({ proposal })
  }

  if (
    !group.multisig_address ||
    !group.treasury_address ||
    proposal.squads_transaction_index === null ||
    !proposal.squads_proposal_address
  ) {
    throw new FundWiseError("Proposal is missing Squads execution metadata.")
  }

  if (!data.txSig) {
    throw new FundWiseError("Reimbursement Proposal execution requires the Squads transaction signature.")
  }

  if (proposal.amount === null || !proposal.recipient_wallet || !proposal.mint) {
    throw new FundWiseError("Reimbursement Proposal is missing recipient or amount.")
  }

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

async function executeThresholdChangeInternal(data: { proposal: ProposalRow }) {
  const targetThreshold = (data.proposal as { target_threshold?: number | null }).target_threshold
  if (!targetThreshold || targetThreshold < 1) {
    throw new FundWiseError("Threshold-change Proposal is missing target threshold.")
  }

  const { error: groupError } = await getAdmin()
    .from("groups")
    .update({ approval_threshold: targetThreshold })
    .eq("id", data.proposal.group_id)

  if (groupError) {
    throw new FundWiseError(`Failed to apply threshold change: ${groupError.message}`)
  }

  const { data: executedProposal, error } = await getAdmin()
    .from("proposals")
    .update({
      status: "executed",
      executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.proposal.id)
    .eq("status", "approved")
    .select("*")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to mark threshold-change Proposal executed: ${error.message}`)
  }

  return executedProposal
}

export async function updateProposalMetadataMutation(data: {
  proposalId: string
  editorWallet: string
  memo?: string | null
  proofUrl?: string | null
}) {
  const proposal = await getProposalOrThrow(data.proposalId)
  const group = await getGroupOrThrow(proposal.group_id)

  if (group.mode !== "fund") {
    throw new FundWiseError("Only Fund Mode Proposals can be edited.")
  }

  if (proposal.status !== "pending") {
    throw new FundWiseError("Only pending Proposals can be edited.")
  }

  await assertWalletIsMember(
    proposal.group_id,
    data.editorWallet,
    "Only Group Members can edit Proposals."
  )

  if (proposal.proposer_wallet !== data.editorWallet) {
    throw new FundWiseError("Only the Proposal creator can edit Proposal metadata.")
  }

  const { data: outsideApprovals, error: outsideApprovalsError } = await getAdmin()
    .from("proposal_approvals")
    .select("id")
    .eq("proposal_id", data.proposalId)
    .eq("decision", "approved")
    .neq("member_wallet", proposal.proposer_wallet)

  if (outsideApprovalsError) {
    throw new FundWiseError(`Failed to check Proposal approval history: ${outsideApprovalsError.message}`)
  }

  if ((outsideApprovals || []).length > 0) {
    throw new FundWiseError("Proposal cannot be edited after the first outside approval.")
  }

  const memo = data.memo?.trim() || null
  if (memo && memo.length > 240) {
    throw new FundWiseError("Proposal memo must be 240 characters or fewer.")
  }

  const proofUrl = normalizeProofUrl(data.proofUrl)
  const changedFields: Record<string, { from: string | null; to: string | null }> = {}

  if ((proposal.memo || null) !== memo) {
    changedFields.memo = { from: proposal.memo, to: memo }
  }

  if ((proposal.proof_url || null) !== proofUrl) {
    changedFields.proof_url = { from: proposal.proof_url, to: proofUrl }
  }

  if (Object.keys(changedFields).length === 0) {
    throw new FundWiseError("Proposal metadata did not change.")
  }

  const { data: updatedProposal, error } = await getAdmin()
    .from("proposals")
    .update({
      memo,
      proof_url: proofUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.proposalId)
    .eq("status", "pending")
    .select("*")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to update Proposal metadata: ${error.message}`)
  }

  const editInsert: ProposalEditInsert = {
    proposal_id: data.proposalId,
    editor_wallet: data.editorWallet,
    changed_fields: changedFields,
  }
  const { error: editError } = await getAdmin()
    .from("proposal_edits")
    .insert(editInsert)

  if (editError) {
    throw new FundWiseError(`Failed to record Proposal edit history: ${editError.message}`)
  }

  return updatedProposal
}

export async function addProposalCommentMutation(data: {
  proposalId: string
  memberWallet: string
  body: string
}) {
  const proposal = await getProposalOrThrow(data.proposalId)
  const group = await getGroupOrThrow(proposal.group_id)

  if (group.mode !== "fund") {
    throw new FundWiseError("Only Fund Mode Proposals can have comments.")
  }

  await assertWalletIsMember(
    proposal.group_id,
    data.memberWallet,
    "Only Group Members can comment on Proposals."
  )

  const body = normalizeProposalComment(data.body)
  const { data: comment, error } = await getAdmin()
    .from("proposal_comments")
    .insert({
      proposal_id: data.proposalId,
      member_wallet: data.memberWallet,
      body,
    })
    .select("*")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to add Proposal comment: ${error.message}`)
  }

  return comment
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

// =============================================
// FW-045: Member role management
// =============================================
export async function setMemberRoleMutation(data: {
  groupId: string
  actorWallet: string
  targetWallet: string
  role: FundModeRole
}) {
  if (!isFundModeRole(data.role)) {
    throw new FundWiseError(`Role must be one of: ${FUND_MODE_ROLES.join(", ")}.`)
  }

  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Role assignments are only available in Fund Mode Groups.")
  }

  await assertMemberCan(
    data.groupId,
    data.actorWallet,
    "change_role",
    "Only Group Admins can change Member roles."
  )

  // Don't allow the last admin to demote themselves — the Group would be stuck.
  if (data.actorWallet === data.targetWallet && data.role !== "admin") {
    const { count: adminCount, error: countError } = await getAdmin()
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", data.groupId)
      .eq("role", "admin")

    if (countError && !isMissingColumnSchemaCacheError(countError, "role")) {
      throw new FundWiseError(`Failed to count Group Admins: ${countError.message}`)
    }

    if ((adminCount ?? 0) <= 1) {
      throw new FundWiseError("Cannot demote the last Admin. Assign another Admin first.")
    }
  }

  const { data: updated, error } = await getAdmin()
    .from("members")
    .update({ role: data.role })
    .eq("group_id", data.groupId)
    .eq("wallet", data.targetWallet)
    .select("id, role")
    .maybeSingle()

  if (error) {
    if (isMissingColumnSchemaCacheError(error, "role")) {
      throw new FundWiseError(
        "Member roles require migration 20260515100000_fund_mode_beta_completion.sql to be replayed on this Supabase project.",
        503
      )
    }
    throw new FundWiseError(`Failed to update Member role: ${error.message}`)
  }

  if (!updated) {
    throw new FundWiseError("Target wallet is not a Member of this Group.", 404)
  }

  return updated
}

// =============================================
// FW-047: Creation fee + opt-out telemetry
// =============================================
export async function recordCreationFeeMutation(data: {
  groupId: string
  payerWallet: string
  outcome: "paid" | "skipped"
  amount?: number | null
  mint?: string | null
  txSig?: string | null
  emulatedUsdCents?: number | null
  notes?: string | null
}) {
  if (data.outcome !== "paid" && data.outcome !== "skipped") {
    throw new FundWiseError("Creation fee outcome must be 'paid' or 'skipped'.")
  }

  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Creation fees are only tracked for Fund Mode Groups.")
  }

  await assertMemberCan(
    data.groupId,
    data.payerWallet,
    "contribute",
    "Viewers cannot record creation fees."
  )

  if (data.outcome === "paid") {
    if (typeof data.amount !== "number" || data.amount <= 0) {
      throw new FundWiseError("Paid creation fees must include a positive token amount.")
    }
    if (!data.mint) {
      throw new FundWiseError("Paid creation fees must include the stablecoin mint.")
    }
    if (data.mint !== group.stablecoin_mint) {
      throw new FundWiseError("Creation fee mint does not match the Group stablecoin.")
    }
    if (!data.txSig) {
      throw new FundWiseError("Paid creation fees must include the on-chain transaction signature.")
    }

    const feeRecipient = fundModeCreationFeeWallet()
    if (feeRecipient) {
      await verifyContributionTransfer({
        txSig: data.txSig,
        mint: data.mint,
        memberWallet: data.payerWallet,
        treasuryAddress: feeRecipient,
        amount: data.amount,
      })
    }
  }

  const { data: inserted, error } = await getAdmin()
    .from("fund_mode_creation_fees")
    .insert({
      group_id: data.groupId,
      payer_wallet: data.payerWallet,
      amount: data.outcome === "paid" ? data.amount ?? null : null,
      mint: data.outcome === "paid" ? data.mint ?? null : null,
      tx_sig: data.outcome === "paid" ? data.txSig ?? null : null,
      outcome: data.outcome,
      emulated_usd_cents: data.emulatedUsdCents ?? FUND_MODE_BETA_PRICING.creationFeeUsdCents,
      notes: data.notes ?? null,
    })
    .select("*")
    .single()

  if (error) {
    if (error.code === "23505") {
      throw new FundWiseError(`This Group already has a recorded ${data.outcome} creation fee outcome.`)
    }
    if (isMissingColumnSchemaCacheError(error, "outcome") || error.message?.includes("fund_mode_creation_fees")) {
      throw new FundWiseError(
        "Creation fee telemetry requires migration 20260515100000_fund_mode_beta_completion.sql to be replayed on this Supabase project.",
        503
      )
    }
    throw new FundWiseError(`Failed to record creation fee: ${error.message}`)
  }

  return inserted
}

// =============================================
// FW-061 / FW-062 / FW-063: Monetization telemetry
// =============================================
export async function recordMonetizationResponseMutation(data: {
  kind: FundModeMonetizationKind
  memberWallet: string
  groupId?: string | null
  emulatedUsdCents?: number | null
  payload?: Record<string, unknown>
}) {
  if (!["monthly_fee_wtp", "free_tier_cap", "exit_survey"].includes(data.kind)) {
    throw new FundWiseError("Unknown monetization response kind.")
  }

  // If a groupId is supplied the wallet must be a Member; otherwise it's an
  // anonymous response that the admin dashboard still aggregates.
  if (data.groupId) {
    await assertWalletIsMember(
      data.groupId,
      data.memberWallet,
      "Only Group Members can submit monetization responses for this Group."
    )
  }

  const { data: inserted, error } = await getAdmin()
    .from("monetization_responses")
    .insert({
      kind: data.kind,
      group_id: data.groupId ?? null,
      member_wallet: data.memberWallet,
      emulated_usd_cents: data.emulatedUsdCents ?? null,
      payload: (data.payload ?? {}) as Json,
    })
    .select("*")
    .single()

  if (error) {
    if (error.message?.includes("monetization_responses")) {
      throw new FundWiseError(
        "Monetization telemetry requires migration 20260515100000_fund_mode_beta_completion.sql to be replayed on this Supabase project.",
        503
      )
    }
    throw new FundWiseError(`Failed to record monetization response: ${error.message}`)
  }

  return inserted
}

// =============================================
// FW-063 helper: member leaves a Group (records the event; refund still goes
// through the normal exit-refund Proposal flow).
// =============================================
export async function leaveGroupMutation(data: {
  groupId: string
  memberWallet: string
  exitSurvey?: {
    pricingFairness?: number
    wouldPayConfidence?: number
    featureRequests?: string
  }
}) {
  const group = await getGroupOrThrow(data.groupId)

  await assertWalletIsMember(
    data.groupId,
    data.memberWallet,
    "Only current Members can leave the Group."
  )

  if (group.created_by === data.memberWallet) {
    throw new FundWiseError("Group creators cannot leave the Group. Transfer ownership first.")
  }

  // Record the exit survey first (best-effort). If migration not replayed yet
  // we still allow the leave to proceed.
  if (data.exitSurvey && group.mode === "fund") {
    try {
      await recordMonetizationResponseMutation({
        kind: "exit_survey",
        memberWallet: data.memberWallet,
        groupId: data.groupId,
        emulatedUsdCents: FUND_MODE_BETA_PRICING.monthlySubscriptionUsdCents,
        payload: data.exitSurvey as Record<string, unknown>,
      })
    } catch (error) {
      if (!(error instanceof FundWiseError) || error.status !== 503) {
        throw error
      }
    }
  }

  const { error } = await getAdmin()
    .from("members")
    .delete()
    .eq("group_id", data.groupId)
    .eq("wallet", data.memberWallet)

  if (error) {
    throw new FundWiseError(`Failed to leave Group: ${error.message}`)
  }
}

// =============================================
// FW-044 helper: compute auto-suggested reimbursement proposals
// =============================================
// Pure-data helper used by both the dashboard snapshot and tests. Given the
// Fund Mode Group's expense activity and existing pending/approved proposals,
// suggest reimbursements for any "pool" expense whose payer has not already
// been reimbursed.
export type SuggestedReimbursement = {
  expenseId: string
  payerWallet: string
  amount: number
  mint: string
  memo: string
  createdAt: string
}

export function computeSuggestedReimbursements(input: {
  groupMode: "split" | "fund"
  stablecoinMint: string
  expenses: Array<{
    id: string
    payer: string
    amount: number
    mint: string
    memo: string | null
    category: string | null
    created_at: string
    deleted_at: string | null
  }>
  proposals: Array<{
    recipient_wallet: string | null
    amount: number | null
    mint: string | null
    status: string
    kind: string
  }>
}): SuggestedReimbursement[] {
  if (input.groupMode !== "fund") {
    return []
  }

  // Sum (recipient, mint, amount) coverage for non-rejected reimbursement /
  // exit-refund proposals so we don't suggest a refund for something already
  // queued or paid.
  const coveredByRecipient = new Map<string, number>()
  for (const proposal of input.proposals) {
    if (proposal.status === "rejected" || proposal.status === "cancelled") continue
    if (proposal.kind !== "reimbursement" && proposal.kind !== "exit_refund") continue
    if (!proposal.recipient_wallet || proposal.amount === null) continue
    const key = `${proposal.recipient_wallet}:${proposal.mint ?? input.stablecoinMint}`
    coveredByRecipient.set(key, (coveredByRecipient.get(key) ?? 0) + proposal.amount)
  }

  const suggestions: SuggestedReimbursement[] = []

  for (const expense of input.expenses) {
    if (expense.deleted_at) continue
    if (expense.amount <= 0) continue
    if (expense.mint !== input.stablecoinMint) continue
    if ((expense.category ?? "") !== "pool") continue

    const key = `${expense.payer}:${expense.mint}`
    const alreadyCovered = coveredByRecipient.get(key) ?? 0

    if (alreadyCovered >= expense.amount) {
      // Reduce covered budget so the next expense from the same payer also
      // gets evaluated correctly.
      coveredByRecipient.set(key, alreadyCovered - expense.amount)
      continue
    }

    suggestions.push({
      expenseId: expense.id,
      payerWallet: expense.payer,
      amount: expense.amount,
      mint: expense.mint,
      memo: expense.memo
        ? `Reimburse pool expense — ${expense.memo}`
        : "Reimburse pool expense",
      createdAt: expense.created_at,
    })

    // Subtract what we just covered so subsequent expenses from the same
    // payer count.
    coveredByRecipient.set(key, alreadyCovered)
  }

  return suggestions
}

// Re-export pricing surface for the API layer.
export { FUND_MODE_BETA_PRICING, evaluateFreeTier, tokenAmountToUsdCents }
