/**
 * Swap Usage Examples — FundWise Settlement
 *
 * This file demonstrates how to integrate SwapService into the settlement UI.
 * These patterns form the reference implementation for the settlement page.
 */

import { useWallet } from '@solana/wallet-adapter-react';
import { getSwapService, SOL_MINT, USDC_MINT } from '@/lib/swaps';
import { toast } from 'sonner';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Example 1: Direct settlement swap (per settlement edge)
// ---------------------------------------------------------------------------
export async function settleEdge({
  debtorWallet,
  creditorUSDCAddress,
  amountLamports,
  slippageBps = 100,
}: {
  debtorWallet: { publicKey: import('@solana/web3.js').PublicKey };
  creditorUSDCAddress: string;
  amountLamports: string;
  slippageBps?: number;
}) {
  const service = getSwapService();

  // 1. Preflight: show quote to user
  const bestInfo = await service.getBestRouteInfo({
    walletPublicKey: debtorWallet.publicKey,
    fromMint: SOL_MINT,
    toMint: USDC_MINT,
    fromAmount: amountLamports,
    toTokenAccount: new (await import('@solana/web3.js')).PublicKey(creditorUSDCAddress),
    slippageBps,
  });

  // 2. Confirm UI with rate + fee
  const confirmMessage = `Swap ${parseFloat(amountLamports) / 1e9} SOL → USDC\n` +
    `Best route: ${bestInfo.recommendedProvider} (${bestInfo.lifiQuote?.outAmountMin || bestInfo.jupiterQuote?.outAmountMin} min USDC)\n` +
    `Fee: ${bestInfo.lifiQuote?.feeBps || bestInfo.jupiterQuote?.feeBps || 0} bps\n` +
    `Continue?`;

  if (!confirm(confirmMessage)) {
    throw new Error('User cancelled settlement');
  }

  // 3. Execute
  toast.loading('Settlement swap in progress...');

  try {
    const result = await service.executeSettlementSwap({
      walletPublicKey: debtorWallet.publicKey,
      fromMint: SOL_MINT,
      toMint: USDC_MINT,
      fromAmount: amountLamports,
      toTokenAccount: creditorUSDCAddress,
      slippageBps,
    });

    toast.success(`Settlement successful! ${result.signature.slice(0, 8)}...`);
    return result;
  } catch (err: any) {
    if (err.code === 'EXECUTE_SLIPPAGE') {
      toast.error('Price moved — please retry with higher slippage');
    } else if (err.code === 'QUOTE_RATE_LIMIT') {
      toast.error('Aggregator busy — retrying...');
    } else {
      toast.error(err.message || 'Settlement failed');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Example 2: Bulk settlement (multiple edges parallel)
// ---------------------------------------------------------------------------
export async function settleMultipleEdges(edges: Array<{
  creditorAddress: string;
  amountLamports: string;
}>) {
  const results = await Promise.allSettled(
    edges.map(edge =>
      settleEdge({
        debtorWallet: window.solana, // or useWallet()
        creditorUSDCAddress: edge.creditorAddress,
        amountLamports: edge.amountLamports,
      }).catch(err => ({ error: err }))
    )
  );

  const successes = results.filter(r => r.status === 'fulfilled').length;
  const failures = results.length - successes;

  toast(`Settled ${successes} of ${results.length} edges`, {
    description: failures > 0 ? `${failures} failed — check errors` : 'All done',
  });

  return { successes, failures, results };
}

// ---------------------------------------------------------------------------
// Example 3: Jupiter direct path (if user chooses to skip LiFi)
// ---------------------------------------------------------------------------
export async function settleViaJupiterDirect({
  wallet,
  creditorUSDCAddress,
  amountLamports,
}: {
  wallet: { signTransaction: (tx: any) => Promise<any>; publicKey: any };
  creditorUSDCAddress: string;
  amountLamports: string;
}) {
  const jup = getJupiterProvider();
  const ctx = {
    walletPublicKey: wallet.publicKey,
    fromMint: SOL_MINT,
    toMint: USDC_MINT,
    fromAmount: amountLamports,
    toTokenAccount: new (await import('@solana/web3.js')).PublicKey(creditorUSDCAddress),
    slippageBps: 100,
  };

  // 1. Get quote + order (contains base64 tx)
  const quote = await jup.getQuote(ctx);

  // 2. Show confirmation with Jupiter-specific info
  if (!confirm(`Jupiter route: ${quote.routeDescription}\n` +
               `Out: ${quote.outAmountMin} USDC min\nFee: ${quote.feeBps} bps\nContinue?`)) {
    throw new Error('User cancelled');
  }

  // 3. Need full order response to get transaction + requestId
  //    Re-fetch to get these fields (quote sanitizes them away)
  const connection = new (await import('@solana/web3.js')).Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL!
  );
  const params = new URLSearchParams({
    inputMint: SOL_MINT.toBase58(),
    outputMint: USDC_MINT.toBase58(),
    amount: amountLamports,
    taker: wallet.publicKey.toBase58(),
    slippageBps: '100',
  });
  const orderRes = await fetch(`https://api.jup.ag/swap/v2/order?${params}`);
  const order = await orderRes.json();

  // 4. Decode + sign
  const txBytes = Buffer.from(order.transaction, 'base64');
  const { VersionedTransaction } = await import('@solana/web3.js');
  const tx = VersionedTransaction.deserialize(txBytes);
  const signed = await wallet.signTransaction(tx);
  const signedBase64 = Buffer.from(signed.serialize()).toString('base64');

  // 5. Execute
  const exec = await fetch('https://api.jup.ag/swap/v2/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signedTransaction: signedBase64,
      requestId: order.requestId,
    }),
  });
  const result = await exec.json();

  if (result.status === 'Success') {
    toast.success(`Settled via Jupiter: ${result.signature.slice(0,8)}...`);
    return { signature: result.signature, routeUsed: 'jupiter' };
  }

  throw new Error(`Jupiter failed: ${result.error}`);
}

// ---------------------------------------------------------------------------
// Example 4: Quote display component logic (for UI cards)
// ---------------------------------------------------------------------------
export function formatQuoteDisplay(quote: any) {
  const outUSDC = (parseFloat(quote.outAmountMin) / 1e6).toFixed(2); // USDC 6 decimals
  const inAsset = parseFloat(quote.inAmount) / 1e9; // SOL lamports → SOL
  const feeUSD = (parseFloat(quote.outAmountMin) * (quote.feeBps / 10000)).toFixed(2);
  const impact = quote.priceImpactPct.toFixed(2);

  return {
    summary: `${inAsset.toFixed(4)} SOL → ${outUSDC} USDC (min)`,
    fee: `${quote.feeBps} bps ($${feeUSD})`,
    impact: `${impact}%`,
    route: quote.routeDescription || quote.provider,
  };
}
