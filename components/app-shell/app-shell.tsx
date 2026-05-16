"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { MobileHeader } from "./mobile-header"
import { BottomNav, type FabAction } from "./bottom-nav"
import type { AppRoute } from "./nav-items"
import type { FundWiseCluster } from "@/lib/solana-cluster"
import { cn } from "@/lib/utils"

type PinnedGroup = {
  id: string
  name: string
  mode: "split" | "fund"
}

type AppShellProps = {
  activeRoute?: AppRoute
  title: ReactNode
  breadcrumb?: ReactNode
  cluster?: FundWiseCluster
  rightActions?: ReactNode
  fabAction?: FabAction
  pinnedGroups?: PinnedGroup[]
  viewerName?: string
  viewerAddress?: string
  mobileBackHref?: string
  mobileTitle?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export function AppShell({
  activeRoute,
  title,
  breadcrumb,
  cluster,
  rightActions,
  fabAction,
  pinnedGroups,
  viewerName,
  viewerAddress,
  mobileBackHref,
  mobileTitle,
  children,
  contentClassName,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        activeRoute={activeRoute}
        pinnedGroups={pinnedGroups}
        viewerName={viewerName}
        viewerAddress={viewerAddress}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader
          title={mobileTitle ?? title}
          backHref={mobileBackHref}
          rightActions={rightActions}
        />
        <Topbar
          title={title}
          breadcrumb={breadcrumb}
          cluster={cluster}
          rightActions={rightActions}
        />
        <main
          className={cn(
            "flex-1 pb-[calc(env(safe-area-inset-bottom)+86px)] lg:pb-0",
            contentClassName,
          )}
        >
          {children}
        </main>
      </div>
      <BottomNav activeRoute={activeRoute} fabAction={fabAction} />
    </div>
  )
}
