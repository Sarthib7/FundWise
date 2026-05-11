# Fund Mode — Devnet Beta Checklist

**Owner:** sarthib7
**Target:** Easy-UX pooled treasury beta on devnet, used to test the monetization model before any mainnet move
**Strategy:** Fund Mode stays devnet-only and invite-gated. Hidden from public UI. Selected beta users are coordinated in a Telegram group. Mainnet graduation is a separate decision after the beta is stable and the monetization model is validated.
**Last updated:** 2026-05-11

This is the execution checklist for the Fund Mode beta program. Companion to `docs/fund-mode-beta-rehearsal.md` (which covers the scripted rehearsal flow) and `docs/split-mode-mainnet-checklist.md` (which covers the public mainnet path).

---

## Current state

- ✅ Fund Mode lifecycle works end-to-end on devnet (Treasury → Contribution → Proposal → Approval → Execution)
- ✅ Full devnet rehearsal passed 2026-05-10 (Group `9c0f9012`, Proposal `c14d795c`, real Squads v4 execution)
- ✅ Squads v4 Treasury initialization, on-chain proof, vault PDA derivation, Member verification
- ✅ Squads-anchored approval/rejection lifecycle
- ✅ Squads-executed reimbursement with Treasury → Member transfer verification
- ✅ Proof links, Proposal-scoped comments, edit history
- ✅ LI.FI `Route funds for Contribution`
- ✅ Zerion readiness for `contribution`, `proposal-member`, `treasury` modes
- 🔒 Invite-gated via `FUNDWISE_FUND_MODE_INVITE_WALLETS` env var
- ❌ Pool creation UX is bare: no templates, no threshold suggestions, no member-role hints
- ❌ No treasury overview card — beta users have to scroll/hunt to understand pool state
- ❌ No auto-suggested reimbursement proposals from expenses
- ❌ No member roles — every Member can do everything Squads allows
- ❌ No exit / refund flow when a Member leaves
- ❌ No creation fee infrastructure
- ❌ No Telegram beta channel onboarding link from the app

---

## Beta access (operations)

| Task | Status |
| --- | --- |
| Maintain `FUNDWISE_FUND_MODE_INVITE_WALLETS` env var with current beta wallets | Ongoing |
| Telegram beta channel (closed) for support, feedback, monetization test discussion | Ready to create |
| Beta intake form / DM flow: Telegram handle, wallet address, what they want to pool | Ready to design |
| Beta agreement (lightweight, not lawyer-reviewed): "this is devnet, no real money, your test results inform pricing" | Ready to draft |
| Monthly cadence: 1:1 feedback call with active beta groups | Ongoing |

---

## Phase A — Easy UX pool management

Goal: a user who's never used a multisig should be able to spin up a working pool in under 90 seconds and understand what's happening.

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-042 | Pool templates at Group creation (`Trip pool`, `Friend fund`, `DAO grant`, `Family budget`) — each sets default threshold suggestion, default proposal memos, default member-role expectations | First-time UX cliff; users don't know what threshold means | New |
| FW-043 | Treasury overview card on Group dashboard — available balance, pending proposal count, last 5 events, top contributors. One screen, no drilling | Currently users must scroll the activity feed to understand pool state | New |
| FW-044 | Auto-suggested reimbursement proposals — when a Member logs an expense flagged "from pool", the dashboard surfaces a one-click "Propose reimbursement for $X" with memo pre-filled | Biggest UX win; closes the Split-Mode-style "log → reconcile" loop for pools | New |
| FW-045 | Member roles (light): Admin / Member / Viewer. Admin can change threshold + invite. Member can propose / approve / execute. Viewer is read-only. Stored in FundWise (not Squads — Squads stays the on-chain authority) | Squads roles are too low-level for non-crypto users | New |
| FW-046 | Exit flow: an explicit "return funds to leaving Member" proposal type with one-click action. Calculates the Member's pro-rata share or accepts a custom amount, then runs the normal approval lifecycle | Without this, leaving a pool feels stuck | New |
| FW-049 | Threshold suggestions at Treasury init: 2 members → 2/2, 3-5 → majority, 6+ → 1/2 + 1. Show "what this means" tooltip | Members don't know what threshold to pick | New |

**Code locations expected to change:**
- `components/create-group-dialog.tsx` (templates)
- `components/group-dashboard/*` (treasury overview, auto-proposals)
- `hooks/use-group-dashboard.ts`
- `lib/server/fundwise-mutations.ts` (role enforcement, exit proposal type)
- `lib/squads-multisig.ts` (threshold suggestions surface)
- New: `lib/fund-mode-templates.ts`

Out of scope for first beta:
- Native chat (use Telegram group)
- Recurring contributions (wallet-adapter limits)
- Multi-currency display
- Yield routing (Meteora is a Phase 4+ item, see `docs/monetization.md`)

---

## Phase B — Multisig UX polish

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-050 | Pre-Treasury checklist UI: "you'll need ~0.05 SOL for multisig creation rent" — surface real-time Squads creation cost from devnet RPC | Users hit confusing "insufficient SOL" mid-flow | New |
| FW-051 | Squads explorer link on Treasury card (deep-link to Squads UI in a new tab) | Power users want to verify state outside FundWise | New |
| FW-052 | Threshold-change proposal type (Admin role can propose; standard approval lifecycle) | Pools grow/shrink; threshold should follow | New |

---

## Phase C — Monetization model testing (the point of beta)

Goal: validate Fund Mode pricing on devnet with test USDC + test SOL before any mainnet move. No real money changes hands; this is **behavioral telemetry** plus willingness-to-pay signals.

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-047 | Creation fee infrastructure: at Treasury init, prompt for a fixed creation fee (devnet test-USDC) sent to a FundWise dev wallet. Show what the equivalent mainnet fee would be ($3-$5 USD). Allow opt-out with a one-click "skip for beta" but record the choice | Tests whether users will pay a setup fee at the high-intent moment | New |
| FW-053 | Monthly fee emulation: at Treasury init + on day 30 of pool age, show a non-blocking banner: "If this were mainnet, this pool would be $12/mo. Would you pay?" with thumbs up/down + optional comment. Stores response | Tests willingness-to-pay for subscription tier without actually billing |
| FW-054 | Free-tier limits emulation: cap free pools at 5 members + $1k AUM (simulated, since devnet has no real value); when capped, show "upgrade required" with mock checkout flow. Track conversion intent | Tests where the free-tier wall hurts vs. helps |
| FW-055 | Beta exit survey: when a Member leaves a pool, ask 3 questions: pricing fairness, feature requests, would-pay confidence (1-5). Anonymized | Cheapest signal we'll ever get |

**Output of monetization beta:** a decision doc (`docs/monetization-beta-findings.md`) updating `docs/monetization.md` with real numbers before any mainnet pricing decision.

---

## Phase D — Beta program ops

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-048 | Telegram beta channel onboarding — Fund Mode entry page has a "Join beta Telegram" link to `t.me/funddotsol` (later: a private invite-only channel) | Coordination + support |
| FW-056 | Beta admin dashboard (internal) — list of active beta pools, contribution counts, proposal counts, last activity, willingness-to-pay responses | Without this, the owner has no way to see beta health |
| FW-057 | Weekly beta digest email/Telegram post (manual, owner-sent): top pools, biggest reimbursements, common feedback | Keeps beta cohort engaged |

---

## Success metrics for the beta

The beta is "working" if all of these are true after 30 days:

- 10+ active pools (1+ proposal in the last 14 days)
- 70%+ Treasury init success rate (no abandoned half-init flows)
- 50%+ of pools have >=1 reimbursement executed
- Willingness-to-pay survey: at least 30% say "yes" to $12/mo subscription
- Zero P0/P1 bugs that required pool data wipes
- At least 3 written feedback notes (Telegram or DM) describing real use cases

---

## Mainnet graduation criteria (when does Fund Mode move to mainnet?)

Fund Mode moves to mainnet **only after** all of these are true:

1. Split Mode has been on mainnet ≥30 days with no P0/P1 incidents
2. Beta success metrics above are met
3. Monetization model is locked (creation fee + subscription tiers, written into `docs/monetization.md`)
4. Squads v4 mainnet program config treasury verified (see notes in `docs/fund-mode-beta-rehearsal.md`)
5. Lawyer-reviewed legal pages live (deferred for now; revisit when revenue justifies)
6. At least 5 beta pools willing to graduate to mainnet with real USDC
7. Cluster-aware mint + RPC config (FW-033, FW-035) reused for Fund Mode mainnet without code changes

Until then: Fund Mode = devnet beta, invite-only, hidden from public UI.

---

## Rollback plan

Worst case in beta: a bug corrupts pool state.

- **Devnet has no real money**, so impact is reputational, not financial.
- Recovery: pause new Treasury creation via env flag, fix the bug, replay rehearsal, ship hotfix, message beta group in Telegram, refund affected users with a free month of (future) mainnet subscription as goodwill.
- Document the incident in `docs/incident-log.md` (new) and link from STATUS.md.

---

## Definition of done (for the beta phase, not for mainnet)

The Fund Mode beta has "delivered its job" when:

1. All Phase A-D items above are ✅
2. `docs/monetization-beta-findings.md` exists with concrete pricing recommendations
3. STATUS.md says "Fund Mode mainnet graduation Ready (or Not Ready) with reasons"
4. The next sprint can pick up Fund Mode mainnet work from a clear plan
