"use client"

import type React from "react"
import { SolanaWalletProvider } from "./solana-wallet-provider"
import { TelegramWebAppProvider } from "./telegram-webapp-provider"
import { ThemeProvider } from "./theme-provider"
import { WebMcpProvider } from "./webmcp-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TelegramWebAppProvider>
        <SolanaWalletProvider>
          <WebMcpProvider />
          {children}
        </SolanaWalletProvider>
      </TelegramWebAppProvider>
    </ThemeProvider>
  )
}
