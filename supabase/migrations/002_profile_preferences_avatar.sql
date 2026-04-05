-- À exécuter dans l’éditeur SQL Supabase après 001_initial.sql

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Bucket photos de profil (public = URL directe pour <img src>)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Politiques Storage : dossier = user id (premier segment du chemin)
create policy "Lecture publique avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Upload avatar dossier utilisateur"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Mise à jour avatar dossier utilisateur"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Suppression avatar dossier utilisateur"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
