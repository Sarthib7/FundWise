"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWallet } from "@solana/wallet-adapter-react"
import { createProposal } from "@/lib/prediction-market"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  circleId: string
}

export function CreateProposalModal({ isOpen, onClose, circleId }: CreateProposalModalProps) {
  const { publicKey, connected } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("24")
  const [options, setOptions] = useState<string[]>(["Yes", "No"])
  const [newOption, setNewOption] = useState("")

  const handleAddOption = () => {
    if (newOption.trim() && options.length < 5) {
      setOptions([...options, newOption.trim()])
      setNewOption("")
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected || !publicKey) {
      toast.error("Please connect your wallet")
      return
    }

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    if (options.length < 2) {
      toast.error("Please add at least 2 options")
      return
    }

    setIsSubmitting(true)

    try {
      const proposalId = await createProposal(
        circleId,
        publicKey.toString(),
        title.trim(),
        description.trim(),
        options,
        parseInt(duration)
      )

      toast.success("Prediction proposal created!", {
        description: "Circle members can now place their bets"
      })

      // Reset form
      setTitle("")
      setDescription("")
      setDuration("24")
      setOptions(["Yes", "No"])
      setNewOption("")
      
      onClose()
    } catch (error) {
      console.error("Error creating proposal:", error)
      toast.error("Failed to create proposal", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Prediction Proposal</DialogTitle>
          <DialogDescription>
            Create a prediction market for your circle members to bet on outcomes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="proposal-title">Proposal Title</Label>
            <Input
              id="proposal-title"
              placeholder="e.g., Will BTC reach $100k this month?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/120 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="proposal-description">Description</Label>
            <Textarea
              id="proposal-description"
              placeholder="Provide details about the prediction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Betting Duration</Label>
            <Select value={duration} onValueChange={setDuration} disabled={isSubmitting}>
              <SelectTrigger id="duration">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="48">2 days</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">1 week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Betting Options</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index] = e.target.value
                      setOptions(newOptions)
                    }}
                    disabled={isSubmitting}
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="Add another option..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddOption}
                  disabled={isSubmitting || !newOption.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              You can add up to 5 options (minimum 2)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !connected}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

