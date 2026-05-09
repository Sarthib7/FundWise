# Agent Skill Endpoint and Fundy Telegram Bot

FundWise will expose a public `/skill.md` endpoint so any autonomous agent can curl the URL, discover what FundWise can do, and interact with it through scoped wallet-bound API access. Separately, FundWise will host a Telegram bot called **Fundy** — a specific hosted instance of the FundWise Agent — that lets users authenticate their Telegram account against their FundWise wallet, then interact with Groups, Balances, Expenses, and Settlements from Telegram. Fundy handles read-only and draft-safe actions; money movement still requires wallet confirmation in the app. This is hard to reverse because it introduces a public agent-facing API surface and a hosted service dependency, and it would be surprising without context because it changes FundWise from a web-only product into a multi-surface platform with external agent access.

## Key decisions

### Interaction model (Q1)
Fundy starts as a **command-based bot** (`/balance`, `/owe`, `/draft`, etc.) with no natural-language parsing. The end goal is an AI agent (Shape B) with an LLM brain via OpenRouter, but the first version uses fixed commands for predictability and speed.

### Auth — Telegram-to-wallet linking (Q2)
Users link via **web-app-generated linking codes**. The user authenticates in the FundWise web app (already wallet-connected), clicks "Link Telegram", gets a short-lived code like `FW-7X9K2M`, then pastes it in Fundy's DM with `/link FW-7X9K2M`. No in-Telegram wallet signing, no deep links.

### Command set (Q3)
See the full command set in CONTEXT.md. Key rules:
- Read-only commands: `/balance`, `/expenses`, `/owe`, `/settlements`, `/group`
- Draft-safe commands: `/draft`, `/drafts`
- Proposal comments/history may be database-only, but Proposal approve/reject is no longer database-only for Fund Mode; ADR-0029 makes Squads the governance authority, so Fundy should deep-link Members to the app for wallet-confirmed review signing.
- Money movement bounces to the web app: Settlement execution, Contribution execution, Proposal execution all use existing deep links (`?settle=`, `?action=contribute`, etc.)
- Zerion commands: `/analyze`, `/readiness`, `/verify`

### Hosting (Q4)
Fundy runs as a **separate service on Railway**, not inside the Next.js Cloudflare Workers deployment. The Telegram bot library is `grammy`. Fundy calls the same FundWise API routes as the web app using service-to-service auth (`Authorization: Bearer <service-key>` + `X-Fundy-Wallet: <wallet>` header), not direct Supabase access. This keeps one consistent API surface for Fundy, external agents, and the web app.

### API auth for bots and agents (Q4, Q11)
Both Fundy and external agents authenticate against the same API routes. Two paths:
1. **Service auth** (Fundy): `FUNDWISE_SERVICE_API_KEY` shared secret + `X-Fundy-Wallet` header
2. **Scoped Agent Access tokens** (external agents): user-generated tokens from the web app profile page (`/profile/agents`), with rotate/delete/renew/scope management. Also supports wallet-signed challenge-response for agents that can sign Solana messages.

### Skill endpoint (Q5, Q6)
`https://fundwise.fun/skill.md` — root level, returns `Content-Type: text/markdown`. Comprehensive machine-readable document describing what FundWise is, what actions are available, how to authenticate, what to call, what not to call, rate limits, error handling, and terms of use.

### New Supabase tables (Q7)
- `telegram_wallet_links` — one Telegram ID -> one active wallet, soft-delete on re-link
- `telegram_chat_groups` — one Telegram chat -> one FundWise Group
- `telegram_link_codes` — short-lived linking codes (5 min expiry)
- `agent_access_grants` — scoped agent tokens with expiration and revocation
- `draft_expenses` — draft Expenses created from Telegram/agent surfaces before promotion to real Expenses

### Telegram bot library (Q8)
`grammy` — modern, TypeScript-first, middleware-based, supports polling and webhooks, has conversation and session plugins.

### Zerion integration (Q9, Q10)
Fundy uses Zerion CLI for wallet analysis behind three commands:
- `/analyze` — wallet portfolio overview, token holdings, USDC readiness
- `/readiness` — combines FundWise debts + Zerion wallet data to answer "can I settle right now?"
- `/verify <tx-sig-or-member>` — checks on-chain transaction history to confirm a Settlement

Auth: starts with free Zerion API key (`ZERION_API_KEY`), can switch to x402 pay-per-call on Solana later for demo purposes.

### Repo structure (Q12) — SUPERSEDED by [ADR-022](./0022-fundy-moves-to-a-separate-repository.md)
~~**Monorepo**. Fundy lives in `services/fundy/` inside the FundWise repo. Shares TypeScript types, Supabase types, and domain types. Railway deploys from the subdirectory. The `/skill.md` route stays in the Next.js app.~~

**Current decision (ADR-022):** Fundy lives in a **separate repository**, calls FundWise over public HTTP APIs and the Agent Skill Endpoint, and does not import FundWise types directly. The `/skill.md` route remains in this Next.js app.

### Group chat DM auth flow (Q13)
See the full flow in CONTEXT.md. Key rule: any Member can add Fundy to a group chat and `/connect` it to a FundWise Group, but every participant must authenticate in a private DM (`/link`) before Fundy acts for them in the group.

### Deep links back to the app (Q15)
Fundy reuses existing deep link infrastructure:
- **Settlements:** existing **Settlement Request Link** format only (live amount, never auto-send); do not invent a parallel settle URL format.
- **Contributions and Proposal execution:** deep-link into the FundWise web app on the relevant Group (exact query parameters follow whatever the shipped app implements); wallet confirmation remains mandatory.
- The web app already handles context restoration after wallet connect for supported deep links.
