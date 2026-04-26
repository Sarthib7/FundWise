export function CtaSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center sm:px-6 sm:py-28 lg:px-[max(24px,calc(50%-660px))]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 70% at 50% 100%, rgba(45,184,112,0.08) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <h2 className="font-serif text-[clamp(1.875rem,5vw,3.375rem)] tracking-tight mb-4 text-foreground text-balance">
        Ready to ditch the IOUs?
      </h2>
      <p className="text-[17px] text-brand-text-2 mb-11">
        Create your first group in under a minute.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3.5">
        <a
          href="/groups"
          className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand-grad px-7 py-3.5 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_36px_rgba(13,107,58,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
        >
          Connect Wallet
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <a
          href="https://github.com"
          className="inline-flex w-full items-center justify-center rounded-[10px] border-[1.5px] border-brand-border-2 bg-background px-7 py-3.5 text-base font-bold text-foreground transition-all hover:-translate-y-0.5 hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
        >
          Read the docs
        </a>
      </div>
    </section>
  )
}
