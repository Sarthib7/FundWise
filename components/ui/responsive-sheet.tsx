"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

function useIsDesktop(query = "(min-width: 768px)") {
  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    const update = () => setIsDesktop(mql.matches)
    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [query])

  return isDesktop
}

type ResponsiveSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
  bodyClassName?: string
  /** Hide the header even if title/description are passed (use when content owns its own header). */
  hideHeader?: boolean
}

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  contentClassName,
  bodyClassName,
  hideHeader = false,
}: ResponsiveSheetProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl",
            contentClassName,
          )}
        >
          {!hideHeader && (title || description) ? (
            <DialogHeader>
              {title ? (
                <DialogTitle className="font-serif text-xl tracking-[-0.3px]">
                  {title}
                </DialogTitle>
              ) : null}
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </DialogHeader>
          ) : null}
          <div className={cn(bodyClassName)}>{children}</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn("max-h-[92vh] border-brand-border-c bg-background", contentClassName)}
      >
        {!hideHeader && (title || description) ? (
          <DrawerHeader className="px-4 text-left">
            {title ? (
              <DrawerTitle className="font-serif text-xl tracking-[-0.3px]">{title}</DrawerTitle>
            ) : null}
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
        ) : null}
        <div
          className={cn(
            "overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+20px)]",
            bodyClassName,
          )}
        >
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
