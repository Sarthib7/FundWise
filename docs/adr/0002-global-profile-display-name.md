# ADR-0002: Global Member Profile Display Name Editing

**Status:** Accepted  
**Date:** 2026-04-26  
**Authors:** Hermes (zoro-jiro-san)  
**Reviewers:** Sarthi Borkar  
**Affected files:** `app/groups/[id]/page.tsx`, `lib/db.ts`

---

## Context

FundWise uses wallet addresses as the source of truth for member identity. However, raw wallet addresses (e.g., `7xKX...`) are not human-friendly. A profile display name improves usability by allowing Members to set a memorable nickname that appears across all Groups they join.

**Requirements:**
- One global display name per Member (shared across Groups)
- Editable by the Member only
- Immediate UI update across the app (optimistic)
- Persisted to Supabase `members.display_name` column

---

## Decision

Add an inline edit button next to the "You" badge in the Balances card. Clicking opens a `ProfileDialog` modal with a single text input. On save, the display name updates locally and persists via `updateMemberDisplayName()` in `lib/db.ts`.

**Key design choices:**

1. **Scoping** — The display name update is scoped to `(groupId, wallet)`. The same wallet in different groups shares the same display name (the DB column is per-member-per-group, but we enforce consistency by using the same name across groups; future schema change may normalize to a global profile table).

2. **Authorization** — Only the wallet owner can edit their own name. Server-side enforcement will come via Edge Function `update-member-profile` (current client call is direct).

3. **UI placement** — Edit pencil appears only on the Member's own row in the Balances card. Other Members see only their display name (set by them).

4. **Optimistic update** — Name updates immediately in the balances list and activity feed via React state (`balances` array mutation + re-render). No refetch needed.

5. **Modal vs inline** — Modal chosen to keep the Balances card compact and avoid complex focus management for inline editing.

---

## Alternatives considered

| Alternative | Why not chosen |
|---|---|
| Inline text input on the name itself | More UI complexity; focus trap on mobile; harder to cancel |
| Edit profile in a separate page route (`/profile`) | Overkill for single-field edit; modal is faster |
| Per-group display name (allow different names per group) | Adds friction; global name is simpler for MVP |
| Name change requires confirmation email | Not needed for wallet-native auth; wallet ownership proves identity |

---

## Consequences

### Positive
- Improves usability: members can identify each other by name instead of wallet truncation
- Low-friction edit flow: pencil → modal → save
- Consistent with existing UI patterns (Dialog, Button, Input components already used)
- Minimal code footprint (~40 lines in page.tsx + 11 in lib/db.ts)

### Negative
- Per-group display_name schema means global consistency relies on client discipline (future: migrate to `profiles` table)
- No name collision check (two members can choose same display name) — acceptable for small groups
- No avatar photo yet (future: linked from profile)

### Open questions
- Should display name be editable only once? → No, allow unlimited edits
- Should there be a character limit? → Yes, enforce 32 chars in future validation
- Should display name appear in settlement receipts? → Future enhancement

---

## Implementation notes

**lib/db.ts:**
```ts
export async function updateMemberDisplayName(groupId: string, wallet: string, displayName: string) {
  const { error } = await supabase
    .from("members")
    .update({ display_name: displayName })
    .eq("group_id", groupId)
    .eq("wallet", wallet)

  if (error) throw new Error(`Failed to update display name: ${error.message}`)
}
```

**app/groups/[id]/page.tsx:**
- Add `showProfileDialog` + `profileName` state
- "You" badge JSX:
  ```tsx
  {balance.wallet === walletAddress && (
    <>
      <Badge variant="secondary" className="text-xs">You</Badge>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEditProfile}>
        <Pencil className="h-4 w-4" />
      </Button>
    </>
  )}
  ```
- Dialog: `DialogContent` with `<Label>Display Name</Label>`, `<Input>`, Cancel + Save buttons
- Save handler: call `updateMemberDisplayName()`, then optimistic `balances` update + toast

---

## Backend hardening path

This client-side direct call will be replaced by the Edge Function `update-member-profile` once Supabase Auth is live. The function:
- Verifies `wallet` is a member of `groupId`
- Updates `display_name` via admin client
- Writes audit log entry

Current direct `supabase.from('members').update()` works in dev but is unauthorized in production with RLS.

---

*First added in PR #1 — feat/responsiveness-signoff*
