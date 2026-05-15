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

// FW-054: distributed rate-limit backend. When the FundWise edge runtime has
// a Cloudflare KV namespace bound as `FUNDWISE_RATE_LIMIT_KV`, the rate
// counters live in KV and survive isolate boundaries. When the binding is
// absent (local dev, vercel deploys), we fall back to the in-process store
// below — single-isolate, but still useful as a fast burst guard.
type KVNamespace = {
  get(key: string, options?: { type?: "json" }): Promise<unknown>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<unknown>
}

function getDistributedStore(): KVNamespace | null {
  const env = (globalThis as { FUNDWISE_RATE_LIMIT_KV?: KVNamespace })
    .FUNDWISE_RATE_LIMIT_KV
  if (env && typeof env.get === "function" && typeof env.put === "function") {
    return env
  }
  return null
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

// =============================================
// FW-054: Distributed rate limit for money-moving routes.
// =============================================
// Each protected route names a "scope" (e.g. "settlements:create") and the
// composite key is `${scope}:${wallet || ip}`. When Cloudflare KV is bound we
// store the bucket as JSON with a TTL equal to the window. When KV isn't
// available we transparently fall back to the in-process counter so dev and
// preview deploys still get burst protection.

export type DistributedRateLimitInput = {
  scope: string
  identity: string // wallet preferred; fall back to IP
  limit: number
  windowMs: number
}

async function checkDistributedRateLimit(input: DistributedRateLimitInput) {
  const store = getDistributedStore()
  const now = Date.now()
  const key = `${input.scope}:${input.identity}`

  if (!store) {
    return checkRateLimit({
      key,
      limit: input.limit,
      windowMs: input.windowMs,
    })
  }

  const existing = (await store
    .get(key, { type: "json" })
    .catch(() => null)) as RateLimitBucket | null

  if (!existing || existing.resetAt <= now) {
    const fresh: RateLimitBucket = { count: 1, resetAt: now + input.windowMs }
    await store
      .put(key, JSON.stringify(fresh), {
        expirationTtl: Math.max(60, Math.ceil(input.windowMs / 1000)),
      })
      .catch(() => {})
    return { allowed: true, remaining: input.limit - 1, resetAt: fresh.resetAt }
  }

  if (existing.count >= input.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  const updated: RateLimitBucket = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  }
  await store
    .put(key, JSON.stringify(updated), {
      expirationTtl: Math.max(
        60,
        Math.ceil((existing.resetAt - now) / 1000)
      ),
    })
    .catch(() => {})
  return {
    allowed: true,
    remaining: input.limit - updated.count,
    resetAt: existing.resetAt,
  }
}

export async function enforceDistributedRateLimit(input: DistributedRateLimitInput) {
  const result = await checkDistributedRateLimit(input)
  if (!result.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.resetAt - Date.now()) / 1000)
    )
    throw new FundWiseError(
      `Rate limit exceeded for ${input.scope}. Try again in ${retryAfterSeconds} seconds.`,
      429
    )
  }
  return result
}

// Sensible defaults per scope. Tuned to the devnet beta usage pattern; tighten
// before mainnet rehearsal if logs show legitimate hot paths bumping these.
export const FUNDWISE_RATE_LIMITS = {
  settlement_create: { limit: 12, windowMs: 60_000 },
  contribution_create: { limit: 12, windowMs: 60_000 },
  proposal_create: { limit: 20, windowMs: 60_000 },
  proposal_review: { limit: 30, windowMs: 60_000 },
  proposal_execute: { limit: 12, windowMs: 60_000 },
  treasury_init: { limit: 4, windowMs: 60_000 },
  member_role: { limit: 20, windowMs: 60_000 },
  group_leave: { limit: 6, windowMs: 60_000 },
  creation_fee: { limit: 6, windowMs: 60_000 },
  monetization_response: { limit: 30, windowMs: 60_000 },
} as const

export type FundWiseRateLimitScope = keyof typeof FUNDWISE_RATE_LIMITS

export async function enforceFundWiseRateLimit(
  scope: FundWiseRateLimitScope,
  identity: string
) {
  const config = FUNDWISE_RATE_LIMITS[scope]
  return enforceDistributedRateLimit({
    scope,
    identity,
    ...config,
  })
}
