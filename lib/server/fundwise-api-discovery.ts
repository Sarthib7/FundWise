import { normalizeBaseUrl } from "@/lib/server/fundwise-discovery"

export function buildApiDocsMarkdown(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return `# FundWise HTTP API

Public API contract for FundWise, the Group money app for on-chain settlement. Fundy and other agent clients should use this page as the endpoint reference and fetch \`${origin}/skill.md\` first for capability and safety rules.

Base URL: \`${origin}\`

## Auth

### Browser wallet session

Most routes accept the same wallet-signed browser session used by the web app:

1. \`POST /api/auth/wallet/challenge\` with \`{ "wallet": "<solana-pubkey>" }\`.
2. Sign the returned \`message\` with the wallet.
3. \`POST /api/auth/wallet/verify\` with \`{ "wallet": "<solana-pubkey>", "signature": "<base64-signature>" }\`.
4. Send the returned HTTP-only cookie on protected API calls.

### Fundy service auth - planned

Fundy service-to-service auth is planned, not enabled on the current FundWise API routes. Until that work ships, protected routes require the browser wallet-session flow above.

Planned headers:

\`\`\`http
Authorization: Bearer <FUNDWISE_SERVICE_API_KEY>
X-Fundy-Wallet: <linked-solana-wallet>
Content-Type: application/json
\`\`\`

Planned rules:

- \`FUNDWISE_SERVICE_API_KEY\` must be configured on the FundWise web app deployment.
- \`X-Fundy-Wallet\` is the linked Member wallet Fundy is acting for.
- Server-side membership and ownership checks still apply.
- Fundy must not execute money movement. Settlement and Contribution transfers still require wallet confirmation in the web app; API routes only record verified transaction signatures after the user signs.
- Third-party agents should not use the Fundy service key. Scoped Agent Access tokens are the planned external-agent auth path.

## Error shape

All JSON errors use:

\`\`\`json
{ "error": "Human readable message" }
\`\`\`

Common statuses: \`400\` validation error, \`401\` missing or invalid auth, \`403\` not a Group Member or not allowed, \`404\` not found.

## Endpoints

### Agent discovery

#### GET /skill.md

Public Agent Skill Endpoint. Returns machine-readable markdown describing FundWise capabilities, allowed and forbidden actions, auth, limits, and safety rules.

Auth: none.

#### GET /api/docs

This document.

Auth: none.

#### GET /sitemap.xml

Public XML sitemap listing canonical public FundWise URLs.

Auth: none.

#### GET /robots.txt

Crawler policy with a \`Sitemap:\` reference to \`/sitemap.xml\`.

Auth: none.

#### GET /.well-known/api-catalog

RFC 9727 API catalog in \`application/linkset+json\` format. Links to the OpenAPI service description, service documentation, Agent Skill Endpoint, and public health endpoint.

Auth: none.

#### GET /api/openapi.json

OpenAPI 3.1 service description for the current FundWise HTTP API.

Auth: none.

#### GET /openapi.json

Root-level alias for agents that discover OpenAPI documents outside the \`/api\` path.

Auth: none.

#### GET /.well-known/agent-skills/index.json

Agent Skills discovery index with a SHA-256 digest for \`/skill.md\`.

Auth: none.

#### GET /.well-known/oauth-authorization-server

OAuth-style discovery metadata for FundWise's current wallet-signature auth endpoints and planned Scoped Agent Access scopes.

Auth: none.

#### GET /.well-known/oauth-protected-resource

Protected Resource Metadata for the FundWise API resource.

Auth: none.

#### GET /.well-known/mcp/server-card.json

MCP Server Card describing FundWise's agent discovery resources and browser-provided WebMCP tools.

Auth: none.

### Wallet auth

#### POST /api/auth/wallet/challenge

Create a short-lived wallet challenge.

Auth: none.

Request:

\`\`\`json
{ "wallet": "<solana-pubkey>" }
\`\`\`

Response:

\`\`\`json
{ "message": "...", "expiresAt": 1770000000000 }
\`\`\`

#### POST /api/auth/wallet/verify

Verify a signed challenge and set the protected wallet-session cookie.

Auth: challenge cookie from \`/api/auth/wallet/challenge\`.

Request:

\`\`\`json
{ "wallet": "<solana-pubkey>", "signature": "<base64-signature>" }
\`\`\`

Response:

\`\`\`json
{ "wallet": "<solana-pubkey>" }
\`\`\`

#### GET /api/auth/wallet/session

Return the current browser wallet-session status.

Auth: optional browser wallet session.

Response:

\`\`\`json
{ "authenticated": true, "wallet": "<solana-pubkey>" }
\`\`\`

### Groups

#### GET /api/groups?code=<inviteCode>

Resolve an invite code for join preview.

Auth: none.

#### GET /api/groups?wallet=<wallet>

List Groups for the authenticated wallet.

Auth: browser wallet session. If \`wallet\` is provided, it must match the authenticated wallet.

#### POST /api/groups

Create a Group.

Auth: browser wallet session. \`createdBy\` must match the authenticated wallet.

Request:

\`\`\`json
{
  "name": "Lisbon Trip",
  "mode": "split",
  "stablecoinMint": "<usdc-mint>",
  "createdBy": "<creator-wallet>",
  "fundingGoal": 1000,
  "approvalThreshold": 2
}
\`\`\`

#### GET /api/groups/{groupId}?wallet=<wallet>

Load a Group dashboard snapshot. Private ledger fields are included only when the authenticated wallet matches the requested Member wallet.

Auth: optional for public Group shell; browser wallet session for Member-specific view.

#### GET /api/groups/{groupId}/ledger

Load protected Split Mode ledger data, including Balances, suggested Settlements, Activity Feed, and total settled volume.

Auth: browser wallet session. Authenticated wallet must be a Group Member.

#### POST /api/groups/{groupId}/members

Join a Group as a Member.

Auth: browser wallet session. \`wallet\` must match the authenticated wallet.

Request:

\`\`\`json
{ "wallet": "<member-wallet>", "displayName": "Sarthi" }
\`\`\`

#### PATCH /api/groups/{groupId}/treasury

Persist Fund Mode Treasury addresses after Treasury initialization.

Auth: browser wallet session. \`creatorWallet\` must match the authenticated wallet.

Request:

\`\`\`json
{
  "creatorWallet": "<creator-wallet>",
  "multisigAddress": "<squads-multisig>",
  "treasuryAddress": "<treasury-token-account>"
}
\`\`\`

### Expenses

#### GET /api/expenses?groupId=<groupId>

List Expenses for a Group.

Auth: browser wallet session. Authenticated wallet must be allowed to read the Group.

#### POST /api/expenses

Create a real Expense record.

Auth: browser wallet session. \`createdBy\` must match the authenticated wallet.

Fundy note: after service auth ships, use this only when the Member explicitly wants to create a real Expense. A separate draft Expense API is still planned for \`/draft\`-style commands.

Amounts are integer token units, not decimal USDC display amounts. For a 6-decimal USDC mint, \`42500000\` means 42.5 USDC.

Request:

\`\`\`json
{
  "groupId": "<group-id>",
  "payer": "<payer-wallet>",
  "createdBy": "<creator-wallet>",
  "amount": 42500000,
  "mint": "<usdc-mint>",
  "memo": "Dinner",
  "category": "food",
  "splitMethod": "equal",
  "splits": [
    { "wallet": "<member-a>", "share": 21250000 },
    { "wallet": "<member-b>", "share": 21250000 }
  ],
  "sourceCurrency": "USD",
  "sourceAmount": 42500000,
  "exchangeRate": 1,
  "exchangeRateSource": "manual",
  "exchangeRateAt": "2026-05-04T00:00:00.000Z"
}
\`\`\`

#### GET /api/expenses/{expenseId}

Load one Expense.

Auth: browser wallet session.

#### PATCH /api/expenses/{expenseId}

Update an Expense before later Settlements make the ledger unsafe.

Auth: browser wallet session. \`actorWallet\` must match the authenticated wallet and the Expense creator.

#### DELETE /api/expenses/{expenseId}

Delete an Expense before later Settlements make the ledger unsafe.

Auth: browser wallet session. \`actorWallet\` must match the authenticated wallet and the Expense creator.

Request:

\`\`\`json
{ "actorWallet": "<creator-wallet>" }
\`\`\`

### Settlements

#### POST /api/settlements

Record a Settlement receipt after the debtor signs an on-chain USDC transfer.

Auth: browser wallet session. \`fromWallet\` must match the authenticated wallet.

Important: this route does not initiate an on-chain transfer. It verifies and persists the transaction signature. Fundy should deep-link the debtor back to the app for wallet confirmation instead of trying to settle in Telegram.

Request:

\`\`\`json
{
  "groupId": "<group-id>",
  "fromWallet": "<debtor-wallet>",
  "toWallet": "<creditor-wallet>",
  "amount": 23500000,
  "mint": "<usdc-mint>",
  "txSig": "<solana-signature>"
}
\`\`\`

#### GET /api/settlements/{settlementId}

Load a protected Receipt view.

Auth: browser wallet session. Authenticated wallet must be allowed to read the Receipt.

### Planned Agent Payment Endpoints

These endpoints are not live yet. They are listed so agents and developers do not confuse current FundWise APIs with planned payable settlement support.

Planned payment protocols to evaluate:

- x402 HTTP 402 payment challenges for payable agent routes.
- Machine Payment Protocol (MPP) discovery through OpenAPI \`x-payment-info\` extensions for payable operations.
- Agentic Commerce Protocol (ACP) discovery at \`/.well-known/acp.json\` only if FundWise exposes a commerce API.

#### POST /api/agent/spending-policies

Planned. Create a Member-granted Spending Policy after direct wallet confirmation. Policy fields must include agent identity, scopes, Group scope, USDC asset scope, per-Settlement cap, daily cap, counterparty policy, expiry, and revocation support.

#### GET /api/agent/spending-policies

Planned. List active Spending Policies for the authenticated Member.

#### PATCH /api/agent/spending-policies/{policyId}

Planned. Lower limits, renew, or revoke a Spending Policy. Raising limits must require fresh direct wallet confirmation.

#### POST /api/agent/settlement-requests

Planned. Create or fetch a Payable Settlement Request for one exact live debtor-to-creditor Settlement intent. Must resolve the live Group Balance and expose a human Settlement Request Link fallback.

#### GET /api/agent/settlement-requests/{requestId}

Planned. Inspect amount, expiry, selected payment rail, and status for a Payable Settlement Request.

#### POST /api/agent/settlement-requests/{requestId}/pay

Planned. Pay only when the authenticated agent has a valid Spending Policy. If the amount is above policy, return the human Settlement Request Link instead of attempting payment.

#### POST /api/agent/settlement-requests/{requestId}/verify

Planned. Verify x402 / MPP / on-chain proof, then create the normal Settlement and Receipt only if the proof matches the request.

### Contributions

#### POST /api/contributions

Record a Fund Mode Contribution receipt after a Member signs an on-chain USDC transfer into the Treasury.

Auth: browser wallet session. \`memberWallet\` must match the authenticated wallet.

Important: this route does not initiate an on-chain transfer. Fundy should deep-link the Member back to the app for wallet confirmation.

Request:

\`\`\`json
{
  "groupId": "<group-id>",
  "memberWallet": "<member-wallet>",
  "amount": 100,
  "mint": "<usdc-mint>",
  "txSig": "<solana-signature>"
}
\`\`\`

### Proposals

#### POST /api/proposals

Create a Fund Mode reimbursement Proposal for a current Group Member.

Auth: browser wallet session. \`proposerWallet\` must match the authenticated wallet. The Group must be a Fund Mode Group with an initialized Treasury. The recipient must be a current Group Member.

Important: the browser creates the Squads vault transaction and Squads Proposal first. This route verifies and stores the Squads Proposal mapping for FundWise UX/history; the database is not the approval authority and this route does not execute Treasury movement.

Request:

\`\`\`json
{
  "groupId": "<group-id>",
  "proposerWallet": "<member-wallet>",
  "recipientWallet": "<member-wallet>",
  "amount": 100,
  "mint": "<usdc-mint>",
  "squadsTransactionIndex": 1,
  "squadsProposalAddress": "<squads-proposal-pda>",
  "squadsTransactionAddress": "<squads-transaction-pda>",
  "squadsCreateTxSig": "<solana-signature>",
  "memo": "Hotel deposit reimbursement"
}
\`\`\`

#### POST /api/proposals/{proposalId}/review

Approve or reject a pending Fund Mode reimbursement Proposal.

Auth: browser wallet session. \`memberWallet\` must match the authenticated wallet. The Proposal creator cannot review their own Proposal. Each Member can approve or reject at most once.

Important: the browser signs the Squads approve/reject action first. This route verifies the Squads Proposal state and records the review signature; threshold approval comes from Squads status and does not execute Treasury movement.

Request:

\`\`\`json
{
  "memberWallet": "<member-wallet>",
  "decision": "approved",
  "txSig": "<solana-signature>"
}
\`\`\`

#### POST /api/proposals/{proposalId}/execute

Record execution of an approved Fund Mode reimbursement Proposal.

Auth: browser wallet session. \`executorWallet\` must match the authenticated wallet and be a current Group Member.

Important: the browser executes the approved Squads vault transaction first. This route verifies Squads status is executed and verifies the stablecoin transfer from the Treasury ATA to the approved recipient before marking the FundWise Proposal executed.

Request:

\`\`\`json
{
  "executorWallet": "<member-wallet>",
  "txSig": "<solana-signature>"
}
\`\`\`

### Profile

#### POST /api/profile/display-name

Update a Member's global Profile Display Name.

Auth: browser wallet session. \`wallet\` must match the authenticated wallet.

Request:

\`\`\`json
{ "wallet": "<member-wallet>", "displayName": "Sarthi" }
\`\`\`

## Current browser-session calls

Current protected calls require a browser wallet session:

- Read Group list: \`GET /api/groups?wallet=<wallet>\`
- Read Group ledger: \`GET /api/groups/{groupId}/ledger\`
- Read Expenses: \`GET /api/expenses?groupId=<groupId>\`
- Read Receipts: \`GET /api/settlements/{settlementId}\`
- Generate Settlement links in the client using the existing web URL: \`${origin}/groups/{groupId}?settle=<debtor-wallet>\`

Use mutation routes only for explicit Member-directed actions. Money-moving actions still deep-link to the web app for wallet signing. Fundy service auth is planned and should not be treated as available until the API routes implement it.
`
}

export function buildAgentSkillMarkdown(baseUrl?: string) {
  const origin = normalizeBaseUrl(baseUrl)

  return `# FundWise Agent Skill

FundWise is Group money, done right: Members create private Groups, log Expenses, see live Balances, and settle exact USDC amounts on Solana with clear Receipts.

This is the public Agent Skill Endpoint for FundWise. It is safe to fetch without authentication and does not expose private Member data.

- Production app: ${origin}
- API docs: ${origin}/api/docs
- API catalog: ${origin}/.well-known/api-catalog
- OpenAPI service description: ${origin}/api/openapi.json
- Agent Skills index: ${origin}/.well-known/agent-skills/index.json
- MCP Server Card: ${origin}/.well-known/mcp/server-card.json
- Primary product path: Group -> Expense -> Balance -> Settlement -> Receipt
- Settlement asset: USDC on Solana
- Identity: Solana wallet public key

## What agents may do

Agents may help Members with read-only and draft-safe workflows:

- Discover the FundWise API surface.
- Read authenticated Group, Expense, Balance, Settlement, and Receipt data when the Member has granted access.
- Summarize who owes whom in a Group.
- Suggest next actions, reminders, and Settlement Request Links.
- Draft Expenses or proof-upload intents when a draft API is available.
- For Fundy later, call FundWise APIs with service-to-service auth for linked Telegram users after that auth path ships.

## What agents must not do

Agents must not:

- Move money on behalf of a Member.
- Auto-send a Settlement after opening a Settlement Request Link.
- Execute Contributions or Fund Mode Proposal payouts from Telegram or an autonomous agent surface.
- Invent Group, Expense, Settlement, Contribution, or Proposal data.
- Scrape or expose private Member data without authenticated access.
- Treat SOL as a settlement asset. SOL is only for gas.
- Call Supabase directly. Use the FundWise HTTP API only.

## Auth model

### Fundy service auth - planned

Fundy is the planned hosted Telegram bot that runs the FundWise Agent. Fundy will link a Telegram user to one active Solana wallet, then call the FundWise HTTP API as that wallet. This service-auth path is not enabled on the current API routes; protected routes currently require browser wallet sessions.

Planned headers:

\`\`\`http
Authorization: Bearer <FUNDWISE_SERVICE_API_KEY>
X-Fundy-Wallet: <linked-solana-wallet>
Content-Type: application/json
\`\`\`

When implemented, the FundWise server will treat \`X-Fundy-Wallet\` as the acting Member wallet only after the service key is verified. Group membership, creator ownership, and wallet-match checks will still apply.

### Browser wallet session

The web app uses wallet-signed session cookies through:

- \`POST /api/auth/wallet/challenge\`
- \`POST /api/auth/wallet/verify\`
- \`GET /api/auth/wallet/session\`

### Scoped Agent Access

Scoped Agent Access is the planned auth model for third-party autonomous agents. It will use Member-granted tokens scoped to wallet, Group, action type, expiration, and revocation. Do not ask users for the Fundy service key.

### Spending Policies

Spending Policies are planned and required before any agent can pay a Settlement. They cap agent payment capacity by Member wallet, agent identity, Group, asset, counterparty, per-Settlement amount, daily amount, expiry, and revocation. Anything outside policy must fall back to a Settlement Request Link for human wallet confirmation.

### Agent-native payment protocols

FundWise does not currently expose paid API access or commerce checkout routes. Planned Payable Settlement Requests should evaluate x402, MPP, and ACP only after Scoped Agent Access and Spending Policies exist. Until then, agents must treat these protocols as TODOs, not available payment rails.

## Main API entry points

Fetch ${origin}/api/docs for full request and response examples.

Current browser-session read APIs:

- \`GET /api/groups?wallet=<wallet>\` — list Groups for the acting wallet.
- \`GET /api/groups/{groupId}/ledger\` — read protected Group ledger, Balances, suggested Settlements, and Activity Feed.
- \`GET /api/expenses?groupId=<groupId>\` — list Group Expenses.
- \`GET /api/settlements/{settlementId}\` — read a Receipt.

Mutations requiring explicit Member intent:

- \`POST /api/groups\` — create a Group.
- \`POST /api/groups/{groupId}/members\` — join a Group.
- \`POST /api/expenses\` — create a real Expense.
- \`PATCH /api/expenses/{expenseId}\` — edit an Expense as its creator.
- \`DELETE /api/expenses/{expenseId}\` — delete an Expense as its creator.
- \`POST /api/proposals\` — create a Fund Mode reimbursement Proposal.
- \`POST /api/proposals/{proposalId}/review\` — approve or reject a pending Proposal.
- \`POST /api/proposals/{proposalId}/execute\` — record a verified Squads execution for an approved Proposal.
- \`POST /api/profile/display-name\` — update Profile Display Name.

Receipt-recording only after wallet-confirmed on-chain action:

- \`POST /api/settlements\` — record a verified Settlement signature.
- \`POST /api/contributions\` — record a verified Contribution signature.

Planned payable settlement endpoints:

- \`POST /api/agent/spending-policies\` — create a Spending Policy after wallet confirmation.
- \`GET /api/agent/spending-policies\` — list current Spending Policies.
- \`PATCH /api/agent/spending-policies/{policyId}\` — lower, renew, or revoke policy limits.
- \`POST /api/agent/settlement-requests\` — create a Payable Settlement Request.
- \`GET /api/agent/settlement-requests/{requestId}\` — inspect a Payable Settlement Request.
- \`POST /api/agent/settlement-requests/{requestId}/pay\` — pay only if policy permits; otherwise return a human Settlement Request Link.
- \`POST /api/agent/settlement-requests/{requestId}/verify\` — verify payment proof and create the normal Receipt.

## Deep-link rules

For Settlements, agents should reuse the existing Settlement Request Link pattern:

\`${origin}/groups/{groupId}?settle=<debtor-wallet>\`

Rules:

- The amount is resolved from live Group Balance when the page opens.
- The Settlement is never auto-sent.
- The debtor reviews the state and confirms in their wallet.
- Fundy may send or remind with this link, but must not sign or submit the transfer.
- Planned Payable Settlement Requests use the same live Balance and Receipt rules, but add Spending Policy checks and payment proof verification.

## Fundy command mapping

- \`/balance\`, \`/owe\` -> \`GET /api/groups?wallet=<wallet>\` then \`GET /api/groups/{groupId}/ledger\`.
- \`/expenses\` -> \`GET /api/expenses?groupId=<groupId>\`.
- \`/settlements\` -> \`GET /api/groups/{groupId}/ledger\` and filter Activity Feed for Settlements.
- \`/group\` -> \`GET /api/groups/{groupId}?wallet=<wallet>\`.
- \`/settle\` -> generate a Settlement Request Link to the web app.
- \`/draft\` -> draft API is planned; do not create a real Expense unless the Member explicitly confirms that behavior.
- \`/analyze\`, \`/readiness\`, \`/verify\` -> use Zerion CLI in Fundy, then combine with FundWise read APIs.

## Rate limits and retries

- Keep bot polling and retries conservative.
- Retry only idempotent GET calls automatically.
- Do not automatically retry mutation calls that create records.
- Treat \`401\` as relink or re-auth required.
- Treat \`403\` as not a Group Member or insufficient capability.
- Treat \`404\` as stale Group, Expense, or Receipt reference.

## Safety and terms

FundWise is financial software. In the current product, agents are assistants, not signers. Any action that moves USDC or changes on-chain state must return the Member to the FundWise web app and wallet confirmation flow.

Future Payable Settlement Requests may allow under-limit agent payment only after Spending Policies, idempotency, payment proof verification, and normal Receipt generation are implemented. Never treat a prompt or natural-language request as payment authorization.
`
}
