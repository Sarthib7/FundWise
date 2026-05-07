# Move Fundy to a separate repository

Fundy will live in its own repository as a sibling product to FundWise, not in `services/fundy/` inside this repo. Fundy calls FundWise over public HTTP APIs and the Agent Skill Endpoint, never reaching into the FundWise database directly. This is hard to reverse once the second repo exists and would surprise contributors because ADR-0018 (Q12) previously specified a monorepo.

## Decisions

### Separate repository, not a monorepo subdirectory

- Fundy ships from its own git repository on its own deploy lifecycle.
- Fundy depends on FundWise only through stable public surfaces:
  - The **Agent Skill Endpoint** (`/skill.md`) for capability discovery.
  - **Scoped Agent Access tokens** or service-to-service auth for API calls.
  - **Settlement Request Links** and other existing deep links for on-chain handoffs.
- Fundy does **not** import FundWise TypeScript types, Supabase types, or domain types directly. Shared shapes are re-derived from the API contract or from a small published schema, not from a shared workspace.

### Stack

- **PI agent framework** for the agent loop (founder's stated framework choice; exact name confirmed when scaffolding the Fundy repo).
- **Zerion CLI** as the wallet-intelligence and analytics tool, exposed behind `/analyze`, `/readiness`, `/verify`.
- **Railway** hosting with `grammy` for the Telegram interface; command-first v1, LLM layer (e.g. OpenRouter) added later.

### Trust boundary

- Money-moving actions (settle, contribute, execute proposal) deep-link back to the FundWise web app for wallet confirmation.
- DB-only Proposal approve / reject can stay inside Telegram.
- Fundy authenticates each Telegram user with a web-generated link code (existing flow from ADR-0018 unchanged).

## Why this matters

- Keeps the FundWise web app focused on the open consumer product. Agent runtime concerns, Zerion CLI deps, and Telegram-specific schema do not bleed into the web app's deploy.
- Lets Fundy iterate on agent framework choices, LLM providers, and Zerion features without dragging the web app through the same release.
- Forces the Agent Skill Endpoint and Scoped Agent Access API to be real contracts, not internal calls — which is exactly what we want for any future external agent.

## Supersedes / amends

- **Supersedes ADR-0018 Q12** ("Repo structure: monorepo, Fundy lives in `services/fundy/` inside the FundWise repo"). All other decisions in ADR-0018 (linking flow, command set, hosting on Railway, library choice, Zerion commands, group-chat DM auth, deep links) remain in effect.
- Amends `ROADMAP.md`: any reference to `services/fundy/` is superseded by the separate-repo plan.

## What this repo still owes Fundy

- The **Agent Skill Endpoint** (`/skill.md`) at `https://fundwise.fun/skill.md`.
- The **Scoped Agent Access API** with capability grants scoped to Member wallet, Group, and action type, with expiration and revocation.
- Backend schema additions before Fundy can ship: Telegram-to-wallet links, agent-access grants, Proposal comments, proof attachments / links, Proposal edit history, agent capability grants.
