export function Footer() {
  return (
    <footer className="border-t border-brand-border-c px-4 py-10 sm:px-6 sm:py-11 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <rect width="80" height="80" rx="22" fill="url(#ft-grad)" />
            <path d="M18 28 L28 52 L40 34 L52 52 L62 28" stroke="white" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="40" cy="61" r="4.5" fill="white" opacity="0.8" />
            <defs>
              <linearGradient id="ft-grad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0d6b3a" />
                <stop offset="1" stopColor="#2db870" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-serif text-[17px] text-brand-text-2">FundWise</span>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-[22px]">
          <a
            href="#"
            className="rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Docs
          </a>
          <a
            href="#"
            className="rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            GitHub
          </a>
          <a
            href="#"
            className="rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Twitter
          </a>
          <a
            href="#"
            className="rounded-sm text-[13px] text-brand-text-3 transition-colors hover:text-brand-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Colosseum
          </a>
        </div>

        <div className="text-xs text-brand-text-3 sm:text-right">
          &copy; 2026 FundWise &middot; Colosseum Frontier
        </div>
      </div>
    </footer>
  )
}
