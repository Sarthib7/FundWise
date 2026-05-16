export const runtime = "edge"

import { getSettlementReceiptView } from "@/lib/server/fundwise-reads"
import { withAuthenticatedHandler } from "@/lib/server/with-authenticated-handler"

type SettlementParams = { settlementId: string }

export const GET = withAuthenticatedHandler<Record<string, unknown>, SettlementParams>(
  { fallbackMessage: "Failed to load Settlement receipt." },
  async ({ session, params }) => {
    return getSettlementReceiptView(params.settlementId, session.wallet)
  }
)
