# Dashboard and Expense UX Overhaul — Grill Session 2026-04-30

**Source:** Grill-me session with owner
**Priority:** Post-roast hardening, before hackathon submission
**Build order:** Dashboard simplification → Currency conversion → Photo upload

---

## Decision 1: Dashboard simplification (7 → 4 sections)

**Problem:** On mobile, the Group page has 7 sections that require excessive scrolling. Desktop layout is fine.

**Current sections (7):**
1. Settlement request banner (deep links only)
2. "Your next step" hero card — big balance summary + settle button
3. Stats row — members, expenses, settlements count
4. Balances table — every member's net position
5. Suggested settlements list — who pays whom
6. Activity feed — expenses + settlements mixed
7. Sidebar — members, invite, bridge, profile

**Target layout (4 sections):**
1. **Settlement request banner** — unchanged, only appears from deep links
2. **Hero card (merged)** — balance headline + primary action + quick stats (inline "3 members · 4 expenses · 2 settled") + balances as compact chips + settlement list with settle buttons. All in one card.
3. **Activity feed (compact)** — "Add" button in header, 5 items visible with "Show N more" expand, edit/delete on tap not always visible
4. **Sidebar** — unchanged on desktop, stacks below dashboard on mobile

**Key changes:**
- Stats row merged into hero card as inline text (not a separate grid)
- Balances table → compact avatar chips with +/− amounts
- Suggested settlements → single-line rows inside hero card
- Activity feed → show 5 most recent, expand for more
- Edit/delete buttons smaller (h-8 w-8 instead of h-10 w-10)
- Settlement share button simplified: "Nudge" instead of "Share Request Link"

---

## Decision 2: Expense dialog simplification

**Problem:** Adding an expense has too many fields for a simple "I paid for dinner" moment.

**Current fields:**
- Amount
- Memo/description
- Category dropdown (6 options)
- Payer selector (any member)
- Participant checkboxes
- Split method selector (equal / exact / percentage / shares)
- Per-person custom values

**Default experience (3 fields):**
1. **Amount** — number input, defaults to USD
2. **What was it for?** — single text field ("Dinner at Padaria")
3. **Paid by:** — defaults to YOU, small dropdown if someone else paid

**Defaults applied automatically:**
- Split: equal, all members
- Category: **removed entirely** — memo field IS the category
- No custom values visible

**Behind "Advanced" collapsible:**
- Split method selector (equal / exact / percentage / shares)
- Per-person custom values
- Participant checkboxes

**Photo button:**
- Small "+" icon or camera icon in the amount row
- Opens file picker (JPEG/PNG only)
- Optional — not required to submit

---

## Decision 3: Category dropdown — killed

**Decision:** Remove the category dropdown entirely from expense creation and edit.

**Reasoning:**
- "Dinner at Padaria" is more descriptive than selecting "food" from a dropdown
- Memo field already captures what the expense was for
- One less interaction = faster expense entry
- Category can be inferred later by AI if needed

**Impact on existing code:**
- `EXPENSE_CATEGORIES` constant can stay for backward compatibility
- Existing expenses with categories still display correctly
- New expenses default to "general" category internally, memo carries the real description

---

## Decision 4: Currency conversion

**Scope:** Allow expense entry in 5 currencies, auto-convert to USDC.

**Currencies:** USD, EUR, GBP, INR, AED

**API:** CoinGecko free tier (30 calls/min)

**Flow:**
1. User selects currency from dropdown next to amount input
2. User enters amount in local currency (e.g. ₹4,500 INR)
3. FundWise fetches live rate from CoinGecko
4. Non-editable field below shows converted amount: "≈ $53.72 USDC"
5. On submit, both original amount and converted USDC amount stored
6. Exchange rate snapshot stored with the expense

**Storage:**
- `source_currency` column on expenses (e.g. "INR")
- `source_amount` column (original amount in smallest unit)
- Existing `amount` column becomes the USDC ledger value
- `exchange_rate` column (rate used)
- `exchange_rate_source` column (e.g. "coingecko")
- `exchange_rate_at` column (timestamp of rate fetch)

**Balance computation:** Uses `amount` (USDC value) only. Historical balances never reprice.

---

## Decision 5: Photo upload for expense receipts

**Scope:** One photo per expense. JPEG/PNG only. Client-side compression before upload.

**Storage:** Supabase Storage bucket `expense-proof`

**Flow:**
1. User taps camera/plus icon in expense dialog
2. File picker opens (accept="image/jpeg,image/png")
3. Client-side compression to ~500KB before upload
4. Upload to Supabase Storage → get public URL
5. Store URL in `expense_proof_url` column on expenses
6. Display thumbnail in Activity Feed, tap to view full

**Constraints:**
- Max 5MB before compression
- One image per expense
- No PDFs in the app (PDFs flow through Telegram bot later)

**Why no PDFs yet:** Keep the app UI light. PDF/invoice handling belongs in the Telegram bot where users already share documents in group chats. The bot's agent can analyze those and create draft expenses.

---

## Dependencies on existing work

- ADR-0017 already defined Source Currency + Exchange Rate Snapshot pattern — currency conversion aligns with this
- Supabase Storage is already configured (`lib/supabase-avatar-storage.ts` exists for avatars, same pattern for expense proofs)
- `expense-engine.ts` tests cover balance math — currency conversion doesn't change the math, only the input path

---

## Not in this batch

- Expense dispute handling (ADR-0019 — post-hackathon)
- AI receipt parsing (Phase 2 — requires LLM)
- PDF upload (delegated to Telegram bot)
- Multiple photos per expense
- Fund Mode proposals
