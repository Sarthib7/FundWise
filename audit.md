# FundWise Security Audit

Snapshot date: 2026-04-26

Scope: application code, Supabase schema and policies, wallet-driven settlement flows, LI.FI integration surface, and basic supply-chain hygiene.

Verdict: FundWise is not ready for mainnet-beta in its current trust model. The dominant issue is that the browser can currently author financial truth through a public Supabase client with permissive row-level security, and stored Settlement / Contribution receipts are not verified against chain data before being shown back to users.

2026-05-14 update: this file is now historical audit context. The main trust-model findings were remediated on the `checklist` branch with server-side wallet-bound mutations, RLS lockdown, RPC transfer verification, atomic Settlement recording, unique `settlements.tx_sig`, and service-role-only execution for sensitive Supabase RPCs. Use `STATUS.md`, `issues.md`, `docs/ops-runbook.md`, and ADR-0030 for current readiness state.

## Findings

### 1. Critical: public browser writes can forge Group ledger state and Treasury metadata

Evidence:
- `lib/supabase.ts:4-23` creates a browser Supabase client from the public publishable / anon key.
- `lib/db.ts:15-43` inserts Groups from that client and immediately adds a Member.
- `lib/db.ts:46-67` updates `multisig_address` and `treasury_address` from the browser.
- `lib/db.ts:117-205` inserts Members, Expenses, and Expense splits from the browser.
- `lib/db.ts:318-375` inserts Settlements and Contributions from the browser.
- `supabase/schema.sql:223-312` leaves most reads and writes open with `using (true)` or `with check (true)`.

Impact:
- Anyone who has the public Supabase key can call PostgREST directly and create or mutate Groups, Members, Expenses, Settlements, Contributions, Proposals, approvals, and Treasury addresses.
- Fund Mode Treasury metadata can be overwritten without proving creator ownership.
- Split Mode balances can be manipulated without signing an on-chain transfer.

Required fix:
- Move all financial-state writes behind authenticated server-side handlers or Supabase Edge Functions.
- Bind the caller to a verified wallet session or signed message.
- Replace open write policies with member-scoped and creator-scoped RLS rules.

### 2. Critical: Settlement and Contribution receipts trust unverified transaction signatures

Evidence:
- `app/groups/[id]/page.tsx:570-585` stores a Settlement immediately after the client returns a signature.
- `lib/db.ts:318-340` persists `from_wallet`, `to_wallet`, `amount`, `mint`, and `tx_sig` without any RPC verification.
- `app/groups/[id]/page.tsx:712-726` stores a Contribution the same way.
- `lib/db.ts:354-375` persists Contribution metadata without checking chain state.
- `app/groups/[id]/settlements/[settlementId]/page.tsx:167-190` presents the stored `tx_sig` as “Proof of settlement”.

Impact:
- A forged insert can create a fake Receipt page that appears to prove an on-chain Settlement.
- Contribution history can claim Treasury deposits that never occurred or that used the wrong mint, wrong amount, wrong sender, or wrong destination.
- Even after auth is added, a stale, failed, or unrelated signature could still be recorded unless the backend validates it.

Required fix:
- Before writing a Settlement or Contribution row, fetch the transaction from RPC and verify confirmation status, mint, amount, source owner, destination owner, and destination token account.
- Persist a verified transfer summary, not just a raw signature.
- Reject unconfirmed, failed, duplicate, or mismatched transactions.

### 3. High: `update_expense_with_splits` is `security definer` but still trusts a caller-supplied wallet string

Evidence:
- `supabase/schema.sql:69-140` defines `public.update_expense_with_splits` as `security definer`.
- `supabase/schema.sql:107-109` authorizes edits by comparing `v_expense.created_by` to `p_actor_wallet`.
- `supabase/migrations/20260426_add_update_expense_with_splits.sql:1-75` repeats the same pattern in the migration.
- `lib/db.ts:288-311` calls the RPC with `actorWallet` supplied by the browser.

Impact:
- The function bypasses RLS but does not derive identity from an authenticated context.
- An attacker can impersonate the Expense creator by supplying the creator wallet string, then rewrite payer, amount, memo, category, split method, and splits.

Required fix:
- Remove `p_actor_wallet` from the trusted authorization path.
- Derive actor identity from authenticated server context or a verified wallet session mapped to the request.
- Keep the edit guard in SQL, but only after caller identity is cryptographically bound.

### 4. High: Group membership and financial history are world-readable

Evidence:
- `supabase/schema.sql:224-226`, `244-246`, `253-255`, `266-268`, `275-277`, `284-286`, `293-295`, and `306-308` allow public `select` access across Groups, Members, Expenses, splits, Settlements, Contributions, Proposals, and approvals.
- `lib/db.ts:69-110`, `135-157`, `207-236`, and `343-396` read those tables directly from the browser.
- `app/groups/[id]/settlements/[settlementId]/page.tsx:45-54` loads Group, Member, and Settlement data for any visitor who knows the IDs.

Impact:
- Private Group membership, wallet addresses, balances, and receipt history can be enumerated by non-members.
- Invite-only UX loses privacy guarantees because the data layer is not member-scoped.

Required fix:
- Restrict reads to Group Members.
- If public invite previews are needed, expose a separate minimal read model that does not reveal ledger or member history.
- Require membership checks on the Receipt route before loading Group context.

### 5. Medium: LI.FI quote path uses floating-point math for token amounts

Evidence:
- `lib/lifi-bridge.ts:47-49` converts human input with `parseFloat(params.fromAmount) * 1e6`.
- `lib/lifi-bridge.ts:69-70` formats quote output back through `Number(...) / 1e6`.

Impact:
- Decimal rounding and scientific-notation edge cases can produce the wrong smallest-unit amount.
- Users can receive inaccurate quotes or send the wrong amount into a bridge route.

Required fix:
- Parse user amounts with exact decimal-to-bigint logic.
- Keep amounts in smallest units until final display formatting.

### 6. Medium: production dependencies include mutable `latest` pins

Evidence:
- `package.json:50` uses `@solana/web3.js: "latest"`.
- `package.json:61` uses `html5-qrcode: "latest"`.
- `package.json:66` uses `qrcode: "latest"`.

Impact:
- Production builds are not reproducible.
- A new upstream release can silently alter wallet, QR, or encoding behavior between builds.
- This increases supply-chain and release risk even if no known CVE is currently confirmed here.

Required fix:
- Pin exact versions in `package.json`.
- Keep upgrades explicit and reviewed through lockfile diffs.

## Clean checks and limits

- I did not find committed secrets in tracked files from a repo grep or `git log --all --diff-filter=A -- '*.env' '*.env.*' '*.pem' '*.key' '*.secret'`.
- There are no repo-local GitHub Actions or Dockerfiles to audit, so CI/CD and container findings are out of scope for this pass.
- I did not run a live package-vulnerability database scan because registry/network access was not available in this session.

## Recommended order of work

1. Close public write access and move ledger mutations to authenticated server-side boundaries.
2. Verify Settlement and Contribution transactions against RPC before persisting receipts.
3. Restrict reads to Group Members and remove public ledger visibility.
4. Replace caller-supplied wallet authorization in privileged SQL paths.
5. Fix exact amount parsing in LI.FI flows and pin mutable production dependencies.
