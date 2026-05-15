# Fundy is a FundLabs product; agent-as-Member is the north-star model

Two bundled positioning decisions, locked 2026-05-16.

## Decision 1 — Fundy is a FundLabs product

Fundy is **a FundLabs product**, not "just a distribution surface for the FundWise Agent." It is a Telegram-native personal finance agent that also exposes its tools over MCP to external agents, and it also serves as FundWise's primary distribution surface — both roles co-exist. Public copy may lead with the product framing; engineering invariants (money-moving actions deep-link to the FundWise web app for wallet confirmation; no direct Supabase writes from Fundy) still apply regardless of framing.

**Supersedes:** the "Fundy is not a separate product; it is a distribution surface" line in `CONTEXT.md` product invariants (now reworded), and the implicit "planned expansion product" framing of Fundy in [ADR-0028](./0028-fundlabs-product-family-positioning.md). [ADR-0021](./0021-gtm-rollout-order-split-fundy-fund-mode-beta.md)'s "sibling product" phrasing is upheld and made canonical.

## Decision 2 — Agent-as-Member is the north-star model; agent-as-hands is the Summit-shippable slice

When an AI agent participates in a FundWise Group, the **north-star model** is **agent-as-Member**: the agent has its own Solana wallet, joined the Group as a Member in its own right, holds its own allocation, logs Expenses attributed to its own wallet, and queries Receipt Endpoint scoped to its own wallet. The human who funded or invited the agent retains policy oversight via Spending Policy, but is *policy-setter and revoker, not principal*.

The **Summit-shippable slice** (2026-06-13) is the lighter version: **agent-as-hands** via Scoped Agent Access tokens. A human Member generates a scoped token from `/profile/agents` (or signs a Solana wallet challenge); the token is tied to that Member's wallet, specific Group(s), and action type. The agent acts under the human's wallet, not its own.

Both modes are documented in `CONTEXT.md` under `Member`, `Spending Policy`, and `Scoped Agent Access`. The public umbrella claim "Members of a Group can be human or AI" reduces to: a Member is any wallet that joined; nothing in the data model requires the wallet to be human-controlled.

**Direction (post-Summit):** Treasury → agent wallet allocations via approved reimbursement Proposals targeting the agent's wallet; agent-driven Expense logging with own-wallet attribution at scale; Receipt Endpoint queries scoped to agent wallets as first-class.

## Why this matters

- Investors, Summit attendees, and Telegram users meet Fundy as a standalone agent, not as a "FundWise feature." Calling it "just a surface" in public copy undersells the actual product and weakens the agent-economy thesis.
- The "human or AI" half of the FundLabs umbrella is concretely true under agent-as-Member, not hand-waving. Without this decision, the umbrella reduces to "humans grant scoped access to agents" — which is weaker positioning.
- Splitting north-star (agent-as-Member) from Summit-shippable (agent-as-hands) prevents over-claiming at Summit while giving the public story a coherent direction.

## Consequences

- `CONTEXT.md` glossary entries updated for `Fundy`, `Member`, `Spending Policy`, `Scoped Agent Access`, plus product invariants and the example dialogue.
- `docs/shipped-vs-planned.md` Scoped Agent Access row updated to reflect the two-mode split and partial-shipped status.
- Future ADRs that touch agent semantics (e.g. Payable Settlement Requests with `settlement:pay` authority) must clarify which mode they target.
