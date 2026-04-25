"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, ExternalLink, Loader2, Receipt, ArrowLeftRight } from "lucide-react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getGroup, getMembers, getSettlementById } from "@/lib/db"
import type { Database } from "@/lib/database.types"
import { STABLECOIN_MINTS, formatTokenAmount } from "@/lib/expense-engine"
import { getSolanaExplorerTxUrl } from "@/lib/solana-cluster"

type GroupRow = Database["public"]["Tables"]["groups"]["Row"]
type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"]

function formatWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function SettlementReceiptPage() {
  const params = useParams()
  const groupId = params.id as string
  const settlementId = params.settlementId as string

  const [group, setGroup] = useState<GroupRow | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [settlement, setSettlement] = useState<SettlementRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!groupId || !settlementId) {
      return
    }

    const loadReceipt = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [groupData, memberData, settlementData] = await Promise.all([
          getGroup(groupId),
          getMembers(groupId),
          getSettlementById(settlementId),
        ])

        setGroup(groupData)
        setMembers(memberData)
        setSettlement(settlementData)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load the settlement receipt")
      } finally {
        setIsLoading(false)
      }
    }

    loadReceipt()
  }, [groupId, settlementId])

  const memberNames = useMemo(() => {
    return new Map(
      members.map((member) => [
        member.wallet,
        member.display_name || formatWallet(member.wallet),
      ])
    )
  }, [members])

  const mintInfo = useMemo(() => {
    if (!group) {
      return null
    }

    return Object.values(STABLECOIN_MINTS).find(
      (stablecoin) => stablecoin.mint === group.stablecoin_mint
    )
  }, [group])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !group || !settlement) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-lg p-8 text-center">
            <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Settlement Receipt Unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || "This settlement could not be loaded."}
            </p>
            <Button asChild className="mt-6 bg-accent hover:bg-accent/90">
              <Link href={`/groups/${groupId}`}>Back To Group</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const tokenName = mintInfo?.name || "Token"
  const fromName = memberNames.get(settlement.from_wallet) || formatWallet(settlement.from_wallet)
  const toName = memberNames.get(settlement.to_wallet) || formatWallet(settlement.to_wallet)
  const explorerUrl = getSolanaExplorerTxUrl(settlement.tx_sig)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-foreground">
            <Link href={`/groups/${groupId}`}>Back To Group</Link>
          </Button>

          <Card className="overflow-hidden border-accent/20">
            <div className="border-b bg-gradient-to-br from-accent/10 via-accent/5 to-transparent px-6 py-8">
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20">
                Settlement Receipt
              </Badge>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold">{group.name}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Confirmed on {new Date(settlement.confirmed_at).toLocaleString()}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 shadow-none">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Amount</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatTokenAmount(settlement.amount)} {tokenName}
                  </p>
                </Card>
                <Card className="p-4 shadow-none">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">From</p>
                  <p className="mt-2 text-lg font-semibold">{fromName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatWallet(settlement.from_wallet)}</p>
                </Card>
                <Card className="p-4 shadow-none">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">To</p>
                  <p className="mt-2 text-lg font-semibold">{toName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatWallet(settlement.to_wallet)}</p>
                </Card>
              </div>

              <Card className="p-5 shadow-none">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-accent/10 p-2 text-accent">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Proof of settlement</p>
                    <p className="text-xs text-muted-foreground">
                      This is the on-chain transaction recorded for the group settlement.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Transaction Signature</p>
                  <p className="mt-2 break-all font-mono text-sm">{settlement.tx_sig}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="bg-accent hover:bg-accent/90">
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                      View On Explorer
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/groups/${groupId}`}>Return To Group</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
