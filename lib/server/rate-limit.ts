import { FundWiseError } from "@/lib/server/fundwise-error"

export type RateLimitBucket = {
  count: number
  resetAt: number
}

export type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  now?: number
  store?: Map<string, RateLimitBucket>
}

const defaultRateLimitStore = new Map<string, RateLimitBucket>()
const MAX_TRACKED_KEYS = 2_000

function pruneExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) {
      store.delete(key)
    }
  }
}

export function checkRateLimit(options: RateLimitOptions) {
  const now = options.now ?? Date.now()
  const store = options.store ?? defaultRateLimitStore

  if (store.size > MAX_TRACKED_KEYS) {
    pruneExpiredBuckets(store, now)
  }

  const current = store.get(options.key)

  if (!current || current.resetAt <= now) {
    store.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return { allowed: true, remaining: options.limit - 1, resetAt: now + options.windowMs }
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt }
  }

  current.count += 1
  store.set(options.key, current)
  return { allowed: true, remaining: options.limit - current.count, resetAt: current.resetAt }
}

export function getClientIp(request: Request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim()
  if (cfConnectingIp) return cfConnectingIp

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (forwardedFor) return forwardedFor

  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "unknown"
}

export function enforceRateLimit(options: Omit<RateLimitOptions, "now" | "store">) {
  const result = checkRateLimit(options)

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
    throw new FundWiseError(
      `Too many wallet verification attempts. Try again in ${retryAfterSeconds} seconds.`,
      429
    )
  }

  return result
}
