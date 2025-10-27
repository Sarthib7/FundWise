"use client"

import type React from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  // Fix hydration mismatch by only rendering on client after mount
  useEffect(() => {
    setMounted(true)
    console.log("[FundFlow] Providers component mounted")
    console.log("[FundFlow] Privy App ID:", appId ? "Set" : "Not set")
  }, [appId])

  // Return minimal loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  if (!appId) {
    console.log("[FundFlow] No Privy App ID found, showing configuration screen")
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Privy Configuration Required</h2>
          <p className="text-muted-foreground text-sm">
            To use FundFlow, you need to configure Privy authentication. Please add your Privy App ID to the environment
            variables.
          </p>
          <div className="bg-muted rounded p-3 space-y-2">
            <p className="text-xs font-mono text-foreground">NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here</p>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>To get your Privy App ID:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li key="step1">
                Go to{" "}
                <a
                  href="https://dashboard.privy.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  dashboard.privy.io
                </a>
              </li>
              <li key="step2">Create a new app or select an existing one</li>
              <li key="step3">Copy your App ID from the settings</li>
              <li key="step4">Add it to your environment variables in the Vars section</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  console.log("[FundFlow] Initializing PrivyProvider with App ID")

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#10b981",
        },
        supportedChains: [
          {
            id: 101, // Solana mainnet
            name: "Solana",
            network: "solana",
            nativeCurrency: {
              name: "Solana",
              symbol: "SOL",
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"],
              },
              public: {
                http: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"],
              },
            },
            blockExplorers: {
              default: {
                name: "Solscan",
                url: "https://solscan.io",
              },
            },
          },
        ],
        defaultChain: {
          id: 101, // Solana mainnet
          name: "Solana",
          network: "solana",
          nativeCurrency: {
            name: "Solana",
            symbol: "SOL",
            decimals: 9,
          },
          rpcUrls: {
            default: {
              http: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"],
            },
            public: {
              http: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com"],
            },
          },
          blockExplorers: {
            default: {
              name: "Solscan",
              url: "https://solscan.io",
            },
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
