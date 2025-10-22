"use client"

import type React from "react"
import { PrivyProvider } from "@privy-io/react-auth"

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  console.log("[FundFlow] Providers component loaded")
  console.log("[FundFlow] Privy App ID:", appId ? "Set" : "Not set")

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
              <li>
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
              <li>Create a new app or select an existing one</li>
              <li>Copy your App ID from the settings</li>
              <li>Add it to your environment variables in the Vars section</li>
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
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
