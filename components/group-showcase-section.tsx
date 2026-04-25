import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Receipt, ArrowRightLeft, Wallet } from "lucide-react"

const scenarios = [
  {
    title: "Dinner with Friends",
    description: "Split the bill equally. One person pays, everyone else settles in USDC with one tap.",
    icon: Receipt,
    tag: "Split Mode",
  },
  {
    title: "Group Trip Fund",
    description: "Pool USDC into a shared treasury. Approve spending for hotels, activities, and meals together.",
    icon: Wallet,
    tag: "Fund Mode",
  },
  {
    title: "Shared Apartment",
    description: "Track rent, utilities, and groceries. Settle balances at the end of each month on-chain.",
    icon: ArrowRightLeft,
    tag: "Split Mode",
  },
  {
    title: "Birthday Gift Pool",
    description: "Everyone chips in. One proposal to buy the gift, threshold approval, and it ships.",
    icon: Users,
    tag: "Fund Mode",
  },
]

export function GroupShowcaseSection() {
  return (
    <section id="groups" className="container py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Real Life</h2>
          <p className="text-muted-foreground text-lg">
            Every group expense scenario, settled on-chain in stablecoins.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {scenarios.map((scenario, index) => {
            const Icon = scenario.icon
            return (
              <Card key={index} className="p-6 hover:border-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg">{scenario.title}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 text-xs">
                    {scenario.tag}
                  </Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">{scenario.description}</p>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 p-6 rounded-xl bg-accent/5 border border-accent/20 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-accent">On-chain settlement:</span> Every settle-up is an SPL token transfer recorded on Solana. No ledger tricks, no &quot;I&apos;ll send it later.&quot;
          </p>
        </div>
      </div>
    </section>
  )
}
