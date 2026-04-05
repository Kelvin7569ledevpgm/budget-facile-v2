-- Migration: Ajout d'une fonction RPC pour permettre à l'utilisateur de supprimer son propre compte
-- À exécuter dans l'éditeur SQL Supabase

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Supprime l'utilisateur de la table interne auth.users
  -- Grâce à la contrainte "on delete cascade" sur profiles.id, 
  -- le profil et les données liées dans public sont automatiquement supprimés.
  delete from auth.users where id = auth.uid();
end;
$$;

-- Ajout d'un commentaire pour documentation
comment on function public.delete_user() is 'Permet à l''utilisateur authentifié de supprimer son compte d''authentification et toutes ses données liées (via cascade).';
