"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import type { ActivityItem } from "@/lib/db"
import { cn } from "@/lib/utils"

type SpendingByCategoryCardProps = {
  activity: ActivityItem[]
}

const CATEGORY_LABEL: Record<string, string> = {
  food: "Food",
  transport: "Transport",
  shopping: "Shopping",
  accommodation: "Stay",
  entertainment: "Fun",
  general: "Other",
}

const CATEGORY_TINT: Record<string, string> = {
  food: "bg-brand-green-fresh",
  transport: "bg-brand-green-light",
  shopping: "bg-brand-green-mint",
  accommodation: "bg-brand-green-mid",
  entertainment: "bg-brand-amber",
  general: "bg-brand-green-light",
}

export function SpendingByCategoryCard({ activity }: SpendingByCategoryCardProps) {
  const categories = useMemo(() => {
    const totals = new Map<string, number>()
    let grand = 0
    for (const item of activity) {
      if (item.type !== "expense") continue
      const cat = item.data.category || "general"
      const amount = item.data.amount
      totals.set(cat, (totals.get(cat) || 0) + amount)
      grand += amount
    }
    if (grand <= 0) return null
    return Array.from(totals.entries())
      .map(([key, amount]) => ({
        key,
        label: CATEGORY_LABEL[key] || key.slice(0, 1).toUpperCase() + key.slice(1),
        tint: CATEGORY_TINT[key] || "bg-brand-green-mid",
        pct: Math.round((amount / grand) * 100),
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [activity])

  if (!categories) return null

  return (
    <Card className="border-brand-border-c bg-background p-5">
      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-text-3">
        Spending by category
      </p>
      <div className="flex flex-col gap-3">
        {categories.map((c) => (
          <div key={c.key}>
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="font-medium text-foreground">{c.label}</span>
              <span className="font-mono text-[11px] tabular-nums text-brand-text-2">
                {c.pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-brand-surface-2">
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", c.tint)}
                style={{ width: `${c.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
