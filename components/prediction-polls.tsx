"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UsdcIcon } from "@/components/icons/usdc-icon"
import { useWallet } from "@solana/wallet-adapter-react"
import { 
  getCircleProposals, 
  subscribeToProposals,
  placeBet,
  type PredictionProposal 
} from "@/lib/prediction-market"
import { toast } from "sonner"
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Trophy,
  Loader2,
  Vote,
  Target
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PredictionPollsProps {
  circleId: string
}

export function PredictionPolls({ circleId }: PredictionPollsProps) {
  const { publicKey, connected } = useWallet()
  const [proposals, setProposals] = useState<PredictionProposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<PredictionProposal | null>(null)
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [betAmount, setBetAmount] = useState<string>("10")
  const [isPlacingBet, setIsPlacingBet] = useState(false)

  // Load proposals
  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = subscribeToProposals(circleId, (updatedProposals) => {
      setProposals(updatedProposals)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [circleId])

  const handlePlaceBet = async () => {
    if (!connected || !publicKey || !selectedProposal || !selectedOption) {
      toast.error("Please select an option")
      return
    }

    const amount = parseFloat(betAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bet amount")
      return
    }

    setIsPlacingBet(true)

    try {
      await placeBet(
        selectedProposal.id,
        circleId,
        publicKey.toString(),
        selectedOption,
        amount
      )

      toast.success("Bet placed successfully!", {
        description: `You bet $${amount} USDC`
      })

      setSelectedProposal(null)
      setSelectedOption("")
      setBetAmount("10")
    } catch (error) {
      // Handle user cancellation gracefully
      if (error instanceof Error && error.message === "TRANSACTION_CANCELLED") {
        toast.info("Bet cancelled", {
          description: "You cancelled the transaction"
        })
        setSelectedProposal(null)
        setSelectedOption("")
        return
      }
      
      // Handle other errors
      toast.error("Failed to place bet", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsPlacingBet(false)
    }
  }

  const getTimeRemaining = (closesAt: number): string => {
    const remaining = closesAt - Date.now()
    if (remaining <= 0) return "Closed"

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d remaining`
    if (hours > 0) return `${hours}h remaining`
    return "< 1h remaining"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Closed</Badge>
      case "resolved":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Resolved</Badge>
      default:
        return null
    }
  }

  const hasUserVoted = (proposal: PredictionProposal): boolean => {
    if (!publicKey) return false
    const walletAddress = publicKey.toString()
    return proposal.options.some(opt => opt.voters.includes(walletAddress))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <Target className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Predictions Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Be the first to create a prediction market for your circle!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {proposals.map((proposal) => {
          const userVoted = hasUserVoted(proposal)
          
          return (
            <Card key={proposal.id} className="p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(proposal.status)}
                    {userVoted && (
                      <Badge variant="outline" className="gap-1">
                        <Vote className="h-3 w-3" />
                        Voted
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{proposal.title}</h3>
                  <p className="text-sm text-muted-foreground">{proposal.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-md bg-accent/10">
                    <UsdcIcon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Stake</p>
                    <p className="font-semibold">${proposal.totalStake}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-md bg-accent/10">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Participants</p>
                    <p className="font-semibold">
                      {proposal.options.reduce((sum, opt) => sum + opt.voters.length, 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-md bg-accent/10">
                    <Clock className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time Left</p>
                    <p className="font-semibold">{getTimeRemaining(proposal.closesAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-md bg-accent/10">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Options</p>
                    <p className="font-semibold">{proposal.options.length}</p>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {proposal.options.map((option) => {
                  const percentage = proposal.totalStake > 0 
                    ? (option.stake / proposal.totalStake) * 100 
                    : 0

                  return (
                    <div key={option.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{option.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {option.voters.length} {option.voters.length === 1 ? 'bet' : 'bets'}
                          </span>
                          <div className="flex items-center gap-1">
                            <UsdcIcon className="h-3.5 w-3.5" />
                            <span className="font-semibold">${option.stake}</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total stake
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Action Button */}
              {proposal.status === 'active' && Date.now() < proposal.closesAt && (
                <Button
                  type="button"
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={!connected || userVoted}
                  onClick={() => {
                    setSelectedProposal(proposal)
                    setSelectedOption("")
                  }}
                >
                  {userVoted ? (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      You've Placed Your Bet
                    </>
                  ) : (
                    <>
                      <UsdcIcon className="mr-2 h-4 w-4" />
                      Place Your Bet
                    </>
                  )}
                </Button>
              )}

              {proposal.status === 'resolved' && proposal.winningOption && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2 text-accent">
                    <Trophy className="h-4 w-4" />
                    <span className="font-semibold">
                      Winner: {proposal.options.find(o => o.id === proposal.winningOption)?.label}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Betting Dialog */}
      <Dialog 
        open={!!selectedProposal} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProposal(null)
            setSelectedOption("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Place Your Bet</DialogTitle>
            <DialogDescription>
              {selectedProposal?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Option Selection */}
            <div className="space-y-2">
              <Label>Select Your Prediction</Label>
              <div className="grid gap-2">
                {selectedProposal?.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedOption(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedOption === option.id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <UsdcIcon className="h-3.5 w-3.5" />
                        <span>${option.stake}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Amount */}
            <div className="space-y-2">
              <Label htmlFor="bet-amount">Bet Amount (USDC)</Label>
              <div className="flex items-center gap-2">
                <UsdcIcon className="h-5 w-5" />
                <Input
                  id="bet-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={isPlacingBet}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum bet: $1 USDC
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBetAmount(amount.toString())}
                  disabled={isPlacingBet}
                  className="flex-1"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedProposal(null)
                  setSelectedOption("")
                }}
                disabled={isPlacingBet}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePlaceBet}
                disabled={isPlacingBet || !selectedOption || !betAmount}
                className="flex-1 bg-accent hover:bg-accent/90"
              >
                {isPlacingBet ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing...
                  </>
                ) : (
                  <>
                    <UsdcIcon className="mr-2 h-4 w-4" />
                    Confirm Bet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

