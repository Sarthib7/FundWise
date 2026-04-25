# FundWise — Decisions Log

> **Superseded by [docs/adr/](./docs/adr/).**
>
> This file is kept for historical reference. New architecture decisions are recorded as individual ADR files in `docs/adr/` using the format described in the domain-model skill.
>
> Existing ADRs have been migrated:
>
> - ADR-001 → [0001-pivot-from-fund-flow-to-fundwise.md](./docs/adr/0001-pivot-from-fund-flow-to-fundwise.md)
> - ADR-002 → [0002-stablecoins-only-for-balances.md](./docs/adr/0002-stablecoins-only-for-balances.md)
> - ADR-003 → [0003-off-chain-metadata-on-chain-money.md](./docs/adr/0003-off-chain-metadata-on-chain-money.md)
> - ADR-004 → [0004-drop-hackathon-dependencies.md](./docs/adr/0004-drop-hackathon-dependencies.md)
> - ADR-005 → [0005-squads-multisig-for-fund-mode.md](./docs/adr/0005-squads-multisig-for-fund-mode.md)
> - ADR-006 → [0006-wallet-only-auth.md](./docs/adr/0006-wallet-only-auth.md)
> - ADR-007 → [0007-rename-circles-to-groups.md](./docs/adr/0007-rename-circles-to-groups.md)
> - ADR-008 → [0008-keep-nextjs-shadcn-stack.md](./docs/adr/0008-keep-nextjs-shadcn-stack.md)

---

## Legacy content (frozen)

Click to expand legacy ADR log

### ADR-001 — Pivot from Fund Flow (prediction market) to FundWise (Splitwise on Solana)

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Project began as a hackathon prediction-market + group fundraising app with Kalshi integration, ZK compression, and Meteora LP yield. Hackathon is over; owner wants a product with clearer user value and a day-one audience.

**Decision:** Pivot to a two-mode consumer expense app:

- Split Mode (Splitwise-on-Solana) — MVP priority.
- Fund Mode (shared treasury with proposals) — phase 2.

**Consequences:**

- All prediction-market / Kalshi / LP-yield code is removed.
- UI, landing page, and copy are rebuilt around expense-splitting.
- Brand stays "FundWise" to cover both modes.

---

### ADR-002 — Stablecoins only for balances; SOL only for gas

**Date:** 2026-04-21
**Status:** Accepted

**Context:** Splitwise-like apps need unit-of-account stability. SOL price volatility makes it unusable for "you owe $14.50."

**Decision:** Every group picks a single SPL stablecoin mint at creation. All balances, expenses, and settlements use that mint. USDC is the default.

**Consequences:**

- No FX / price-oracle code in MVP.
- A group can't mix mints — simplifies math and UX.

---

### ADR-003 — Off-chain group metadata, on-chain money movement

**Date:** 2026-04-21
**Status:** Accepted

**Decision:** Split the state:

- **Off-chain** (Firebase Realtime DB): group name, members, expense line items, split config.
- **On-chain**: SPL token transfers for settlements and fund contributions.

**Consequences:**

- Don't need a custom Anchor program for Split Mode.
- Firebase is a single point of trust for who-owes-whom until settled.

---

### ADR-004 — Drop ZK compression, Meteora/Raydium, Kalshi, Light Protocol

**Date:** 2026-04-21
**Status:** Accepted

**Decision:** Remove all hackathon-only features and unused dependencies.

**Consequences:**

- Leaner bundle, faster builds, fewer auth paths.

---

### ADR-005 — Reuse Squads multisig for Fund Mode treasury (phase 2)

**Date:** 2026-04-21
**Status:** Tentative (revisit before Fund Mode implementation)

**Decision:** Start with Squads. Evaluate UX friction for non-technical users.

---

### ADR-006 — Wallet-only auth; no email/password, no Firebase Auth

**Date:** 2026-04-21
**Status:** Accepted

**Decision:** Identity = connected Solana wallet. Display names are user-chosen labels.

---

### ADR-007 — Rename "circles" → "groups" in UI and code

**Date:** 2026-04-21
**Status:** Proposed

**Decision:** Rename on next UI pass. URL routes: `/circles` → `/groups`.

---

### ADR-008 — Keep Next.js + shadcn/ui + wallet-adapter stack

**Date:** 2026-04-21
**Status:** Accepted

**Decision:** Keep inherited stack. Focus energy on product logic.