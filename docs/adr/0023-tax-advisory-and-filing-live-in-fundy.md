# Tax advisory and tax filing live in Fundy, not the FundWise web app

Tax advisory and assisted tax filing are explicitly Fundy's responsibility (see ADR-0022), not features of the FundWise web app. We chose this because tax surfaces are agent-friendly (jurisdiction-aware reasoning over wallet history), they evolve faster than the FundWise core, and they need wallet intelligence (Zerion CLI) that already lives inside Fundy.

## Decisions

### Tax surfaces are Fundy-owned

- **Tax advisory** (year-to-date taxable events, simple optimization prompts, jurisdiction-aware guidance) ships first inside Fundy, not as a tab in the FundWise web app.
- **Assisted tax filing** is the long-arc surface inside Fundy and grows as wallet-data coverage and partner integrations mature.
- The FundWise web app exposes the data Fundy needs (Group expenses, settlements, contributions, proofs) through existing APIs; it does not render tax UI of its own.

### What stays in the FundWise web app

- The ledger of record: Expenses, Settlements, Contributions, Receipts, Exchange Rate Snapshots (ADR-0017).
- Receipt links Fundy can deep-link to when generating tax summaries.

### What does not happen in this repo

- No `app/tax/` route.
- No tax form generation, jurisdictional rule engine, or filing-partner integration in this codebase.
- No tax-specific Supabase tables beyond the ledger that already exists.

## Why this matters

- Keeps the FundWise web app focused on Split Mode + Fund Mode core flows.
- Puts tax features next to the Zerion CLI integration that already lives in Fundy, where the wallet-history reasoning happens.
- Lets tax surfaces iterate (LLM prompts, jurisdiction support, filing partners) without churning the web app's deploy.

## Cross-references

- ADR-0022 — Fundy lives in a separate repository.
- ADR-0017 — Source Currency + Exchange Rate Snapshot pattern (relevant ledger inputs for tax math).
- `ROADMAP.md` Phase 4 — Fundy companion agent.
