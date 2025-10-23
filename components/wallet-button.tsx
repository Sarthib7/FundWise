"use client"

import { Button } from "@/components/ui/button"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { Wallet, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function WalletButton() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  console.log("[FundFlow] WalletButton render - ready:", ready, "authenticated:", authenticated)
  console.log("[FundFlow] Wallets:", wallets)

  const connectedWallet = wallets.find((wallet) => wallet.address)

  if (!ready) {
    console.log("[FundFlow] Privy not ready yet")
    return (
      <Button size="sm" variant="outline" disabled>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          Loading...
        </div>
      </Button>
    )
  }

  if (authenticated && connectedWallet) {
    console.log("[FundFlow] User authenticated with wallet:", connectedWallet.address)
    const address = connectedWallet.address
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Wallet className="h-4 w-4 mr-2" />
            {shortAddress}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }


  const handleLogin = async () => {
    console.log("[FundFlow] Login button clicked")
    try {
      await login()
      console.log("[FundFlow] Login function called successfully")
    } catch (error) {
      console.error("[FundFlow] Error calling login:", error)
    }
  }

  console.log("[FundFlow] Showing Login button")
  return (
    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleLogin}>
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  )
}
