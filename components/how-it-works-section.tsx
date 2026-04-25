"use client"

import { Card } from "@/components/ui/card"
import { Plus, Share2, Wallet } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "sonner"

const steps = [
  {
    icon: Plus,
    title: "Create a Group",
    description: "Pick a stablecoin, add your friends by wallet, handle, or invite link. Connect your Solana wallet to get started.",
  },
  {
    icon: Share2,
    title: "Log Expenses Together",
    description: "Anyone in the group can add an expense — pick participants and a split method (equal, exact, or shares).",
  },
  {
    icon: Wallet,
    title: "Settle On-Chain",
    description: "One click sends stablecoins from who owes to who paid. Transaction signatures are recorded as proof.",
  },
]

export function HowItWorksSection() {
  const { connected } = useWallet()

  return (
    <section id="how-it-works" className="container py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">
            Three simple steps to start splitting with your group
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="p-6 text-center border-border/50 hover:border-accent/50 transition-colors">
                <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mx-auto">
                  <Icon className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 p-8 rounded-2xl bg-card border border-border/50">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Ready to stop chasing friends for money?</h3>
              <p className="text-muted-foreground">
                Create a group in seconds and settle your next dinner, trip, or shared subscription on-chain.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/groups"
                className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors text-center"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
