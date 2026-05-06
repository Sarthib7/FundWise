import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRightLeft,
  CheckCircle2,
  Landmark,
  Link2,
  ReceiptText,
  WalletCards,
} from "lucide-react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "The FundWise Story — Group money, done right.",
  description:
    "Why FundWise exists: split expenses, settle exact USDC amounts on-chain, and grow toward proposal-based Group treasuries.",
}

const settlementLoop = [
  "A Member shares a Settlement Request Link.",
  "The debtor opens the live Group Balance, not a stale invoice.",
  "They settle in USDC and everyone gets a verifiable Receipt.",
]

const productPath = [
  {
    icon: ReceiptText,
    title: "Split expenses",
    body: "Log who paid, who participated, and how the Expense should be split. FundWise keeps the Group ledger readable.",
  },
  {
    icon: CheckCircle2,
    title: "Settle on-chain",
    body: "Debtor Members settle exact net Balances in USDC. The Receipt includes the transaction signature, so the awkward follow-up ends.",
  },
  {
    icon: Landmark,
    title: "Build treasuries",
    body: "Fund Mode extends the same Group money model into pooled USDC Treasuries with proposal-based spending.",
  },
]

export default function StoryPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-[max(24px,calc(50%-660px))]">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border-2 bg-brand-pale px-4 py-1.5 text-xs font-semibold text-brand-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-fresh" aria-hidden="true" />
                The FundWise story
              </div>
              <h1 className="font-serif text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.05] tracking-tight text-foreground text-balance">
                The end of awkward Group IOUs.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-text-2 md:text-lg">
                Someone pays for the Airbnb. Someone pays for the rental car. Three months later someone still owes someone $47. FundWise turns that loose IOU into a clear Group ledger, a wallet-confirmed Settlement, and a Receipt everyone can trust.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild className="min-h-11 bg-accent hover:bg-accent/90">
                  <Link href="/groups">Create a Group</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/demo">Try demo</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[22px] border border-brand-border-c bg-brand-surface p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-border-c bg-brand-surface-2 text-brand-deep">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-serif text-xl tracking-tight text-foreground">Settlement Request Links</h2>
                  <p className="text-sm text-brand-text-2">The product demo your friends send for you.</p>
                </div>
              </div>
              <ol className="space-y-3">
                {settlementLoop.map((item, index) => (
                  <li key={item} className="flex gap-3 rounded-[12px] border border-brand-border-c bg-background p-3 text-sm text-brand-text-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-pale font-mono text-xs font-bold text-brand-deep">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-y border-brand-border-c bg-brand-surface px-4 py-16 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
          <div className="grid gap-5 md:grid-cols-3">
            {productPath.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="rounded-[18px] border border-brand-border-c bg-background p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border border-brand-border-c bg-brand-surface text-brand-deep">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <h2 className="font-serif text-xl tracking-tight text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-brand-text-2">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-[max(24px,calc(50%-660px))]">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid">
                Cross-chain top-ups
              </div>
              <h2 className="font-serif text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-tight text-foreground text-balance">
                Chain does not matter when your friends owe you money.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-brand-text-2 md:text-base">
              <p>
                Your Ethereum friend owes $35. Your Base friend owes $20. Your Solana friend owes $47. FundWise keeps the Settlement model simple: top up into Solana USDC when needed, then settle through the same Group flow.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-brand-border-c bg-brand-surface p-4">
                  <WalletCards className="mb-3 h-5 w-5 text-brand-deep" aria-hidden="true" />
                  <h3 className="font-semibold text-foreground">Add funds</h3>
                  <p className="mt-1 text-sm text-brand-text-2">LI.FI helps EVM-first Members reach Solana USDC without turning Settlement into bridge management.</p>
                </div>
                <div className="rounded-[16px] border border-brand-border-c bg-brand-surface p-4">
                  <ArrowRightLeft className="mb-3 h-5 w-5 text-brand-deep" aria-hidden="true" />
                  <h3 className="font-semibold text-foreground">Same Receipt</h3>
                  <p className="mt-1 text-sm text-brand-text-2">The top-up path supports the core flow. The actual Settlement still ends with one on-chain Receipt.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
