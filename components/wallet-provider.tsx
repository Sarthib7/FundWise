"use client"

import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css')

interface SolanaWalletProviderProps {
  children: ReactNode
}

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
  // Use devnet
  const network = WalletAdapterNetwork.Devnet

  // Get RPC URL from env or use devnet
  const endpoint = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    if (rpcUrl) {
      console.log('[Wallet] Using RPC:', rpcUrl)
      return rpcUrl
    }
    console.log('[Wallet] Using default devnet RPC')
    return clusterApiUrl(network)
  }, [network])

  // Configure wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ],
    [network]
  )

  console.log('[Wallet] Initializing Solana Wallet Adapter')
  console.log('[Wallet] Network:', network)
  console.log('[Wallet] RPC Endpoint:', endpoint)
  console.log('[Wallet] Wallets configured:', wallets.length)

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
