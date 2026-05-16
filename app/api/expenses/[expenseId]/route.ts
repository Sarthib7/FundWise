export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { getExpenseRead } from "@/lib/server/fundwise-reads"
import {
  deleteExpenseMutation,
  updateExpenseMutation,
} from "@/lib/server/mutations/expense"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type ExpenseParams = { expenseId: string }

export const GET = withAuthenticatedHandler<Record<string, unknown>, ExpenseParams>(
  { fallbackMessage: "Failed to load Expense." },
  async ({ session, params }) => {
    if (!params.expenseId) {
      throw new FundWiseError("Missing Expense id.")
    }

    return getExpenseRead(params.expenseId, session.wallet)
  }
)

type UpdateExpenseBody = {
  actorWallet?: string
  payer?: string
  amount?: number
  mint?: string
  memo?: string
  category?: string
  splitMethod?: "equal" | "exact" | "shares" | "percentage"
  splits?: { wallet: string; share: number }[]
  sourceCurrency?: string
  sourceAmount?: number
  exchangeRate?: number
  exchangeRateSource?: string
  exchangeRateAt?: string
}

export const PATCH = withAuthenticatedHandler<UpdateExpenseBody, ExpenseParams>(
  { fallbackMessage: "Failed to update Expense.", walletField: "actorWallet" },
  async ({ session, body, params }) => {
    if (
      !params.expenseId ||
      !body.actorWallet ||
      !body.payer ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.splitMethod ||
      !Array.isArray(body.splits)
    ) {
      throw new FundWiseError("Missing required Expense update fields.")
    }

    if (body.payer !== session.wallet) {
      throw new FundWiseError(
        "Expense payer must match the authenticated wallet. Ask the payer to log this Expense from their own wallet.",
        400
      )
    }

    await updateExpenseMutation({
      expenseId: params.expenseId,
      actorWallet: body.actorWallet,
      payer: body.payer,
      amount: body.amount,
      mint: body.mint,
      memo: body.memo,
      category: body.category,
      splitMethod: body.splitMethod,
      splits: body.splits,
      sourceCurrency: body.sourceCurrency,
      sourceAmount: body.sourceAmount,
      exchangeRate: body.exchangeRate,
      exchangeRateSource: body.exchangeRateSource,
      exchangeRateAt: body.exchangeRateAt,
    })

    return { ok: true }
  }
)

type DeleteExpenseBody = { actorWallet?: string }

export const DELETE = withAuthenticatedHandler<DeleteExpenseBody, ExpenseParams>(
  { fallbackMessage: "Failed to delete Expense.", walletField: "actorWallet" },
  async ({ body, params }) => {
    if (!params.expenseId || !body.actorWallet) {
      throw new FundWiseError("Missing Expense delete details.")
    }

    await deleteExpenseMutation(params.expenseId, body.actorWallet)

    return { ok: true }
  }
)
