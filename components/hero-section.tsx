"use client"

import Link from "next/link"
import {
  BriefcaseBusiness,
  CarTaxiFront,
  Gift,
  Home,
  Hotel,
  Palmtree,
  UtensilsCrossed,
} from "lucide-react"
import { AppEntryButton } from "@/components/app-entry-button"

export function HeroSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-24 md:pb-24 md:pt-28 lg:px-[max(24px,calc(50%-660px))]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45,184,112,0.1) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-border-2 bg-brand-pale px-4 py-1.5 text-xs font-semibold text-brand-deep md:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-fresh animate-pulse-dot" />
          Split bills with friends — no more chasing
        </div>

        <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] tracking-tight text-foreground mb-5 text-balance">
          Shared expenses,
          <br />
          <em className="not-italic text-brand-grad font-serif">settled simply.</em>
        </h1>

        <p className="mx-auto mb-9 max-w-2xl text-balance text-base leading-relaxed text-brand-text-2 md:mb-11 md:text-lg">
          Track shared costs, see who owes what, and settle up in seconds.
        </p>

        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <AppEntryButton
            disconnectedLabel="Start splitting"
            connectedLabel="Open your Groups"
            navigateAfterConnect
            className="w-full sm:min-h-11 sm:w-auto"
          />
          <Link
            href="/#how"
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
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 bg-brand-surface-2 cursor-pointer">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-pale text-brand-deep">
                      <Palmtree className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Lisbon Trip</div>
                      <div className="text-[10px] text-brand-text-3">4 friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 hover:bg-brand-surface-2 transition-colors cursor-pointer">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-fund-blue-bg text-brand-fund-blue">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Priya&apos;s Gift</div>
                      <div className="text-[10px] text-brand-text-3">6 friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 hover:bg-brand-surface-2 transition-colors cursor-pointer">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-pale text-brand-deep">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Flatmates</div>
                      <div className="text-[10px] text-brand-text-3">3 friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 hover:bg-brand-surface-2 transition-colors cursor-pointer">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-brand-fund-blue-bg text-brand-fund-blue">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Berlin Conf</div>
                      <div className="text-[10px] text-brand-text-3">8 friends</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="p-4 sm:p-[22px]">
                <div className="mb-4 flex flex-wrap gap-2 md:hidden">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-c bg-brand-surface px-3 py-1 text-[11px] font-medium text-brand-text-2">
                    <Palmtree className="h-3.5 w-3.5" />
                    Lisbon Trip
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-c bg-brand-surface px-3 py-1 text-[11px] font-medium text-brand-text-2">
                    <Gift className="h-3.5 w-3.5" />
                    Priya&apos;s Gift
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border-c bg-brand-surface px-3 py-1 text-[11px] font-medium text-brand-text-2">
                    <Home className="h-3.5 w-3.5" />
                    Flatmates
                  </span>
                </div>

                <div className="mb-3 flex flex-col gap-3 sm:mb-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-serif text-lg tracking-tight text-foreground">Lisbon Trip</div>
                    <div className="text-[11px] text-brand-text-2 mt-0.5">4 friends · Split expenses</div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.04em] px-[7px] py-0.5 rounded-full bg-brand-pale text-brand-deep border border-brand-border-2">
                    Split
                  </span>
                </div>

                {/* Balance cards */}
                <div className="my-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                    <div className="text-[10px] text-brand-text-2 mb-1">You are owed</div>
                    <div className="text-[17px] font-extrabold text-brand-mid">+$84.50</div>
                  </div>
                  <div className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                    <div className="text-[10px] text-brand-text-2 mb-1">Total expenses</div>
                    <div className="text-[17px] font-extrabold text-foreground">$640.00</div>
                  </div>
                  <div className="rounded-[10px] border border-brand-border-c bg-brand-surface p-3">
                    <div className="text-[10px] text-brand-text-2 mb-1">Settled</div>
                    <div className="text-[17px] font-extrabold text-brand-mid">2 of 5</div>
                  </div>
                </div>

                {/* Expense list */}
                <div className="text-[10px] font-bold uppercase tracking-[0.07em] text-brand-text-3 mb-2">
                  Recent expenses
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-col gap-2 py-2.5 border-b border-brand-border-c sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-brand-surface-2 text-brand-deep">
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">Wine dinner</div>
                        <div className="text-[10px] text-brand-text-2">Paid by Asha</div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[13px] font-bold text-foreground">$120.00</div>
                      <div className="text-[10px] text-red-500">you owe $30</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 py-2.5 border-b border-brand-border-c sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-brand-surface-2 text-brand-deep">
                        <CarTaxiFront className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">Airport taxi</div>
                        <div className="text-[10px] text-brand-text-2">Paid by you</div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[13px] font-bold text-foreground">$48.00</div>
                      <div className="text-[10px] text-brand-mid">you get $36</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] bg-brand-surface-2 text-brand-deep">
                        <Hotel className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">Hotel (2 nights)</div>
                        <div className="text-[10px] text-brand-text-2">Paid by Kiran</div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[13px] font-bold text-foreground">$320.00</div>
                      <div className="text-[10px] text-red-500">you owe $80</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
