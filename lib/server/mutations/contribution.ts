import { FundWiseError } from "@/lib/server/fundwise-error"
import { verifyContributionTransfer } from "@/lib/server/solana-transfer-verification"
import {
  assertWalletIsMember,
  getAdmin,
  getGroupOrThrow,
} from "./_internal"

export async function addContributionMutation(data: {
  groupId: string
  memberWallet: string
  amount: number
  mint: string
  txSig: string
}) {
  const group = await getGroupOrThrow(data.groupId)

  if (group.mode !== "fund") {
    throw new FundWiseError("Contributions can only be recorded for Fund Mode Groups.")
  }

  if (!Number.isFinite(data.amount) || data.amount <= 0 || !Number.isInteger(data.amount)) {
    throw new FundWiseError("Contribution amount must be a positive integer token amount.")
  }

  if (data.mint !== group.stablecoin_mint) {
    throw new FundWiseError("Contribution mint does not match this Group stablecoin.")
  }

  if (!group.treasury_address) {
    throw new FundWiseError("Treasury is not initialized for this Group.")
  }

  await assertWalletIsMember(
    data.groupId,
    data.memberWallet,
    "Only Group Members can record Contributions."
  )

  const { data: existingContribution, error: existingContributionError } = await getAdmin()
    .from("contributions")
    .select("id")
    .eq("tx_sig", data.txSig)
    .maybeSingle()

  if (existingContributionError) {
    throw new FundWiseError(`Failed to check for duplicate Contribution transaction: ${existingContributionError.message}`)
  }

  if (existingContribution) {
    throw new FundWiseError("This Contribution transaction has already been recorded.")
  }

  await verifyContributionTransfer({
    txSig: data.txSig,
    mint: data.mint,
    memberWallet: data.memberWallet,
    treasuryAddress: group.treasury_address,
    amount: data.amount,
  })

  const { data: contribution, error } = await getAdmin()
    .from("contributions")
    .insert({
      group_id: data.groupId,
      member_wallet: data.memberWallet,
      amount: data.amount,
      mint: data.mint,
      tx_sig: data.txSig,
    })
    .select("id")
    .single()

  if (error) {
    throw new FundWiseError(`Failed to add contribution: ${error.message}`)
  }

  return contribution
}
