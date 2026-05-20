-- ============================================
-- Migration 002 : CRM complet
-- A executer dans Supabase SQL Editor en une fois
-- ============================================

-- 1. Nouveau statut "rdv_pris"
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;
ALTER TABLE prospects ADD CONSTRAINT prospects_status_check
  CHECK (status IN ('a_contacter', 'contacte', 'interesse', 'rdv_pris', 'signe', 'pas_interesse'));

-- 2. Colonnes pour tracking RDV / signature / relance
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS meeting_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meeting_notes TEXT,
  ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lost_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;

-- 3. Event log : chaque transition est tracée
CREATE TABLE IF NOT EXISTS prospect_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'status_changed', 'meeting_booked', 'signed', 'lost', 'note_added', 'tag_added', 'tag_removed'
  )),
  from_status TEXT,
  to_status TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE prospect_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own events" ON prospect_events;
CREATE POLICY "Users can view own events"
  ON prospect_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON prospect_events;
CREATE POLICY "Users can insert own events"
  ON prospect_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON prospect_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_prospect_id ON prospect_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON prospect_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_created ON prospect_events(user_id, created_at DESC);

-- 4. Tags personnalises par user
CREATE TABLE IF NOT EXISTS prospect_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, label)
);

ALTER TABLE prospect_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tags" ON prospect_tags;
CREATE POLICY "Users can view own tags"
  ON prospect_tags FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tags" ON prospect_tags;
CREATE POLICY "Users can manage own tags"
  ON prospect_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON prospect_tags(user_id);

-- 5. Assignations tag <-> prospect (many-to-many)
CREATE TABLE IF NOT EXISTS prospect_tag_assignments (
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES prospect_tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (prospect_id, tag_id)
);

ALTER TABLE prospect_tag_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tag assignments" ON prospect_tag_assignments;
CREATE POLICY "Users can view own tag assignments"
  ON prospect_tag_assignments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own tag assignments" ON prospect_tag_assignments;
CREATE POLICY "Users can manage own tag assignments"
  ON prospect_tag_assignments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_prospect_id ON prospect_tag_assignments(prospect_id);
CREATE INDEX IF NOT EXISTS idx_assignments_tag_id ON prospect_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON prospect_tag_assignments(user_id);

-- 6. Index utile pour rappels (RDV / relance)
CREATE INDEX IF NOT EXISTS idx_prospects_meeting_date ON prospects(user_id, meeting_date)
  WHERE meeting_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospects_followup ON prospects(user_id, next_followup_at)
  WHERE next_followup_at IS NOT NULL;
