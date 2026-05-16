"use client"

import { cn } from "@/lib/utils"

type VoteBarProps = {
  yes: number
  no: number
  total: number
  threshold: number
  yesColor?: string
  noColor?: string
  height?: number
  className?: string
}

export function VoteBar({
  yes,
  no,
  total,
  threshold,
  yesColor = "var(--brand-blue-mid)",
  noColor = "var(--brand-red)",
  height = 6,
  className,
}: VoteBarProps) {
  if (total <= 0) return null

  const yesPct = Math.max(0, Math.min(100, (yes / total) * 100))
  const noPct = Math.max(0, Math.min(100, (no / total) * 100))
  const thresholdPct = Math.max(0, Math.min(100, (threshold / total) * 100))

  return (
    <div
      className={cn("relative w-full bg-brand-surface-2", className)}
      style={{
        height,
        borderRadius: height / 2,
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={yes}
      aria-label={`${yes} of ${total} approve, threshold ${threshold}`}
    >
      <div
        className="absolute left-0 top-0 h-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1.4,0.36,1)]"
        style={{
          width: `${yesPct}%`,
          background: yesColor,
          borderRadius: height / 2,
        }}
      />
      <div
        className="absolute top-0 h-full opacity-70 transition-[width,left] duration-500 ease-[cubic-bezier(0.22,1.4,0.36,1)]"
        style={{
          left: `${yesPct}%`,
          width: `${noPct}%`,
          background: noColor,
          borderRadius: height / 2,
        }}
      />
      <div
        className="absolute bg-brand-ink"
        style={{
          left: `${thresholdPct}%`,
          top: -3,
          height: height + 6,
          width: 2,
          borderRadius: 1,
          transform: "translateX(-1px)",
        }}
        aria-hidden
      />
    </div>
  )
}
