import type { Database } from "@/lib/database.types"
import { FundWiseError } from "@/lib/server/fundwise-error"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"
import { normalizeWalletAddress } from "@/lib/server/wallet-session"

export const TELEGRAM_LINK_CODE_TTL_MS = 5 * 60 * 1000

const LINK_CODE_PREFIX = "FW-"
const LINK_CODE_LENGTH = 6
const LINK_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const textEncoder = new TextEncoder()

type TelegramWalletLinkInsert = Database["public"]["Tables"]["telegram_wallet_links"]["Insert"]
type TelegramWalletLinkRow = Database["public"]["Tables"]["telegram_wallet_links"]["Row"]
type TelegramLinkCodeInsert = Database["public"]["Tables"]["telegram_link_codes"]["Insert"]

function getAdmin() {
  return getSupabaseAdmin()
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || ""
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value))
  return bytesToHex(new Uint8Array(digest))
}

async function timingSafeEqualText(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([sha256Hex(left), sha256Hex(right)])
  return leftHash === rightHash
}

export async function requireFundyServiceAuth(request: Request) {
  const expectedKey = process.env.FUNDWISE_SERVICE_API_KEY?.trim()

  if (!expectedKey) {
    throw new FundWiseError("FUNDWISE_SERVICE_API_KEY is not configured.", 500)
  }

  const suppliedKey = getBearerToken(request)

  if (!suppliedKey || !(await timingSafeEqualText(suppliedKey, expectedKey))) {
    throw new FundWiseError("Fundy service authentication required.", 401)
  }
}

export function normalizeTelegramId(value: unknown) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return String(value)
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (/^[1-9][0-9]{0,19}$/.test(trimmed)) {
      return trimmed
    }
  }

  throw new FundWiseError("A valid Telegram user id is required.")
}

export function normalizeTelegramLinkCode(value: unknown) {
  if (typeof value !== "string") {
    throw new FundWiseError("A valid Telegram link code is required.")
  }

  const normalized = value.trim().toUpperCase()

  if (!/^FW-[A-Z2-9]{6}$/.test(normalized)) {
    throw new FundWiseError("Telegram link code must look like FW-XXXXXX.")
  }

  return normalized
}

export function createTelegramLinkCode(randomBytes?: Uint8Array) {
  const bytes = randomBytes ?? crypto.getRandomValues(new Uint8Array(LINK_CODE_LENGTH))
  let suffix = ""

  for (const byte of bytes) {
    suffix += LINK_CODE_ALPHABET[byte % LINK_CODE_ALPHABET.length]
  }

  return `${LINK_CODE_PREFIX}${suffix}`
}

export async function hashTelegramLinkCode(code: string) {
  return sha256Hex(normalizeTelegramLinkCode(code))
}

export async function createTelegramLinkCodeRecord(wallet: string) {
  const normalizedWallet = normalizeWalletAddress(wallet)
  const now = Date.now()
  const expiresAt = new Date(now + TELEGRAM_LINK_CODE_TTL_MS).toISOString()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = createTelegramLinkCode()
    const codeHash = await hashTelegramLinkCode(code)
    const insert: TelegramLinkCodeInsert = {
      code_hash: codeHash,
      wallet: normalizedWallet,
      expires_at: expiresAt,
    }

    const { error } = await getAdmin().from("telegram_link_codes").insert(insert)

    if (!error) {
      return { code, expiresAt }
    }

    if (error.code !== "23505") {
      throw new FundWiseError(`Failed to create Telegram link code: ${error.message}`)
    }
  }

  throw new FundWiseError("Failed to create a unique Telegram link code. Try again.", 500)
}

export async function consumeTelegramLinkCode(data: {
  code: string
  telegramId: string
  telegramUsername?: string | null
  telegramFirstName?: string | null
  telegramLastName?: string | null
}) {
  const codeHash = await hashTelegramLinkCode(data.code)
  const now = new Date().toISOString()

  const { data: consumedCode, error: consumeError } = await getAdmin()
    .from("telegram_link_codes")
    .update({ used_at: now })
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("wallet, expires_at")
    .maybeSingle()

  if (consumeError) {
    throw new FundWiseError(`Failed to validate Telegram link code: ${consumeError.message}`)
  }

  if (!consumedCode) {
    throw new FundWiseError("Telegram link code is invalid, expired, or already used.", 401)
  }

  const linkInsert: TelegramWalletLinkInsert = {
    telegram_id: data.telegramId,
    telegram_username: normalizeOptionalText(data.telegramUsername, 64),
    telegram_first_name: normalizeOptionalText(data.telegramFirstName, 128),
    telegram_last_name: normalizeOptionalText(data.telegramLastName, 128),
    wallet: consumedCode.wallet,
    active: true,
  }

  const { error: deactivateError } = await getAdmin()
    .from("telegram_wallet_links")
    .update({ active: false, deactivated_at: now })
    .eq("telegram_id", data.telegramId)
    .eq("active", true)

  if (deactivateError) {
    throw new FundWiseError(`Failed to replace previous Telegram wallet link: ${deactivateError.message}`)
  }

  const { data: link, error: insertError } = await getAdmin()
    .from("telegram_wallet_links")
    .insert(linkInsert)
    .select("*")
    .single()

  if (insertError) {
    throw new FundWiseError(`Failed to link Telegram account: ${insertError.message}`)
  }

  return link as TelegramWalletLinkRow
}

export async function getActiveTelegramWalletLink(telegramId: string) {
  const { data, error } = await getAdmin()
    .from("telegram_wallet_links")
    .select("*")
    .eq("telegram_id", telegramId)
    .eq("active", true)
    .maybeSingle()

  if (error) {
    throw new FundWiseError(`Failed to load Telegram wallet link: ${error.message}`)
  }

  return (data as TelegramWalletLinkRow | null) ?? null
}

export async function deactivateTelegramWalletLink(telegramId: string) {
  const now = new Date().toISOString()
  const { error } = await getAdmin()
    .from("telegram_wallet_links")
    .update({ active: false, deactivated_at: now })
    .eq("telegram_id", telegramId)
    .eq("active", true)

  if (error) {
    throw new FundWiseError(`Failed to unlink Telegram account: ${error.message}`)
  }
}

export function serializeTelegramWalletLink(link: TelegramWalletLinkRow) {
  return {
    telegramId: link.telegram_id,
    telegramUsername: link.telegram_username,
    telegramFirstName: link.telegram_first_name,
    telegramLastName: link.telegram_last_name,
    wallet: link.wallet,
    linkedAt: link.created_at,
  }
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const trimmed = value?.trim() || null

  if (!trimmed) {
    return null
  }

  return trimmed.slice(0, maxLength)
}
