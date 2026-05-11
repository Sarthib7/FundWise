"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { PublicKey } from "@solana/web3.js"
import {
  addContribution as dbAddContribution,
  addProposalComment as dbAddProposalComment,
  addMember,
  addProposal as dbAddProposal,
  addSettlement as dbAddSettlement,
  deleteExpense as dbDeleteExpense,
  executeProposal as dbExecuteProposal,
  getGroupDashboardSnapshot,
  reviewProposal as dbReviewProposal,
  type ActivityItem,
  type ProposalWithReviews,
  updateProposalMetadata as dbUpdateProposalMetadata,
  updateGroupTreasury,
  updateProfileDisplayName,
} from "@/lib/db"
import type { Database } from "@/lib/database.types"
import {
  computeBalancesFromActivity,
  DEFAULT_STABLECOIN,
  executeSettlement,
  findStablecoinByMint,
  formatTokenAmount,
  parseTokenAmount,
  simplifySettlements,
  type Balance,
  type SettlementTransfer,
} from "@/lib/expense-engine"
import {
  formatSolAmountFromLamports,
  previewStablecoinTransfer,
  type StablecoinTransferPreview,
} from "@/lib/stablecoin-transfer"
import { isLifiSupportedForCurrentCluster } from "@/lib/lifi-config"
import { getFundWiseClusterLabel } from "@/lib/solana-cluster"
import {
  contributeStablecoinToTreasury,
  createSquadsReimbursementProposal,
  createSquadsMultisig,
  executeSquadsReimbursementProposal,
  getTreasuryStablecoinBalance,
  reviewSquadsProposal,
} from "@/lib/squads-multisig"
import { toast } from "sonner"
import { ensureWalletSession } from "@/lib/wallet-session-client"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]
type ActivityExpense = Extract<ActivityItem, { type: "expense" }>["data"]
export type PendingSettlementReceipt = {
  groupId: string
  fromWallet: string
  toWallet: string
  amount: number
  mint: string
  txSig: string
}

export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 32

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function isRequestedTransfer(
  transfer: SettlementTransfer,
  requestedFromWallet: string,
  requestedToWallet: string
) {
  return transfer.from === requestedFromWallet && transfer.to === requestedToWallet
}

function getSigningWallet(walletAdapter: unknown) {
  return walletAdapter ?? (window as { solana?: unknown }).solana
}

function isTransactionCancelled(error: unknown) {
  return error instanceof Error && error.message === "TRANSACTION_CANCELLED"
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function getPendingSettlementStorageKey(groupId: string, walletAddress: string) {
  return `fundwise:pending-settlement:${groupId}:${walletAddress}`
}

function readPendingSettlementReceipt(
  groupId: string,
  walletAddress: string
): PendingSettlementReceipt | null {
  if (typeof window === "undefined" || !groupId || !walletAddress) {
    return null
  }

  const raw = window.localStorage.getItem(
    getPendingSettlementStorageKey(groupId, walletAddress)
  )

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as PendingSettlementReceipt

    if (
      parsed.groupId === groupId &&
      parsed.fromWallet === walletAddress &&
      parsed.toWallet &&
      Number.isSafeInteger(parsed.amount) &&
      parsed.amount > 0 &&
      parsed.mint &&
      parsed.txSig
    ) {
      return parsed
    }
  } catch {
    window.localStorage.removeItem(
      getPendingSettlementStorageKey(groupId, walletAddress)
    )
  }

  return null
}

function writePendingSettlementReceipt(
  pendingSettlement: PendingSettlementReceipt | null,
  groupId: string,
  walletAddress: string
) {
  if (typeof window === "undefined" || !groupId || !walletAddress) {
    return
  }

  const storageKey = getPendingSettlementStorageKey(groupId, walletAddress)

  if (!pendingSettlement) {
    window.localStorage.removeItem(storageKey)
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(pendingSettlement))
}

export function useGroupDashboard() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { publicKey, connected, wallet } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()

  const walletAddress = publicKey?.toString() || ""
  const groupId = params.id as string
  const lifiSupported = isLifiSupportedForCurrentCluster()
  const clusterLabel = getFundWiseClusterLabel()

  const [group, setGroup] = useState<GroupRow | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [transfers, setTransfers] = useState<SettlementTransfer[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [proposals, setProposals] = useState<ProposalWithReviews[]>([])
  const [treasuryBalance, setTreasuryBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [memberCount, setMemberCount] = useState(0)
  const [isMember, setIsMember] = useState(false)
  const [isWalletVerified, setIsWalletVerified] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSavingProfileName, setIsSavingProfileName] = useState(false)
  const [isCreatingTreasury, setIsCreatingTreasury] = useState(false)
  const [isContributing, setIsContributing] = useState(false)
  const [isCreatingProposal, setIsCreatingProposal] = useState(false)
  const [reviewingProposalId, setReviewingProposalId] = useState<string | null>(null)
  const [executingProposalId, setExecutingProposalId] = useState<string | null>(null)
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [commentingProposalId, setCommentingProposalId] = useState<string | null>(null)
  const [settlingTransfer, setSettlingTransfer] = useState<SettlementTransfer | null>(null)
  const [isSettling, setIsSettling] = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [sharingTransferKey, setSharingTransferKey] = useState<string | null>(null)
  const [pendingSettlementReceipt, setPendingSettlementReceipt] =
    useState<PendingSettlementReceipt | null>(null)

  useEffect(() => {
    setPendingSettlementReceipt(
      readPendingSettlementReceipt(groupId, walletAddress)
    )
  }, [groupId, walletAddress])

  const loadData = useCallback(async () => {
    if (!groupId) {
      return
    }

    setIsLoading(true)

    try {
      if (connected && walletAddress) {
        try {
          await ensureWalletSession({
            walletAddress,
            walletAdapter: wallet?.adapter,
          })
        } catch (sessionError) {
          console.warn("[FundWise] Wallet verification was skipped while loading Group data:", sessionError)
        }
      }

      const snapshot = await getGroupDashboardSnapshot(
        groupId,
        connected ? walletAddress : undefined
      )
      const groupData = snapshot.group

      setGroup(groupData)
      setMemberCount(snapshot.memberCount)
      setMembers(snapshot.members)
      setIsMember(snapshot.isMember)
      setIsWalletVerified(snapshot.authenticated)

      if (!groupData) {
        setBalances([])
        setTransfers([])
        setActivity([])
        setContributions([])
        setProposals([])
        setTreasuryBalance(0)
        return
      }

      if (groupData.mode === "split") {
        setContributions([])
        setProposals([])
        setTreasuryBalance(0)

        if (snapshot.isMember) {
          const nextActivity = snapshot.activity
          const nextBalances = computeBalancesFromActivity(snapshot.members, nextActivity)
          setBalances(nextBalances)
          setTransfers(simplifySettlements(nextBalances))
          setActivity(nextActivity)
        } else {
          setBalances([])
          setTransfers([])
          setActivity([])
        }

        return
      }

      setBalances([])
      setTransfers([])
      setActivity([])

      if (!snapshot.isMember) {
        setContributions([])
        setProposals([])
        setTreasuryBalance(0)
        return
      }

      const nextTreasuryBalance = groupData.treasury_address
        ? await getTreasuryStablecoinBalance(groupData.treasury_address, groupData.stablecoin_mint)
        : 0

      setContributions(snapshot.contributions)
      setProposals(snapshot.proposals)
      setTreasuryBalance(nextTreasuryBalance)
    } catch (error) {
      console.error("[FundWise] Failed to load group:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load group")
    } finally {
      setIsLoading(false)
    }
  }, [connected, groupId, wallet?.adapter, walletAddress])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const settlementTimestamps = useMemo(() => {
    return activity
      .filter(
        (item): item is Extract<ActivityItem, { type: "settlement" }> => item.type === "settlement"
      )
      .map((item) => new Date(item.data.confirmed_at).getTime())
  }, [activity])

  const totalSettledVolume = useMemo(() => {
    return activity
      .filter(
        (item): item is Extract<ActivityItem, { type: "settlement" }> => item.type === "settlement"
      )
      .reduce((sum, item) => sum + item.data.amount, 0)
  }, [activity])

  const memberNameByWallet = useMemo(() => {
    return new Map(
      members.map((member) => [member.wallet, member.display_name || shortWallet(member.wallet)])
    )
  }, [members])

  const requestedFromWallet = searchParams.get("settleFrom") || ""
  const requestedToWallet = searchParams.get("settleTo") || ""
  const isInviteLink = searchParams.get("invite") === "true"
  const requestedTransfer = useMemo(
    () =>
      transfers.find((transfer) =>
        isRequestedTransfer(transfer, requestedFromWallet, requestedToWallet)
      ) || null,
    [requestedFromWallet, requestedToWallet, transfers]
  )

  const canDeleteExpense = useCallback(
    (expense: ActivityExpense) => {
      const expenseTimestamp = new Date(expense.edited_at || expense.created_at).getTime()
      return !settlementTimestamps.some(
        (settlementTimestamp) => settlementTimestamp > expenseTimestamp
      )
    },
    [settlementTimestamps]
  )

  const mintInfo = group ? findStablecoinByMint(group.stablecoin_mint) ?? null : null
  const tokenName = mintInfo?.name || "Token"
  const isFundMode = group?.mode === "fund"
  const isGroupCreator = group?.created_by === walletAddress
  const approvalThreshold = group?.approval_threshold ?? 1
  const missingMembersForTreasury = Math.max(0, approvalThreshold - memberCount)
  const contributionTotal = contributions.reduce((sum, contribution) => sum + contribution.amount, 0)
  const contributorCount = new Set(contributions.map((contribution) => contribution.member_wallet)).size
  const fundingProgress =
    group?.funding_goal && group.funding_goal > 0
      ? Math.min(100, Math.round((contributionTotal / group.funding_goal) * 100))
      : 0
  const viewerBalance = balances.find((balance) => balance.wallet === walletAddress) || null
  const viewerOutgoingTransfers = transfers.filter((transfer) => transfer.from === walletAddress)
  const viewerIncomingTransfers = transfers.filter((transfer) => transfer.to === walletAddress)
  const requestedDebtorLabel =
    memberNameByWallet.get(requestedFromWallet) ||
    (requestedFromWallet ? shortWallet(requestedFromWallet) : "")
  const requestedCreditorLabel =
    memberNameByWallet.get(requestedToWallet) ||
    (requestedToWallet ? shortWallet(requestedToWallet) : "")
  const viewerDisplayName =
    members.find((member) => member.wallet === walletAddress)?.display_name || ""

  const describeStablecoinFundingGap = useCallback(
    ({
      amount,
      preview,
      actionLabel,
    }: {
      amount: number
      preview: StablecoinTransferPreview
      actionLabel: string
    }) => {
      const shortfall = Math.max(0, amount - preview.sourceTokenBalance)

      if (preview.sourceTokenAccountExists) {
        if (lifiSupported) {
          return `This ${actionLabel} needs ${formatTokenAmount(shortfall)} more ${tokenName}. Route funds from another supported network if that is where your USDC is, then retry the ${actionLabel}.`
        }

        return `This ${actionLabel} needs ${formatTokenAmount(shortfall)} more ${tokenName} in the connected wallet.`
      }

      if (lifiSupported) {
        return `This wallet does not hold ${tokenName} for the ${actionLabel} yet. Route funds from another supported network if that is where your USDC is, then retry the ${actionLabel}.`
      }

      return `This wallet does not hold ${tokenName} on ${clusterLabel}. Add ${tokenName} to the connected wallet first, then retry the ${actionLabel}.`
    },
    [clusterLabel, lifiSupported, tokenName]
  )

  const describeSolFeeGap = useCallback(
    ({
      preview,
      destinationLabel,
    }: {
      preview: StablecoinTransferPreview
      destinationLabel: string
    }) => {
      const currentSol = formatSolAmountFromLamports(preview.walletSolBalanceLamports)
      const requiredSol = formatSolAmountFromLamports(preview.estimatedTotalSolLamports)
      const ataMessage = preview.requiresDestinationAtaCreation
        ? ` This transaction also needs to create ${destinationLabel}'s ${tokenName} token account once.`
        : ""

      return `You have about ${currentSol} SOL available, but this transaction needs about ${requiredSol} SOL for fees.${ataMessage}`
    },
    [tokenName]
  )

  const maybeExplainAtaCreation = useCallback(
    ({
      preview,
      destinationLabel,
    }: {
      preview: StablecoinTransferPreview
      destinationLabel: string
    }) => {
      if (!preview.requiresDestinationAtaCreation) {
        return
      }

      toast.info(`FundWise will create ${destinationLabel}'s ${tokenName} token account in this transaction.`, {
        description: `Expect about ${formatSolAmountFromLamports(preview.estimatedTotalSolLamports)} SOL total for rent and network fees.`,
      })
    },
    [tokenName]
  )

  const connectWallet = useCallback(() => {
    setWalletModalVisible(true)
  }, [setWalletModalVisible])

  const ensureWalletWriteAccess = useCallback(async () => {
    if (!walletAddress) {
      throw new Error("Connect your wallet first")
    }

    await ensureWalletSession({
      walletAddress,
      walletAdapter: wallet?.adapter,
    })
  }, [wallet?.adapter, walletAddress])

  const verifyWalletAccess = useCallback(async () => {
    try {
      await ensureWalletWriteAccess()
      await loadData()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify wallet")
      return false
    }
  }, [ensureWalletWriteAccess, loadData])

  const viewGroups = useCallback(() => {
    router.push("/groups")
  }, [router])

  const handleCopyCode = useCallback(() => {
    if (!group) {
      return
    }

    navigator.clipboard.writeText(group.code)
    setCopied(true)
    toast.success("Group code copied!")
    setTimeout(() => setCopied(false), 2000)
  }, [group])

  const handleJoin = useCallback(async () => {
    if (!connected || !walletAddress) {
      toast.error("Connect your wallet first")
      return
    }

    try {
      await ensureWalletWriteAccess()
      await addMember(groupId, walletAddress)
      toast.success(group?.mode === "fund" ? "Joined Fund Mode group!" : "Joined group!")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join group")
    }
  }, [connected, ensureWalletWriteAccess, group?.mode, groupId, loadData, walletAddress])

  const saveProfileName = useCallback(async (profileName: string) => {
    const trimmedDisplayName = profileName.trim()

    if (!walletAddress) {
      toast.error("Connect your wallet first")
      return false
    }

    if (!trimmedDisplayName) {
      toast.error("Enter a profile display name")
      return false
    }

    if (trimmedDisplayName.length > PROFILE_DISPLAY_NAME_MAX_LENGTH) {
      toast.error(`Display name must be ${PROFILE_DISPLAY_NAME_MAX_LENGTH} characters or fewer`)
      return false
    }

    setIsSavingProfileName(true)

    try {
      await ensureWalletWriteAccess()
      await updateProfileDisplayName(walletAddress, trimmedDisplayName)

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.wallet === walletAddress
            ? { ...member, display_name: trimmedDisplayName }
            : member
        )
      )
      setBalances((currentBalances) =>
        currentBalances.map((balance) =>
          balance.wallet === walletAddress
            ? { ...balance, displayName: trimmedDisplayName }
            : balance
        )
      )

      toast.success("Profile display name updated")
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile display name")
      return false
    } finally {
      setIsSavingProfileName(false)
    }
  }, [ensureWalletWriteAccess, walletAddress])

  const handleSettle = useCallback(async (transfer: SettlementTransfer) => {
    if (!connected || !walletAddress || group?.mode !== "split") {
      return false
    }

    let settlementTxSig: string | null = null
    setIsSettling(true)
    setSettlingTransfer(transfer)

    try {
      await ensureWalletWriteAccess()
      const signingWallet = getSigningWallet(wallet?.adapter)

      if (!signingWallet) {
        throw new Error("No wallet found")
      }

      const preview = await previewStablecoinTransfer({
        fromAddress: walletAddress,
        toAddress: transfer.to,
        amount: transfer.amount,
        mintAddress: group.stablecoin_mint || DEFAULT_STABLECOIN.mint,
      })

      if (!preview.sourceTokenAccountExists || preview.sourceTokenBalance < transfer.amount) {
        throw new Error(
          describeStablecoinFundingGap({
            amount: transfer.amount,
            preview,
            actionLabel: "Settlement",
          })
        )
      }

      if (preview.walletSolBalanceLamports < preview.estimatedTotalSolLamports) {
        throw new Error(
          describeSolFeeGap({
            preview,
            destinationLabel:
              memberNameByWallet.get(transfer.to) || shortWallet(transfer.to),
          })
        )
      }

      maybeExplainAtaCreation({
        preview,
        destinationLabel:
          memberNameByWallet.get(transfer.to) || shortWallet(transfer.to),
      })

      const { signature } = await executeSettlement(
        signingWallet,
        walletAddress,
        transfer.to,
        transfer.amount,
        group.stablecoin_mint || DEFAULT_STABLECOIN.mint
      )
      settlementTxSig = signature
      const pendingSettlement = {
        groupId,
        fromWallet: walletAddress,
        toWallet: transfer.to,
        amount: transfer.amount,
        mint: group.stablecoin_mint || DEFAULT_STABLECOIN.mint,
        txSig: signature,
      }
      setPendingSettlementReceipt(pendingSettlement)
      writePendingSettlementReceipt(pendingSettlement, groupId, walletAddress)

      const settlement = await dbAddSettlement({
        groupId,
        fromWallet: walletAddress,
        toWallet: transfer.to,
        amount: transfer.amount,
        mint: group.stablecoin_mint || DEFAULT_STABLECOIN.mint,
        txSig: signature,
      })

      const creditorLabel = memberNameByWallet.get(transfer.to) || shortWallet(transfer.to)
      toast.success(`Settled ${formatTokenAmount(transfer.amount)} ${tokenName} with ${creditorLabel}`, {
        description: "View your receipt →",
      })
      setPendingSettlementReceipt(null)
      writePendingSettlementReceipt(null, groupId, walletAddress)

      router.push(`/groups/${groupId}/settlements/${settlement.id}`)
      return true
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Settlement failed")

      if (isTransactionCancelled(error)) {
        toast.info("Transaction cancelled")
      } else if (settlementTxSig && errorMessage.includes("already been recorded")) {
        toast.error("This Settlement transaction is already recorded.", {
          description: "Refresh the Group to load the latest Receipt state.",
        })
      } else if (settlementTxSig) {
        toast.error("Settlement reached Solana, but FundWise could not verify and record the Receipt.", {
          description: `Use Retry Receipt below after RPC access is fixed. Transaction ${shortWallet(settlementTxSig)} is not recorded yet.`,
        })
      } else {
        toast.error(errorMessage)
      }

      return false
    } finally {
      setIsSettling(false)
      setSettlingTransfer(null)
    }
  }, [
    connected,
    describeSolFeeGap,
    describeStablecoinFundingGap,
    ensureWalletWriteAccess,
    group,
    groupId,
    maybeExplainAtaCreation,
    memberNameByWallet,
    router,
    tokenName,
    wallet?.adapter,
    walletAddress,
  ])

  const handleRecoverSettlementReceipt = useCallback(async () => {
    if (!pendingSettlementReceipt || !walletAddress) {
      return false
    }

    setIsSettling(true)

    try {
      await ensureWalletWriteAccess()
      const settlement = await dbAddSettlement({
        groupId: pendingSettlementReceipt.groupId,
        fromWallet: pendingSettlementReceipt.fromWallet,
        toWallet: pendingSettlementReceipt.toWallet,
        amount: pendingSettlementReceipt.amount,
        mint: pendingSettlementReceipt.mint,
        txSig: pendingSettlementReceipt.txSig,
      })

      setPendingSettlementReceipt(null)
      writePendingSettlementReceipt(null, groupId, walletAddress)
      toast.success("Settlement Receipt recorded")
      router.push(`/groups/${groupId}/settlements/${settlement.id}`)
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record Settlement Receipt")
      return false
    } finally {
      setIsSettling(false)
    }
  }, [
    ensureWalletWriteAccess,
    groupId,
    pendingSettlementReceipt,
    router,
    walletAddress,
  ])

  const handleDeleteExpense = useCallback(async (expense: ActivityExpense) => {
    if (expense.created_by !== walletAddress) {
      toast.error("Only the Expense creator can delete this Expense")
      return false
    }

    if (!canDeleteExpense(expense)) {
      toast.error("This Expense is locked because a later Settlement already exists")
      return false
    }

    setDeletingExpenseId(expense.id)

    try {
      await ensureWalletWriteAccess()
      await dbDeleteExpense(expense.id, walletAddress)
      toast.success("Expense deleted")
      await loadData()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete expense")
      return false
    } finally {
      setDeletingExpenseId(null)
    }
  }, [canDeleteExpense, ensureWalletWriteAccess, loadData, walletAddress])

  const handleCreateTreasury = useCallback(async () => {
    if (!group || group.mode !== "fund" || !connected || !publicKey || !walletAddress) {
      return
    }

    if (group.created_by !== walletAddress) {
      toast.error("Only the group creator can initialize the Treasury")
      return
    }

    if (approvalThreshold > members.length) {
      toast.error(`Invite at least ${approvalThreshold} Members before initializing the Treasury`)
      return
    }

    const signingWallet = getSigningWallet(wallet?.adapter)
    if (!signingWallet) {
      toast.error("No wallet found")
      return
    }

    setIsCreatingTreasury(true)

    try {
      await ensureWalletWriteAccess()
      const memberKeys = members.map((member) => new PublicKey(member.wallet))
      const result = await createSquadsMultisig(
        publicKey,
        group.name,
        memberKeys,
        approvalThreshold,
        signingWallet
      )

      await updateGroupTreasury({
        groupId,
        creatorWallet: walletAddress,
        multisigAddress: result.multisigPDA.toString(),
        treasuryAddress: result.vaultPDA.toString(),
      })

      toast.success("Treasury initialized")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to initialize Treasury")
    } finally {
      setIsCreatingTreasury(false)
    }
  }, [approvalThreshold, connected, ensureWalletWriteAccess, group, groupId, loadData, members, publicKey, wallet?.adapter, walletAddress])

  const handleContribute = useCallback(async (contributionAmount: string) => {
    if (!group || group.mode !== "fund" || !connected || !walletAddress || !contributionAmount) {
      return false
    }

    if (!isMember) {
      toast.error("Join this Group before making a Contribution")
      return false
    }

    if (!group.treasury_address) {
      toast.error("Treasury is not initialized yet")
      return false
    }

    const signingWallet = getSigningWallet(wallet?.adapter)
    if (!signingWallet) {
      toast.error("No wallet found")
      return false
    }

    let contributionTxSig: string | null = null
    setIsContributing(true)

    try {
      await ensureWalletWriteAccess()
      const parsedAmount = Number(contributionAmount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Enter a valid Contribution amount")
      }

      const tokenAmount = parseTokenAmount(contributionAmount)

      const preview = await previewStablecoinTransfer({
        fromAddress: walletAddress,
        toAddress: group.treasury_address,
        amount: tokenAmount,
        mintAddress: group.stablecoin_mint,
        recipientOwnerOffCurve: true,
      })

      if (!preview.sourceTokenAccountExists || preview.sourceTokenBalance < tokenAmount) {
        throw new Error(
          describeStablecoinFundingGap({
            amount: tokenAmount,
            preview,
            actionLabel: "Contribution",
          })
        )
      }

      if (preview.walletSolBalanceLamports < preview.estimatedTotalSolLamports) {
        throw new Error(
          describeSolFeeGap({
            preview,
            destinationLabel: "the Treasury",
          })
        )
      }

      maybeExplainAtaCreation({
        preview,
        destinationLabel: "the Treasury",
      })

      const { signature } = await contributeStablecoinToTreasury(
        signingWallet,
        walletAddress,
        group.treasury_address,
        group.stablecoin_mint,
        tokenAmount
      )
      contributionTxSig = signature

      await dbAddContribution({
        groupId,
        memberWallet: walletAddress,
        amount: tokenAmount,
        mint: group.stablecoin_mint,
        txSig: signature,
      })

      toast.success(`Contribution of ${contributionAmount} confirmed`)
      await loadData()
      return true
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to contribute")

      if (isTransactionCancelled(error)) {
        toast.info("Transaction cancelled")
      } else if (contributionTxSig && errorMessage.includes("already been recorded")) {
        toast.error("This Contribution transaction is already recorded.", {
          description: "Refresh the Group to load the latest Treasury state.",
        })
      } else if (contributionTxSig) {
        toast.error("Contribution reached Solana, but FundWise could not verify and record it.", {
          description: `Refresh the Group before retrying. Transaction ${shortWallet(contributionTxSig)} is not recorded in FundWise yet.`,
        })
      } else {
        toast.error(errorMessage)
      }
      return false
    } finally {
      setIsContributing(false)
    }
  }, [
    connected,
    describeSolFeeGap,
    describeStablecoinFundingGap,
    ensureWalletWriteAccess,
    group,
    groupId,
    isMember,
    loadData,
    maybeExplainAtaCreation,
    wallet?.adapter,
    walletAddress,
  ])

  const handleCreateProposal = useCallback(async (data: {
    recipientWallet: string
    amount: string
    proofUrl?: string
    memo?: string
  }) => {
    if (!group || group.mode !== "fund" || !connected || !walletAddress) {
      return false
    }

    if (!isMember) {
      toast.error("Join this Group before creating a Proposal")
      return false
    }

    if (!group.multisig_address || !group.treasury_address) {
      toast.error("Initialize the Treasury before creating reimbursement Proposals")
      return false
    }

    if (!data.recipientWallet) {
      toast.error("Choose a Member to reimburse")
      return false
    }

    setIsCreatingProposal(true)

    try {
      await ensureWalletWriteAccess()
      const signingWallet = getSigningWallet(wallet?.adapter)
      if (!signingWallet) {
        throw new Error("No wallet found")
      }

      const trimmedAmount = data.amount.trim()

      if (!/^\d+(\.\d{1,6})?$/.test(trimmedAmount)) {
        throw new Error("Enter a valid Proposal amount")
      }

      const tokenAmount = parseTokenAmount(trimmedAmount)

      if (!Number.isSafeInteger(tokenAmount) || tokenAmount <= 0) {
        throw new Error("Enter a valid Proposal amount")
      }

      const squadsProposal = await createSquadsReimbursementProposal(
        signingWallet,
        walletAddress,
        group.multisig_address,
        group.treasury_address,
        data.recipientWallet,
        group.stablecoin_mint,
        tokenAmount
      )

      await dbAddProposal({
        groupId,
        proposerWallet: walletAddress,
        recipientWallet: data.recipientWallet,
        amount: tokenAmount,
        mint: group.stablecoin_mint,
        squadsTransactionIndex: squadsProposal.transactionIndex,
        squadsProposalAddress: squadsProposal.proposalAddress,
        squadsTransactionAddress: squadsProposal.transactionAddress,
        squadsCreateTxSig: squadsProposal.signature,
        proofUrl: data.proofUrl,
        memo: data.memo,
      })

      toast.success("Reimbursement Proposal created")
      await loadData()
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create Proposal"))
      return false
    } finally {
      setIsCreatingProposal(false)
    }
  }, [connected, ensureWalletWriteAccess, group, groupId, isMember, loadData, wallet?.adapter, walletAddress])

  const handleUpdateProposalMetadata = useCallback(async (
    proposalId: string,
    data: { memo?: string; proofUrl?: string }
  ) => {
    if (!connected || !walletAddress) {
      setWalletModalVisible(true)
      return false
    }

    if (!isMember) {
      toast.error("Join this Group before editing Proposals")
      return false
    }

    setEditingProposalId(proposalId)

    try {
      await ensureWalletWriteAccess()
      await dbUpdateProposalMetadata({
        proposalId,
        editorWallet: walletAddress,
        memo: data.memo,
        proofUrl: data.proofUrl,
      })

      toast.success("Proposal updated")
      await loadData()
      return true
    } catch (error) {
      console.error("[FundWise] Failed to update Proposal:", error)
      toast.error(getErrorMessage(error, "Failed to update Proposal"))
      return false
    } finally {
      setEditingProposalId(null)
    }
  }, [connected, ensureWalletWriteAccess, isMember, loadData, walletAddress, setWalletModalVisible])

  const handleAddProposalComment = useCallback(async (
    proposalId: string,
    body: string
  ) => {
    if (!connected || !walletAddress) {
      setWalletModalVisible(true)
      return false
    }

    if (!isMember) {
      toast.error("Join this Group before commenting on Proposals")
      return false
    }

    setCommentingProposalId(proposalId)

    try {
      await ensureWalletWriteAccess()
      await dbAddProposalComment({
        proposalId,
        memberWallet: walletAddress,
        body,
      })

      toast.success("Comment added")
      await loadData()
      return true
    } catch (error) {
      console.error("[FundWise] Failed to add Proposal comment:", error)
      toast.error(getErrorMessage(error, "Failed to add Proposal comment"))
      return false
    } finally {
      setCommentingProposalId(null)
    }
  }, [connected, ensureWalletWriteAccess, isMember, loadData, walletAddress, setWalletModalVisible])

  const handleReviewProposal = useCallback(async (
    proposalId: string,
    decision: "approved" | "rejected"
  ) => {
    if (!group || group.mode !== "fund" || !connected || !walletAddress) {
      return false
    }

    if (!isMember) {
      toast.error("Join this Group before reviewing Proposals")
      return false
    }

    setReviewingProposalId(proposalId)

    try {
      await ensureWalletWriteAccess()
      const proposal = proposals.find((item) => item.id === proposalId)
      const signingWallet = getSigningWallet(wallet?.adapter)

      if (!proposal || proposal.squads_transaction_index === null || !group.multisig_address) {
        throw new Error("Proposal is missing Squads governance metadata")
      }

      if (!signingWallet) {
        throw new Error("No wallet found")
      }

      const { signature } = await reviewSquadsProposal(
        signingWallet,
        walletAddress,
        group.multisig_address,
        proposal.squads_transaction_index,
        decision
      )

      await dbReviewProposal({
        proposalId,
        memberWallet: walletAddress,
        decision,
        txSig: signature,
      })

      toast.success(decision === "approved" ? "Proposal approved" : "Proposal rejected")
      await loadData()
      return true
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to review Proposal"))
      return false
    } finally {
      setReviewingProposalId(null)
    }
  }, [connected, ensureWalletWriteAccess, group, isMember, loadData, proposals, wallet?.adapter, walletAddress])

  const handleExecuteProposal = useCallback(async (proposalId: string) => {
    if (!connected || !walletAddress) {
      setWalletModalVisible(true)
      return false
    }

    if (!group || group.mode !== "fund" || !group.multisig_address) {
      toast.error("Treasury must be initialized first")
      return false
    }

    if (!isMember) {
      toast.error("Join this Group before executing Proposals")
      return false
    }

    setExecutingProposalId(proposalId)

    try {
      await ensureWalletWriteAccess()
      const proposal = proposals.find((item) => item.id === proposalId)
      const signingWallet = getSigningWallet(wallet?.adapter)

      if (!proposal || proposal.status !== "approved" || proposal.squads_transaction_index === null) {
        throw new Error("Proposal is not ready for execution")
      }

      if (!signingWallet) {
        throw new Error("No wallet found")
      }

      const { signature } = await executeSquadsReimbursementProposal(
        signingWallet,
        walletAddress,
        group.multisig_address,
        proposal.squads_transaction_index
      )

      await dbExecuteProposal({
        proposalId,
        executorWallet: walletAddress,
        txSig: signature,
      })

      toast.success("Proposal executed")
      await loadData()
      return true
    } catch (error) {
      console.error("[FundWise] Failed to execute Proposal:", error)
      toast.error(getErrorMessage(error, "Failed to execute Proposal"))
      return false
    } finally {
      setExecutingProposalId(null)
    }
  }, [connected, ensureWalletWriteAccess, group, isMember, loadData, proposals, wallet?.adapter, walletAddress, setWalletModalVisible])

  const clearSettlementRequest = useCallback(() => {
    router.replace(`/groups/${groupId}`, { scroll: false })
  }, [groupId, router])

  const handleShareSettlementRequest = useCallback(async (transfer: SettlementTransfer) => {
    if (!group) {
      return
    }

    const transferKey = `${transfer.from}:${transfer.to}`
    const settlementRequestUrl = new URL(`/groups/${groupId}`, window.location.origin)
    settlementRequestUrl.searchParams.set("settleFrom", transfer.from)
    settlementRequestUrl.searchParams.set("settleTo", transfer.to)

    const debtorLabel = transfer.fromName || shortWallet(transfer.from)
    const creditorLabel = transfer.toName || shortWallet(transfer.to)
    const shareText = `${debtorLabel} owes ${creditorLabel} ${formatTokenAmount(transfer.amount)} ${tokenName} in ${group.name}.`

    setSharingTransferKey(transferKey)

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `${group.name} Settlement Request`,
          text: shareText,
          url: settlementRequestUrl.toString(),
        })
        toast.success("Settlement Request Link shared")
        return
      }

      if (!navigator.clipboard) {
        throw new Error("Clipboard unavailable")
      }

      await navigator.clipboard.writeText(settlementRequestUrl.toString())
      toast.success("Settlement Request Link copied")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }

      try {
        if (!navigator.clipboard) {
          throw new Error("Clipboard unavailable")
        }

        await navigator.clipboard.writeText(settlementRequestUrl.toString())
        toast.success("Settlement Request Link copied")
      } catch {
        toast.error("Failed to share Settlement Request Link")
      }
    } finally {
      setSharingTransferKey(null)
    }
  }, [group, groupId, tokenName])

  return {
    groupId,
    clusterLabel,
    lifiSupported,
    connected,
    walletAddress,
    group,
    members,
    memberCount,
    balances,
    transfers,
    activity,
    contributions,
    proposals,
    treasuryBalance,
    isLoading,
    isMember,
    isWalletVerified,
    copied,
    isSavingProfileName,
    isCreatingTreasury,
    isContributing,
    isCreatingProposal,
    reviewingProposalId,
    executingProposalId,
    editingProposalId,
    commentingProposalId,
    settlingTransfer,
    isSettling,
    pendingSettlementReceipt,
    deletingExpenseId,
    sharingTransferKey,
    tokenName,
    isFundMode,
    isGroupCreator,
    approvalThreshold,
    missingMembersForTreasury,
    contributionTotal,
    contributorCount,
    fundingProgress,
    totalSettledVolume,
    memberNameByWallet,
    requestedFromWallet,
    requestedToWallet,
    isInviteLink,
    requestedTransfer,
    requestedDebtorLabel,
    requestedCreditorLabel,
    viewerBalance,
    viewerOutgoingTransfers,
    viewerIncomingTransfers,
    viewerDisplayName,
    connectWallet,
    verifyWalletAccess,
    ensureWalletWriteAccess,
    viewGroups,
    refresh: loadData,
    copyGroupCode: handleCopyCode,
    joinGroup: handleJoin,
    saveProfileName,
    settle: handleSettle,
    recoverSettlementReceipt: handleRecoverSettlementReceipt,
    canDeleteExpense,
    deleteExpense: handleDeleteExpense,
    createTreasury: handleCreateTreasury,
    contribute: handleContribute,
    createProposal: handleCreateProposal,
    updateProposalMetadata: handleUpdateProposalMetadata,
    addProposalComment: handleAddProposalComment,
    reviewProposal: handleReviewProposal,
    executeProposal: handleExecuteProposal,
    clearSettlementRequest,
    shareSettlementRequest: handleShareSettlementRequest,
  }
}
