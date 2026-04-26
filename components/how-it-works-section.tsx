export function HowItWorksSection() {
  return (
    <section id="how" className="py-24 px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        How it works
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        Three steps to settled
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        Designed for people who want financial clarity without the friction.
      </p>

      <div className="grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-serif text-[56px] leading-none mb-5 text-brand-grad opacity-30">
            01
          </div>
          <h3 className="font-serif text-xl tracking-tight mb-2.5 text-foreground">
            Connect your wallet
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed">
            Sign in with Phantom, Solflare, or Backpack. No email, no password — your wallet is your identity.
          </p>
        </div>

        <div>
          <div className="font-serif text-[56px] leading-none mb-5 text-brand-grad opacity-30">
            02
          </div>
          <h3 className="font-serif text-xl tracking-tight mb-2.5 text-foreground">
            Create a group &amp; log expenses
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed">
            Invite friends by wallet address. Log who paid what. FundWise computes the fewest transfers to zero out all debts.
          </p>
        </div>

        <div>
          <div className="font-serif text-[56px] leading-none mb-5 text-brand-grad opacity-30">
            03
          </div>
          <h3 className="font-serif text-xl tracking-tight mb-2.5 text-foreground">
            Settle with one click
          </h3>
          <p className="text-sm text-brand-text-2 leading-relaxed">
            Pay in USDC. Confirms on Solana in under 3 seconds. Permanently recorded on-chain — no disputes, no reversals.
          </p>
        </div>
      </div>
    </section>
  )
}
