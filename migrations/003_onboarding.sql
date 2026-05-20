-- ============================================
-- Migration 003 : Onboarding flow
-- A executer dans Supabase SQL Editor
-- ============================================

-- 1. Colonne onboarding_completed sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_persona TEXT;

-- 2. IMPORTANT : marquer les users existants comme deja onboardes
-- (pour qu'ils ne voient pas la modale au prochain login)
UPDATE profiles
  SET onboarding_completed = true
  WHERE onboarding_completed = false
    AND created_at < NOW();

COMMENT ON COLUMN profiles.onboarding_completed IS 'true quand l user a termine ou skip le tour d''accueil';
COMMENT ON COLUMN profiles.onboarding_persona IS 'persona choisie : web_design, seo, smm, b2b, autre';
