// Telegram WebApp SDK types + helpers + React hooks.
// Script loaded via app/layout.tsx <Script src="https://telegram.org/js/telegram-web-app.js" />.
// All helpers no-op outside Telegram (window.Telegram?.WebApp absent).

import { useEffect } from "react"

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft"
type HapticNotification = "error" | "success" | "warning"

type ThemeParams = {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

type TelegramWebApp = {
  initData: string
  initDataUnsafe: { user?: { id: number; first_name?: string; username?: string } }
  version: string
  platform: string
  colorScheme: "light" | "dark"
  themeParams: ThemeParams
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  ready: () => void
  expand: () => void
  close: () => void
  onEvent: (eventType: string, handler: () => void) => void
  offEvent: (eventType: string, handler: () => void) => void
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
    setText: (text: string) => void
  }
  HapticFeedback: {
    impactOccurred: (style: HapticStyle) => void
    notificationOccurred: (type: HapticNotification) => void
    selectionChanged: () => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null
  return window.Telegram?.WebApp ?? null
}

export function isInTelegram(): boolean {
  return getTelegramWebApp() !== null
}

export function hapticImpact(style: HapticStyle = "light"): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style)
  } catch {
    // SDK version mismatch (impactOccurred added 6.1) — silent
  }
}

export function hapticNotify(type: HapticNotification): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred(type)
  } catch {}
}

export function hapticSelect(): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged()
  } catch {}
}

/** Show TG native BackButton bound to onClick. Auto-hide on unmount or onClick=null. */
export function useTelegramBackButton(onClick: (() => void) | null) {
  useEffect(() => {
    const wa = getTelegramWebApp()
    if (!wa || !onClick) return
    wa.BackButton.show()
    wa.BackButton.onClick(onClick)
    return () => {
      wa.BackButton.offClick(onClick)
      wa.BackButton.hide()
    }
  }, [onClick])
}
