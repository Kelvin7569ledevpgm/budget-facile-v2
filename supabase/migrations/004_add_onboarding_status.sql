-- Migration: Ajout du statut d'onboarding au profil utilisateur
-- À exécuter dans l'éditeur SQL Supabase

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;
