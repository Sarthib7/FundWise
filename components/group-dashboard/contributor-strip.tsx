"use client"

import { useMemo } from "react"
import { WalletAvatar } from "@/components/avatar"
import { formatTokenAmount } from "@/lib/expense-engine"
import type { Database } from "@/lib/database.types"
import { cn } from "@/lib/utils"

type ContributionRow = Database["public"]["Tables"]["contributions"]["Row"]

type ContributorStripProps = {
  contributions: ContributionRow[]
  tokenName: string
  memberNameByWallet: Map<string, string>
  walletAddress: string
  className?: string
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function ContributorStrip({
  contributions,
  tokenName,
  memberNameByWallet,
  walletAddress,
  className,
}: ContributorStripProps) {
  const aggregated = useMemo(() => {
    const totals = new Map<string, number>()
    for (const c of contributions) {
      totals.set(c.member_wallet, (totals.get(c.member_wallet) || 0) + c.amount)
    }
    return Array.from(totals.entries())
      .map(([wallet, amount]) => ({ wallet, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [contributions])

  if (aggregated.length === 0) return null

  return (
    <div className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {aggregated.map((c) => {
        const isMe = c.wallet === walletAddress
        const name = memberNameByWallet.get(c.wallet) || shortWallet(c.wallet)
        return (
          <div
            key={c.wallet}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5",
              isMe
                ? "border-brand-blue-border bg-brand-blue-pale"
                : "border-brand-border-c bg-brand-surface",
            )}
          >
            <WalletAvatar address={c.wallet} size={32} />
            <div className="max-w-[80px] truncate text-[11px] font-semibold leading-tight text-foreground">
              {isMe ? "You" : name}
            </div>
            <div className="font-mono text-[11px] tabular-nums text-brand-blue-mid">
              {formatTokenAmount(c.amount)} {tokenName}
            </div>
          </div>
        )
      })}
    </div>
  )
}
