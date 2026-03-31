'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Phone, MapPin, Globe, Trash2, StickyNote, X, Check, Search, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STATUSES = [
  { key: 'a_contacter', label: 'À contacter', emoji: '⭕', color: 'bg-gray-50 text-gray-700 border-gray-200', activeColor: 'bg-gray-100 text-gray-800 border-gray-300 ring-2 ring-gray-300/50' },
  { key: 'contacte', label: 'Contacté', emoji: '📞', color: 'bg-blue-50 text-blue-700 border-blue-200', activeColor: 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-300/50' },
  { key: 'interesse', label: 'Intéressé', emoji: '🤝', color: 'bg-amber-50 text-amber-700 border-amber-200', activeColor: 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-300/50' },
  { key: 'signe', label: 'Signé', emoji: '✅', color: 'bg-green-50 text-green-700 border-green-200', activeColor: 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-300/50' },
  { key: 'pas_interesse', label: 'Pas intéressé', emoji: '❌', color: 'bg-red-50 text-red-700 border-red-200', activeColor: 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-300/50' },
] as const;

type StatusKey = typeof STATUSES[number]['key'];

interface Prospect {
  id: string;
  google_place_id: string;
  business_name: string;
  business_type?: string;
  formatted_address?: string;
  phone_national?: string;
  website_url?: string;
  status: StatusKey;
  notes?: string;
  updated_at: string;
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<StatusKey | 'all'>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => { fetchProspects(); }, []);

  async function fetchProspects() {
    const res = await fetch('/api/prospects');
    const data = await res.json();
    setProspects(data.prospects || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: StatusKey) {
    const prospect = prospects.find(p => p.id === id);
    await fetch('/api/prospects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, notes: prospect?.notes }),
    });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
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
    await fetch(`/api/prospects?id=${id}`, { method: 'DELETE' });
    setProspects(prev => prev.filter(p => p.id !== id));
  }

  const filtered = activeFilter === 'all' ? prospects : prospects.filter(p => p.status === activeFilter);
  const countByStatus = (key: StatusKey) => prospects.filter(p => p.status === key).length;
  const signedCount = countByStatus('signe');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            Mes Prospects
          </h1>
          <p className="text-text-secondary mt-2">Suivez l&apos;avancement de votre prospection</p>
        </div>
        {signedCount > 0 && (
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">{signedCount} client{signedCount > 1 ? 's' : ''} signé{signedCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Stats pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUSES.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveFilter(activeFilter === s.key ? 'all' : s.key)}
            className={`rounded-2xl border p-4 text-center transition-all hover:shadow-md ${
              activeFilter === s.key ? s.activeColor : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="text-2xl mb-1.5">{s.emoji}</div>
            <div className="text-2xl font-black text-text">{countByStatus(s.key)}</div>
            <div className="text-xs font-medium text-text-muted mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filter info */}
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

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-purple-500" />
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
            const statusInfo = STATUSES.find(s => s.key === prospect.status)!;
            return (
              <div key={prospect.id} className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-lg hover:border-gray-200 transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-text truncate">{prospect.business_name}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.color}`}>
                        {statusInfo.emoji} {statusInfo.label}
                      </span>
                    </div>
                    {prospect.business_type && (
                      <p className="text-sm text-text-muted mt-0.5">{prospect.business_type}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => { setEditingNotes(prospect.id); setNotesDraft(prospect.notes || ''); }}
                      className="rounded-lg p-2 text-text-muted hover:text-primary hover:bg-primary/5 transition-all"
                      title="Ajouter une note"
                    >
                      <StickyNote className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteProspect(prospect.id)}
                      className="rounded-lg p-2 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-text-secondary">
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
                  {STATUSES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => updateStatus(prospect.id, s.key)}
                      className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
    </div>
  );
}
