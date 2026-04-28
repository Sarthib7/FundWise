import { NextResponse } from "next/server"
import { addExpenseMutation } from "@/lib/server/fundwise-mutations"
import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import { requireAuthenticatedWallet } from "@/lib/server/wallet-session"

export const runtime = "edge"

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
    })

    return NextResponse.json(expense)
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to create Expense.")
    return NextResponse.json({ error: message }, { status })
  }
}
