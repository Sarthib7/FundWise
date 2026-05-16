"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

type SparklinePoint = { v: number; label?: string }

type SparklineProps = {
  data: SparklinePoint[]
  color?: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  strokeWidth?: number
  showDot?: boolean
}

export function Sparkline({
  data,
  color = "var(--brand-green-mid)",
  width = 120,
  height = 32,
  fill = true,
  className,
  strokeWidth = 1.75,
  showDot = true,
}: SparklineProps) {
  const id = useId().replace(/:/g, "_")

  if (data.length === 0) return null

  const max = Math.max(...data.map((d) => d.v))
  const min = Math.min(...data.map((d) => d.v))
  const range = max - min || 1
  const points = data.map((d, i): [number, number] => {
    const x = (i / Math.max(1, data.length - 1)) * width
    const y = height - 4 - ((d.v - min) / range) * (height - 8)
    return [x, y]
  })

  const path = "M " + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")
  const fillPath = `${path} L ${width} ${height} L 0 ${height} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label="Trend sparkline"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={`sparkline-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill={`url(#sparkline-${id})`} />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && <circle cx={lastX} cy={lastY} r={3} fill={color} />}
    </svg>
  )
}
