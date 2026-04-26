"use client"

export function HeroSection() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-24 pb-20 md:pt-28 md:pb-24 px-6 lg:px-[max(24px,calc(50%-660px))] text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45,184,112,0.1) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-pale border border-brand-border-2 text-xs font-semibold text-brand-deep mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-fresh animate-pulse-dot" />
          Split bills with friends — no more chasing
        </div>

        <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] tracking-tight text-foreground mb-5 text-balance">
          Shared expenses,
          <br />
          <em className="not-italic text-brand-grad font-serif">settled simply.</em>
        </h1>

        <p className="mx-auto max-w-xl text-base md:text-lg text-brand-text-2 leading-relaxed mb-11 text-balance">
          Stop chasing friends for money. Split costs, track who owes whom, and settle up instantly — no IOUs, no awkward conversations.
        </p>

        <div className="flex items-center justify-center gap-3.5 flex-wrap">
          <a
            href="/groups"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] text-base font-bold text-white bg-brand-grad hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(13,107,58,0.28)] transition-all"
          >
            Start splitting
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href="/#modes"
            className="inline-flex items-center px-7 py-3.5 rounded-[10px] text-base font-bold text-foreground border-[1.5px] border-brand-border-2 bg-background hover:bg-brand-surface hover:-translate-y-0.5 transition-all"
          >
            Pool a fund
          </a>
        </div>
      </section>

      {/* Demo Card */}
      <section className="relative z-1 px-6 lg:px-[max(24px,calc(50%-660px))] pb-24">
        <div className="mx-auto max-w-[880px]">
          <div className="rounded-[22px] border border-brand-border-c bg-card shadow-[0_0_0_1px_#d5e8da,0_40px_80px_rgba(13,31,20,0.1),0_12px_24px_rgba(13,31,20,0.06)] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-[7px] px-[18px] py-3 bg-brand-surface border-b border-brand-border-c">
              <div className="w-[11px] h-[11px] rounded-full bg-[#ff5f57]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#febc2e]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#28c840]" />
            </div>

            <div className="grid md:grid-cols-[220px_1fr] min-h-[320px]">
              {/* Sidebar */}
              <div className="hidden md:block border-r border-brand-border-c py-[18px] bg-brand-surface">
                <div className="px-[14px] pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
                  Your groups
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 bg-brand-surface-2 cursor-pointer">
                    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] bg-brand-pale">
                      🏖️
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Lisbon Trip</div>
                      <div className="text-[10px] text-brand-text-3">4 friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 hover:bg-brand-surface-2 transition-colors cursor-pointer">
                    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] bg-brand-fund-blue-bg">
                      🎁
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Priya&apos;s Gift</div>
                      <div className="text-[10px] text-brand-text-3">6 friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 hover:bg-brand-surface-2 transition-colors cursor-pointer">
                    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] bg-brand-pale">
                      🏠
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Flatmates</div>
                      <div className="text-[10px] text-brand-text-3">3 friends</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-[14px] py-2.5 hover:bg-brand-surface-2 transition-colors cursor-pointer">
                    <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[15px] bg-brand-fund-blue-bg">
                      🧳
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground leading-tight">Berlin Conf</div>
                      <div className="text-[10px] text-brand-text-3">8 friends</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="p-[22px]">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-serif text-lg tracking-tight text-foreground">Lisbon Trip 🏖️</div>
                    <div className="text-[11px] text-brand-text-2 mt-0.5">4 friends · Split expenses</div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.04em] px-[7px] py-0.5 rounded-full bg-brand-pale text-brand-deep border border-brand-border-2">
                    Split
                  </span>
                </div>

                {/* Balance cards */}
                <div className="grid grid-cols-3 gap-2.5 my-4">
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
                  <div className="flex items-center justify-between py-2.5 border-b border-brand-border-c">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[30px] h-[30px] rounded-[7px] bg-brand-surface-2 flex items-center justify-center text-[13px]">
                        🍷
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">Wine dinner</div>
                        <div className="text-[10px] text-brand-text-2">Paid by Asha</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold text-foreground">$120.00</div>
                      <div className="text-[10px] text-red-500">you owe $30</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-brand-border-c">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[30px] h-[30px] rounded-[7px] bg-brand-surface-2 flex items-center justify-center text-[13px]">
                        🚕
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">Airport taxi</div>
                        <div className="text-[10px] text-brand-text-2">Paid by you</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold text-foreground">$48.00</div>
                      <div className="text-[10px] text-brand-mid">you get $36</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[30px] h-[30px] rounded-[7px] bg-brand-surface-2 flex items-center justify-center text-[13px]">
                        🏨
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-foreground">Hotel (2 nights)</div>
                        <div className="text-[10px] text-brand-text-2">Paid by Kiran</div>
                      </div>
                    </div>
                    <div className="text-right">
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
