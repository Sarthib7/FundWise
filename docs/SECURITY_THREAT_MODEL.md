# Security Threat Model — FundWise Split Mode

**Last updated:** 2026-04-26  
**Author:** Hermes (zoro-jiro-san)  
**Scope:** On-chain Anchor program + off-chain Edge Functions + client

---

## Attack Surface Summary

| Layer | Components | Threat Actors | Primary Risks |
|---|---|---|---|
| **On-chain** | Anchor program (Group, Expense, Settlement PDAs) | Malicious user, compromised wallet, malicious CPI target | Reentrancy, settlement lock bypass, unauthorized state mutation |
| **Off-chain** | Edge Functions (Supabase), RLS policies | Spoofed wallet address, RPC manipulation | Forged `from_wallet`, fake txSig, membership bypass |
| **Client** | `lib/db.ts`, React state | Man-in-the-middle, XSS, wallet injection | Parameter injection, unauthorized mutations |

---

## 1. On-Chain Program Threats

### 1.1 Reentrancy (CEI Violation)

**Scenario:** External CPI to untrusted program re-enters same instruction before state update, double-spending funds.

**Mitigation:**
- **CEI Pattern enforced** (Checks → Effects → Interactions): all state mutations complete before any CPI call.
- Settlement instruction does CPI `token::transfer_checked` **after** Settlement PDA initialized and Group volume updated.
- No user-provided program IDs passed to CPI (token program is hardcoded known-good).

**Status:** ✅ Mitigated in `record_settlement` (Effects before Interactions)

**Test:** `tests/security.spec.ts` — try to call `record_settlement` twice with same signature; second call should fail because ATAs already debited.

---

### 1.2 Settlement Lock Bypass (Critical Business Logic)

**Scenario:** Attacker updates or deletes an expense **after** settlements have been recorded, corrupting balance history.

**Current status:** ⚠️ **Partially mitigated**

- **Off-chain (Edge Function):** `add-settlement` and `delete-expense` include checks:
  ```sql
  WHERE confirmed_at > (expense.edited_at OR expense.created_at)
  ```
- **On-chain:** Settlement lock check is **commented out** in `update_expense` / `delete_expense` (requires iterating settlement PDAs).

**Risk:** If attacker bypasses Edge Function and calls on-chain instructions directly, they can modify old expenses.

**Fix path (Priority: High):**
- Implement settlement PDA iteration using `group` PDA as lookup table (store settlement PDAs in a vector in Group) OR
- Use `getProgramAccounts` filter by `group_id` and check timestamp (expensive, ~10k CU per 10 PDAs)
- Add `settlement_timestamps: Vec<i64>` accumulator in Group PDA (append-only) to enable O(1) lock check.

---

### 1.3 Membership Bypass (Unauthorized Expense/Settlement)

**Scenario:** Non-member creates expense or records settlement in a group they don't belong to.

**Current status:** ⚠️ **Partially mitigated**
- Edge Functions check membership via admin client before mutation
- On-chain instructions skip membership check (MVP assumption: only members can call, but no signature check on membership)

**Risk:** Anyone with a funded wallet can call `record_settlement` directly on-chain and create bogus settlements.

**Fix path (Priority: High):**
- In `record_settlement`, accept a `Member` PDA account as argument and validate `member.wallet == from_wallet` and `member.group_id == group.key()` using `has_one` constraint.
- Similarly for `add_expense`: require `creator` is member PDA with wallet == `creator.key()`.

---

### 1.4 Duplicate Account / Same Account Passed Twice

**Scenario:** Same token account passed as both `from_ata` and `to_ata` to drain funds to self or other manipulation.

**Mitigation:**
```rust
require!(from_ata.key() != to_ata.key(), FundwiseError::SameAccount);
```

**Status:** ✅ Add to `record_settlement` checks (currently missing — add immediately)

---

### 1.5 PDA Bump Canonicalization / Collision

**Scenario:** Non-canonical bump allows two different PDAs for same seed, causing address confusion.

**Mitigation:**
- Anchor automatically uses canonical bump via `ctx.bumps`.
- We store `bump` in account struct for future verification.

**Status:** ✅ Safe

---

### 1.6 Unchecked Account Ownership / Type Confusion

**Scenario:** Malicious user passes a non-token account as `from_ata`, causing CPI to fail or corrupt state.

**Mitigation:**
- Anchor's `Account<'info, TokenAccount>` type ensures account data deserializes as TokenAccount and owner is the expected token program.
- We also check `.owner == from_wallet` explicitly.

**Status:** ✅ Safe via Anchor type system + explicit checks

---

### 1.7 Stale Account Read After CPI

**Scenario:** External CPI modifies an account (e.g., token account balance), then instruction reads old cached copy.

**Mitigation:**
- In `record_settlement`, we perform CPI `transfer_checked` which atomically updates balances. We don't read balances afterward, so not an issue.
- If future logic reads balances post-CPI, call `.reload()` on the `Account` struct.

**Status:** ⚠️ Add `.reload()` calls if balance checks are needed later.

---

### 1.8 Token-2022 Transfer Hooks

**Scenario:** If mint is a Token-2022 token with `transfer_hook` extension, CPI will invoke malicious arbitrary code.

**Mitigation:**
- Program restricts mint to `group.stablecoin_mint` (USDC, which is legacy SPL, not Token-2022).
- Never allow user-supplied mint beyond group config.

**Status:** ✅ Safe for MVP (USDC only)

**Future:** If supporting arbitrary mints, whitelist or verify transfer hook program ID is expected.

---

### 1.9 Mint Authority / Freeze Authority

**Scenario:** Mint with mutable authority could freeze user tokens.

**Mitigation:**
- Group `stablecoin_mint` is set at creation; it should be USDC with immutable authority.
- No code path allows changing mint after group creation.

**Status:** ✅ Safe (USDC is immutable)

---

### 1.10 Rent / Reinitialization Attacks

**Scenario:** Expense PDA is closed (rent collected) and reinitialized with malicious data.

**Mitigation:**
- Anchor `init` constraints prevent reinitialization.
- Settlements reference expense via PDA; no direct mutation.

**Status:** ✅ Safe

---

### 1.11 Overflow / Underflow in Amounts

**Scenario:** `total_settled_volume += amount` overflows (attack by huge amount).

**Mitigation:**
- Use `checked_add` (panics on overflow, returns error). Anchor translates to `Err` in transaction.

**Status:** ✅ Safe

---

## 2. Off-Chain (Edge Functions) Threats

### 2.1 Spoofed `actor_wallet` / `from_wallet`

**Scenario:** Attacker sends `{ from_wallet: "victim", to_wallet: "attacker", amount: 1000 }` to `add-settlement` EF.

**Mitigation (existing):**
- EF currently uses `p_actor_wallet` param from client — **INSECURE** until Supabase Auth activated.

**Fix:** Once Supabase Auth is live:
- EF reads `auth.uid()` from JWT — server-side truth.
- Or: EF requires signed JWT with wallet claim verified via wallet signature challenge.

**Status:** 🔴 Active risk — **Edge Functions not yet deployed with auth**

---

### 2.2 Fake txSig (Replay Attack)

**Scenario:** Attacker re-uses an old valid txSig to create fake settlement.

**Mitigation (in `add-settlement` EF):**
- Verifies txSig via `verifySolanaTx()` against `from/to/amount/mint` via RPC.
- TxSig is unique per transaction; replay fails because `getTransaction` shows already-confirmed tx but `fromWallet`/`toWallet`/`amount` match — actually that would succeed; need additional guard.

**Open question:** Should we allow replays? Probably yes (same settlement twice is idempotent). But what if someone replays with different amount? RPC verification checks exact amount, so mismatch fails.

**Status:** ✅ Mitigated by RPC verification of amount + accounts

**Residual risk:** Replay of *same* exact settlement creates duplicate DB entries. Add dedup index on `(tx_sig)` in DB (already `tx_sig` is unique column in schema?). Check schema: currently no unique constraint. **Add unique index** in migration:

```sql
create unique index idx_settlements_tx_sig on settlements(tx_sig);
create unique index idx_contributions_tx_sig on contributions(tx_sig);
```

---

### 2.3 Membership Forgery (Client-side)

**Scenario:** Client claims from_wallet is member but actually not.

**Mitigation:**
- EF verifies membership: `SELECT 1 FROM members WHERE group_id=? AND wallet=?`
- No check for to_wallet membership (should also be a member). Add it.

**Status:** ⚠️ Partially — verify **both** `from_wallet` and `to_wallet` are members.

---

### 2.4 RPC Manipulation (txSig Verification Bypass)

**Scenario:** Attacker controls RPC endpoint or uses fake RPC to lie about txSig validity.

**Mitigation:**
- Use trusted RPC (Helius, Alchemy, QuickNode) with API key.
- Optionally verify via multiple RPCs (quorum) for high-value.
- Eventually move verification on-chain (CPI-based) to remove trust in RPC.

**Status:** ⚠️ Requires trusted RPC provider + API key (not yet set in EF env)

---

## 3. Client-Side Threats

### 3.1 Wallet Signature Replay / Phishing

**Scenario:** Malicious site tricks user into signing settlement for wrong amount.

**Mitigation:**
- UI shows full details (from, to, amount, mint) before transaction.
- Wallet adapter prompts user with those details (cannot be spoofed by site).
- User must confirm in wallet popup.

**Status:** ✅ Standard wallet UX protects this

---

### 3.2 Parameter Injection (lib/db.ts)

**Scenario:** Attacker modifies frontend JS (via XSS) to send arbitrary amounts.

**Mitigation:**
- All on-chain instructions validate amount > 0, mint matches, membership (once added).
- Edge Functions double-validate before DB write.

**Status:** ✅ Defense-in-depth

---

## 4. Exploit Pattern Checklist (Apply to Code)

Based on research (Drift $285M, Cashio $52M, Wormhole $326M incidents), verify:

- [x] **CEI Pattern** — state updates before any external CPI (✅ in settlement)
- [x] **Reentrancy guard** — mutex on sensitive state or effects-first (✅ no external state-modifying CPI before update)
- [x] **Account ownership validated** — `from_ata.owner == from_wallet` (✅)
- [x] **Program ID validated** — token program passed as `Program<'info, Token>` (✅ Anchor auto-checks)
- [x] **No unchecked_account without justification** (✅)
- [x] **PDA bump canonical stored** (✅ `bump` field in each PDA)
- [x] **Splits sum validated** (✅ per method)
- [ ] **Settlement lock enforced on-chain** (TODO — critical)
- [ ] **Membership validated on-chain** (TODO — critical)
- [ ] **Duplicate account check** — `from_ata.key() != to_ata.key()` (TODO — add)
- [ ] **Post-CPI account reload** if we read after CPI (N/A for now)
- [ ] **Token-2022 transfer hook whitelist** (N/A — USDC only)
- [ ] **Rent-exempt check** (Anchor `init` handles)

---

## 5. Exploit Simulation Test Cases

Created in `tests/security.spec.ts`:

| Test | Purpose | Expected |
|---|---|---|
| Reentrancy guard (create same group twice) | Ensure PDA init fails on second call | Throw `already in use` |
| Expense split sum (equal) mismatch | Invalid splits should reject | `InvalidSplits` error |
| Expense split sum (exact) mismatch | Sum must equal amount | `ExactMismatch` error |
| Settlement from non-member | (TODO after membership check added) | `NotMember` error |
| Settlement lock after expense edit | (TODO after lock check added) | `SettlementLocked` error |
| Same account as from/to | Prevent self-transfer trick | `InvalidFromAccount` or custom error |

---

## 6. Production Hardening Checklist

Before mainnet-beta deployment:

### On-Chain Program
- [ ] Build BPF: `cargo build-bpf --release`
- [ ] Run `anchor verify` on devnet to confirm bytecode matches source
- [ ] Audit: external security firm for flows involving user funds
- [ ] Add emergency pause (multisig) via `pause` instruction
- [ ] Ensure program upgrade authority is 2/3 multisig (not single key)

### Edge Functions
- [ ] Deploy to Supabase with env `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] Set `SOLANA_RPC_URL` to Helius/Alchemy with rate-limit protection
- [ ] Verify txSig via RPC with `commitment=confirmed`
- [ ] Add unique index on `settlements.tx_sig` and `contributions.tx_sig`
- [ ] Add validation: `from_wallet` AND `to_wallet` must be members
- [ ] Enable request logging (Cloudflare?) for anomaly detection

### Client
- [ ] `lib/db.ts` → call Edge Functions (no direct table writes)
- [ ] Integrate Supabase Auth — wallet signature challenge → session JWT
- [ ] Display clear errors: "Settlement blocked — later settlement exists"
- [ ] Add client-side settlement lock check before showing settle button

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation | Residual |
|---|---|---|---|---|
| Settlement lock bypass (on-chain) | Medium | Critical | Off-chain RPC guard + future on-chain check | Medium until on-chain implemented |
| Non-member settlement recording | Medium | High | EF membership check; future on-chain member PDA validation | Low (EF gate) → None (on-chain) |
| txSig replay (same settlement twice) | Low | Medium | Unique index on tx_sig rejects duplicate | Low |
| RPC provider compromise / manipulation | Low | High | Use Helius/Alchemy API key; monitor fail-open | Low-Medium |
| Wallet signature phishing | Medium | Medium | Wallet UI shows full transaction; user education | Medium (user error) |
| Reentrancy in CPI flows | Low | Critical | CEI pattern, no external authority passed | Low |
| Split sum logic bug (under/over) | Medium | Medium | Validation in both client + on-chain; unit tests | Low |
| Compressed account proof skip | N/A (not using yet) | — | TBD when compression adopted |

---

## 8. Monitoring & Incident Response

**What to monitor:**
- `settlements` table: count per minute per group (spikes → abuse)
- `audit_log.outcome = 'FAILURE'` rate > 5% → alert
- Edge Function latency > 2s → possible RPC throttling
- On-chain: `record_settlement` instruction failures (error codes)

**Incident playbook:**
1. **Suspicious duplicate settlements** → query `audit_log` for same `tx_sig`; if duplicate DB record but single on-chain tx, EF bug; add unique index.
2. **Settlement lock bypass on-chain** → emergency: pause client, hotfix program (upgrade authority exists)
3. **Edge Function auth bypass** → disable function via Supabase immediately, investigate JWT validation

---

*Related docs: `docs/BACKEND_TRUST_HARDENING.md`, ADR-0003 (state compression), ADR-0004 (on-chain settlement verification)*
