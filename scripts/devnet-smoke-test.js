const { Connection, clusterApiUrl, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const { Program, AnchorProvider, workspace } = require('@coral-xyz/anchor');

// Load wallet
const walletDir = path.join(process.env.HOME, '.config', 'solana');
const walletPath = path.join(walletDir, 'id.json');
let keypair;

if (fs.existsSync(walletPath)) {
  keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf8'))));
} else {
  console.error('Wallet not found at', walletPath);
  process.exit(1);
}

console.log('Public Key:', keypair.publicKey.toBase58());

// Connection
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Check balance
(async () => {
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  if (balance < 1000000000) { // < 1 SOL
    console.warn('Wallet needs at least 1 SOL for deployment rent.');
  }
})();

// Load IDL
const idl = require('../target/idl/fundwise.json');

// Program ID placeholder — after first deploy, update with real ID
const PROGRAM_ID = new PublicKey('FGhS5xYdH7QnJq2bQ6wK9cVt3mXpL8rN5vM1wZ4kE7A');

// Deploy (requires solana CLI — anchor deploy easier)
// This script is for smoke testing an already-deployed program
async function smokeTest() {
  const provider = new AnchorProvider(connection, { signer: keypair }, { commitment: 'confirmed' });
  const program = new Program(idl, PROGRAM_ID, provider);

  const groupCode = 'HERMES';
  const usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // USDC devnet

  try {
    const tx = await program.methods
      .createGroup(groupCode, usdcMint)
      .accounts({
        group: (await PublicKey.findProgramAddress([Buffer.from('group'), Buffer.from(groupCode)], PROGRAM_ID))[0],
        member: (await PublicKey.findProgramAddress([Buffer.from('member'), (await PublicKey.findProgramAddress([Buffer.from('group'), Buffer.from(groupCode)])[0]).toBuffer(), keypair.publicKey.toBuffer()], PROGRAM_ID))[0],
        creator: keypair.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('✅ create_group tx:', tx);
    console.log('View: https://explorer.solana.com/tx/' + tx + '?cluster=devnet');
  } catch (e) {
    console.error('❌ create_group failed:', e.message);
  }
}

smokeTest().catch(console.error);
