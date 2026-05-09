import {
  ArrowRightLeft,
  Landmark,
  Link2,
  ListChecks,
  ReceiptText,
  ShieldCheck,
  WalletCards,
  Zap,
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Exact settle-up",
    desc: "Members settle the current net Balance instead of negotiating custom amounts in the group chat.",
  },
  {
    icon: Link2,
    title: "Live request links",
    desc: "Share a settle-up link that resolves the live Balance instead of freezing a stale amount.",
  },
  {
    icon: WalletCards,
    title: "One Group ledger",
    desc: "The same Member history can start with Split Mode and grow into Treasury workflows.",
  },
  {
    icon: ArrowRightLeft,
    title: "Funds-elsewhere support",
    desc: "If someone needs to move funds first, routing stays behind the settle-up flow instead of becoming a separate task.",
  },
  {
    icon: Landmark,
    title: "Shared Treasury",
    desc: "Fund Mode gives recurring Groups a pooled USDC balance instead of endless reimbursements.",
  },
  {
    icon: ListChecks,
    title: "Proposal-led spend",
    desc: "Reimbursements move through review, approval, proof, history, and explicit execution.",
  },
  {
    icon: ShieldCheck,
    title: "Private Groups",
    desc: "Group ledgers stay scoped to invited Members, not public feeds or loose payment notes.",
  },
  {
    icon: ReceiptText,
    title: "Verifiable Receipts",
    desc: "Each completed settle-up records who paid whom, how much moved, and the proof behind it.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-24 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid mb-3">
        Why FundWise
      </div>
      <h2 className="font-serif text-[clamp(1.75rem,4vw,2.875rem)] tracking-tight leading-[1.1] mb-3.5 text-foreground text-balance">
        Built for Groups that outgrow IOUs
      </h2>
      <p className="text-base text-brand-text-2 max-w-md leading-relaxed mb-14">
        Expense trackers show what happened. FundWise helps the Group settle what is owed and manage the money it keeps together.
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
