export function ModesSection() {
  return (
    <section id="modes" className="pt-28 pb-24 px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        Two modes, one app
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        Pick your flow
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        Whether you&apos;re splitting the restaurant bill or pooling funds for a group trip, FundWise has the right primitive.
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Split Mode Card */}
        <div className="group rounded-[22px] p-10 border-[1.5px] border-brand-border-c bg-brand-surface relative overflow-hidden hover:-translate-y-1 hover:border-brand-border-2 hover:shadow-[0_16px_48px_rgba(13,107,58,0.1)] transition-all">
          <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(45,184,112,0.12) 0%, transparent 70%)" }} aria-hidden="true" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.04em] mb-5 bg-brand-pale text-brand-deep border border-brand-border-2">
            ⚡ Split Mode
          </div>
          <h3 className="font-serif text-[26px] tracking-tight leading-[1.2] mb-3 text-foreground">
            Splitwise,
            <br />
            on Solana.
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed mb-7">
            Log shared expenses, see who owes what, and settle up with a single on-chain transfer. Every settlement is permanent, auditable, and costs less than a cent.
          </p>
          <ul className="flex flex-col gap-2.5">
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Equal, percentage, or custom splits
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Debt simplification graph
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              One-click SPL stablecoin settlement
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              On-chain tx signature as proof
            </li>
          </ul>
        </div>

        {/* Fund Mode Card */}
        <div className="group rounded-[22px] p-10 border-[1.5px] border-brand-border-c bg-brand-surface relative overflow-hidden hover:-translate-y-1 hover:border-brand-fund-blue-border hover:shadow-[0_16px_48px_rgba(42,79,168,0.1)] transition-all">
          <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(42,79,168,0.08) 0%, transparent 70%)" }} aria-hidden="true" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.04em] mb-5 bg-brand-fund-blue-bg text-brand-fund-blue border border-brand-fund-blue-border">
            🏦 Fund Mode
          </div>
          <h3 className="font-serif text-[26px] tracking-tight leading-[1.2] mb-3 text-foreground">
            Reverse Splitwise —
            <br />
            pool first, spend after.
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed mb-7">
            Everyone contributes upfront to a shared treasury. Spending requires a proposal and threshold approval — great for group trips, shared gifts, or recurring costs.
          </p>
          <ul className="flex flex-col gap-2.5">
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Squads multisig treasury
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Proposal + threshold vote
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cross-chain contributions via LI.FI
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Proportional refunds on close
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
