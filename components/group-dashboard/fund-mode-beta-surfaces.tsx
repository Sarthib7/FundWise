"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { FUND_MODE_BETA_PRICING, tokenAmountToUsdCents } from "@/lib/fund-mode-monetization"

type FundModeBetaSurfacesProps = {
  groupId: string
  authenticatedWallet: string
  groupCreatedAt: string
  memberCount: number
  contributionTotal: number // smallest token unit
  isGroupCreator?: boolean
}

// Aggregator component that mounts the FW-061 / FW-062 banners in one place
// above the Fund Mode dashboard, plus the FW-063 leave-pool action. Each
// banner self-hides when it has nothing useful to say so the UI stays quiet
// for healthy pools.
export function FundModeBetaSurfaces({
  groupId,
  authenticatedWallet,
  groupCreatedAt,
  memberCount,
  contributionTotal,
  isGroupCreator = false,
}: FundModeBetaSurfacesProps) {
  const daysSincePoolCreated = useMemo(() => {
    const created = new Date(groupCreatedAt).getTime()
    if (Number.isNaN(created)) return 0
    return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)))
  }, [groupCreatedAt])

  const contributionTotalUsdCents = tokenAmountToUsdCents(contributionTotal)
  const [showLeaveSurvey, setShowLeaveSurvey] = useState(false)

  return (
    <div className="mb-4 space-y-3">
      <FreeTierCapBanner
        groupId={groupId}
        memberCount={memberCount}
        contributionTotalUsdCents={contributionTotalUsdCents}
        authenticatedWallet={authenticatedWallet}
      />
      <MonthlyFeeWtpBanner
        groupId={groupId}
        daysSincePoolCreated={daysSincePoolCreated}
        authenticatedWallet={authenticatedWallet}
      />
      {!isGroupCreator && (
        <div className="text-right">
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowLeaveSurvey(true)}
          >
            Leave pool
          </button>
        </div>
      )}
      <ExitSurveyDialog
        groupId={groupId}
        open={showLeaveSurvey}
        onClose={() => setShowLeaveSurvey(false)}
        onLeft={() => {
          // Redirect to /groups after leaving so the now-stale dashboard
          // doesn't show 404 ledger states.
          if (typeof window !== "undefined") {
            window.location.href = "/groups"
          }
        }}
      />
    </div>
  )
}

type WtpBannerProps = {
  groupId: string
  daysSincePoolCreated: number
  authenticatedWallet: string
  emulatedUsdCents?: number
}

// FW-061: Monthly fee willingness-to-pay banner.
// Shows at pool creation and day 30, non-blocking, single-shot per pool per
// wallet thanks to localStorage de-duplication.
export function MonthlyFeeWtpBanner({
  groupId,
  daysSincePoolCreated,
  authenticatedWallet,
  emulatedUsdCents = FUND_MODE_BETA_PRICING.monthlySubscriptionUsdCents,
}: WtpBannerProps) {
  const localKey = `fundwise:wtp:${groupId}:${authenticatedWallet}`
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false
    return window.localStorage.getItem(localKey) === "submitted"
  })
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shouldShow = !dismissed && (daysSincePoolCreated <= 1 || daysSincePoolCreated >= 30)

  if (!shouldShow) return null

  const submit = async (response: "yes" | "no") => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await fetch("/api/monetization/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "monthly_fee_wtp",
          groupId,
          emulatedUsdCents,
          payload: { response, comment, daysSincePoolCreated },
        }),
      })
      if (!result.ok) {
        const json = (await result.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error ?? "Failed to submit response")
      }
      window.localStorage.setItem(localKey, "submitted")
      setDismissed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response")
    } finally {
      setSubmitting(false)
    }
  }

  const usdLabel = (emulatedUsdCents / 100).toFixed(2)

  return (
    <Card className="space-y-2 border-amber-300/40 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Badge>devnet beta · monetization survey</Badge>
          <h3 className="mt-1 text-sm font-semibold">
            If this were mainnet, this pool would cost ${usdLabel}/mo. Would
            you pay?
          </h3>
          <p className="text-xs text-muted-foreground">
            Honest signal helps lock the pricing model before any real billing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={submitting}
            onClick={() => submit("yes")}
          >
            Yes, I&apos;d pay
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={() => submit("no")}
          >
            No
          </Button>
        </div>
      </div>
      <Textarea
        placeholder="Optional: why?"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </Card>
  )
}

type FreeTierBannerProps = {
  groupId: string
  memberCount: number
  contributionTotalUsdCents: number
  authenticatedWallet: string
}

// FW-062: Free-tier limits emulation. Shows when a pool has bumped against
// the simulated free-tier wall (member count or AUM). Records the wall hit
// for telemetry; "upgrade" is a mock action.
export function FreeTierCapBanner({
  groupId,
  memberCount,
  contributionTotalUsdCents,
  authenticatedWallet,
}: FreeTierBannerProps) {
  const memberLimitReached =
    memberCount >= FUND_MODE_BETA_PRICING.freeTierMaxMembers
  const aumLimitReached =
    contributionTotalUsdCents >= FUND_MODE_BETA_PRICING.freeTierMaxAumUsdCents
  const overLimit = memberLimitReached || aumLimitReached

  const [acted, setActed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!overLimit || acted) return null

  const reportClick = async (action: "upgrade_intent" | "dismiss") => {
    setSubmitting(true)
    try {
      await fetch("/api/monetization/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "free_tier_cap",
          groupId,
          payload: {
            action,
            memberLimitReached,
            aumLimitReached,
            memberCount,
            contributionTotalUsdCents,
            wallet: authenticatedWallet,
          },
        }),
      })
      setActed(true)
    } catch {
      setActed(true) // best-effort telemetry
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="space-y-2 border-rose-300/40 bg-rose-50/40 p-4">
      <Badge variant="secondary">devnet beta · free-tier cap reached</Badge>
      <h3 className="text-sm font-semibold">
        This pool has hit the simulated free-tier limit.
      </h3>
      <ul className="text-xs text-muted-foreground">
        {memberLimitReached && (
          <li>
            Members: {memberCount} / {FUND_MODE_BETA_PRICING.freeTierMaxMembers}
          </li>
        )}
        {aumLimitReached && (
          <li>
            Simulated AUM: $
            {(contributionTotalUsdCents / 100).toFixed(0)} / $
            {(FUND_MODE_BETA_PRICING.freeTierMaxAumUsdCents / 100).toFixed(0)}
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        Nothing breaks — this banner exists to test where the wall hurts vs.
        helps before any real pricing ships.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={submitting}
          onClick={() => reportClick("upgrade_intent")}
        >
          Would upgrade
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => reportClick("dismiss")}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  )
}

type ExitSurveyDialogProps = {
  groupId: string
  open: boolean
  onClose: () => void
  onLeft: () => void
}

// FW-063: Beta exit survey. Three short questions before the leave action
// resolves. Survey submission is best-effort; the leave itself always
// proceeds if the survey persists or fails.
export function ExitSurveyDialog({
  groupId,
  open,
  onClose,
  onLeft,
}: ExitSurveyDialogProps) {
  const [pricingFairness, setPricingFairness] = useState(3)
  const [wouldPayConfidence, setWouldPayConfidence] = useState(3)
  const [featureRequests, setFeatureRequests] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const result = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exitSurvey: {
            pricingFairness,
            wouldPayConfidence,
            featureRequests: featureRequests.trim() || undefined,
          },
        }),
      })
      if (!result.ok) {
        const json = (await result.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error ?? "Failed to leave Group")
      }
      onLeft()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave Group")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Before you go</DialogTitle>
          <DialogDescription>
            3 quick questions. Beta findings will inform real Fund Mode pricing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Pricing felt fair (1–5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={pricingFairness}
              onChange={(event) => setPricingFairness(Number(event.target.value))}
            />
          </div>
          <div>
            <Label>Would-pay confidence on mainnet (1–5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={wouldPayConfidence}
              onChange={(event) =>
                setWouldPayConfidence(Number(event.target.value))
              }
            />
          </div>
          <div>
            <Label>Feature requests (optional)</Label>
            <Textarea
              rows={3}
              value={featureRequests}
              onChange={(event) => setFeatureRequests(event.target.value)}
              placeholder="What would have kept you in the pool?"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Stay
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Leaving…" : "Submit & leave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type CreationFeeDialogProps = {
  groupId: string
  open: boolean
  onClose: () => void
  onRecorded: () => void
  // Devnet-only: the dev wallet that receives the fee transfer; null disables
  // the "Pay" path (only opt-out shown).
  feeWalletConfigured: boolean
  onPayDevnetFee: () => Promise<{ txSig: string; amount: number; mint: string }>
}

// FW-047: devnet creation fee dialog. Caller is responsible for the actual
// devnet stablecoin transfer; this component records the outcome.
export function CreationFeeDialog({
  groupId,
  open,
  onClose,
  onRecorded,
  feeWalletConfigured,
  onPayDevnetFee,
}: CreationFeeDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const usdLabel = (FUND_MODE_BETA_PRICING.creationFeeUsdCents / 100).toFixed(2)

  const recordOutcome = async (outcome: "paid" | "skipped", extras?: {
    amount?: number
    mint?: string
    txSig?: string
  }) => {
    const result = await fetch(`/api/groups/${groupId}/creation-fee`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        outcome,
        amount: extras?.amount,
        mint: extras?.mint,
        txSig: extras?.txSig,
        emulatedUsdCents: FUND_MODE_BETA_PRICING.creationFeeUsdCents,
      }),
    })
    if (!result.ok) {
      const json = (await result.json().catch(() => ({}))) as { error?: string }
      throw new Error(json.error ?? "Failed to record creation fee")
    }
  }

  const pay = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const transfer = await onPayDevnetFee()
      await recordOutcome("paid", transfer)
      onRecorded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fee payment failed")
    } finally {
      setSubmitting(false)
    }
  }

  const skip = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await recordOutcome("skipped")
      onRecorded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record skip")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creation fee (devnet beta)</DialogTitle>
          <DialogDescription>
            On mainnet, spinning up a Fund Mode Treasury will be a ${usdLabel}{" "}
            one-time fee. On devnet you can pay in test stablecoin or skip —
            either choice helps us validate willingness-to-pay.
          </DialogDescription>
        </DialogHeader>
        {!feeWalletConfigured && (
          <p className="text-xs text-muted-foreground">
            <code>FUNDWISE_BETA_FEE_WALLET</code> is not configured — the pay
            option is disabled in this environment.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={skip}
          >
            Skip for beta
          </Button>
          <Button
            disabled={submitting || !feeWalletConfigured}
            onClick={pay}
          >
            {submitting ? "Processing…" : `Pay ${usdLabel} (devnet)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
