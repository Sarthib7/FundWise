# AGENTS.md — Instructions for AI Agents

This file is the shared instruction set for all AI agents (Claude Codex, GLM, Cursor, etc.) working on FundWise. Read this file before making any changes to the codebase.

---

## Project Summary

**FundWise** is a group-money app on Solana — a two-mode consumer expense app:

1. **Split Mode** (MVP): Track expenses, compute who owes whom, and settle exact USDC amounts on Solana.
2. **Fund Mode** (Phase 2): Pool stablecoins into a shared treasury with proposal-based spending.

**Status:** Colosseum Frontier hackathon submission (May 11, 2026) is done. The active milestone is **Split Mode + Fund Mode on Solana mainnet plus Circle CCTP / LI.FI EVM support for Solana Summit Berlin (2026-06-13)**. Multi-chain inbound (EVM → USDC on Solana via Circle CCTP, orchestrated by LI.FI) was pulled into the launch scope on 2026-05-16. See [ROADMAP.md](./ROADMAP.md) and [STATUS.md](./STATUS.md).

---

## Reading Order

Every agent must read these files before touching code:

1. **[README.md](./README.md)** — project overview plus documentation map.
2. **[STATUS.md](./STATUS.md)** — what's live, what's next, and the currently locked product decisions.
3. **[CONTEXT.md](./CONTEXT.md)** — domain language, relationships, and product invariants. Use these terms in code, comments, and commit messages. Do not invent new terms.
4. **[PRD.md](./PRD.md)** — MVP scope, user stories, implementation decisions, and out-of-scope boundaries.
5. **[ROADMAP.md](./ROADMAP.md)** — phased delivery plan.
6. **[docs/adr/](./docs/adr/)** — architecture decisions. Check these before making architectural choices. A new ADR is needed when a decision is hard to reverse, surprising without context, and the result of a genuine trade-off.

If docs disagree, treat **STATUS.md**, **CONTEXT.md**, **PRD.md**, and the latest ADRs as the source of truth.

---

## Ground Rules

### Never do these

- **No `git push`, `git reset --hard`, or force-push.** The owner handles all git operations.
- **No committing.** Only the owner commits and pushes.
- **No destructive file operations without confirmation.** Ask before deleting files, even if they're listed for removal in STATUS.md.
- **No guessing secrets.** If you need an RPC URL, API key, mint address, or Supabase config, ask the owner. Never hardcode or invent values.
- **No prediction-market, Kalshi, ZK-compression, or LP-yield code.** That era is over. See ADR-0001 and ADR-0004.
- **No email/password auth.** Identity = Solana public key. Optional Phantom Connect (ADR-0014) may add Google/Apple onboarding without replacing wallet-adapter or other wallets. See ADR-0006 and CONTEXT.md.

### Always do these

- **Use the domain language from CONTEXT.md.** "Group" not "circle", "Settlement" not "payment" (in Split Mode), "Contribution" not "payment" (in Fund Mode).
- **Keep stablecoins-only for balances.** SOL is for gas only. The current MVP settlement asset is USDC. See ADR-0002 and ADR-0011.
- **Off-chain metadata, on-chain money.** Group and Expense metadata live in Supabase/Postgres; money movement happens via SPL token transfers. See ADR-0003 and ADR-0009.
- **Follow the roadmap phases.** Don't skip ahead. Phase 0 cleanup → Phase 1 Split Mode → Phase 1.5 LI.FI → Phase 2 Fund Mode.
- **Run `pnpm build` after changes.** Verify zero build errors before reporting completion.
- **Create ADRs for significant decisions.** Follow the format in `docs/adr/`. Number sequentially. See ADR format guidance below.

---

## Architecture

### Stack (do not change without an ADR)

- **Framework:** Next.js 15 (App Router), React 19, Tailwind v4
- **UI:** Radix / shadcn components (`components/ui/`)
- **Wallet:** `@solana/wallet-adapter-`* (Phantom, Solflare, Backpack)
- **Chain:** Solana (mainnet-beta target, devnet for testing)
- **Tokens:** `@solana/spl-token` for USDC settlement transfers
- **Off-chain:** Supabase / Postgres
- **Treasury:** Squads Protocol (`@sqds/multisig`) for Fund Mode
- **Cross-chain:** LI.FI SDK (`@lifi/sdk`) for secondary top-up and recovery flows

### File structure

```
/
├── README.md               ← Project overview + docs map
├── CONTEXT.md              ← Domain model, language (READ FIRST)
├── AGENTS.md               ← This file
├── PRD.md                  ← Product requirements
├── ROADMAP.md              ← Phased delivery plan
├── STATUS.md               ← Current state, next actions
├── DECISIONS.md            ← Legacy ADR log (points to docs/adr/)
├── docs/
│   └── adr/                ← Architecture Decision Records
├── app/                    ← Next.js App Router pages
│   └── groups/             ← Group pages + settlement receipts
├── components/
│   ├── ui/                 ← shadcn primitives (do not hand-edit)
│   └── *.tsx               ← App-level components
├── lib/                    ← Client-side business logic
├── lib/server/             ← Server-only reads, mutations, wallet session
├── services/
│   └── fundy/              ← Planned: Telegram bot (Railway), grammy
├── supabase/               ← Current schema
├── hooks/                  ← React hooks
└── public/                 ← Static assets
```

### Key source files

| File                                                  | Purpose                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `lib/api-client.ts` *(planned, FW-074)*               | Browser → API: typed `apiFetch<T>` + shared types. Replaces `lib/db.ts` |
| `lib/expense-engine.ts`                               | Split math, balances, settlement graph                           |
| `lib/expense-suggestions.ts` *(planned, FW-073)*      | Pure derived view: `computeSuggestedReimbursements`              |
| `lib/simple-payment.ts`                               | SPL transfer impl                                                |
| `lib/supabase.ts`                                     | Supabase client                                                  |
| `lib/squads/` *(planned, ADR-0035)*                   | Fenced Squads governance: instructions, verification, status mapping. Replaces `lib/squads-multisig.ts` |
| `lib/fees/` *(planned, ADR-0036)*                     | Per-fee operations + uniform `FeeQuote`; `Fees.record` ledger write |
| `lib/lifi-bridge.ts`                                  | LI.FI route + CCTP routing (Summit scope)                        |
| `lib/server/with-authenticated-handler.ts` *(planned, ADR-0037)* | Wallet-session route HOF (auth + rate limit + body parse + wallet-match + envelope) |
| `lib/server/mutations/` *(planned, ADR-0038)*         | Per-concept mutations: `group`, `member`, `expense`, `settlement`, `contribution`, `proposal`, `treasury`, `monetization` + `_internal.ts` helpers. Replaces `lib/server/fundwise-mutations.ts` |
| `lib/server/solana-transfer-verification.ts`          | On-chain transfer verification; extended to verify N legs        |
| `components/wallet-provider.tsx`                      | Solana wallet adapter setup                                      |
| `components/solana-wallet-provider.tsx`               | Solana wallet context                                            |
| `app/page.tsx`                                        | Landing page                                                     |
| `app/groups/[id]/page.tsx`                            | Group dashboard                                                  |
| `app/groups/[id]/settlements/[settlementId]/page.tsx` | Settlement receipt view                                          |
| `app/skill.md/route.ts`                               | Agent Skill Endpoint — `https://fundwise.fun/skill.md`           |
| `services/fundy/`                                     | Fundy Telegram bot (separate repo per ADR-0022) — Railway, `grammy`, calls FundWise HTTP API |

**Module discipline (post-refactor, ADR-0035…0038):**

- Squads SDK use lives only inside `lib/squads/`. Don't import `@sqds/multisig` outside it.
- Fee math + ledger row shape lives only inside `lib/fees/`. Don't compute fees at callsites.
- Per-concept mutation imports: `import { addExpenseMutation } from "@/lib/server/mutations/expense"`. The barrel at `fundwise-mutations.ts` is transitional; gone after FW-072 PR3.
- API routes use `withAuthenticatedHandler` for wallet-session auth. Service routes keep `requireFundyServiceAuth`. Public routes stay raw.


---

## ADR Format

When creating a new ADR, follow this format (from the domain-model skill pattern):

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
```

That's it. Place in `docs/adr/NNNN-slug.md` with sequential numbering. Scan `docs/adr/` for the highest existing number and increment by one.

Only create an ADR when ALL THREE are true:

1. **Hard to reverse** — changing your mind later is costly
2. **Surprising without context** — a future reader will wonder "why?"
3. **Result of a real trade-off** — there were genuine alternatives

---

## Agent Coordination

This project uses multiple AI agents in parallel. Follow these conventions to avoid conflicts:

### Task ownership

- Only one agent modifies a given file at a time.
- Before editing, check if another agent has claimed the task (ask the owner).
- When starting a task, announce it: "I'm working on [file/feature]."

### Code style

- **TypeScript strict mode** — no `any` types unless explicitly justified with a comment.
- **Functional components** with named exports (not default exports).
- **Tailwind classes** for styling — no inline styles, no CSS modules.
- **shadcn/ui components** for UI primitives — don't rebuild what shadcn provides.
- **Conventional comments** — explain *why*, not *what*. Avoid obvious comments like "// Import the module".

### Commit messages (when the owner asks you to draft)

Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
feat(split): add expense entry modal with equal-split support
fix(wallet): handle rejected transaction signatures gracefully
chore(cleanup): remove prediction-market dependencies
docs(adr): add ADR-0009 for LI.FI SDK integration
```

### Testing expectations

- Test coverage is still light. Priority additions for the Summit Berlin launch and the phases after:
  - Balance computation and simplified settlement graph
  - SPL token transfer flow
  - Supabase read/write operations
  - LI.FI route discovery and execution
  - Scoped Agent Access capability grants, expiration, and revocation
  - Fundy Telegram auth flow (Telegram-to-wallet linking, one-account-one-wallet rule, DM authentication before group chat actions)
  - Agent Skill Endpoint response format and completeness

---

## Design Skills Reference

This project follows patterns from the [designskills](https://github.com/mattpocock/skills) collection. When applicable, use these approaches:

### Planning


| Skill                     | When to use                 | Key idea                                             |
| ------------------------- | --------------------------- | ---------------------------------------------------- |
| **to-prd**                | When scoping a new feature  | Synthesize conversation context into a PRD           |
| **to-issues**             | When breaking down a phase  | Split work into vertical-slice GitHub issues         |
| **grill-me**              | Before starting a phase     | Get relentlessly interviewed about the plan          |
| **design-an-interface**   | When designing a new module | Spawn 3+ parallel designs with different constraints |
| **request-refactor-plan** | Before a major refactor     | Create a detailed plan via user interview            |


### Development


| Skill                             | When to use                           | Key idea                                                  |
| --------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| **tdd**                           | When building durable features        | Red-green-refactor loop, one vertical slice at a time     |
| **triage-issue**                  | When investigating a bug              | Explore codebase, identify root cause, file GitHub issue  |
| **improve-codebase-architecture** | When the codebase gets messy          | Find shallow modules, deepen them, propose boundary tests |


### Domain modeling


| Skill                   | When to use             | Key idea                                                  |
| ----------------------- | ----------------------- | --------------------------------------------------------- |
| **domain-model**        | When terms are unclear  | Grilling session that sharpens CONTEXT.md and ADRs inline |
| **ubiquitous-language** | When the glossary grows | Extract DDD-style glossary from conversation              |


### How to use these skills in this project

1. **Before starting a new phase:** Read ROADMAP.md, then run a `grill-me` session on the phase's work items.
2. **When designing a new module** (e.g., LI.FI integration, Zerion agent): Use `design-an-interface` to generate 3+ interface options before coding.
3. **When terms are fuzzy:** Update CONTEXT.md immediately. Don't batch — capture terms as they crystallize.
4. **When breaking work into tasks:** Use `to-issues` to create vertical-slice GitHub issues from ROADMAP phases.
5. **When an architectural decision is needed:** Create an ADR in `docs/adr/`. Follow the 3-criterion test (hard to reverse, surprising, genuine trade-off).

---

## Roadmap notes

### Multi-chain (Summit launch scope) — Circle CCTP + LI.FI

- **Pulled into the Summit Berlin launch scope on 2026-05-16.** Integration is built (`lib/lifi-config.ts`, `lib/lifi-bridge.ts`, `components/cross-chain-bridge-modal.tsx`); remaining work is mainnet pipeline, CCTP routing config, UX branding, and end-to-end mainnet test.
- Inbound rail only: Members on EVM or other non-Solana wallets participate; all funds convert to **USDC on Solana** before touching the FundWise ledger.
- LI.FI SDK methods of interest: `getQuote()`, `executeRoute()`, `getContractCallsQuote()`.
- LI.FI route preferences: prefer Circle CCTP routes for USDC → USDC paths (cleanest story, native USDC, no slippage). Fallback to LI.FI's general router only when CCTP has no route for the chain/amount; surface in the UI which rail the active quote used.
- Settlement asset stays USDC on Solana; this is not a multi-ledger product.
- Surface as `Route funds for Settlement` and `Route funds for Contribution` inside the existing flows — not a standalone bridge dashboard.
- LI.FI docs: [https://docs.li.fi/](https://docs.li.fi/) · Circle CCTP docs: [https://developers.circle.com/stablecoins/docs/cctp-getting-started](https://developers.circle.com/stablecoins/docs/cctp-getting-started)

### Fiat onramp phase (later) — Privy + MoonPay + Bridge.xyz + Squads Protocol

- **Privy:** per-user embedded Solana wallet, non-custodial via TEE shards, silent provisioning on email / Apple / Google signup, invisible gas via Privy's native fee-payer.
- **MoonPay:** headless card top-up; Apple Pay; USDC-on-Solana straight to the Privy wallet.
- **Bridge.xyz:** SEPA / SEPA Instant / IBAN / wire → USDC-on-Solana to the Privy wallet. Stripe-owned; documented EUR IBAN issuance.
- **Squads Protocol:** already integrated; each Group is a Squads multisig holding USDC. Contributions flow from the user's Privy wallet → the Group's Squads multisig.
- **Altitude is ruled out** — it's Squads' own consumer-business neobank built on Squads API, not embeddable infra.
- Wallet provisioning via Privy is opt-in; self-custody via wallet-adapter remains the default for crypto-native users.
- Settles to USDC on Solana underneath; ledger model is unchanged.

### Wallet readiness — Zerion CLI

- Read-only wallet analysis; not a wallet connector.
- Uses `zerion-cli wallet analyze <address>` for wallet data.
- Auth: `ZERION_API_KEY` (free dev tier) preferred; optional x402 pay-per-call.
- Docs: [https://developers.zerion.io/build-with-ai/zerion-cli](https://developers.zerion.io/build-with-ai/zerion-cli)

### Fundy (separate repo per ADR-0022)

- Hosted Telegram bot that runs the FundWise Agent; command-first v1, LLM (e.g. OpenRouter) as a later layer on the same tools.
- **Railway** deployment; library **`grammy`**.
- Calls FundWise HTTP API routes with `FUNDWISE_SERVICE_API_KEY` Bearer + `X-Fundy-Wallet` (same API surface as the web app; extend routes for Scoped Agent Access).
- Users authenticate with web-generated short-lived codes in DM: `/link FW-…`.
- Read-only views (Balances, Expenses, Settlements, Receipts) and draft-safe actions (draft Expense, upload proof); Proposal approve/reject when database-only.
- On-chain Settlement, Contribution, and Proposal execution still require wallet confirmation in the web app — deep-link; use existing Settlement Request Links for settle intents.
- Zerion CLI from the bot: `/analyze`, `/readiness`, `/verify` — prefer `ZERION_API_KEY`; optional x402 on Solana later.
- One Telegram account maps to one active wallet at a time; one Telegram chat maps to one FundWise Group; DM auth before group actions.
- **Env (Fundy service):** `TELEGRAM_BOT_TOKEN`, `FUNDWISE_SERVICE_API_KEY`, `FUNDWISE_API_BASE_URL` (e.g. `https://fundwise.fun`), `ZERION_API_KEY` (and optionally `SOLANA_PRIVATE_KEY` + `ZERION_X402`), `OPENROUTER_API_KEY` (optional, later), `NEXT_PUBLIC_SOLANA_RPC_URL` if needed for direct reads.

### Agent Skill Endpoint

- Public URL: `https://fundwise.fun/skill.md` — `Content-Type: text/markdown`. Shipped.
- Any autonomous agent can `curl` it; documents purpose, what to call / what not to call, auth (profile agent tokens + optional wallet-signed), rate limits, errors, safety.
- Does not require authentication to fetch the document and does not expose private Member data in the skill file itself.

### Web app env

- `FUNDWISE_SERVICE_API_KEY` — shared secret validated on API routes for bot/service calls.
- `FUNDWISE_AGENT_TOKEN_SECRET` (or equivalent) — signing secret for scoped agent tokens issued from `/profile/agents` and optional wallet-signed agent auth.

### Key dates

| Date         | Event                                                |
| ------------ | ---------------------------------------------------- |
| 2026-06-13   | **Solana Summit Berlin — Split + Fund Mode launch** |
