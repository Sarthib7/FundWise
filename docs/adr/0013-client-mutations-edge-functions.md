
---
title: ADR-013 — Client Mutation Migration to Edge Functions
status: DECIDED
decidedOn: 2026-04-26
authors: [fundwise-team, hermes-agent]
category: backend
---

## Problem

Client-side direct Supabase table writes bypass server-side trust controls:

- No request validation (input sanitization, authz checks)
- No audit logging
- No rate limiting
- Cannot enforce business rules (e.g., expense owner validation, balance updates)
- Mainnet-beta cannot ship with public client writes

## Decision

Migrate all client mutations to Supabase Edge Functions:

| Client operation | Edge Function route | Authorization |
|---|---|---|
| `addExpense` | `POST /api/functions/v1/expense` | `supabase-js` with JWT, `requesting_member_id` from token |
| `updateExpense` | `POST /api/functions/v1/expense/update` | Expense creator ownership check |
| `deleteExpense` | `POST /api/functions/v1/expense/delete` | Expense creator ownership check |
| `addSettlement` | `POST /api/functions/v1/settlement` | Member in group; negative balance check |
| `addContribution` (Fund Mode) | `POST /api/functions/v1/contribution` | Member in group; treasury vault validation |
| `updateDisplayName` | `POST /api/functions/v1/profile/name` | Authenticated member scope |

All Edge Functions:
1. Verify `request.jwt.claims.sub` matches `member_id`
2. Validate input shapes with Zod schemas
3. Enforce business rules in PL/pgSQL or TS
4. Write audit log rows to `audit_log` with `event_type`, `actor_member_id`, `resource_id`, `before`, `after`
5. Return sanitized resource representation

Client migration order:
1. `updateDisplayName` (simplest, no multi-table transaction)
2. `addExpense` → `updateExpense` → `deleteExpense` (expense life cycle)
3. `addContribution` (Fund Mode, after Treasury flow review)
4. `addSettlement` (last — requires on-chain verification integration)

## Consequences

- Server-side mutating logic is now the single source of truth
- RLS remains as defense-in-depth; Edge Functions run with service role, bypass RLS intentionally
- Client code switches from `supabase.from('expenses').insert()` to `supabase.functions.invoke('expense', {...})`
- Network latency increases slightly (Edge Function cold starts ~50–150ms)
- All mutations are now auditable and replayable via `audit_log`

---

## Rationale Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| Keep client writes + RLS only | Fast, simple initially | No audit trail; hard to enforce complex rules; mainnet risk |
| REST API on Vercel/railway | Full control | Extra infra cost; duplicate Supabase auth plumbing |
| **Edge Functions** (chosen) | Zero extra infra; Supabase auth built-in; cheap; easy audit | Cold starts; 10s timeout limit (acceptable) |

---

## Implementation Checklist

- [ ] Zod schema per mutation (input validation)
- [ ] PL/pgSQL for atomic multi-table updates (group_balance adjustments)
- [ ] Audit log entry creation
- [ ] Error mapping → HTTP 4xx with structured error codes
- [ ] Client refactor: replace table mutations with `functions.invoke`
- [ ] Test suite: unit tests for each EF + integration tests against local Supabase

