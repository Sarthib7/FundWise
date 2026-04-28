"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, Home } from "lucide-react"
import { WalletButton } from "@/components/wallet-button"
import { getFundWiseClusterLabel } from "@/lib/solana-cluster"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const clusterLabel = getFundWiseClusterLabel()
  const isMarketingRoute = pathname === "/"
  const isGroupsIndexRoute = pathname === "/groups"
  const navItems = [
    { href: "/#modes", label: "Modes", sectionId: "modes" },
    { href: "/#how", label: "How it works", sectionId: "how" },
    { href: "/#features", label: "Features", sectionId: "features" },
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
      <div className="px-4 py-3 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg width="26" height="26" viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <rect width="80" height="80" rx="22" fill="url(#nav-grad)" />
              <path d="M18 28 L28 52 L40 34 L52 52 L62 28" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="40" cy="61" r="4.5" fill="white" opacity="0.8" />
              <defs>
                <linearGradient id="nav-grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0d6b3a" />
                  <stop offset="1" stopColor="#2db870" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-serif text-xl tracking-tight text-foreground">FundWise</span>
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
            {!isMarketingRoute ? (
              <span className="inline-flex min-h-9 items-center rounded-full border border-brand-border-c bg-brand-surface px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-3 sm:px-3 sm:text-[11px]">
                {clusterLabel}
              </span>
            ) : null}
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
