# FundWise

A Solana-native expense-sharing app with two modes:

1. Split Mode: track shared expenses in a Group, compute live balances, and settle debts with on-chain USDC transfers.
2. Fund Mode: pool USDC into a shared Treasury and spend from it through Proposals and approvals.

## Language

**Group**:
A private collection of Members who share expenses or pool funds.
Avoid: Circle, team, squad, pool

**Split Mode**:
The primary MVP mode. Members log Expenses, view live Balances, and settle debts in USDC on Solana.
Avoid: Expense mode, bill-splitting mode

**Fund Mode**:
The secondary mode for pooled money. Members make Contributions into a Treasury and spend from it via Proposals.
Avoid: Treasury mode, pool mode, vault mode

**Expense**:
An off-chain record in a Split Mode Group describing who paid, how much, who participated, and how the amount is split.
Avoid: Bill, charge, transaction

**Settlement**:
An on-chain USDC transfer from a debtor Member to a creditor Member that reduces the debtor's current net Balance in the Group.
Avoid: Payment

**Settlement Request Link**:
A shareable deep link back into the Group that opens the debtor's current settleable state. The amount is resolved from the live Group Balance when the link is opened.
Avoid: Invoice, static payment link

**Contribution**:
A deposit of USDC into a Fund Mode Treasury by a Member.
Avoid: Deposit, payment

**Proposal**:
A request to spend from a Fund Mode Treasury. It includes recipient, amount, and memo, and requires approval before execution.
Avoid: Vote, request, withdrawal

**Member**:
A wallet address that has joined a Group. A Member is identified by their Solana public key and shown in the UI with a profile display name.
Avoid: User, participant, signer

**Profile Display Name**:
A human-readable label attached to a Member wallet and reused across Groups in the MVP. It is editable, but it is not the real identity key.
Avoid: Username, handle

**Stablecoin**:
USDC in the MVP. All Split Mode Expenses, Balances, Settlements, Contributions, and Proposals are denominated in USDC.
Avoid: Token, currency, coin

**Treasury**:
The on-chain USDC holding account for a Fund Mode Group. In the MVP direction, this is backed by a Squads multisig and related vault addresses.
Avoid: Wallet, pool

**Balance**:
A Member's net position inside a Split Mode Group. Positive means they are owed USDC. Negative means they owe USDC.
Avoid: Debt, credit, account

**Debtor**:
A Member with a negative Balance who can initiate and sign a Settlement.
Avoid: Payer, sender

**Creditor**:
A Member with a positive Balance who is owed USDC and receives Settlements and Receipts.
Avoid: Receiver, beneficiary

**Activity Feed**:
The Group timeline showing Expenses, lightweight Expense edit markers, Settlements, and Receipts. It is not a general-purpose chat.
Avoid: Chat, thread

**Receipt**:
A settlement confirmation view showing who paid whom, how much USDC moved, and the on-chain transaction signature.
Avoid: Notification, message

**Simplified Settlement Graph**:
The minimum set of debtor-to-creditor transfers needed to reduce Group Balances efficiently. Each suggested edge maps to one Settlement transfer.
Avoid: Optimized debts, minimum transfers

## Relationships

- A Group has exactly one mode: Split Mode or Fund Mode.
- A Group has many Members.
- A Member joins a Group by invite link or QR after connecting a Solana wallet.
- A Member has one wallet identity and one global profile display name in the MVP.
- In Split Mode, a Group has many Expenses and many Settlements.
- An Expense belongs to one Group, has one payer Member, and can be created by any Member in the Group.
- The payer on an Expense can be different from the Member who created the record.
- Only the Member who created an Expense can edit or delete it.
- Expense edits update the record in place and surface a simple "edited" signal in the Activity Feed.
- Expense edits or deletes are blocked once later Settlements would make the ledger inconsistent.
- A Balance is derived from all active Expenses and Settlements in the Group.
- Only a debtor Member can authorize and sign their own Settlement.
- Any Member can prompt or share a Settlement Request Link, but they cannot sign on behalf of another Member.
- A Settlement resolves against the debtor's current net Balance when opened, not a stale amount captured earlier.
- A Settlement is one on-chain USDC transfer from one debtor to one creditor.
- A creditor does not receive a payment prompt; they receive the updated Balance state and Receipt.
- In Fund Mode, a Group has one Treasury, many Contributions, and many Proposals.
- A Proposal spends Treasury USDC only after the required approvals are collected.

## Product invariants

- The web app is the source of truth for the MVP.
- Wallet-native auth only. No email/password and no social login in the MVP.
- USDC is the only settlement asset in the MVP.
- SOL is required for gas on Solana mainnet-beta.
- Split Mode is the primary product path for the hackathon MVP.
- Fund Mode remains separate from Split Mode and uses Treasury plus Proposal concepts, not direct Settlements.
- LI.FI is a secondary recovery path for topping up a Member's Solana wallet with USDC when they cannot settle.
- Zerion is a secondary intelligence layer in the MVP, not the primary auth or settlement layer.
- Telegram bot, Telegram mini app, wallet mini dapp, and AI chat are later distribution surfaces, not the MVP source of truth.

## Example dialogue

> Dev: "If I open a Settlement Request Link that was shared yesterday, do I pay the old amount or the current amount?"
> Domain expert: "The current settleable amount from the live Group Balance. The link deep-links into the Group state; it is not a static invoice."

> Dev: "If Alice is owed money, should she get a wallet prompt to settle?"
> Domain expert: "No. Only debtor Members with negative Balances see the Settle action. Creditors receive Receipts and updated balances."

> Dev: "Can Bob log an Expense even if Carol actually paid?"
> Domain expert: "Yes. Expenses are off-chain Group records. Any Member can log the Expense, and the payer can be any Member in the Group."

## Flagged ambiguities

- "Payment" was ambiguous between Split Mode and Fund Mode.
Resolved: use Settlement for Split Mode and Contribution for Fund Mode.

- "Notification" could mean push notifications, wallet notifications, or shared links.
Resolved: the MVP relies on shareable Settlement Request Links first. Push delivery can be added later.

- "Chat" was drifting into scope.
Resolved: the MVP has an Activity Feed only, not a real-time Group chat.

- "Multi-chain" was being used to describe both recovery and primary settlement.
Resolved: the MVP settles on Solana in USDC. LI.FI may help a debtor top up their Solana wallet, but the Settlement itself remains a Solana USDC transfer.

- "Embedded wallet" and "social login" were proposed as onboarding improvements.
Resolved: they stay on the roadmap, but wallet-native auth remains the MVP identity model.
