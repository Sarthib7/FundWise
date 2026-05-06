"use client"

import { useEffect } from "react"

type WebMcpTool = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    untrustedContentHint?: boolean
  }
  execute: (input: Record<string, unknown>) => Promise<Record<string, unknown>>
}

type WebMcpNavigator = Navigator & {
  modelContext?: {
    registerTool?: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => void
    provideContext?: (context: { tools: WebMcpTool[] }) => void | Promise<void>
  }
}

function getOrigin() {
  return window.location.origin
}

function makeSettlementRequestLink(input: Record<string, unknown>) {
  const groupId = typeof input.groupId === "string" ? input.groupId.trim() : ""
  const debtorWallet = typeof input.debtorWallet === "string" ? input.debtorWallet.trim() : ""

  if (!groupId || !debtorWallet) {
    throw new Error("groupId and debtorWallet are required.")
  }

  return `${getOrigin()}/groups/${encodeURIComponent(groupId)}?settle=${encodeURIComponent(debtorWallet)}`
}

export function WebMcpProvider() {
  useEffect(() => {
    const modelContext = (navigator as WebMcpNavigator).modelContext

    if (!modelContext) {
      return
    }

    const abortController = new AbortController()
    const tools: WebMcpTool[] = [
      {
        name: "fundwise.discovery",
        title: "FundWise Discovery",
        description: "Return public FundWise discovery URLs for agents, API documentation, sitemap, and API catalog.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: async () => ({
          app: getOrigin(),
          agentSkill: `${getOrigin()}/skill.md`,
          apiDocs: `${getOrigin()}/api/docs`,
          apiCatalog: `${getOrigin()}/.well-known/api-catalog`,
          agentSkillsIndex: `${getOrigin()}/.well-known/agent-skills/index.json`,
          openApi: `${getOrigin()}/api/openapi.json`,
          sitemap: `${getOrigin()}/sitemap.xml`,
        }),
      },
      {
        name: "fundwise.settlement_request_link",
        title: "Create Settlement Request Link",
        description:
          "Create a FundWise Settlement Request Link for a Group and debtor wallet. The link resolves the live Balance in the app and never auto-sends a Settlement.",
        inputSchema: {
          type: "object",
          required: ["groupId", "debtorWallet"],
          properties: {
            groupId: {
              type: "string",
              minLength: 1,
              description: "FundWise Group identifier.",
            },
            debtorWallet: {
              type: "string",
              minLength: 1,
              description: "Solana wallet public key for the debtor Member.",
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: async (input) => ({
          url: makeSettlementRequestLink(input),
          safety: "The debtor must review the live Group Balance and confirm the USDC Settlement in their wallet.",
        }),
      },
      {
        name: "fundwise.open_groups",
        title: "Open FundWise Groups",
        description: "Navigate the current browser tab to the FundWise Groups entry page.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          window.location.assign("/groups")
          return { navigated: true, url: `${getOrigin()}/groups` }
        },
      },
    ]

    if (modelContext.registerTool) {
      for (const tool of tools) {
        modelContext.registerTool(tool, { signal: abortController.signal })
      }
    }

    if (modelContext.provideContext) {
      void modelContext.provideContext({ tools })
    }

    return () => abortController.abort()
  }, [])

  return null
}
