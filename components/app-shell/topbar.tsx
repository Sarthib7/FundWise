"use client"

import { Bell, Search } from "lucide-react"
import type { ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletButton } from "@/components/wallet-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getFundWiseClusterLabel,
  type FundWiseCluster,
} from "@/lib/solana-cluster"
import { cn } from "@/lib/utils"

type TopbarProps = {
  title: ReactNode
  breadcrumb?: ReactNode
  search?: boolean
  rightActions?: ReactNode
  cluster?: FundWiseCluster
}

const CLUSTER_BADGE_STYLES: Record<FundWiseCluster, string> = {
  "mainnet-beta":
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  devnet:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  custom:
    "border-brand-border-c bg-brand-surface text-brand-text-3",
}

const CLUSTER_TOOLTIP_COPY: Record<FundWiseCluster, string> = {
  "mainnet-beta":
    "Solana mainnet. Real USDC, real fees. Used by Split Mode in production.",
  devnet:
    "Solana devnet. Test USDC, no real value. Used by Fund Mode beta and by Split Mode in preview.",
  custom:
    "Custom Solana RPC. Network identity is not auto-detected.",
}

function clusterRpcUrl(cluster: FundWiseCluster): string {
  if (cluster === "mainnet-beta") return "https://api.mainnet-beta.solana.com"
  if (cluster === "devnet") return "https://api.devnet.solana.com"
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || ""
}

export function Topbar({
  title,
  breadcrumb,
  search = true,
  rightActions,
  cluster,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 hidden items-center gap-5 border-b border-brand-border-c bg-background/92 px-6 py-4 backdrop-blur-xl lg:flex xl:px-8">
      <div className="min-w-0 flex-1">
        {breadcrumb ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-text-3">
            {breadcrumb}
          </div>
        ) : null}
        <h1 className="mt-0.5 truncate font-serif text-[26px] leading-tight tracking-[-0.5px] text-foreground">
          {title}
        </h1>
      </div>

      {search ? (
        <div className="relative hidden w-[260px] xl:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-3"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search groups, people, expenses…"
            disabled
            aria-label="Search (coming soon)"
            className="h-10 w-full rounded-xl border border-brand-border-c bg-brand-surface px-9 text-sm text-foreground placeholder:text-brand-text-3 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      ) : null}

      {cluster ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex min-h-9 cursor-help items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.14em]",
                CLUSTER_BADGE_STYLES[cluster],
              )}
              aria-label={`Solana network: ${getFundWiseClusterLabel(clusterRpcUrl(cluster))}`}
            >
              {getFundWiseClusterLabel(clusterRpcUrl(cluster))}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-center">
            {CLUSTER_TOOLTIP_COPY[cluster]}
          </TooltipContent>
        </Tooltip>
      ) : null}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            aria-label="Notifications (coming soon)"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border-c bg-background/80 text-brand-text-2 transition-[border-color,background-color,color] duration-150 hover:bg-brand-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Bell className="h-4 w-4" aria-hidden />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand-green-fresh ring-2 ring-background" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications coming soon</TooltipContent>
      </Tooltip>

      <ThemeToggle />

      <WalletButton />

      {rightActions ? <div className="flex items-center gap-2">{rightActions}</div> : null}
    </header>
  )
}
