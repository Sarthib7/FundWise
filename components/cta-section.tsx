import { AppEntryButton } from "@/components/app-entry-button"

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
      <p className="mb-9 text-[17px] text-brand-text-2 sm:mb-11">
        Create your first group in under a minute.
      </p>
      <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <AppEntryButton
          disconnectedLabel="Connect Wallet"
          connectedLabel="Open your Groups"
          navigateAfterConnect
          className="w-full sm:min-h-11 sm:w-auto"
        />
        <a
          href="/#how"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border-[1.5px] border-brand-border-2 bg-background px-7 py-3.5 text-base font-bold text-foreground transition-[transform,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-11 sm:w-auto"
        >
          See how it works
        </a>
      </div>
    </section>
  )
}
