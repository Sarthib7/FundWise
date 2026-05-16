import { PublicKey, type AccountInfo } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import { createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getFundModeCluster, parsePublicKey } from "@/lib/server/mutations/_internal"

// Shared shape for any object capable of returning a confirmed Solana account
// snapshot. Production callers pass nothing and we default to a real RPC
// connection; tests inject a deterministic mock. Keeping this Adapter at the
// Module boundary is what ADR-0035 means by "the Module's Interface is the
// unit-test surface".
export type SolanaAccountInfo = {
  data: Buffer
  owner: PublicKey
  executable: boolean
}

export type AccountReader = {
  getAccountInfo(address: PublicKey, commitment: "confirmed"): Promise<SolanaAccountInfo | null>
}

// FundWise's status vocabulary, mirrored from the Proposal lifecycle in the
// database. Returned by `verifyProposalReview` so callers never have to think
// about the raw Squads status strings.
export type FundWiseProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "cancelled"

function defaultReader(): AccountReader {
  return createFundWiseConnectionForCluster(getFundModeCluster(), "confirmed")
}

export async function loadProposal(
  proposalAddress: string,
  reader: AccountReader = defaultReader()
): Promise<multisig.accounts.Proposal> {
  const proposalPubkey = parsePublicKey(proposalAddress, "Squads Proposal address")
  const proposalAccount = await reader.getAccountInfo(proposalPubkey, "confirmed")

  if (!proposalAccount) {
    throw new FundWiseError("Squads Proposal account is not confirmed on the configured Solana RPC.")
  }

  if (!proposalAccount.owner.equals(multisig.PROGRAM_ID)) {
    throw new FundWiseError("Squads Proposal account is not owned by the Squads program.")
  }

  try {
    const [proposal] = multisig.accounts.Proposal.fromAccountInfo(
      proposalAccount as AccountInfo<Buffer>
    )
    return proposal
  } catch {
    throw new FundWiseError("Squads Proposal account data could not be decoded.")
  }
}

export async function verifyTreasury(
  data: {
    creatorWallet?: string
    multisigAddress: string
    treasuryAddress: string
  },
  reader: AccountReader = defaultReader()
): Promise<void> {
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const treasuryPubkey = parsePublicKey(data.treasuryAddress, "Treasury address")
  const [expectedTreasuryPda] = multisig.getVaultPda({
    multisigPda: multisigPubkey,
    index: 0,
  })

  if (!treasuryPubkey.equals(expectedTreasuryPda)) {
    throw new FundWiseError("Treasury address does not match the Squads vault PDA for this Multisig.")
  }

  const multisigAccount = await reader.getAccountInfo(multisigPubkey, "confirmed")

  if (!multisigAccount) {
    throw new FundWiseError("Squads Multisig account is not confirmed on the configured Solana RPC.")
  }

  if (!multisigAccount.owner.equals(multisig.PROGRAM_ID)) {
    throw new FundWiseError("Multisig account is not owned by the Squads program.")
  }

  if (multisigAccount.executable) {
    throw new FundWiseError("Multisig address points to an executable account, not a Squads Multisig.")
  }

  if (data.creatorWallet) {
    const creatorPubkey = parsePublicKey(data.creatorWallet, "Creator wallet")
    let decodedMultisig: multisig.accounts.Multisig

    try {
      ;[decodedMultisig] = multisig.accounts.Multisig.fromAccountInfo(
        multisigAccount as AccountInfo<Buffer>
      )
    } catch {
      throw new FundWiseError("Multisig account data could not be decoded as a Squads Multisig.")
    }

    const creatorIsMultisigMember = decodedMultisig.members.some((member) =>
      member.key.equals(creatorPubkey)
    )

    if (!creatorIsMultisigMember) {
      throw new FundWiseError("Treasury creator wallet is not a configured Squads Multisig Member.")
    }
  }
}

export async function verifyProposalMetadata(
  data: {
    multisigAddress: string
    transactionIndex: number
    proposalAddress: string
    transactionAddress: string
  },
  reader: AccountReader = defaultReader()
): Promise<void> {
  if (!Number.isSafeInteger(data.transactionIndex) || data.transactionIndex < 1) {
    throw new FundWiseError("Squads transaction index must be a positive safe integer.")
  }

  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const proposalPubkey = parsePublicKey(data.proposalAddress, "Squads Proposal address")
  const transactionPubkey = parsePublicKey(data.transactionAddress, "Squads transaction address")
  const transactionIndex = BigInt(data.transactionIndex)
  const [expectedProposalPda] = multisig.getProposalPda({
    multisigPda: multisigPubkey,
    transactionIndex,
  })
  const [expectedTransactionPda] = multisig.getTransactionPda({
    multisigPda: multisigPubkey,
    index: transactionIndex,
  })

  if (!proposalPubkey.equals(expectedProposalPda)) {
    throw new FundWiseError("Squads Proposal address does not match the expected PDA.")
  }

  if (!transactionPubkey.equals(expectedTransactionPda)) {
    throw new FundWiseError("Squads transaction address does not match the expected PDA.")
  }

  const proposal = await loadProposal(data.proposalAddress, reader)

  if (!proposal.multisig.equals(multisigPubkey)) {
    throw new FundWiseError("Squads Proposal does not belong to this Group Multisig.")
  }

  if (BigInt(proposal.transactionIndex.toString()) !== transactionIndex) {
    throw new FundWiseError("Squads Proposal transaction index does not match the FundWise Proposal.")
  }
}

export async function verifyProposalReview(
  data: {
    multisigAddress: string
    transactionIndex: number
    proposalAddress: string
    memberWallet: string
    decision: "approved" | "rejected"
  },
  reader: AccountReader = defaultReader()
): Promise<FundWiseProposalStatus> {
  const proposal = await loadProposal(data.proposalAddress, reader)
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const memberPubkey = parsePublicKey(data.memberWallet, "Reviewer wallet")

  if (!proposal.multisig.equals(multisigPubkey)) {
    throw new FundWiseError("Squads Proposal does not belong to this Group Multisig.")
  }

  if (BigInt(proposal.transactionIndex.toString()) !== BigInt(data.transactionIndex)) {
    throw new FundWiseError("Squads Proposal transaction index does not match the FundWise Proposal.")
  }

  const reviewedWallets = data.decision === "approved" ? proposal.approved : proposal.rejected
  const hasReview = reviewedWallets.some((wallet) => wallet.equals(memberPubkey))

  if (!hasReview) {
    throw new FundWiseError("Squads Proposal does not include this wallet review yet.")
  }

  return mapSquadsStatusToFundWiseStatus(proposal.pretty().status)
}

export async function verifyExecution(
  data: {
    multisigAddress: string
    transactionIndex: number
    proposalAddress: string
  },
  reader: AccountReader = defaultReader()
): Promise<void> {
  const proposal = await loadProposal(data.proposalAddress, reader)
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")

  if (!proposal.multisig.equals(multisigPubkey)) {
    throw new FundWiseError("Squads Proposal does not belong to this Group Multisig.")
  }

  if (BigInt(proposal.transactionIndex.toString()) !== BigInt(data.transactionIndex)) {
    throw new FundWiseError("Squads Proposal transaction index does not match the FundWise Proposal.")
  }

  if (proposal.pretty().status !== "Executed") {
    throw new FundWiseError("Squads Proposal has not been executed on-chain yet.")
  }
}

function mapSquadsStatusToFundWiseStatus(
  status: "Draft" | "Active" | "Rejected" | "Approved" | "Executing" | "Executed" | "Cancelled"
): FundWiseProposalStatus {
  if (status === "Approved") return "approved"
  if (status === "Rejected") return "rejected"
  if (status === "Executed") return "executed"
  if (status === "Cancelled") return "cancelled"
  return "pending"
}
