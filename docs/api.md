# FundWise HTTP API

FundWise exposes wallet-bound HTTP API routes so the web app and future agents can use the same server-side ledger surface. Protected routes require the wallet verification session cookie created by the wallet challenge / verify flow.

## Auth

- `POST /api/auth/wallet/challenge` — create a wallet verification challenge.
- `POST /api/auth/wallet/verify` — verify the signed challenge and set the session cookie.
- `GET /api/auth/wallet/session` — inspect the current wallet session.

## Groups

- `GET /api/groups?code={inviteCode}` — public invite-code lookup.
- `GET /api/groups?wallet={wallet}` — list Groups for the verified wallet.
- `POST /api/groups` — create a Group.
- `GET /api/groups/{groupId}` — load the Group dashboard snapshot for the verified wallet.
- `GET /api/groups/{groupId}/ledger` — load agent-ready ledger state: snapshot, Balances, suggested Settlements, and total settled volume.
- `POST /api/groups/{groupId}/members` — join a Group as the verified wallet.
- `PATCH /api/groups/{groupId}/treasury` — persist Fund Mode Treasury addresses.

## Expenses

- `GET /api/expenses?groupId={groupId}` — list Expenses with splits for a Group Member.
- `POST /api/expenses` — create an Expense in a Split Mode Group.
- `GET /api/expenses/{expenseId}` — load one Expense with splits for a Group Member.
- `PATCH /api/expenses/{expenseId}` — update an Expense as its creator.
- `DELETE /api/expenses/{expenseId}` — soft-delete an Expense as its creator.

## Settlements and Contributions

- `POST /api/settlements` — record an RPC-verified Settlement receipt.
- `GET /api/settlements/{settlementId}` — load a Settlement Receipt for a Group Member.
- `POST /api/contributions` — record an RPC-verified Fund Mode Contribution.

## Profile

- `POST /api/profile/display-name` — update the verified wallet's Profile Display Name.

## Notes for agents

- Do not call Supabase directly for ledger mutations.
- Do not attempt to execute Settlements or Contributions without a Member wallet confirmation; these routes only persist verified on-chain receipts after the wallet-signed transaction exists.
- Use `GET /api/groups/{groupId}/ledger` as the main read endpoint for Split Mode Balance and Settlement suggestions.
