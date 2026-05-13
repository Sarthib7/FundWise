#!/usr/bin/env node
// FW-039: read-only LI.FI launch readiness check.
//
// This checks the public LI.FI Aggregation API for the exact USDC routes
// FundWise exposes in the app. It does not connect wallets, request quotes,
// sign messages, or execute transactions. The final launch proof is still a
// tiny mainnet route followed by the normal FundWise Settlement flow.

import { argv, exit, stderr, stdout } from "node:process"

const LIFI_API_BASE_URL = "https://li.quest/v1"
const SOLANA_CHAIN_ID = 1151111081099710
const SOLANA_USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

const MAINNET_SOURCE_CHAINS = [
  {
    id: 1,
    key: "eth",
    name: "Ethereum",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    id: 8453,
    key: "bas",
    name: "Base",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  {
    id: 42161,
    key: "arb",
    name: "Arbitrum",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  {
    id: 10,
    key: "opt",
    name: "Optimism",
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  },
  {
    id: 137,
    key: "pol",
    name: "Polygon",
    usdc: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  },
]

const TESTNET_PROBES = [
  { id: 11155111, name: "Ethereum Sepolia" },
  { id: 84532, name: "Base Sepolia" },
  { id: 421614, name: "Arbitrum Sepolia" },
  { id: 11155420, name: "OP Sepolia" },
]

const USAGE = `Usage: pnpm lifi:readiness [--json]

Checks LI.FI route metadata for FundWise's supported source chains:
Ethereum, Base, Arbitrum, Optimism, and Polygon USDC -> Solana mainnet USDC.

This is read-only. It does not connect wallets, request signatures, or move funds.
Sepolia probes are reported for launch planning only; they are not treated as a
valid FundWise rehearsal path.

Exit codes:
  0  all FundWise mainnet USDC route metadata is available
  1  one or more FundWise mainnet routes are unavailable
  2  API or invocation error
`

function parseArgs(args) {
  const parsed = { json: false, help: false }

  for (const raw of args) {
    if (raw === "-h" || raw === "--help") {
      parsed.help = true
    } else if (raw === "--json") {
      parsed.json = true
    } else {
      stderr.write(`error: unrecognized argument "${raw}"\n\n${USAGE}`)
      exit(2)
    }
  }

  return parsed
}

async function requestJson(path) {
  const response = await fetch(`${LIFI_API_BASE_URL}${path}`, {
    headers: { accept: "application/json" },
  })
  const text = await response.text()

  if (!response.ok) {
    throw new Error(`LI.FI ${path} returned ${response.status}: ${text.slice(0, 300)}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`LI.FI ${path} returned invalid JSON`)
  }
}

async function getChains(chainType) {
  const data = await requestJson(`/chains?chainTypes=${encodeURIComponent(chainType)}`)
  if (!Array.isArray(data.chains)) {
    throw new Error(`LI.FI /chains?chainTypes=${chainType} did not return a chains array`)
  }
  return data.chains
}

async function getConnectionCount({ fromChain, toChain, fromToken, toToken }) {
  const params = new URLSearchParams({
    fromChain: String(fromChain),
    toChain: String(toChain),
  })

  if (fromToken) params.set("fromToken", fromToken)
  if (toToken) params.set("toToken", toToken)

  const data = await requestJson(`/connections?${params.toString()}`)
  if (!Array.isArray(data.connections)) {
    throw new Error("LI.FI /connections did not return a connections array")
  }
  return data.connections.length
}

function chainById(chains, id) {
  return chains.find((chain) => chain.id === id) || null
}

function chainSummary(expected, live) {
  return {
    id: expected.id,
    expectedName: expected.name,
    liveName: live?.name || null,
    key: live?.key || expected.key || null,
    listed: Boolean(live),
    mainnet: live?.mainnet ?? null,
    chainType: live?.chainType || null,
  }
}

function printText(result) {
  stdout.write("LI.FI readiness for FundWise\n")
  stdout.write(`Target: ${result.target.liveName || result.target.expectedName} (${result.target.id}) mainnet=${result.target.mainnet}\n\n`)

  stdout.write("Mainnet USDC routes:\n")
  for (const check of result.mainnetRoutes) {
    const marker = check.ready ? "READY" : "BLOCKED"
    stdout.write(
      `- ${marker} ${check.expectedName} (${check.id}) -> Solana USDC: ` +
        `${check.connections} connection${check.connections === 1 ? "" : "s"}`
    )
    if (!check.listed) stdout.write(" (chain not listed)")
    if (check.mainnet !== true) stdout.write(` (mainnet=${check.mainnet})`)
    stdout.write("\n")
  }

  stdout.write("\nSepolia probes, not a FundWise rehearsal path:\n")
  for (const check of result.testnetProbes) {
    const status = check.connections > 0 ? "ROUTE_METADATA_FOUND" : "NO_ROUTE"
    const listed = check.listed ? `listed mainnet=${check.mainnet}` : "not listed"
    stdout.write(
      `- ${status} ${check.expectedName} (${check.id}): ${listed}, ` +
        `${check.connections} connection${check.connections === 1 ? "" : "s"} to Solana USDC\n`
    )
  }

  stdout.write(`\nVerdict: ${result.verdict}\n`)
  stdout.write(
    "Launch note: run the required proof with a tiny mainnet EVM USDC route, then finish the normal FundWise Settlement.\n"
  )
}

async function main() {
  const args = parseArgs(argv.slice(2))
  if (args.help) {
    stdout.write(USAGE)
    return
  }

  const [evmChains, svmChains] = await Promise.all([getChains("EVM"), getChains("SVM")])
  const target = chainSummary(
    { id: SOLANA_CHAIN_ID, name: "Solana" },
    chainById(svmChains, SOLANA_CHAIN_ID)
  )

  const mainnetRoutes = []
  for (const source of MAINNET_SOURCE_CHAINS) {
    const live = chainById(evmChains, source.id)
    const connections = await getConnectionCount({
      fromChain: source.id,
      toChain: SOLANA_CHAIN_ID,
      fromToken: source.usdc,
      toToken: SOLANA_USDC,
    })
    const summary = chainSummary(source, live)
    mainnetRoutes.push({
      ...summary,
      connections,
      ready: summary.listed && summary.mainnet === true && connections > 0,
    })
  }

  const testnetProbes = []
  for (const probe of TESTNET_PROBES) {
    const live = chainById(evmChains, probe.id)
    const connections = live
      ? await getConnectionCount({
          fromChain: probe.id,
          toChain: SOLANA_CHAIN_ID,
          toToken: SOLANA_USDC,
        })
      : 0

    testnetProbes.push({
      ...chainSummary(probe, live),
      connections,
    })
  }

  const mainnetReady =
    target.listed &&
    target.mainnet === true &&
    mainnetRoutes.every((route) => route.ready)

  const result = {
    verdict: mainnetReady ? "READY_FOR_MAINNET_REHEARSAL" : "BLOCKED",
    target,
    mainnetRoutes,
    testnetProbes,
  }

  if (args.json) {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  } else {
    printText(result)
  }

  exit(mainnetReady ? 0 : 1)
}

main().catch((error) => {
  stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`)
  exit(2)
})
