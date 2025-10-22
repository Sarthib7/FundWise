"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Plus, Share2, Wallet } from "lucide-react"
import { CreateGroupModal } from "@/components/create-group-modal"

const steps = [
  {
    icon: Plus,
    title: "Create Your Group",
    description: "Set up a fundraising group with a goal and description. Connect your wallet to get started.",
  },
  {
    icon: Share2,
    title: "Share Code or QR",
    description: "Get a unique code or QR code to share with friends, family, or community members.",
  },
  {
    icon: Wallet,
    title: "Collect Funds Together",
    description: "Watch contributions come in privately. All transactions are ZK-compressed for maximum privacy.",
  },
]

export function HowItWorksSection() {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const handleLearnMore = () => {
    const groupsSection = document.getElementById("groups")
    if (groupsSection) {
      groupsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <section id="how-it-works" className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Three simple steps to start collecting funds with your group
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
                <h3 className="text-2xl font-bold mb-2">Ready to start fundraising?</h3>
                <p className="text-muted-foreground">
                  Create your group in seconds and start collecting funds privately with ZK compression.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors"
                >
                  Create Group
                </button>
                <button
                  onClick={handleLearnMore}
                  className="px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CreateGroupModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  )
}
