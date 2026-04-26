const techItems = [
  { label: "Solana", color: "#9945FF" },
  { label: "USDC · USDT · PYUSD", color: "#2775CA" },
  { label: "Squads Protocol", color: "#2db870" },
  { label: "LI.FI SDK", color: "#E84142" },
  { label: "Next.js 15", color: "#000000" },
]

export function TechStrip() {
  return (
    <div className="border-t border-b border-brand-border-c bg-brand-surface py-6 px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex items-center gap-10 flex-wrap">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-text-3 whitespace-nowrap">
          Built on
        </div>
        <div className="flex items-center gap-7 flex-wrap">
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
