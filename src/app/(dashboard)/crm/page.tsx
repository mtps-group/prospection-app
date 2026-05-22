'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { Phone, MapPin, Globe, Trash2, StickyNote, X, Check, Search, ArrowRight, LayoutList, LayoutGrid, Tag as TagIcon, Euro, TrendingUp, Eye } from 'lucide-react';
import { PROSPECT_STATUSES, type ProspectStatusKey, type Prospect, type ProspectTag } from '@/lib/crm/constants';
import { MeetingModal } from '@/components/crm/MeetingModal';
import { SignatureModal } from '@/components/crm/SignatureModal';
import { TagsManager } from '@/components/crm/TagsManager';
import { ProspectTagsBar } from '@/components/crm/ProspectTagsBar';
import { ReminderBadge } from '@/components/crm/ReminderBadge';
import { KanbanView } from '@/components/crm/KanbanView';
import { BusinessDetailPanel } from '@/components/search/BusinessDetailPanel';
import type { SearchResultClient } from '@/types';

type ViewMode = 'list' | 'kanban';

export default function CrmProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [allTags, setAllTags] = useState<ProspectTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFilter, setActiveFilter] = useState<ProspectStatusKey | 'all'>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [showTagsManager, setShowTagsManager] = useState(false);

  // State pour modales transitions
  const [meetingModal, setMeetingModal] = useState<{ prospect: Prospect } | null>(null);
  const [signatureModal, setSignatureModal] = useState<{ prospect: Prospect } | null>(null);

  // State pour le panel detail (vue Google Places)
  const [detailPanel, setDetailPanel] = useState<{
    placeId: string;
    businessName: string;
    city?: string;
    hasWebsite?: boolean;
    websiteUrl?: string;
    result: SearchResultClient;
  } | null>(null);

  function openDetail(prospect: Prospect) {
    // Verifie que google_place_id est un vrai Place ID (pas un SIRET de 14 chiffres)
    const isValidPlaceId = !!prospect.google_place_id && !/^\d+$/.test(prospect.google_place_id);
    if (!isValidPlaceId) {
      alert('Détails Google Places non disponibles pour ce prospect (SIRENE only). Ouvre son site web ou Google Maps depuis la carte.');
      return;
    }
    const city = prospect.formatted_address?.split(',').slice(-2, -1)[0]?.trim().replace(/^\d{5}\s*/, '') || '';
    // On adapte le Prospect en SearchResultClient (champs communs suffisent pour le panel)
    const result = {
      ...prospect,
      is_blurred: false,
    } as unknown as SearchResultClient;
    setDetailPanel({
      placeId: prospect.google_place_id,
      businessName: prospect.business_name,
      city,
      hasWebsite: !!prospect.website_url,
      websiteUrl: prospect.website_url || undefined,
      result,
    });
  }

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [pRes, tRes] = await Promise.all([
      fetch('/api/prospects'),
      fetch('/api/prospects/tags'),
    ]);
    const pData = await pRes.json();
    const tData = await tRes.json();
    setProspects(pData.prospects || []);
    setAllTags(tData.tags || []);
    setLoading(false);
  }

  // Met a jour le statut d'un prospect ; intercepte rdv_pris/signe pour ouvrir une modale
  async function updateStatus(prospectId: string, newStatus: ProspectStatusKey) {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    if (newStatus === 'rdv_pris' && prospect.status !== 'rdv_pris') {
      setMeetingModal({ prospect: { ...prospect, status: newStatus } });
      return;
    }

    if (newStatus === 'signe' && prospect.status !== 'signe') {
      setSignatureModal({ prospect: { ...prospect, status: newStatus } });
      return;
    }

    await persistStatusChange(prospectId, newStatus);
  }

  async function persistStatusChange(
    prospectId: string,
    newStatus: ProspectStatusKey,
    extra: Partial<{ meeting_date: string | null; meeting_notes: string | null; deal_value: number | null; notes: string }> = {}
  ) {
    const res = await fetch('/api/prospects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: prospectId, status: newStatus, ...extra }),
    });
    if (res.ok) {
      const { prospect } = await res.json();
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, ...prospect, tags: p.tags } : p));
    }
  }

  async function saveNotes(id: string) {
    const prospect = prospects.find(p => p.id === id);
    await fetch('/api/prospects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: prospect?.status, notes: notesDraft }),
    });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, notes: notesDraft } : p));
    setEditingNotes(null);
  }

  async function deleteProspect(id: string) {
    if (!confirm('Supprimer ce prospect ? Toutes les données associées seront perdues.')) return;
    await fetch(`/api/prospects?id=${id}`, { method: 'DELETE' });
    setProspects(prev => prev.filter(p => p.id !== id));
  }

  const filtered = useMemo(() => {
    return activeFilter === 'all' ? prospects : prospects.filter(p => p.status === activeFilter);
  }, [prospects, activeFilter]);

  const countByStatus = (key: ProspectStatusKey) => prospects.filter(p => p.status === key).length;
  const totalRevenue = prospects
    .filter(p => p.status === 'signe' && p.deal_value)
    .reduce((acc, p) => acc + (Number(p.deal_value) || 0), 0);

  return (
    <>
      {/* Stats pipeline + Toolbar */}
      <div className="space-y-3">
        {/* KPI quick + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {totalRevenue > 0 && (
              <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3 py-1.5">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-700">{totalRevenue.toLocaleString('fr-FR')} € générés</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTagsManager(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
            >
              <TagIcon className="h-4 w-4" />
              Tags
            </button>
            <div className="inline-flex items-center rounded-xl border border-gray-200 p-0.5 bg-white">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                <LayoutList className="h-4 w-4" />
                Liste
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline status cards (visible in list mode) */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PROSPECT_STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveFilter(activeFilter === s.key ? 'all' : s.key)}
                className={`rounded-xl border p-3 text-center transition-all hover:shadow-md ${
                  activeFilter === s.key ? s.activeColor : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className="text-xl font-black text-text">{countByStatus(s.key)}</div>
                <div className="text-[10px] font-medium text-text-muted mt-0.5 truncate">{s.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vue Kanban */}
      {viewMode === 'kanban' && !loading && (
        <KanbanView
          prospects={prospects}
          onStatusChange={updateStatus}
          onProspectClick={openDetail}
        />
      )}

      {/* Vue Liste */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary font-medium">
              {activeFilter === 'all'
                ? `${prospects.length} prospect${prospects.length > 1 ? 's' : ''} au total`
                : `${filtered.length} prospect${filtered.length > 1 ? 's' : ''}`}
            </p>
            {activeFilter !== 'all' && (
              <button onClick={() => setActiveFilter('all')} className="text-xs font-semibold text-primary hover:underline">
                Voir tous les prospects
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
                <TagIcon className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">
                {activeFilter === 'all' ? 'Aucun prospect pour le moment' : 'Aucun prospect avec ce statut'}
              </h3>
              <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto">
                Ajoutez des prospects depuis la page de recherche en cliquant sur le bouton <strong>+</strong> sur chaque résultat.
              </p>
              <Link
                href="/recherche"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <Search className="h-4 w-4" />
                Faire une recherche
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(prospect => {
                const statusInfo = PROSPECT_STATUSES.find(s => s.key === prospect.status)!;
                return (
                  <div key={prospect.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-gray-200 transition-all space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-text truncate">{prospect.business_name}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.emoji} {statusInfo.label}
                          </span>
                          {(prospect.meeting_date || prospect.next_followup_at) && (
                            <ReminderBadge meetingDate={prospect.meeting_date} nextFollowupAt={prospect.next_followup_at} />
                          )}
                          {prospect.status === 'signe' && prospect.deal_value && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 border border-green-200 px-2 py-0.5 text-xs font-bold text-green-700">
                              <Euro className="h-3 w-3" />
                              {prospect.deal_value.toLocaleString('fr-FR')} €
                            </span>
                          )}
                        </div>
                        {prospect.business_type && (
                          <p className="text-sm text-text-muted mt-0.5">{prospect.business_type}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openDetail(prospect)}
                          className="rounded-lg p-2 text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                          title="Voir plus d'infos"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setEditingNotes(prospect.id); setNotesDraft(prospect.notes || ''); }}
                          className="rounded-lg p-2 text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                          title="Note"
                        >
                          <StickyNote className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProspect(prospect.id)}
                          className="rounded-lg p-2 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contact + tags */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary items-center">
                      {prospect.phone_national && (
                        <a href={`tel:${prospect.phone_national}`} className="flex items-center gap-1.5 text-primary font-semibold hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {prospect.phone_national}
                        </a>
                      )}
                      {prospect.formatted_address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-text-muted" /> {prospect.formatted_address}
                        </span>
                      )}
                      {prospect.website_url && (
                        <a href={prospect.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                          <Globe className="h-3.5 w-3.5" /> Site web
                        </a>
                      )}
                    </div>

                    {/* Tags */}
                    <ProspectTagsBar
                      prospectId={prospect.id}
                      assignedTags={prospect.tags || []}
                      allTags={allTags}
                      onChange={fetchAll}
                    />

                    {/* Notes */}
                    {editingNotes === prospect.id ? (
                      <div className="flex gap-2">
                        <textarea
                          value={notesDraft}
                          onChange={e => setNotesDraft(e.target.value)}
                          placeholder="Ajouter une note..."
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => saveNotes(prospect.id)} className="rounded-xl bg-gradient-to-r from-primary to-purple-500 p-2.5 text-white hover:opacity-90 shadow-sm">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingNotes(null)} className="rounded-xl border border-gray-200 p-2.5 text-text-muted hover:bg-gray-50">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : prospect.notes ? (
                      <p
                        className="text-sm text-text-secondary bg-gray-50 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                        onClick={() => { setEditingNotes(prospect.id); setNotesDraft(prospect.notes || ''); }}
                      >
                        📝 {prospect.notes}
                      </p>
                    ) : null}

                    {/* Status selector */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                      {PROSPECT_STATUSES.map(s => (
                        <button
                          key={s.key}
                          onClick={() => updateStatus(prospect.id, s.key)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                            prospect.status === s.key
                              ? s.activeColor
                              : 'bg-white border-gray-100 text-text-muted hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {s.emoji} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modales */}
      {meetingModal && (
        <MeetingModal
          businessName={meetingModal.prospect.business_name}
          initialDate={meetingModal.prospect.meeting_date}
          initialNotes={meetingModal.prospect.meeting_notes}
          onCancel={() => setMeetingModal(null)}
          onSkip={async () => {
            await persistStatusChange(meetingModal.prospect.id, 'rdv_pris');
            setMeetingModal(null);
          }}
          onSave={async (data) => {
            await persistStatusChange(meetingModal.prospect.id, 'rdv_pris', data);
            setMeetingModal(null);
          }}
        />
      )}

      {signatureModal && (
        <SignatureModal
          businessName={signatureModal.prospect.business_name}
          onCancel={() => setSignatureModal(null)}
          onSkip={async () => {
            await persistStatusChange(signatureModal.prospect.id, 'signe');
            setSignatureModal(null);
          }}
          onSave={async ({ deal_value, notes }) => {
            await persistStatusChange(signatureModal.prospect.id, 'signe', {
              deal_value,
              notes: notes || signatureModal.prospect.notes || undefined,
            });
            setSignatureModal(null);
          }}
        />
      )}

      {showTagsManager && (
        <TagsManager
          onClose={() => {
            setShowTagsManager(false);
            fetchAll();
          }}
        />
      )}

      {/* Panel detail (Google Places info enrichies) */}
      {detailPanel && (
        <BusinessDetailPanel
          placeId={detailPanel.placeId}
          businessName={detailPanel.businessName}
          city={detailPanel.city}
          hasWebsite={detailPanel.hasWebsite}
          websiteUrl={detailPanel.websiteUrl}
          result={detailPanel.result}
          onClose={() => setDetailPanel(null)}
        />
      )}
    </>
  );
}
