import { Home, Wallet, Users, Activity } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

export type AppRoute = "home" | "groups" | "activity" | "wallet"

export type AppNavItem = {
  id: AppRoute
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  disabled?: boolean
  comingSoon?: boolean
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: "home", label: "Dashboard", href: "/", icon: Home },
  { id: "groups", label: "Groups", href: "/groups", icon: Users },
  { id: "activity", label: "Activity", href: "#", icon: Activity, disabled: true, comingSoon: true },
  { id: "wallet", label: "Wallet", href: "#", icon: Wallet, disabled: true, comingSoon: true },
]
