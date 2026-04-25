"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { initLifiConfig, setLifiSolanaProvider } from "@/lib/lifi-config"
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base"

import "@solana/wallet-adapter-react-ui/styles.css"

// Initialize LI.FI config once at module level
initLifiConfig()

function LifiProvider({ children }: { children: React.ReactNode }) {
  const { wallet } = useWallet()

  useEffect(() => {
    if (wallet?.adapter) {
      setLifiSolanaProvider(wallet.adapter as SignerWalletAdapter)
    }
  }, [wallet?.adapter])

  return <>{children}</>
}

export function SolanaWalletProvider({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet

  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    []
  )

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <LifiProvider>{children}</LifiProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
