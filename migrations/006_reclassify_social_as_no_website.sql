-- ============================================
-- Migration 006 : Reclassement des "faux" sites web
-- A executer dans Supabase SQL Editor
-- ============================================
--
-- Google Places renvoie un websiteUri pour des entreprises qui n'ont en
-- realite qu'une page Facebook / Instagram / Linktree / fiche annuaire.
-- Elles etaient classees "avec site web" et donc invisibles dans la liste
-- de prospects, alors que ce sont les meilleures cibles.
--
-- Le code applique desormais cette regle sur les nouvelles recherches
-- (src/lib/website-classifier.ts). Cette migration corrige l'historique.
--
-- Constate le 2026-09-14 : 388 lignes sur 6468 concernees (~6 %).
--
-- Les lignes gardent leur website_url : l'app affiche "Facebook uniquement"
-- avec le lien. Seul has_website passe a false.

-- Verification avant (optionnel, a lancer seul pour voir le volume) :
--   SELECT COUNT(*) FROM search_results
--   WHERE has_website = true AND website_url ~* '<le motif ci-dessous>';

UPDATE public.search_results
SET has_website = false
WHERE has_website = true
  AND website_url ~* '^(https?://)?([a-z0-9_-]+\.)*(facebook\.com|facebook\.fr|fb\.com|fb\.me|instagram\.com|instagr\.am|linkedin\.com|twitter\.com|x\.com|tiktok\.com|youtube\.com|youtu\.be|pinterest\.com|pinterest\.fr|snapchat\.com|threads\.net|threads\.com|vk\.com|wa\.me|whatsapp\.com|t\.me|telegram\.me|linktr\.ee|beacons\.ai|bio\.link|lnk\.bio|taplink\.cc|campsite\.bio|allmylinks\.com|msha\.ke|pagesjaunes\.fr|pagesjaunes\.com|business\.site|maps\.google\.com|maps\.app\.goo\.gl|yelp\.fr|yelp\.com|tripadvisor\.fr|tripadvisor\.com|thefork\.fr|lafourchette\.com|ubereats\.com|deliveroo\.fr|just-eat\.fr|doctolib\.fr|booking\.com|airbnb\.fr|airbnb\.com|wanadoo\.fr|free\.fr)([/:?#]|$)';

-- Meme correction sur les prospects deja enregistres dans le CRM
-- (la colonne prospects.website_url existe, il n'y a pas de has_website :
--  rien a faire cote CRM, la fiche detail se base sur l'URL elle-meme).

-- Recalcul du compteur affiche dans l'historique
UPDATE public.searches s
SET no_website_count = sub.cnt
FROM (
  SELECT search_id, COUNT(*) AS cnt
  FROM public.search_results
  WHERE has_website = false
  GROUP BY search_id
) sub
WHERE s.id = sub.search_id
  AND s.no_website_count IS DISTINCT FROM sub.cnt;
