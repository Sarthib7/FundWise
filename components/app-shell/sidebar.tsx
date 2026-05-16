"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { FundWiseLogo } from "@/components/fundwise-logo"
import { WalletAvatar } from "@/components/avatar"
import { ModeBadge } from "@/components/brand/mode-badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { APP_NAV_ITEMS, type AppRoute } from "./nav-items"

type PinnedGroup = {
  id: string
  name: string
  mode: "split" | "fund"
}

type SidebarProps = {
  activeRoute?: AppRoute
  pinnedGroups?: PinnedGroup[]
  viewerName?: string
  viewerAddress?: string
  className?: string
}

function shortAddress(address?: string) {
  if (!address) return ""
  if (address.length <= 10) return address
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export function Sidebar({
  activeRoute,
  pinnedGroups,
  viewerName,
  viewerAddress,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden w-[232px] shrink-0 flex-col gap-1 border-r border-brand-border-c bg-background px-3.5 py-5 lg:flex",
        className,
      )}
    >
      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-2 px-2 py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <FundWiseLogo markSize={28} wordmarkClassName="text-[20px] leading-none" />
      </Link>

      <nav aria-label="App navigation" className="flex flex-col gap-0.5">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeRoute === item.id

          const inner = (
            <span
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-[background-color,color] duration-150",
                isActive
                  ? "bg-brand-surface text-foreground"
                  : "text-brand-text-2 hover:bg-brand-surface/70 hover:text-foreground",
                item.disabled && "cursor-not-allowed opacity-55 hover:bg-transparent hover:text-brand-text-2",
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive ? "text-brand-green-mid" : "text-brand-text-2",
                )}
                aria-hidden
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.comingSoon ? (
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-text-3">
                  Soon
                </span>
              ) : null}
            </span>
          )

          if (item.disabled) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button type="button" disabled className="w-full text-left">
                    {inner}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Coming soon</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {inner}
            </Link>
          )
        })}
      </nav>

      {pinnedGroups && pinnedGroups.length > 0 ? (
        <>
          <div className="mt-5 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
            Pinned
          </div>
          <div className="mt-1 flex flex-col gap-0.5">
            {pinnedGroups.slice(0, 5).map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="group/pin inline-flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-brand-text-2 transition-[background-color,color] duration-150 hover:bg-brand-surface/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-block h-5 w-5 shrink-0 rounded-[6px]",
                    g.mode === "split" ? "bg-brand-grad" : "bg-brand-fund-grad",
                  )}
                />
                <span className="flex-1 truncate">{g.name}</span>
                <ModeBadge mode={g.mode} size="sm" className="hidden group-hover/pin:inline-flex" />
              </Link>
            ))}
          </div>
        </>
      ) : null}

      <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-brand-border-c bg-brand-surface p-2.5">
        {viewerAddress ? (
          <WalletAvatar address={viewerAddress} size={32} />
        ) : (
          <div className="h-8 w-8 rounded-full bg-brand-surface-2" aria-hidden />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-bold leading-tight text-foreground">
            {viewerName ?? (viewerAddress ? "Your wallet" : "Connect wallet")}
          </span>
          <span className="mt-0.5 truncate font-mono text-[11px] text-brand-text-3">
            {viewerAddress ? shortAddress(viewerAddress) : "—"}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled
              aria-label="Settings (coming soon)"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-brand-text-3 transition-colors hover:bg-brand-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Settings coming soon</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
