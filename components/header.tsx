"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, Home } from "lucide-react"
import { FundWiseLogo } from "@/components/fundwise-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletButton } from "@/components/wallet-button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getFundWiseClusterLabel,
  getFundWiseClusterName,
  type FundWiseCluster,
} from "@/lib/solana-cluster"
import { cn } from "@/lib/utils"

type HeaderProps = {
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

function ClusterBadge({ cluster }: { cluster: FundWiseCluster }) {
  const label = getFundWiseClusterLabel(
    cluster === "mainnet-beta"
      ? "https://api.mainnet-beta.solana.com"
      : cluster === "devnet"
      ? "https://api.devnet.solana.com"
      : process.env.NEXT_PUBLIC_SOLANA_RPC_URL || ""
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex min-h-9 cursor-help items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] sm:px-3 sm:text-[11px]",
            CLUSTER_BADGE_STYLES[cluster]
          )}
          aria-label={`Solana network: ${label}`}
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-center">
        {CLUSTER_TOOLTIP_COPY[cluster]}
      </TooltipContent>
    </Tooltip>
  )
}

export function Header({ cluster }: HeaderProps = {}) {
  const pathname = usePathname()
  const activeCluster = cluster ?? getFundWiseClusterName()
  const isMarketingRoute = pathname === "/"
  const isGroupsIndexRoute = pathname === "/groups"
  const navItems = [
    { href: "/#modes", label: "Modes", sectionId: "modes" },
    { href: "/#how", label: "How it works", sectionId: "how" },
    { href: "/#features", label: "Features", sectionId: "features" },
    { href: "/#agent", label: "Agent", sectionId: "agent" },
  ]
  const appNavItems = [
    {
      href: "/groups",
      label: "Groups",
      icon: Wallet,
      active: pathname.startsWith("/groups"),
    },
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: false,
    },
  ]

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    if (pathname !== "/") {
      window.location.href = `/#${sectionId}`
      return
    }
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border-c bg-background/92 backdrop-blur-xl">
      <div className="px-4 py-3.5 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
        <div className="flex min-h-14 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FundWiseLogo markSize={46} wordmarkClassName="text-[28px] leading-none" />
          </Link>

          {isMarketingRoute ? (
            <nav className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.sectionId}
                  href={item.href}
                  onClick={(e) => handleScrollToSection(e, item.sectionId)}
                  className="rounded-sm text-sm font-medium text-brand-text-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/story"
                className="rounded-sm text-sm font-medium text-brand-text-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Story
              </Link>
            </nav>
          ) : (
            <nav className="hidden items-center gap-2 lg:flex">
              {appNavItems.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-[border-color,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      item.active
                        ? "border-accent/20 bg-accent/10 text-accent"
                        : "border-brand-border-c bg-background/80 text-brand-text-2 hover:bg-brand-surface hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {!isMarketingRoute ? <ClusterBadge cluster={activeCluster} /> : null}
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>

        {isMarketingRoute ? (
          <nav className="mt-3 flex flex-wrap gap-2 md:hidden">
            {navItems.map((item) => (
              <a
                key={item.sectionId}
                href={item.href}
                onClick={(e) => handleScrollToSection(e, item.sectionId)}
                className="inline-flex min-h-10 items-center rounded-full border border-brand-border-c bg-brand-surface px-3.5 text-sm font-medium text-brand-text-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/story"
              className="inline-flex min-h-10 items-center rounded-full border border-brand-border-c bg-brand-surface px-3.5 text-sm font-medium text-brand-text-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Story
            </Link>
          </nav>
        ) : (
          <div className="mt-3 flex items-center gap-3 lg:hidden">
            <Link
              href="/groups"
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-[border-color,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isGroupsIndexRoute
                  ? "border-accent/20 bg-accent/10 text-accent"
                  : "border-brand-border-c bg-background/80 text-brand-text-2 hover:bg-brand-surface hover:text-foreground"
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
              Groups
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
