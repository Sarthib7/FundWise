"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Database } from "@/lib/database.types"
import type { ActivityItem } from "@/lib/db"
import { ChevronDown, Loader2 } from "lucide-react"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type SplitMethod = Database["public"]["Enums"]["split_method"]
type ActivityExpense = Extract<ActivityItem, { type: "expense" }>["data"]
type ExpenseCustomSplitValues = Record<string, string>

type ExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingExpense: ActivityExpense | null
  tokenName: string
  members: MemberRow[]
  expenseAmount: string
  expenseMemo: string
  expenseCategory: string
  expensePayer: string
  splitMethod: SplitMethod
  customSplitValues: ExpenseCustomSplitValues
  expenseDialogParticipantWallets: string[]
  memberNameByWallet: Map<string, string>
  expenseCategories: readonly string[]
  expenseSplitMethods: readonly SplitMethod[]
  isSubmitting: boolean
  onExpenseAmountChange: (value: string) => void
  onExpenseMemoChange: (value: string) => void
  onExpenseCategoryChange: (value: string) => void
  onExpensePayerChange: (value: string) => void
  onSplitMethodChange: (method: SplitMethod) => void
  onCustomSplitValueChange: (wallet: string, value: string) => void
  onSubmit: () => void | Promise<void>
}

function shortWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function ExpenseDialog({
  open,
  onOpenChange,
  editingExpense,
  tokenName,
  members,
  expenseAmount,
  expenseMemo,
  expenseCategory: _expenseCategory,
  expensePayer,
  splitMethod,
  customSplitValues,
  expenseDialogParticipantWallets,
  memberNameByWallet,
  expenseCategories: _expenseCategories,
  expenseSplitMethods,
  isSubmitting,
  onExpenseAmountChange,
  onExpenseMemoChange,
  onExpenseCategoryChange: _onExpenseCategoryChange,
  onExpensePayerChange,
  onSplitMethodChange,
  onCustomSplitValueChange,
  onSubmit,
}: ExpenseDialogProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const isDefaultSplit = splitMethod === "equal"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5 py-2"
          aria-busy={isSubmitting}
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit()
          }}
        >
          {/* Field 1: Amount */}
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount ({tokenName})</Label>
            <Input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              placeholder="0.00"
              value={expenseAmount}
              onChange={(event) => onExpenseAmountChange(event.target.value)}
              className="text-lg font-semibold"
            />
          </div>

          {/* Field 2: What was it for? */}
          <div className="space-y-2">
            <Label htmlFor="expense-description">What was it for?</Label>
            <Input
              id="expense-description"
              placeholder="e.g., Dinner at Padaria, Uber to airport"
              value={expenseMemo}
              onChange={(event) => onExpenseMemoChange(event.target.value)}
            />
          </div>

          {/* Field 3: Paid by */}
          <div className="space-y-2">
            <Label htmlFor="expense-payer">Paid by</Label>
            <Select value={expensePayer} onValueChange={onExpensePayerChange}>
              <SelectTrigger id="expense-payer" className="w-full">
                <SelectValue placeholder="Select the payer" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.wallet}>
                    {member.display_name || shortWallet(member.wallet)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Default split hint */}
          {isDefaultSplit && !advancedOpen && (
            <p className="text-xs text-muted-foreground">
              Split equally among {expenseDialogParticipantWallets.length} Member{expenseDialogParticipantWallets.length !== 1 ? "s" : ""}
            </p>
          )}

          {/* Advanced: split options */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground -mx-1"
              >
                <span>
                  {advancedOpen ? "Hide" : "Show"} split options
                  {!isDefaultSplit && (
                    <span className="ml-1 text-accent font-medium">
                      ({splitMethod})
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Split method selector */}
              <div className="space-y-2">
                <Label>Split Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {expenseSplitMethods.map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={splitMethod === method ? "default" : "outline"}
                      size="sm"
                      onClick={() => onSplitMethodChange(method)}
                      className={splitMethod === method ? "bg-accent hover:bg-accent/90" : ""}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom split values (when not equal) */}
              {splitMethod !== "equal" && (
                <div className="space-y-3">
                  <Label>
                    {splitMethod === "exact"
                      ? `Exact ${tokenName} amounts`
                      : splitMethod === "percentage"
                        ? "Percentages"
                        : "Relative shares"}
                  </Label>
                  <div className="space-y-3 rounded-lg border p-4">
                    {expenseDialogParticipantWallets.map((participantWallet) => (
                      <div
                        key={participantWallet}
                        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center sm:gap-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {memberNameByWallet.get(participantWallet) || shortWallet(participantWallet)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participantWallet === expensePayer ? "Selected as payer" : "Included in this Expense"}
                          </p>
                        </div>
                        <Input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          spellCheck={false}
                          step={splitMethod === "shares" ? "0.1" : "0.01"}
                          placeholder={splitMethod === "shares" ? "1" : "0.00"}
                          value={customSplitValues[participantWallet] || ""}
                          onChange={(event) =>
                            onCustomSplitValueChange(participantWallet, event.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {splitMethod === "equal"
                  ? `Split equally among ${expenseDialogParticipantWallets.length} Member${expenseDialogParticipantWallets.length !== 1 ? "s" : ""}`
                  : `This Expense currently includes ${expenseDialogParticipantWallets.length} Member${expenseDialogParticipantWallets.length !== 1 ? "s" : ""}.`}
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Button
            type="submit"
            className="min-h-11 w-full bg-accent hover:bg-accent/90"
            disabled={isSubmitting || !expenseAmount || !expensePayer}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {editingExpense ? "Save Changes" : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
