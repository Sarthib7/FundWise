import { Children, type ReactElement, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type AvatarStackProps = {
  children: ReactNode
  max?: number
  size?: number
  ringColorClassName?: string
  restClassName?: string
  className?: string
}

export function AvatarStack({
  children,
  max = 4,
  size = 24,
  ringColorClassName = "ring-background",
  restClassName,
  className,
}: AvatarStackProps) {
  const all = Children.toArray(children) as ReactElement[]
  const shown = all.slice(0, max)
  const rest = all.length - max
  const overlap = Math.round(size * 0.35)

  return (
    <div className={cn("inline-flex items-center", className)}>
      {shown.map((child, i) => (
        <div
          key={i}
          className={cn("rounded-full ring-2", ringColorClassName)}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
          }}
        >
          {child}
        </div>
      ))}
      {rest > 0 && (
        <div
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-brand-surface-2 font-bold text-brand-ink-2 ring-2",
            ringColorClassName,
            restClassName,
          )}
          style={{
            marginLeft: -overlap,
            width: size,
            height: size,
            fontSize: Math.round(size * 0.38),
            letterSpacing: "-0.02em",
          }}
          aria-label={`${rest} more`}
        >
          +{rest}
        </div>
      )}
    </div>
  )
}
