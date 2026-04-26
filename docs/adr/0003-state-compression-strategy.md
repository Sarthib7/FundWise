# State Compression Strategy — Decision Record

**Status:** Accepted  
**Date:** 2026-04-26  
**Authors:** Hermes (zoro-jiro-san)  
**Reviewers:** Sarthi Borkar

---

## Context

FundWise needs to store Group, Member, Expense, and Settlement state on-chain. With 50-100 members per group, vanilla Solana PDAs become expensive (~0.16 SOL ≈ $13 for 100 members). The product targets consumer users — rent costs must be minimal.

Three options:
1. **Vanilla PDAs** — standard Solana accounts, fully rent-exempt (~0.0016 SOL each)
2. **Light Protocol PDAs** — rent-exempt but sponsored by Light Protocol (≈ 100× cheaper)
3. **Compressed PDAs (ZK Compression)** — no rent exemption, require validity proofs (~0.000015 SOL each)

---

## Decision

**Hybrid approach:**

| Account Type | Strategy | Why |
|---|---|---|
| `Group` | Light-PDA | Shared state, frequently read, rare writes. Light sponsorship saves rent without proof overhead. |
| `Settlement` | Light-PDA | High-value, infrequent. Same rationale as Group. |
| `Member` | Compressed PDA | Per-user state, read occasionally, write rarely. Compressed gives 100× rent savings; proof cost acceptable. |
| `Expense` | Compressed PDA (with caveat) | Expenses may be numerous; compression keeps total rent low. But: splits vector inline → may exceed 10KB max account size for large groups → need to move splits to separate `Split` PDAs if group > 20 members. |

**Rationale:**
- Light Protocol is production-ready on Solana mainnet, audited, with Helius RPC support for indexing.
- Compressed accounts are also production-ready (by Light Protocol), but add read complexity (proof verification).
- Hybrid minimizes total rent while keeping code complexity manageable: only Member/Expense need proof logic; Group/Settlement don't.

---

## Alternatives Considered

| Alternative | Why Not Chosen |
|---|---|
| All vanilla PDAs | Too expensive for consumer scaling (0.16 SOL per 100-member group ≈ $13) |
| All compressed PDAs | Proof verification overhead on every Group read isn't worth it for small shared state |
| All Light-PDA | Works but slightly more expensive than compressed for high-volume per-user accounts |

---

## Implementation Notes

**Light-PDA creation:**
```rust
// Light Protocol adds a validation instruction; use CPI or direct init with compressed flag
// Simplified: Anchor supports `init` with `space` plus `compressed` attribute ( Anchor 0.30+ )
#[account(
    init,
    payer = authority,
    space = 8 + Group::INIT_SPACE,
    seeds = ["group", code.as_bytes()],
    bump,
    compressed = true  // or use Light-specific CPI
)]
pub group: Account<'info, Group>,
```

**Compressed account reads:**
```rust
// Every read needs proof from ZK indexer (Helius provides)
// Light SDK handles this automatically via RPC; no manual proof handling needed in MVP
```

**Rent cost comparison (100-member group):**

| Strategy | Group | Member ×100 | Expense ×50 | Settlement ×20 | Total |
|---|---|---|---|---|---|
| Vanilla | 0.002 SOL | 0.16 SOL | 0.08 SOL | 0.032 SOL | **0.274 SOL** ($22) |
| Light-PDA | 0.00002 SOL | 0.002 SOL | 0.001 SOL | 0.0004 SOL | **0.0034 SOL** ($0.27) |
| Compressed | 0.000015 SOL | 0.0015 SOL | 0.00075 SOL | 0.0003 SOL | **0.0026 SOL** ($0.21) |

**Winner: Hybrid (Light for shared, Compressed for per-user) → ~$0.25–0.30 per group creation.**

---

## Consequences

### Positive
- Rent cost reduced 100× vs vanilla
- Consumer-friendly: group creation cost becomes negligible
- Future-proof: both Light Protocol and compression are production-tested

### Negative
- Added dependency on Light Protocol SDK/helius RPC for reads
- Slightly more complex account validation in instructions
- Compressed accounts cannot hold arbitrary large vectors (still bounded by max account size ≈ 10 KB with compression)

### Open Questions
- What's the maximum expense splits we'll support? → Limit to 20 members per expense for MVP (fits in compressed account with inline splits). For larger groups, move `splits` to separate `Split` PDAs.
- Should we use Light-PDA for `Expense` instead? → Research needed: Expense frequency vs member accounts. TBD after load testing.

---

*Related: docs/BACKEND_TRUST_HARDENING.md — state storage section (coming soon)*
