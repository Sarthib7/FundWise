export const runtime = "edge"

import { FundWiseError } from "@/lib/server/fundwise-error"
import { listExpensesForGroupRead } from "@/lib/server/fundwise-reads"
import { addExpenseMutation } from "@/lib/server/mutations/expense"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

export const GET = withAuthenticatedHandler(
  { fallbackMessage: "Failed to list Expenses." },
  async ({ request, session }) => {
    const url = new URL(request.url)
    const groupId = url.searchParams.get("groupId")?.trim()

    if (!groupId) {
      throw new FundWiseError("Missing required groupId query parameter.")
    }

    return listExpensesForGroupRead(groupId, session.wallet)
  }
)

type AddExpenseBody = {
  groupId?: string
  payer?: string
  createdBy?: string
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

export const POST = withAuthenticatedHandler<AddExpenseBody>(
  { fallbackMessage: "Failed to create Expense.", walletField: "createdBy" },
  async ({ session, body }) => {
    if (
      !body.groupId ||
      !body.payer ||
      !body.createdBy ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.splitMethod ||
      !Array.isArray(body.splits)
    ) {
      throw new FundWiseError("Missing required Expense fields.")
    }

    if (body.payer !== session.wallet) {
      throw new FundWiseError(
        "Expense payer must match the authenticated wallet. Ask the payer to log this Expense from their own wallet.",
        400
      )
    }

    return addExpenseMutation({
      groupId: body.groupId,
      payer: body.payer,
      createdBy: body.createdBy,
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
  }
)
