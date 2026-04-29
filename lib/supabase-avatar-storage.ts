// Avatar storage using Supabase (replaces Firebase avatar storage)
// For MVP, avatars are generated client-side using DiceBear and stored as preferences in the members table

import { createAvatar } from "@dicebear/core"
import { initials } from "@dicebear/collection"

export interface AvatarData {
  variant: string
  colors: string[]
}

export const DEFAULT_AVATAR_COLORS = {
  background: ["#00ab79"],
  text: ["#ffffff"],
}

export function generateAvatarUrl(name: string, size: number = 48): string {
  const avatar = createAvatar(initials, {
    seed: name,
    size,
    backgroundColor: DEFAULT_AVATAR_COLORS.background,
  })
  return avatar.toDataUri()
}

export function getAvatarData(_name: string): AvatarData {
  return {
    variant: "initials",
    colors: DEFAULT_AVATAR_COLORS.background,
  }
}

export function updateAvatarVariant(_wallet: string, _variant: string): AvatarData {
  return { variant: "initials", colors: DEFAULT_AVATAR_COLORS.background }
}

export function updateAvatarColors(_wallet: string, _colors: string[]): AvatarData {
  return { variant: "initials", colors: DEFAULT_AVATAR_COLORS.background }
}
