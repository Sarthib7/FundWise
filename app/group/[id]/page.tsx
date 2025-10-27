"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GroupAvatar, UserAvatar } from "@/components/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { joinGroup, fetchGroupData, type GroupData } from "@/lib/solana"
import { makePaymentOnChain, withdrawFromGroupOnChain, lamportsToSol, solToLamports } from "@/lib/solana-program"
import { payToSquadsVault, withdrawFromSquadsVault, lamportsToSol as squadsLamportsToSol, solToLamports as squadsSolToLamports, getVaultBalance } from "@/lib/squads-multisig"
import { PublicKey } from "@solana/web3.js"
import { toast } from "sonner"
import { generateGroupQRCode } from "@/lib/qr-code"
import { formatDuration } from "@/lib/utils"
import {
  Users,
  Calendar,
  TrendingUp,
  Share2,
  QrCode,
  Copy,
  CheckCircle2,
  Shield,
  Loader2,
  UserPlus,
  DollarSign,
  Clock,
  Info,
  Download,
  AlertCircle,
} from "lucide-react"
import { UsdcIcon } from "@/components/icons/usdc-icon"

export default function GroupDashboard() {
  const params = useParams()
  const router = useRouter()
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const connectedWallet = wallets[0]

  const [copied, setCopied] = useState(false)
  const [group, setGroup] = useState<GroupData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isContributing, setIsContributing] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState<string>("")

  useEffect(() => {
    const loadGroupData = async () => {
      setIsLoading(true)
      try {
        console.log("[FundFlow] Loading group data for ID:", params.id)
        const groupData = await fetchGroupData(params.id as string)

        if (groupData) {
          console.log("[FundFlow] Group data loaded:", groupData)
          console.log("[FundFlow] 🔍 Vault Address Check:")
          console.log("[FundFlow]    squadsVaultAddress:", groupData.squadsVaultAddress || "❌ NOT SET")
          console.log("[FundFlow]    squadsMultisigAddress:", groupData.squadsMultisigAddress || "❌ NOT SET")
          console.log("[FundFlow]    onChainAddress:", groupData.onChainAddress || "❌ NOT SET")

          if (!groupData.squadsVaultAddress) {
            console.warn("[FundFlow] ⚠️ WARNING: This group doesn't have a Squads vault address!")
            console.warn("[FundFlow] ⚠️ The Pay button will be DISABLED")
            console.warn("[FundFlow] ⚠️ This is likely an OLD group created before Squads integration")
            console.warn("[FundFlow] ✅ SOLUTION: Create a NEW group to test the Pay button")
          } else {
            console.log("[FundFlow] ✅ Squads vault configured - Pay button will be enabled!")
          }

          setGroup(groupData)
        } else {
          console.log("[FundFlow] Group not found")
          setGroup(null)
        }
      } catch (error) {
        console.error("[FundFlow] Failed to fetch group data:", error)
        setGroup(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadGroupData()
    }
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8 md:py-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading group data...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8 md:py-12 flex items-center justify-center">
          <Card className="p-12 max-w-md text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Group Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The group you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/")} className="bg-accent hover:bg-accent/90">
              Go Home
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const progress = (group.totalCollected / group.fundingGoal) * 100
  const isCreator = connectedWallet?.address === group.creator
  const isMember = group.members.includes(connectedWallet?.address || "")

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/group/${group.id}`
    const shareData = {
      title: `Join ${group.name} on FundFlow`,
      text: `Join our group fund! Use code ${group.id} or visit the link.`,
      url: shareUrl,
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShowQR = async () => {
    setShowQRModal(true)
    if (!qrCodeImage) {
      setIsGeneratingQR(true)
      try {
        const shareUrl = `${window.location.origin}/group/${group.id}`
        const qrCode = await generateGroupQRCode(shareUrl, group.name)
        setQrCodeImage(qrCode)
      } catch (error) {
        console.error("[FundFlow] Failed to generate QR code:", error)
        alert("Failed to generate QR code. Please try again.")
        setShowQRModal(false)
      } finally {
        setIsGeneratingQR(false)
      }
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeImage) return

    const link = document.createElement("a")
    link.href = qrCodeImage
    link.download = `fundflow-${group.id}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleJoinGroup = async () => {
    if (!authenticated || !connectedWallet) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!group?.onChainAddress) {
      toast.error("Group not yet deployed on-chain")
      return
    }

    setIsJoining(true)

    try {
      // Step 1: Join the group (this will be the on-chain join_with_invite call in future)
      const { signature: joinSignature } = await joinGroup(connectedWallet.address, group.id, 10)

      console.log("[FundFlow] Join successful!")
      console.log("[FundFlow] Join transaction:", joinSignature)

      toast.success("Successfully joined the group!", {
        description: `TX: ${joinSignature.slice(0, 8)}...${joinSignature.slice(-8)}`
      })

      // Step 2: Automatically make first payment
      console.log("[FundFlow] Making automatic first payment...")

      try {
        // Create a simple wallet adapter for the Anchor client
        const walletAdapter = {
          publicKey: new PublicKey(connectedWallet.address),
          signTransaction: async (tx: any) => {
            const signedTx = await connectedWallet.signTransaction(tx)
            return signedTx
          },
          signAllTransactions: async (txs: any[]) => {
            const signedTxs = await connectedWallet.signAllTransactions(txs)
            return signedTxs
          },
        }

        const groupPoolPDA = new PublicKey(group.onChainAddress)
        const { signature: paymentSignature, amount } = await makePaymentOnChain(walletAdapter, groupPoolPDA)

        console.log("[FundFlow] First payment successful!")
        console.log("[FundFlow] Payment transaction:", paymentSignature)

        toast.success(`First payment of ${lamportsToSol(amount).toFixed(4)} SOL made automatically!`, {
          description: `TX: ${paymentSignature.slice(0, 8)}...${paymentSignature.slice(-8)}`
        })
      } catch (paymentError) {
        console.error("[FundFlow] Auto-payment failed:", paymentError)
        toast.warning("Joined successfully, but auto-payment failed", {
          description: "You can make a manual payment from the dashboard"
        })
      }

      // Reload group data
      const updatedGroup = await fetchGroupData(group.id)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }
    } catch (error) {
      console.error("[FundFlow] Join failed:", error)
      toast.error("Failed to join group", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsJoining(false)
    }
  }

  const getNextContributionDate = () => {
    const now = new Date()
    const created = new Date(group.createdAt)

    switch (group.recurringPeriod) {
      case "daily":
        return new Date(now.setDate(now.getDate() + 1))
      case "weekly":
        return new Date(now.setDate(now.getDate() + 7))
      case "biweekly":
        return new Date(now.setDate(now.getDate() + 14))
      case "monthly":
        return new Date(now.setMonth(now.getMonth() + 1))
      default:
        return new Date(now.setDate(now.getDate() + 7))
    }
  }

  const handleMakePayment = async () => {
    if (!authenticated || !connectedWallet) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!group?.squadsVaultAddress) {
      toast.error("Group vault not configured. Please create a new group.")
      return
    }

    setIsPaying(true)

    try {
      console.log("═══════════════════════════════════════")
      console.log("🚀 STARTING PAYMENT TRANSACTION")
      console.log("═══════════════════════════════════════")
      console.log("[Pay] Group:", group.name)
      console.log("[Pay] From Wallet:", connectedWallet.address)
      console.log("[Pay] To Squads Vault:", group.squadsVaultAddress)
      console.log("[Pay] Amount:", group.amountPerRecurrence, "SOL")

      // Convert SOL to lamports
      const amountLamports = squadsSolToLamports(group.amountPerRecurrence)
      console.log("[Pay] Amount in lamports:", amountLamports)

      // Call Squads vault payment function
      console.log("[Pay] Calling payToSquadsVault...")
      const { signature } = await payToSquadsVault(
        connectedWallet,
        new PublicKey(group.squadsVaultAddress),
        amountLamports
      )

      console.log("═══════════════════════════════════════")
      console.log("✅ PAYMENT SUCCESSFUL!")
      console.log("═══════════════════════════════════════")
      console.log("[Pay] Transaction Signature:", signature)
      console.log("[Pay] Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      console.log("[Pay] Amount:", group.amountPerRecurrence, "SOL")

      toast.success(`Payment of ${group.amountPerRecurrence} SOL successful!`, {
        description: `TX: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      })

      // Get updated vault balance
      try {
        const vaultBalance = await getVaultBalance(new PublicKey(group.squadsVaultAddress))
        console.log("[Pay] New vault balance:", squadsLamportsToSol(vaultBalance), "SOL")
      } catch (balanceError) {
        console.warn("[Pay] Could not fetch vault balance:", balanceError)
      }

      // Reload group data
      const updatedGroup = await fetchGroupData(group.id)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }
    } catch (error) {
      console.error("═══════════════════════════════════════")
      console.error("❌ PAYMENT FAILED")
      console.error("═══════════════════════════════════════")
      console.error("[Pay] Error:", error)

      toast.error("Payment failed", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsPaying(false)
    }
  }

  const handleWithdraw = async () => {
    if (!authenticated || !connectedWallet || !withdrawAmount) {
      toast.error("Please enter a valid withdrawal amount")
      return
    }

    if (!group?.squadsVaultAddress) {
      toast.error("Group vault not configured. Please create a new group.")
      return
    }

    const amountSol = parseFloat(withdrawAmount)
    if (isNaN(amountSol) || amountSol <= 0) {
      toast.error("Please enter a valid positive amount")
      return
    }

    setIsWithdrawing(true)

    try {
      console.log("═══════════════════════════════════════")
      console.log("🏦 STARTING WITHDRAWAL TRANSACTION")
      console.log("═══════════════════════════════════════")
      console.log("[Withdraw] Group:", group.name)
      console.log("[Withdraw] From Squads Vault:", group.squadsVaultAddress)
      console.log("[Withdraw] To Wallet:", connectedWallet.address)
      console.log("[Withdraw] Amount:", amountSol, "SOL")

      const amountLamports = squadsSolToLamports(amountSol)
      console.log("[Withdraw] Amount in lamports:", amountLamports)

      // Call Squads vault withdrawal function
      console.log("[Withdraw] Calling withdrawFromSquadsVault...")
      console.log("[Withdraw] Note: This requires multisig approval in production")

      const { signature } = await withdrawFromSquadsVault(
        connectedWallet,
        new PublicKey(group.squadsVaultAddress),
        amountLamports
      )

      console.log("═══════════════════════════════════════")
      console.log("✅ WITHDRAWAL INITIATED!")
      console.log("═══════════════════════════════════════")
      console.log("[Withdraw] Transaction Signature:", signature)
      console.log("[Withdraw] Amount:", amountSol, "SOL")

      toast.success(`Withdrawal of ${amountSol} SOL initiated!`, {
        description: "Pending multisig approval",
        action: {
          label: "View Details",
          onClick: () => console.log("Withdrawal details:", signature)
        }
      })

      setWithdrawAmount("")

      // Get updated vault balance
      try {
        const vaultBalance = await getVaultBalance(new PublicKey(group.squadsVaultAddress))
        console.log("[Withdraw] Current vault balance:", squadsLamportsToSol(vaultBalance), "SOL")
      } catch (balanceError) {
        console.warn("[Withdraw] Could not fetch vault balance:", balanceError)
      }

      // Reload group data
      const updatedGroup = await fetchGroupData(group.id)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }
    } catch (error) {
      console.error("═══════════════════════════════════════")
      console.error("❌ WITHDRAWAL FAILED")
      console.error("═══════════════════════════════════════")
      console.error("[Withdraw] Error:", error)

      toast.error("Withdrawal failed", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GroupAvatar 
                  name={group.name} 
                  id={group.id}
                  size={48}
                  className="h-12 w-12"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{group.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="font-mono">{group.id}</span>
                    <span>•</span>
                    <span>{group.members.length} members</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize border-accent/30 text-accent">
                {group.riskLevel} Risk
              </Badge>
              <Badge variant="outline">
                {formatDuration(group.totalDuration)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card className="p-8 bg-card border-border/50">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">Total Collected</p>
                <h2 className="text-5xl font-bold tracking-tight">
                  {group.totalCollected.toLocaleString()} SOL
                </h2>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Funding Goal</span>
                  <span className="font-mono font-medium">
                    {group.fundingGoal.toLocaleString()} SOL
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent font-medium">{progress.toFixed(1)}% Complete</span>
                  <span className="text-muted-foreground">
                    {(group.fundingGoal - group.totalCollected).toLocaleString()} SOL remaining
                  </span>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </div>
                  <p className="text-3xl font-bold">{group.members.length}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Frequency</span>
                  </div>
                  <p className="text-3xl font-bold capitalize">{group.recurringPeriod.slice(0, 3)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Per Period</span>
                  </div>
                  <p className="text-3xl font-bold">${group.amountPerRecurrence}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border/50 overflow-hidden">
              <Tabs defaultValue="members" className="w-full">
                <div className="border-b border-border/30">
                  <TabsList className="bg-transparent h-auto p-0 w-full justify-start px-6">
                    <TabsTrigger
                      value="members"
                      className="relative bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-none px-4 py-4 font-medium transition-all hover:text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-accent after:transition-colors"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="relative bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-none px-4 py-4 font-medium transition-all hover:text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-accent after:transition-colors"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger
                      value="share"
                      className="relative bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-none px-4 py-4 font-medium transition-all hover:text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-accent after:transition-colors"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="members" className="p-6 space-y-3 mt-0">
                  {group.members.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No members yet</p>
                      <p className="text-sm mt-2">Be the first to join this group!</p>
                    </div>
                  ) : (
                    group.members.map((memberAddress, index) => (
                      <div
                        key={memberAddress}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar 
                            name={memberAddress} 
                            id={memberAddress}
                            size={40}
                            className="h-10 w-10"
                          />
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {memberAddress.slice(0, 6)}...{memberAddress.slice(-4)}
                            </p>
                            <p className="text-xs text-muted-foreground">{index === 0 ? "Creator" : "Member"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">0.01 SOL</p>
                          <p className="text-xs text-muted-foreground">
                            Contribution
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="activity" className="p-6 mt-0">
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Activity history coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="share" className="p-6 mt-0">
                  <div className="space-y-4">
                    <div className="p-6 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Group Code</p>
                      <code className="text-2xl font-mono font-bold tracking-wider">{group.id}</code>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" onClick={handleCopyCode} className="w-full bg-transparent">
                        {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Copy
                      </Button>
                      <Button variant="outline" onClick={handleShare} className="w-full bg-transparent">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" onClick={handleShowQR} className="w-full bg-transparent">
                        <QrCode className="h-4 w-4 mr-2" />
                        QR
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            {!isMember && (
              <Card className="p-6 bg-accent/5 border-accent/30">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Join This Group</h3>
                  <p className="text-sm text-muted-foreground">
                    Make your first contribution of 0.01 SOL to join the group and start participating.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background/50 border border-border/50 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Joining Contribution</span>
                    <span className="text-lg font-bold">
                      0.01 SOL
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>This first contribution goes directly to the group pool</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  size="lg"
                  onClick={handleJoinGroup}
                  disabled={isJoining || !authenticated}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Group
                    </>
                  )}
                </Button>

                {!authenticated && (
                  <p className="text-xs text-muted-foreground text-center mt-3">Connect your wallet to join</p>
                )}
              </Card>
            )}

            {isMember && (
              <Card className="p-6 bg-card border-border/50">
                <h3 className="text-lg font-semibold mb-4">Your Contribution</h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Next Due Date</p>
                    <p className="text-xl font-semibold">{getNextContributionDate().toLocaleDateString()}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
                    <p className="text-2xl font-bold">
                      {group.amountPerRecurrence} SOL
                    </p>
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="lg"
                    onClick={handleMakePayment}
                    disabled={isPaying || !authenticated || !group.squadsVaultAddress}
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Make Payment ({group.amountPerRecurrence} SOL)
                      </>
                    )}
                  </Button>

                  {/* Show helpful message if button is disabled */}
                  {!authenticated && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-yellow-600 dark:text-yellow-500">
                        ⚠️ Please connect your wallet to make payments
                      </p>
                    </div>
                  )}

                  {authenticated && !group.squadsVaultAddress && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-600 dark:text-red-500 font-medium mb-1">
                        ❌ Pay button disabled: No vault configured
                      </p>
                      <p className="text-xs text-red-600/80 dark:text-red-500/80">
                        This group was created before Squads integration. Please create a new group to test the Pay functionality.
                      </p>
                    </div>
                  )}

                  {authenticated && group.squadsVaultAddress && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-green-600 dark:text-green-500">
                        ✅ Ready to pay! Click the button above to send {group.amountPerRecurrence} SOL to the group vault.
                      </p>
                      <p className="text-xs text-green-600/80 dark:text-green-500/80 mt-1">
                        Vault: {group.squadsVaultAddress.slice(0, 8)}...{group.squadsVaultAddress.slice(-8)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Withdraw Amount (SOL)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.1"
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                        disabled={isWithdrawing || !authenticated}
                      />
                      <Button
                        variant="outline"
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || !authenticated || !withdrawAmount || !group.squadsVaultAddress}
                      >
                        {isWithdrawing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Withdraw"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Withdraw your contributed funds from the pool</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-muted/20 border-border/50">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Privacy Protected</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    All transactions use ZK compression on Solana for maximum privacy and security.
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Group QR Code</DialogTitle>
            <DialogDescription>Scan this QR code to join {group.name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {isGeneratingQR ? (
              <div className="flex flex-col items-center justify-center h-[300px] w-[300px] bg-muted/30 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-accent mb-2" />
                <p className="text-sm text-muted-foreground">Generating QR code...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCodeImage || "/placeholder.svg"} alt="Group QR Code" className="w-[300px] h-[300px]" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Group Code</p>
                  <code className="text-lg font-mono font-bold">{group.id}</code>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={handleDownloadQR} className="flex-1 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleShare} className="flex-1 bg-accent hover:bg-accent/90">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
