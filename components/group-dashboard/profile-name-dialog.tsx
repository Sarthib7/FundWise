"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

type ProfileNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileName: string
  maxLength: number
  isSaving: boolean
  onProfileNameChange: (value: string) => void
  onSave: () => void | Promise<void>
}

export function ProfileNameDialog({
  open,
  onOpenChange,
  profileName,
  maxLength,
  isSaving,
  onProfileNameChange,
  onSave,
}: ProfileNameDialogProps) {
  const trimmedName = profileName.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your display name</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          aria-busy={isSaving}
          onSubmit={(event) => {
            event.preventDefault()
            void onSave()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="profile-display-name">Display Name</Label>
            <Input
              id="profile-display-name"
              type="text"
              autoComplete="nickname"
              spellCheck={false}
              value={profileName}
              maxLength={maxLength}
              onChange={(event) => onProfileNameChange(event.target.value)}
              placeholder="Add the name your Group should see"
              aria-describedby="profile-display-name-hint profile-display-name-count"
            />
            <div className="flex items-center justify-between gap-3 text-xs">
              <p id="profile-display-name-hint" className="text-muted-foreground">
                This name is tied to your wallet and reused across every Group you join.
              </p>
              <p
                id="profile-display-name-count"
                className="font-mono text-muted-foreground tabular-nums"
              >
                {profileName.length}/{maxLength}
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90"
              disabled={isSaving || !trimmedName}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Name
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
