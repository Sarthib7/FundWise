import {
  ArrowRightLeft,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant settlement",
    desc: "Settle shared balances in seconds instead of waiting days for bank transfers to clear.",
  },
  {
    icon: ShieldCheck,
    title: "Non-custodial",
    desc: "Your keys, your funds. FundWise never holds money — all transfers go wallet-to-wallet.",
  },
  {
    icon: WalletCards,
    title: "Stable-value payments",
    desc: "Pay and settle in stablecoins so group balances stay predictable from dinner to checkout.",
  },
  {
    icon: ArrowRightLeft,
    title: "Cross-chain top-ups",
    desc: "Use LI.FI when your funds are on another chain, then come back and settle in the same flow.",
  },
  {
    icon: ReceiptText,
    title: "Built-in proof",
    desc: "Every settlement keeps a verifiable receipt so the awkward “did you pay?” follow-up disappears.",
  },
  {
    icon: ShieldCheck,
    title: "Wallet-aware guidance",
    desc: "Zerion-powered wallet insights can help users understand balances and choose the next best move.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        Why FundWise
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        Built different
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        The familiar feel of Splitwise, rebuilt for instant digital settlement.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feat) => {
          const Icon = feat.icon

          return (
            <div
              key={feat.title}
              className="rounded-2xl border border-brand-border-c bg-brand-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-border-2 hover:shadow-[0_8px_24px_rgba(13,107,58,0.08)] sm:p-6"
            >
              <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-border-c bg-brand-surface-2 text-brand-deep">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-serif text-[17px] tracking-tight mb-1.5 text-foreground">
                {feat.title}
              </h3>
              <p className="text-[13px] text-brand-text-2 leading-relaxed">
                {feat.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
