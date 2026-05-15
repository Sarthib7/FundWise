# Fund Mode — Devnet Beta Checklist

**Owner:** sarthib7
**Target:** Easy-UX pooled treasury beta on devnet, used to test the monetization model before any mainnet move
**Strategy:** Fund Mode stays devnet-only and invite-gated. Hidden from public UI. Selected beta users are coordinated in a Telegram group. Mainnet graduation is a separate decision after the beta is stable and the monetization model is validated.
**Last updated:** 2026-05-13

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
- ✅ Pool creation templates shipped (Trip pool, Friend fund, DAO grant, Family budget) with `lib/fund-mode-templates.ts`
- ✅ Telegram beta channel onboarding link shipped to Fund Mode creation dialog and dashboard
- ✅ Treasury overview card shipped: balance, funding progress, pending Proposal summary, top contributors, and recent activity
- ❌ No auto-suggested reimbursement proposals from expenses
- ❌ No member roles — every Member can do everything Squads allows
- ❌ No exit / refund flow when a Member leaves
- ❌ No creation fee infrastructure
- ❌ No Telegram beta channel onboarding link from the app → **now shipped (FW-048)**

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
| FW-042 | Pool templates at Group creation (`Trip pool`, `Friend fund`, `DAO grant`, `Family budget`) — each sets default threshold suggestion, default proposal memos, default member-role expectations | First-time UX cliff; users don't know what threshold means | **Done** |
| FW-043 | Treasury overview card on Group dashboard — available balance, pending proposal count, last 5 events, top contributors. One screen, no drilling | Currently users must scroll the activity feed to understand pool state | **Done** |
| FW-044 | Auto-suggested reimbursement proposals — when a Member logs an expense flagged "from pool", the dashboard surfaces a one-click "Propose reimbursement for $X" with memo pre-filled | Biggest UX win; closes the Split-Mode-style "log → reconcile" loop for pools | New |
| FW-045 | Member roles (light): Admin / Member / Viewer. Admin can change threshold + invite. Member can propose / approve / execute. Viewer is read-only. Stored in FundWise (not Squads — Squads stays the on-chain authority) | Squads roles are too low-level for non-crypto users | New |
| FW-046 | Exit flow: an explicit "return funds to leaving Member" proposal type with one-click action. Calculates the Member's pro-rata share or accepts a custom amount, then runs the normal approval lifecycle | Without this, leaving a pool feels stuck | New |
| FW-057 | Threshold suggestions at Treasury init: 2 members → 2/2, 3-5 → majority, 6+ → 1/2 + 1. Show "what this means" tooltip | Members don't know what threshold to pick | Ready |

**Code locations expected to change:**
- `components/create-group-dialog.tsx` (templates) ✅ done
- `components/group-dashboard/*` (treasury overview, auto-proposals)
- `hooks/use-group-dashboard.ts`
- `lib/server/fundwise-mutations.ts` (role enforcement, exit proposal type)
- `lib/squads-multisig.ts` (threshold suggestions surface)
- `lib/fund-mode-templates.ts` ✅ shipped

Out of scope for first beta:
- Native chat (use Telegram group)
- Recurring contributions (wallet-adapter limits)
- Multi-currency display
- Yield routing (Meteora is a Phase 4+ item, see `docs/monetization.md`)

---

## Phase B — Multisig UX polish

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-058 | Pre-Treasury checklist UI: "you'll need ~0.05 SOL for multisig creation rent" — surface real-time Squads creation cost from devnet RPC | Users hit confusing "insufficient SOL" mid-flow | Ready |
| FW-059 | Squads explorer link on Treasury card (deep-link to Squads UI in a new tab) | Power users want to verify state outside FundWise | Ready |
| FW-060 | Threshold-change proposal type (Admin role can propose; standard approval lifecycle) | Pools grow/shrink; threshold should follow | Ready |

---

## Phase C — Monetization model testing (the point of beta)

> **2026-05-16 update:** monetization model pivoted from subscription to take-rate ([ADR-0032](./adr/0032-fund-mode-take-rate-monetization.md)). The WTP-survey items below are stale — beta now measures **fee acceptance and abandonment** under real take-rates instead of subscription-banner thumbs-up. Plumbing in FW-066…FW-070 must land before this phase can run for real. The old line items are kept for historical context.

Goal: validate Fund Mode pricing on devnet (and the Summit invite cohort on mainnet) with the locked fee structure — $5 Creation Fee, 0.5% Contribution Fee, 0.5% Reimbursement Fee, 25 bps Routing Fee. Operator-tunable rates via env. Real fees collected on mainnet for the invited cohort; no subscription, no banner surveys.

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-047 / FW-069 | Creation Fee infrastructure: at Treasury init, prompt for $5 USDC (cluster-aware) sent to Platform Fee Wallet via on-chain transfer. Devnet "skip for beta" only; mainnet has no skip. FW-047 server scaffold exists; FW-069 wires to ADR-0032 take-rate plumbing | Tests whether users complete Treasury init under a real fee | Ready (decision-locked) |
| FW-066 | Platform Fee Wallet env + `platform_fee_ledger` Supabase table | Foundation for all take-rate fees — every fee surface depends on this | Ready |
| FW-067 | Buyer-pays Contribution Fee (0.5%) — single Member-signed tx, two transfers, atomic | Tests willingness to fund Treasuries when 0.5% is added on top | Ready |
| FW-068 | Buyer-pays Reimbursement Fee (0.5%) — Squads vault tx with two transfers in TransactionMessage | Hardest piece; on-chain governance accommodation | Ready |
| FW-070 | Routing Fee (25 bps) on CCTP/LI.FI inbound | Tests cross-chain inbound friction | Ready |
| ~~FW-061~~ | ~~Monthly fee emulation banner~~ | **Superseded** — no subscription in the new take-rate model ([ADR-0032](./adr/0032-fund-mode-take-rate-monetization.md)) | Dropped |
| ~~FW-062~~ | ~~Free-tier wall emulation~~ | **Superseded** — free tier is now "for everyone"; no wall. Pro tier with perks is a post-Summit decision | Dropped |
| FW-063 | Beta exit survey: when a Member leaves a pool, ask 3 questions about fee fairness, feature requests, and would-stay confidence (1-5). Anonymized | Cheapest signal we'll ever get; reframe questions around the take-rate model |

**Output of monetization beta:** a decision doc (`docs/monetization-beta-findings.md`) updating `docs/monetization.md` with real numbers before any mainnet pricing decision.

---

## Phase D — Beta program ops

| ID | Task | Why | Status |
| --- | --- | --- | --- |
| FW-048 | Telegram beta channel onboarding — Fund Mode entry page has a "Join beta Telegram" link to `t.me/funddotsol` (later: a private invite-only channel) | Coordination + support | **Done** |
| FW-064 | Beta admin dashboard (internal) — list of active beta pools, contribution counts, proposal counts, last activity, willingness-to-pay responses | Without this, the owner has no way to see beta health |
| FW-065 | Weekly beta digest email/Telegram post (manual, owner-sent): top pools, biggest reimbursements, common feedback | Keeps beta cohort engaged |

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
