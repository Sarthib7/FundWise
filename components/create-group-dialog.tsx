"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import { ExternalLink, Landmark, Loader2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FUND_MODE_TEMPLATES, type FundModeTemplateId } from "@/lib/fund-mode-templates"
import { cn } from "@/lib/utils"

type GroupMode = "split" | "fund"

type CreateGroupValues = {
  name: string
  mode: GroupMode
  fundingGoal?: number
  approvalThreshold?: number
  groupTemplate?: FundModeTemplateId | null
}

type CreateGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onSubmit: (values: CreateGroupValues) => Promise<void> | void
}

const DEFAULT_APPROVAL_THRESHOLD = "1"
const FUND_MODE_BETA_TELEGRAM_URL = "https://t.me/funddotsol"
const SOLANA_FAUCET_URL = "https://faucet.solana.com"
const CIRCLE_FAUCET_URL = "https://faucet.circle.com"

export function CreateGroupDialog({
  open,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: CreateGroupDialogProps) {
  const groupNameId = useId()
  const fundingGoalId = useId()
  const approvalThresholdId = useId()

  const [name, setName] = useState("")
  const [mode, setMode] = useState<GroupMode>("split")
  const [fundingGoal, setFundingGoal] = useState("")
  const [approvalThreshold, setApprovalThreshold] = useState(DEFAULT_APPROVAL_THRESHOLD)
  const [selectedTemplateId, setSelectedTemplateId] = useState<FundModeTemplateId | null>(null)
  const [errors, setErrors] = useState<{
    name?: string
    fundingGoal?: string
    approvalThreshold?: string
  }>({})

  useEffect(() => {
    if (!open) {
      setName("")
      setMode("split")
      setFundingGoal("")
      setApprovalThreshold(DEFAULT_APPROVAL_THRESHOLD)
      setSelectedTemplateId(null)
      setErrors({})
    }
  }, [open])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: {
      name?: string
      fundingGoal?: string
      approvalThreshold?: string
    } = {}
    const trimmedName = name.trim()

    if (!trimmedName) {
      nextErrors.name = "Enter a Group name."
    } else if (trimmedName.length > 60) {
      nextErrors.name = "Group name must be 60 characters or fewer."
    }

    let parsedFundingGoal: number | undefined
    let parsedApprovalThreshold: number | undefined

    if (mode === "fund") {
      if (fundingGoal.trim()) {
        const numericFundingGoal = Number(fundingGoal)

        if (!Number.isFinite(numericFundingGoal) || numericFundingGoal <= 0) {
          nextErrors.fundingGoal = "Funding goal must be a positive USDC amount."
        } else {
          parsedFundingGoal = numericFundingGoal
        }
      }

      const numericApprovalThreshold = Number(approvalThreshold)

      if (!Number.isInteger(numericApprovalThreshold) || numericApprovalThreshold < 1) {
        nextErrors.approvalThreshold = "Approval threshold must be a whole number of at least 1."
      } else {
        parsedApprovalThreshold = numericApprovalThreshold
      }
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    await onSubmit({
      name: trimmedName,
      mode,
      fundingGoal: parsedFundingGoal,
      approvalThreshold: parsedApprovalThreshold,
      groupTemplate: mode === "fund" ? selectedTemplateId : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create a Group</DialogTitle>
          <DialogDescription>
            Choose Split Mode for shared Expenses, or Fund Mode for a shared Treasury if your wallet is enabled for the beta.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={groupNameId}>Group name</Label>
            <Input
              id={groupNameId}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setErrors((current) => ({ ...current, name: undefined }))
              }}
              placeholder="Weekend trip"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={errors.name ? "true" : undefined}
              aria-describedby={errors.name ? `${groupNameId}-error` : `${groupNameId}-hint`}
            />
            {errors.name ? (
              <p id={`${groupNameId}-error`} className="text-xs text-destructive">
                {errors.name}
              </p>
            ) : (
              <p id={`${groupNameId}-hint`} className="text-xs text-muted-foreground">
                Members can join later from an invite code or direct Group link.
              </p>
            )}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Group mode</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={cn(
                  "flex min-h-32 flex-col rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  mode === "split"
                    ? "border-accent/30 bg-accent/10 shadow-sm"
                    : "border-border bg-card hover:border-accent/20 hover:bg-accent/5"
                )}
                onClick={() => setMode("split")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-accent">
                    <Users className="h-4 w-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(mode === "split" ? "border-accent/30 text-accent" : "")}
                  >
                    Default
                  </Badge>
                </div>
                <p className="mt-4 text-base font-semibold">Split Mode</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Track Expenses, compute live Balances, and settle exact USDC amounts on Solana.
                </p>
              </button>

              <button
                type="button"
                className={cn(
                  "flex min-h-32 flex-col rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  mode === "fund"
                    ? "border-brand-fund-blue-border bg-brand-fund-blue-bg shadow-sm"
                    : "border-border bg-card hover:border-brand-fund-blue-border hover:bg-brand-fund-blue-bg/60"
                )}
                onClick={() => setMode("fund")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-accent">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <Badge variant="outline" className={cn(mode === "fund" ? "border-brand-fund-blue-border text-brand-fund-blue" : "")}>
                    Fund Mode
                  </Badge>
                </div>
                <p className="mt-4 text-base font-semibold">Fund Mode</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pool Contributions into a Group Treasury and prepare proposal-led spending.
                </p>
                <p className="mt-3 text-xs font-medium text-foreground/70">
                  Beta access required while Proposal execution is completed.
                </p>
              </button>
            </div>
          </fieldset>

          <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{mode === "fund" ? "Fund Mode beta" : "Split Mode"}</Badge>
              <p className="text-sm font-medium">
                {mode === "fund" ? "Enabled wallets can create Treasury Groups today." : "Most Groups should start here."}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {mode === "fund"
                ? "Only beta admin wallets can create Fund Mode Groups. After creation, invite Members and initialize the Treasury when the approval threshold is reachable."
                : "Track shared Expenses first; move to Fund Mode when the Group needs a Treasury."}
            </p>
            {mode === "fund" ? (
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <a
                  href={FUND_MODE_BETA_TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-sm font-medium text-accent underline-offset-4 transition-colors hover:text-accent/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Join the Fund Mode beta
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                <a
                  href={SOLANA_FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Devnet SOL faucet
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                <a
                  href={CIRCLE_FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 rounded-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Devnet USDC faucet
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-dashed border-accent/25 bg-accent/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-accent/20 bg-accent/10 text-accent">USDC only</Badge>
              <p className="text-sm font-medium">The MVP uses USDC on Solana for Settlements and Contributions.</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              SOL remains separate for gas, but all Group balances stay denominated in USDC.
            </p>
          </div>

          {mode === "fund" && (
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Custom Treasury setup</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start custom, or choose a template to prefill the approval threshold and explain expected beta roles.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateId(null)}
                    className={cn(
                      "min-h-20 rounded-lg border p-3 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selectedTemplateId === null
                        ? "border-accent/30 bg-accent/10 shadow-sm"
                        : "border-border bg-background hover:border-accent/20 hover:bg-accent/5"
                    )}
                  >
                    <p className="text-sm font-semibold">Custom</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use your own funding goal and approval threshold.
                    </p>
                  </button>
                  {FUND_MODE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(template.id)
                        setApprovalThreshold(String(template.approvalThreshold))
                        setErrors((current) => ({ ...current, approvalThreshold: undefined }))
                      }}
                      className={cn(
                        "min-h-20 rounded-lg border p-3 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selectedTemplateId === template.id
                          ? "border-brand-fund-blue-border bg-brand-fund-blue-bg shadow-sm"
                          : "border-border bg-background hover:border-brand-fund-blue-border hover:bg-brand-fund-blue-bg/60"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{template.label}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {template.approvalThreshold} approval{template.approvalThreshold === 1 ? "" : "s"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">{template.roleHint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                <Label htmlFor={fundingGoalId}>Funding goal (USDC)</Label>
                <Input
                  id={fundingGoalId}
                  value={fundingGoal}
                  onChange={(event) => {
                    setFundingGoal(event.target.value)
                    setErrors((current) => ({ ...current, fundingGoal: undefined }))
                  }}
                  type="text"
                  inputMode="decimal"
                  placeholder="250"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={errors.fundingGoal ? "true" : undefined}
                  aria-describedby={
                    errors.fundingGoal ? `${fundingGoalId}-error` : `${fundingGoalId}-hint`
                  }
                />
                {errors.fundingGoal ? (
                  <p id={`${fundingGoalId}-error`} className="text-xs text-destructive">
                    {errors.fundingGoal}
                  </p>
                ) : (
                  <p id={`${fundingGoalId}-hint`} className="text-xs text-muted-foreground">
                    Optional. Leave blank if this Treasury does not need a target yet.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={approvalThresholdId}>Approval threshold (custom)</Label>
                <Input
                  id={approvalThresholdId}
                  value={approvalThreshold}
                  onChange={(event) => {
                    setApprovalThreshold(event.target.value)
                    setErrors((current) => ({ ...current, approvalThreshold: undefined }))
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="1"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={errors.approvalThreshold ? "true" : undefined}
                  aria-describedby={
                    errors.approvalThreshold
                      ? `${approvalThresholdId}-error`
                      : `${approvalThresholdId}-hint`
                  }
                />
                {errors.approvalThreshold ? (
                  <p id={`${approvalThresholdId}-error`} className="text-xs text-destructive">
                    {errors.approvalThreshold}
                  </p>
                ) : (
                  <p id={`${approvalThresholdId}-hint`} className="text-xs text-muted-foreground">
                    Treasury actions will require this many approvals after Members join.
                  </p>
                )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-h-11 bg-accent hover:bg-accent/90 sm:min-h-10"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === "fund" ? "Create Fund Mode Group" : "Create Split Mode Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
