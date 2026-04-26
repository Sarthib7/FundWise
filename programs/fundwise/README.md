# FundWise Anchor Program (Split Mode)

On-chain Solana program for the FundWise Split Mode MVP. This program provides the trust-minimized settlement layer for group expense sharing.

---

## Program Overview

The `fundwise` program manages four core entities:

| Entity | PDA Seed | Purpose |
|---|---|---|
| `Group` | `["group", <CODE>]` | Group metadata + settings |
| `Member` | `["member", <GROUP_PDA>, <WALLET>]` | Membership record |
| `Expense` | `["expense", <GROUP_PDA>, <TIMESTAMP>]` | Expense record + splits |
| `Settlement` | `["settlement", <GROUP_PDA>, <FROM>, <TIMESTAMP>]` | On-chain transfer proof |

---

## Instructions

| Instruction | Description | Signer |
|---|---|---|
| `create_group` | Create a new group with invite code, initialize creator as member | Group creator |
| `join_group` | Join an existing group (any wallet) | Joining wallet |
| `add_expense` | Record new expense + splits (equal/exact/percentage/shares) | Expense creator (payer) |
| `update_expense` | Edit expense — only creator, no later settlement | Expense creator |
| `delete_expense` | Soft-delete expense — only creator, no later settlement | Expense creator |
| `record_settlement` | Log an on-chain USDC transfer between two members | From wallet (payer) |

**Events:** All instructions emit events for off-chain indexing: `GroupCreated`, `MemberJoined`, `ExpenseCreated`, `ExpenseUpdated`, `ExpenseDeleted`, `SettlementRecorded`.

---

## State Accounts

### `Group`

Group-level aggregate data.

| Field | Type | Notes |
|---|---|---|
| `code` | `String` | Uppercase invite code (4-12 chars) |
| `stablecoin_mint` | `Pubkey` | USDC mint address on-chain |
| `created_by` | `Pubkey` | Creator wallet |
| `created_at` | `i64` | Unix timestamp |
| `member_count` | `u32` | Auto-incremented on join |
| `total_settled_volume` | `u64` | Cumulative settled amount (base units) |
| `mode` | `GroupMode` | `Split` or `Fund` (reserved) |

### `Member`

Membership record. One PDA per wallet per group.

| Field | Type | Notes |
|---|---|---|
| `group_id` | `Pubkey` | Parent group |
| `wallet` | `Pubkey` | Member's wallet |
| `display_name` | `Option<String>` | Human-readable nickname |
| `joined_at` | `i64` | Unix timestamp |

### `Expense`

Expense record with split allocation.

| Field | Type | Notes |
|---|---|---|
| `group_id` | `Pubkey` | Parent group |
| `payer` | `Pubkey` | Who paid |
| `created_by` | `Pubkey` | Creator (edit/delete rights) |
| `amount` | `u64` | In base units (e.g., USDC × 10⁶) |
| `mint` | `Pubkey` | Token mint |
| `memo` | `String` (max 200) | Optional description |
| `category` | `String` (max 32) | e.g. "food", "transport" |
| `split_method` | `SplitMethod` | `Equal / Exact / Percentage / Shares` |
| `created_at` / `edited_at` / `deleted_at` | `i64` / `Option<i64>` | Soft-delete + audit |
| `splits` | `Vec<SplitEntry>` (max 20) | Split allocation per participant |

`SplitEntry`:
- `wallet`: participant's pubkey
- `share`: meaning depends on `split_method` (amount / basis points / raw share units)

### `Settlement`

Proof of on-chain transfer.

| Field | Type | Notes |
|---|---|---|
| `group_id` | `Pubkey` | Parent group |
| `from_wallet` / `to_wallet` | `Pubkey` | Transfer parties |
| `amount` | `u64` | In base units |
| `mint` | `Pubkey` | Token mint |
| `tx_sig` | `[u8; 64]` | Full 64-byte Solana transaction signature |
| `confirmed_at` | `i64` | Unix timestamp |

---

## PDA Derivation Reference

```rust
// Group PDA
let (group_pda, bump) = Pubkey::find_program_address(
    &[b"group", group_code.as_bytes()],
    program_id
);

// Member PDA
let (member_pda, bump) = Pubkey::find_program_address(
    &[b"member", group_pda.as_ref(), wallet.as_ref()],
    program_id
);

// Expense PDA — uses clock timestamp to avoid collisions (one expense per slot max)
let (expense_pda, bump) = Pubkey::find_program_address(
    &[b"expense", group_pda.as_ref(), Clock::get()?.unix_timestamp.to_le_bytes().as_ref()],
    program_id
);

// Settlement PDA
let (settlement_pda, bump) = Pubkey::find_program_address(
    &[b"settlement", group_pda.as_ref(), from_wallet.as_ref(), Clock::get()?.unix_timestamp.to_le_bytes().as_ref()],
    program_id
);
```

**Note:** Expense/Settlement seeds use timestamp; for production replacing with nonce/incremental ID is safer (requires storing counter on Group).

---

## Constraints & Limitations (MVP)

| Constraint | Value | Rationale |
|---|---|---|
| Max members per group | 100 | Group account growth management |
| Max splits per expense | 20 | Expense account size (rent ~0.01 SOL) |
| Expense memo max length | 200 chars | String rent cost |
| Expense category max length | 32 chars | String rent cost |
| Display name max length | 50 chars | Member account size |
| Settlement lock | Enforced off-chain (Edge Function) for now | On-chain iteration of settlements not implemented yet |

---

## Build & Deploy

### Prerequisites
```bash
# Rust stable (1.95+)
rustc --version

# Anchor CLI 0.30+
anchor --version

# Solana CLI (for deployment)
solana --version
```

### Build (BPF)
```bash
cd /home/tokisaki/FundWise
anchor build --skip-lint
# Output: target/deploy/fundwise.so, target/idl/fundwise.json
```

### Deploy to Devnet
```bash
# 1. Configure Solana CLI
solana config set --url https://api.devnet.solana.com

# 2. Ensure wallet has SOL for rent (≥ 2 SOL recommended)
solana balance

# 3. Deploy
anchor deploy --provider.cluster devnet

# 4. Verify
solana program show <PROGRAM_ID> --url https://api.devnet.solana.com
```

After first deploy, **replace the placeholder `declare_id!()` value** in `src/lib.rs` with the actual on-chain program ID returned by `anchor deploy`, then rebuild and redeploy.

---

## Testing

### Local Test Validator
```bash
# Terminal 1: start local validator
solana-test-validator --reset

# Terminal 2: run Anchor tests
anchor test --skip-build
```

Tests should be placed in `tests/` and use the `@coral-xyz/anchor` client. See `tests/setup.ts` for bootstrap.

### Devnet Smoke Test
```bash
node scripts/devnet-smoke-test.js
```
This script creates a group with code `HERMES` on devnet and verifies the transaction.

---

## Security

- **Creator-only edit/delete** enforced on-chain via `constraint = expense.created_by == signer.key()`
- **Settlement lock** checked by off-chain Edge Function before on-chain `record_settlement`; future on-chain iteration planned
- **Member checks** are currently client-enforced (frontend only); RLS on Supabase layer provides secondary guard; on-chain will be added via PDA derivation validation
- **Audit trail** — every mutation emits an event; plus off-chain `audit_log` in Supabase
- **No admin pause** — program has no upgrade authority (immutable). Emergency fixes require new program deployment.

---

## Integration with Edge Functions

Edge Functions (in `supabase/functions/`) act as the server-side middleware between frontend and this on-chain program:

1. Frontend calls EF endpoint with params
2. EF verifies membership in Supabase
3. For settlements: EF verifies txSig via Solana RPC
4. EF constructs and sends the on-chain instruction using a relayer wallet (or caller's wallet via JWT)
5. EF writes to `audit_log` table (off-chain record)
6. Frontend receives success response

This preserves a good UX while maintaining on-chain finality.

---

## Future Work

- [ ] On-chain settlement lock (iterate settlement PDAs to prevent editing after any settlement)
- [ ] Member PDA derivation validation inside instructions (prevent spoofing)
- [ ] Group settings mutation (mode switching, treasury init for Fund Mode)
- [ ] Compressed state accounts using Light Protocol (cost reduction)
- [ ] Fee mechanism for protocol revenue (0.5% of settlement?)
- [ ] Governance for upgrades (multisig authority)

---

## License

Apache-2.0 — same as anchor-lang.

---

*Last updated: 2026-04-26 — Hermes (zoro-jiro-san)*
