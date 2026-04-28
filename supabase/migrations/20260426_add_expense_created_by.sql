do $migration$
begin
  if to_regclass('public.expenses') is null then
    return;
  end if;

  execute 'alter table public.expenses add column if not exists created_by text';
  execute 'update public.expenses set created_by = payer where created_by is null';
  execute 'alter table public.expenses alter column created_by set not null';
end;
$migration$;
