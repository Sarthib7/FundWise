import { describe, expect, it, vi } from "vitest"

import { FundWiseError } from "@/lib/server/fundwise-error"
import type { FundWiseRateLimitScope } from "@/lib/server/rate-limit"
import type { WalletSessionPayload } from "@/lib/server/wallet-session"
import {
  withAuthenticatedHandler,
  type AuthenticatedHandlerDeps,
} from "@/lib/server/with-authenticated-handler"

const WALLET = "8aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789aBcDeF"
const OTHER_WALLET = "11111111111111111111111111111111"

function makeSession(wallet = WALLET): WalletSessionPayload {
  return {
    wallet,
    issuedAt: 1_700_000_000_000,
    expiresAt: 1_700_000_000_000 + 12 * 60 * 60 * 1000,
  }
}

function makeDeps(overrides: Partial<AuthenticatedHandlerDeps> = {}): AuthenticatedHandlerDeps {
  return {
    requireSession: vi.fn(async () => makeSession()),
    enforceRateLimit: vi.fn(async () => undefined),
    ...overrides,
  }
}

function jsonRequest(method: string, body: unknown, url = "https://test.invalid/api/x") {
  return new Request(url, {
    method,
    body: method === "GET" || method === "HEAD" ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
}

async function readJson(response: Response) {
  const text = await response.text()
  return JSON.parse(text)
}

describe("withAuthenticatedHandler — session enforcement", () => {
  it("returns 401 envelope when no session", async () => {
    const deps = makeDeps({
      requireSession: vi.fn(async () => {
        throw new FundWiseError(
          "Wallet verification required before accessing protected FundWise data.",
          401
        )
      }),
    })
    const handler = vi.fn()
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}))

    expect(response.status).toBe(401)
    expect(await readJson(response)).toEqual({
      error: "Wallet verification required before accessing protected FundWise data.",
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it("calls the handler with the resolved session on valid auth", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ session }) => ({ wallet: session.wallet }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", { foo: "bar" }))

    expect(response.status).toBe(200)
    expect(await readJson(response)).toEqual({ wallet: WALLET })
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe("withAuthenticatedHandler — wallet-match assertion", () => {
  it("returns 401 envelope when body[walletField] does not match the session wallet", async () => {
    const deps = makeDeps()
    const handler = vi.fn()
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", walletField: "createdBy" },
      handler,
      deps
    )

    const response = await route(
      jsonRequest("POST", { createdBy: OTHER_WALLET })
    )

    expect(response.status).toBe(401)
    expect(await readJson(response)).toEqual({
      error: "Authenticated wallet does not match the request wallet.",
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it("calls the handler when body[walletField] matches the session wallet", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async () => ({ ok: true }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", walletField: "createdBy" },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", { createdBy: WALLET }))

    expect(response.status).toBe(200)
    expect(await readJson(response)).toEqual({ ok: true })
  })

  it("skips wallet-match when walletField is not configured", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async () => ({ ok: true }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(
      jsonRequest("POST", { someWallet: OTHER_WALLET })
    )

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalledOnce()
  })

  it("treats missing walletField as a mismatch (defense in depth)", async () => {
    const deps = makeDeps()
    const handler = vi.fn()
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", walletField: "createdBy" },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", { otherField: "value" }))

    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})

describe("withAuthenticatedHandler — rate limiting", () => {
  it("calls enforceRateLimit with the configured scope and session wallet", async () => {
    const enforceRateLimit = vi.fn(async () => undefined)
    const deps = makeDeps({ enforceRateLimit })
    const handler = vi.fn(async () => ({ ok: true }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", rateLimit: "creation_fee" },
      handler,
      deps
    )

    await route(jsonRequest("POST", {}))

    expect(enforceRateLimit).toHaveBeenCalledOnce()
    expect(enforceRateLimit).toHaveBeenCalledWith("creation_fee", WALLET)
  })

  it("skips the rate-limit call when not configured", async () => {
    const enforceRateLimit = vi.fn(async () => undefined)
    const deps = makeDeps({ enforceRateLimit })
    const handler = vi.fn(async () => ({ ok: true }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    await route(jsonRequest("POST", {}))

    expect(enforceRateLimit).not.toHaveBeenCalled()
  })

  it("returns the error envelope when the rate-limit guard throws", async () => {
    const deps = makeDeps({
      enforceRateLimit: vi.fn(async () => {
        throw new FundWiseError("Rate limit exceeded.", 429)
      }),
    })
    const handler = vi.fn()
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", rateLimit: "settlement_create" satisfies FundWiseRateLimitScope },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}))

    expect(response.status).toBe(429)
    expect(await readJson(response)).toEqual({ error: "Rate limit exceeded." })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe("withAuthenticatedHandler — body parsing", () => {
  it("parses JSON body for POST and passes it to the handler", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ body }) => body)
    const route = withAuthenticatedHandler<{ a: number; b: string }>(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", { a: 1, b: "two" }))

    expect(await readJson(response)).toEqual({ a: 1, b: "two" })
  })

  it("passes an empty object when the POST body is empty", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ body }) => ({ received: body }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const request = new Request("https://test.invalid/api/x", { method: "POST" })
    const response = await route(request)

    expect(await readJson(response)).toEqual({ received: {} })
  })

  it("returns 400 envelope when the body is malformed JSON", async () => {
    const deps = makeDeps()
    const handler = vi.fn()
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const request = new Request("https://test.invalid/api/x", {
      method: "POST",
      body: "{not-json",
      headers: { "content-type": "application/json" },
    })
    const response = await route(request)

    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({
      error: "Request body is not valid JSON.",
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it("skips body parsing for GET requests", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ body }) => ({ body }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(jsonRequest("GET", {}))

    expect(await readJson(response)).toEqual({ body: {} })
  })

  it("honors an explicit parseBody: false override on POST", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ body }) => ({ body }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", parseBody: false },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", { ignored: true }))

    expect(await readJson(response)).toEqual({ body: {} })
  })
})

describe("withAuthenticatedHandler — dynamic params", () => {
  it("awaits the params Promise and passes the resolved value to the handler", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ params }) => ({ params }))
    const route = withAuthenticatedHandler<unknown, { groupId: string }>(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}), {
      params: Promise.resolve({ groupId: "group-123" }),
    })

    expect(await readJson(response)).toEqual({ params: { groupId: "group-123" } })
  })

  it("passes an empty params object when no context is supplied", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async ({ params }) => ({ params }))
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}))

    expect(await readJson(response)).toEqual({ params: {} })
  })
})

describe("withAuthenticatedHandler — error envelope", () => {
  it("preserves FundWiseError status and message", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async () => {
      throw new FundWiseError("Specific failure.", 422)
    })
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Default failure." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}))

    expect(response.status).toBe(422)
    expect(await readJson(response)).toEqual({ error: "Specific failure." })
  })

  it("wraps generic Error with the error.message and status 400", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async () => {
      throw new Error("Boom.")
    })
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Default failure." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}))

    expect(response.status).toBe(400)
    expect(await readJson(response)).toEqual({ error: "Boom." })
  })

  it("returns the fallback message with status 500 when the thrown value is not an Error", async () => {
    const deps = makeDeps()
    const handler = vi.fn(async () => {
      throw "string-thrown"
    })
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Default failure." },
      handler,
      deps
    )

    const response = await route(jsonRequest("POST", {}))

    expect(response.status).toBe(500)
    expect(await readJson(response)).toEqual({ error: "Default failure." })
  })
})

describe("withAuthenticatedHandler — execution order", () => {
  it("checks the session BEFORE applying the rate limit", async () => {
    const calls: string[] = []
    const deps: AuthenticatedHandlerDeps = {
      requireSession: vi.fn(async () => {
        calls.push("session")
        return makeSession()
      }),
      enforceRateLimit: vi.fn(async () => {
        calls.push("rateLimit")
      }),
    }
    const handler = vi.fn(async () => {
      calls.push("handler")
      return { ok: true }
    })
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", rateLimit: "creation_fee" },
      handler,
      deps
    )

    await route(jsonRequest("POST", {}))

    expect(calls).toEqual(["session", "rateLimit", "handler"])
  })

  it("does not parse the body when the session check fails (cheap-fail-fast)", async () => {
    const deps = makeDeps({
      requireSession: vi.fn(async () => {
        throw new FundWiseError("No session.", 401)
      }),
    })
    const handler = vi.fn()
    const route = withAuthenticatedHandler(
      { fallbackMessage: "Failed.", walletField: "createdBy" },
      handler,
      deps
    )

    const request = new Request("https://test.invalid/api/x", {
      method: "POST",
      body: "this is not even JSON",
    })
    const response = await route(request)

    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})
