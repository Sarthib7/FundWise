import { cn } from "@/lib/utils"

type ModeBadgeProps = {
  mode: "split" | "fund"
  size?: "sm" | "md"
  className?: string
}

export function ModeBadge({ mode, size = "sm", className }: ModeBadgeProps) {
  const isSplit = mode === "split"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-[0.04em]",
        size === "sm" ? "px-2 py-[3px] text-[10px]" : "px-2.5 py-1 text-[11px]",
        isSplit
          ? "border-brand-border-2 bg-brand-green-pale text-brand-green-forest"
          : "border-brand-blue-border bg-brand-blue-pale text-brand-blue-mid",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-[5px] w-[5px] rounded-full",
          isSplit ? "bg-brand-green-fresh" : "bg-brand-blue-fresh",
        )}
        aria-hidden
      />
      {isSplit ? "Split" : "Fund"}
    </span>
  )
}
