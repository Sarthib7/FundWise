import { NextResponse } from "next/server"

import { FundWiseError, getErrorDetails } from "@/lib/server/fundwise-error"
import {
  enforceFundWiseRateLimit,
  type FundWiseRateLimitScope,
} from "@/lib/server/rate-limit"
import {
  requireAuthenticatedWallet,
  type WalletSessionPayload,
} from "@/lib/server/wallet-session"

export type AuthenticatedHandlerContext<Body, Params> = {
  request: Request
  session: WalletSessionPayload
  body: Body
  params: Params
}

export type AuthenticatedHandlerOptions = {
  fallbackMessage: string
  rateLimit?: FundWiseRateLimitScope
  walletField?: string
  parseBody?: boolean
}

export type AuthenticatedHandler<Body, Params, Result> = (
  ctx: AuthenticatedHandlerContext<Body, Params>
) => Promise<Result> | Result

export type AuthenticatedHandlerDeps = {
  requireSession: () => Promise<WalletSessionPayload>
  enforceRateLimit: (
    scope: FundWiseRateLimitScope,
    identity: string
  ) => Promise<unknown>
}

const DEFAULT_DEPS: AuthenticatedHandlerDeps = {
  requireSession: requireAuthenticatedWallet,
  enforceRateLimit: enforceFundWiseRateLimit,
}

type RouteHandler<Params> = (
  request: Request,
  context?: { params: Promise<Params> }
) => Promise<Response>

export function withAuthenticatedHandler<
  Body = Record<string, unknown>,
  Params = Record<string, never>,
  Result = unknown,
>(
  options: AuthenticatedHandlerOptions,
  handler: AuthenticatedHandler<Body, Params, Result>,
  deps: AuthenticatedHandlerDeps = DEFAULT_DEPS
): RouteHandler<Params> {
  return async (request, context) => {
    try {
      const session = await deps.requireSession()

      if (options.rateLimit) {
        await deps.enforceRateLimit(options.rateLimit, session.wallet)
      }

      const method = request.method.toUpperCase()
      const canHaveBody = method !== "GET" && method !== "HEAD"
      const shouldParseBody =
        options.parseBody !== undefined ? options.parseBody : canHaveBody

      let body = {} as Body
      if (shouldParseBody) {
        const text = await request.text()
        if (text.length > 0) {
          try {
            body = JSON.parse(text) as Body
          } catch {
            throw new FundWiseError("Request body is not valid JSON.")
          }
        }
      }

      if (options.walletField) {
        const value = (body as Record<string, unknown>)[options.walletField]
        if (value !== session.wallet) {
          throw new FundWiseError(
            "Authenticated wallet does not match the request wallet.",
            401
          )
        }
      }

      const params = (context ? await context.params : ({} as Params))

      const result = await handler({ request, session, body, params })
      return NextResponse.json(result)
    } catch (error) {
      const { status, message } = getErrorDetails(
        error,
        options.fallbackMessage
      )
      return NextResponse.json({ error: message }, { status })
    }
  }
}
