#!/usr/bin/env node
// FW-005: Zerion CLI wallet-readiness support demo.
//
// Wraps the official Zerion CLI (`zerion analyze <address>`) and reports
// whether a Solana wallet looks ready to settle a FundWise expense:
// USDC available, SOL for gas, and broader wallet context.
//
// Strictly read-only support tooling. Does not connect a wallet, does not
// sign transactions, does not execute Settlements. The Solana
// wallet-adapter remains the sole identity and money-movement path for
// FundWise (see ADR-0014, STATUS.md).
//
// Auth: pass-through to the Zerion CLI. Set ZERION_API_KEY in your shell
// before running, or use the optional x402 path documented in
// docs/zerion-readiness.md. This script does not invent or persist secrets.

import { spawnSync } from "node:child_process"
import { argv, env, exit, stderr, stdout } from "node:process"

const USAGE = `Usage: pnpm zerion:readiness <wallet-address> [--json] [--min-usdc=<amount>]

Reports Solana wallet readiness for a FundWise Settlement using the official
Zerion CLI under the hood. Read-only. Does not sign or send transactions.

Setup:
  1) Install the Zerion CLI — see https://developers.zerion.io/build-with-ai/zerion-cli
  2) Export ZERION_API_KEY=<your-key> in this shell (free tier works)
  3) Optional: x402 pay-per-call on Solana — see docs/zerion-readiness.md

Flags:
  --json              Emit the parsed readiness summary as JSON instead of text
  --min-usdc=<n>      Minimum USDC required to be considered "ready" (default: 1)
  -h, --help          Show this message

Exit codes:
  0  ready
  1  not ready (insufficient USDC, insufficient SOL, or wallet has no positions)
  2  setup or invocation error (CLI missing, API key missing, parse failure)
`

const SOLANA_CHAIN_HINTS = ["solana", "sol", "mainnet-beta", "solana-mainnet"]
const USDC_SYMBOL = "USDC"
const SOL_SYMBOL = "SOL"
const DEFAULT_MIN_USDC = 1
const SOL_DUST_FLOOR = 0.005

function parseArgs(args) {
  const out = { address: null, json: false, minUsdc: DEFAULT_MIN_USDC, help: false }
  for (const raw of args) {
    if (raw === "-h" || raw === "--help") {
      out.help = true
    } else if (raw === "--json") {
      out.json = true
    } else if (raw.startsWith("--min-usdc=")) {
      const n = Number(raw.slice("--min-usdc=".length))
      if (!Number.isFinite(n) || n < 0) {
        stderr.write(`error: --min-usdc must be a non-negative number, got "${raw}"\n`)
        exit(2)
      }
      out.minUsdc = n
    } else if (!raw.startsWith("-") && !out.address) {
      out.address = raw
    } else {
      stderr.write(`error: unrecognized argument "${raw}"\n\n${USAGE}`)
      exit(2)
    }
  }
  return out
}

function runZerionAnalyze(address) {
  const result = spawnSync("zerion", ["analyze", address], {
    env,
    encoding: "utf8",
  })

  if (result.error && result.error.code === "ENOENT") {
    stderr.write(
      "error: `zerion` CLI not found on PATH.\n\n" +
        "Install it from https://developers.zerion.io/build-with-ai/zerion-cli\n" +
        "Then re-run this script. This wrapper does not bundle the CLI.\n"
    )
    exit(2)
  }
  if (result.error) {
    stderr.write(`error: failed to spawn zerion CLI: ${result.error.message}\n`)
    exit(2)
  }
  if (result.status !== 0) {
    const stderrText = (result.stderr || "").trim()
    const looksLikeAuth =
      /api[_-]?key|unauthor|forbidden|401|403/i.test(stderrText) ||
      /api[_-]?key|unauthor|forbidden|401|403/i.test(result.stdout || "")
    stderr.write("error: zerion CLI exited with status " + result.status + "\n")
    if (looksLikeAuth && !env.ZERION_API_KEY) {
      stderr.write(
        "hint: ZERION_API_KEY is not set in this shell.\n" +
          "      export ZERION_API_KEY=<your-key> and try again.\n"
      )
    }
    if (stderrText) stderr.write(stderrText + "\n")
    exit(2)
  }

  const text = result.stdout || ""
  try {
    return JSON.parse(text)
  } catch {
    stderr.write(
      "error: could not parse zerion CLI output as JSON.\n" +
        "       The CLI may have changed its default output format.\n" +
        "       Raw output preserved below for debugging:\n\n"
    )
    stderr.write(text + "\n")
    exit(2)
  }
}

// Defensively walk an unknown JSON shape and collect anything that looks
// like a token position so this script tolerates schema drift in the
// upstream CLI without claiming to know the exact contract.
function collectPositions(node, acc = []) {
  if (!node || typeof node !== "object") return acc
  if (Array.isArray(node)) {
    for (const child of node) collectPositions(child, acc)
    return acc
  }

  const symbol =
    node.symbol ?? node.asset_symbol ?? node.fungible_info?.symbol ?? null
  const chainRaw =
    node.chain ?? node.chain_id ?? node.network ?? node.chain_name ?? null
  const quantity =
    node.quantity?.float ??
    node.quantity?.numeric ??
    node.balance ??
    node.amount ??
    node.value?.balance ??
    null
  const usdValue = node.value?.usd ?? node.value_usd ?? node.usd_value ?? null

  if (typeof symbol === "string" && (quantity != null || usdValue != null)) {
    acc.push({
      symbol,
      chain: typeof chainRaw === "string" ? chainRaw : chainRaw == null ? null : String(chainRaw),
      quantity: typeof quantity === "number" ? quantity : Number(quantity) || 0,
      usdValue: typeof usdValue === "number" ? usdValue : Number(usdValue) || 0,
    })
  }

  for (const key of Object.keys(node)) {
    if (key === "fungible_info") continue // already harvested
    collectPositions(node[key], acc)
  }
  return acc
}

function isSolanaChain(chain) {
  if (!chain) return false
  const c = String(chain).toLowerCase()
  return SOLANA_CHAIN_HINTS.some((hint) => c.includes(hint))
}

function summarize(positions) {
  const solanaPositions = positions.filter((p) => isSolanaChain(p.chain))
  const usdcPositions = solanaPositions.filter(
    (p) => p.symbol.toUpperCase() === USDC_SYMBOL
  )
  const solPositions = solanaPositions.filter(
    (p) => p.symbol.toUpperCase() === SOL_SYMBOL
  )

  const usdcAvailable = usdcPositions.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const solAvailable = solPositions.reduce((sum, p) => sum + (p.quantity || 0), 0)

  const uniqueChains = new Set(positions.map((p) => p.chain).filter(Boolean))
  const uniqueSymbols = new Set(positions.map((p) => p.symbol))

  return {
    usdcAvailable,
    solAvailable,
    solanaPositions: solanaPositions.length,
    totalPositions: positions.length,
    uniqueChains: uniqueChains.size,
    uniqueSymbols: uniqueSymbols.size,
  }
}

function verdict(summary, minUsdc) {
  const reasons = []
  if (summary.usdcAvailable < minUsdc) {
    reasons.push(
      `USDC below threshold: ${summary.usdcAvailable.toFixed(2)} < ${minUsdc} USDC`
    )
  }
  if (summary.solAvailable < SOL_DUST_FLOOR) {
    reasons.push(
      `SOL below dust floor: ${summary.solAvailable.toFixed(4)} < ${SOL_DUST_FLOOR} SOL (gas)`
    )
  }
  if (summary.totalPositions === 0) {
    reasons.push("Zerion returned no token positions for this wallet")
  }
  return { ready: reasons.length === 0, reasons }
}

function renderHuman(address, summary, ready, reasons, minUsdc) {
  const fmt = (n, dp = 2) => n.toFixed(dp)
  const mark = (ok) => (ok ? "✓" : "✗")

  const usdcOk = summary.usdcAvailable >= minUsdc
  const solOk = summary.solAvailable >= SOL_DUST_FLOOR

  const lines = []
  lines.push(`Zerion wallet readiness — ${address}`)
  lines.push("─".repeat(48))
  lines.push(
    `${mark(usdcOk)} USDC on Solana:  ${fmt(summary.usdcAvailable)} USDC` +
      (usdcOk ? `  (≥ ${minUsdc} USDC threshold met)` : `  (need ≥ ${minUsdc} USDC to settle)`)
  )
  lines.push(
    `${mark(solOk)} SOL for gas:     ${fmt(summary.solAvailable, 4)} SOL` +
      (solOk ? `  (above ${SOL_DUST_FLOOR} dust floor)` : `  (top up SOL for transaction fees)`)
  )
  lines.push(
    `ℹ Broader context: ${summary.totalPositions} positions across ${summary.uniqueChains} chain(s); ${summary.solanaPositions} on Solana`
  )
  lines.push("")
  lines.push(`Verdict: ${ready ? "READY to settle FundWise expenses." : "NOT READY."}`)
  if (!ready) {
    for (const reason of reasons) lines.push(`  · ${reason}`)
  }
  lines.push("─".repeat(48))
  lines.push("Source: Zerion CLI · Read-only · No transactions signed.")
  return lines.join("\n") + "\n"
}

function main() {
  const args = parseArgs(argv.slice(2))
  if (args.help || !args.address) {
    stdout.write(USAGE)
    exit(args.help ? 0 : 2)
  }

  if (!env.ZERION_API_KEY) {
    stderr.write(
      "warning: ZERION_API_KEY is not set; the Zerion CLI may fail to authenticate.\n" +
        "         Export a key (free tier works) and re-run if you see auth errors.\n\n"
    )
  }

  const raw = runZerionAnalyze(args.address)
  const positions = collectPositions(raw)
  const summary = summarize(positions)
  const v = verdict(summary, args.minUsdc)

  if (args.json) {
    stdout.write(
      JSON.stringify(
        {
          address: args.address,
          minUsdcThreshold: args.minUsdc,
          summary,
          verdict: v,
        },
        null,
        2
      ) + "\n"
    )
  } else {
    stdout.write(renderHuman(args.address, summary, v.ready, v.reasons, args.minUsdc))
  }

  exit(v.ready ? 0 : 1)
}

main()
