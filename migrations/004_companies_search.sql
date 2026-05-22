-- ============================================
-- Migration 004 : Recherche entreprises (SIRENE)
-- A executer dans Supabase SQL Editor
-- ============================================

ALTER TABLE search_results
  ADD COLUMN IF NOT EXISTS siret TEXT,
  ADD COLUMN IF NOT EXISTS siren TEXT,
  ADD COLUMN IF NOT EXISTS naf_code TEXT,
  ADD COLUMN IF NOT EXISTS naf_label TEXT,
  ADD COLUMN IF NOT EXISTS creation_date DATE,
  ADD COLUMN IF NOT EXISTS legal_form TEXT,
  ADD COLUMN IF NOT EXISTS employees_range TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'google_places';

-- Index pour requetes par date de creation
CREATE INDEX IF NOT EXISTS idx_results_creation_date
  ON search_results(user_id, creation_date DESC)
  WHERE creation_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_results_siret
  ON search_results(siret)
  WHERE siret IS NOT NULL;

-- Index sur la source pour separer les recherches
CREATE INDEX IF NOT EXISTS idx_results_source
  ON search_results(search_id, source);

-- Tracker le mode de recherche utilise sur chaque recherche
ALTER TABLE searches
  ADD COLUMN IF NOT EXISTS search_mode TEXT DEFAULT 'places'
    CHECK (search_mode IN ('places', 'companies')),
  ADD COLUMN IF NOT EXISTS filter_creation_date_max INTEGER, -- en mois (ex: 6 = ≤ 6 mois)
  ADD COLUMN IF NOT EXISTS filter_legal_form TEXT,
  ADD COLUMN IF NOT EXISTS filter_name_query TEXT;
