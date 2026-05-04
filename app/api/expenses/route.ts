import { NextResponse } from "next/server"
import { addExpenseMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { listExpensesForGroupRead } from "@/lib/server/fundwise-reads"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export async function GET(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    const url = new URL(request.url)
    const groupId = url.searchParams.get("groupId")?.trim()

    if (!groupId) {
      throw new FundWiseError("Missing required groupId query parameter.")
    }

    const expenses = await listExpensesForGroupRead(groupId, session.wallet)
    return NextResponse.json(expenses)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to list Expenses.")
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedWallet()
    const body = (await request.json()) as {
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

    if (body.createdBy !== session.wallet) {
      throw new FundWiseError("Authenticated wallet does not match the Expense creator.", 401)
    }

    const expense = await addExpenseMutation({
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

    return NextResponse.json(expense)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create Expense.")
    return NextResponse.json({ error: message }, { status })
  }
}
