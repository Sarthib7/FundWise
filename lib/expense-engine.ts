import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import type { Database } from "./database.types"
import { getGroupDashboardSnapshot, type ActivityItem } from "./db"
import { executeStablecoinTransfer } from "./stablecoin-transfer"
import { getFundWiseClusterName, type FundWiseCluster } from "./solana-cluster"
import { createFundWiseConnection } from "./fallback-connection"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type GroupMode = Database["public"]["Tables"]["groups"]["Row"]["mode"]

export const connection = createFundWiseConnection("confirmed")

export type StablecoinInfo = { mint: string; name: string; decimals: number }

const STABLECOIN_MINTS_DEVNET: Record<string, StablecoinInfo> = {
  USDC: {
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    name: "USDC",
    decimals: 6,
  },
  USDT: {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ",
    name: "USDT",
    decimals: 6,
  },
  PYUSD: {
    mint: "CXFaY4cXf25ZhFlexqroBfBceJ8YqWBsfaY3HQd9qucz",
    name: "PYUSD",
    decimals: 6,
  },
}

const STABLECOIN_MINTS_MAINNET: Record<string, StablecoinInfo> = {
  USDC: {
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    name: "USDC",
    decimals: 6,
  },
  USDT: {
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KfNBYYwzXwYFr7gNDfGJ",
    name: "USDT",
    decimals: 6,
  },
  PYUSD: {
    mint: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    name: "PYUSD",
    decimals: 6,
  },
}

export const STABLECOIN_MINTS_BY_CLUSTER: Record<FundWiseCluster, Record<string, StablecoinInfo>> = {
  devnet: STABLECOIN_MINTS_DEVNET,
  "mainnet-beta": STABLECOIN_MINTS_MAINNET,
  custom: STABLECOIN_MINTS_DEVNET,
}

export function getStablecoinMintsForCluster(
  cluster: FundWiseCluster = getFundWiseClusterName()
): Record<string, StablecoinInfo> {
  return STABLECOIN_MINTS_BY_CLUSTER[cluster]
}

export function getDefaultStablecoinForCluster(
  cluster: FundWiseCluster = getFundWiseClusterName()
): StablecoinInfo {
  return getStablecoinMintsForCluster(cluster).USDC
}

export function findStablecoinByMint(mintAddress: string): StablecoinInfo | undefined {
  for (const clusterMints of Object.values(STABLECOIN_MINTS_BY_CLUSTER)) {
    for (const stablecoin of Object.values(clusterMints)) {
      if (stablecoin.mint === mintAddress) return stablecoin
    }
  }
  return undefined
}

export function getClusterForGroupMode(mode: GroupMode): FundWiseCluster {
  if (mode === "fund") return "devnet"
  return getFundWiseClusterName()
}

export function getDefaultStablecoinForGroupMode(mode: GroupMode): StablecoinInfo {
  return getDefaultStablecoinForCluster(getClusterForGroupMode(mode))
}

export const STABLECOIN_MINTS = getStablecoinMintsForCluster()
export const DEFAULT_STABLECOIN = getDefaultStablecoinForCluster()

// =============================================
// BALANCE COMPUTATION
// =============================================

export interface Balance {
  wallet: string
  displayName: string
  amount: number // positive = owed, negative = owes (in smallest token unit)
}

export interface SettlementTransfer {
  from: string
  to: string
  amount: number
  fromName?: string
  toName?: string
}

/**
 * Compute net balances for all members from expenses and settlements.
 * Pulls data from the authenticated Group dashboard snapshot.
 */
export async function computeGroupBalances(groupId: string): Promise<Balance[]> {
  const snapshot = await getGroupDashboardSnapshot(groupId)

  if (!snapshot.isMember) {
    return []
  }

  return computeBalancesFromActivity(snapshot.members, snapshot.activity)
}

export function computeBalancesFromActivity(
  members: MemberRow[],
  activity: ActivityItem[]
): Balance[] {
  const balances: Record<string, number> = {}

  for (const member of members) {
    balances[member.wallet] = 0
  }

  for (const item of activity) {
    if (item.type === "expense") {
      balances[item.data.payer] = (balances[item.data.payer] || 0) + item.data.amount

      for (const split of item.data.splits) {
        balances[split.wallet] = (balances[split.wallet] || 0) - split.share
      }

      continue
    }

    balances[item.data.from_wallet] = (balances[item.data.from_wallet] || 0) + item.data.amount
    balances[item.data.to_wallet] = (balances[item.data.to_wallet] || 0) - item.data.amount
  }

  return members.map((member) => ({
    wallet: member.wallet,
    displayName: member.display_name || `${member.wallet.slice(0, 4)}...${member.wallet.slice(-4)}`,
    amount: balances[member.wallet] || 0,
  }))
}

/**
 * Simplify balances into minimum number of transfers.
 * Greedy algorithm: pair largest creditor with largest debtor.
 */
export function simplifySettlements(balances: Balance[]): SettlementTransfer[] {
  const transfers: SettlementTransfer[] = []

  const creditors = balances
    .filter((b) => b.amount > 0)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = balances
    .filter((b) => b.amount < 0)
    .map((b) => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount)

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].amount, debtors[j].amount)
    if (amount > 0) {
      transfers.push({
        from: debtors[j].wallet,
        to: creditors[i].wallet,
        amount,
        fromName: debtors[j].displayName,
        toName: creditors[i].displayName,
      })
    }

    creditors[i].amount -= amount
    debtors[j].amount -= amount

    if (creditors[i].amount <= 0) i++
    if (debtors[j].amount <= 0) j++
  }

  return transfers
}

// =============================================
// SPLIT CALCULATION
// =============================================

export interface SplitInput {
  wallet: string
  share: number
}

/**
 * Calculate splits for an expense based on the split method.
 * Returns array of { wallet, share } where shares sum to totalAmount (in smallest token unit).
 */
export function calculateSplits(
  totalAmount: number,
  participants: string[],
  method: "equal" | "exact" | "shares" | "percentage",
  customValues?: Record<string, number>
): SplitInput[] {
  switch (method) {
    case "equal": {
      const sharePerPerson = Math.floor(totalAmount / participants.length)
      const remainder = totalAmount - sharePerPerson * participants.length
      return participants.map((wallet, index) => ({
        wallet,
        share: sharePerPerson + (index < remainder ? 1 : 0),
      }))
    }

    case "exact": {
      if (!customValues) throw new Error("Custom values required for exact split")
      const hasNegativeAmount = participants.some((wallet) => (customValues[wallet] || 0) < 0)
      if (hasNegativeAmount) throw new Error("Exact split amounts cannot be negative")
      const totalExactAmount = participants.reduce((sum, wallet) => sum + (customValues[wallet] || 0), 0)
      if (totalExactAmount !== totalAmount) {
        throw new Error("Exact split must add up to the full Expense amount")
      }
      return participants.map((wallet) => ({
        wallet,
        share: customValues[wallet] || 0,
      }))
    }

    case "shares": {
      if (!customValues) throw new Error("Custom values required for shares split")
      const hasNegativeShare = participants.some((wallet) => (customValues[wallet] || 0) < 0)
      if (hasNegativeShare) throw new Error("Share values cannot be negative")
      const totalShares = participants.reduce((sum, w) => sum + (customValues[w] || 0), 0)
      if (totalShares === 0) throw new Error("Total shares cannot be zero")
      let allocated = 0
      return participants.map((wallet, index) => {
        const share = index === participants.length - 1
          ? totalAmount - allocated
          : Math.floor((totalAmount * (customValues[wallet] || 0)) / totalShares)
        allocated += share
        return { wallet, share }
      })
    }

    case "percentage": {
      if (!customValues) throw new Error("Custom values required for percentage split")
      const hasNegativePercentage = participants.some((wallet) => (customValues[wallet] || 0) < 0)
      if (hasNegativePercentage) throw new Error("Percentages cannot be negative")
      const totalPercentage = participants.reduce((sum, wallet) => sum + (customValues[wallet] || 0), 0)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error("Percentages must add up to 100")
      }
      let allocated = 0
      return participants.map((wallet, index) => {
        const share = index === participants.length - 1
          ? totalAmount - allocated
          : Math.floor((totalAmount * (customValues[wallet] || 0)) / 100)
        allocated += share
        return { wallet, share }
      })
    }
  }
}

// =============================================
// ON-CHAIN SETTLEMENT
// =============================================

/**
 * Execute an SPL token transfer for settlement.
 * Creates destination ATA if it doesn't exist.
 */
export async function executeSettlement(
  fromWallet: any,
  fromAddress: string,
  toAddress: string,
  amount: number,
  mintAddress: string
): Promise<{ signature: string }> {
  const { signature } = await executeStablecoinTransfer(fromWallet, {
    fromAddress,
    toAddress,
    amount,
    mintAddress,
  })
  return { signature }
}

// =============================================
// TOKEN UTILS
// =============================================

export async function getTokenBalance(walletAddress: string, mintAddress: string): Promise<number> {
  try {
    const mint = new PublicKey(mintAddress)
    const wallet = new PublicKey(walletAddress)
    const ata = await getAssociatedTokenAddress(mint, wallet)
    const account = await getAccount(connection, ata)
    return Number(account.amount)
  } catch {
    return 0
  }
}

export function formatTokenAmount(amount: number, decimals: number = 6): string {
  return (amount / Math.pow(10, decimals)).toFixed(2)
}

export function parseTokenAmount(amount: string, decimals: number = 6): number {
  return Math.round(parseFloat(amount) * Math.pow(10, decimals))
}
