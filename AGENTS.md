# AGENTS.md — Instructions for AI Agents

This file is the shared instruction set for all AI agents (Claude Codex, GLM, Cursor, etc.) working on FundWise. Read this file before making any changes to the codebase.

---

## Project Summary

**FundWise** is Splitwise on Solana — a two-mode consumer expense app:

1. **Split Mode** (MVP): Track expenses, compute who owes whom, and settle exact USDC amounts on Solana.
2. **Fund Mode** (Phase 2): Pool stablecoins into a shared treasury with proposal-based spending.

**Hackathon context:** We are submitting to the Colosseum Frontier hackathon (deadline May 11, 2026) with active sponsor focus on Visa Frontier, LI.FI, and Zerion CLI. See [HACKATHON_PLAN.md](./HACKATHON_PLAN.md) for full strategy.

---

## Reading Order

Every agent must read these files before touching code:

1. **[README.md](./README.md)** — project overview plus documentation map.
2. **[STATUS.md](./STATUS.md)** — what's live, what's next, and the currently locked product decisions.
3. **[CONTEXT.md](./CONTEXT.md)** — domain language, relationships, and product invariants. Use these terms in code, comments, and commit messages. Do not invent new terms.
4. **[PRD.md](./PRD.md)** — MVP scope, user stories, implementation decisions, and out-of-scope boundaries.
5. **[ROADMAP.md](./ROADMAP.md)** — phased delivery plan.
6. **[HACKATHON_PLAN.md](./HACKATHON_PLAN.md)** — judge-facing story and sponsor framing.
7. **[docs/adr/](./docs/adr/)** — architecture decisions. Check these before making architectural choices. A new ADR is needed when a decision is hard to reverse, surprising without context, and the result of a genuine trade-off.

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
├── HACKATHON_PLAN.md       ← Hackathon track strategy
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


| File                                    | Purpose                                               |
| --------------------------------------- | ----------------------------------------------------- |
| `lib/db.ts`                             | Group, Expense, Settlement, and Contribution CRUD     |
| `lib/expense-engine.ts`                 | Split math, balances, settlement graph, settlement UX |
| `lib/simple-payment.ts`                 | SPL transfer implementation                           |
| `lib/supabase.ts`                       | Supabase client configuration                         |
| `lib/squads-multisig.ts`                | Squads multisig for Fund Mode treasury                |
| `lib/lifi-bridge.ts`                    | LI.FI route and execution helpers                     |
| `components/wallet-provider.tsx`        | Solana wallet adapter setup                           |
| `components/solana-wallet-provider.tsx` | Solana wallet context                                 |
| `app/page.tsx`                          | Landing page                                          |
| `app/groups/[id]/page.tsx`              | Group dashboard                                       |
| `app/groups/[id]/settlements/[settlementId]/page.tsx` | Settlement receipt view                    |
| `app/skill.md/route.ts`                | Agent Skill Endpoint (planned) — `https://fundwise.kairen.xyz/skill.md` |
| `services/fundy/`                     | Fundy Telegram bot (planned) — Railway, `grammy`, calls FundWise HTTP API |
| `lib/server/` (extend)                  | Scoped Agent Access + bot auth validation (planned)   |


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

- No tests yet (hackathon MVP). After hackathon, add tests for:
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
| **tdd**                           | When building features post-hackathon | Red-green-refactor loop, one vertical slice at a time     |
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

## Hackathon-Specific Notes

### LI.FI Integration (Track 1 — P1)

- Install `@lifi/sdk` as a dependency
- Key methods: `getQuote()`, `executeRoute()`, `getContractCallsQuote()`
- Primary integration point: top-up or recovery into Solana USDC, then return to the normal Group Settlement flow
- Secondary integration point: Fund Mode Contributions if time allows
- Must support at least 2 chains (Ethereum + Solana or Base + Solana)
- Docs: [https://docs.li.fi/](https://docs.li.fi/)

### Visa Frontier (Track 2 — P1)

- No extra code needed — core payment flows ARE the submission
- Focus on UX polish: receipt views, settlement speed, mobile clarity, and USDC payment simplicity
- Emphasize: one-click settlements, instant finality, consumer payments use case

### Zerion CLI Agent (Track 3 — active sponsor track)

- Install `zerion-cli` globally
- Build a wallet-intelligence layer or background agent that analyzes wallets and suggests next actions without disrupting the primary Split Mode settlement flow
- Uses `zerion-cli wallet analyze <address>` for wallet data
- Can use x402 pay-per-call (no API key needed)
- Docs: [https://developers.zerion.io/build-with-ai/zerion-cli](https://developers.zerion.io/build-with-ai/zerion-cli)

### Fundy (Planned — Post-Hackathon)

- Hosted Telegram bot that runs the FundWise Agent; **command-first v1**, **LLM** (e.g. OpenRouter) as a later layer on the same tools
- **Railway** deployment; code in **`services/fundy/`**; library **`grammy`**
- Calls FundWise **HTTP API routes** with **`FUNDWISE_SERVICE_API_KEY`** + **`X-Fundy-Wallet`** (same API surface as the web app; extend routes for Scoped Agent Access)
- Users authenticate with **web-generated short-lived codes** in DM: `/link FW-…`
- Read-only views (Balances, Expenses, Settlements, Receipts) and draft-safe actions (draft Expense, upload proof); **Proposal approve/reject** when **database-only**
- **On-chain** Settlement, Contribution, and Proposal **execution** still require wallet confirmation in the app — deep-link; use existing **Settlement Request Links** for settle intents
- **Zerion CLI** from the bot: `/analyze`, `/readiness`, `/verify` — prefer **`ZERION_API_KEY`**; optional **x402** on Solana later
- One Telegram account maps to one active wallet at a time; one Telegram chat maps to one FundWise Group; DM auth before group actions
- **Env (Fundy service):** `TELEGRAM_BOT_TOKEN`, `FUNDWISE_SERVICE_API_KEY`, `FUNDWISE_API_BASE_URL` (e.g. `https://fundwise.kairen.xyz`), `ZERION_API_KEY` (and optionally `SOLANA_PRIVATE_KEY` + `ZERION_X402`), `OPENROUTER_API_KEY` (optional, later), `NEXT_PUBLIC_SOLANA_RPC_URL` if needed for direct reads

### Agent Skill Endpoint (Planned — Post-Hackathon)

- Public URL: **`https://fundwise.kairen.xyz/skill.md`** — `Content-Type: text/markdown`
- Any autonomous agent can `curl` it; document **purpose**, **what to call / what not to call**, auth (**profile agent tokens** + optional wallet-signed), rate limits, errors, safety
- Does not require authentication to fetch the document and does not expose private Member data in the skill file itself
- Implementation: `app/skill.md/route.ts` (planned)

### Web app env (planned additions for agents + Fundy)

- `FUNDWISE_SERVICE_API_KEY` — shared secret validated on API routes for bot/service calls
- `FUNDWISE_AGENT_TOKEN_SECRET` (or equivalent) — signing secret for scoped agent tokens issued from `/profile/agents` and optional wallet-signed agent auth

### Key deadlines


| Date         | Event                                    |
| ------------ | ---------------------------------------- |
| May 11, 2026 | Colosseum Frontier submission deadline   |
| May 12, 2026 | Demo Day (Superteam Germany)             |
| May 26, 2026 | LI.FI / Zerion track winner announcement |
| May 27, 2026 | Visa track winner announcement           |
