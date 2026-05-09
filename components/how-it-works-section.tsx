export function HowItWorksSection() {
  return (
    <section id="how" className="px-4 py-24 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        How it works
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        From open tab to shared Treasury
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        The same Group can start with simple split-and-settle behavior, then move into pooled spending when it becomes recurring.
      </p>

      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        <div>
          <div className="font-serif text-[56px] leading-none mb-5 text-brand-grad opacity-30">
            01
          </div>
          <h3 className="font-serif text-xl tracking-tight mb-2.5 text-foreground">
            Start with a private Group
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed">
            Create a Group for a trip, dinner, household, club, or recurring budget. Invite Members by link or QR.
          </p>
        </div>

        <div>
          <div className="font-serif text-[56px] leading-none mb-5 text-brand-grad opacity-30">
            02
          </div>
          <h3 className="font-serif text-xl tracking-tight mb-2.5 text-foreground">
            Close the current tab
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed">
            Record who paid, who participated, and how to split it. FundWise turns the live Balance into exact USDC Settlements and Receipts.
          </p>
        </div>

        <div>
          <div className="font-serif text-[56px] leading-none mb-5 text-brand-grad opacity-30">
            03
          </div>
          <h3 className="font-serif text-xl tracking-tight mb-2.5 text-foreground">
            Fund what comes next
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed">
            Durable Groups graduate into Fund Mode: Contributions, Treasury Balance, reimbursement Proposals, approvals, proof, and execution.
          </p>
        </div>
      </div>
    </section>
  )
}
