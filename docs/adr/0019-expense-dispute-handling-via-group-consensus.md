# Expense Dispute Handling via Group Consensus

Members can flag any Expense for dispute. Disputed expenses are excluded from balance math until the Group resolves the dispute through transparent voting. No admin or moderator — consensus decides. This aligns with FundWise's wallet-native, no-roles model while preventing one member's bad expense entry from forcing others into unfair settlements.

## Key decisions

- **Disputes target Expenses, not Settlements.** Settlements are on-chain and irreversible. The leverage point is before money moves.
- **Flagging is instant.** Any Member flags an Expense with a reason. Flagged expense is excluded from balance computation immediately.
- **Consensus vote, not governance.** Other Members vote uphold or dismiss. Simple majority of non-creator Members wins. No admin role, no on-chain governance, no token-weighted voting.
- **Creator self-resolve.** The expense creator can edit or delete the expense at any time during the dispute, which auto-resolves it.
- **On-chain stays clean.** Disputes are off-chain metadata. The only on-chain effect is that disputed expenses are excluded from the simplified settlement graph, so no one is prompted to settle a contested amount.
- **Full history.** Dispute creation, votes, and resolution are visible in the Activity Feed alongside expenses and settlements.

## Schema (planned)

```sql
-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  filed_by TEXT NOT NULL, -- wallet address
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'upheld', 'dismissed', 'resolved_by_edit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Dispute votes
CREATE TABLE dispute_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('uphold', 'dismiss')),
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dispute_id, voter_wallet)
);
```

## UX flow (planned)

1. Member clicks "Dispute" on any Expense in the Activity Feed
2. Modal: pick reason (wrong amount, wasn't there, duplicate, other) + free text
3. Expense gets a "Disputed" badge and is excluded from balance math
4. Other Members see the dispute in the Activity Feed and vote
5. Majority non-creator vote resolves it:
   - Uphold → expense frozen permanently, never re-enters balances
   - Dismiss → dispute closed, expense re-enters balances
6. Creator can also edit/delete the expense to auto-resolve

## Balance computation change

`computeBalancesFromActivity` must skip expenses where an open or upheld dispute exists. Only fully dismissed or resolved-by-edit disputes allow the expense back into the balance graph.

## Why not on-chain governance

On-chain governance (token-weighted voting, proposal contracts) adds complexity without matching the product. Groups are small (3-10 people). A simple off-chain majority vote is sufficient, fast, and doesn't require gas. If Fund Mode later needs on-chain proposal execution, that uses the existing Squads multisig flow — separate from expense disputes.

## Post-hackathon scope

This is not part of the Colosseum Frontier MVP. Build after Split Mode + LI.FI are polished and live on mainnet-beta. Priority is below Fund Mode proposals but above Telegram bot.
