"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { getTelegramWebApp } from "@/lib/telegram-webapp"

// Initializes TG WebApp on mount: ready() + expand() + syncs colorScheme into next-themes.
// No-op when not embedded in Telegram (script absent / window.Telegram undefined).
export function TelegramWebAppProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()

  useEffect(() => {
    const wa = getTelegramWebApp()
    if (!wa) return

    wa.ready()
    wa.expand()
    if (wa.colorScheme) setTheme(wa.colorScheme)

    const onThemeChanged = () => {
      const next = getTelegramWebApp()?.colorScheme
      if (next) setTheme(next)
    }
    wa.onEvent("themeChanged", onThemeChanged)
    return () => wa.offEvent("themeChanged", onThemeChanged)
  }, [setTheme])

  return <>{children}</>
}
