import { getAvatarData, type AvatarData, DEFAULT_AVATAR_COLORS } from "./supabase-avatar-storage"

export type { AvatarData }

export const DEFAULT_COLORS = DEFAULT_AVATAR_COLORS

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
