import { NextResponse } from "next/server"
import { deleteExpenseMutation, updateExpenseMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { expenseId } = await context.params
    const body = (await request.json()) as {
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

    if (
      !expenseId ||
      !body.actorWallet ||
      !body.payer ||
      typeof body.amount !== "number" ||
      !body.mint ||
      !body.splitMethod ||
      !Array.isArray(body.splits)
    ) {
      throw new FundWiseError("Missing required Expense update fields.")
    }

    if (body.actorWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Expense editor.", 401)
    }

    await updateExpenseMutation({
      expenseId,
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

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to update Expense.")
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await requireAuthenticatedWallet()
    const { expenseId } = await context.params
    const body = (await request.json()) as { actorWallet?: string }

    if (!expenseId || !body.actorWallet) {
      throw new FundWiseError("Missing Expense delete details.")
    }

    if (body.actorWallet !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Expense creator.", 401)
    }

    await deleteExpenseMutation(expenseId, body.actorWallet)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to delete Expense.")
    return NextResponse.json({ error: message }, { status })
  }
}
