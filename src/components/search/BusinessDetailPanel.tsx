'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { fr } from '@/i18n/fr';
import {
  X,
  Phone,
  MapPin,
  Star,
  Clock,
  Camera,
  MessageSquare,
  Globe,
  ExternalLink,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Copy,
  Check,
  Mail,
  Loader2,
  Search,
  TrendingUp,
  UserCircle,
  Sparkles,
  FileText,
  Send,
  AtSign,
} from 'lucide-react';
import { computeScore } from '@/lib/scoring';
import type { SearchResultClient } from '@/types';

interface BusinessDetailPanelProps {
  placeId: string;
  businessName: string;
  city?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  result?: SearchResultClient;
  onClose: () => void;
}

interface PlaceDetailPhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  photoUrl?: string;
  authorAttributions?: Array<{ displayName: string }>;
}

interface PlaceDetailReview {
  name: string;
  rating: number;
  text?: { text: string; languageCode: string };
  authorAttribution?: { displayName: string };
  publishTime: string;
  relativePublishTimeDescription: string;
}

interface PlaceDetail {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  reviews?: PlaceDetailReview[];
  photos?: PlaceDetailPhoto[];
  editorialSummary?: { text: string; languageCode: string };
  businessStatus?: string;
  isUltra?: boolean;
}

export function BusinessDetailPanel({
  placeId,
  businessName,
  city,
  hasWebsite,
  websiteUrl,
  result,
  onClose,
}: BusinessDetailPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Ultra AI states
  const [aiEmail, setAiEmail] = useState<string | null>(null);
  const [aiEmailLoading, setAiEmailLoading] = useState(false);
  const [aiEmailError, setAiEmailError] = useState<string | null>(null);
  const [aiDirigeant, setAiDirigeant] = useState<string | null>(null);
  const [aiDirigeantLoading, setAiDirigeantLoading] = useState(false);
  const [aiDirigeantError, setAiDirigeantError] = useState<string | null>(null);
  const [aiSiret, setAiSiret] = useState<string | null>(null);
  const [aiSiretLoading, setAiSiretLoading] = useState(false);
  const [aiSiretError, setAiSiretError] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Ultra AI functions ────────────────────────────────────────────────────
  const buildAiPayload = () => ({
    businessName,
    city: city || extractCityFromAddress(detail?.formattedAddress || ''),
    activite: detail?.types?.[0] || '',
    rating: detail?.rating || result?.rating,
    userRatingCount: detail?.userRatingCount || result?.user_rating_count,
    address: detail?.formattedAddress || undefined,
    phone: detail?.nationalPhoneNumber || undefined,
    hasWebsite: hasWebsite ?? false,
    websiteUrl: websiteUrl || detail?.websiteUri || undefined,
  });

  const searchAiEmail = async () => {
    setAiEmail(null);
    setAiEmailError(null);
    setAiEmailLoading(true);
    const timeout = setTimeout(() => {
      setAiEmailLoading(false);
      setAiEmailError('Délai dépassé (> 45s). Réessayez.');
    }, 45000);
    try {
      const res = await fetch('/api/ai-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email', ...buildAiPayload() }),
      });
      const data = await res.json();
      if (res.ok) setAiEmail(data.content);
      else setAiEmailError(data.error || 'Erreur lors de la recherche');
    } catch {
      setAiEmailError('Erreur de connexion');
    } finally {
      clearTimeout(timeout);
      setAiEmailLoading(false);
    }
  };

  const searchDirigeant = async () => {
    setAiDirigeant(null);
    setAiDirigeantError(null);
    setAiDirigeantLoading(true);
    const timeout = setTimeout(() => {
      setAiDirigeantLoading(false);
      setAiDirigeantError('Délai dépassé (> 45s). Réessayez.');
    }, 45000);
    try {
      const res = await fetch('/api/ai-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dirigeant', ...buildAiPayload() }),
      });
      const data = await res.json();
      if (res.ok) setAiDirigeant(data.content);
      else setAiDirigeantError(data.error || 'Erreur lors de la recherche');
    } catch {
      setAiDirigeantError('Erreur de connexion');
    } finally {
      clearTimeout(timeout);
      setAiDirigeantLoading(false);
    }
  };

  const searchSiret = async () => {
    setAiSiret(null);
    setAiSiretError(null);
    setAiSiretLoading(true);
    const timeout = setTimeout(() => {
      setAiSiretLoading(false);
      setAiSiretError('Délai dépassé (> 15s). Réessayez.');
    }, 15000);
    try {
      const res = await fetch('/api/ai-enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'siret', ...buildAiPayload() }),
      });
      const data = await res.json();
      if (res.ok) setAiSiret(data.content);
      else setAiSiretError(data.error || 'Erreur lors de la recherche');
    } catch {
      setAiSiretError('Erreur de connexion');
    } finally {
      clearTimeout(timeout);
      setAiSiretLoading(false);
    }
  };

  // Extrait la ville depuis une adresse formatée française
  function extractCityFromAddress(address: string): string {
    // Ex: "12 Rue de la Paix, 75001 Paris, France" → "Paris"
    const parts = address.split(',');
    if (parts.length >= 2) {
      const cityPart = parts[parts.length - 2].trim();
      // Enlève le code postal si présent
      return cityPart.replace(/^\d{5}\s*/, '').trim();
    }
    return address;
  }

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      setDetail(null);
      // Réinitialiser les résultats IA au changement de fiche
      setAiEmail(null);
      setAiEmailError(null);
      setAiDirigeant(null);
      setAiDirigeantError(null);
      setAiSiret(null);
      setAiSiretError(null);

      try {
        const res = await fetch(`/api/place-details?placeId=${encodeURIComponent(placeId)}`, { signal });
        const data = await res.json();
        if (signal.aborted) return;
        if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement');
        setDetail(data);
        setLoading(false);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
        setLoading(false);
      }
    }

    fetchAll();

    // Annule les requêtes en cours si placeId change ou si le composant est démonté
    return () => controller.abort();
  }, [placeId, businessName, city]);

  const getBusinessStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'OPERATIONAL':
        return { label: fr.detail.operational, icon: CheckCircle, color: 'text-green-600' };
      case 'CLOSED_TEMPORARILY':
        return { label: fr.detail.closedTemporarily, icon: AlertTriangle, color: 'text-amber-600' };
      case 'CLOSED_PERMANENTLY':
        return { label: fr.detail.closedPermanently, icon: XCircle, color: 'text-red-600' };
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-xl bg-white shadow-2xl overflow-y-auto animate-[slide-in-from-right_0.3s_ease-out]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
            <h2 className="text-lg font-bold text-text truncate">{businessName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && <DetailSkeleton />}

          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
              <p className="text-text-secondary">{error}</p>
            </div>
          )}

          {/* Score de priorité */}
          {result && !hasWebsite && (
            (() => {
              const score = computeScore(result);
              return (
                <section className={`rounded-xl border p-4 ${score.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      Score de priorité
                    </h3>
                    <div className="flex items-center gap-1.5 font-bold text-lg">
                      <span>{score.emoji}</span>
                      <span>{score.total}/100</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold mb-3">{score.label}</p>
                  <div className="space-y-2">
                    {score.details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between text-xs">
                        <span className="opacity-80">{d.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="opacity-60 text-right max-w-[140px] truncate">{d.description}</span>
                          <span className="font-bold w-10 text-right">{d.points}/{d.maxPoints}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })()
          )}

          {detail && !loading && (
            <>
              {/* Bannière Ultra si pas Ultra */}
              {!detail.isUltra && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Photos & avis disponibles en Ultra</p>
                    <p className="text-xs text-amber-600">Passez au plan Ultra pour voir les photos et les avis clients.</p>
                  </div>
                </div>
              )}

              {/* Photos carousel */}
              {detail.photos && detail.photos.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                    <Camera className="h-4 w-4 text-text-muted" />
                    {fr.detail.photos}
                  </h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {detail.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden bg-gray-100"
                      >
                        {photo.photoUrl ? (
                          <img
                            src={photo.photoUrl}
                            alt={`${businessName} photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted">
                            <Camera className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Editorial Summary */}
              {detail.editorialSummary?.text && (
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                    <Building2 className="h-4 w-4 text-text-muted" />
                    {fr.detail.presentation}
                  </h3>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {detail.editorialSummary.text}
                    </p>
                  </div>
                </section>
              )}

              {/* Business Status */}
              {detail.businessStatus && (() => {
                const statusInfo = getBusinessStatusLabel(detail.businessStatus);
                if (!statusInfo) return null;
                const StatusIcon = statusInfo.icon;
                return (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                      {fr.detail.statut}
                    </h3>
                    <div className={`flex items-center gap-2 text-sm ${statusInfo.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="font-medium">{statusInfo.label}</span>
                    </div>
                  </section>
                );
              })()}

              {/* Contact Info */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                  <Phone className="h-4 w-4 text-text-muted" />
                  {fr.detail.coordonnees}
                </h3>
                <div className="space-y-2">
                  {/* Nom */}
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Building2 className="h-4 w-4 flex-shrink-0 text-text-muted" />
                      <span className="font-medium text-text truncate">{businessName}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(businessName, 'name')}
                      className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Copier"
                    >
                      {copiedField === 'name'
                        ? <Check className="h-3.5 w-3.5 text-green-600" />
                        : <Copy className="h-3.5 w-3.5 text-text-muted" />}
                    </button>
                  </div>

                  {/* Adresse */}
                  {detail.formattedAddress && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex items-start gap-2 text-sm min-w-0">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-text-muted" />
                        <span className="text-text-secondary">{detail.formattedAddress}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(detail.formattedAddress!, 'address')}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                        title="Copier"
                      >
                        {copiedField === 'address'
                          ? <Check className="h-3.5 w-3.5 text-green-600" />
                          : <Copy className="h-3.5 w-3.5 text-text-muted" />}
                      </button>
                    </div>
                  )}

                  {/* Téléphone */}
                  {detail.nationalPhoneNumber && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 flex-shrink-0 text-text-muted" />
                        <a
                          href={`tel:${detail.internationalPhoneNumber || detail.nationalPhoneNumber}`}
                          className="text-primary hover:text-primary-hover font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {detail.nationalPhoneNumber}
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(detail.nationalPhoneNumber!, 'phone')}
                        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
                        title="Copier"
                      >
                        {copiedField === 'phone'
                          ? <Check className="h-3.5 w-3.5 text-green-600" />
                          : <Copy className="h-3.5 w-3.5 text-text-muted" />}
                      </button>
                    </div>
                  )}

                  {/* Google Maps */}
                  {detail.googleMapsUri && (
                    <a
                      href={detail.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover font-medium mt-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {fr.results.voirSurGoogleMaps}
                    </a>
                  )}
                </div>
              </section>

              {/* Section Outils Ultra */}
              {detail.isUltra && (
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      <span>Outils Ultra</span>
                    </div>
                    <span className="text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Exclusif Ultra</span>
                  </h3>

                  <div className="space-y-3">
                    {/* ── RECHERCHE EMAIL ── BLEU */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-4 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                            <AtSign className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text">Email professionnel</p>
                            {aiEmailLoading && (
                              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Recherche...
                              </p>
                            )}
                            {aiEmailError && !aiEmailLoading && (
                              <p className="text-xs text-red-500 mt-0.5">{aiEmailError}</p>
                            )}
                            {aiEmail && aiEmail !== 'non trouvé' && !aiEmailLoading && (
                              <a href={`mailto:${aiEmail}`} className="block text-xs font-medium text-blue-600 hover:text-blue-700 truncate mt-0.5">{aiEmail}</a>
                            )}
                            {aiEmail === 'non trouvé' && (
                              <p className="text-xs text-text-muted mt-0.5">Aucun email trouvé</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!aiEmailLoading && !aiEmail && !aiEmailError && (
                            <button
                              onClick={searchAiEmail}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:shadow-md hover:shadow-blue-500/30 transition-all"
                            >
                              <Search className="h-3 w-3" />
                              Chercher
                            </button>
                          )}
                          {(aiEmailError || aiEmail === 'non trouvé') && (
                            <button onClick={() => { setAiEmail(null); setAiEmailError(null); searchAiEmail(); }} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 text-blue-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-50">
                              Réessayer
                            </button>
                          )}
                          {aiEmail && aiEmail !== 'non trouvé' && (
                            <button
                              onClick={() => copyToClipboard(aiEmail, 'ai-email')}
                              className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Copier"
                            >
                              {copiedField === 'ai-email' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── RECHERCHE DIRIGEANT ── VIOLET / PINK */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-4 hover:border-purple-200 hover:shadow-md hover:shadow-purple-500/5 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20 flex-shrink-0">
                            <UserCircle className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text">Dirigeant</p>
                            {aiDirigeantLoading && (
                              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Recherche...
                              </p>
                            )}
                            {aiDirigeantError && !aiDirigeantLoading && (
                              <p className="text-xs text-red-500 mt-0.5">{aiDirigeantError}</p>
                            )}
                            {aiDirigeant && aiDirigeant !== 'non trouvé' && !aiDirigeantLoading && (
                              <p className="text-xs font-semibold text-purple-700 truncate mt-0.5">{aiDirigeant}</p>
                            )}
                            {aiDirigeant === 'non trouvé' && (
                              <p className="text-xs text-text-muted mt-0.5">Aucun dirigeant trouvé</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!aiDirigeantLoading && !aiDirigeant && !aiDirigeantError && (
                            <button
                              onClick={searchDirigeant}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:shadow-md hover:shadow-purple-500/30 transition-all"
                            >
                              <Search className="h-3 w-3" />
                              Chercher
                            </button>
                          )}
                          {(aiDirigeantError || aiDirigeant === 'non trouvé') && (
                            <button onClick={() => { setAiDirigeant(null); setAiDirigeantError(null); searchDirigeant(); }} className="inline-flex items-center gap-1 rounded-lg border border-purple-200 text-purple-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-purple-50">
                              Réessayer
                            </button>
                          )}
                          {aiDirigeant && aiDirigeant !== 'non trouvé' && (
                            <button
                              onClick={() => copyToClipboard(aiDirigeant, 'ai-dirigeant')}
                              className="rounded-lg p-1.5 text-purple-500 hover:bg-purple-50 transition-colors"
                              title="Copier"
                            >
                              {copiedField === 'ai-dirigeant' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── RECHERCHE SIRET ── AMBRE / ORANGE */}
                    <div className="group rounded-2xl border border-gray-100 bg-white p-4 hover:border-amber-200 hover:shadow-md hover:shadow-amber-500/5 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text">SIRET</p>
                            {aiSiretLoading && (
                              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Recherche...
                              </p>
                            )}
                            {aiSiretError && !aiSiretLoading && (
                              <p className="text-xs text-red-500 mt-0.5">{aiSiretError}</p>
                            )}
                            {aiSiret && aiSiret !== 'non trouvé' && !aiSiretLoading && (
                              <p className="text-xs font-mono font-semibold text-amber-700 truncate mt-0.5 tracking-wide">{aiSiret}</p>
                            )}
                            {aiSiret === 'non trouvé' && (
                              <p className="text-xs text-text-muted mt-0.5">Aucun SIRET trouvé</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!aiSiretLoading && !aiSiret && !aiSiretError && (
                            <button
                              onClick={searchSiret}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:shadow-md hover:shadow-amber-500/30 transition-all"
                            >
                              <Search className="h-3 w-3" />
                              Chercher
                            </button>
                          )}
                          {(aiSiretError || aiSiret === 'non trouvé') && (
                            <button onClick={() => { setAiSiret(null); setAiSiretError(null); searchSiret(); }} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 text-amber-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-amber-50">
                              Réessayer
                            </button>
                          )}
                          {aiSiret && aiSiret !== 'non trouvé' && (
                            <button
                              onClick={() => copyToClipboard(aiSiret, 'ai-siret')}
                              className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 transition-colors"
                              title="Copier"
                            >
                              {copiedField === 'ai-siret' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}



              {/* Rating */}
              {detail.rating && (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(detail.rating!)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-bold text-text">
                      {detail.rating.toFixed(1)}
                    </span>
                    {detail.userRatingCount && (
                      <span className="text-sm text-text-muted">
                        ({detail.userRatingCount} {fr.results.avis})
                      </span>
                    )}
                  </div>
                </section>
              )}

              {/* Opening Hours */}
              {(detail.regularOpeningHours || detail.currentOpeningHours) && (
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                    <Clock className="h-4 w-4 text-text-muted" />
                    {fr.detail.horaires}
                  </h3>
                  {(detail.currentOpeningHours?.openNow !== undefined ||
                    detail.regularOpeningHours?.openNow !== undefined) && (
                    <div className="mb-2">
                      <Badge
                        variant={
                          (detail.currentOpeningHours?.openNow ?? detail.regularOpeningHours?.openNow)
                            ? 'success'
                            : 'error'
                        }
                      >
                        {(detail.currentOpeningHours?.openNow ?? detail.regularOpeningHours?.openNow)
                          ? fr.detail.ouvertMaintenant
                          : fr.detail.fermeMaintenant}
                      </Badge>
                    </div>
                  )}
                  <div className="space-y-1">
                    {(
                      detail.regularOpeningHours?.weekdayDescriptions ||
                      detail.currentOpeningHours?.weekdayDescriptions ||
                      []
                    ).map((line, idx) => (
                      <p key={idx} className="text-sm text-text-secondary">
                        {line}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews */}
              {detail.reviews && detail.reviews.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                    <MessageSquare className="h-4 w-4 text-text-muted" />
                    {fr.detail.avis} ({detail.reviews.length})
                  </h3>
                  <div className="space-y-3">
                    {detail.reviews.slice(0, 5).map((review, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text">
                            {review.authorAttribution?.displayName || 'Anonyme'}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.text?.text && (
                          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                            {review.text.text}
                          </p>
                        )}
                        <p className="text-xs text-text-muted">
                          {review.relativePublishTimeDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Website status */}
              {hasWebsite ? (
                <div className="rounded-lg border-2 border-dashed border-green-200 bg-green-50 p-4 text-center">
                  <Globe className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm font-semibold text-green-700">Cette entreprise a un site web</p>
                  {(websiteUrl || detail?.websiteUri) && (
                    <a
                      href={websiteUrl || detail?.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 underline mt-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {(websiteUrl || detail?.websiteUri)?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-red-200 bg-red-50 p-4 text-center">
                  <Globe className="mx-auto h-8 w-8 text-red-400 mb-2" />
                  <p className="text-sm font-semibold text-red-700">{fr.results.pasDeSiteWeb}</p>
                  <p className="text-xs text-red-500 mt-1">
                    Cette entreprise n&apos;a pas de site internet — un prospect idéal !
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      <div>
        <Skeleton className="h-4 w-36 mb-3" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
