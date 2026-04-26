import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fundwise } from "../target/types/fundwise";
import { Keypair } from "@solana/web3.js";
import fs from "fs";
import path from "path";

describe("fundwise", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fundwise as Program<Fundwise>;
  const wallet = provider.wallet.publicKey;

  it("Can create a group", async () => {
    const groupCode = "TEST01";
    const stablecoinMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // USDC devnet

    const tx = await program.methods
      .createGroup(groupCode, stablecoinMint)
      .accounts({
        group: getGroupPDA(groupCode),
        member: getMemberPDA(groupCode, wallet),
        creator: wallet,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Group created:", tx);
  });

  // Helper: derive group PDA
  function getGroupPDA(code: string): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("group"), Buffer.from(code.toUpperCase())],
      program.programId
    );
    return pda;
  }

  // Helper: derive member PDA
  function getMemberPDA(groupCode: string, wallet: PublicKey): PublicKey {
    const groupPDA = getGroupPDA(groupCode);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), groupPDA.toBuffer(), wallet.toBuffer()],
      program.programId
    );
    return pda;
  }
});
