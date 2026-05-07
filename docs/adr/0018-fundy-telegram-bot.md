# Fundy Telegram Bot — Full Specification

> **Repo-structure note:** the monorepo / `services/fundy/` layout described below is **superseded by [ADR-022](./0022-fundy-moves-to-a-separate-repository.md)**. Fundy now lives in its own repository and calls FundWise over public HTTP APIs. All other decisions in this document (linking flow, command set, hosting on Railway, `grammy`, Zerion commands, group-chat DM auth, deep links) remain in effect.

FundWise ships a hosted Telegram bot called **Fundy** that runs the FundWise Agent. Users authenticate by linking their Telegram account to their FundWise wallet via short-lived codes, then interact with Groups, Balances, Expenses, and Settlements from Telegram. Read-only and draft-safe actions run in Telegram; on-chain Settlement, Contribution, and Proposal execution deep-link back to the web app for wallet confirmation. This is hard to reverse because it introduces a hosted service dependency and a multi-surface product model.

## Two phases

### Fundy Lite (hackathon demo)

Command-based bot with Zerion wallet analysis. No LLM. Fixed commands for predictability and speed. Runs on Railway with `grammy`. Calls FundWise HTTP API routes with service-to-service auth.

**Scope:**
- Wallet linking via short-lived codes
- Read-only Group state: `/balance`, `/owe`, `/expenses`, `/settlements`
- Settlement nudges: `/settle` generates a Settlement Request Link
- Draft expenses: `/draft`, `/drafts`
- Zerion wallet analysis: `/analyze`, `/readiness`, `/verify`
- Group chat linking: `/connect`, `/disconnect`
- No money movement — all financial actions deep-link to web app

**Tech stack:**
- Hosting: Railway
- Library: `grammy`
- LLM: none (command-only)
- Zerion: free `ZERION_API_KEY` (dev tier)
- Auth: `FUNDWISE_SERVICE_API_KEY` + `X-Fundy-Wallet` header
- Monorepo path: `services/fundy/`

### Fundy Full (post-hackathon roadmap)

LLM-powered personal finance assistant. Natural language via OpenRouter (free models). Budgets, spending patterns, savings goals, transaction analysis, proactive reminders, receipt and invoice parsing. The bot becomes your financial companion, not just an expense checker.

**Scope:**
- Everything in Fundy Lite
- LLM brain via OpenRouter API (user supplies `OPENROUTER_API_KEY`, uses free models)
- Natural language: "how much do I owe across all groups", "remind Ben to settle Lisbon Trip"
- Proactive notifications: "Ben still owes you $23.50 from Lisbon Trip — it's been 3 days"
- Budget tracking: spending patterns, category breakdowns, monthly summaries
- Receipt and invoice parsing: send a photo/PDF → Fundy creates a draft expense
- Multi-group dashboard: "show me all my Groups and balances"
- Savings goals and spending insights
- `/analyze` expands to full portfolio + spending history + recommendations

## Auth — Telegram-to-wallet linking

Users link via **web-app-generated linking codes**:

1. User opens FundWise web app (already wallet-connected)
2. Goes to profile/agents page → "Link Telegram" button
3. Gets a short-lived code like `FW-7X9K2M` (30-second TTL)
4. Pastes `/link FW-7X9K2M` in Fundy's private DM
5. Fundy validates code, creates `telegram_wallet_links` record
6. One Telegram account → one active wallet. Re-linking soft-deletes old link.

Rules:
- One Telegram account maps to one active wallet at a time
- One Telegram chat maps to one FundWise Group at a time
- Any Member may add Fundy to a group chat and `/connect` it to a Group
- Every participant must authenticate in private DM (`/link`) before Fundy acts for them in the group

## Command set — Fundy Lite

### Identity and setup (DM only)

| Command | Description |
|---------|-------------|
| `/link FW-…` | Consume a web-app linking code, bind Telegram user to wallet |
| `/unlink` | Remove Telegram–wallet link (soft-delete) |
| `/whoami` | Show linked wallet address and display name |

### Read-only (DM or linked group chat)

| Command | Description |
|---------|-------------|
| `/balance` | Net balance across all Groups (DM) or in linked Group (chat) |
| `/owe` | Who you owe and who owes you |
| `/expenses` | Recent expenses in the linked Group |
| `/settlements` | Recent settlements in the linked Group |
| `/group` | Group info: name, members, mode, created date |

### Draft-safe (DM or linked group chat)

| Command | Description |
|---------|-------------|
| `/draft <amount> <description>` | Create a draft expense in the linked Group. Example: `/draft 4500 dinner at Padaria`. Not real until confirmed in web app. |
| `/drafts` | List your draft expenses |

### Zerion wallet analysis

| Command | Description |
|---------|-------------|
| `/analyze` | Wallet portfolio: token holdings, USDC balance, total value. "Your wallet: 45 USDC, 0.8 SOL ($120), total $165." |
| `/readiness` | FundWise debts + Zerion wallet data combined. "You owe $23.50 in Lisbon Trip. You have 45 USDC. You're ready to settle." |
| `/verify <tx-sig>` or `/verify @member` | Check on-chain history to confirm a Settlement happened. "Confirmed: $23.50 USDC sent to Carol on Apr 30. Sig: 4Kt9…mN7x." |

### Group chat ↔ Group linking

| Command | Description |
|---------|-------------|
| `/connect <group-code>` | Link this Telegram chat to one FundWise Group |
| `/disconnect` | Unlink chat from Group |

### Deep links back to the app

Fundy reuses existing deep link infrastructure:
- **Settlements:** existing Settlement Request Link format (live amount, never auto-send). Do not invent a parallel settle URL.
- **Contributions and Proposal execution:** deep-link into the web app on the relevant Group. Wallet confirmation remains mandatory.

## Fundy Full — command evolution

When LLM is added via OpenRouter, commands become natural language:

| Instead of | User says |
|------------|-----------|
| `/balance` | "how much do I owe?" |
| `/owe` | "who owes me money?" |
| `/draft 4500 dinner` | "I just paid 4500 for dinner, split it with everyone" |
| `/analyze` | "what's in my wallet?" |
| `/readiness` | "can I settle right now?" |
| `/verify 4Kt9...` | "did Carol pay me?" |
| N/A | "remind Ben to settle Lisbon Trip" |
| N/A | "show me my spending this month" |
| N/A | "analyze my March expenses by category" |

LLM integration: `OPENROUTER_API_KEY` env var. Free models only. Fundy sends command context + user message to OpenRouter, parses structured response, executes tool calls (same tools as command handlers).

## Hosting and infrastructure

| Component | Choice | Reason |
|-----------|--------|--------|
| Hosting | Railway | Separate from Next.js Cloudflare Workers. Simple deploy. |
| Bot library | `grammy` | TypeScript-first, middleware-based, polling + webhooks. |
| LLM | OpenRouter (Fundy Full only) | Free models, simple API, user-supplied key. |
| Zerion | Free `ZERION_API_KEY` | Dev tier, no per-call cost. x402 optional later. |
| Auth | Service key + wallet header | `FUNDWISE_SERVICE_API_KEY` + `X-Fundy-Wallet`. Same API as web app. |

## Repo structure

```
services/fundy/
├── src/
│   ├── bot.ts              ← grammy bot setup, middleware
│   ├── commands/
│   │   ├── link.ts         ← /link, /unlink, /whoami
│   │   ├── balance.ts      ← /balance, /owe
│   │   ├── expenses.ts     ← /expenses, /settlements, /group
│   │   ├── drafts.ts       ← /draft, /drafts
│   │   ├── settle.ts       ← /settle (generates deep link)
│   │   ├── zerion.ts       ← /analyze, /readiness, /verify
│   │   └── chat.ts         ← /connect, /disconnect
│   ├── lib/
│   │   ├── fundwise-api.ts ← HTTP client for FundWise API routes
│   │   ├── zerion.ts       ← Zerion API client
│   │   ├── openrouter.ts   ← OpenRouter LLM client (Fundy Full)
│   │   └── auth.ts         ← linking code validation, session
│   └── types.ts            ← shared types
├── package.json
├── tsconfig.json
└── railway.toml
```

## Environment variables

```
# Required (Fundy Lite)
TELEGRAM_BOT_TOKEN=
FUNDWISE_SERVICE_API_KEY=
FUNDWISE_API_BASE_URL=https://fundwise.kairen.xyz
ZERION_API_KEY=

# Optional (Fundy Full, later)
OPENROUTER_API_KEY=
SOLANA_PRIVATE_KEY=         # for x402 Zerion calls
ZERION_X402=                # enable x402 pay-per-call

# Shared with web app
NEXT_PUBLIC_SOLANA_RPC_URL=
```

## New Supabase tables

```sql
-- Telegram → wallet identity links
CREATE TABLE telegram_wallet_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL,
  wallet TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);

-- Telegram chat → FundWise Group links
CREATE TABLE telegram_chat_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id BIGINT NOT NULL,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  linked_by TEXT NOT NULL, -- wallet that ran /connect
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(telegram_chat_id)
);

-- Short-lived linking codes
CREATE TABLE telegram_link_codes (
  code TEXT PRIMARY KEY,
  wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false
);

-- Draft expenses from Telegram/agent
CREATE TABLE draft_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  amount BIGINT,
  memo TEXT,
  category TEXT DEFAULT 'general',
  source JSONB, -- { currency, amount, rate, rate_source }
  promoted_expense_id UUID REFERENCES expenses(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## API routes Fundy calls

Fundy calls the same FundWise HTTP API routes as the web app:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/groups` | GET | List user's Groups |
| `/api/groups/[groupId]` | GET | Group detail + dashboard snapshot |
| `/api/groups/[groupId]/members` | GET | Member list |
| `/api/expenses` | POST | Create draft expense |
| `/api/settlements` | GET | List settlements |
| `/api/settlements/[settlementId]` | GET | Settlement receipt |

All requests include:
```
Authorization: Bearer <FUNDWISE_SERVICE_API_KEY>
X-Fundy-Wallet: <linked-wallet-address>
```

## Priority

- **Fundy Lite**: hackathon demo, built in parallel by a second developer
- **Fundy Full**: post-hackathon, after Split Mode + LI.FI + Fund Mode are stable
- **Agent Skill Endpoint** (`/skill.md`): post-hackathon, after Fundy Lite proves the API surface
- **Scoped Agent Access**: post-hackathon, after Agent Skill Endpoint

## Dependencies

- FundWise web app must be deployed and API routes must work
- Supabase tables must be migrated before Fundy can link wallets
- Zerion API key must be provisioned
- Railway project must be set up for deployment
- Telegram bot token from @BotFather
