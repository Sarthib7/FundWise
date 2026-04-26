# FundWise Anchor Program (Split Mode)

On-chain program for the FundWise Split Mode MVP. Handles group management, expense tracking, and settlement recording on Solana.

---

## Program Overview

| Instruction | Purpose | Signer |
|---|---|---|
| `create_group` | Create a new group with unique code + store stablecoin mint | Creator |
| `join_group` | Join an existing group (any wallet) | Joiner |
| `add_expense` | Record a new expense with splits | Expense creator |
| `update_expense` | Edit expense (only creator, no later settlement) | Expense creator |
| `delete_expense` | Soft-delete expense (only creator, no later settlement) | Expense creator |
| `record_settlement` | Record an on-chain settlement transfer between two members | From wallet (payer) |

---

## State Accounts

### `Group` PDA
- **Seeds:** `["group", group_code]`
- **Fields:** code, stablecoin_mint, created_by, created_at, member_count, total_settled_volume, mode

### `Member` PDA
- **Seeds:** `["member", group_pda, wallet]`
- **Fields:** group_id, wallet, display_name (optional), joined_at

### `Expense` PDA
- **Seeds:** `["expense", group_pda, nonce]` (nonce = incremental or random)
- **Fields:** group_id, payer, created_by, amount, mint, memo, category, split_method, created_at, edited_at, deleted_at, splits (vector)

### `Settlement` PDA
- **Seeds:** `["settlement", group_pda, from_wallet, timestamp]`
- **Fields:** group_id, from_wallet, to_wallet, amount, mint, tx_sig, confirmed_at

---

## Build & Deploy

### Prerequisites
- Rust 1.95+ (`rustc --version`)
- Solana CLI (or use `solana-wallet-headless` skill for ARM64)
- Anchor CLI 0.30+ (`cargo install --git https://github.com/coral-xyz/anchor.git` — may be slow on ARM)

### Build (BPF)
```bash
cd programs/fundwise
cargo build-bpf --release
# Target: target/deploy/fundwise.so, target/idl/fundwise.json
```

### Deploy to Devnet
```bash
# 1. Fund a devnet wallet (if needed)
# curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"requestAirdrop","params":["<PUBKEY>",1000000000]}' https://api.devnet.solana.com

# 2. Set Solana CLI to devnet
solana config set --url https://api.devnet.solana.com

# 3. Deploy
anchor deploy --provider.cluster devnet --program-keypair target/deploy/fundwise-keypair.json
```

The program ID in `lib.rs` (`declare_id!`) must match the on-chain deployed ID. After first deploy, update the placeholder with the real program ID and re-deploy.

---

## Integration with Frontend

Frontend will interact via:
1. **Edge Functions** → on-chain CPI calls to this program (server-side)
2. **Client wallet** → direct program calls for user-initiated transactions (future)

Current flow (Phase 2):
- Frontend calls Edge Function
- Edge Function (service role) verifies txSig via RPC
- Edge Function sends on-chain instruction `record_settlement` using a treasury signer or relayer

Future flow (Phase 5 — full on-chain):
- User wallet signs `record_settlement` directly
- Program verifies transfer happened via `sysvar` or pre-instruction CPI to token program
- Emission of `SettlementRecorded` event for off-chain indexing

---

## Testing

### Local test validator (recommended)
```bash
solana-test-validator --reset
# In another terminal:
anchor test --skip-build
```

Tests in `tests/` use TypeScript + Anchor client.

### Devnet smoke test
```bash
anchor build
anchor deploy --provider.cluster devnet
anchor test --skip-deploy --provider.cluster devnet
```

---

## Security & Constraints

- **Split limit:** max 50 splits per expense (PDA rent constraints)
- **Member limit:** 100 per group (enforced in `join_group`)
- **Settlement lock:** expense cannot be updated/deleted after a settlement with `confirmed_at > expense.edited_at` is recorded (off-chain guard also enforced in RPC)
- **Creator-only edits:** expense and settlement mutations restricted to original `created_by` wallet
- **Audit logging:** all mutations (even failed) logged client-side via Edge Function → `audit_log` table

---

## Migration Path from Current Client

Current client uses Supabase as off-chain ledger. After this program deploys:

1. **Dual-write phase:** Both Supabase (for UI) and on-chain program write on every action
2. **Read-from-chain phase:** Switch reads to on-chain program; Supabase becomes cache
3. **Supabase deprecation:** Drop off-chain tables once confidence is high

Edge Functions mediate: they call this Anchor program via RPC, then write to Supabase. Frontend only talks to Edge Functions.

---

## Known Limitations (MVP)

- No on-chain expense deletion lock enforcement yet — relies on off-chain RPC guard
- Splits stored inline in expense PDA → max ~20 members for equal splits; exact/percentage may be smaller
- No account compression (state size not optimized)
- No rewards or fee mechanism
- No proposal/approval flow (Fund Mode only exists off-chain currently)

---

*Last updated: 2026-04-26 — Hermes*
