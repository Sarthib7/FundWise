"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GroupAvatar } from "@/components/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// PHASE 1: Using Solana Wallet Adapter (Active)
import { useWallet } from "@solana/wallet-adapter-react"
// PHASE 2: Privy (Commented out)
// import { usePrivy, useWallets } from "@privy-io/react-auth"
import { joinGroup, fetchGroupData, type GroupData } from "@/lib/solana"
// Phase 1: Simple payment functions
import { payToGroupWallet, getWalletBalance } from "@/lib/simple-payment"
// Phase 2: Multisig and compression (commented out for now)
// import { payToSquadsVault, withdrawFromSquadsVault, getVaultBalance, lamportsToSol as squadsLamportsToSol, solToLamports as squadsSolToLamports } from "@/lib/squads-multisig"
// import { compressFunds, decompressFunds, calculateCompressionSavings } from "@/lib/zk-compression"
import { PublicKey } from "@solana/web3.js"
import { toast } from "sonner"
import { generateGroupQRCode } from "@/lib/qr-code"
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
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
} from "lucide-react"

export default function GroupDashboard() {
  const params = useParams()
  const router = useRouter()
  // PHASE 1: Solana Wallet Adapter
  const { publicKey, connected } = useWallet()
  // PHASE 2: Privy (commented out)
  // const { authenticated } = usePrivy()
  // const { wallets } = useWallets()
  // const connectedWallet = wallets[0]

  // State
  const [group, setGroup] = useState<GroupData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [walletBalance, setWalletBalance] = useState<number>(0) // Phase 1: Simple wallet balance
  const [copied, setCopied] = useState(false)

  // Action states
  const [isJoining, setIsJoining] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isPoolingUp, setIsPoolingUp] = useState(false)

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState<string>("")
  const [poolUpAmount, setPoolUpAmount] = useState<string>("")

  // QR Modal
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  // Check if user is a member
  const walletAddress = publicKey?.toString() || ""
  const isMember = group?.members.includes(walletAddress) || false
  const isCreator = group?.creator === walletAddress

  // Calculate progress
  const progress = group ? (group.totalCollected / group.fundingGoal) * 100 : 0

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      setIsLoading(true)
      try {
        console.log("[GroupPage] Loading group:", params.id)
        const groupData = await fetchGroupData(params.id as string)

        if (groupData) {
          console.log("[GroupPage] Group loaded successfully")
          console.log("[GroupPage] Group wallet address:", groupData.groupWalletAddress || "NOT SET")
          setGroup(groupData)

          // Load wallet balance (Phase 1: Simple wallet)
          if (groupData.groupWalletAddress) {
            try {
              const balance = await getWalletBalance(groupData.groupWalletAddress)
              setWalletBalance(balance)
              console.log("[GroupPage] Wallet balance:", balance, "SOL")
            } catch (error) {
              console.warn("[GroupPage] Could not fetch wallet balance:", error)
            }
          }
        } else {
          console.error("[GroupPage] Group not found")
          toast.error("Group not found")
        }
      } catch (error) {
        console.error("[GroupPage] Failed to load group:", error)
        toast.error("Failed to load group data")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadGroupData()
    }
  }, [params.id])

  // Handlers
  const handleCopyCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.id)
      setCopied(true)
      toast.success("Group code copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (group) {
      const shareUrl = `${window.location.origin}/group/${group.id}`
      try {
        await navigator.share({
          title: group.name,
          text: `Join my fundraising group: ${group.name}`,
          url: shareUrl,
        })
      } catch (error) {
        navigator.clipboard.writeText(shareUrl)
        toast.success("Share link copied to clipboard!")
      }
    }
  }

  const handleShowQR = async () => {
    if (!group) return

    setIsGeneratingQR(true)
    setShowQRModal(true)

    try {
      const qrCode = await generateGroupQRCode(group.id, group.name)
      setQrCodeImage(qrCode)
    } catch (error) {
      console.error("[GroupPage] Failed to generate QR code:", error)
      toast.error("Failed to generate QR code")
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!connected || !publicKey || !group) {
      toast.error("Please connect your Solana wallet first")
      return
    }

    setIsJoining(true)

    try {
      console.log("[Join] Joining group:", group.id)

      await joinGroup(publicKey.toString(), group.id, 0.01)

      toast.success("Successfully joined group!")

      // Reload group data
      const updatedGroup = await fetchGroupData(group.id)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }

      // Optionally trigger first payment
      toast.info("Make your first contribution!", {
        description: "Click the Pay button below",
      })
    } catch (error) {
      console.error("[Join] Error:", error)
      toast.error("Failed to join group", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handlePay = async () => {
    if (!connected || !publicKey || !group) {
      toast.error("Please connect your Solana wallet first")
      return
    }

    if (!group.groupWalletAddress) {
      toast.error("Group wallet not configured", {
        description: "Please create a new group or contact the administrator"
      })
      return
    }

    setIsPaying(true)

    try {
      const walletAddress = publicKey.toString()
      console.log("═══════════════════════════════════════")
      console.log("💰 STARTING PAYMENT (Phase 1: Simple Transfer)")
      console.log("═══════════════════════════════════════")
      console.log("[Pay] Group:", group.name)
      console.log("[Pay] Amount:", group.amountPerRecurrence, "SOL")
      console.log("[Pay] To:", group.groupWalletAddress)
      console.log("[Pay] From:", walletAddress)

      // Phase 1: Simple wallet-to-wallet transfer
      // NOTE: For Phase 1, we pass null for wallet object since we use simple wallet generation
      const { signature } = await payToGroupWallet(
        null, // Phase 1 doesn't need wallet object
        walletAddress,
        group.groupWalletAddress,
        group.amountPerRecurrence
      )

      console.log("[Pay] ✅ Payment successful!")
      console.log("[Pay] Signature:", signature)

      toast.success(`Payment of ${group.amountPerRecurrence} SOL successful!`, {
        description: `TX: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank')
        }
      })

      // Reload wallet balance
      const updatedBalance = await getWalletBalance(group.groupWalletAddress)
      setWalletBalance(updatedBalance)
      console.log("[Pay] Updated wallet balance:", updatedBalance, "SOL")

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
    if (!connected || !publicKey || !group) {
      toast.error("Please connect your Solana wallet first")
      return
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!group.squadsVaultAddress || !group.squadsMultisigAddress) {
      toast.error("Group vault not configured")
      return
    }

    setIsWithdrawing(true)

    try {
      console.log("═══════════════════════════════════════")
      console.log("🏦 STARTING WITHDRAWAL")
      console.log("═══════════════════════════════════════")

      const amountSol = parseFloat(withdrawAmount)
      const amountLamports = squadsSolToLamports(amountSol)

      console.log("[Withdraw] Amount:", amountSol, "SOL")
      console.log("[Withdraw] Vault:", group.squadsVaultAddress)

      // Extract wallet address
      const recipientAddress = publicKey.toString()

      // Step 1: Optionally decompress funds first (currently simulated)
      try {
        console.log("[Withdraw] Decompressing funds...")
        await decompressFunds(
          new PublicKey(group.squadsVaultAddress),
          new PublicKey(recipientAddress),
          amountLamports,
          connectedWallet
        )
      } catch (decompressionError) {
        console.warn("[Withdraw] Decompression failed (optional):", decompressionError)
      }

      // Step 2: Create withdrawal proposal
      const { signature, proposalAddress } = await withdrawFromSquadsVault(
        connectedWallet,
        new PublicKey(group.squadsMultisigAddress),
        new PublicKey(group.squadsVaultAddress),
        new PublicKey(recipientAddress),
        amountLamports
      )

      console.log("[Withdraw] ✅ Withdrawal proposal created!")
      console.log("[Withdraw] Signature:", signature)

      toast.success(`Withdrawal of ${amountSol} SOL initiated!`, {
        description: proposalAddress ? "Pending approval" : "Executed",
        action: {
          label: "View on Explorer",
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      })

      setWithdrawAmount("")

      // Reload data
      const updatedBalance = await getVaultBalance(new PublicKey(group.squadsVaultAddress))
      setVaultBalance(updatedBalance)

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

  const handlePoolUp = async () => {
    if (!connected || !publicKey || !group) {
      toast.error("Please connect your Solana wallet first")
      return
    }

    if (!poolUpAmount || parseFloat(poolUpAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsPoolingUp(true)

    try {
      console.log("═══════════════════════════════════════")
      console.log("📈 POOLING UP TO YIELD")
      console.log("═══════════════════════════════════════")

      const amountSol = parseFloat(poolUpAmount)
      console.log("[PoolUp] Amount:", amountSol, "SOL")

      // TODO: Implement Meteora DLMM integration
      // For now, show a placeholder toast
      toast.info("Pool Up feature coming soon!", {
        description: "Meteora DLMM integration in progress"
      })

      setPoolUpAmount("")

    } catch (error) {
      console.error("❌ POOL UP FAILED:", error)
      toast.error("Pool up failed", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsPoolingUp(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
        <Footer />
      </div>
    )
  }

  // Group not found
  if (!group) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Group Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The group you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/")} className="bg-accent hover:bg-accent/90">
              Return Home
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Group Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <GroupAvatar groupName={group.name} size="lg" />

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{group.name}</h1>
                {group.isPublic ? (
                  <Badge variant="secondary">Public</Badge>
                ) : (
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-4">
                {group.recurringPeriod} contributions • {group.riskLevel} risk • {group.totalDuration}
              </p>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : `Code: ${group.id}`}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleShowQR}>
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-3xl font-bold">{walletBalance.toFixed(4)} SOL</p>
                <p className="text-sm text-muted-foreground">of {group.fundingGoal} SOL goal</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">{progress.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={progress} className="h-3" />

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{group.members.length}</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{group.amountPerRecurrence} SOL</p>
                <p className="text-xs text-muted-foreground">Per {group.recurringPeriod}</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{group.totalDuration}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Join Button (if not a member) */}
            {!isMember && (
              <Card className="p-6 bg-accent/5 border-accent/20">
                <h3 className="text-xl font-semibold mb-4">Join This Group</h3>
                <p className="text-muted-foreground mb-4">
                  Start contributing {group.amountPerRecurrence} SOL {group.recurringPeriod} towards the {group.fundingGoal} SOL goal
                </p>
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  size="lg"
                  onClick={handleJoinGroup}
                  disabled={isJoining || !connected}
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
              </Card>
            )}

            {/* Member Actions */}
            {isMember && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6">Your Actions</h3>

                <Tabs defaultValue="pay" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pay">Pay</TabsTrigger>
                    <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                    <TabsTrigger value="pool">Pool Up</TabsTrigger>
                  </TabsList>

                  {/* Pay Tab */}
                  <TabsContent value="pay" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
                      <p className="text-3xl font-bold">{group.amountPerRecurrence} SOL</p>
                    </div>

                    <Button
                      className="w-full bg-accent hover:bg-accent/90"
                      size="lg"
                      onClick={handlePay}
                      disabled={isPaying || !connected || !group.groupWalletAddress}
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-5 w-5" />
                          Pay {group.amountPerRecurrence} SOL
                        </>
                      )}
                    </Button>

                    {!connected && (
                      <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-sm text-yellow-600 dark:text-yellow-500">
                          ⚠️ Please connect your Solana wallet to make payments
                        </p>
                      </div>
                    )}

                    {connected && !group.groupWalletAddress && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-600 dark:text-red-500 font-medium">
                          ❌ Group wallet not configured. Please create a new group.
                        </p>
                      </div>
                    )}

                    {connected && group.groupWalletAddress && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-600 dark:text-green-500">
                          ✅ Ready to pay to group wallet
                        </p>
                        <p className="text-xs text-green-600/80 dark:text-green-500/80 mt-1 font-mono">
                          {group.groupWalletAddress.slice(0, 8)}...{group.groupWalletAddress.slice(-8)}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      💡 Phase 1: Simple wallet-to-wallet transfers (Multisig & compression coming in Phase 2)
                    </p>
                  </TabsContent>

                  {/* Withdraw Tab - Phase 2 (Commented out for now) */}
                  <TabsContent value="withdraw" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                      <p className="text-2xl font-bold">{walletBalance.toFixed(4)} SOL</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Withdraw Amount (SOL)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.1"
                          step="0.01"
                          min="0"
                          max={walletBalance}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded-md"
                          disabled={isWithdrawing || !connected}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !connected || !withdrawAmount || !group.groupWalletAddress}
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing Withdrawal...
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="mr-2 h-5 w-5" />
                          Withdraw Funds
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      ⚠️ Withdrawal functionality coming in Phase 2 (Multisig integration)
                    </p>
                  </TabsContent>

                  {/* Pool Up Tab - Phase 2 (Commented out for now) */}
                  <TabsContent value="pool" className="space-y-4 mt-6">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                      <p className="text-2xl font-bold">{walletBalance.toFixed(4)} SOL</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount to Deploy (SOL)</label>
                      <input
                        type="number"
                        value={poolUpAmount}
                        onChange={(e) => setPoolUpAmount(e.target.value)}
                        placeholder="0.5"
                        step="0.1"
                        min="0"
                        max={walletBalance}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md"
                        disabled={isPoolingUp || !connected}
                      />
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={handlePoolUp}
                      disabled={isPoolingUp || !connected || !poolUpAmount}
                    >
                      {isPoolingUp ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Deploying to Yield Pool...
                        </>
                      ) : (
                        <>
                          <ArrowUpFromLine className="mr-2 h-5 w-5" />
                          Deploy to Yield Pool
                        </>
                      )}
                    </Button>

                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm text-blue-600 dark:text-blue-500 font-medium mb-1">
                        📈 Earn Passive Yield
                      </p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-500/80">
                        Deploy funds to Meteora DLMM pools and earn 0.25-0.50% fees automatically
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      💡 Yield farming integration coming soon!
                    </p>
                  </TabsContent>
                </Tabs>
              </Card>
            )}
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* Wallet Info - Phase 1 */}
            {group.groupWalletAddress && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-accent" />
                  Group Wallet
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Balance</p>
                    <p className="font-mono font-bold text-lg">{walletBalance.toFixed(4)} SOL</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-muted-foreground mb-1">Address</p>
                    <p className="font-mono text-xs break-all">{group.groupWalletAddress}</p>
                  </div>

                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-600 dark:text-blue-500">
                      💡 Phase 1: Simple wallet. Multisig coming in Phase 2!
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Members */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Members ({group.members.length})
              </h3>

              <div className="space-y-2">
                {group.members.slice(0, 5).map((member, index) => (
                  <div key={member} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs truncate">{member}</p>
                      {member === group.creator && (
                        <Badge variant="secondary" className="text-xs mt-1">Creator</Badge>
                      )}
                    </div>
                  </div>
                ))}

                {group.members.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{group.members.length - 5} more members
                  </p>
                )}
              </div>
            </Card>

            {/* Group Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Group Details</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <Badge variant={group.riskLevel === 'low' ? 'secondary' : group.riskLevel === 'medium' ? 'default' : 'destructive'}>
                    {group.riskLevel}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility</span>
                  <span className="font-medium">{group.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to join {group.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-6">
            {isGeneratingQR ? (
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
            ) : qrCodeImage ? (
              <>
                <img src={qrCodeImage} alt="Group QR Code" className="w-64 h-64" />
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = qrCodeImage
                    link.download = `${group.name}-qr.png`
                    link.click()
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Failed to generate QR code</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
