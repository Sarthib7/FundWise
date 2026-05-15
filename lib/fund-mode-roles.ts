export type FundModeRole = "admin" | "member" | "viewer"

export const FUND_MODE_ROLES: FundModeRole[] = ["admin", "member", "viewer"]

export function isFundModeRole(value: unknown): value is FundModeRole {
  return value === "admin" || value === "member" || value === "viewer"
}

export type FundModeAction =
  | "invite_member"
  | "change_role"
  | "change_threshold"
  | "create_proposal"
  | "review_proposal"
  | "execute_proposal"
  | "comment_proposal"
  | "contribute"
  | "read"

const PERMISSIONS: Record<FundModeRole, ReadonlyArray<FundModeAction>> = {
  admin: [
    "invite_member",
    "change_role",
    "change_threshold",
    "create_proposal",
    "review_proposal",
    "execute_proposal",
    "comment_proposal",
    "contribute",
    "read",
  ],
  member: [
    "create_proposal",
    "review_proposal",
    "execute_proposal",
    "comment_proposal",
    "contribute",
    "read",
  ],
  viewer: ["read", "comment_proposal"],
}

export function roleCan(role: FundModeRole, action: FundModeAction) {
  return PERMISSIONS[role].includes(action)
}

export function describeRole(role: FundModeRole) {
  if (role === "admin") {
    return "Manages threshold, invites, and role assignments. Can do everything a Member can."
  }
  if (role === "member") {
    return "Can propose, approve, execute, comment, and contribute."
  }
  return "Read-only. Can comment on Proposals but cannot move money or vote."
}
