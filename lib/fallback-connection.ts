import { Connection, type Commitment } from "@solana/web3.js"
import { getSolanaRpcUrls, getSolanaRpcUrlsForCluster, type FundWiseCluster } from "./solana-cluster"

type ConnectionFactory = (url: string, commitment: Commitment) => Connection

export type CreateFundWiseConnectionOptions = {
  endpoints?: string[]
  connectionFactory?: ConnectionFactory
  onFallback?: (failed: { endpoint: string; method: string; error: unknown }) => void
}

const RETRIABLE_STATUS_CODES = new Set([403, 408, 425, 429, 500, 502, 503, 504])

const RETRIABLE_ERROR_PATTERNS = [
  "rate limit",
  "rate-limit",
  "too many requests",
  "429",
  "503",
  "fetch failed",
  "forbidden",
  "blocked from this endpoint",
  "network error",
  "request timed out",
  "timeout",
  "econnreset",
  "etimedout",
  "socket hang up",
]

function isRetriableRpcError(error: unknown): boolean {
  if (!error) return false

  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: unknown }).status
      : undefined
  if (typeof status === "number" && RETRIABLE_STATUS_CODES.has(status)) {
    return true
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined
  if (typeof code === "string") {
    const upper = code.toUpperCase()
    if (upper === "ECONNRESET" || upper === "ETIMEDOUT" || upper === "ENOTFOUND") {
      return true
    }
  }

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : ""
  if (!message) return false
  const lower = message.toLowerCase()
  return RETRIABLE_ERROR_PATTERNS.some((pattern) => lower.includes(pattern))
}

const defaultConnectionFactory: ConnectionFactory = (url, commitment) =>
  new Connection(url, commitment)

function createFallbackProxy(
  connections: Connection[],
  endpoints: string[],
  onFallback: CreateFundWiseConnectionOptions["onFallback"]
): Connection {
  if (connections.length === 0) {
    throw new Error("FundWise connection needs at least one Solana RPC endpoint.")
  }
  if (connections.length !== endpoints.length) {
    throw new Error("FundWise connection: endpoints and connections must align.")
  }

  if (connections.length === 1) {
    return connections[0]
  }

  return new Proxy(connections[0], {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver)
      if (typeof original !== "function") {
        return original
      }

      return (...args: unknown[]) => {
        const invoke = (index: number): unknown => {
          const conn = connections[index]
          const method = (conn as unknown as Record<string | symbol, unknown>)[prop]
          if (typeof method !== "function") {
            return Reflect.get(target, prop, receiver)
          }
          let result: unknown
          try {
            result = method.apply(conn, args)
          } catch (syncError) {
            if (index + 1 < connections.length && isRetriableRpcError(syncError)) {
              onFallback?.({
                endpoint: endpoints[index],
                method: String(prop),
                error: syncError,
              })
              return invoke(index + 1)
            }
            throw syncError
          }

          if (result instanceof Promise) {
            return result.catch((asyncError: unknown) => {
              if (index + 1 < connections.length && isRetriableRpcError(asyncError)) {
                onFallback?.({
                  endpoint: endpoints[index],
                  method: String(prop),
                  error: asyncError,
                })
                return invoke(index + 1)
              }
              throw asyncError
            })
          }

          return result
        }

        return invoke(0)
      }
    },
  })
}

export function createFundWiseConnection(
  commitment: Commitment = "confirmed",
  options: CreateFundWiseConnectionOptions = {}
): Connection {
  const endpoints = options.endpoints ?? getSolanaRpcUrls()
  const factory = options.connectionFactory ?? defaultConnectionFactory
  const onFallback =
    options.onFallback ??
    ((info) => {
      console.warn(
        `[FundWise] RPC ${info.method} failed on ${info.endpoint}, trying next endpoint.`,
        info.error
      )
    })

  const connections = endpoints.map((url) => factory(url, commitment))
  return createFallbackProxy(connections, endpoints, onFallback)
}

export function createFundWiseConnectionForCluster(
  cluster: FundWiseCluster,
  commitment: Commitment = "confirmed",
  options: CreateFundWiseConnectionOptions = {}
): Connection {
  return createFundWiseConnection(commitment, {
    ...options,
    endpoints: options.endpoints ?? getSolanaRpcUrlsForCluster(cluster),
  })
}

export { isRetriableRpcError as __isRetriableRpcError }
