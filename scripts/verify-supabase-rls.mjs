#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"

function loadDotEnvLocal() {
  if (!existsSync(".env.local")) return

  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const equalsIndex = trimmed.indexOf("=")
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    const rawValue = trimmed.slice(equalsIndex + 1).trim()
    const value = rawValue.replace(/^['\"]|['\"]$/g, "")

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnvLocal()

const PRIVATE_TABLES = [
  "groups",
  "members",
  "expenses",
  "expense_splits",
  "settlements",
  "contributions",
  "proposals",
  "proposal_approvals",
  "proposal_comments",
  "proposal_edits",
]

function usage() {
  return `Usage: pnpm supabase:verify-rls

Required env:
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)

Checks:
  1) anonymous REST SELECT returns no private ledger rows
  2) anonymous REST INSERT on groups is rejected by RLS before constraints
`
}

function getEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !publishableKey) {
    throw new Error(`Missing Supabase env.\n\n${usage()}`)
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    publishableKey,
  }
}

async function readJson(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function makeHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }
}

async function verifyAnonSelects({ supabaseUrl, publishableKey }) {
  const failures = []

  for (const table of PRIVATE_TABLES) {
    const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`
    const response = await fetch(url, {
      headers: makeHeaders(publishableKey),
    })
    const body = await readJson(response)

    if (!response.ok) {
      failures.push(`${table}: SELECT returned HTTP ${response.status} (${JSON.stringify(body)})`)
      continue
    }

    if (!Array.isArray(body)) {
      failures.push(`${table}: SELECT response was not an array (${JSON.stringify(body)})`)
      continue
    }

    if (body.length !== 0) {
      failures.push(`${table}: anonymous SELECT exposed ${body.length} row(s)`)
    }
  }

  return failures
}

async function verifyAnonInsertDeniedByRls({ supabaseUrl, publishableKey }) {
  const response = await fetch(`${supabaseUrl}/rest/v1/groups`, {
    method: "POST",
    headers: {
      ...makeHeaders(publishableKey),
      Prefer: "return=representation",
    },
    // Deliberately empty: with proper RLS this should fail with 42501 before
    // table constraints become the observable error.
    body: JSON.stringify({}),
  })
  const body = await readJson(response)

  if (response.ok) {
    return [`groups: anonymous INSERT unexpectedly succeeded (${JSON.stringify(body)})`]
  }

  const code = typeof body === "object" && body !== null ? body.code : undefined
  const message = typeof body === "object" && body !== null ? body.message : String(body)

  if (code !== "42501" && !/row-level security/i.test(message || "")) {
    return [
      `groups: anonymous INSERT was rejected, but not by RLS first (HTTP ${response.status}, ${JSON.stringify(body)})`,
    ]
  }

  return []
}

async function main() {
  const env = getEnv()
  console.log("FundWise Supabase RLS verification")
  console.log(`Project: ${env.supabaseUrl}`)

  const selectFailures = await verifyAnonSelects(env)
  const insertFailures = await verifyAnonInsertDeniedByRls(env)
  const failures = [...selectFailures, ...insertFailures]

  if (failures.length > 0) {
    console.error("\nRLS verification failed:")
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log("\nRLS verification passed: anonymous ledger reads are empty and anonymous insert is denied by RLS.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(2)
})
