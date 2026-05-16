import {
  FUND_MODE_ROLES,
  isFundModeRole,
  type FundModeRole,
} from "@/lib/fund-mode-roles"
import {
  FUND_MODE_BETA_PRICING,
} from "@/lib/fund-mode-monetization"
import { FundWiseError } from "@/lib/server/fundwise-error"
import {
  assertMemberCan,
  assertWalletIsMember,
  getAdmin,
  getGroupOrThrow,
  isMissingColumnSchemaCacheError,
  type ProfileRow,
} from "./_internal"
import { recordMonetizationResponseMutation } from "./monetization"

async function getProfile(wallet: string): Promise<ProfileRow | null> {
  const { data, error } = await getAdmin()
    .from("profiles")
    .select("*")
    .eq("wallet", wallet)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load profile: ${error.message}`)
  }

  return data
}

async function getMemberRoleOrThrow(
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

async function addMemberInternal(
  groupId: string,
  wallet: string,
  displayName?: string,
  role: FundModeRole = "member"
) {
  const profile = displayName ? null : await getProfile(wallet)

  const insertWithRole = {
    group_id: groupId,
    wallet,
    display_name: displayName || profile?.display_name || null,
    role,
  }

  let { error } = await getAdmin().from("members").insert(insertWithRole)

  if (error && isMissingColumnSchemaCacheError(error, "role")) {
    // Fallback for projects that have not replayed the FW-045 migration yet.
    const { role: _role, ...insertWithoutRole } = insertWithRole
    const fallback = await getAdmin().from("members").insert(insertWithoutRole)
    error = fallback.error
  }

  if (error && error.code !== "23505") {
    throw new FundWiseError(`Failed to add member: ${error.message}`)
  }
}

export async function addMemberMutation(data: {
  groupId: string
  wallet: string
  displayName?: string
}) {
  await getGroupOrThrow(data.groupId)
  await addMemberInternal(data.groupId, data.wallet, data.displayName)
}

export async function updateProfileDisplayNameMutation(wallet: string, displayName: string) {
  const trimmedDisplayName = displayName.trim()

  if (!trimmedDisplayName) {
    throw new FundWiseError("Display name cannot be empty.")
  }

  if (trimmedDisplayName.length > 32) {
    throw new FundWiseError("Display name must be 32 characters or fewer.")
  }

  const { error: profileError } = await getAdmin().from("profiles").upsert(
    {
      wallet,
      display_name: trimmedDisplayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "wallet" }
  )

  if (profileError) {
    throw new FundWiseError(`Failed to update profile: ${profileError.message}`)
  }

  const { error: memberError } = await getAdmin()
    .from("members")
    .update({ display_name: trimmedDisplayName })
    .eq("wallet", wallet)

  if (memberError) {
    throw new FundWiseError(`Failed to sync display name across Groups: ${memberError.message}`)
  }
}

// =============================================
// FW-045: Member role management
// =============================================
export async function setMemberRoleMutation(data: {
  groupId: string
  actorWallet: string
  targetWallet: string
  role: FundModeRole
}) {
  if (!isFundModeRole(data.role)) {
    throw new FundWiseError(`Role must be one of: ${FUND_MODE_ROLES.join(", ")}.`)
  }

  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Role assignments are only available in Fund Mode Groups.")
  }

  await assertMemberCan(
    data.groupId,
    data.actorWallet,
    "change_role",
    "Only Group Admins can change Member roles."
  )

  // Don't allow the last admin to demote themselves — the Group would be stuck.
  if (data.actorWallet === data.targetWallet && data.role !== "admin") {
    const { count: adminCount, error: countError } = await getAdmin()
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", data.groupId)
      .eq("role", "admin")

    if (countError && !isMissingColumnSchemaCacheError(countError, "role")) {
      throw new FundWiseError(`Failed to count Group Admins: ${countError.message}`)
    }

    if ((adminCount ?? 0) <= 1) {
      throw new FundWiseError("Cannot demote the last Admin. Assign another Admin first.")
    }
  }

  const { data: updated, error } = await getAdmin()
    .from("members")
    .update({ role: data.role })
    .eq("group_id", data.groupId)
    .eq("wallet", data.targetWallet)
    .select("id, role")
    .maybeSingle()

  if (error) {
    if (isMissingColumnSchemaCacheError(error, "role")) {
      throw new FundWiseError(
        "Member roles require migration 20260515100000_fund_mode_beta_completion.sql to be replayed on this Supabase project.",
        503
      )
    }
    throw new FundWiseError(`Failed to update Member role: ${error.message}`)
  }

  if (!updated) {
    throw new FundWiseError("Target wallet is not a Member of this Group.", 404)
  }

  return updated
}

// =============================================
// FW-063 helper: member leaves a Group (records the event; refund still goes
// through the normal exit-refund Proposal flow).
// =============================================
export async function leaveGroupMutation(data: {
  groupId: string
  memberWallet: string
  exitSurvey?: {
    pricingFairness?: number
    wouldPayConfidence?: number
    featureRequests?: string
  }
}) {
  const group = await getGroupOrThrow(data.groupId)

  await assertWalletIsMember(
    data.groupId,
    data.memberWallet,
    "Only current Members can leave the Group."
  )

  if (group.created_by === data.memberWallet) {
    throw new FundWiseError("Group creators cannot leave the Group. Transfer ownership first.")
  }

  // Record the exit survey first (best-effort). If migration not replayed yet
  // we still allow the leave to proceed.
  if (data.exitSurvey && group.mode === "fund") {
    try {
      await recordMonetizationResponseMutation({
        kind: "exit_survey",
        memberWallet: data.memberWallet,
        groupId: data.groupId,
        emulatedUsdCents: FUND_MODE_BETA_PRICING.monthlySubscriptionUsdCents,
        payload: data.exitSurvey as Record<string, unknown>,
      })
    } catch (error) {
      if (!(error instanceof FundWiseError) || error.status !== 503) {
        throw error
      }
    }
  }

  const { error } = await getAdmin()
    .from("members")
    .delete()
    .eq("group_id", data.groupId)
    .eq("wallet", data.memberWallet)

  if (error) {
    throw new FundWiseError(`Failed to leave Group: ${error.message}`)
  }
}

// Internal exports for cross-concept use within mutations/ (group.ts uses
// addMemberInternal to add the creator). Not re-exported from the barrel.
export { addMemberInternal, getMemberRoleOrThrow, getProfile }
