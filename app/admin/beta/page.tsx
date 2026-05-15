import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isFundModeBetaAdminWallet } from "@/lib/fund-mode-monetization"
import { readWalletSession } from "@/lib/server/wallet-session"
import { getSupabaseAdmin } from "@/lib/server/supabase-admin"

export const runtime = "edge"
export const dynamic = "force-dynamic"

type BetaRow = {
  group_id: string
  group_name: string
  group_code: string
  group_template: string | null
  approval_threshold: number | null
  created_by: string
  created_at: string
  treasury_initialized: boolean
  member_count: number
  contribution_count: number
  contribution_total: number
  proposal_count: number
  proposals_executed: number
  last_contribution_at: string | null
  last_execution_at: string | null
  creation_fees_paid: number
  creation_fees_skipped: number
}

type MonetizationRow = {
  kind: "monthly_fee_wtp" | "free_tier_cap" | "exit_survey"
  emulated_usd_cents: number | null
  payload: Record<string, unknown>
  created_at: string
}

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`
}

function formatMs(timestamp: string | null) {
  if (!timestamp) return "—"
  const date = new Date(timestamp)
  return date.toISOString().slice(0, 16).replace("T", " ")
}

function formatTokens(amount: number) {
  // 6-decimal stablecoin (USDC/PYUSD). Display as integer dollars for the
  // beta dashboard — exact decimals aren't load-bearing here.
  return (amount / 1_000_000).toFixed(2)
}

export default async function BetaAdminPage() {
  const session = await readWalletSession()

  if (!session) {
    redirect("/")
  }

  if (!isFundModeBetaAdminWallet(session.wallet)) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Card className="p-6">
          <h1 className="mb-2 text-lg font-semibold">Fund Mode beta admin</h1>
          <p className="text-sm text-muted-foreground">
            Wallet <code>{shortWallet(session.wallet)}</code> is not on the
            beta-admin allowlist. Add it to{" "}
            <code>FUNDWISE_BETA_ADMIN_WALLETS</code> to access this page.
          </p>
        </Card>
      </div>
    )
  }

  const admin = getSupabaseAdmin()

  const { data: rowsData, error: rowsError } = await admin
    .from("fund_mode_beta_admin_view")
    .select("*")
    .order("created_at", { ascending: false })

  if (rowsError) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <Card className="p-6">
          <h1 className="mb-2 text-lg font-semibold">Fund Mode beta admin</h1>
          <p className="text-sm text-destructive">
            Failed to load beta dashboard: {rowsError.message}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Make sure migration{" "}
            <code>20260515100000_fund_mode_beta_completion.sql</code> has been
            replayed on this Supabase project.
          </p>
        </Card>
      </div>
    )
  }

  const rows = (rowsData ?? []) as BetaRow[]

  const { data: monetizationData } = await admin
    .from("monetization_responses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  const monetizationRows = (monetizationData ?? []) as MonetizationRow[]

  const totals = rows.reduce(
    (acc, row) => {
      acc.pools += 1
      acc.contributions += row.contribution_count
      acc.contributionTotal += row.contribution_total
      acc.proposals += row.proposal_count
      acc.executed += row.proposals_executed
      acc.feesPaid += row.creation_fees_paid
      acc.feesSkipped += row.creation_fees_skipped
      return acc
    },
    {
      pools: 0,
      contributions: 0,
      contributionTotal: 0,
      proposals: 0,
      executed: 0,
      feesPaid: 0,
      feesSkipped: 0,
    }
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Fund Mode beta admin</h1>
        <p className="text-sm text-muted-foreground">
          Internal view. {totals.pools} pool{totals.pools === 1 ? "" : "s"} ·{" "}
          {totals.contributions} contribution
          {totals.contributions === 1 ? "" : "s"} totaling{" "}
          {formatTokens(totals.contributionTotal)} test-USDC ·{" "}
          {totals.executed}/{totals.proposals} proposals executed ·{" "}
          {totals.feesPaid} paid / {totals.feesSkipped} skipped creation fees.
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Active pools
        </h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Pool</th>
                <th className="px-2 py-2">Template</th>
                <th className="px-2 py-2">Members</th>
                <th className="px-2 py-2">Threshold</th>
                <th className="px-2 py-2">Contributions</th>
                <th className="px-2 py-2">Proposals</th>
                <th className="px-2 py-2">Fee</th>
                <th className="px-2 py-2">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-muted-foreground">
                    No Fund Mode Groups yet.
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const lastActivity =
                  row.last_execution_at && row.last_contribution_at
                    ? row.last_execution_at > row.last_contribution_at
                      ? row.last_execution_at
                      : row.last_contribution_at
                    : row.last_execution_at ?? row.last_contribution_at
                return (
                  <tr key={row.group_id} className="border-t">
                    <td className="px-2 py-2">
                      <div className="font-medium">{row.group_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.group_code} · created by {shortWallet(row.created_by)}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {row.group_template ?? "—"}
                    </td>
                    <td className="px-2 py-2">{row.member_count}</td>
                    <td className="px-2 py-2">
                      {row.approval_threshold ?? "—"}
                    </td>
                    <td className="px-2 py-2">
                      <div>{row.contribution_count}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTokens(row.contribution_total)} USDC
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {row.proposals_executed}/{row.proposal_count}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {row.creation_fees_paid > 0 ? (
                        <Badge>paid</Badge>
                      ) : row.creation_fees_skipped > 0 ? (
                        <Badge variant="secondary">skipped</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {formatMs(lastActivity)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
          Latest monetization responses ({monetizationRows.length})
        </h2>
        <ul className="space-y-2 text-sm">
          {monetizationRows.length === 0 && (
            <li className="text-muted-foreground">No responses recorded yet.</li>
          )}
          {monetizationRows.map((row, index) => (
            <li key={`${row.kind}-${row.created_at}-${index}`} className="rounded border p-2">
              <div className="flex items-center justify-between">
                <Badge>{row.kind}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatMs(row.created_at)}
                </span>
              </div>
              <pre className="mt-2 overflow-x-auto text-xs">
                {JSON.stringify(row.payload, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
