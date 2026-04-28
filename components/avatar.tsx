"use client"

import BoringAvatar from "boring-avatars"
import { cn } from "@/lib/utils"

const GROUP_COLORS = ["#00ab79", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"]

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 40, className }: AvatarProps) {
  return (
    <div className={cn("rounded-full overflow-hidden", className)}>
      <BoringAvatar
        size={size}
        name={name}
        variant="marble"
        colors={GROUP_COLORS}
      />
    </div>
  )
}

export function GroupAvatar({ name, size = 40, className }: AvatarProps) {
  return (
    <div className={cn("rounded-full overflow-hidden", className)}>
      <BoringAvatar
        size={size}
        name={name}
        variant="beam"
        colors={GROUP_COLORS}
      />
    </div>
  )
}

export function WalletAvatar({ address, size = 40, className }: { address: string; size?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-full ring-1 ring-brand-border-c/70", className)}>
      <BoringAvatar
        size={size}
        name={address}
        variant="beam"
        colors={GROUP_COLORS}
      />
    </div>
  )
}
