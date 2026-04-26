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
      <div className="flex items-center justify-end gap-2">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="hidden h-10 w-28 animate-pulse rounded-lg bg-muted sm:block" />
      </div>
    )
  }

  if (connected && publicKey) {
    const address = publicKey.toString()
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`

    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        <Button
          asChild
          size="sm"
          className="min-h-10 px-3 sm:px-4 bg-brand-grad font-bold tracking-tight text-white transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_24px_rgba(13,107,58,0.25)]"
        >
          <Link href="/groups">
            <span className="sm:hidden">Open</span>
            <span className="hidden sm:inline">Launch app</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="min-h-10 px-3 sm:px-4 bg-brand-grad font-bold text-white transition-all hover:brightness-110"
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
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setVisible(true)}
        className="hidden min-h-10 border-brand-border-c bg-transparent font-semibold text-brand-text-2 transition-all hover:bg-brand-surface hover:text-foreground sm:inline-flex"
      >
        Sign in
      </Button>
      <Button
        size="sm"
        className="min-h-10 px-3 sm:px-4 bg-brand-grad font-bold tracking-tight text-white transition-all hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_24px_rgba(13,107,58,0.25)]"
        onClick={() => setVisible(true)}
      >
        <Wallet className="h-4 w-4 mr-1.5" />
        <span className="sm:hidden">Connect</span>
        <span className="hidden sm:inline">Launch app</span>
      </Button>
    </div>
  )
}
