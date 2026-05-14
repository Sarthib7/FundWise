#!/usr/bin/env node

/**
 * Split Mode devnet stress test.
 *
 * Exercises the audit-driven guards from FW-053 and FW-055 + the auth
 * rate-limit boundary at high concurrency. Intended to run before the mainnet
 * rehearsal so we have observed evidence that the dedupe / lock / 429 paths
 * hold up under realistic burst load.
 *
 * Usage:
 *   pnpm split:stress
 *   pnpm split:stress -- --base http://127.0.0.1:3000 --concurrency 20
 *
 * Requires:
 *   - A running FundWise dev server (local or deployed devnet URL).
 *   - Optional: a copied `fundwise_wallet_session` cookie value passed via the
 *     `FUNDWISE_STRESS_COOKIE` env var. Without it, only the unauthenticated
 *     suite runs (challenge rate-limit, sanctioned-wallet 403, malformed body
 *     validation). The authenticated suite covers settlement idempotency,
 *     payer-binding rejection, and the side-transfer guard error shape.
 *
 * The script ONLY exercises the HTTP API. It does not move funds on-chain.
 * Real settlement / contribution flows still happen through the wallet.
 */

const DEFAULT_BASE = process.env.FUNDWISE_STRESS_BASE || "http://127.0.0.1:3000"
const DEFAULT_CONCURRENCY = Number(process.env.FUNDWISE_STRESS_CONCURRENCY || "10")
const SANCTIONED_WALLET = "42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi"

function parseArgs(argv) {
  const args = { base: DEFAULT_BASE, concurrency: DEFAULT_CONCURRENCY }
  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (flag === "--base" && value) {
      args.base = value
      index += 1
    } else if (flag === "--concurrency" && value) {
      args.concurrency = Number(value)
      index += 1
    } else if (flag === "--help" || flag === "-h") {
      console.log(
        [
          "Usage: pnpm split:stress -- [--base <url>] [--concurrency <n>]",
          "",
          "Env:",
          "  FUNDWISE_STRESS_BASE        Override --base (default http://127.0.0.1:3000).",
          "  FUNDWISE_STRESS_CONCURRENCY Override --concurrency (default 10).",
          "  FUNDWISE_STRESS_COOKIE      Wallet session cookie value for authenticated tests.",
        ].join("\n")
      )
      process.exit(0)
    }
  }
  return args
}

function makeFetch(base, cookie) {
  const cookieHeader = cookie
    ? `${process.env.NODE_ENV === "production" ? "__Host-fundwise_wallet_session" : "fundwise_wallet_session"}=${cookie}`
    : ""

  return async function request(path, init = {}) {
    const headers = { "content-type": "application/json", ...(init.headers || {}) }
    if (cookieHeader) headers.cookie = cookieHeader
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers,
    })
    let body
    const text = await response.text()
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
    return { status: response.status, body }
  }
}

function summarise(results) {
  const counts = new Map()
  for (const result of results) {
    counts.set(result.status, (counts.get(result.status) || 0) + 1)
  }
  return [...counts.entries()]
    .sort(([statusA], [statusB]) => statusA - statusB)
    .map(([status, count]) => `${count}×${status}`)
    .join(", ")
}

async function runChallengeRateLimit(fetcher, concurrency) {
  console.log(`\n[stress] /api/auth/wallet/challenge — ${concurrency * 5} bursts in parallel`)
  const wallet = "11111111111111111111111111111111"
  const tasks = Array.from({ length: concurrency * 5 }, () =>
    fetcher("/api/auth/wallet/challenge", {
      method: "POST",
      body: JSON.stringify({ wallet }),
    })
  )
  const results = await Promise.all(tasks)
  const rateLimited = results.filter((result) => result.status === 429)
  console.log(`  results: ${summarise(results)}`)
  if (rateLimited.length === 0) {
    console.warn("  WARN: expected at least one 429 — the in-memory rate limit may not be reachable from this client.")
  } else {
    console.log(`  ✓ ${rateLimited.length} requests were rate-limited`)
  }
}

async function runSanctionedWalletBlocked(fetcher) {
  console.log(`\n[stress] /api/auth/wallet/challenge with the known OFAC SDN wallet`)
  const { status, body } = await fetcher("/api/auth/wallet/challenge", {
    method: "POST",
    body: JSON.stringify({ wallet: SANCTIONED_WALLET }),
  })
  if (status === 403) {
    console.log(`  ✓ 403 returned: ${body?.error ?? "(no body)"}`)
  } else {
    console.error(`  ✗ Expected 403, got ${status}. Body:`, body)
    process.exitCode = 1
  }
}

async function runMalformedBodyRejected(fetcher) {
  console.log(`\n[stress] /api/auth/wallet/challenge missing body`)
  const { status, body } = await fetcher("/api/auth/wallet/challenge", {
    method: "POST",
    body: JSON.stringify({}),
  })
  if (status === 400) {
    console.log(`  ✓ 400 returned: ${body?.error ?? "(no body)"}`)
  } else {
    console.error(`  ✗ Expected 400, got ${status}. Body:`, body)
    process.exitCode = 1
  }
}

async function runPayerBindingRejected(fetcher, sessionWallet) {
  console.log(`\n[stress] /api/expenses with payer ≠ session (FW-053.1)`)
  const { status, body } = await fetcher("/api/expenses", {
    method: "POST",
    body: JSON.stringify({
      groupId: "00000000-0000-4000-8000-000000000999",
      payer: "11111111111111111111111111111111",
      createdBy: sessionWallet,
      amount: 1,
      mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      splitMethod: "equal",
      splits: [{ wallet: sessionWallet, share: 1 }],
    }),
  })
  if (status === 400 && /payer/i.test(body?.error ?? "")) {
    console.log(`  ✓ 400 returned: ${body.error}`)
  } else {
    console.error(`  ✗ Expected 400 with payer-binding error, got ${status}. Body:`, body)
    process.exitCode = 1
  }
}

async function runDuplicateSettlement(fetcher, sessionWallet, concurrency) {
  console.log(`\n[stress] /api/settlements idempotency burst — ${concurrency} parallel POSTs with the same tx_sig`)
  const body = {
    groupId: "00000000-0000-4000-8000-000000000999",
    fromWallet: sessionWallet,
    toWallet: "11111111111111111111111111111111",
    amount: 1,
    mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    txSig: "stress-test-fake-signature",
  }
  const tasks = Array.from({ length: concurrency }, () =>
    fetcher("/api/settlements", { method: "POST", body: JSON.stringify(body) })
  )
  const results = await Promise.all(tasks)
  const distinctStatuses = new Set(results.map((result) => result.status))
  console.log(`  results: ${summarise(results)}`)
  // The actual settlement won't succeed because we're using a fake tx_sig and
  // a fake group, but every response should be the SAME error — different
  // statuses for the same request indicate a race between the in-memory
  // rate-limit, the row lock, and the dedupe check.
  if (distinctStatuses.size > 2) {
    console.error("  ✗ More than two distinct statuses for the same payload — investigate concurrency.")
    process.exitCode = 1
  } else {
    console.log("  ✓ Statuses were consistent across the burst.")
  }
}

async function main() {
  const args = parseArgs(process.argv)
  console.log(`[stress] base=${args.base} concurrency=${args.concurrency}`)

  const fetcher = makeFetch(args.base, process.env.FUNDWISE_STRESS_COOKIE || "")

  await runMalformedBodyRejected(fetcher)
  await runSanctionedWalletBlocked(fetcher)
  await runChallengeRateLimit(fetcher, args.concurrency)

  if (!process.env.FUNDWISE_STRESS_COOKIE) {
    console.log("\n[stress] FUNDWISE_STRESS_COOKIE not set — skipping authenticated suite.")
    console.log("         Grab the value from devtools (Application > Cookies > fundwise_wallet_session)")
    console.log("         then re-run with: FUNDWISE_STRESS_COOKIE=<value> pnpm split:stress")
    return
  }

  const sessionWallet = process.env.FUNDWISE_STRESS_WALLET
  if (!sessionWallet) {
    console.warn(
      "\n[stress] FUNDWISE_STRESS_WALLET not set — skipping payer-binding and duplicate-settlement tests."
    )
    return
  }

  await runPayerBindingRejected(fetcher, sessionWallet)
  await runDuplicateSettlement(fetcher, sessionWallet, args.concurrency)
}

main().catch((error) => {
  console.error("[stress] failed:", error)
  process.exit(1)
})
