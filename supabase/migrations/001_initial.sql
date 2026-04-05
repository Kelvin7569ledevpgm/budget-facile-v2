-- Exécuter ce script dans l’éditeur SQL Supabase (SQL → New query) une fois le projet créé.

-- Profil utilisateur (créé automatiquement à l’inscription)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Lecture du profil personnel"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Mise à jour du profil personnel"
  on public.profiles for update
  using (auth.uid() = id);

-- Transactions (synchronisées entre appareils)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text not null,
  category text not null,
  date date not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  account text not null,
  status text not null check (status in ('completed', 'pending')),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_date_idx
  on public.transactions (user_id, date desc);

alter table public.transactions enable row level security;

create policy "Transactions : tout pour le propriétaire"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Profil créé à chaque nouvel utilisateur Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
