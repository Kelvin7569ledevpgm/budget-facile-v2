-- À exécuter dans l'éditeur SQL Supabase après 002_profile_preferences_avatar.sql

-- ─── Objectifs d'épargne ─────────────────────────────────────────────────────
create table if not exists public.savings_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text,
  target_amount numeric not null check (target_amount > 0),
  saved_amount  numeric not null default 0 check (saved_amount >= 0),
  target_date   date,
  color       text not null default '#2dd4bf',
  emoji       text not null default '🎯',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists savings_goals_user_id_idx
  on public.savings_goals (user_id, created_at desc);

alter table public.savings_goals enable row level security;

create policy "Objectifs : tout pour le propriétaire"
  on public.savings_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Historique des contributions ────────────────────────────────────────────
create table if not exists public.savings_contributions (
  id       uuid primary key default gen_random_uuid(),
  goal_id  uuid not null references public.savings_goals on delete cascade,
  user_id  uuid not null references auth.users on delete cascade,
  amount   numeric not null check (amount > 0),
  note     text,
  date     date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists savings_contributions_goal_id_idx
  on public.savings_contributions (goal_id, date desc);

alter table public.savings_contributions enable row level security;

create policy "Contributions : tout pour le propriétaire"
  on public.savings_contributions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Fonction : mettre à jour saved_amount après chaque contribution ──────────
create or replace function public.sync_goal_saved_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.savings_goals
  set
    saved_amount = (
      select coalesce(sum(amount), 0)
      from public.savings_contributions
      where goal_id = coalesce(new.goal_id, old.goal_id)
    ),
    updated_at = now()
  where id = coalesce(new.goal_id, old.goal_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists on_contribution_change on public.savings_contributions;

create trigger on_contribution_change
  after insert or update or delete on public.savings_contributions
  for each row execute function public.sync_goal_saved_amount();
