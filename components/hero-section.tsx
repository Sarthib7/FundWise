"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BriefcaseBusiness,
  CarTaxiFront,
  Copy,
  Gift,
  Home,
  Hotel,
  Loader2,
  Palmtree,
  Receipt,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { AppEntryButton } from "@/components/app-entry-button"
import { FundWiseLogoMark } from "@/components/fundwise-logo"
import { cn } from "@/lib/utils"

type DemoExpense = {
  icon: typeof UtensilsCrossed
  name: string
  paidBy: string
  amount: string
  impact: string
  impactTone: "positive" | "negative" | "neutral"
}

type DemoGroup = {
  id: string
  name: string
  memberCount: string
  mode: "Split" | "Fund"
  icon: typeof Palmtree
  iconClassName: string
  title: string
  subtitle: string
  metrics: Array<{
    label: string
    value: string
    tone?: "positive" | "negative" | "neutral"
  }>
  expenses: DemoExpense[]
  settlement?: {
    from: string
    to: string
    amount: string
    fee: string
    tx: string
    receiptId: string
  }
}

const demoGroups: DemoGroup[] = [
  {
    id: "lisbon",
    name: "Lisbon Trip",
    memberCount: "4 friends",
    mode: "Split",
    icon: Palmtree,
    iconClassName: "bg-brand-pale text-brand-deep",
    title: "Lisbon Trip",
    subtitle: "4 friends · Split expenses",
    metrics: [
      { label: "You owe", value: "$40.00", tone: "negative" },
      { label: "Total expenses", value: "$640.00" },
      { label: "Settled", value: "2 of 5", tone: "positive" },
    ],
    expenses: [
      {
        icon: UtensilsCrossed,
        name: "Wine dinner",
        paidBy: "Paid by Asha",
        amount: "$120.00",
        impact: "you owe $30",
        impactTone: "negative",
      },
      {
        icon: CarTaxiFront,
        name: "Airport taxi",
        paidBy: "Paid by you",
        amount: "$48.00",
        impact: "you get $36",
        impactTone: "positive",
      },
      {
        icon: Hotel,
        name: "Hotel (2 nights)",
        paidBy: "Paid by Kiran",
        amount: "$320.00",
        impact: "you owe $80",
        impactTone: "negative",
      },
    ],
    settlement: {
      from: "You",
      to: "Asha",
      amount: "$40.00",
      fee: "Low",
      tx: "4Kt...mN7x",
      receiptId: "rcpt-lisbon-0042",
    },
  },
  {
    id: "gift",
    name: "Priya's Gift",
    memberCount: "6 friends",
    mode: "Split",
    icon: Gift,
    iconClassName: "bg-brand-pale text-brand-deep",
    title: "Priya's Gift",
    subtitle: "6 friends · Shared gift costs",
    metrics: [
      { label: "You owe", value: "$18.00", tone: "negative" },
      { label: "Total expenses", value: "$612.00" },
      { label: "Settled", value: "4 of 6", tone: "positive" },
    ],
    expenses: [
      {
        icon: Gift,
        name: "Camera deposit",
        paidBy: "Paid by Maya",
        amount: "$500.00",
        impact: "you owe $83.33",
        impactTone: "negative",
      },
      {
        icon: UtensilsCrossed,
        name: "Birthday dinner",
        paidBy: "Paid by Maya",
        amount: "$156.00",
        impact: "you owe $26",
        impactTone: "negative",
      },
      {
        icon: CarTaxiFront,
        name: "Pickup ride",
        paidBy: "Paid by you",
        amount: "$34.00",
        impact: "you get $28.33",
        impactTone: "positive",
      },
    ],
    settlement: {
      from: "You",
      to: "Maya",
      amount: "$18.00",
      fee: "Low",
      tx: "8Qp...fT2a",
      receiptId: "rcpt-gift-0018",
    },
  },
  {
    id: "flatmates",
    name: "Flatmates",
    memberCount: "3 friends",
    mode: "Split",
    icon: Home,
    iconClassName: "bg-brand-pale text-brand-deep",
    title: "Flatmates",
    subtitle: "3 friends · Monthly household ledger",
    metrics: [
      { label: "You owe", value: "$22.00", tone: "negative" },
      { label: "Total expenses", value: "$286.40" },
      { label: "Settled", value: "4 of 6", tone: "positive" },
    ],
    expenses: [
      {
        icon: Home,
        name: "Internet bill",
        paidBy: "Paid by you",
        amount: "$72.00",
        impact: "you get $48",
        impactTone: "positive",
      },
      {
        icon: UtensilsCrossed,
        name: "Groceries",
        paidBy: "Paid by Lina",
        amount: "$94.40",
        impact: "you owe $31.47",
        impactTone: "negative",
      },
      {
        icon: Home,
        name: "Utilities",
        paidBy: "Paid by Theo",
        amount: "$120.00",
        impact: "you owe $40",
        impactTone: "negative",
      },
    ],
    settlement: {
      from: "You",
      to: "Lina",
      amount: "$22.00",
      fee: "Low",
      tx: "3Lm...pV9s",
      receiptId: "rcpt-flat-0022",
    },
  },
  {
    id: "berlin",
    name: "Berlin Conf",
    memberCount: "8 friends",
    mode: "Split",
    icon: BriefcaseBusiness,
    iconClassName: "bg-brand-fund-blue-bg text-brand-fund-blue",
    title: "Berlin Conf",
    subtitle: "8 friends · Conference travel",
    metrics: [
      { label: "You owe", value: "$72.00", tone: "negative" },
      { label: "Total expenses", value: "$1,240.00" },
      { label: "Settled", value: "3 of 9", tone: "positive" },
    ],
    expenses: [
      {
        icon: Hotel,
        name: "Apartment",
        paidBy: "Paid by Jonas",
        amount: "$820.00",
        impact: "you owe $102.50",
        impactTone: "negative",
      },
      {
        icon: BriefcaseBusiness,
        name: "Booth supplies",
        paidBy: "Paid by you",
        amount: "$180.00",
        impact: "you get $157.50",
        impactTone: "positive",
      },
      {
        icon: CarTaxiFront,
        name: "Train tickets",
        paidBy: "Paid by Amara",
        amount: "$240.00",
        impact: "you owe $30",
        impactTone: "negative",
      },
    ],
    settlement: {
      from: "You",
      to: "Jonas",
      amount: "$72.00",
      fee: "Low",
      tx: "9Br...kH4q",
      receiptId: "rcpt-berlin-0072",
    },
  },
]

type FlowState = "overview" | "settle" | "signing" | "receipt"

function getToneClassName(tone: "positive" | "negative" | "neutral" = "neutral") {
  if (tone === "positive") {
    return "text-brand-mid"
  }

  if (tone === "negative") {
    return "text-red-500"
  }

  return "text-foreground"
}

export function HeroSection() {
  const [activeGroupId, setActiveGroupId] = useState(demoGroups[0].id)
  const [flowState, setFlowState] = useState<FlowState>("overview")
  const activeGroup = demoGroups.find((group) => group.id === activeGroupId) ?? demoGroups[0]
  const activeSettlement = activeGroup.settlement

  const handleSelectGroup = (groupId: string) => {
    setActiveGroupId(groupId)
    setFlowState("overview")
  }

  const handleSettle = () => {
    setFlowState("signing")
    window.setTimeout(() => {
      setFlowState("receipt")
    }, 1200)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-28 md:pb-24 md:pt-32 lg:px-[max(24px,calc(50%-660px))]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(230,247,238,0.82) 0%, rgba(255,255,255,0) 52%), radial-gradient(ellipse 86% 54% at 50% -8%, rgba(45,184,112,0.15) 0%, transparent 72%)",
          }}
          aria-hidden="true"
        />
        <FundWiseLogoMark
          size={520}
          className="pointer-events-none absolute left-1/2 top-6 h-[260px] w-[260px] -translate-x-1/2 opacity-[0.045] sm:top-1 sm:h-[380px] sm:w-[380px] md:h-[460px] md:w-[460px]"
          aria-hidden="true"
        />

        <div className="relative z-10 mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border-2 bg-brand-pale px-4 py-1.5 text-xs font-semibold text-brand-deep md:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-fresh animate-pulse-dot" />
          Shared expenses without the chase
        </div>

        <h1 className="relative z-10 font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] tracking-tight text-foreground mb-5 text-balance">
          Split expenses.
          <br />
          <em className="not-italic text-brand-grad font-serif">Earn together.</em>
        </h1>

        <p className="relative z-10 mx-auto mb-9 max-w-2xl text-balance text-base leading-relaxed text-brand-text-2 md:mb-11 md:text-lg">
          FundWise helps private Groups track shared spending, keep live Balances clear, and settle up without chasing across chat.
        </p>

        <div className="relative z-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <AppEntryButton
            disconnectedLabel="Start a Group"
            connectedLabel="Open your Groups"
            navigateAfterConnect
            className="w-full sm:min-h-11 sm:w-auto"
          />
          <Link
            href="/story"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border-[1.5px] border-brand-border-2 bg-background px-7 py-3.5 text-base font-bold text-foreground transition-[transform,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-11 sm:w-auto"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* Demo Card */}
      <section className="relative z-1 px-4 pb-24 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
        <div className="mx-auto max-w-[880px]">
          <div className="rounded-[22px] border border-brand-border-c bg-card shadow-[0_0_0_1px_#d5e8da,0_40px_80px_rgba(13,31,20,0.1),0_12px_24px_rgba(13,31,20,0.06)] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-[7px] px-[18px] py-3 bg-brand-surface border-b border-brand-border-c">
              <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
            </div>

            <div className="grid min-h-[320px] md:grid-cols-[220px_1fr]">
              {/* Sidebar */}
              <div className="hidden md:block border-r border-brand-border-c py-[18px] bg-brand-surface">
                <div className="px-[14px] pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
                  Your groups
                </div>
                <div className="flex flex-col">
                  {demoGroups.map((group) => {
                    const Icon = group.icon
                    const isActive = group.id === activeGroup.id

                    return (
                      <button
                        key={group.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleSelectGroup(group.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-[14px] py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                          isActive ? "bg-brand-surface-2" : "hover:bg-brand-surface-2"
                        )}
                      >
                        <div className={cn("flex h-[34px] w-[34px] items-center justify-center rounded-[9px]", group.iconClassName)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-foreground leading-tight">{group.name}</div>
                          <div className="text-[10px] text-brand-text-3">{group.memberCount}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Main content */}
              <div className="p-4 sm:p-[22px]">
                <div className="mb-4 flex flex-wrap gap-2 md:hidden">
                  {demoGroups.map((group) => {
                    const Icon = group.icon
                    const isActive = group.id === activeGroup.id

                    return (
                      <button
                        key={group.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleSelectGroup(group.id)}
                        className={cn(
                          "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "border-brand-border-2 bg-brand-pale text-brand-deep"
                            : "border-brand-border-c bg-brand-surface text-brand-text-2 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {group.name}
                      </button>
                    )
                  })}
                </div>

                <div className="mb-3 flex flex-col gap-3 sm:mb-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-serif text-lg tracking-tight text-foreground">{activeGroup.title}</div>
                    <div className="text-[11px] text-brand-text-2 mt-0.5">{activeGroup.subtitle}</div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.04em] px-[7px] py-0.5 rounded-full bg-brand-pale text-brand-deep border border-brand-border-2">
                    {activeGroup.mode}
                  </span>
                </div>

                {flowState === "overview" ? (
                  <>
                    <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {activeGroup.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                          <div className="text-[10px] text-brand-text-2 mb-1">{metric.label}</div>
                          <div className={cn("text-[17px] font-extrabold", getToneClassName(metric.tone))}>
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-3">
                      Recent expenses
                    </div>
                    <div className="flex flex-col">
                      {activeGroup.expenses.map((expense, index) => {
                        const Icon = expense.icon

                        return (
                          <div
                            key={expense.name}
                            className={cn(
                              "flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between",
                              index < activeGroup.expenses.length - 1 ? "border-b border-brand-border-c" : ""
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-brand-surface-2 text-brand-deep">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <div className="text-[13px] font-medium text-foreground">{expense.name}</div>
                                <div className="text-[10px] text-brand-text-2">{expense.paidBy}</div>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-[13px] font-bold text-foreground">{expense.amount}</div>
                              <div className={cn("text-[10px]", getToneClassName(expense.impactTone))}>{expense.impact}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {activeSettlement ? (
                      <div className="mt-4 flex flex-col gap-3 rounded-[12px] border border-brand-border-c bg-brand-surface p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-[13px] font-semibold text-foreground">
                            {activeSettlement.from} pays {activeSettlement.to}
                          </div>
                          <div className="text-[11px] text-brand-text-2">
                            Suggested from the live Group Balance.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFlowState("settle")}
                          className="inline-flex min-h-10 items-center justify-center rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
                        >
                          Settle {activeSettlement.amount}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {flowState === "settle" && activeSettlement ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-[12px] border border-brand-border-2 bg-brand-pale/50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.07em] text-brand-deep">
                        <Wallet className="h-3.5 w-3.5" />
                        Settle-up Preview
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-brand-text-2">You send</span>
                          <span className="font-bold">{activeSettlement.amount}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-brand-text-2">To</span>
                          <span className="font-bold text-brand-mid">{activeSettlement.to}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-brand-text-2">Fee estimate</span>
                          <span className="font-medium">{activeSettlement.fee}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSettle}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Confirm settle-up
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowState("overview")}
                      className="inline-flex min-h-9 w-full items-center justify-center rounded-[10px] border border-brand-border-c bg-background px-4 py-2 text-xs font-bold text-brand-text-2 transition-colors hover:bg-brand-surface hover:text-foreground"
                    >
                      Back to Balance
                    </button>
                    <p className="text-center text-[11px] text-brand-text-2">
                      In the real app, you review and confirm before anything moves.
                    </p>
                  </div>
                ) : null}

                {flowState === "signing" ? (
                  <div className="mt-4 rounded-[14px] border border-brand-border-c bg-background p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-pale text-brand-deep">
                      <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                    <div className="font-serif text-xl tracking-tight text-foreground">Confirming settle-up</div>
                    <p className="mt-2 text-sm text-brand-text-2">
                      FundWise is checking the final proof.
                    </p>
                  </div>
                ) : null}

                {flowState === "receipt" && activeSettlement ? (
                  <div className="mt-4 rounded-[14px] border border-brand-border-c bg-background p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-pale text-brand-deep">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">Settled. This is done.</div>
                        <div className="text-[11px] text-brand-text-2">{activeSettlement.receiptId}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-text-2">Amount</span>
                        <span className="font-bold">{activeSettlement.amount}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-text-2">From</span>
                        <span className="font-medium">{activeSettlement.from}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-brand-text-2">To</span>
                        <span className="font-medium">{activeSettlement.to}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-[10px] border border-brand-border-c bg-brand-surface p-2">
                        <span className="font-mono text-xs text-brand-text-2">{activeSettlement.tx}</span>
                        <Copy className="h-3.5 w-3.5 text-brand-text-3" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFlowState("overview")}
                      className="mt-4 inline-flex min-h-9 w-full items-center justify-center rounded-[10px] border border-brand-border-c bg-brand-surface px-4 py-2 text-xs font-bold text-brand-text-2 transition-colors hover:text-foreground"
                    >
                      Return to Group
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
