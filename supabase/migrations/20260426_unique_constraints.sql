-- 20260426_unique_constraints.sql
-- Prevent duplicate settlements and enforce idempotency

-- Unique index on (group_id, settlement_id) prevents duplicate settlement creation
create unique index if not exists idx_settlements_unique
  on settlements(group_id, settlement_id text_pattern_ops);

-- Optional partial index for idempotency retry optimization
-- Allows fast lookup of pending settlements for replay
create index if not exists idx_settlements_pending
  on settlements(group_id, status)
  where status = 'pending';

-- Expense splits: ensure unique pair (expense_id, member_id)
alter table expense_splits
  add constraint unique_expense_member
  unique (expense_id, member_id);

-- Group members: ensure unique member per group (already implicit via PK, but explicit)
alter table group_members
  add constraint unique_member_per_group
  unique (group_id, member_id);
