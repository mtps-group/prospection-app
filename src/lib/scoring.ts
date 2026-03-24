import type { SearchResultClient } from '@/types';

// Secteurs avec fort potentiel de conversion
const HIGH_PRIORITY_SECTORS = [
  'plombier', 'plomberie', 'electricien', 'électricien', 'electricite', 'électricité',
  'maçon', 'macon', 'maçonnerie', 'maconnerie', 'menuisier', 'menuiserie',
  'chauffagiste', 'chauffage', 'couvreur', 'toiture', 'peintre', 'peinture',
  'carreleur', 'carrelage', 'serrurier', 'serrurerie', 'vitrier', 'vitrerie',
  'climatisation', 'climatiseur',
];

const MEDIUM_PRIORITY_SECTORS = [
  'coiffeur', 'coiffure', 'esthétique', 'esthetique', 'salon', 'barbier',
  'restaurant', 'brasserie', 'bistrot', 'café', 'cafe', 'boulangerie',
  'pâtisserie', 'patisserie', 'fleuriste', 'boucher', 'boucherie',
  'garagiste', 'garage', 'auto', 'carrosserie',
];

export interface ProspectScore {
  total: number;       // 0-100
  label: string;       // "Priorité haute", "Bon prospect", etc.
  color: string;       // Tailwind color class
  emoji: string;
  details: ScoreDetail[];
}

interface ScoreDetail {
  label: string;
  points: number;
  maxPoints: number;
  description: string;
}

export function computeScore(result: SearchResultClient): ProspectScore {
  const details: ScoreDetail[] = [];
  let total = 0;

  // ── 1. Note Google (20 pts) ──────────────────────
  let notePoints = 0;
  let noteDesc = 'Pas de note';
  if (result.rating) {
    if (result.rating >= 3.5 && result.rating <= 4.2) {
      notePoints = 20;
      noteDesc = `${result.rating.toFixed(1)} ★ — sweet spot idéal`;
    } else if (result.rating > 4.2 && result.rating <= 4.7) {
      notePoints = 15;
      noteDesc = `${result.rating.toFixed(1)} ★ — bonne réputation`;
    } else if (result.rating > 4.7) {
      notePoints = 10;
      noteDesc = `${result.rating.toFixed(1)} ★ — très établi`;
    } else if (result.rating >= 3.0) {
      notePoints = 10;
      noteDesc = `${result.rating.toFixed(1)} ★ — réputation passable`;
    } else {
      notePoints = 5;
      noteDesc = `${result.rating.toFixed(1)} ★ — mauvaise réputation`;
    }
  } else {
    notePoints = 8;
    noteDesc = 'Pas encore noté — nouveau sur Google';
  }
  details.push({ label: 'Note Google', points: notePoints, maxPoints: 20, description: noteDesc });
  total += notePoints;

  // ── 2. Nombre d'avis (20 pts) ───────────────────
  let avisPoints = 0;
  let avisDesc = 'Aucun avis';
  const count = result.user_rating_count || 0;
  if (count >= 15 && count <= 150) {
    avisPoints = 20;
    avisDesc = `${count} avis — volume idéal`;
  } else if (count > 150 && count <= 300) {
    avisPoints = 15;
    avisDesc = `${count} avis — très actif`;
  } else if (count > 300) {
    avisPoints = 10;
    avisDesc = `${count} avis — très établi, moins facile à convertir`;
  } else if (count >= 5) {
    avisPoints = 12;
    avisDesc = `${count} avis — débutant`;
  } else if (count >= 1) {
    avisPoints = 8;
    avisDesc = `${count} avis — très peu d'avis`;
  } else {
    avisPoints = 5;
    avisDesc = 'Aucun avis — difficile à évaluer';
  }
  details.push({ label: "Nombre d'avis", points: avisPoints, maxPoints: 20, description: avisDesc });
  total += avisPoints;

  // ── 3. Téléphone (10 pts) ────────────────────────
  const hasPhone = !!result.phone_national;
  const phonePoints = hasPhone ? 10 : 0;
  details.push({
    label: 'Téléphone',
    points: phonePoints,
    maxPoints: 10,
    description: hasPhone ? 'Numéro disponible — contact facile' : 'Pas de numéro renseigné',
  });
  total += phonePoints;

  // ── 4. Adresse complète (10 pts) ─────────────────
  const hasAddress = !!result.formatted_address && result.formatted_address.length > 10;
  const addressPoints = hasAddress ? 10 : 0;
  details.push({
    label: 'Adresse',
    points: addressPoints,
    maxPoints: 10,
    description: hasAddress ? 'Adresse complète' : 'Adresse manquante',
  });
  total += addressPoints;

  // ── 5. Secteur d'activité (20 pts) ───────────────
  let sectorPoints = 10;
  let sectorDesc = 'Secteur standard';
  const typeStr = (result.business_type || '').toLowerCase();
  const nameStr = (result.business_name || '').toLowerCase();
  const combined = `${typeStr} ${nameStr}`;

  if (HIGH_PRIORITY_SECTORS.some(s => combined.includes(s))) {
    sectorPoints = 20;
    sectorDesc = 'Artisan / urgences — fort potentiel';
  } else if (MEDIUM_PRIORITY_SECTORS.some(s => combined.includes(s))) {
    sectorPoints = 16;
    sectorDesc = 'Secteur porteur';
  }
  details.push({ label: "Secteur d'activité", points: sectorPoints, maxPoints: 20, description: sectorDesc });
  total += sectorPoints;

  // ── 6. Score combiné note × avis (20 pts) ────────
  let comboPoints = 0;
  let comboDesc = 'Données insuffisantes';
  if (result.rating && result.user_rating_count) {
    if (result.rating >= 3.5 && result.user_rating_count >= 20) {
      comboPoints = 20;
      comboDesc = 'Entreprise active et bien notée';
    } else if (result.rating >= 3.5 && result.user_rating_count >= 5) {
      comboPoints = 14;
      comboDesc = 'Bonne note, activité modérée';
    } else if (result.user_rating_count >= 10) {
      comboPoints = 10;
      comboDesc = 'Actif mais note perfectible';
    } else {
      comboPoints = 6;
      comboDesc = 'Activité faible';
    }
  } else {
    comboPoints = 5;
  }
  details.push({ label: 'Activité globale', points: comboPoints, maxPoints: 20, description: comboDesc });
  total += comboPoints;

  // ── Label & couleur ──────────────────────────────
  let label: string;
  let color: string;
  let emoji: string;

  if (total >= 80) {
    label = 'Priorité haute';
    color = 'text-red-600 bg-red-50 border-red-200';
    emoji = '🔥';
  } else if (total >= 65) {
    label = 'Bon prospect';
    color = 'text-orange-600 bg-orange-50 border-orange-200';
    emoji = '⚡';
  } else if (total >= 45) {
    label = 'Prospect moyen';
    color = 'text-blue-600 bg-blue-50 border-blue-200';
    emoji = '📊';
  } else {
    label = 'Faible potentiel';
    color = 'text-gray-500 bg-gray-50 border-gray-200';
    emoji = '💤';
  }

  return { total, label, color, emoji, details };
}
