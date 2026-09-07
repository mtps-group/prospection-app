-- ============================================
-- Migration 005 : Durcissement securite
-- A executer dans Supabase SQL Editor
-- ============================================

-- 1. profiles : un utilisateur ne doit pas pouvoir modifier son propre plan
--    ni son compteur de recherches via la cle anon (l'ancienne policy UPDATE
--    autorisait toutes les colonnes -> passage en plan agence gratuit possible).
--    On restreint les colonnes modifiables par un utilisateur authentifie.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  full_name,
  avatar_url,
  notion_token,
  notion_database_id,
  google_sheets_refresh_token,
  onboarding_completed,
  onboarding_persona,
  updated_at
) ON public.profiles TO authenticated;

-- 2. Compteur de recherches atomique (appele par le serveur uniquement).
--    Remplace le read-modify-write qui permettait de contourner le quota
--    gratuit avec des requetes paralleles.
CREATE OR REPLACE FUNCTION public.increment_search_count(uid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET total_searches_used = total_searches_used + 1,
      updated_at = NOW()
  WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.increment_search_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_search_count(UUID) TO service_role;

-- 3. export_jobs : la table a ete creee a la main SANS Row Level Security.
--    Constate le 2026-09-03 : lisible et modifiable avec la cle anon.
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own export jobs" ON public.export_jobs;
CREATE POLICY "Users can view own export jobs"
  ON public.export_jobs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own export jobs" ON public.export_jobs;
CREATE POLICY "Users can insert own export jobs"
  ON public.export_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own export jobs" ON public.export_jobs;
CREATE POLICY "Users can delete own export jobs"
  ON public.export_jobs FOR DELETE USING (auth.uid() = user_id);

-- 4. searches : la policy UPDATE manquait -> l'update de no_website_count
--    par /api/companies/search matchait 0 ligne en silence.
DROP POLICY IF EXISTS "Users can update own searches" ON public.searches;
CREATE POLICY "Users can update own searches"
  ON public.searches FOR UPDATE USING (auth.uid() = user_id);
