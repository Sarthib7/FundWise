import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, DollarSign } from "lucide-react"

const groupData = [
  {
    name: "Team Vacation Fund",
    members: 8,
    collected: "$2,840",
    goal: "$5,000",
    progress: 57,
    category: "Travel",
  },
  {
    name: "Birthday Gift Pool",
    members: 12,
    collected: "$480",
    goal: "$600",
    progress: 80,
    category: "Gift",
  },
  {
    name: "Office Party Budget",
    members: 24,
    collected: "$1,920",
    goal: "$2,000",
    progress: 96,
    category: "Event",
  },
  {
    name: "Community Project",
    members: 45,
    collected: "$8,750",
    goal: "$10,000",
    progress: 88,
    category: "Community",
  },
]

export function GroupShowcaseSection() {
  return (
    <section id="groups" className="container py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Active Fundraising Groups</h2>
          <p className="text-muted-foreground text-lg">
            See what groups are collecting funds together. All contributions are private and secure.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {groupData.map((group, index) => (
            <Card key={index} className="p-6 hover:border-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{group.members} members</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20">
                  {group.category}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{group.progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${group.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="font-semibold">{group.collected}</span>
                    <span className="text-sm text-muted-foreground">collected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Goal: {group.goal}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-xl bg-accent/5 border border-accent/20 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-accent">Privacy Protected:</span> All contribution amounts and wallet
            addresses are encrypted with ZK compression. Only aggregate totals are visible.
          </p>
        </div>
      </div>
    </section>
  )
}
