# ADR-0001: Display Group Total Settled Volume in Header

**Status:** Accepted  
**Date:** 2026-04-26  
**Authors:** Hermes (zoro-jiro-san)  
**Reviewers:** Sarthi Borkar  
**Affected files:** `app/groups/[id]/page.tsx`, `lib/db.ts` (read only)

---

## Context

In Split Mode, users need visibility into the total value that has already been settled within a group. Currently, the group page shows:
- Group name and code
- Member count
- Token/mint info
- Balances card (net per member)
- Activity feed (expenses + settlements)

But the **aggregate settled volume** — the sum of all on-chain USDC transfers that have resolved debts in this group — is not surfaced. This makes it hard to gauge the "health" or maturity of the group at a glance.

---

## Decision

Add a computed stat `totalSettledVolume` to the group page header, displayed inline with the member count.

**Implementation details:**
- Compute on client: sum of all `settlement.amount` values from the already-fetched `activity` feed
- Show only in Split Mode (not Fund Mode, which has no settlements)
- Format: `{icon} {amount} {token} settled` using existing `formatTokenAmount` helper
- Hidden when volume is zero
- Uses lucide `Receipt` icon for visual branding

**Code location:** `app/groups/[id]/page.tsx`, inside the group header JSX alongside member count display.

---

## Consequences

### Positive
- Users can instantly see how much USDC has already been settled in the group
- Reinforces the core Split Mode value proposition: track → compute → settle
- One-line addition; no new API calls or database queries
- Dervied from existing `getActivityFeed()` data → zero performance cost

### Negative
- Visual clutter in the group header; limited horizontal space on mobile
- Amount is displayed in token's smallest unit (raw bigint) — already handled by `formatTokenAmount`
- No link to settlement history (could be added later)

### Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Show settled volume in a separate stats card below header | More vertical space; header inline is sufficient |
| Compute on server via database view | Not needed — activity feed already contains all settlements; client compute is O(n) with n ~ tens, not thousands |
| Show only on receipt page | Misses opportunity for group-level awareness |

---

## Implementation notes

**Calculation logic:**
```tsx
const totalSettledVolume = useMemo(() => {
  return activity
    .filter((item): item is Extract<ActivityItem, { type: "settlement" }> => item.type === "settlement")
    .reduce((sum, item) => sum + item.data.amount, 0)
}, [activity])
```

**Display conditional:**
```tsx
{!isFundMode && totalSettledVolume > 0 && (
  <>
    <span>·</span>
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Receipt className="h-3.5 w-3.5" />
      {formatTokenAmount(totalSettledVolume)} {tokenName} settled
    </span>
  </>
)}
```

---

## Follow-ups

- [ ] Consider adding a tooltip on hover: "Total USDC settled in this group"
- [ ] Link the stat to the settlements filter in the activity feed (future enhancement)
- [ ] Add to group list card as a preview stat when volume > 0
- [ ] After backend hardening, verify that only confirmed (non-reverted) settlements are counted (currently all DB rows)

---

*First added in PR #1 — feat/responsiveness-signoff*
