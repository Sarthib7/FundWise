import { PublicKey, type AccountInfo } from "@solana/web3.js"
import * as multisig from "@sqds/multisig"
import { createFundWiseConnectionForCluster } from "@/lib/fallback-connection"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getFundModeCluster, parsePublicKey } from "./_internal"

export type SolanaAccountInfo = {
  data: Buffer
  owner: PublicKey
  executable: boolean
}

export type TreasuryAccountReader = {
  getAccountInfo(address: PublicKey, commitment: "confirmed"): Promise<SolanaAccountInfo | null>
}

export async function verifyFundModeTreasuryAddresses(
  data: {
    creatorWallet?: string
    multisigAddress: string
    treasuryAddress: string
  },
  accountReader: TreasuryAccountReader = createFundWiseConnectionForCluster(getFundModeCluster(), "confirmed")
) {
  const multisigPubkey = parsePublicKey(data.multisigAddress, "Multisig address")
  const treasuryPubkey = parsePublicKey(data.treasuryAddress, "Treasury address")
  const [expectedTreasuryPda] = multisig.getVaultPda({
    multisigPda: multisigPubkey,
    index: 0,
  })

  if (!treasuryPubkey.equals(expectedTreasuryPda)) {
    throw new FundWiseError("Treasury address does not match the Squads vault PDA for this Multisig.")
  }

  const multisigAccount = await accountReader.getAccountInfo(multisigPubkey, "confirmed")

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
