"use client"

import { WalletAvatar } from "@/components/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import type { Database } from "@/lib/database.types"
import { formatTokenAmount } from "@/lib/expense-engine"
import { getSolanaExplorerTxUrl } from "@/lib/solana-cluster"
import {
  ExternalLink,
  Landmark,
  Loader2,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react"

type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]

const CONTRIBUTION_INPUT_ID = "contribution-amount"

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
  contributorCount: number
  missingMembersForTreasury: number
  contributions: ContributionRow[]
  memberNameByWallet: Map<string, string>
  isGroupCreator: boolean
  isMember: boolean
  connected: boolean
  isCreatingTreasury: boolean
  isContributing: boolean
  contributionAmount: string
  onContributionAmountChange: (value: string) => void
  onCreateTreasury: () => void | Promise<void>
  onContribute: () => void | Promise<void>
  onJoin: () => void | Promise<void>
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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
  contributorCount,
  missingMembersForTreasury,
  contributions,
  memberNameByWallet,
  isGroupCreator,
  isMember,
  connected,
  isCreatingTreasury,
  isContributing,
  contributionAmount,
  onContributionAmountChange,
  onCreateTreasury,
  onContribute,
  onJoin,
}: FundModeDashboardProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Landmark className="h-4 w-4 text-accent" />
            Treasury Balance
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
            {formatTokenAmount(treasuryBalance)} {tokenName}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {treasuryAddress ? `Vault ${shortWallet(treasuryAddress)}` : "Treasury not initialized yet"}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4 text-accent" />
            Funding Goal
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
            {fundingGoal ? `${formatTokenAmount(fundingGoal)} ${tokenName}` : "No goal"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {formatTokenAmount(contributionTotal)} {tokenName} contributed
          </p>
          {fundingGoal && (
            <div className="mt-3 space-y-2">
              <Progress value={fundingProgress} />
              <p className="text-[11px] text-muted-foreground">{fundingProgress}% funded</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Approval Threshold
          </div>
          <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
            {approvalThreshold} of {membersCount}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {contributorCount} contributor{contributorCount === 1 ? "" : "s"} so far
          </p>
        </Card>
      </div>

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
                Transfer stablecoins from your connected Solana wallet into this Group Treasury.
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
              className="flex flex-col gap-3 sm:flex-row"
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
            </form>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p>Join this Group first to make a Contribution.</p>
              <p className="mt-1 text-xs">
                Once you join, you can move stablecoins into the Group Treasury from your connected Solana wallet.
              </p>
            </div>
          )}
        </Card>
      )}

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
                  ? "Make the first Contribution to seed this Treasury, or top up your Solana wallet first if you need more USDC."
                  : connected
                    ? "Join this Group to make the first Contribution once you are ready."
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
            ) : treasuryAddress && connected ? (
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
                      {new Date(contribution.created_at).toLocaleDateString()}
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
