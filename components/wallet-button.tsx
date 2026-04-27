"use client"

import { Button } from "@/components/ui/button"
import { AppEntryButton } from "@/components/app-entry-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Wallet,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { usePathname } from "next/navigation"
import { getSolanaExplorerAddressUrl } from "@/lib/solana-cluster"
import Link from "next/link"

export function WalletButton() {
  const [mounted, setMounted] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const pathname = usePathname()
  const { publicKey, disconnect, connected, connecting } = useWallet()
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

  const isAppRoute = pathname.startsWith("/groups")

  if (connecting) {
    return (
      <Button
        type="button"
        size="sm"
        disabled
        className="min-h-10 rounded-full border border-brand-border-c bg-background/80 px-4 text-brand-text-2 shadow-none"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  if (connected && publicKey) {
    const address = publicKey.toString()
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`
    const explorerUrl = getSolanaExplorerAddressUrl(address)

    const handleCopyAddress = async () => {
      try {
        await navigator.clipboard.writeText(address)
        setCopiedAddress(true)
        window.setTimeout(() => setCopiedAddress(false), 1500)
      } catch {
        setCopiedAddress(false)
      }
    }

    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
        {!isAppRoute && (
          <Button
            asChild
            size="sm"
            className="min-h-10 rounded-full bg-brand-grad px-3 sm:px-4 font-bold tracking-tight text-white transition-[transform,box-shadow,filter] duration-150 ease-out hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_24px_rgba(13,107,58,0.25)]"
          >
            <Link href="/groups">
              <span className="sm:hidden">Open</span>
              <span className="hidden sm:inline">Open Groups</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-10 rounded-full border-brand-border-c bg-background/90 px-3 text-brand-text shadow-none transition-[border-color,background-color,color] duration-150 ease-out hover:border-accent/30 hover:bg-brand-surface hover:text-foreground sm:px-4"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              <span className="font-mono text-sm tabular-nums">{shortAddress}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Connected wallet</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleCopyAddress}>
              {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedAddress ? "Copied address" : "Copy address"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={explorerUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                View on explorer
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
      {!isAppRoute && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setVisible(true)}
          className="hidden min-h-10 rounded-full border-brand-border-c bg-transparent font-semibold text-brand-text-2 shadow-none transition-[border-color,background-color,color] duration-150 ease-out hover:bg-brand-surface hover:text-foreground sm:inline-flex"
        >
          Sign in
        </Button>
      )}
      {isAppRoute ? (
        <Button
          type="button"
          size="sm"
          className="min-h-10 rounded-full bg-brand-grad px-3 sm:px-4 font-bold tracking-tight text-white transition-[transform,box-shadow,filter] duration-150 ease-out hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_24px_rgba(13,107,58,0.25)]"
          onClick={() => setVisible(true)}
        >
          <Wallet className="h-4 w-4" />
          Connect wallet
        </Button>
      ) : (
        <AppEntryButton
          disconnectedLabel="Launch app"
          connectedLabel="Open your Groups"
          navigateAfterConnect
          className="min-h-10 rounded-full px-3 text-sm sm:px-4"
        />
      )}
    </div>
  )
}
