"use client"

import { Button } from "@/components/ui/button"
import { Wallet, LogOut, ArrowRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import Link from "next/link"

export function WalletButton() {
  const [mounted, setMounted] = useState(false)
  const { publicKey, disconnect, connected } = useWallet()
  const { setVisible } = useWalletModal()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 rounded-lg bg-muted animate-pulse" />
        <div className="h-9 w-28 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  if (connected && publicKey) {
    const address = publicKey.toString()
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`

    return (
      <div className="flex items-center gap-2">
        <Link href="/groups">
          <Button
            size="sm"
            className="bg-brand-grad text-white hover:brightness-110 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(13,107,58,0.25)] transition-all font-bold tracking-tight"
          >
            Launch app
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="bg-brand-grad text-white hover:brightness-110 transition-all font-bold"
            >
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
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => setVisible(true)}
        className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-brand-text-2 border border-brand-border-c hover:bg-brand-surface hover:text-foreground transition-all"
      >
        Sign in
      </button>
      <Button
        size="sm"
        className="bg-brand-grad text-white hover:brightness-110 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(13,107,58,0.25)] transition-all font-bold tracking-tight"
        onClick={() => setVisible(true)}
      >
        <Wallet className="h-4 w-4 mr-1.5" />
        Launch app
      </Button>
    </div>
  )
}
