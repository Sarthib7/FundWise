"use client"

import { Button } from "@/components/ui/button"
import { Wallet, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/avatar"
import { useEffect, useState } from "react"
// PHASE 1: Using Solana Wallet Adapter (Active)
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"

export function WalletButton() {
  const [mounted, setMounted] = useState(false)
  // Solana Wallet Adapter hooks
  const { publicKey, disconnect, connected } = useWallet()
  const { setVisible } = useWalletModal()

  // Only show actual content after client-side mount to prevent SSR issues
  useEffect(() => {
    setMounted(true)
  }, [])

  console.log("[FundFlow] WalletButton render - connected:", connected, "mounted:", mounted)
  console.log("[FundFlow] PublicKey:", publicKey?.toString())

  // Show loading during SSR and initial mount
  if (!mounted) {
    return (
      <Button size="sm" variant="outline" disabled>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          Loading...
        </div>
      </Button>
    )
  }

  // Wallet connected
  if (connected && publicKey) {
    const address = publicKey.toString()
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`
    console.log("[FundFlow] Wallet connected:", address)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <UserAvatar
              name={address}
              id={address}
              size={16}
              className="h-4 w-4 mr-2"
            />
            {shortAddress}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => disconnect()}>
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Not connected - show connect button
  const handleConnect = () => {
    console.log("[FundFlow] Connect Wallet button clicked")
    setVisible(true) // Opens wallet selection modal
  }

  return (
    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleConnect}>
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  )
}

// =============================================================================
// PRIVY VERSION (Commented out - replaced with Solana Wallet Adapter)
// =============================================================================
/*
import { usePrivy, useWallets } from "@privy-io/react-auth"

export function WalletButton() {
  const [mounted, setMounted] = useState(false)
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets } = useWallets()

  useEffect(() => {
    setMounted(true)
  }, [])

  console.log("[FundFlow] WalletButton render - ready:", ready, "authenticated:", authenticated, "mounted:", mounted)
  console.log("[FundFlow] Wallets:", wallets)

  if (!mounted || !ready) {
    console.log("[FundFlow] Privy not ready yet or not mounted")
    return (
      <Button size="sm" variant="outline" disabled>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          Loading...
        </div>
      </Button>
    )
  }

  const connectedWallet = wallets.find((wallet) => wallet.address)

  if (authenticated && connectedWallet) {
    console.log("[FundFlow] User authenticated with wallet:", connectedWallet.address)
    const address = connectedWallet.address
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <UserAvatar
              name={address}
              id={address}
              size={16}
              className="h-4 w-4 mr-2"
            />
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
*/
