import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  FUNDWISE_RATE_LIMITS,
  enforceDistributedRateLimit,
  enforceFundWiseRateLimit,
} from "@/lib/server/rate-limit"

afterEach(() => {
  // Remove any test-injected KV binding so other tests don't leak state.
  delete (globalThis as { FUNDWISE_RATE_LIMIT_KV?: unknown }).FUNDWISE_RATE_LIMIT_KV
})

describe("enforceDistributedRateLimit (in-process fallback)", () => {
  it("allows the first hit", async () => {
    const result = await enforceDistributedRateLimit({
      scope: "test:fallback:first",
      identity: `wallet-${Math.random()}`,
      limit: 3,
      windowMs: 60_000,
    })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it("blocks once the per-identity limit is reached", async () => {
    const identity = `wallet-${Math.random()}`
    for (let attempt = 0; attempt < 3; attempt++) {
      await enforceDistributedRateLimit({
        scope: "test:fallback:block",
        identity,
        limit: 3,
        windowMs: 60_000,
      })
    }

    await expect(
      enforceDistributedRateLimit({
        scope: "test:fallback:block",
        identity,
        limit: 3,
        windowMs: 60_000,
      })
    ).rejects.toThrow(/Rate limit exceeded/)
  })
})

describe("enforceDistributedRateLimit (KV-backed)", () => {
  let store: Map<string, { value: string; expiresAt: number }>

  beforeEach(() => {
    store = new Map()
    ;(globalThis as { FUNDWISE_RATE_LIMIT_KV?: unknown }).FUNDWISE_RATE_LIMIT_KV = {
      get: vi.fn(async (key: string) => {
        const entry = store.get(key)
        if (!entry) return null
        if (entry.expiresAt <= Date.now()) {
          store.delete(key)
          return null
        }
        return JSON.parse(entry.value)
      }),
      put: vi.fn(
        async (
          key: string,
          value: string,
          options?: { expirationTtl?: number }
        ) => {
          store.set(key, {
            value,
            expiresAt: Date.now() + (options?.expirationTtl ?? 60) * 1000,
          })
        }
      ),
    }
  })

  it("uses the KV namespace when one is bound", async () => {
    const identity = `kv-wallet-${Math.random()}`
    await enforceDistributedRateLimit({
      scope: "test:kv",
      identity,
      limit: 2,
      windowMs: 60_000,
    })
    expect(store.has(`test:kv:${identity}`)).toBe(true)
  })

  it("rejects after the KV-tracked limit is exceeded", async () => {
    const identity = `kv-wallet-${Math.random()}`
    await enforceDistributedRateLimit({
      scope: "test:kv:block",
      identity,
      limit: 1,
      windowMs: 60_000,
    })
    await expect(
      enforceDistributedRateLimit({
        scope: "test:kv:block",
        identity,
        limit: 1,
        windowMs: 60_000,
      })
    ).rejects.toThrow(/Rate limit exceeded/)
  })
})

describe("FUNDWISE_RATE_LIMITS coverage", () => {
  it("defines limits for every money-moving scope", () => {
    const required = [
      "settlement_create",
      "contribution_create",
      "proposal_create",
      "proposal_review",
      "proposal_execute",
      "treasury_init",
      "member_role",
      "group_leave",
      "creation_fee",
      "monetization_response",
    ] as const

    for (const scope of required) {
      expect(FUNDWISE_RATE_LIMITS[scope]).toBeDefined()
      expect(FUNDWISE_RATE_LIMITS[scope].limit).toBeGreaterThan(0)
      expect(FUNDWISE_RATE_LIMITS[scope].windowMs).toBeGreaterThan(0)
    }
  })

  it("enforceFundWiseRateLimit reads the named config", async () => {
    const result = await enforceFundWiseRateLimit(
      "monetization_response",
      `enforce-wallet-${Math.random()}`
    )
    expect(result.allowed).toBe(true)
  })
})
