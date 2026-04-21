/**
 * FundWise Anchor Program Integration
 * Connects Next.js frontend to deployed Solana programs
 */

import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor"
import type { GroupManager } from "./anchor/group_manager"
import groupManagerIdl from "./anchor/group_manager.json"

// Environment configuration
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://127.0.0.1:8899"
// Local validator deployed program ID (updated automatically by anchor deploy)
const GROUP_MANAGER_PROGRAM_ID = new PublicKey("3pJ9av99jUDm4ZUfxphpucRcMnuTTPJVKNzubQmLbzHt")

export const connection = new Connection(SOLANA_RPC_URL, "confirmed")

/**
 * Get Anchor provider from wallet
 */
export function getProvider(wallet: any): AnchorProvider {
  return new AnchorProvider(
    connection,
    wallet,
    { commitment: "confirmed" }
  )
}

/**
 * Get Group Manager program instance
 */
export function getGroupManagerProgram(provider: AnchorProvider): Program<GroupManager> {
  return new Program(groupManagerIdl as GroupManager, GROUP_MANAGER_PROGRAM_ID, provider)
}

/**
 * Derive Group Pool PDA
 */
export async function getGroupPoolPDA(
  multisigAuthority: PublicKey,
  programId: PublicKey = GROUP_MANAGER_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddress(
    [Buffer.from("group_pool"), multisigAuthority.toBuffer()],
    programId
  )
}

/**
 * Derive Member PDA
 */
export async function getMemberPDA(
  groupPool: PublicKey,
  wallet: PublicKey,
  programId: PublicKey = GROUP_MANAGER_PROGRAM_ID
): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddress(
    [Buffer.from("member"), groupPool.toBuffer(), wallet.toBuffer()],
    programId
  )
}

/**
 * Derive Invite Code PDA
 */
export async function getInviteCodePDA(
  groupPool: PublicKey,
  inviteId: BN,
  programId: PublicKey = GROUP_MANAGER_PROGRAM_ID
): Promise<[PublicKey, number]> {
  const idBuffer = Buffer.alloc(8)
  idBuffer.writeBigUInt64LE(BigInt(inviteId.toString()))

  return await PublicKey.findProgramAddress(
    [Buffer.from("invite"), groupPool.toBuffer(), idBuffer],
    programId
  )
}

/**
 * Create a new fundraising group on-chain
 */
export async function createGroupOnChain(
  wallet: any,
  params: {
    name: string
    fundraisingTarget: number // in lamports
    paymentSchedule: "weekly" | "monthly" | "quarterly" | "oneTime"
    contributionAmount: number // in lamports
    allocationStrategy: "fullyCompressed" | "fullyYield" | { split: { ratio: number } }
  }
): Promise<{ groupPoolPDA: PublicKey; signature: string }> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    // Use creator's wallet as multisig authority for now
    // In production, this would be a Squads multisig
    const multisigAuthority = provider.wallet.publicKey

    // For now, use a placeholder mint
    const poolMint = web3.Keypair.generate().publicKey

    const [groupPoolPDA] = await getGroupPoolPDA(multisigAuthority)

    // Map payment schedule to Anchor enum format
    const paymentScheduleEnum = {
      [params.paymentSchedule]: {}
    }

    // Map allocation strategy to Anchor enum format
    let allocationStrategyEnum
    if (params.allocationStrategy === "fullyCompressed") {
      allocationStrategyEnum = { fullyCompressed: {} }
    } else if (params.allocationStrategy === "fullyYield") {
      allocationStrategyEnum = { fullyYield: {} }
    } else {
      allocationStrategyEnum = { split: { ratio: params.allocationStrategy.split.ratio } }
    }

    console.log("[FundWise Anchor] Creating group...")
    console.log("[FundWise Anchor] Group Pool PDA:", groupPoolPDA.toString())

    const tx = await program.methods
      .createGroup(
        params.name,
        new BN(params.fundraisingTarget),
        paymentScheduleEnum,
        new BN(params.contributionAmount),
        allocationStrategyEnum
      )
      .accounts({
        creator: provider.wallet.publicKey,
        groupPool: groupPoolPDA,
        multisigAuthority: multisigAuthority,
        poolMint: poolMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc()

    console.log("[FundWise Anchor] Group created! TX:", tx)

    return {
      groupPoolPDA,
      signature: tx,
    }
  } catch (error) {
    console.error("[FundWise Anchor] Error creating group:", error)
    throw error
  }
}

/**
 * Contribute to a group on-chain
 */
export async function contributeToGroupOnChain(
  wallet: any,
  groupPoolPDA: PublicKey,
  amount: number // in lamports
): Promise<{ signature: string }> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    const [memberPDA] = await getMemberPDA(groupPoolPDA, provider.wallet.publicKey)

    console.log("[FundWise Anchor] Contributing to group...")
    console.log("[FundWise Anchor] Amount:", amount, "lamports")
    console.log("[FundWise Anchor] Member PDA:", memberPDA.toString())

    const tx = await program.methods
      .contribute(new BN(amount))
      .accounts({
        contributor: provider.wallet.publicKey,
        groupPool: groupPoolPDA,
        member: memberPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    console.log("[FundWise Anchor] Contribution successful! TX:", tx)

    return { signature: tx }
  } catch (error) {
    console.error("[FundWise Anchor] Error contributing:", error)
    throw error
  }
}

/**
 * Fetch group data from on-chain account
 */
export async function fetchGroupDataOnChain(
  wallet: any,
  groupPoolPDA: PublicKey
): Promise<any> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    const groupData = await program.account.groupPool.fetch(groupPoolPDA)

    console.log("[FundWise Anchor] Fetched group data:", groupData)

    return {
      name: groupData.name,
      authority: groupData.authority.toString(),
      fundraisingTarget: groupData.fundraisingTarget.toNumber(),
      currentAmount: groupData.currentAmount.toNumber(),
      totalContributions: groupData.totalContributions.toNumber(),
      membersCount: groupData.membersCount,
      paymentSchedule: Object.keys(groupData.paymentSchedule)[0],
      allocationStrategy: Object.keys(groupData.allocationStrategy)[0],
      createdAt: new Date(groupData.createdAt.toNumber() * 1000).toISOString(),
    }
  } catch (error) {
    console.error("[FundWise Anchor] Error fetching group:", error)
    throw error
  }
}

/**
 * Fetch member data from on-chain account
 */
export async function fetchMemberDataOnChain(
  wallet: any,
  groupPoolPDA: PublicKey,
  memberWallet: PublicKey
): Promise<any> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    const [memberPDA] = await getMemberPDA(groupPoolPDA, memberWallet)
    const memberData = await program.account.member.fetch(memberPDA)

    return {
      wallet: memberData.wallet.toString(),
      totalContributed: memberData.totalContributed.toNumber(),
      allocationBps: memberData.allocationBps,
      contributionCount: memberData.contributionCount,
      isActive: memberData.isActive,
      lastContribution: new Date(memberData.lastContribution.toNumber() * 1000).toISOString(),
    }
  } catch (error) {
    console.error("[FundWise Anchor] Error fetching member:", error)
    throw error
  }
}

/**
 * Make recurring payment to group (uses group's contribution_amount)
 */
export async function makePaymentOnChain(
  wallet: any,
  groupPoolPDA: PublicKey
): Promise<{ signature: string; amount: number }> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    // Fetch group to get contribution amount
    const groupData = await program.account.groupPool.fetch(groupPoolPDA)
    const contributionAmount = groupData.contributionAmount.toNumber()

    const [memberPDA] = await getMemberPDA(groupPoolPDA, provider.wallet.publicKey)

    console.log("[FundWise Anchor] Making recurring payment...")
    console.log("[FundWise Anchor] Amount:", contributionAmount, "lamports")

    const tx = await program.methods
      .contribute(new BN(contributionAmount))
      .accounts({
        contributor: provider.wallet.publicKey,
        groupPool: groupPoolPDA,
        member: memberPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    console.log("[FundWise Anchor] Payment successful! TX:", tx)

    return { signature: tx, amount: contributionAmount }
  } catch (error) {
    console.error("[FundWise Anchor] Error making payment:", error)
    throw error
  }
}

/**
 * Withdraw contribution from group
 */
export async function withdrawFromGroupOnChain(
  wallet: any,
  groupPoolPDA: PublicKey,
  amount: number // in lamports
): Promise<{ signature: string }> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    const [memberPDA] = await getMemberPDA(groupPoolPDA, provider.wallet.publicKey)

    console.log("[FundWise Anchor] Withdrawing from group...")
    console.log("[FundWise Anchor] Amount:", amount, "lamports")

    const tx = await program.methods
      .withdrawContribution(new BN(amount))
      .accounts({
        memberWallet: provider.wallet.publicKey,
        groupPool: groupPoolPDA,
        member: memberPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    console.log("[FundWise Anchor] Withdrawal successful! TX:", tx)

    return { signature: tx }
  } catch (error) {
    console.error("[FundWise Anchor] Error withdrawing:", error)
    throw error
  }
}

/**
 * Create invite code on-chain
 */
export async function createInviteOnChain(
  wallet: any,
  groupPoolPDA: PublicKey,
  params: {
    codeString: string
    tipAmount: number // in lamports
    expiryDays?: number
  }
): Promise<{ inviteCodePDA: PublicKey; signature: string }> {
  try {
    const provider = getProvider(wallet)
    const program = getGroupManagerProgram(provider)

    // Fetch current group to get invite counter
    const groupData = await program.account.groupPool.fetch(groupPoolPDA)
    const inviteId = groupData.invitesCreated

    const [inviteCodePDA] = await getInviteCodePDA(groupPoolPDA, inviteId)

    const tx = await program.methods
      .createInvite(
        params.codeString,
        new BN(params.tipAmount),
        params.expiryDays || null
      )
      .accounts({
        creator: provider.wallet.publicKey,
        groupPool: groupPoolPDA,
        inviteCode: inviteCodePDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    console.log("[FundWise Anchor] Invite created! TX:", tx)

    return {
      inviteCodePDA,
      signature: tx,
    }
  } catch (error) {
    console.error("[FundWise Anchor] Error creating invite:", error)
    throw error
  }
}

// Utility functions
export function solToLamports(sol: number): number {
  return Math.floor(sol * web3.LAMPORTS_PER_SOL)
}

export function lamportsToSol(lamports: number): number {
  return lamports / web3.LAMPORTS_PER_SOL
}

export { BN, PublicKey, Connection }
