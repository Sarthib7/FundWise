/**
 * SOLANA TRANSACTION DIAGNOSTICS
 *
 * Test simple wallet-to-wallet transactions to verify Solana connectivity
 * and wallet integration before testing complex group payment flows
 */

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"
export const connection = new Connection(SOLANA_RPC_URL, "confirmed")

export interface SolanaTestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

/**
 * TEST 1: RPC Connection Test
 */
export async function testRPCConnection(): Promise<SolanaTestResult> {
  console.log('🧪 [Solana] Testing RPC connection...')

  try {
    const version = await connection.getVersion()
    console.log('✅ [Solana] RPC connected, version:', version)

    const slot = await connection.getSlot()
    console.log('✅ [Solana] Current slot:', slot)

    return {
      test: 'RPC Connection',
      status: 'PASS',
      message: `Connected to Solana RPC: ${SOLANA_RPC_URL}`,
      details: { version, slot, rpcUrl: SOLANA_RPC_URL }
    }
  } catch (error) {
    return {
      test: 'RPC Connection',
      status: 'FAIL',
      message: `Failed to connect to Solana RPC: ${error instanceof Error ? error.message : String(error)}`,
      details: { error, rpcUrl: SOLANA_RPC_URL }
    }
  }
}

/**
 * TEST 2: Wallet Connection Test
 */
export async function testWalletConnection(): Promise<SolanaTestResult> {
  console.log('🧪 [Solana] Testing wallet connection...')

  try {
    if (typeof window === 'undefined') {
      return {
        test: 'Wallet Connection',
        status: 'WARN',
        message: 'Running in server environment, cannot test wallet'
      }
    }

    const solanaWallet = (window as any).solana
    if (!solanaWallet) {
      return {
        test: 'Wallet Connection',
        status: 'FAIL',
        message: 'No Solana wallet detected. Please install Phantom or Solflare.',
        details: { hint: 'Install Phantom: https://phantom.app/' }
      }
    }

    console.log('✅ [Solana] Wallet detected:', solanaWallet.isPhantom ? 'Phantom' : 'Other')

    if (!solanaWallet.isConnected) {
      return {
        test: 'Wallet Connection',
        status: 'WARN',
        message: 'Wallet detected but not connected. Please click "Connect Wallet"',
        details: { walletType: solanaWallet.isPhantom ? 'Phantom' : 'Other' }
      }
    }

    const publicKey = solanaWallet.publicKey?.toString()
    if (!publicKey) {
      return {
        test: 'Wallet Connection',
        status: 'FAIL',
        message: 'Wallet connected but no public key available'
      }
    }

    console.log('✅ [Solana] Wallet connected:', publicKey)

    return {
      test: 'Wallet Connection',
      status: 'PASS',
      message: `Wallet connected successfully`,
      details: {
        publicKey,
        walletType: solanaWallet.isPhantom ? 'Phantom' : 'Other'
      }
    }
  } catch (error) {
    return {
      test: 'Wallet Connection',
      status: 'FAIL',
      message: `Wallet check failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    }
  }
}

/**
 * TEST 3: Wallet Balance Test
 */
export async function testWalletBalance(walletAddress?: string): Promise<SolanaTestResult> {
  console.log('🧪 [Solana] Testing wallet balance...')

  try {
    let publicKey: PublicKey

    if (walletAddress) {
      publicKey = new PublicKey(walletAddress)
    } else if (typeof window !== 'undefined' && (window as any).solana?.publicKey) {
      publicKey = (window as any).solana.publicKey
    } else {
      return {
        test: 'Wallet Balance',
        status: 'WARN',
        message: 'No wallet address provided and no wallet connected'
      }
    }

    const balance = await connection.getBalance(publicKey)
    const solBalance = balance / LAMPORTS_PER_SOL

    console.log('✅ [Solana] Wallet balance:', solBalance, 'SOL')

    if (solBalance < 0.001) {
      return {
        test: 'Wallet Balance',
        status: 'WARN',
        message: `Wallet balance is very low: ${solBalance} SOL`,
        details: {
          publicKey: publicKey.toString(),
          balance: solBalance,
          lamports: balance,
          hint: 'Get devnet SOL from https://faucet.solana.com/'
        }
      }
    }

    return {
      test: 'Wallet Balance',
      status: 'PASS',
      message: `Wallet has ${solBalance.toFixed(4)} SOL`,
      details: {
        publicKey: publicKey.toString(),
        balance: solBalance,
        lamports: balance
      }
    }
  } catch (error) {
    return {
      test: 'Wallet Balance',
      status: 'FAIL',
      message: `Failed to check wallet balance: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    }
  }
}

/**
 * TEST 4: Simple Transaction Test (requires wallet to be connected)
 */
export async function testSimpleTransaction(
  testRecipient?: string
): Promise<SolanaTestResult> {
  console.log('🧪 [Solana] Testing simple transaction...')

  try {
    if (typeof window === 'undefined') {
      return {
        test: 'Simple Transaction',
        status: 'WARN',
        message: 'Running in server environment, cannot test transactions'
      }
    }

    const solanaWallet = (window as any).solana
    if (!solanaWallet || !solanaWallet.isConnected) {
      return {
        test: 'Simple Transaction',
        status: 'WARN',
        message: 'Wallet not connected. Cannot test transactions.'
      }
    }

    const fromPubkey = solanaWallet.publicKey as PublicKey
    const balance = await connection.getBalance(fromPubkey)

    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      return {
        test: 'Simple Transaction',
        status: 'FAIL',
        message: 'Insufficient balance to test transaction (need at least 0.01 SOL)',
        details: { balance: balance / LAMPORTS_PER_SOL }
      }
    }

    // Use provided recipient or self-transfer
    const toPubkey = testRecipient
      ? new PublicKey(testRecipient)
      : fromPubkey

    console.log('[Solana] Creating test transaction...')
    console.log('[Solana] From:', fromPubkey.toString())
    console.log('[Solana] To:', toPubkey.toString())
    console.log('[Solana] Amount: 0.001 SOL')

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 0.001 * LAMPORTS_PER_SOL // Tiny test amount
      })
    )

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey

    console.log('[Solana] Requesting wallet signature...')

    let signature: string

    if (solanaWallet.signAndSendTransaction) {
      const result = await solanaWallet.signAndSendTransaction(transaction)
      signature = result.signature
    } else if (solanaWallet.signTransaction) {
      const signedTx = await solanaWallet.signTransaction(transaction)
      signature = await connection.sendRawTransaction(signedTx.serialize())
    } else {
      return {
        test: 'Simple Transaction',
        status: 'FAIL',
        message: 'Wallet does not support transaction signing'
      }
    }

    console.log('[Solana] ⏳ Transaction sent:', signature)
    console.log('[Solana] Confirming...')

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed')

    if (confirmation.value.err) {
      return {
        test: 'Simple Transaction',
        status: 'FAIL',
        message: `Transaction failed: ${confirmation.value.err}`,
        details: { signature, error: confirmation.value.err }
      }
    }

    console.log('[Solana] ✅ Transaction confirmed!')

    return {
      test: 'Simple Transaction',
      status: 'PASS',
      message: 'Simple transaction successful',
      details: {
        signature,
        from: fromPubkey.toString(),
        to: toPubkey.toString(),
        amount: 0.001,
        explorerUrl: `https://solscan.io/tx/${signature}?cluster=devnet`
      }
    }
  } catch (error: any) {
    if (error.message?.includes('User rejected')) {
      return {
        test: 'Simple Transaction',
        status: 'WARN',
        message: 'Transaction cancelled by user',
        details: { error: error.message }
      }
    }

    return {
      test: 'Simple Transaction',
      status: 'FAIL',
      message: `Transaction failed: ${error.message || error}`,
      details: { error }
    }
  }
}

/**
 * RUN ALL SOLANA DIAGNOSTICS
 */
export async function runAllSolanaDiagnostics(testRecipient?: string): Promise<SolanaTestResult[]> {
  console.log('🔬 ========================================')
  console.log('🔬 SOLANA DIAGNOSTIC TEST SUITE')
  console.log('🔬 ========================================\n')

  const results: SolanaTestResult[] = []

  // Test 1: RPC Connection
  console.log('TEST 1: RPC Connection')
  const rpcResult = await testRPCConnection()
  results.push(rpcResult)
  console.log(`${rpcResult.status === 'PASS' ? '✅' : '❌'} ${rpcResult.message}\n`)

  if (rpcResult.status === 'FAIL') {
    console.log('❌ RPC connection failed, skipping other tests\n')
    return results
  }

  // Test 2: Wallet Connection
  console.log('TEST 2: Wallet Connection')
  const walletResult = await testWalletConnection()
  results.push(walletResult)
  console.log(`${walletResult.status === 'PASS' ? '✅' : walletResult.status === 'WARN' ? '⚠️' : '❌'} ${walletResult.message}\n`)

  if (walletResult.status !== 'PASS') {
    console.log('⚠️ Wallet not connected, skipping transaction tests\n')
    return results
  }

  // Test 3: Wallet Balance
  console.log('TEST 3: Wallet Balance')
  const balanceResult = await testWalletBalance()
  results.push(balanceResult)
  console.log(`${balanceResult.status === 'PASS' ? '✅' : balanceResult.status === 'WARN' ? '⚠️' : '❌'} ${balanceResult.message}\n`)

  // Test 4: Simple Transaction (optional, only if user confirms)
  console.log('TEST 4: Simple Transaction (requires user confirmation)')
  console.log('This test will send 0.001 SOL and requires wallet approval\n')

  // Summary
  console.log('🔬 ========================================')
  console.log('🔬 SOLANA DIAGNOSTIC SUMMARY')
  console.log('🔬 ========================================')
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const warned = results.filter(r => r.status === 'WARN').length
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warned: ${warned}`)
  console.log('🔬 ========================================\n')

  return results
}
