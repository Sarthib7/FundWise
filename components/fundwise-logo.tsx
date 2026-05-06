import * as React from "react"

import { cn } from "@/lib/utils"

type FundWiseLogoVariant = "gradient" | "white" | "mono"

type FundWiseLogoMarkProps = React.SVGAttributes<SVGSVGElement> & {
  size?: number
  variant?: FundWiseLogoVariant
  title?: string
}

function useSvgId(prefix: string) {
  return React.useId().replace(/:/g, `${prefix}-`)
}

export function FundWiseLogoMark({
  size = 32,
  variant = "gradient",
  title,
  className,
  ...props
}: FundWiseLogoMarkProps) {
  const deepGradientId = useSvgId("fw-deep")
  const middleGradientId = useSvgId("fw-middle")
  const lightGradientId = useSvgId("fw-light")
  const isDecorative = !title

  const slabs =
    variant === "white" ? (
      <>
        <rect x="14" y="22" width="68" height="14" rx="7" fill="#fff" transform="rotate(-2 48 29)" />
        <rect x="11" y="41" width="74" height="14" rx="7" fill="#fff" opacity="0.78" />
        <rect x="17" y="60" width="62" height="14" rx="7" fill="#fff" opacity="0.55" transform="rotate(2 48 67)" />
      </>
    ) : variant === "mono" ? (
      <>
        <rect x="14" y="22" width="68" height="14" rx="7" fill="#0D1F14" transform="rotate(-2 48 29)" />
        <rect x="11" y="41" width="74" height="14" rx="7" fill="#0D1F14" opacity="0.72" />
        <rect x="17" y="60" width="62" height="14" rx="7" fill="#0D1F14" opacity="0.45" transform="rotate(2 48 67)" />
      </>
    ) : (
      <>
        <rect x="14" y="22" width="68" height="14" rx="7" fill={`url(#${deepGradientId})`} transform="rotate(-2 48 29)" />
        <rect x="11" y="41" width="74" height="14" rx="7" fill={`url(#${middleGradientId})`} />
        <rect x="17" y="60" width="62" height="14" rx="7" fill={`url(#${lightGradientId})`} transform="rotate(2 48 67)" />
      </>
    )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      role={isDecorative ? undefined : "img"}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={title}
      className={cn("shrink-0", className)}
      {...props}
    >
      {variant === "gradient" ? (
        <defs>
          <linearGradient id={deepGradientId} x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0A4D2C" />
            <stop offset="1" stopColor="#0D6B3A" />
          </linearGradient>
          <linearGradient id={middleGradientId} x1="8" y1="32" x2="88" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0D6B3A" />
            <stop offset="1" stopColor="#1A9151" />
          </linearGradient>
          <linearGradient id={lightGradientId} x1="8" y1="56" x2="88" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1A9151" />
            <stop offset="1" stopColor="#4EC98A" />
          </linearGradient>
        </defs>
      ) : null}
      {slabs}
    </svg>
  )
}

type FundWiseLogoProps = {
  markSize?: number
  variant?: FundWiseLogoVariant
  className?: string
  wordmarkClassName?: string
}

export function FundWiseLogo({
  markSize = 32,
  variant = "gradient",
  className,
  wordmarkClassName,
}: FundWiseLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <FundWiseLogoMark size={markSize} variant={variant} />
      <span className={cn("font-serif tracking-tight text-foreground", wordmarkClassName)}>
        FundWise
      </span>
    </span>
  )
}
