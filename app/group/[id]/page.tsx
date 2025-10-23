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

  useEffect(() => {
    const loadGroupData = async () => {
      setIsLoading(true)
      try {
        console.log("[FundFlow] Loading group data for ID:", params.id)
        const groupData = await fetchGroupData(params.id as string)

        if (groupData) {
          console.log("[FundFlow] Group data loaded:", groupData)
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
      alert("Please connect your wallet first")
      return
    }

    setIsJoining(true)

    try {
      const { signature } = await joinGroup(connectedWallet.address, group.id, 10)

      console.log("[FundFlow] Join successful!")
      console.log("[FundFlow] Transaction signature:", signature)

      alert(`Successfully joined with $10 tip!\nTransaction: ${signature}`)

      const updatedGroup = await fetchGroupData(group.id)
      if (updatedGroup) {
        setGroup(updatedGroup)
      }
    } catch (error) {
      console.error("[FundFlow] Join failed:", error)
      alert("Failed to join group. Please try again.")
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
                  ${group.totalCollected.toLocaleString()}
                  <span className="inline-flex items-center gap-2 text-2xl text-muted-foreground ml-3">
                    <UsdcIcon className="h-6 w-6" />
                    USDC
                  </span>
                </h2>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Funding Goal</span>
                  <span className="font-mono font-medium inline-flex items-center gap-1.5">
                    <UsdcIcon className="h-4 w-4" />${group.fundingGoal.toLocaleString()} USDC
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent font-medium">{progress.toFixed(1)}% Complete</span>
                  <span className="text-muted-foreground">
                    ${(group.fundingGoal - group.totalCollected).toLocaleString()} remaining
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
                          <p className="font-semibold text-lg">$10</p>
                          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <UsdcIcon className="h-3 w-3" />
                            USDC
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
                    Pay a one-time $10 tip to join and start contributing to the fund.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background/50 border border-border/50 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Joining Tip</span>
                    <span className="text-lg font-bold inline-flex items-center gap-1.5">
                      <UsdcIcon className="h-5 w-5" />
                      $10 USDC
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>This one-time tip goes directly to the group fund</span>
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
                    <p className="text-2xl font-bold inline-flex items-center gap-2">
                      <UsdcIcon className="h-6 w-6" />${group.amountPerRecurrence} USDC
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <p className="text-sm text-muted-foreground text-center">Recurring contributions coming soon</p>
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
