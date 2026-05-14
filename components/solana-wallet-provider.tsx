"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { isSolanaMainnetCluster } from "@/lib/solana-cluster"
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base"

import "@solana/wallet-adapter-react-ui/styles.css"

function LifiProvider({ children }: { children: React.ReactNode }) {
  const { wallet } = useWallet()

  useEffect(() => {
    if (!isSolanaMainnetCluster()) {
      return
    }

    let cancelled = false

    import("@/lib/lifi-config")
      .then(async ({ ensureLifiChainsLoaded, setLifiSolanaProvider }) => {
        if (cancelled) {
          return
        }

        setLifiSolanaProvider((wallet?.adapter as SignerWalletAdapter) || null)
        await ensureLifiChainsLoaded()
      })
      .catch((error) => {
        console.error("[FundWise] Failed to initialize LI.FI:", error)
      })

    return () => {
      cancelled = true
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
