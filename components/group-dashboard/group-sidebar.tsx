"use client"

import { useState } from "react"
import { WalletAvatar } from "@/components/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Database } from "@/lib/database.types"
import { Bot, Check, Copy, Loader2, Pencil, Share2, Users } from "lucide-react"
import { toast } from "sonner"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]

type GroupSidebarProps = {
  isFundMode: boolean
  isMember: boolean
  walletAddress: string
  memberCount: number
  members: MemberRow[]
  groupCreatorWallet: string
  onInvite: () => void
  onEditProfile: () => void
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function GroupSidebar({
  isFundMode,
  isMember,
  walletAddress,
  memberCount,
  members,
  groupCreatorWallet,
  onInvite,
  onEditProfile,
}: GroupSidebarProps) {
  const visibleMemberCount = isMember ? members.length : memberCount
  const [telegramCode, setTelegramCode] = useState<string | null>(null)
  const [telegramCodeExpiresAt, setTelegramCodeExpiresAt] = useState<string | null>(null)
  const [isCreatingTelegramCode, setIsCreatingTelegramCode] = useState(false)
  const [telegramCodeCopied, setTelegramCodeCopied] = useState(false)

  async function createFundyLinkCode() {
    setIsCreatingTelegramCode(true)
    setTelegramCodeCopied(false)

    try {
      const response = await fetch("/api/telegram/link-code", { method: "POST" })
      const payload = (await response.json()) as { code?: string; expiresAt?: string; error?: string }

      if (!response.ok || !payload.code || !payload.expiresAt) {
        throw new Error(payload.error || "Failed to create Fundy link code")
      }

      setTelegramCode(payload.code)
      setTelegramCodeExpiresAt(payload.expiresAt)
      toast.success("Fundy link code created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create Fundy link code")
    } finally {
      setIsCreatingTelegramCode(false)
    }
  }

  async function copyFundyLinkCommand() {
    if (!telegramCode) {
      return
    }

    await navigator.clipboard.writeText(`/link ${telegramCode}`)
    setTelegramCodeCopied(true)
    toast.success("Fundy link command copied")
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="text-sm text-muted-foreground">
              {isMember
                ? members.length === 0
                  ? "Invite the first Member to start using this Group together."
                  : `${members.length} Member${members.length === 1 ? "" : "s"} in this Group.`
                : `${visibleMemberCount} Member${visibleMemberCount === 1 ? "" : "s"} in this Group. Join to view the full Member list.`}
            </p>
          </div>
          <Badge variant="outline">
            {visibleMemberCount}
          </Badge>
        </div>

        {!isMember ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-8 w-8 opacity-50" />
            <p className="font-medium text-foreground">Member list hidden until you join</p>
            <p className="mt-1 text-xs">
              Join this Group to view wallet labels, creator status, and your shared profile display names.
            </p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-8 w-8 opacity-50" />
            <p className="font-medium text-foreground">No Members yet</p>
            <p className="mt-1 text-xs">
              Share the invite link or QR so the first Member can join and start logging Expenses or Contributions.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11"
              onClick={onInvite}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Invite Members
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isCreator = member.wallet === groupCreatorWallet
              const isViewer = member.wallet === walletAddress
              const primaryLabel = member.display_name || shortWallet(member.wallet)
              const showSecondaryWallet = Boolean(member.display_name)

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <WalletAvatar address={member.wallet} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {primaryLabel}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {showSecondaryWallet ? (
                        <span className="font-mono">{shortWallet(member.wallet)}</span>
                      ) : null}
                      {isCreator ? (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Creator
                        </Badge>
                      ) : null}
                      {isViewer ? (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          You
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {isViewer ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-foreground"
                      onClick={onEditProfile}
                      aria-label="Edit your global profile display name"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {isMember && walletAddress ? (
          <>
            <p className="mt-4 text-xs text-muted-foreground">
              Your profile display name follows your wallet across every Group.
            </p>
            {members.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 min-h-11 w-full"
                onClick={onInvite}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            ) : null}
          </>
        ) : null}
      </Card>

      {isMember && walletAddress ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-accent/10 p-2 text-accent">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">Link Fundy</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate a 5-minute code, then DM Fundy with the link command to connect Telegram to this wallet.
              </p>
            </div>
          </div>

          {telegramCode ? (
            <div className="mt-4 rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Paste this in Fundy
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 font-mono text-sm">
                <span className="truncate">/link {telegramCode}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={copyFundyLinkCommand}
                  aria-label="Copy Fundy link command"
                >
                  {telegramCodeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {telegramCodeExpiresAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Expires at {new Date(telegramCodeExpiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
                  Generate a new code if it expires.
                </p>
              ) : null}
            </div>
          ) : null}

          <Button
            type="button"
            variant={telegramCode ? "outline" : "default"}
            className="mt-4 min-h-11 w-full"
            onClick={createFundyLinkCode}
            disabled={isCreatingTelegramCode}
          >
            {isCreatingTelegramCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            {telegramCode ? "Generate new Fundy code" : "Generate Fundy link code"}
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
