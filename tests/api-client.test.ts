import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError, apiFetch } from "@/lib/api-client"

type FetchMock = ReturnType<typeof vi.fn>

let fetchMock: FetchMock
const originalFetch = globalThis.fetch

function jsonResponse(body: unknown, init: { status?: number } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  })
}

function textResponse(body: string, init: { status?: number } = {}) {
  return new Response(body, {
    status: init.status ?? 200,
    headers: { "content-type": "text/plain" },
  })
}

function emptyResponse(init: { status?: number } = {}) {
  return new Response(null, {
    status: init.status ?? 204,
  })
}

beforeEach(() => {
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("apiFetch — success path", () => {
  it("returns parsed JSON on 2xx", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: "g1", code: "ABC123" }))

    const result = await apiFetch<{ id: string; code: string }>("/api/groups", {
      method: "POST",
      body: { name: "Trip" },
    })

    expect(result).toEqual({ id: "g1", code: "ABC123" })
  })

  it("returns null when the response body is empty", async () => {
    fetchMock.mockResolvedValueOnce(emptyResponse({ status: 204 }))

    const result = await apiFetch<null>("/api/health")

    expect(result).toBeNull()
  })
})

describe("apiFetch — request shaping", () => {
  it("serializes object bodies to JSON and sets Content-Type", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x", { method: "POST", body: { a: 1 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBe(JSON.stringify({ a: 1 }))
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" })
  })

  it("passes string bodies through untouched (no double-stringify)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x", { method: "POST", body: '{"already":"json"}' })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBe('{"already":"json"}')
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" })
  })

  it("does not add Content-Type when there is no body (GET)", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x")

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers).not.toHaveProperty("Content-Type")
  })

  it("uses no-store cache by default", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x")

    const [, init] = fetchMock.mock.calls[0]
    expect(init.cache).toBe("no-store")
  })

  it("uses same-origin credentials by default", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x")

    const [, init] = fetchMock.mock.calls[0]
    expect(init.credentials).toBe("same-origin")
  })

  it("honors caller-supplied headers", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x", {
      method: "POST",
      body: { a: 1 },
      headers: { "X-Custom": "yes" },
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "X-Custom": "yes",
    })
  })

  it("honors caller-supplied cache override", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }))

    await apiFetch("/api/x", { cache: "force-cache" })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.cache).toBe("force-cache")
  })
})

describe("apiFetch — error envelope", () => {
  it("throws ApiError with the server's error message on non-2xx", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Missing groupId" }, { status: 400 })
    )

    await expect(apiFetch("/api/x")).rejects.toThrowError(
      expect.objectContaining({
        name: "ApiError",
        message: "Missing groupId",
        status: 400,
      })
    )
  })

  it("throws ApiError with a fallback message when the server returns no error field", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, { status: 500 }))

    await expect(apiFetch("/api/x")).rejects.toThrowError(
      expect.objectContaining({
        name: "ApiError",
        message: "Request failed with status 500",
        status: 500,
      })
    )
  })

  it("throws ApiError on non-2xx with non-JSON body", async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse("Internal Server Error", { status: 500 })
    )

    await expect(apiFetch("/api/x")).rejects.toThrowError(
      expect.objectContaining({
        name: "ApiError",
        status: 500,
      })
    )
  })

  it("ApiError instances are instanceof Error", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "boom" }, { status: 401 })
    )

    try {
      await apiFetch("/api/x")
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toBeInstanceOf(Error)
    }
  })

  it("propagates network errors (fetch throws) as-is", async () => {
    const networkError = new Error("ECONNREFUSED")
    fetchMock.mockRejectedValueOnce(networkError)

    await expect(apiFetch("/api/x")).rejects.toBe(networkError)
  })
})
