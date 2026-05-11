import Link from "next/link"
import { FundWiseLogo } from "@/components/fundwise-logo"

const productLinks = [
  { href: "/#modes", label: "Modes" },
  { href: "/#how", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/story", label: "Story" },
  { href: "/groups", label: "Launch app" },
]

const communityLinks = [
  { href: "https://x.com/funddotsol", label: "X", aria: "Follow FundWise on X" },
  { href: "https://t.me/funddotsol", label: "Telegram", aria: "Join FundWise on Telegram" },
]

const legalLinks = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/disclosures", label: "Disclosures" },
]

export function Footer() {
  return (
    <footer className="border-t border-brand-border-c px-4 py-10 sm:px-6 sm:py-11 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <FundWiseLogo markSize={32} wordmarkClassName="text-xl text-brand-text-2" />

          <div className="flex flex-wrap gap-3.5 sm:gap-[22px]">
            {productLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 items-center rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="text-xs text-brand-text-3 sm:text-right">
            &copy; 2026 FundWise &middot; FundLabs
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-brand-border-c/60 pt-5 text-[12px] text-brand-text-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium uppercase tracking-[0.12em] text-brand-text-2">Community</span>
            {communityLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.aria}
                className="inline-flex min-h-10 items-center rounded-sm transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium uppercase tracking-[0.12em] text-brand-text-2">Legal</span>
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 items-center rounded-sm transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
