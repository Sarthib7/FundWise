export const runtime = "edge"

import { NextResponse } from "next/server"
import { getErrorDetails } from "@/lib/server/fundwise-error"
import {
  consumeTelegramLinkCode,
  deactivateTelegramWalletLink,
  getActiveTelegramWalletLink,
  normalizeTelegramId,
  normalizeTelegramLinkCode,
  requireFundyServiceAuth,
  serializeTelegramWalletLink,
} from "@/lib/server/fundy-telegram-auth"

export async function GET(request: Request) {
  try {
    await requireFundyServiceAuth(request)

    const url = new URL(request.url)
    const telegramId = normalizeTelegramId(url.searchParams.get("telegramId"))
    const link = await getActiveTelegramWalletLink(telegramId)

    if (!link) {
      return NextResponse.json({ linked: false })
    }

    return NextResponse.json({ linked: true, link: serializeTelegramWalletLink(link) })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to load Telegram wallet link.")
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    await requireFundyServiceAuth(request)

    const body = (await request.json()) as {
      code?: string
      telegramId?: string | number
      telegramUsername?: string | null
      telegramFirstName?: string | null
      telegramLastName?: string | null
    }

    const telegramId = normalizeTelegramId(body.telegramId)
    const code = normalizeTelegramLinkCode(body.code)
    const link = await consumeTelegramLinkCode({
      code,
      telegramId,
      telegramUsername: body.telegramUsername,
      telegramFirstName: body.telegramFirstName,
      telegramLastName: body.telegramLastName,
    })

    return NextResponse.json({ linked: true, wallet: link.wallet, link: serializeTelegramWalletLink(link) })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to link Telegram account.")
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireFundyServiceAuth(request)

    const body = (await request.json()) as { telegramId?: string | number }
    const telegramId = normalizeTelegramId(body.telegramId)
    await deactivateTelegramWalletLink(telegramId)

    return NextResponse.json({ linked: false })
  } catch (error) {
    const { status, message } = getErrorDetails(error, "Failed to unlink Telegram account.")
    return NextResponse.json({ error: message }, { status })
  }
}
