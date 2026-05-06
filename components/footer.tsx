import Link from "next/link"
import { FundWiseLogo } from "@/components/fundwise-logo"

export function Footer() {
  return (
    <footer className="border-t border-brand-border-c px-4 py-10 sm:px-6 sm:py-11 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <FundWiseLogo markSize={32} wordmarkClassName="text-xl text-brand-text-2" />

        <div className="flex flex-wrap gap-3.5 sm:gap-[22px]">
          <Link
            href="/#modes"
            className="inline-flex min-h-10 items-center rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Modes
          </Link>
          <Link
            href="/#how"
            className="inline-flex min-h-10 items-center rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            How it works
          </Link>
          <Link
            href="/#features"
            className="inline-flex min-h-10 items-center rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Features
          </Link>
          <Link
            href="/story"
            className="inline-flex min-h-10 items-center rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Story
          </Link>
          <Link
            href="/groups"
            className="inline-flex min-h-10 items-center rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Launch app
          </Link>
        </div>

        <div className="text-xs text-brand-text-3 sm:text-right">
          &copy; 2026 FundWise &middot; Colosseum Frontier
        </div>
      </div>
    </footer>
  )
}
