# FundWise

A Solana-native expense-sharing app with two modes: split expenses with friends (Split Mode) and pool money into shared treasuries with proposal-based spending (Fund Mode).

## Language

**Group**:
A collection of members who share expenses or pool funds. Created by one member, joined by others via invite code or QR.
*Avoid*: Circle, team, squad, pool

**Split Mode**:
Track who paid for what in a group, compute who owes whom, and settle debts with one-click stablecoin transfers.
*Avoid*: Expense mode, bill-splitting mode

**Fund Mode**:
Pool stablecoins into a shared treasury upfront and spend from it via threshold-approved proposals.
*Avoid*: Treasury mode, pool mode, vault mode

**Expense**:
A single line item logged in a Split Mode group — who paid, how much, who participates, and how it's split.
*Avoid*: Bill, charge, transaction (when referring to off-chain record)

**Settlement**:
An on-chain SPL token transfer from a debtor to a creditor that zeroes out (or reduces) a balance. The tx signature is recorded as proof.
*Avoid*: Payment (ambiguous — also used for Fund Mode contributions)

**Contribution**:
A deposit of stablecoins into a Fund Mode treasury by a member.
*Avoid*: Deposit, payment (ambiguous)

**Proposal**:
A request to spend from a Fund Mode treasury — specifies recipient, amount, and memo. Approved via threshold vote.
*Avoid*: Vote, request, withdrawal

**Member**:
A wallet address that has joined a group. Identified by their Solana public key; may have a display name.
*Avoid*: User (too generic), participant, signer

**Stablecoin**:
An SPL token with approximately $1 USD value (USDC, USDT, PYUSD). The group's unit of account for all expenses, settlements, contributions, and proposals.
*Avoid*: Token (ambiguous), currency, coin

**Treasury**:
The on-chain vault holding a Fund Mode group's pooled stablecoins. Implemented as a Squads multisig vault (MVP) or custom Anchor program (future).
*Avoid*: Wallet (ambiguous), pool, vault (unless referring to Squads vault specifically)

**Balance**:
A member's net position in a Split Mode group — positive means they are owed, negative means they owe.
*Avoid*: Debt (only the negative part), credit, account

**Simplified Settlement Graph**:
The minimum set of transfers needed to zero out all balances in a group. Computed from raw balances.
*Avoid*: Optimized debts, minimum transfers

## Relationships

- A **Group** has one mode: **Split Mode** or **Fund Mode** (set at creation, not changeable)
- A **Group** has many **Members** (2–15 people)
- In Split Mode: A **Group** has many **Expenses** and many **Settlements**
- An **Expense** belongs to one **Group**, has one payer **Member**, and is split among participant **Members**
- A **Settlement** is an on-chain transfer from one **Member** to another, linked to the **Group**
- In Fund Mode: A **Group** has one **Treasury** and many **Proposals**
- A **Contribution** is an on-chain deposit from a **Member** to the **Treasury**
- A **Proposal** specifies a recipient, amount, and requires threshold approval before the **Treasury** releases funds

## Example dialogue

> **Dev:** "When a **Member** adds an **Expense** in **Split Mode**, does it create an on-chain **Settlement**?"
> **Domain expert:** "No — the **Expense** is off-chain metadata. The **Settlement** only happens when someone explicitly settles their **Balance** by sending **Stablecoins** on-chain."

> **Dev:** "Can a **Group** switch from **Split Mode** to **Fund Mode** later?"
> **Domain expert:** "No — the mode is set at creation. They'd need to create a new **Group**."

## Flagged ambiguities

- "Payment" was used to mean both **Settlement** (Split Mode) and **Contribution** (Fund Mode) — resolved: these are distinct concepts with separate terms.
- "Circle" was the old term from Fund Flow — resolved: renamed to **Group** to match Splitwise mental model.