const DEFAULT_BASE_URL = "https://fundwise.fun"

export const HOMEPAGE_LINK_HEADER =
  '</.well-known/api-catalog>; rel="api-catalog", </api/openapi.json>; rel="service-desc"; type="application/openapi+json", </api/docs>; rel="service-doc"; type="text/markdown", </skill.md>; rel="service-doc"; type="text/markdown", </.well-known/agent-skills/index.json>; rel="service-desc"; type="application/json"'

export const CANONICAL_PUBLIC_PATHS = ["/", "/groups", "/demo", "/story", "/about", "/skill.md", "/api/docs"] as const

export const PUBLIC_MARKDOWN_PAGES = {
  "/": {
    title: "FundWise",
    description:
      "Group money, done right. Create private Groups, log Expenses, see live Balances, and settle exact USDC amounts on Solana with clear Receipts.",
    sections: [
      "Primary path: Group -> Expense -> Balance -> Settlement -> Receipt.",
      "Split Mode is the current MVP path. Fund Mode is planned as an invite-only treasury beta.",
      "Agents should start with /skill.md, /api/docs, and /.well-known/api-catalog.",
    ],
  },
  "/about": {
    title: "About FundWise",
    description: "FundWise is a wallet-native Group money app for shared Expenses and verified USDC Settlements.",
    sections: [
      "Identity is a Solana wallet public key.",
      "Expenses are off-chain Group records. Settlements are on-chain USDC transfers.",
    ],
  },
  "/story": {
    title: "FundWise Story",
    description: "The product narrative for live Group Balances, Settlement Request Links, and final Receipts.",
    sections: [
      "Settlement Request Links resolve the debtor's current live Balance when opened.",
      "The app never auto-sends a Settlement; the debtor must confirm in their wallet.",
    ],
  },
  "/demo": {
    title: "FundWise Demo",
    description: "Interactive walkthrough of the Split Mode flow.",
    sections: ["Create a Group, add an Expense, review Balances, settle in USDC, and view the Receipt."],
  },
  "/groups": {
    title: "FundWise Groups",
    description: "Wallet-first app entry for creating Groups and returning to invite or Settlement contexts.",
    sections: [
      "Disconnected Members connect a wallet first.",
      "After wallet connect, FundWise restores the intended Group, join, create, or Settlement context.",
    ],
  },
} as const

type PublicMarkdownPath = keyof typeof PUBLIC_MARKDOWN_PAGES

export function normalizeBaseUrl(baseUrl?: string) {
  if (!baseUrl) {
    return DEFAULT_BASE_URL
  }

  return baseUrl.replace(/\/$/, "")
}

export function getCanonicalUrl(path: string, baseUrl?: string) {
  return `${normalizeBaseUrl(baseUrl)}${path === "/" ? "" : path}`
}

export function buildHomeMarkdown(path: PublicMarkdownPath, baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)
  const page = PUBLIC_MARKDOWN_PAGES[path]

  return `---
title: ${page.title}
canonical: ${getCanonicalUrl(path, origin)}
---

# ${page.title}

${page.description}

${page.sections.map((section) => `- ${section}`).join("\n")}

## Agent Discovery

- Agent Skill Endpoint: ${origin}/skill.md
- API docs: ${origin}/api/docs
- OpenAPI service description: ${origin}/api/openapi.json
- API catalog: ${origin}/.well-known/api-catalog
- Agent Skills index: ${origin}/.well-known/agent-skills/index.json
- Sitemap: ${origin}/sitemap.xml
`
}

export function estimateMarkdownTokens(markdown: string) {
  return String(Math.max(1, Math.ceil(markdown.length / 4)))
}

export function wantsMarkdown(acceptHeader: string | null) {
  if (!acceptHeader) {
    return false
  }

  return acceptHeader
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .some((part) => part === "text/markdown" || part.startsWith("text/markdown;"))
}

export function isPublicMarkdownPath(pathname: string): pathname is PublicMarkdownPath {
  return pathname in PUBLIC_MARKDOWN_PAGES
}

export function buildApiCatalog(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return {
    linkset: [
      {
        anchor: `${origin}/api`,
        "service-desc": [
          {
            href: `${origin}/api/openapi.json`,
            type: "application/openapi+json",
          },
        ],
        "service-doc": [
          {
            href: `${origin}/api/docs`,
            type: "text/markdown",
          },
          {
            href: `${origin}/skill.md`,
            type: "text/markdown",
          },
        ],
        status: [
          {
            href: `${origin}/api/health`,
            type: "application/json",
          },
        ],
      },
    ],
  }
}

export function buildOpenApiSpec(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return {
    openapi: "3.1.0",
    info: {
      title: "FundWise HTTP API",
      version: "0.1.0",
      description:
        "Wallet-native API for FundWise Groups, Expenses, Balances, Settlements, Contributions, Receipts, and agent discovery.",
    },
    servers: [{ url: origin }],
    paths: {
      "/skill.md": {
        get: {
          summary: "Fetch the public FundWise Agent Skill Endpoint.",
          responses: { "200": { description: "Markdown agent skill document." } },
        },
      },
      "/api/docs": {
        get: {
          summary: "Fetch the FundWise API documentation as markdown.",
          responses: { "200": { description: "Markdown API documentation." } },
        },
      },
      "/api/health": {
        get: {
          summary: "Check public API discovery health.",
          responses: { "200": { description: "Health status." } },
        },
      },
      "/api/auth/wallet/challenge": {
        post: {
          summary: "Create a wallet-signature challenge for browser session auth.",
          responses: { "200": { description: "Challenge message and expiry." } },
        },
      },
      "/api/auth/wallet/verify": {
        post: {
          summary: "Verify a signed wallet challenge and set the browser session cookie.",
          responses: { "200": { description: "Verified wallet session." } },
        },
      },
      "/api/auth/wallet/session": {
        get: {
          summary: "Inspect the current browser wallet session.",
          responses: { "200": { description: "Session status." } },
        },
      },
      "/api/groups": {
        get: {
          summary: "Resolve an invite code or list Groups for an authenticated wallet.",
          responses: { "200": { description: "Group lookup or Group list." } },
        },
        post: {
          summary: "Create a Group.",
          responses: { "200": { description: "Created Group." } },
        },
      },
      "/api/groups/{groupId}": {
        get: {
          summary: "Load a Group dashboard snapshot.",
          responses: { "200": { description: "Group snapshot." } },
        },
      },
      "/api/groups/{groupId}/ledger": {
        get: {
          summary: "Load protected Split Mode ledger data for a Group Member.",
          responses: { "200": { description: "Balances, suggested Settlements, Activity Feed, and totals." } },
        },
      },
      "/api/groups/{groupId}/members": {
        post: {
          summary: "Join a Group as the authenticated Member wallet.",
          responses: { "200": { description: "Joined Member record." } },
        },
      },
      "/api/expenses": {
        get: {
          summary: "List Expenses for a Group.",
          responses: { "200": { description: "Expense list." } },
        },
        post: {
          summary: "Create a real Expense record.",
          responses: { "200": { description: "Created Expense." } },
        },
      },
      "/api/expenses/{expenseId}": {
        get: {
          summary: "Load one Expense.",
          responses: { "200": { description: "Expense detail." } },
        },
        patch: {
          summary: "Update an Expense before later Settlements make the ledger unsafe.",
          responses: { "200": { description: "Updated Expense." } },
        },
        delete: {
          summary: "Delete an Expense before later Settlements make the ledger unsafe.",
          responses: { "200": { description: "Deletion result." } },
        },
      },
      "/api/settlements": {
        post: {
          summary: "Record a verified Settlement signature after wallet-confirmed USDC transfer.",
          responses: { "200": { description: "Recorded Settlement and Receipt data." } },
        },
      },
      "/api/settlements/{settlementId}": {
        get: {
          summary: "Load a protected Receipt view.",
          responses: { "200": { description: "Receipt data." } },
        },
      },
      "/api/contributions": {
        post: {
          summary: "Record a verified Fund Mode Contribution signature.",
          responses: { "200": { description: "Recorded Contribution." } },
        },
      },
      "/api/proposals": {
        post: {
          summary: "Create a Fund Mode reimbursement Proposal for a current Group Member.",
          responses: { "200": { description: "Created Proposal." } },
        },
      },
      "/api/proposals/{proposalId}/review": {
        post: {
          summary: "Approve or reject a pending Fund Mode Proposal.",
          responses: { "200": { description: "Reviewed Proposal." } },
        },
      },
      "/api/profile/display-name": {
        post: {
          summary: "Update a Member's global Profile Display Name.",
          responses: { "200": { description: "Updated Profile Display Name." } },
        },
      },
    },
  }
}

export function buildOAuthAuthorizationServerMetadata(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/auth/wallet/challenge`,
    token_endpoint: `${origin}/api/auth/wallet/verify`,
    jwks_uri: `${origin}/.well-known/jwks.json`,
    grant_types_supported: ["urn:fundwise:params:oauth:grant-type:wallet-signature"],
    response_types_supported: [],
    scopes_supported: [
      "groups:read",
      "expenses:read",
      "settlements:read",
      "expenses:write",
      "profile:write",
      "settlements:record",
      "proposals:write",
    ],
    service_documentation: `${origin}/api/docs`,
    fundwise_auth_note:
      "FundWise currently uses wallet-signed browser sessions and planned Scoped Agent Access. This discovery document advertises the current wallet challenge and verification endpoints; it does not grant autonomous money movement.",
  }
}

export function buildOAuthProtectedResourceMetadata(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return {
    resource: `${origin}/api`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
    scopes_supported: [
      "groups:read",
      "expenses:read",
      "settlements:read",
      "expenses:write",
      "profile:write",
      "settlements:record",
    ],
    resource_documentation: `${origin}/api/docs`,
  }
}

export function buildMcpServerCard(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return {
    $schema: "https://modelcontextprotocol.io/schemas/server-card.schema.json",
    serverInfo: {
      name: "FundWise Agent Discovery",
      version: "0.1.0",
    },
    transport: {
      type: "https",
      endpoint: `${origin}/api/docs`,
      description:
        "FundWise exposes HTTP API documentation and browser WebMCP tools. A dedicated remote MCP transport is not yet shipped.",
    },
    capabilities: {
      tools: {
        listChanged: false,
        providedInBrowser: true,
      },
      resources: {
        listChanged: false,
      },
    },
    links: {
      apiCatalog: `${origin}/.well-known/api-catalog`,
      agentSkill: `${origin}/skill.md`,
      serviceDocumentation: `${origin}/api/docs`,
      openApi: `${origin}/api/openapi.json`,
    },
  }
}

export async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", data)

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
