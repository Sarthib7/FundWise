import { isFundModeTemplateId, type FundModeTemplateId } from "@/lib/fund-mode-templates"
import { FundWiseError } from "@/lib/server/fundwise-error"
import {
  getAdmin,
  getGroupOrThrow,
  isMissingColumnSchemaCacheError,
  type GroupInsert,
} from "./_internal"
import { addMemberInternal } from "./member"
import { verifyFundModeTreasuryAddresses } from "./treasury"

function isFundModeInviteWallet(wallet: string) {
  const inviteWallets = (process.env.FUNDWISE_FUND_MODE_INVITE_WALLETS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  return inviteWallets.includes(wallet)
}

export async function createGroupMutation(data: {
  name: string
  mode: "split" | "fund"
  stablecoinMint: string
  createdBy: string
  fundingGoal?: number
  approvalThreshold?: number
  groupTemplate?: FundModeTemplateId | null
}) {
  if (data.mode === "fund" && !isFundModeInviteWallet(data.createdBy)) {
    throw new FundWiseError(
      "Fund Mode is currently invite-only while the treasury Proposal lifecycle is being finished."
    )
  }

  if (data.groupTemplate && !isFundModeTemplateId(data.groupTemplate)) {
    throw new FundWiseError("Unknown Fund Mode template.")
  }

  const insert: GroupInsert = {
    name: data.name,
    mode: data.mode,
    stablecoin_mint: data.stablecoinMint,
    created_by: data.createdBy,
    funding_goal: data.fundingGoal ?? null,
    approval_threshold: data.approvalThreshold ?? null,
    group_template: data.mode === "fund" ? data.groupTemplate ?? null : null,
  }

  let { data: group, error } = await getAdmin()
    .from("groups")
    .insert(insert)
    .select("id, code")
    .single()

  if (error && isMissingColumnSchemaCacheError(error, "group_template")) {
    // Some early Supabase projects were provisioned before migration
    // `20260511150000_add_fund_mode_template_to_groups.sql` shipped. Retry
    // without the column so devnet rehearsals are not blocked while the
    // operator replays the migration.
    const { group_template: _groupTemplate, ...insertWithoutTemplate } = insert
    const fallback = await getAdmin()
      .from("groups")
      .insert(insertWithoutTemplate as GroupInsert)
      .select("id, code")
      .single()

    group = fallback.data
    error = fallback.error
  }

  if (error) {
    throw new FundWiseError(`Failed to create group: ${error.message}`)
  }

  if (!group) {
    throw new FundWiseError("Failed to create group: no row returned.")
  }

  await addMemberInternal(group.id, data.createdBy, undefined, "admin")

  return group
}

export async function updateGroupTreasuryMutation(data: {
  groupId: string
  creatorWallet: string
  multisigAddress: string
  treasuryAddress: string
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Only Fund Mode Groups can initialize a Treasury.")
  }

  if (group.multisig_address || group.treasury_address) {
    throw new FundWiseError("Treasury is already initialized for this Group.")
  }

  await verifyFundModeTreasuryAddresses({
    creatorWallet: data.creatorWallet,
    multisigAddress: data.multisigAddress,
    treasuryAddress: data.treasuryAddress,
  })

  const { data: updatedGroup, error } = await getAdmin()
    .from("groups")
    .update({
      multisig_address: data.multisigAddress,
      treasury_address: data.treasuryAddress,
    })
    .eq("id", data.groupId)
    .eq("created_by", data.creatorWallet)
    .select("id")
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to update treasury addresses: ${error.message}`)
  }

  if (!updatedGroup) {
    throw new FundWiseError("Only the Group creator can initialize the Treasury")
  }
}
