import {
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
    eyebrow: "Settle",
    title: "Close the current Balance",
    desc: "Members settle the exact USDC amount owed from the live Group Balance.",
  },
  {
    icon: Link2,
    eyebrow: "Share",
    title: "Links that do not go stale",
    desc: "A settle-up link opens the current state, not an old screenshot or frozen total.",
  },
  {
    icon: ReceiptText,
    eyebrow: "Prove",
    title: "Receipts everyone can verify",
    desc: "Each completed Settlement records who paid, who received, how much moved, and the proof.",
  },
  {
    icon: ListChecks,
    eyebrow: "Govern",
    title: "Treasury spending with history",
    desc: "Fund Mode adds Contributions, Proposals, approvals, proof, and execution for recurring Groups.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-36 px-4 py-24 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid">
            Why FundWise
          </div>
          <h2 className="mb-3.5 font-serif text-[clamp(1.75rem,4vw,2.875rem)] leading-[1.1] tracking-tight text-foreground text-balance">
            From IOUs to a shared Group ledger
          </h2>
          <p className="max-w-md text-base leading-relaxed text-brand-text-2">
            Expense apps stop at memory. FundWise carries the Group from live Balances to verified Receipts, then into Treasury workflows when spending becomes recurring.
          </p>
        </div>

        <div className="grid gap-3 rounded-[22px] border border-brand-border-c bg-brand-surface p-3 shadow-sm sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
          <div className="rounded-[16px] border border-brand-border-c bg-background p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
              <WalletCards className="h-3.5 w-3.5" aria-hidden="true" />
              Old flow
            </div>
            <p className="text-sm font-semibold text-foreground">Chat, spreadsheet, payment app, receipt hunt.</p>
          </div>
          <div className="hidden h-full w-px bg-brand-border-c sm:block" aria-hidden="true" />
          <div className="rounded-[16px] border border-brand-border-2 bg-brand-pale p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-deep">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              FundWise
            </div>
            <p className="text-sm font-semibold text-foreground">One private ledger, exact USDC Settlement, clear Receipt.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feat) => {
          const Icon = feat.icon

          return (
            <div
              key={feat.title}
              className="rounded-[18px] border border-brand-border-c bg-brand-surface p-5 transition-[transform,border-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:border-brand-border-2 hover:shadow-[0_8px_24px_rgba(13,107,58,0.08)] sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-border-c bg-brand-surface-2 text-brand-deep">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="rounded-full border border-brand-border-c bg-background px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
                  {feat.eyebrow}
                </span>
              </div>
              <h3 className="mb-2 font-serif text-[17px] tracking-tight text-foreground">
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
