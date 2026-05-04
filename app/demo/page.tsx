"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GroupAvatar } from "@/components/avatar"
import {
  UtensilsCrossed,
  CarTaxiFront,
  Hotel,
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
  Loader2,
  CheckCircle2,
  Copy,
  Users,
  Receipt,
} from "lucide-react"
import Link from "next/link"

// ─── Mock Data ────────────────────────────────────────

const DEMO_MEMBERS = [
  { wallet: "alice_demo", displayName: "Asha" },
  { wallet: "bob_demo", displayName: "Ben" },
  { wallet: "carol_demo", displayName: "Carol" },
  { wallet: "dave_demo", displayName: "You" },
]

const DEMO_EXPENSES = [
  { id: "e1", description: "Wine dinner", amount: 12000, payer: "Asha", icon: UtensilsCrossed, yourShare: 3000, yourShareLabel: "$30.00" },
  { id: "e2", description: "Airport taxi", amount: 4800, payer: "You", icon: CarTaxiFront, yourShare: -3600, yourShareLabel: "+$36.00" },
  { id: "e3", description: "Hotel (2 nights)", amount: 32000, payer: "Carol", icon: Hotel, yourShare: 8000, yourShareLabel: "$80.00" },
]

const BALANCES = [
  { name: "Asha", amount: 4000 },
  { name: "Ben", amount: 0 },
  { name: "Carol", amount: 0 },
  { name: "You", amount: -4000 },
]

const SETTLEMENTS = [
  { from: "You", to: "Asha", amount: 4000 },
]

type Step = "group" | "expenses" | "balances" | "settle" | "receipt"

const STEPS: { key: Step; label: string }[] = [
  { key: "group", label: "Group" },
  { key: "expenses", label: "Expenses" },
  { key: "balances", label: "Balances" },
  { key: "settle", label: "Settle" },
  { key: "receipt", label: "Receipt" },
]

function formatCents(cents: number): string {
  return `$${(Math.abs(cents) / 100).toFixed(2)}`
}

// ─── Step Components ──────────────────────────────────

function GroupStep() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pale text-brand-deep">
          <Users className="h-7 w-7" />
        </div>
        <h2 className="font-serif text-2xl tracking-tight">Lisbon Trip</h2>
        <p className="text-sm text-muted-foreground">4 friends · Split Mode</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</p>
        {DEMO_MEMBERS.map((m) => (
          <div key={m.wallet} className="flex items-center gap-3 rounded-lg border p-3">
            <GroupAvatar name={m.displayName} size={32} />
            <span className="text-sm font-medium">{m.displayName}</span>
            {m.displayName === "You" && (
              <Badge variant="outline" className="ml-auto text-[10px]">You</Badge>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        <p>Members join via invite link or QR code</p>
        <p className="text-xs mt-1">No manual wallet entry needed</p>
      </div>
    </div>
  )
}

function ExpensesStep() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl tracking-tight">Recent Expenses</h2>
        <Badge variant="outline" className="text-[10px]">3 expenses</Badge>
      </div>

      <div className="space-y-0 divide-y">
        {DEMO_EXPENSES.map((exp) => {
          const Icon = exp.icon
          const isPositive = exp.yourShare < 0
          return (
            <div key={exp.id} className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-brand-deep">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{exp.description}</p>
                <p className="text-[11px] text-muted-foreground">Paid by {exp.payer} · {formatCents(exp.amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatCents(exp.amount)}</p>
                <p className={`text-[11px] font-medium ${isPositive ? "text-brand-mid" : "text-red-500"}`}>
                  {isPositive ? "you get" : "you owe"} {exp.yourShareLabel}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
        Any member can log expenses. 4 split methods: equal, exact, percentage, shares.
      </div>
    </div>
  )
}

function BalancesStep() {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl tracking-tight">Who Owes Whom</h2>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3">
          <p className="text-[10px] text-muted-foreground mb-1">You owe</p>
          <p className="text-lg font-extrabold text-red-500">$40.00</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Total expenses</p>
          <p className="text-lg font-extrabold">$488.00</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-[10px] text-muted-foreground mb-1">Settled</p>
          <p className="text-lg font-extrabold text-brand-mid">0 of 3</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Balances</p>
        {BALANCES.map((b) => (
          <div key={b.name} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <GroupAvatar name={b.name} size={28} />
              <span className="text-sm font-medium">{b.name}</span>
            </div>
            <span className={`text-sm font-bold ${b.amount > 0 ? "text-brand-mid" : b.amount < 0 ? "text-red-500" : ""}`}>
              {b.amount > 0 ? "+" : ""}{formatCents(b.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Simplified Settlements</p>
        {SETTLEMENTS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
            <span className="font-medium">{s.from}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{s.to}</span>
            <span className="ml-auto font-bold">{formatCents(s.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettleStep({ onSettle }: { onSettle: () => void }) {
  const [state, setState] = useState<"idle" | "confirming" | "signing" | "done">("idle")

  const handleSettle = () => {
    setState("confirming")
    setTimeout(() => setState("signing"), 1200)
    setTimeout(() => {
      setState("done")
      onSettle()
    }, 2500)
  }

  if (state === "done") {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-mid/10 text-brand-mid">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="font-serif text-2xl tracking-tight">Settlement Confirmed!</h2>
        <p className="text-sm text-muted-foreground">$40.00 USDC sent from You → Asha</p>
      </div>
    )
  }

  if (state === "signing") {
    return (
      <div className="space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-pale text-brand-deep">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="font-serif text-2xl tracking-tight">Confirming on Solana…</h2>
        <p className="text-sm text-muted-foreground">Waiting for block finalization. Usually 2-5 seconds.</p>
        <div className="mx-auto max-w-xs rounded-lg border p-4 text-left text-xs space-y-1">
          <p className="text-muted-foreground">Status: <span className="text-brand-mid font-bold">Pending</span></p>
          <p className="text-muted-foreground">Tx: <span className="font-mono">4Kt…mN7x</span></p>
          <p className="text-muted-foreground">Network: <span>Solana devnet</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl tracking-tight">Settle Up</h2>

      {/* Preview card */}
      <Card className="border-brand-mid/30 bg-brand-mid/5 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-mid">Settlement Preview</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">You send</span>
            <span className="font-bold">$40.00 USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asha receives</span>
            <span className="font-bold text-brand-mid">$40.00 USDC</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium">Asha</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network fee</span>
            <span className="font-medium">~0.000005 SOL ≈ $0.001</span>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What happens next</p>
        <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1">
          <p>1. You confirm the settlement in your wallet</p>
          <p>2. USDC transfers on Solana (instant finality)</p>
          <p>3. Balances update and receipts are generated</p>
        </div>
      </div>

      {state === "confirming" ? (
        <Button className="w-full min-h-11" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing transaction…
        </Button>
      ) : (
        <Button className="w-full min-h-11 bg-brand-mid hover:bg-brand-mid/90 text-white" onClick={handleSettle}>
          <Wallet className="mr-2 h-4 w-4" />
          Settle $40.00 USDC
        </Button>
      )}
    </div>
  )
}

function ReceiptStep() {
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl tracking-tight">Receipt</h2>
        <Badge className="bg-brand-mid/10 text-brand-mid border-brand-mid/20">Confirmed</Badge>
      </div>

      <Card className="p-4 space-y-3">
        <div className="text-center pb-3 border-b">
          <p className="text-2xl font-extrabold text-brand-mid">$40.00 USDC</p>
          <p className="text-xs text-muted-foreground mt-1">Settled on Solana</p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From</span>
            <span className="font-medium">You</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium">Asha</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Signature</span>
            <span className="font-mono text-xs">4Kt9…mN7x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Block</span>
            <span className="font-mono text-xs">#312,489,021</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee</span>
            <span className="font-medium">0.000005 SOL</span>
          </div>
        </div>
      </Card>

      <Button
        variant="outline"
        className="w-full min-h-11"
        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      >
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? "Copied!" : "Share receipt link"}
      </Button>
    </div>
  )
}

// ─── Main Demo Page ───────────────────────────────────

export default function DemoPage() {
  const [step, setStep] = useState<Step>("group")
  const [settled, setSettled] = useState(false)
  const stepIndex = STEPS.findIndex((s) => s.key === step)

  const next = () => {
    const nextIdx = Math.min(stepIndex + 1, STEPS.length - 1)
    setStep(STEPS[nextIdx].key)
  }
  const prev = () => {
    const prevIdx = Math.max(stepIndex - 1, 0)
    setStep(STEPS[prevIdx].key)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-serif font-bold">FundWise</span>
        <Badge variant="outline" className="text-[10px] ml-auto">Demo Mode</Badge>
      </div>

      {/* Step indicator */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center gap-1 max-w-lg mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center flex-1">
              <button
                onClick={() => setStep(s.key)}
                className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors shrink-0
                  ${i === stepIndex ? "bg-brand-mid text-white" : i < stepIndex ? "bg-brand-mid/20 text-brand-mid" : "bg-muted text-muted-foreground"}`}
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded ${i < stepIndex ? "bg-brand-mid/40" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-1">
          {STEPS[stepIndex].label} · Step {stepIndex + 1} of {STEPS.length}
        </p>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {step === "group" && <GroupStep />}
        {step === "expenses" && <ExpensesStep />}
        {step === "balances" && <BalancesStep />}
        {step === "settle" && <SettleStep onSettle={() => setSettled(true)} />}
        {step === "receipt" && <ReceiptStep />}
      </main>

      {/* Navigation */}
      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {stepIndex > 0 && (
            <Button variant="outline" className="min-h-11 flex-1" onClick={prev}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
          {stepIndex < STEPS.length - 1 && (
            <Button className="min-h-11 flex-1 bg-brand-mid hover:bg-brand-mid/90 text-white" onClick={next}>
              {step === "balances" ? "Settle $40.00" : step === "settle" && settled ? "View Receipt" : "Next"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {stepIndex === STEPS.length - 1 && (
            <Link href="/groups" className="flex-1">
              <Button className="w-full min-h-11 bg-brand-mid hover:bg-brand-mid/90 text-white">
                <Wallet className="mr-2 h-4 w-4" />
                Start Splitting for Real
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
