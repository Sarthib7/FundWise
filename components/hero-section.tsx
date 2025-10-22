"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, QrCode } from "lucide-react"
import { CreateGroupModal } from "@/components/create-group-modal"
import { JoinGroupModal } from "@/components/join-group-modal"

export function HeroSection() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  return (
    <>
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-accent" />
            <span className="text-muted-foreground">Privacy-first group fundraising on Solana</span>
          </div>

          <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Create a group, <span className="text-accent">collect funds together</span>
          </h1>

          <p className="mb-10 text-lg md:text-xl text-muted-foreground text-balance leading-relaxed">
            Start a fundraising group, share a code or QR, and watch contributions roll in. Private, secure, and built
            on Solana with ZK compression.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-base"
              onClick={() => setCreateModalOpen(true)}
            >
              Create Your Group
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base bg-transparent"
              onClick={() => setJoinModalOpen(true)}
            >
              Join with Code
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-accent" />
              <span>Share via QR</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <span>Invite unlimited members</span>
            </div>
          </div>
        </div>
      </section>

      <CreateGroupModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <JoinGroupModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />
    </>
  )
}
