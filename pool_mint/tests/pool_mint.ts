import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PoolMint } from "../target/types/pool_mint";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

describe("pool_mint", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PoolMint as Program<PoolMint>;
  const provider = anchor.getProvider();

  it("Initialize pool and transfer tokens", async () => {
    // Create test accounts
    const user = Keypair.generate();
    const poolWallet = Keypair.generate();
    
    // Airdrop SOL to accounts
    await provider.connection.requestAirdrop(user.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(poolWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for airdrop to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a test token mint
    const mint = await createMint(
      provider.connection,
      user,
      user.publicKey,
      null,
      6 // USDC has 6 decimals
    );

    // Create user token account
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      user.publicKey,
      false
    );

    // Create user's associated token account
    const createUserTokenAccountIx = createAssociatedTokenAccountInstruction(
      user.publicKey, // payer
      userTokenAccount, // associatedToken
      user.publicKey, // owner
      mint // mint
    );

    // Create pool token account
    const poolTokenAccount = await getAssociatedTokenAddress(
      mint,
      poolWallet.publicKey,
      false
    );

    // Create pool's associated token account
    const createPoolTokenAccountIx = createAssociatedTokenAccountInstruction(
      user.publicKey, // payer
      poolTokenAccount, // associatedToken
      poolWallet.publicKey, // owner
      mint // mint
    );

    // Mint tokens to user
    const mintToUserIx = await mintTo(
      provider.connection,
      user,
      mint,
      userTokenAccount,
      user,
      1000000 // 1 USDC (6 decimals)
    );

    // Initialize pool
    const groupId = "TEST123";
    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), Buffer.from(groupId)],
      program.programId
    );

    const initPoolTx = await program.methods
      .initializePool(groupId)
      .accounts({
        pool: poolPDA,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    console.log("Pool initialized:", initPoolTx);

    // Transfer tokens
    const transferAmount = 500000; // 0.5 USDC

    const transferTx = await program.methods
      .transferTokens(new anchor.BN(transferAmount))
      .accounts({
        user: user.publicKey,
        fromTokenAccount: userTokenAccount,
        toTokenAccount: poolTokenAccount,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log("Tokens transferred:", transferTx);

    // Verify balances
    const userAccountInfo = await getAccount(provider.connection, userTokenAccount);
    const poolAccountInfo = await getAccount(provider.connection, poolTokenAccount);

    console.log("User token balance:", userAccountInfo.amount.toString());
    console.log("Pool token balance:", poolAccountInfo.amount.toString());

    // Assertions
    assert.equal(userAccountInfo.amount.toString(), "500000"); // 0.5 USDC remaining
    assert.equal(poolAccountInfo.amount.toString(), "500000"); // 0.5 USDC transferred
  });
});
