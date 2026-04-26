export function CtaSection() {
  return (
    <section className="relative text-center py-28 px-6 lg:px-[max(24px,calc(50%-660px))] overflow-hidden">
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
      <div className="flex items-center justify-center gap-3.5 flex-wrap">
        <a
          href="/groups"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] text-base font-bold text-white bg-brand-grad hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(13,107,58,0.28)] transition-all"
        >
          Connect Wallet
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <a
          href="https://github.com"
          className="inline-flex items-center px-7 py-3.5 rounded-[10px] text-base font-bold text-foreground border-[1.5px] border-brand-border-2 bg-background hover:bg-brand-surface hover:-translate-y-0.5 transition-all"
        >
          Read the docs
        </a>
      </div>
    </section>
  )
}
