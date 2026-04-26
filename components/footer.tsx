export function Footer() {
  return (
    <footer className="border-t border-brand-border-c py-11 px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex justify-between items-center flex-wrap gap-5">
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

        <div className="flex gap-[22px]">
          <a href="#" className="text-[13px] text-brand-text-3 hover:text-brand-text-2 transition-colors">
            Docs
          </a>
          <a href="#" className="text-[13px] text-brand-text-3 hover:text-brand-text-2 transition-colors">
            GitHub
          </a>
          <a href="#" className="text-[13px] text-brand-text-3 hover:text-brand-text-2 transition-colors">
            Twitter
          </a>
          <a href="#" className="text-[13px] text-brand-text-3 hover:text-brand-text-2 transition-colors">
            Colosseum
          </a>
        </div>

        <div className="text-xs text-brand-text-3">
          &copy; 2026 FundWise &middot; Colosseum Frontier
        </div>
      </div>
    </footer>
  )
}
