"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type MoneyCounterProps = {
  value: number
  prefix?: string
  sign?: boolean
  duration?: number
  className?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function MoneyCounter({
  value,
  prefix = "$",
  sign = false,
  duration = 900,
  className,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
}: MoneyCounterProps) {
  const [displayed, setDisplayed] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === displayed) return
    fromRef.current = displayed
    startRef.current = null
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const animate = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / duration)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayed(fromRef.current + (value - fromRef.current) * ease)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayed(value)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration, displayed])

  const abs = Math.abs(displayed).toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  })

  let formatted: string
  if (sign) {
    if (displayed > 0.005) formatted = `+${prefix}${abs}`
    else if (displayed < -0.005) formatted = `−${prefix}${abs}`
    else formatted = `${prefix}${abs}`
  } else {
    formatted = `${prefix}${abs}`
  }

  return <span className={cn("tabular-nums", className)}>{formatted}</span>
}
