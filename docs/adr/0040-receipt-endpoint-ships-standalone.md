# Receipt Endpoint ships as a standalone Railway service, decoupled from Payable Settlement Requests

Locked 2026-05-16.

## Decision

**Receipt Endpoint v1** ships as a **standalone Railway service** by Solana Summit (2026-06-13). Scope:

- **Input:** Solana transaction signature (and optionally a wallet address).
- **Output:** Structured receipt JSON: `receipt_id`, `timestamp`, `payer`, `payee`, `amount`, `mint`, `tx_signature`, `description` (best-effort from program/DEX metadata), `ipfs_cid`.
- **Storage:** Receipt JSON pinned to IPFS via Pinata (or equivalent). CID returned in the response. Arweave permanent archive deferred to enterprise tier.
- **Payments:** Listed in the pay-skill / x402 MCP catalog. Per-call payable via **x402** (HTTP 402) and **MPP**. Free tier for developer testing.
- **Hosting:** Railway service, separate repo. Calls Solana RPC (Helius or equivalent); no FundWise dependency in the request path.

**The public surface accepts any Solana transaction**, not only FundWise Settlements. **FundWise Settlements are the premium first-class source** because they carry the richest metadata (Group, Members, Expense linkage, Settlement context); the lookup path for those receipts pulls extra context from FundWise's API, but it is not required to ship.

## What this supersedes

The `CONTEXT.md` glossary previously defined Receipt Endpoint as a product that "should grow from FundWise Receipts, Payable Settlement Requests, Scoped Agent Access, and Spending Policies." That coupling is removed. Receipt Endpoint does not require any of those primitives to ship — it queries Solana RPC and pins JSON to IPFS. The `docs/shipped-vs-planned.md` matrix also previously labelled Receipt Endpoint "Planned FundLabs product... should grow from FundWise Receipts and Payable Settlement Requests, not be claimed as live." Superseded by the standalone-by-Summit decision.

## Why this matters

- The coupled scope (Payable Settlement Request → Receipt) was months out. The standalone scope (Solana tx → receipt JSON) is shippable in 4 weeks.
- Decoupling lets Receipt Endpoint serve any agent doing any Solana payment, not just FundWise integrators — which matches the FundLabs umbrella claim ("on-chain receipts on Solana") and broadens the addressable surface.
- FundWise integration grows the moat over time (premium receipts when source is a FundWise Settlement), but it is no longer a release blocker.

## Tradeoffs

- The standalone product is easier to copy — anyone with Solana RPC + IPFS can build it. The moat is: data flywheel from being listed early in the pay-skill / x402 catalog, premium FundWise-linked receipts, and the FundLabs brand. If the moat reads as thin in the Summit talk, lean on the FundWise-linked premium path.
- Receipts from non-FundWise txs cannot claim richer attribution than what Solana RPC + DEX/protocol metadata actually returns. Public copy must not over-claim Stripe-grade compliance or accounting-software integration before audit.

## Consequences

- New separate Railway-deployed repo for Receipt Endpoint (not inside FundWise Next.js app).
- Solana RPC dependency (Helius primary, Alchemy fallback recommended for parity with FundWise).
- Pinata or equivalent IPFS pinning service required; budget for low-volume pinning.
- pay-skill / x402 catalog listing process must complete before Summit for the payable claim to be live.
- `CONTEXT.md` Receipt Endpoint glossary entry and product invariants already updated to match this scope.
