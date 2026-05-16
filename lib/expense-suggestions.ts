// =============================================
// FW-044 helper: compute auto-suggested reimbursement proposals
// =============================================
// Pure-data helper used by both the dashboard snapshot and tests. Given the
// Fund Mode Group's expense activity and existing pending/approved proposals,
// suggest reimbursements for any "pool" expense whose payer has not already
// been reimbursed.
export type SuggestedReimbursement = {
  expenseId: string
  payerWallet: string
  amount: number
  mint: string
  memo: string
  createdAt: string
}

export function computeSuggestedReimbursements(input: {
  groupMode: "split" | "fund"
  stablecoinMint: string
  expenses: Array<{
    id: string
    payer: string
    amount: number
    mint: string
    memo: string | null
    category: string | null
    created_at: string
    deleted_at: string | null
  }>
  proposals: Array<{
    recipient_wallet: string | null
    amount: number | null
    mint: string | null
    status: string
    kind: string
  }>
}): SuggestedReimbursement[] {
  if (input.groupMode !== "fund") {
    return []
  }

  // Sum (recipient, mint, amount) coverage for non-rejected reimbursement /
  // exit-refund proposals so we don't suggest a refund for something already
  // queued or paid.
  const coveredByRecipient = new Map<string, number>()
  for (const proposal of input.proposals) {
    if (proposal.status === "rejected" || proposal.status === "cancelled") continue
    if (proposal.kind !== "reimbursement" && proposal.kind !== "exit_refund") continue
    if (!proposal.recipient_wallet || proposal.amount === null) continue
    const key = `${proposal.recipient_wallet}:${proposal.mint ?? input.stablecoinMint}`
    coveredByRecipient.set(key, (coveredByRecipient.get(key) ?? 0) + proposal.amount)
  }

  const suggestions: SuggestedReimbursement[] = []

  for (const expense of input.expenses) {
    if (expense.deleted_at) continue
    if (expense.amount <= 0) continue
    if (expense.mint !== input.stablecoinMint) continue
    if ((expense.category ?? "") !== "pool") continue

    const key = `${expense.payer}:${expense.mint}`
    const alreadyCovered = coveredByRecipient.get(key) ?? 0

    if (alreadyCovered >= expense.amount) {
      // Reduce covered budget so the next expense from the same payer also
      // gets evaluated correctly.
      coveredByRecipient.set(key, alreadyCovered - expense.amount)
      continue
    }

    suggestions.push({
      expenseId: expense.id,
      payerWallet: expense.payer,
      amount: expense.amount,
      mint: expense.mint,
      memo: expense.memo
        ? `Reimburse pool expense — ${expense.memo}`
        : "Reimburse pool expense",
      createdAt: expense.created_at,
    })

    // Subtract what we just covered so subsequent expenses from the same
    // payer count.
    coveredByRecipient.set(key, alreadyCovered)
  }

  return suggestions
}
