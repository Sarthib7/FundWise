create table if not exists public.profiles (
  wallet text primary key,
  display_name text not null check (char_length(display_name) between 1 and 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Wallet-only MVP can create profiles" on public.profiles;
create policy "Wallet-only MVP can create profiles"
  on public.profiles for insert
  with check (true);

drop policy if exists "Wallet-only MVP can update profiles" on public.profiles;
create policy "Wallet-only MVP can update profiles"
  on public.profiles for update
  using (true)
  with check (true);
