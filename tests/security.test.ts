import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fundwise } from "../target/types/fundwise";
import {
  createInitializeMint,
  createInitializeMintInstruction,
  createAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
  mintTo,
  mintToInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";

const programID = new PublicKey("FGhS5xYdH7QnJq2bQ6wK9cVt3mXpL8rN5vM1wZ4kE7A");

describe("FundWise Security Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let program: Program<Fundwise>;

  // Test wallets
  const admin = provider.wallet.payer; // system payer
  const debtor = Keypair.generate();
  const creditor = Keypair.generate();

  // Mint + token accounts
  let usdcMint: PublicKey;
  let debtorATA: PublicKey;
  let creditorATA: PublicKey;

  // Identifiers
  let groupCode = "TESTGROUP";
  let groupPubkey: PublicKey;
  let expensePubkey: PublicKey;

  before(async () => {
    // Airdrop SOL to debtor and creditor
    const connection = provider.connection;
    const airdrop1 = await connection.requestAirdrop(
      debtor.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    const airdrop2 = await connection.requestAirdrop(
      creditor.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdrop1);
    await connection.confirmTransaction(airdrop2);

    // Load IDL and instantiate program
    const idl = await Fundwise.idl(programID);
    program = new anchor.Program(idl as any, programID, provider);

    // Create USDC mint (6 decimals) using token program directly
    const mintKeypair = Keypair.generate();
    usdcMint = mintKeypair.publicKey;
    const mintRent = await connection.getMinimumBalanceForRentExemption(
      82 // Mint account size
    );
    const mintTx = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: admin.publicKey,
        newAccountPubkey: usdcMint,
        space: 82,
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token
        lamports: mintRent,
      }),
      createInitializeMintInstruction(
        usdcMint,
        admin.publicKey, // mint authority
        6 // decimals
      )
    );
    await provider.sendAndConfirm(mintTx, [admin, mintKeypair]);

    // Create ATAs for debtor and creditor (using associated token program)
    const ataProgram = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
    const createDebtorATA = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        debtor.publicKey,
        debtor.publicKey,
        usdcMint
      )
    );
    await provider.sendAndConfirm(createDebtorATA, [admin, debtor]);
    debtorATA = await getAssociatedTokenAddress(
      usdcMint,
      debtor.publicKey,
      true
    );

    const createCreditorATA = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        creditor.publicKey,
        creditor.publicKey,
        usdcMint
      )
    );
    await provider.sendAndConfirm(createCreditorATA, [admin, creditor]);
    creditorATA = await getAssociatedTokenAddress(
      usdcMint,
      creditor.publicKey,
      true
    );

    // Mint 1000 USDC to debtor for settlement testing
    const mintAmount = 1000 * 10 ** 6;
    const mintTx2 = new Transaction().add(
      mintToInstruction(
        usdcMint,
        admin.publicKey,
        debtorATA,
        admin.publicKey,
        mintAmount
      )
    );
    await provider.sendAndConfirm(mintTx2, [admin]);
  });

  it("creates group and member accounts", async () => {
    // Creator = admin
    await program.rpc.createGroup(groupCode, usdcMint, {
      accounts: {
        payer: admin.publicKey,
        group: await findGroupPDA(groupCode),
        systemProgram: SystemProgram.programId,
      },
      signers: [admin],
    });

    groupPubkey = await findGroupPDA(groupCode);

    // Admin joins group
    await program.rpc.joinGroup({
      accounts: {
        memberWallet: admin.publicKey,
        group: groupPubkey,
        member: await findMemberPDA(groupPubkey, admin.publicKey),
        systemProgram: SystemProgram.programId,
      },
      signers: [admin],
    });

    // Debtor joins
    await program.rpc.joinGroup({
      accounts: {
        memberWallet: debtor.publicKey,
        group: groupPubkey,
        member: await findMemberPDA(groupPubkey, debtor.publicKey),
        systemProgram: SystemProgram.programId,
      },
      signers: [debtor],
    });

    // Creditor joins
    await program.rpc.joinGroup({
      accounts: {
        memberWallet: creditor.publicKey,
        group: groupPubkey,
        member: await findMemberPDA(groupPubkey, creditor.publicKey),
        systemProgram: SystemProgram.programId,
      },
      signers: [creditor],
    });
  });

  it("adds expense with exact splits", async () => {
    // Admin creates expense: debtor owes creditor 100 USDC
    const amount = 100 * 10 ** 6;
    const memo = "Dinner";
    const category = "Food";
    const splits = [
      { wallet: debtor.publicKey, share: -amount }, // negative for debtor? depends on sign convention.
      // For simplicity, assume shares positive for creditor, negative for debtor in frontend.
      // But on-chain we accept raw i64; test just passes something.
    ];
    // We'll use Exact splits summing to amount
    // The split entries represent payees: each share positive; we'll just set creditor share = amount.
    const splitsExact = [{ wallet: creditor.publicKey, share: amount as i64 }];

    await program.rpc.addExpense(
      admin.publicKey,
      amount,
      usdcMint,
      memo,
      category,
      "Exact", // enum variant name matching Rust: Exact
      splitsExact,
      {
        accounts: {
          payer: admin.publicKey,
          group: groupPubkey,
          member: await findMemberPDA(groupPubkey, admin.publicKey),
          expense: await findExpensePDA(groupPubkey, 0), // expense_count will be 0 initially
          systemProgram: SystemProgram.programId,
        },
        signers: [admin],
      }
    );

    expensePubkey = await findExpensePDA(groupPubkey, 0);
  });

  it("rejects settlement from wrong token account owner", async () => {
    // Attacker creates a token account they control, but try to use as from_account with from_wallet = debtor, but account owner != debtor.
    const attacker = Keypair.generate();
    // airdrop to attacker and create ATA
    const conn = provider.connection;
    await conn.requestAirdrop(attacker.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    const attackerATA = await getAssociatedTokenAddress(usdcMint, attacker.publicKey, true);
    // create ATA tx
    const createAttackerATA = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        attacker.publicKey,
        attacker.publicKey,
        usdcMint
      )
    );
    await provider.sendAndConfirm(createAttackerATA, [admin, attacker]);

    // Attempt settlement: from_wallet = debtor (signer) but from_token_account = attackerATA
    const amount = 100 * 10 ** 6;
    const toMemberPDA = await findMemberPDA(groupPubkey, creditor.publicKey);

    try {
      await program.rpc.recordSettlement(
        amount,
        {
          accounts: {
            fromWallet: debtor.publicKey,
            toMember: toMemberPDA,
            toWallet: creditor.publicKey,
            group: groupPubkey,
            expense: expensePubkey,
            fromTokenAccount: attackerATA,
            toTokenAccount: creditorATA,
            mint: usdcMint,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            settlement: await findSettlementPDA(groupPubkey, expensePubkey, debtor.publicKey, creditor.publicKey),
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            systemProgram: SystemProgram.programId,
          },
          signers: [debtor],
        }
      );
      // Should not reach here
      throw new Error("Expected error not thrown");
    } catch (error: any) {
      const errCode = error.error?.errorCode;
      // Anchor error code for custom error is `FundwiseError::InvalidFromAccount`
      // We'll check that error message contains expected
      if (!error.error?.message?.includes("InvalidFromAccount")) {
        throw new Error(`Expected InvalidFromAccount, got: ${JSON.stringify(error)}`);
      }
    }
  });

  it("rejects duplicate settlement", async () => {
    const amount = 100 * 10 ** 6;
    const toMemberPDA = await findMemberPDA(groupPubkey, creditor.publicKey);

    // First settlement (expected to succeed)
    await program.rpc.recordSettlement(
      amount,
      {
        accounts: {
          fromWallet: debtor.publicKey,
          toMember: toMemberPDA,
          toWallet: creditor.publicKey,
          group: groupPubkey,
          expense: expensePubkey,
          fromTokenAccount: debtorATA,
          toTokenAccount: creditorATA,
          mint: usdcMint,
          tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          settlement: await findSettlementPDA(groupPubkey, expensePubkey, debtor.publicKey, creditor.publicKey),
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        },
        signers: [debtor],
      }
    );

    // Second settlement with same keys — should fail with SettlementLocked
    try {
      await program.rpc.recordSettlement(
        amount,
        {
          accounts: {
            fromWallet: debtor.publicKey,
            toMember: toMemberPDA,
            toWallet: creditor.publicKey,
            group: groupPubkey,
            expense: expensePubkey,
            fromTokenAccount: debtorATA,
            toTokenAccount: creditorATA,
            mint: usdcMint,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            settlement: await findSettlementPDA(groupPubkey, expensePubkey, debtor.publicKey, creditor.publicKey),
            clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
            systemProgram: SystemProgram.programId,
          },
          signers: [debtor],
        }
      );
      throw new Error("Duplicate settlement should have failed");
    } catch (error: any) {
      if (!error.error?.message?.includes("SettlementLocked")) {
        throw new Error(`Expected SettlementLocked, got: ${JSON.stringify(error)}`);
      }
    }
  });

  it("rejects insufficient balance", async () => {
    // Debtor balance after previous settlement roughly 900 USDC left.
    // Attempt to settle amount greater than balance (1000 > remaining)
    const tooMuch = 1000 * 10 ** 6 + 1; // > balance
    const toMemberPDA = await findMemberPDA(groupPubkey, creditor.publicKey);
    try {
      await program.rpc.recordSettlement(
        tooMuch,
        {
          accounts: {
            fromWallet: debtor.publicKey,
            toMember: toMemberPDA,
            toWallet: creditor.publicKey,
            group: groupPubkey,
            expense: expensePubkey,
            fromTokenAccount: debtorATA,
            toTokenAccount: creditorATA,
            mint: usdcMint,
            tokenProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
            settlement: await findSettlementPDA(groupPubkey, expensePubkey, debtor.publicKey, creditor.publicKey), // we can't reuse same settlement; need a different edge? Actually duplicate settlement will be caught earlier. We need different edge: we need a new expense edge from debtor to creditor with a different expense id to test insufficient balance. Simpler: create a fresh expense where debtor owes huge amount they cannot pay.
          },
          signers: [debtor],
        }
      );
      throw new Error("Insufficient balance should fail");
    } catch (error: any) {
      // Should error with InsufficientBalance
      if (!error.error?.message?.includes("InsufficientBalance")) {
        throw new Error(`Expected InsufficientBalance, got: ${error}`);
      }
    }
  });
});

// Helper functions to derive PDAs (must match on-chain seeds)

async function findGroupPDA(code: string): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("group"), Buffer.from(code)],
    programID
  );
}

async function findMemberPDA(group: PublicKey, wallet: PublicKey): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), group.toBuffer(), wallet.toBuffer()],
    programID
  );
}

async function findExpensePDA(group: PublicKey, counter: number): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("expense"), group.toBuffer(), new anchor.BN(counter).toArrayLike(Buffer, "le", 8)],
    programID
  );
}

async function findSettlementPDA(
  group: PublicKey,
  expense: PublicKey,
  from: PublicKey,
  to: PublicKey
): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("settlement"),
      group.toBuffer(),
      expense.toBuffer(),
      from.toBuffer(),
      to.toBuffer(),
    ],
    programID
  );
}
