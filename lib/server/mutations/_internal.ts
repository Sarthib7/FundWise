import type { Database } from "@/lib/database.types"
import { PublicKey } from "@solana/web3.js"
import {
  isFundModeRole,
  roleCan,
  type FundModeAction,
  type FundModeRole,
} from "@/lib/fund-mode-roles"
import type { FundWiseCluster } from "@/lib/solana-cluster"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"

export type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
export type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"]
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

export type SupabaseMutationError = {
  code?: string
  message?: string
}

export function getAdmin() {
  return getSupabaseAdmin()
}

// Fund Mode currently runs on devnet for the invite-only beta, but the
// graduation path needs an env-driven cluster choice so flipping to mainnet
// after the beta requires zero code changes.
export function getFundModeCluster(): FundWiseCluster {
  const raw = (process.env.FUNDWISE_FUND_MODE_CLUSTER ?? "").trim().toLowerCase()
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta"
  if (raw === "custom") return "custom"
  return "devnet"
}

export function isMissingColumnSchemaCacheError(error: SupabaseMutationError, column: string) {
  return (
    error.code === "PGRST204" ||
    error.message?.includes(`'${column}' column`) ||
    error.message?.includes(`"${column}" column`)
  )
}

export function parsePublicKey(address: string, label: string) {
  try {
    return new PublicKey(address)
  } catch {
    throw new FundWiseError(`${label} is not a valid Solana address.`)
  }
}

export async function getGroupOrThrow(groupId: string): Promise<GroupRow> {
  const { data, error } = await getAdmin()
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load group: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError("Group not found")
  }

  return data
}

export async function assertWalletIsMember(groupId: string, wallet: string, message: string) {
  const { data, error } = await getAdmin()
    .from("members")
    .select("id")
    .eq("group_id", groupId)
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to validate Group membership: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError(message)
  }
}

async function loadMemberRole(
  groupId: string,
  wallet: string,
  message: string
): Promise<FundModeRole> {
  const { data, error } = await getAdmin()
    .from("members")
    .select("role")
    .eq("group_id", groupId)
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    // Schema cache returns PGRST204 when the `role` column has not been added
    // yet — fall back to "member" so devnet rehearsals continue while the
    // operator replays migration 20260515100000_fund_mode_beta_completion.sql.
    if (isMissingColumnSchemaCacheError(error, "role")) {
      return "member"
    }
    throw new FundWiseError(`Failed to load Member role: ${error.message}`)
  }

  if (!data) {
    throw new FundWiseError(message)
  }

  const value = (data as { role?: string }).role
  return isFundModeRole(value) ? value : "member"
}

export async function assertMemberCan(
  groupId: string,
  wallet: string,
  action: FundModeAction,
  deniedMessage: string
): Promise<FundModeRole> {
  const role = await loadMemberRole(
    groupId,
    wallet,
    "Only Group Members can perform this action."
  )
  if (!roleCan(role, action)) {
    throw new FundWiseError(deniedMessage, 403)
  }
  return role
}

export async function assertWalletsAreMembers(groupId: string, wallets: string[], message: string) {
  const uniqueWallets = Array.from(new Set(wallets))

  if (uniqueWallets.length === 0) {
    throw new FundWiseError(message)
  }

  const { data, error } = await getAdmin()
    .from("members")
    .select("wallet")
    .eq("group_id", groupId)
    .in("wallet", uniqueWallets)

  if (error) {
    throw new FundWiseError(`Failed to validate Group members: ${error.message}`)
  }

  if ((data || []).length !== uniqueWallets.length) {
    throw new FundWiseError(message)
  }
}
