# Agent Payment Policy

FundWise may support payment-aware agents later, but agent spending must be policy-bound. A payable endpoint is not a replacement for authorization, settlement verification, or Receipt creation.

The policy model should protect three loops:

1. **Human settlement**: Settlement Request Link -> wallet confirmation -> Receipt.
2. **Agent-assisted settlement**: Payable Settlement Request -> policy check -> human fallback or agent payment -> verification -> Receipt.
3. **Agent-to-agent Group money**: agent-created Groups and agent Members can create Expenses and settle micro-Balances, but every money-moving action still passes through explicit spending policy.

## Research Baseline

- [OWASP LLM06:2025 Excessive Agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/) names excessive functionality, excessive permissions, and excessive autonomy as root causes of harmful agent behavior. The directly relevant mitigations are minimizing tool permissions, executing actions in the user's context, requiring approval for high-impact actions, complete mediation in downstream systems, logging, and rate limiting.
- [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) frames AI risk management as a voluntary process for designing and using AI systems responsibly. Its core functions are useful for FundWise policy work: govern, map, measure, and manage.
- [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) specifically calls for documenting intended purposes, context, assumptions, risk tolerances, system requirements, and foreseeable negative impacts.
- [x402](https://docs.x402.org/introduction) supports machine-to-machine payments over HTTP `402 Payment Required`, but the protocol only handles payment flow. FundWise still has to enforce Member, Group, Balance, and Receipt rules.
- [x402 Payment-Identifier](https://docs.x402.org/extensions/payment-identifier) is relevant because retries must not duplicate Settlements. Any payable endpoint needs a durable payment id / idempotency key.

## Spending Capacity Policy

Each Member should be able to grant a payment-aware agent a **Spending Policy**.

Required fields:

- `wallet`: the Member wallet granting the policy.
- `agentId`: the agent identity or service wallet.
- `scopes`: allowed actions, starting with `settlement:request`, `settlement:pay`, and `settlement:verify`.
- `groupIds`: allowed Groups, or a clearly named all-Groups option.
- `asset`: USDC only at first.
- `maxPerSettlement`: maximum atomic Settlement amount the agent can pay.
- `dailyLimit`: total daily settlement capacity.
- `weeklyLimit`: optional weekly settlement capacity.
- `counterpartyPolicy`: Group Members only, allowlist, or agent-only counterparties.
- `requiresHumanAbove`: amount threshold that forces a Settlement Request Link fallback.
- `expiresAt`: required expiry.
- `revokedAt`: nullable revocation timestamp.

Default recommendation:

- `settlement:request`: allowed for approved Groups.
- `settlement:verify`: allowed for approved Groups.
- `settlement:pay`: disabled by default.
- Auto-pay threshold: `0 USDC` until the Member opts in.
- First opt-in threshold: `10 USDC` max per Settlement, `25 USDC` daily.
- Anything above threshold returns a Settlement Request Link for wallet confirmation.

## Ethical Payment Rules

- **No hidden spending:** every spending policy must be visible, editable, and revocable from the Member profile.
- **No broad keys:** service keys can authenticate Fundy or an internal service, but cannot become user spending authority.
- **No dark settlement:** the debtor or delegated agent must know the Group, creditor, amount, asset, and memo before payment.
- **No infinite approval:** every policy expires and can be revoked.
- **No silent threshold upgrades:** increasing limits requires direct wallet confirmation.
- **No pay-to-non-Members by default:** Payable Settlement Requests must target Group Members unless a later policy explicitly allows external recipients.
- **No receipt without verification:** a FundWise Receipt is created only after verified on-chain payment proof or verified payment-protocol receipt.
- **No duplicate settlement:** payment id, tx signature, and request id must be unique or safely replayed.
- **No prompt-only authorization:** the LLM's decision is never the authorization source. The backend enforces the policy.
- **No unsupported assets:** USDC only until the Settlement engine supports more assets.

## Current API Endpoint Review

Existing endpoints:

- `POST /api/groups`: creates a Group for the authenticated wallet. This can support agent-created Groups once Scoped Agent Access can authenticate an agent as an allowed actor.
- `POST /api/groups/{groupId}/members`: joins a Group as the authenticated wallet.
- `GET /api/groups/{groupId}/ledger`: reads Balances and suggested Settlements for Group Members.
- `POST /api/settlements`: records a verified Settlement signature after an on-chain USDC transfer. It does not initiate payment.
- `GET /api/settlements/{settlementId}`: returns the protected Receipt view.

Missing endpoints for payable settlement:

- `POST /api/agent/spending-policies`: create a Spending Policy after wallet confirmation.
- `GET /api/agent/spending-policies`: list active policies for the authenticated Member.
- `PATCH /api/agent/spending-policies/{policyId}`: lower limits, renew, or revoke. Raising limits should require wallet confirmation.
- `POST /api/agent/settlement-requests`: create or fetch a Payable Settlement Request.
- `GET /api/agent/settlement-requests/{requestId}`: inspect amount, expiry, rail, and status.
- `POST /api/agent/settlement-requests/{requestId}/pay`: pay if policy permits, or return a human Settlement Request Link if it does not.
- `POST /api/agent/settlement-requests/{requestId}/verify`: verify the payment proof and create the normal Settlement + Receipt if valid.
- `GET /api/agent/receipts/{receiptId}` or reuse `GET /api/settlements/{settlementId}` with protocol metadata.

Discovery additions:

- `/skill.md` should advertise Payable Settlement Requests as **planned, not currently callable** until implemented.
- `/api/docs` should list the planned endpoints separately from live endpoints.
- Each planned payable endpoint should document required scopes, spending policy behavior, idempotency, and fallback behavior.

## Group Ownership

Current code uses `groups.created_by` as the Group creator. Today, that has only one material permission: in Fund Mode, only the creator can initialize Treasury addresses.

For Split Mode, ownership is mostly a label. Members can join, create Expenses, view Group state, and record verified Settlements through Member-based checks. The owner cannot rewrite other Members' balances or bypass Settlement verification.

Recommended future ownership rule:

- Ownership is administrative metadata, not financial authority.
- Group owner can rename the Group, transfer owner title, and manage non-financial settings once those features exist.
- Owner cannot edit another Member's Expense, create a fake Receipt, move money, or override Settlement verification.
- If the owner disappears, transfer ownership to the oldest active Member by `joined_at`, or let Members choose a new owner through an explicit transfer flow.

## Backlog

1. Define `agent_spending_policies` schema with wallet, agent id, scopes, limits, expiry, and revocation.
2. Define `payable_settlement_requests` schema with Group, debtor, creditor, amount, asset, live Balance snapshot hash, expiry, status, payment rail, payment id, and idempotency key.
3. Add `settlement:request`, `settlement:pay`, and `settlement:verify` scopes to Scoped Agent Access.
4. Add API discovery docs for planned payable endpoints.
5. Prototype human fallback first: over-limit Payable Settlement Request returns the normal Settlement Request Link.
6. Prototype under-limit agent payment only after policy checks, idempotency, and verification are implemented.
7. Add ownership-transfer rules before allowing non-human agents to create long-lived Groups.
