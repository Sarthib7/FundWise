alter table public.groups
  add column if not exists group_template text;

alter table public.groups
  drop constraint if exists groups_group_template_check;

alter table public.groups
  add constraint groups_group_template_check
  check (
    group_template is null
    or group_template in ('trip_pool', 'friend_fund', 'dao_grant', 'family_budget')
  );
