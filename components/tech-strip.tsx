const techItems = [
  { label: "Circle", color: "#2775CA" },
  { label: "Solana", color: "#9945FF" },
  { label: "LI.FI", color: "#E84142" },
  { label: "Zerion", color: "#2a4fa8" },
  { label: "Squads", color: "#2db870" },
]

export function TechStrip() {
  return (
    <div className="border-t border-b border-brand-border-c bg-brand-surface px-4 py-6 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-10">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-text-3 whitespace-nowrap">
          Powered by
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-7">
          {techItems.map((item) => (
            <div key={item.label} className="flex items-center gap-[7px] text-[13px] font-medium text-brand-text-2">
              <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
