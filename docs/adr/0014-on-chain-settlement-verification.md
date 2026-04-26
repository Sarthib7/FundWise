
---
title: ADR-014 — On-Chain Settlement Verification via CPI Token Transfer
status: DECIDED
decidedOn: 2026-04-26
authors: [fundwise-team, hermes-agent]
category: settlement
---

## Problem

Off-chain settlement records could drift from actual on-chain transfers (missing transfer, wrong amount, wrong mint). Need atomic verification that the recorded settlement actually moved USDC on Solana.

## Decision

Settlement is a two-phase commit:

1. **Off-chain record** → Edge Function writes settlement row with `status='pending'`, locks group balances
2. **On-chain settlement** → Anchor instruction `record_settlement` performs CPI `spl_token::transfer_checked` from payer to creditor, then updates status to `'completed'`

The Anchor instruction **validates**:
- Payer and creditor token accounts exist and belong to expected owners
- Mint matches the configured USDC mint (by `ProgramData` derived from `spl_token::ID`)
- Pre-transfer balances cover amount (checked in TS client before TX)
- Settlement PDA unique per `(group_id, settlement_id)` → prevents double-settlement

Client must submit on-chain TX **immediately after** the off-chain EF succeeds. If the on-chain TX fails or times out, the settlement remains `'pending'` and can be retried within 24h.

## On-Chain Verification Logic

```rust
// programs/fundwise/src/instructions/record_settlement.rs
// 1. Derive settlement PDA from group_id + settlement_id seeds
// 2. Check !settlement.is_settled (SettlementLocked error if true)
// 3. CPI spl_token::transfer_checked:
//    - from: payer_token_account
//    - to: creditor_token_account
//       amount: settlement.amount
//    - mint: USDC_MINT (passed as CPI cpi_program account)
// 4. Update settlement: status = Completed, solana_tx = tx_signature
// 5. Increment group.expense_count for idempotency
```

**Idempotency**: `settlement_id` is a UUIDv4 from client; duplicate submissions fail at PDA init check.

## Consequences

- Settlement integrity is cryptographically guaranteed on-chain
- Failed CPI reverts entire TX → no partial state changes
- Group balances updates are信赖 on-chain events only
- Settlement receipt page displays Solana transaction signature + Solscan link

---

## Alternatives Considered

| Approach | Pros | Cons |
|---|---|---|
| Off-chain only (DB row) | Fast, no TX cost | No real settlement guarantee |
| Escrow vault + release | Holds funds in contract | Complexity; not needed for Split Mode |
| **Two-phase commit** (chosen) | Guarantees transfer; simple; minimal state | Requires sequential EF + on-chain TX steps |

---

## Implementation Checklist

- [ ] Anchor `record_settlement` CPI implementation (done)
- [ ] Client settlement flow: EF → on-chain TX → poll/confirm (pending)
- [ ] Settlement status page: pending/completed/failed display
- [ ] Error recovery: pending settlements > 24h auto-cancel or manual retry
- [ ] Devnet smoke test: expense → EF settlement → on-chain TX → verify USDC ledger diff

