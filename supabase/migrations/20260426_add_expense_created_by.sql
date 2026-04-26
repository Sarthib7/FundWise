alter table public.expenses
add column if not exists created_by text;

update public.expenses
set created_by = payer
where created_by is null;

alter table public.expenses
alter column created_by set not null;
