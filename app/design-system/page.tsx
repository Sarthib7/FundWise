"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WalletAvatar } from "@/components/avatar"
import { AvatarStack } from "@/components/brand/avatar-stack"
import { ModeBadge } from "@/components/brand/mode-badge"
import { MoneyCounter } from "@/components/brand/money-counter"
import { Sparkline } from "@/components/brand/sparkline"
import { VoteBar } from "@/components/brand/vote-bar"

const SAMPLE_TREND = [
  { v: 24 },
  { v: 88 },
  { v: 12 },
  { v: 156 },
  { v: 72 },
  { v: 240 },
  { v: 48 },
]

const SAMPLE_WALLETS = [
  "wallet-asha-7xKp9LkJ8mN4qR2sT5vW8xY1zA3bC6dE9f",
  "wallet-kiran-Ba9cD2eF5gH8iJ1kL4mN7oP0qR3sT6uV",
  "wallet-dev-Cb8dE3fG6hI9jK2lM5nO8pQ1rS4tU7vW",
  "wallet-mia-Dd7eF4gH7iJ0kL3mN6oP9qR2sT5uV8wX",
  "wallet-raj-Ee6fG5hI8jK1lM4nO7pQ0rS3tU6vW9xY",
  "wallet-sam-Ff5gH6iJ9kL2mN5oP8qR1sT4uV7wX0yZ",
]

const TOKEN_GROUPS: Array<{
  title: string
  swatches: Array<{ name: string; cssVar: string; className?: string }>
}> = [
  {
    title: "Split — greens",
    swatches: [
      { name: "green-deep", cssVar: "--brand-green-deep" },
      { name: "green-forest", cssVar: "--brand-green-forest" },
      { name: "green-mid", cssVar: "--brand-green-mid" },
      { name: "green-fresh", cssVar: "--brand-green-fresh" },
      { name: "green-mint", cssVar: "--brand-green-mint" },
      { name: "green-light", cssVar: "--brand-green-light" },
      { name: "green-pale", cssVar: "--brand-green-pale" },
    ],
  },
  {
    title: "Fund — navy blues",
    swatches: [
      { name: "blue-deep", cssVar: "--brand-blue-deep" },
      { name: "blue-mid", cssVar: "--brand-blue-mid" },
      { name: "blue-fresh", cssVar: "--brand-blue-fresh" },
      { name: "blue-pale", cssVar: "--brand-blue-pale" },
      { name: "blue-border", cssVar: "--brand-blue-border" },
    ],
  },
  {
    title: "Neutrals + ink",
    swatches: [
      { name: "bg", cssVar: "--brand-bg" },
      { name: "surface", cssVar: "--brand-surface" },
      { name: "surface-2", cssVar: "--brand-surface-2" },
      { name: "border", cssVar: "--brand-border" },
      { name: "border-2", cssVar: "--brand-border-2" },
      { name: "ink", cssVar: "--brand-ink" },
      { name: "ink-2", cssVar: "--brand-ink-2" },
      { name: "ink-3", cssVar: "--brand-ink-3" },
    ],
  },
  {
    title: "Semantics + premium gold",
    swatches: [
      { name: "red", cssVar: "--brand-red" },
      { name: "red-pale", cssVar: "--brand-red-pale" },
      { name: "amber", cssVar: "--brand-amber" },
      { name: "amber-pale", cssVar: "--brand-amber-pale" },
      { name: "gold", cssVar: "--brand-gold" },
      { name: "gold-pale", cssVar: "--brand-gold-pale" },
    ],
  },
]

function SwatchTile({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-16 w-full rounded-lg border border-brand-border-c"
        style={{ background: `var(${cssVar})` }}
      />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-foreground">{name}</span>
        <span className="font-mono text-[10px] text-brand-text-3">{cssVar}</span>
      </div>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl tracking-tight text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-brand-text-2">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function GradientStrip({
  label,
  className,
  textVariant,
}: {
  label: string
  className: string
  textVariant?: string
}) {
  return (
    <div className="space-y-2">
      <div className={`h-16 w-full rounded-xl ${className}`} />
      {textVariant ? (
        <div className="font-serif text-3xl">
          <span className={textVariant}>{label}</span>
        </div>
      ) : null}
    </div>
  )
}

export default function DesignSystemPage() {
  const [counterValue, setCounterValue] = useState(39.5)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-10">
          <h1 className="font-serif text-4xl tracking-tight text-foreground">
            <span className="text-brand-grad">FundWise</span> Design System
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-text-2">
            Brand tokens + primitives ported from{" "}
            <code className="rounded bg-brand-surface px-1.5 py-0.5 font-mono text-xs">
              design/app/primitives.jsx
            </code>
            . Toggle dark mode in the header to verify token theming. This page lives at{" "}
            <code className="rounded bg-brand-surface px-1.5 py-0.5 font-mono text-xs">
              /design-system
            </code>{" "}
            and is for internal verification only.
          </p>
        </div>

        <div className="space-y-12">
          <Section
            title="Tokens"
            subtitle="Each swatch resolves to its theme value. Toggle theme to see light → dark transitions."
          >
            <div className="space-y-8">
              {TOKEN_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-brand-text-3">
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
                    {group.swatches.map((s) => (
                      <SwatchTile key={s.name} {...s} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Gradients" subtitle="Use as background or text via utility classes.">
            <div className="grid gap-4 md:grid-cols-3">
              <GradientStrip
                label="bg-brand-grad"
                className="bg-brand-grad"
                textVariant="text-brand-grad"
              />
              <GradientStrip
                label="bg-brand-fund-grad"
                className="bg-brand-fund-grad"
                textVariant="text-brand-fund-grad"
              />
              <GradientStrip label="bg-brand-fund-grad-soft" className="bg-brand-fund-grad-soft" />
            </div>
          </Section>

          <Section
            title="ModeBadge"
            subtitle="Split (green) vs Fund (blue). The single visual anchor that follows you everywhere — never both on the same surface."
          >
            <Card className="flex flex-wrap items-center gap-4 p-6">
              <ModeBadge mode="split" size="sm" />
              <ModeBadge mode="split" size="md" />
              <ModeBadge mode="fund" size="sm" />
              <ModeBadge mode="fund" size="md" />
            </Card>
          </Section>

          <Section
            title="MoneyCounter"
            subtitle="Animated easing counter. Click the button to trigger a transition."
          >
            <Card className="flex flex-wrap items-center justify-between gap-6 p-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  Net balance
                </div>
                <div className="font-serif text-5xl tracking-tight text-foreground">
                  <MoneyCounter value={counterValue} sign />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  Treasury
                </div>
                <div className="font-serif text-4xl tracking-tight text-brand-blue-mid">
                  <MoneyCounter value={1200} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  You owe
                </div>
                <div className="font-serif text-4xl tracking-tight text-brand-red">
                  <MoneyCounter value={-45} sign />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCounterValue((v) => v + Math.random() * 200 - 100)}
                >
                  Randomize net
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCounterValue(39.5)}
                >
                  Reset
                </Button>
              </div>
            </Card>
          </Section>

          <Section title="Sparkline" subtitle="Stroke + gradient fill in any token color.">
            <Card className="flex flex-wrap items-center gap-8 p-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  Split (green-mid)
                </div>
                <Sparkline data={SAMPLE_TREND} />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  Fund (blue-mid)
                </div>
                <Sparkline data={SAMPLE_TREND} color="var(--brand-blue-mid)" />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  Gold (premium)
                </div>
                <Sparkline data={SAMPLE_TREND} color="var(--brand-gold)" width={160} height={48} />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  No fill, no dot
                </div>
                <Sparkline data={SAMPLE_TREND} fill={false} showDot={false} />
              </div>
            </Card>
          </Section>

          <Section
            title="VoteBar"
            subtitle="Yes/no with a threshold tick. Default colors: Fund blue (yes) and red (no)."
          >
            <Card className="space-y-5 p-6">
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">Bouquet delivery</span>
                  <span className="font-mono text-xs text-brand-text-3">5/6 yes · threshold 4</span>
                </div>
                <VoteBar yes={5} no={0} total={6} threshold={4} />
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">Amazon gift card</span>
                  <span className="font-mono text-xs text-brand-text-3">
                    3/6 yes, 1/6 no · threshold 4
                  </span>
                </div>
                <VoteBar yes={3} no={1} total={6} threshold={4} />
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">Airbnb deposit</span>
                  <span className="font-mono text-xs text-brand-text-3">
                    4/8 yes, 1/8 no · threshold 5
                  </span>
                </div>
                <VoteBar yes={4} no={1} total={8} threshold={5} />
              </div>
              <div>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">Conference tickets</span>
                  <span className="font-mono text-xs text-brand-text-3">
                    8/8 yes · executed
                  </span>
                </div>
                <VoteBar yes={8} no={0} total={8} threshold={5} />
              </div>
            </Card>
          </Section>

          <Section
            title="AvatarStack"
            subtitle="Overlapping circles with a +N overflow chip. Pluggable — accepts any avatar component as children."
          >
            <Card className="flex flex-wrap items-center gap-10 p-6">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  3 members
                </div>
                <AvatarStack size={28} max={4}>
                  {SAMPLE_WALLETS.slice(0, 3).map((w) => (
                    <WalletAvatar key={w} address={w} size={28} />
                  ))}
                </AvatarStack>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  6 members · max 4
                </div>
                <AvatarStack size={32} max={4}>
                  {SAMPLE_WALLETS.map((w) => (
                    <WalletAvatar key={w} address={w} size={32} />
                  ))}
                </AvatarStack>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-text-3">
                  Bigger, max 3
                </div>
                <AvatarStack size={44} max={3}>
                  {SAMPLE_WALLETS.map((w) => (
                    <WalletAvatar key={w} address={w} size={44} />
                  ))}
                </AvatarStack>
              </div>
            </Card>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
