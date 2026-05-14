/**
 * FW-038d: open-source error monitoring shim.
 *
 * The Cloudflare Pages target rejects `@sentry/nextjs` (duplicated identifier
 * error from `@cloudflare/next-on-pages`). The Cloudflare-friendly alternative
 * is `@sentry/cloudflare`, which speaks the standard Sentry envelope protocol
 * and therefore works against any Sentry-compatible backend, including the
 * fully open-source GlitchTip (MIT licensed; self-hostable; free hosted tier
 * at glitchtip.com).
 *
 * This module is a NO-OP unless three things are true:
 *
 *   1. `SENTRY_DSN` (or `GLITCHTIP_DSN`, alias) is set in env.
 *   2. The optional `@sentry/cloudflare` dependency is installed.
 *   3. `initMonitoring()` has been called from a runtime entry point.
 *
 * Until the operator has provisioned a GlitchTip project (or a Sentry / Sentry
 * fork of their choice) and run `pnpm add @sentry/cloudflare`, every call into
 * this module short-circuits. That keeps the build, tests, and deploy
 * pipelines unchanged on a fresh clone, so we don't ship a half-wired
 * monitoring path that crashes Cloudflare Pages.
 *
 * See `docs/monitoring-runbook.md` for the full enablement steps.
 */

type SentryLike = {
  init: (config: { dsn: string; environment?: string; tracesSampleRate?: number }) => void
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  captureMessage: (message: string, context?: Record<string, unknown>) => void
}

let sentryClient: SentryLike | null = null
let initialised = false

function getDsn() {
  return (
    process.env.SENTRY_DSN ||
    process.env.GLITCHTIP_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    ""
  )
}

async function loadSentryCloudflare(): Promise<SentryLike | null> {
  try {
    // Dynamic import keeps the package optional — it isn't a hard dependency.
    // When the operator runs `pnpm add @sentry/cloudflare`, this resolves; if
    // they haven't, the catch returns `null` and the rest of the module
    // no-ops. The module name is built at runtime so TypeScript doesn't try to
    // resolve the type and bundlers don't complain when the package is absent.
    const moduleName = ["@sentry", "cloudflare"].join("/")
    const dynamicImport = new Function("name", "return import(name)") as (
      name: string
    ) => Promise<unknown>
    const sentry = (await dynamicImport(moduleName).catch(() => null)) as SentryLike | null
    return sentry
  } catch {
    return null
  }
}

export async function initMonitoring() {
  if (initialised) return
  initialised = true

  const dsn = getDsn()
  if (!dsn) return

  const client = await loadSentryCloudflare()
  if (!client) {
    console.warn(
      "[FundWise] SENTRY_DSN is set but @sentry/cloudflare is not installed. " +
        "Run `pnpm add @sentry/cloudflare` to enable monitoring."
    )
    return
  }

  client.init({
    dsn,
    environment: process.env.FUNDWISE_ENV || process.env.NODE_ENV || "production",
    tracesSampleRate: 0,
  })
  sentryClient = client
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!sentryClient) {
    console.error("[FundWise]", error, context ?? "")
    return
  }
  sentryClient.captureException(error, context)
}

export function reportMessage(message: string, context?: Record<string, unknown>) {
  if (!sentryClient) {
    console.warn("[FundWise]", message, context ?? "")
    return
  }
  sentryClient.captureMessage(message, context)
}

export function isMonitoringEnabled() {
  return sentryClient !== null
}
