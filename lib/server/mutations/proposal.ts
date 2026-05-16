import type { Database } from "@/lib/database.types"
import { FundWiseError } from "@/lib/server/fundwise-error"
import * as Squads from "@/lib/squads/lifecycle"
import {
  verifyProposalExecutionTransfer,
} from "@/lib/server/solana-transfer-verification"
import {
  assertMemberCan,
  assertWalletIsMember,
  getAdmin,
  getGroupOrThrow,
  isMissingColumnSchemaCacheError,
  type GroupRow,
} from "./_internal"
import { getMemberRoleOrThrow } from "./member"

export type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"]
export type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"]
export type ProposalEditInsert = Database["public"]["Tables"]["proposal_edits"]["Insert"]

export type ProposalKind = "reimbursement" | "threshold_change" | "exit_refund"

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

  await Squads.verifyProposalMetadata({
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

  const nextStatus = await Squads.verifyProposalReview({
    multisigAddress: group.multisig_address,
    transactionIndex: proposal.squads_transaction_index,
    proposalAddress: proposal.squads_proposal_address,
    memberWallet: data.memberWallet,
    decision: data.decision,
  })

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

  await Squads.verifyExecution({
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
