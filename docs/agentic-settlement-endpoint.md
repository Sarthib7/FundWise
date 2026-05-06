# Agentic Settlement Endpoint Research

FundWise should explore a payable agent surface, but the product primitive should be a **Payable Settlement Request**, not a generic "settle anything" endpoint.

The user-facing story remains simple: a Member opens a Settlement Request Link, reviews the live Group Balance, signs a USDC Settlement, and receives a Receipt. The agent-facing extension should make that same flow programmable for approved agents and services without weakening the wallet-bound trust model.

## Why This Makes Sense

The strongest FundWise loop is already a Settlement Request Link: one Member asks another Member to settle, the debtor sees the product in action, signs, and gets a Receipt.

Agentic payments extend the same loop:

1. An agent reads Group state through Scoped Agent Access.
2. The agent creates or receives a Payable Settlement Request for an exact live amount.
3. The debtor side pays through a machine-readable payment flow.
4. FundWise verifies the payment proof or on-chain transfer.
5. FundWise records the normal Settlement and emits the normal Receipt.

This is useful for personal finance agents, Telegram agents, or service wallets that manage shared operational costs. It also fits the later "agents can have Group expenses" idea: agents can be Members or delegated operators, as long as identity, scope, and settlement authority are explicit.

The companion policy note is [Agent Payment Policy](./agent-payment-policy.md).

## Research Notes

- [x402](https://docs.x402.org/) is built around HTTP `402 Payment Required` and lets APIs charge clients programmatically over HTTP. Its docs describe buyers as human developers or AI agents and include a flow where a server returns payment instructions, the buyer submits a payment payload, and the server verifies/settles before returning the resource.
- [x402 seller quickstart](https://docs.x402.org/getting-started/quickstart-for-sellers) includes Next.js API route support through `withX402`, which is the relevant shape for FundWise if we later protect a route with a payment requirement.
- [x402 Payment-Identifier](https://docs.x402.org/extensions/payment-identifier) is directly relevant because Settlement recording must be idempotent. Retries must never create duplicate Settlements or Receipts.
- [MPP](https://mpp.dev/llms-full.txt) uses Challenge, Credential, and Receipt primitives over HTTP headers. Its agentic payment docs frame the flow as a server challenge, a client credential proving payment, and a receipt returned after verification.
- [pay.sh](https://pay.sh/) packages this pattern for agents: discover a service, review the cost, make the request, and pay for the call used. The [Solana Foundation launch post](https://solana.com/news/solana-foundation-launches-pay-sh-in-collaboration-with-google-cloud) says Pay.sh is built on x402 and MPP and uses stablecoin payments on Solana for pay-per-request API access.

## Recommended Product Shape

Do not start with:

`POST /api/settle`

That sounds like any caller can cause money movement. It also hides the important product distinction between a ledger intent and a confirmed Settlement.

Start with:

`POST /api/agent/settlement-requests`

This creates or fetches a **Payable Settlement Request**. It returns the live Group amount, debtor, creditor, expiry, idempotency key, and available payment rails. Depending on the selected rail, the response can include an x402 challenge, an MPP challenge, or a browser Settlement Request Link fallback.

Only after payment verification should FundWise call the existing Settlement persistence path and create a Receipt.

## Required Guardrails

- **Explicit authority:** a personal agent must have Scoped Agent Access for the specific Member, Group, and action. Agent-paid settlement requires a separate `settlement:pay` scope, not just read or draft access.
- **Narrow limits:** the grant should include max amount, asset, Group, counterparty policy, expiration, and revocation.
- **Spending capacity:** policies should support per-Settlement and daily caps. A useful first default is human approval above `10 USDC`, but the cap must be Member-configured.
- **Live amount:** resolve against the live Group Balance at request time. If the Balance changes, expire or recompute before accepting payment.
- **USDC first:** keep Payable Settlement Requests USDC-only until the normal Settlement engine supports more.
- **Idempotency:** store a unique request id / payment id and reject or replay duplicates safely.
- **Verification before Receipt:** never create a Receipt from a challenge alone. Receipt creation requires verified payment proof or a confirmed on-chain transfer.
- **Protocol metadata:** store rail, payment identifier, credential source, facilitator/reference, and payer agent identity alongside the Settlement metadata.
- **Human fallback:** every Payable Settlement Request should also expose the normal Settlement Request Link so a human debtor can complete the same intent in the app.

## API Sketch

```http
POST /api/agent/settlement-requests
Authorization: Bearer <scoped-agent-token>
Idempotency-Key: psr_<client-generated-id>
Content-Type: application/json

{
  "groupId": "grp_...",
  "debtorWallet": "DebtorSolanaPubkey",
  "creditorWallet": "CreditorSolanaPubkey",
  "requestedRail": "mpp"
}
```

Response:

```json
{
  "id": "psr_...",
  "groupId": "grp_...",
  "amount": "47.00",
  "asset": "USDC",
  "expiresAt": "2026-05-06T12:15:00.000Z",
  "settlementRequestUrl": "https://fundwise.kairen.xyz/groups/...?...",
  "payment": {
    "rail": "mpp",
    "status": "challenge",
    "challenge": "..."
  }
}
```

Follow-up verification:

```http
POST /api/agent/settlement-requests/{id}/verify
Authorization: Bearer <scoped-agent-token>
```

If the payment is valid and matches the live request, FundWise records the Settlement and returns the normal Receipt reference.

## Open Questions

- Should FundWise use x402 directly for the first prototype, or use MPP as the multi-method layer and expose x402 compatibility through that?
- Should agent-paid settlement be limited to Members' own wallets, or can a service wallet settle on behalf of a Member after explicit delegation?
- Does the first version need agent-created Groups, or should it only support Groups created by humans in the web app? Current leaning: agent-created Groups are acceptable once ownership transfer and spending policies exist, because `created_by` should remain administrative metadata, not financial authority.
- Should Payable Settlement Requests live in the FundWise web app repo, or in the future Fundy companion repo as a client of the public API?

## Recommendation

This is worth pursuing after the core Split Mode flow is stable. The first implementation should be a narrow prototype: one Group, USDC only, one debtor, one creditor, short expiry, exact amount, idempotent request id, and Receipt generation only after verified payment.

The marketing angle is strong: **Settlement Request Links for humans, Payable Settlement Requests for agents.** Same Group ledger, same final Receipt.
