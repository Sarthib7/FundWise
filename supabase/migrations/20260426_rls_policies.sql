-- 20260426_rls_policies.sql
-- Row Level Security policies for member-scoped access

-- Expenses: members can read/write their group expenses only
alter table expenses enable row level security;
drop policy if exists "Group members can CRUD expenses" on expenses;
create policy "Group members can CRUD expenses" on expenses
  for all
  using (
    exists (
      select 1 from groups g
      join group_members gm on g.id = gm.group_id
      where g.id = expenses.group_id
        and gm.member_id = auth.uid()::uuid
    )
  );

-- Settlements: members can read their group settlements; write via EF only
alter table settlements enable row level security;
drop policy if exists "Group members can read settlements" on settlements;
create policy "Group members can read settlements" on settlements
  for select
  using (
    exists (
      select 1 from groups g
      join group_members gm on g.id = gm.group_id
      where g.id = settlements.group_id
        and gm.member_id = auth.uid()::uuid
    )
  );

-- Contributions (Fund Mode): members can read their group contributions; write via EF only
alter table contributions enable row level security;
drop policy if exists "Group members can read contributions" on contributions;
create policy "Group members can read contributions" on contributions
  for select
  using (
    exists (
      select 1 from groups g
      join group_members gm on g.id = gm.group_id
      where g.id = contributions.group_id
        and gm.member_id = auth.uid()::uuid
    )
  );

-- Members: users can read all members (for dropdowns), but only update own row
alter table members enable row level security;
drop policy if exists "Members are public readable" on members;
create policy "Members are public readable" on members
  for select using (true);

drop policy if exists "Members can update self" on members;
create policy "Members can update self" on members
  for update using (auth.uid()::uuid = id);

-- Groups: members can CRUD groups they belong to
alter table groups enable row level security;
drop policy if exists "Group members can CRUD groups" on groups;
create policy "Group members can CRUD groups" on groups
  for all
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = groups.id
        and gm.member_id = auth.uid()::uuid
    )
  );
