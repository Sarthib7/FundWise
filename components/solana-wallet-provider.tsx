"use client"

import type React from "react"
import { useMemo } from "react"
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css"

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  // Use devnet
  const network = WalletAdapterNetwork.Devnet

  // RPC endpoint
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    []
  )

  // ONLY Solana wallets - NO ETHEREUM
  // Note: Only Phantom and Solflare, Backpack not available in this version
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  console.log("[SolanaWallet] Initializing Solana Wallet Adapter")
  console.log("[SolanaWallet] Network:", network)
  console.log("[SolanaWallet] RPC:", endpoint)
  console.log("[SolanaWallet] Wallets:", wallets.length, "Solana wallets (Phantom, Solflare)")
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
