"use client"

import { useCallback, useEffect, useState } from "react"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
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
import type { ActivityItem } from "@/lib/api-types"
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  convertToUsd,
  type SupportedCurrency,
} from "@/lib/currency"
import { ChevronDown, Loader2 } from "lucide-react"

type MemberRow = Database["public"]["Tables"]["members"]["Row"]
type SplitMethod = Database["public"]["Enums"]["split_method"]
type ActivityExpense = Extract<ActivityItem, { type: "expense" }>["data"]
type ExpenseCustomSplitValues = Record<string, string>

export type ExpenseCurrencyState = {
  sourceCurrency: SupportedCurrency
  conversionRate: number | null
}

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
  onCurrencyStateChange: (state: ExpenseCurrencyState) => void
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
  onCurrencyStateChange,
  onSubmit,
}: ExpenseDialogProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [sourceCurrency, setSourceCurrency] = useState<SupportedCurrency>("USD")
  const [convertedUsdDisplay, setConvertedUsdDisplay] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionRate, setConversionRate] = useState<number | null>(null)

  const isDefaultSplit = splitMethod === "equal"
  const isNonUsd = sourceCurrency !== "USD"
  const percentageTotal = expenseDialogParticipantWallets.reduce((total, wallet) => {
    const parsedValue = Number(customSplitValues[wallet] || "0")
    return total + (Number.isFinite(parsedValue) ? parsedValue : 0)
  }, 0)

  // When editing, restore the source currency from the expense
  useEffect(() => {
    if (editingExpense) {
      const savedCurrency = (editingExpense as Record<string, unknown>).source_currency as string | undefined
      if (savedCurrency && SUPPORTED_CURRENCIES.includes(savedCurrency as SupportedCurrency)) {
        setSourceCurrency(savedCurrency as SupportedCurrency)
      }
    }
  }, [editingExpense])

  // Fetch conversion when amount or currency changes
  useEffect(() => {
    if (!isNonUsd || !expenseAmount) {
      setConvertedUsdDisplay(null)
      setConversionRate(null)
      return
    }

    const parsedAmount = Number(expenseAmount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setConvertedUsdDisplay(null)
      setConversionRate(null)
      return
    }

    let cancelled = false
    setIsConverting(true)

    convertToUsd(parsedAmount, sourceCurrency)
      .then(({ usdAmount, rate }) => {
        if (!cancelled) {
          setConvertedUsdDisplay(`≈ $${usdAmount.toFixed(2)} USDC`)
          setConversionRate(rate)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConvertedUsdDisplay("Rate unavailable")
          setConversionRate(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsConverting(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [expenseAmount, sourceCurrency, isNonUsd])

  // Reset currency when dialog opens for new expense
  useEffect(() => {
    if (open && !editingExpense) {
      setSourceCurrency("USD")
      setConvertedUsdDisplay(null)
      setConversionRate(null)
    }
  }, [open, editingExpense])

  const handleCurrencyChange = useCallback((currency: string) => {
    setSourceCurrency(currency as SupportedCurrency)
  }, [])

  useEffect(() => {
    onCurrencyStateChange({ sourceCurrency, conversionRate })
  }, [conversionRate, onCurrencyStateChange, sourceCurrency])

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={editingExpense ? "Edit Expense" : "Add Expense"}
    >
      <form
        className="space-y-5 py-2"
        aria-busy={isSubmitting}
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit()
        }}
      >
          {/* Field 1: Amount + Currency */}
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <div className="flex gap-2">
              <div className="flex-1">
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
              <Select value={sourceCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-[100px]" aria-label="Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {CURRENCY_SYMBOLS[currency]} {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Converted amount display */}
            {isNonUsd && (
              <div className="flex items-center gap-2 h-6">
                {isConverting ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Converting...
                  </span>
                ) : convertedUsdDisplay ? (
                  <span className="text-xs font-medium text-muted-foreground">
                    {convertedUsdDisplay}
                  </span>
                ) : null}
              </div>
            )}
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
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div className="space-y-1">
                      <Label>
                        {splitMethod === "exact"
                          ? `Exact ${tokenName} amounts`
                          : splitMethod === "percentage"
                            ? "Percentages"
                            : "Relative shares"}
                      </Label>
                      {splitMethod === "percentage" ? (
                        <p className="text-xs text-muted-foreground">
                          Edit any Member. FundWise assigns the remaining percentage to the rest.
                        </p>
                      ) : null}
                    </div>
                    {splitMethod === "percentage" ? (
                      <span className="rounded-full border px-2 py-1 text-xs font-medium text-muted-foreground">
                        {percentageTotal.toFixed(2).replace(/\.?0+$/, "")}% allocated
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-3 rounded-lg border p-4">
                    {expenseDialogParticipantWallets.map((participantWallet) => {
                      const inputId = `split-value-${participantWallet}`
                      const participantLabel =
                        memberNameByWallet.get(participantWallet) || shortWallet(participantWallet)

                      return (
                        <div
                          key={participantWallet}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center sm:gap-3"
                        >
                          <label htmlFor={inputId} className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {participantLabel}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {participantWallet === expensePayer ? "Selected as payer" : "Included in this Expense"}
                            </span>
                          </label>
                          <div className="relative">
                            <Input
                              id={inputId}
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
                              className={splitMethod === "percentage" ? "pr-8" : undefined}
                            />
                            {splitMethod === "percentage" ? (
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                %
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
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
    </ResponsiveSheet>
  )
}
