"use client"

import type React from "react"
import { SolanaWalletProvider } from "./solana-wallet-provider"
import { WebMcpProvider } from "./webmcp-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletProvider>
      <WebMcpProvider />
      {children}
    </SolanaWalletProvider>
  )
}
