"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import type { ReactNode } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { APP_NAV_ITEMS, type AppRoute } from "./nav-items"

export type FabAction = {
  label: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
}

type BottomNavProps = {
  activeRoute?: AppRoute
  fabAction?: FabAction
  className?: string
}

export function BottomNav({ activeRoute, fabAction, className }: BottomNavProps) {
  const left = APP_NAV_ITEMS.slice(0, 2)
  const right = APP_NAV_ITEMS.slice(2)

  return (
    <nav
      aria-label="App navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-brand-border-c bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl lg:hidden",
        className,
      )}
    >
      {left.map((item) => (
        <NavItemLink key={item.id} item={item} active={activeRoute === item.id} />
      ))}

      <div className="flex flex-1 items-start justify-center">
        {fabAction ? (
          fabAction.href ? (
            <Link
              href={fabAction.href}
              aria-label={fabAction.label}
              className="-mt-5 inline-flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-brand-grad text-white shadow-[0_8px_22px_rgba(13,107,58,0.35)] transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {fabAction.icon || <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden />}
            </Link>
          ) : (
            <button
              type="button"
              onClick={fabAction.onClick}
              aria-label={fabAction.label}
              className="-mt-5 inline-flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-brand-grad text-white shadow-[0_8px_22px_rgba(13,107,58,0.35)] transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {fabAction.icon || <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden />}
            </button>
          )
        ) : (
          <span className="inline-block h-[52px] w-[52px]" aria-hidden />
        )}
      </div>

      {right.map((item) => (
        <NavItemLink key={item.id} item={item} active={activeRoute === item.id} />
      ))}
    </nav>
  )
}

function NavItemLink({
  item,
  active,
}: {
  item: (typeof APP_NAV_ITEMS)[number]
  active: boolean
}) {
  const Icon = item.icon
  const inner = (
    <span
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 py-1",
        active ? "text-brand-green-mid" : "text-brand-text-3",
        item.disabled && "opacity-55",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.7} aria-hidden />
      <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{item.label}</span>
    </span>
  )

  if (item.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled
            className="flex flex-1 cursor-not-allowed flex-col items-center"
          >
            {inner}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Coming soon</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="flex flex-1 flex-col items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {inner}
    </Link>
  )
}
