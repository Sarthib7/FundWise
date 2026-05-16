"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, ChevronLeft } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { FundWiseLogoMark } from "@/components/fundwise-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { isInTelegram, useTelegramBackButton } from "@/lib/telegram-webapp"
import { cn } from "@/lib/utils"

type MobileHeaderProps = {
  title?: ReactNode
  backHref?: string
  backLabel?: string
  rightActions?: ReactNode
  className?: string
}

export function MobileHeader({
  title,
  backHref,
  backLabel = "Back",
  rightActions,
  className,
}: MobileHeaderProps) {
  const router = useRouter()
  const [inTelegram, setInTelegram] = useState(false)

  useEffect(() => {
    setInTelegram(isInTelegram())
  }, [])

  const tgBackHandler = useCallback(() => {
    if (!backHref) return
    router.push(backHref)
  }, [backHref, router])

  useTelegramBackButton(inTelegram && backHref ? tgBackHandler : null)

  // When inside Telegram, native BackButton handles back nav; inline link hidden.
  const showInlineBack = Boolean(backHref) && !inTelegram

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-border-c bg-background/92 px-4 py-3 backdrop-blur-xl lg:hidden",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {showInlineBack ? (
          <Link
            href={backHref!}
            aria-label={backLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border-c bg-background/80 text-brand-text-2 transition-[background-color,color] duration-150 hover:bg-brand-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <Link href="/" aria-label="FundWise home" className="inline-flex shrink-0 items-center">
            <FundWiseLogoMark size={32} />
          </Link>
        )}
        {title ? (
          <span className="truncate font-serif text-lg leading-tight tracking-[-0.3px] text-foreground">
            {title}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled
              aria-label="Notifications (coming soon)"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-border-c bg-background/80 text-brand-text-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Bell className="h-4 w-4" aria-hidden />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-green-fresh ring-2 ring-background" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications coming soon</TooltipContent>
        </Tooltip>
        <ThemeToggle className="h-9 w-9" />
        {rightActions ? <div className="flex items-center gap-2">{rightActions}</div> : null}
      </div>
    </header>
  )
}
