const features = [
  {
    icon: "⚡",
    title: "Instant settlement",
    desc: "SPL transfers confirm in <3s on Solana. No waiting, no pending, no reversals.",
  },
  {
    icon: "🔒",
    title: "Non-custodial",
    desc: "Your keys, your funds. FundWise never holds money — all transfers go wallet-to-wallet.",
  },
  {
    icon: "💵",
    title: "Stablecoins only",
    desc: "USDC, USDT, PYUSD — any SPL stablecoin. No volatility. Always $1 = $1.",
  },
  {
    icon: "🌐",
    title: "Cross-chain contributions",
    desc: "Fund Mode accepts contributions from any chain via LI.FI bridge.",
  },
  {
    icon: "📊",
    title: "Debt simplification",
    desc: "Minimum transfers to settle a whole group — Splitwise-style, but on-chain.",
  },
  {
    icon: "🧾",
    title: "On-chain proof",
    desc: "Every settlement stores a Solana tx signature. Dispute-free, forever.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        Why FundWise
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        Built different
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        The familiar UX of Splitwise, the finality of blockchain.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat) => (
          <div
            key={feat.title}
            className="rounded-2xl border border-brand-border-c bg-brand-surface p-6 hover:border-brand-border-2 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(13,107,58,0.08)] transition-all"
          >
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg mb-3.5 bg-brand-surface-2 border border-brand-border-c">
              {feat.icon}
            </div>
            <h3 className="font-serif text-[17px] tracking-tight mb-1.5 text-foreground">
              {feat.title}
            </h3>
            <p className="text-[13px] text-brand-text-2 leading-relaxed">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
