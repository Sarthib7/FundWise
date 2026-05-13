"use client"

import { useState } from "react"
import { WalletAvatar } from "@/components/avatar"
import { TreasuryOverviewCard } from "@/components/group-dashboard/treasury-overview-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Database } from "@/lib/database.types"
import type { ProposalWithReviews } from "@/lib/db"
import { formatTokenAmount } from "@/lib/expense-engine"
import { getSolanaExplorerTxUrl } from "@/lib/solana-cluster"
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  HandCoins,
  Landmark,
  Loader2,
  Send,
  Wallet,
  XCircle,
} from "lucide-react"

type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]

const CONTRIBUTION_INPUT_ID = "contribution-amount"
const PROPOSAL_AMOUNT_INPUT_ID = "proposal-amount"
const PROPOSAL_MEMO_INPUT_ID = "proposal-memo"
const PROPOSALS_SECTION_ID = "reimbursement-proposals"
const FUND_MODE_BETA_TELEGRAM_URL = "https://t.me/funddotsol"

type FundModeDashboardProps = {
  tokenName: string
  treasuryAddress: string | null
  multisigAddress: string | null
  fundingGoal: number | null
  treasuryBalance: number
  contributionTotal: number
  fundingProgress: number
  approvalThreshold: number
  membersCount: number
  missingMembersForTreasury: number
  contributions: ContributionRow[]
  proposals: ProposalWithReviews[]
  members: MemberRow[]
  memberNameByWallet: Map<string, string>
  walletAddress: string
  isGroupCreator: boolean
  isMember: boolean
  connected: boolean
  isWalletVerified: boolean
  lifiSupported: boolean
  isCreatingTreasury: boolean
  isContributing: boolean
  isCreatingProposal: boolean
  reviewingProposalId: string | null
  executingProposalId: string | null
  editingProposalId: string | null
  commentingProposalId: string | null
  contributionAmount: string
  onContributionAmountChange: (value: string) => void
  onOpenContributionFundingRoute: (amount: string) => void
  onCreateTreasury: () => void | Promise<void>
  onContribute: () => void | Promise<void>
  onCreateProposal: (data: {
    recipientWallet: string
    amount: string
    proofUrl?: string
    memo?: string
  }) => boolean | Promise<boolean>
  onUpdateProposalMetadata: (
    proposalId: string,
    data: { memo?: string; proofUrl?: string }
  ) => boolean | Promise<boolean>
  onAddProposalComment: (
    proposalId: string,
    body: string
  ) => boolean | Promise<boolean>
  onReviewProposal: (
    proposalId: string,
    decision: "approved" | "rejected"
  ) => boolean | Promise<boolean>
  onExecuteProposal: (proposalId: string) => boolean | Promise<boolean>
  onJoin: () => void | Promise<void>
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getEditFieldLabels(changedFields: unknown) {
  if (!changedFields || typeof changedFields !== "object" || Array.isArray(changedFields)) {
    return "metadata"
  }

  const labels = Object.keys(changedFields).map((field) => {
    if (field === "proof_url") return "proof link"
    return field
  })

  return labels.length > 0 ? labels.join(", ") : "metadata"
}

export function FundModeDashboard({
  tokenName,
  treasuryAddress,
  multisigAddress,
  fundingGoal,
  treasuryBalance,
  contributionTotal,
  fundingProgress,
  approvalThreshold,
  membersCount,
  missingMembersForTreasury,
  contributions,
  proposals,
  members,
  memberNameByWallet,
  walletAddress,
  isGroupCreator,
  isMember,
  connected,
  isWalletVerified,
  lifiSupported,
  isCreatingTreasury,
  isContributing,
  isCreatingProposal,
  reviewingProposalId,
  executingProposalId,
  editingProposalId,
  commentingProposalId,
  contributionAmount,
  onContributionAmountChange,
  onOpenContributionFundingRoute,
  onCreateTreasury,
  onContribute,
  onCreateProposal,
  onUpdateProposalMetadata,
  onAddProposalComment,
  onReviewProposal,
  onExecuteProposal,
  onJoin,
}: FundModeDashboardProps) {
  const [proposalRecipientWallet, setProposalRecipientWallet] = useState("")
  const [proposalAmount, setProposalAmount] = useState("")
  const [proposalMemo, setProposalMemo] = useState("")
  const [proposalProofUrl, setProposalProofUrl] = useState("")
  const [editingLocalProposalId, setEditingLocalProposalId] = useState<string | null>(null)
  const [editMemo, setEditMemo] = useState("")
  const [editProofUrl, setEditProofUrl] = useState("")
  const [proposalCommentBodies, setProposalCommentBodies] = useState<Record<string, string>>({})

  const handleProposeReimbursement = () => {
    if (walletAddress) {
      setProposalRecipientWallet(walletAddress)
    }

    const input = document.getElementById(PROPOSAL_AMOUNT_INPUT_ID)
    input?.scrollIntoView({ behavior: "smooth", block: "center" })
    input?.focus()
  }

  const handleViewProposals = () => {
    document
      .getElementById(PROPOSALS_SECTION_ID)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand-fund-blue-border/60 bg-brand-fund-blue-bg/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Fund Mode beta</Badge>
          <p className="text-sm text-muted-foreground">
            Invite-only devnet testing for pooled Treasuries, Proposals, and pricing feedback.
          </p>
        </div>
        <a
          href={FUND_MODE_BETA_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-brand-fund-blue-border bg-background px-3 text-sm font-medium text-brand-fund-blue transition-colors hover:bg-brand-fund-blue-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Join beta Telegram
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      <TreasuryOverviewCard
        tokenName={tokenName}
        treasuryBalance={treasuryBalance}
        contributionTotal={contributionTotal}
        fundingGoal={fundingGoal}
        fundingProgress={fundingProgress}
        contributions={contributions}
        proposals={proposals}
        approvalThreshold={approvalThreshold}
        memberNameByWallet={memberNameByWallet}
        walletAddress={walletAddress}
        canPropose={Boolean(treasuryAddress && isMember)}
        onProposeReimbursement={handleProposeReimbursement}
        onViewProposals={handleViewProposals}
      />

      {!treasuryAddress ? (
        <Card className="p-6 border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Initialize Treasury</h2>
              <p className="text-sm text-muted-foreground">
                Create the Squads multisig and Treasury vault for this Fund Mode Group.
              </p>
              <p className="text-xs text-muted-foreground">
                Treasury signers are captured from the current Member list when initialization happens.
              </p>
              {missingMembersForTreasury > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Invite {missingMembersForTreasury} more Member{missingMembersForTreasury === 1 ? "" : "s"} before a {approvalThreshold}-of-{membersCount + missingMembersForTreasury} Treasury can be initialized.
                </p>
              )}
            </div>
            {isGroupCreator ? (
              <Button
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:w-auto"
                onClick={() => void onCreateTreasury()}
                disabled={isCreatingTreasury || missingMembersForTreasury > 0}
              >
                {isCreatingTreasury ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Landmark className="h-4 w-4 mr-2" />
                )}
                Initialize Treasury
              </Button>
            ) : (
              <Badge variant="outline">Creator Action</Badge>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Make a Contribution</h2>
              <p className="text-sm text-muted-foreground">
                Transfer stablecoins from the connected wallet into this Group Treasury.
              </p>
            </div>
            <Badge className="bg-accent/10 text-accent border-accent/20">Treasury Live</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Vault Address
              </p>
              <p className="font-mono text-sm break-all">{treasuryAddress}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Multisig Address
              </p>
              <p className="font-mono text-sm break-all">{multisigAddress}</p>
            </div>
          </div>

          {isMember ? (
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              aria-busy={isContributing}
              onSubmit={(event) => {
                event.preventDefault()
                void onContribute()
              }}
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor={CONTRIBUTION_INPUT_ID}>Contribution Amount ({tokenName})</Label>
                <Input
                  id={CONTRIBUTION_INPUT_ID}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="25.00"
                  value={contributionAmount}
                  onChange={(event) => onContributionAmountChange(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 sm:self-end"
                disabled={isContributing || !contributionAmount}
              >
                {isContributing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4 mr-2" />
                )}
                Contribute
              </Button>
              {lifiSupported && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 sm:min-h-10 sm:self-end"
                  onClick={() => onOpenContributionFundingRoute(contributionAmount)}
                >
                  Route funds for Contribution
                </Button>
              )}
            </form>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p>Join this Group first to make a Contribution.</p>
              <p className="mt-1 text-xs">
                Once you join, you can move stablecoins into the Group Treasury from the connected wallet.
              </p>
            </div>
          )}
        </Card>
      )}

      <Card id={PROPOSALS_SECTION_ID} className="p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Reimbursement Proposals</h2>
            <p className="text-sm text-muted-foreground">
              Request Treasury reimbursement to a current Member wallet after someone pays out of pocket.
            </p>
          </div>
          <Badge variant="outline">
            {proposals.length} Proposal{proposals.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {treasuryAddress && isMember ? (
          <form
            className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]"
            aria-busy={isCreatingProposal}
            onSubmit={async (event) => {
              event.preventDefault()
              const created = await onCreateProposal({
                recipientWallet: proposalRecipientWallet,
                amount: proposalAmount,
                proofUrl: proposalProofUrl,
                memo: proposalMemo,
              })

              if (created) {
                setProposalRecipientWallet("")
                setProposalAmount("")
                setProposalProofUrl("")
                setProposalMemo("")
              }
            }}
          >
            <div className="space-y-2">
              <Label>Member to reimburse</Label>
              <Select value={proposalRecipientWallet} onValueChange={setProposalRecipientWallet}>
                <SelectTrigger className="min-h-11 w-full sm:min-h-10">
                  <SelectValue placeholder="Choose a Group Member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.wallet}>
                      {memberNameByWallet.get(member.wallet) || shortWallet(member.wallet)}
                      {member.wallet === walletAddress ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={PROPOSAL_AMOUNT_INPUT_ID}>Amount ({tokenName})</Label>
              <Input
                id={PROPOSAL_AMOUNT_INPUT_ID}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                placeholder="42.00"
                value={proposalAmount}
                onChange={(event) => setProposalAmount(event.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10 lg:self-end"
              disabled={isCreatingProposal || !proposalRecipientWallet || !proposalAmount}
            >
              {isCreatingProposal ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <HandCoins className="h-4 w-4 mr-2" />
              )}
              Create Proposal
            </Button>

            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor={PROPOSAL_MEMO_INPUT_ID}>Memo</Label>
              <Textarea
                id={PROPOSAL_MEMO_INPUT_ID}
                placeholder="Hotel deposit, grocery run, venue booking..."
                value={proposalMemo}
                onChange={(event) => setProposalMemo(event.target.value)}
                maxLength={240}
              />
            </div>
            <div className="space-y-2 lg:col-span-3">
              <Label htmlFor="proposal-proof-url">Proof link</Label>
              <Input
                id="proposal-proof-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="https://..."
                value={proposalProofUrl}
                onChange={(event) => setProposalProofUrl(event.target.value)}
                maxLength={500}
              />
            </div>
          </form>
        ) : (
          <div className="mb-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {!treasuryAddress
              ? "Initialize the Treasury before creating reimbursement Proposals."
              : "Join this Group before creating reimbursement Proposals."}
          </div>
        )}

        {proposals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-foreground">No Proposals yet</p>
            <p className="mt-1 text-xs">
              Reimbursement Proposals will appear here before approval and execution.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              (() => {
                const approvalCount = proposal.reviews.filter((review) => review.decision === "approved").length
                const rejectionReviews = proposal.reviews.filter((review) => review.decision === "rejected")
                const viewerReview = proposal.reviews.find((review) => review.member_wallet === walletAddress)
                const canEdit =
                  proposal.status === "pending" &&
                  proposal.proposer_wallet === walletAddress &&
                  approvalCount === 0
                const canReview =
                  proposal.status === "pending" &&
                  isMember &&
                  proposal.proposer_wallet !== walletAddress &&
                  !viewerReview
                const canExecute = proposal.status === "approved" && isMember
                const isReviewing = reviewingProposalId === proposal.id
                const isExecuting = executingProposalId === proposal.id
                const isSavingEdit = editingProposalId === proposal.id
                const isAddingComment = commentingProposalId === proposal.id
                const commentBody = proposalCommentBodies[proposal.id] || ""
                const isEditing = editingLocalProposalId === proposal.id

                return (
                  <div
                    key={proposal.id}
                    className="flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">
                          Reimburse {memberNameByWallet.get(proposal.recipient_wallet) || shortWallet(proposal.recipient_wallet)}
                        </p>
                        <Badge variant="outline" className="capitalize">
                          {proposal.status === "approved" ? "Ready to execute" : proposal.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Proposed by {memberNameByWallet.get(proposal.proposer_wallet) || shortWallet(proposal.proposer_wallet)} · {new Date(proposal.created_at).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {approvalCount} of {approvalThreshold} approval{approvalThreshold === 1 ? "" : "s"}
                      </p>
                      {proposal.memo && (
                        <p className="mt-2 text-sm text-muted-foreground">{proposal.memo}</p>
                      )}
                      {proposal.proof_url && (
                        <a
                          href={proposal.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          Proof link
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {isEditing && (
                        <div className="mt-3 space-y-3 rounded-lg border p-3">
                          <div className="space-y-2">
                            <Label htmlFor={`proposal-edit-memo-${proposal.id}`}>Memo</Label>
                            <Textarea
                              id={`proposal-edit-memo-${proposal.id}`}
                              value={editMemo}
                              onChange={(event) => setEditMemo(event.target.value)}
                              maxLength={240}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`proposal-edit-proof-${proposal.id}`}>Proof link</Label>
                            <Input
                              id={`proposal-edit-proof-${proposal.id}`}
                              type="url"
                              value={editProofUrl}
                              onChange={(event) => setEditProofUrl(event.target.value)}
                              maxLength={500}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="min-h-10 bg-accent hover:bg-accent/90"
                              disabled={isSavingEdit}
                              onClick={async () => {
                                const updated = await onUpdateProposalMetadata(proposal.id, {
                                  memo: editMemo,
                                  proofUrl: editProofUrl,
                                })
                                if (updated) {
                                  setEditingLocalProposalId(null)
                                }
                              }}
                            >
                              {isSavingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-10"
                              disabled={isSavingEdit}
                              onClick={() => setEditingLocalProposalId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      {viewerReview && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          You {viewerReview.decision === "approved" ? "approved" : "rejected"} this Proposal.
                        </p>
                      )}
                      {proposal.status === "pending" && proposal.proposer_wallet === walletAddress && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Proposal creators cannot review their own reimbursement request.
                        </p>
                      )}
                      {rejectionReviews.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {rejectionReviews.map((review) => (
                            <p key={review.id}>
                              Rejected by {memberNameByWallet.get(review.member_wallet) || shortWallet(review.member_wallet)}
                            </p>
                          ))}
                        </div>
                      )}
                      {(proposal.comments.length > 0 || proposal.edits.length > 0) && (
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          {proposal.edits.map((edit) => (
                            <p key={edit.id}>
                              Changed {getEditFieldLabels(edit.changed_fields)} by {memberNameByWallet.get(edit.editor_wallet) || shortWallet(edit.editor_wallet)}
                            </p>
                          ))}
                          {proposal.comments.map((comment) => (
                            <p key={comment.id}>
                              {memberNameByWallet.get(comment.member_wallet) || shortWallet(comment.member_wallet)}: {comment.body}
                            </p>
                          ))}
                        </div>
                      )}
                      {isMember && (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={commentBody}
                            onChange={(event) =>
                              setProposalCommentBodies((current) => ({
                                ...current,
                                [proposal.id]: event.target.value,
                              }))
                            }
                            placeholder="Add a Proposal comment"
                            maxLength={1000}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-10 sm:w-auto"
                            disabled={isAddingComment || !commentBody.trim()}
                            onClick={async () => {
                              const added = await onAddProposalComment(proposal.id, commentBody)
                              if (added) {
                                setProposalCommentBodies((current) => ({
                                  ...current,
                                  [proposal.id]: "",
                                }))
                              }
                            }}
                          >
                            {isAddingComment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Comment
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <p className="font-mono font-semibold tabular-nums">
                        {formatTokenAmount(proposal.amount)} {tokenName}
                      </p>
                      {canEdit && !isEditing && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-h-10"
                          onClick={() => {
                            setEditingLocalProposalId(proposal.id)
                            setEditMemo(proposal.memo || "")
                            setEditProofUrl(proposal.proof_url || "")
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      {canReview && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-10"
                            disabled={isReviewing}
                            onClick={() => void onReviewProposal(proposal.id, "rejected")}
                          >
                            {isReviewing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="min-h-10 bg-accent hover:bg-accent/90"
                            disabled={isReviewing}
                            onClick={() => void onReviewProposal(proposal.id, "approved")}
                          >
                            {isReviewing ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                        </div>
                      )}
                      {canExecute && (
                        <Button
                          type="button"
                          size="sm"
                          className="min-h-10 bg-accent hover:bg-accent/90"
                          disabled={isExecuting}
                          onClick={() => void onExecuteProposal(proposal.id)}
                        >
                          {isExecuting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Execute
                        </Button>
                      )}
                      {proposal.status === "executed" && proposal.tx_sig && (
                        <a
                          href={getSolanaExplorerTxUrl(proposal.tx_sig)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                        >
                          View execution
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })()
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Contributions</h2>
            <p className="text-sm text-muted-foreground">
              Every Contribution recorded for this Group Treasury.
            </p>
          </div>
          <Badge variant="outline">
            {contributions.length} Contribution{contributions.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {contributions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-foreground">No Contributions yet</p>
            <p className="mt-1 text-xs">
              {!treasuryAddress
                ? "Initialize the Treasury above before this Group can start recording Contributions."
                : isMember
                  ? "Make the first Contribution to seed this Treasury. Funding routes can happen from the Contribution flow when needed."
                  : connected && isWalletVerified
                    ? "Join this Group to make the first Contribution once you are ready."
                    : connected
                      ? "Verify your wallet to reveal the live Treasury membership state."
                    : "Connect your wallet to join this Group and contribute to the Treasury."}
            </p>
            {treasuryAddress && isMember ? (
              <Button
                variant="outline"
                className="mt-4 min-h-11"
                onClick={() => {
                  const input = document.getElementById(CONTRIBUTION_INPUT_ID)
                  input?.scrollIntoView({ behavior: "smooth", block: "center" })
                  input?.focus()
                }}
              >
                Make the first Contribution
              </Button>
            ) : treasuryAddress && connected && isWalletVerified ? (
              <Button className="mt-4 min-h-11 bg-accent hover:bg-accent/90" onClick={() => void onJoin()}>
                Join Group
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {contributions.map((contribution) => (
              <div
                key={contribution.id}
                className="flex flex-col gap-3 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <WalletAvatar address={contribution.member_wallet} size={32} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {memberNameByWallet.get(contribution.member_wallet) ||
                        shortWallet(contribution.member_wallet)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {memberNameByWallet.get(contribution.member_wallet)
                        ? `${shortWallet(contribution.member_wallet)} · ${new Date(contribution.created_at).toLocaleDateString()}`
                        : `Contribution recorded · ${new Date(contribution.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold tabular-nums">
                    {formatTokenAmount(contribution.amount)} {tokenName}
                  </p>
                  <a
                    href={getSolanaExplorerTxUrl(contribution.tx_sig)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    View tx
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
