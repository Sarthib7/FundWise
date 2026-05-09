import { Landmark, ReceiptText } from "lucide-react"

export function ModesSection() {
  return (
    <section id="modes" className="px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        Two modes, one Group ledger
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        Start with trust. Graduate into Treasury.
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        Split Mode closes open tabs. Fund Mode is the durable model for Groups that keep spending together.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Split Mode Card */}
        <div className="group relative overflow-hidden rounded-[22px] border-[1.5px] border-brand-border-c bg-brand-surface p-6 transition-all hover:-translate-y-1 hover:border-brand-border-2 hover:shadow-[0_16px_48px_rgba(13,107,58,0.1)] sm:p-8 lg:p-10">
          <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(45,184,112,0.12) 0%, transparent 70%)" }} aria-hidden="true" />
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-border-2 bg-brand-pale px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-deep">
            <ReceiptText className="h-3.5 w-3.5" />
            Split Mode
          </div>
          <h3 className="mb-3 font-serif text-[24px] leading-[1.2] tracking-tight text-foreground sm:text-[26px]">
            For tabs
            <br />
            that need to close.
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed mb-7">
            Log shared Expenses, see the live Balance, and settle exact USDC amounts without chasing the Group chat.
          </p>
          <ul className="flex flex-col gap-2.5">
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Equal, exact, percentage, or shares
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Live settle-up links
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exact settle-up prompts
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e6f7ee" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#1a9151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Receipts everyone can verify
            </li>
          </ul>
        </div>

        {/* Fund Mode Card */}
        <div className="group relative overflow-hidden rounded-[22px] border-[1.5px] border-brand-border-c bg-brand-surface p-6 transition-all hover:-translate-y-1 hover:border-brand-fund-blue-border hover:shadow-[0_16px_48px_rgba(42,79,168,0.1)] sm:p-8 lg:p-10">
          <div className="absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(42,79,168,0.08) 0%, transparent 70%)" }} aria-hidden="true" />
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-fund-blue-border bg-brand-fund-blue-bg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-brand-fund-blue">
            <Landmark className="h-3.5 w-3.5" />
            Fund Mode
          </div>
          <h3 className="mb-3 font-serif text-[24px] leading-[1.2] tracking-tight text-foreground sm:text-[26px]">
            For Groups
            <br />
            that keep spending.
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed mb-7">
            Pool USDC upfront, track Contributions, review reimbursement Proposals, and execute approved spend from a shared Treasury.
          </p>
          <ul className="flex flex-col gap-2.5">
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Squads multisig Treasury
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Contributions and Treasury Balance
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Proposal review, proof, and history
            </li>
            <li className="flex items-center gap-2.5 text-[13px] text-brand-text-2">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="9" fill="#e8f0fb" />
                <path d="M5.5 9l2.5 2.5 5-5" stroke="#2a4fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Invite-only beta while controls mature
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
