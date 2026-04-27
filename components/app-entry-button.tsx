"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { ArrowRight, Loader2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AppEntryButtonProps = {
  href?: string
  connectedLabel?: string
  disconnectedLabel?: string
  navigateAfterConnect?: boolean
  className?: string
}

export function AppEntryButton({
  href = "/groups",
  connectedLabel = "Open your Groups",
  disconnectedLabel = "Connect Wallet",
  navigateAfterConnect = false,
  className,
}: AppEntryButtonProps) {
  const router = useRouter()
  const { connected, connecting } = useWallet()
  const { setVisible } = useWalletModal()
  const [pendingNavigation, setPendingNavigation] = useState(false)

  useEffect(() => {
    if (!pendingNavigation || !connected) {
      return
    }

    setPendingNavigation(false)
    router.push(href)
  }, [connected, href, pendingNavigation, router])

  useEffect(() => {
    if (!pendingNavigation) {
      return
    }

    const timeout = window.setTimeout(() => {
      setPendingNavigation(false)
    }, 20_000)

    return () => window.clearTimeout(timeout)
  }, [pendingNavigation])

  const handleClick = () => {
    if (connected) {
      router.push(href)
      return
    }

    if (navigateAfterConnect) {
      setPendingNavigation(true)
    }

    setVisible(true)
  }

  const label = connecting ? "Connecting..." : connected ? connectedLabel : disconnectedLabel

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={connecting}
      className={cn(
        "min-h-12 rounded-[10px] bg-brand-grad px-7 py-3.5 text-base font-bold tracking-tight text-white transition-[transform,box-shadow,filter] duration-150 ease-out hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_36px_rgba(13,107,58,0.28)]",
        className
      )}
    >
      {connecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : connected ? (
        <ArrowRight className="h-4 w-4" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
