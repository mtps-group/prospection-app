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
} from 'lucide-react';

interface BusinessDetailPanelProps {
  placeId: string;
  businessName: string;
  city?: string;
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
  onClose,
}: BusinessDetailPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSearched, setEmailSearched] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const findEmails = async (overrideCity?: string) => {
    const cityToUse = overrideCity || city || extractCityFromAddress(detail?.formattedAddress || '');
    if (!cityToUse) return;
    setEmailLoading(true);
    setEmailSearched(true);
    try {
      const res = await fetch(
        `/api/find-email?name=${encodeURIComponent(businessName)}&city=${encodeURIComponent(cityToUse)}`
      );
      const data = await res.json();
      setEmails(data.emails || []);
    } catch {
      setEmails([]);
    } finally {
      setEmailLoading(false);
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
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/place-details?placeId=${encodeURIComponent(placeId)}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erreur lors du chargement');
          return;
        }

        setDetail(data);

        // Lancer la recherche email automatiquement
        const cityToUse = city || extractCityFromAddress(data.formattedAddress || '');
        if (cityToUse) {
          setEmailLoading(true);
          setEmailSearched(true);
          try {
            const emailRes = await fetch(
              `/api/find-email?name=${encodeURIComponent(businessName)}&city=${encodeURIComponent(cityToUse)}`
            );
            const emailData = await emailRes.json();
            setEmails(emailData.emails || []);
          } catch {
            setEmails([]);
          } finally {
            setEmailLoading(false);
          }
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
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

              {/* Section Email via PagesJaunes */}
              <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-text mb-3">
                  <Mail className="h-4 w-4 text-text-muted" />
                  Email
                  {emailLoading && (
                    <span className="text-xs font-normal text-text-muted flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Recherche en cours...
                    </span>
                  )}
                </h3>

                {emailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted rounded-lg bg-gray-50 px-3 py-2 animate-pulse">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span>Recherche d&apos;email en cours...</span>
                  </div>
                ) : emailSearched && emails.length > 0 ? (
                  <div className="space-y-2">
                    {emails.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <Mail className="h-4 w-4 flex-shrink-0 text-green-600" />
                          <a
                            href={`mailto:${email}`}
                            className="text-green-700 hover:text-green-800 font-medium truncate"
                          >
                            {email}
                          </a>
                        </div>
                        <button
                          onClick={() => copyToClipboard(email, `email-${idx}`)}
                          className="flex-shrink-0 p-1 rounded hover:bg-green-200 transition-colors"
                          title="Copier"
                        >
                          {copiedField === `email-${idx}`
                            ? <Check className="h-3.5 w-3.5 text-green-600" />
                            : <Copy className="h-3.5 w-3.5 text-green-600" />}
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-text-muted">Source : annuaires professionnels</p>
                  </div>
                ) : emailSearched ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span>Aucun email trouvé</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => findEmails()}>
                      <Search className="h-3.5 w-3.5" />
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-text-muted rounded-lg bg-gray-50 px-3 py-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span>—</span>
                  </div>
                )}
              </section>

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

              {/* No website badge */}
              <div className="rounded-lg border-2 border-dashed border-red-200 bg-red-50 p-4 text-center">
                <Globe className="mx-auto h-8 w-8 text-red-400 mb-2" />
                <p className="text-sm font-semibold text-red-700">
                  {fr.results.pasDeSiteWeb}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Cette entreprise n&apos;a pas de site internet — un prospect idéal !
                </p>
              </div>
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
