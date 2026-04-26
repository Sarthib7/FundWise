"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { WalletButton } from "@/components/wallet-button"

export function Header() {
  const pathname = usePathname()

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
      <div className="flex items-center justify-between h-16 px-6 lg:px-[max(24px,calc(50%-660px))]">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
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

        <nav className="hidden md:flex items-center gap-7">
          <a
            href="/#modes"
            onClick={(e) => handleScrollToSection(e, "modes")}
            className="text-sm font-medium text-brand-text-2 hover:text-foreground transition-colors"
          >
            Modes
          </a>
          <a
            href="/#how"
            onClick={(e) => handleScrollToSection(e, "how")}
            className="text-sm font-medium text-brand-text-2 hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <a
            href="/#features"
            onClick={(e) => handleScrollToSection(e, "features")}
            className="text-sm font-medium text-brand-text-2 hover:text-foreground transition-colors"
          >
            Features
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
