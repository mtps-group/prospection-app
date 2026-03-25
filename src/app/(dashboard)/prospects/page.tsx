'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Phone, MapPin, Globe, Trash2, StickyNote, X, Check } from 'lucide-react';
import Link from 'next/link';

const STATUSES = [
  { key: 'a_contacter', label: 'À contacter', emoji: '⭕', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { key: 'contacte', label: 'Contacté', emoji: '📞', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'interesse', label: 'Intéressé', emoji: '🤝', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'signe', label: 'Signé', emoji: '✅', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'pas_interesse', label: 'Pas intéressé', emoji: '❌', color: 'bg-red-100 text-red-700 border-red-200' },
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

  useEffect(() => {
    fetchProspects();
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Mes Prospects
        </h1>
        <p className="text-text-secondary mt-1">Suivez l&apos;avancement de votre prospection</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUSES.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveFilter(activeFilter === s.key ? 'all' : s.key)}
            className={`rounded-xl border p-3 text-center transition-all ${
              activeFilter === s.key ? s.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">{s.emoji}</div>
            <div className="text-lg font-bold text-text">{countByStatus(s.key)}</div>
            <div className="text-xs text-text-muted">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {activeFilter === 'all' ? `${prospects.length} prospect${prospects.length > 1 ? 's' : ''} au total` : `${filtered.length} prospect${filtered.length > 1 ? 's' : ''}`}
        </p>
        {activeFilter !== 'all' && (
          <button onClick={() => setActiveFilter('all')} className="text-xs text-primary underline">
            Voir tous
          </button>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text mb-1">Aucun prospect</h3>
          <p className="text-sm text-text-secondary mb-4">
            Ajoutez des prospects depuis la page de recherche en cliquant sur le bouton <strong>+</strong> sur chaque résultat.
          </p>
          <Link
            href="/recherche"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Faire une recherche
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(prospect => {
            const statusInfo = STATUSES.find(s => s.key === prospect.status)!;
            return (
              <Card key={prospect.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text truncate">{prospect.business_name}</h3>
                    {prospect.business_type && (
                      <p className="text-sm text-text-muted">{prospect.business_type}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingNotes(prospect.id);
                        setNotesDraft(prospect.notes || '');
                      }}
                      className="text-text-muted hover:text-primary transition-colors"
                      title="Ajouter une note"
                    >
                      <StickyNote className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteProspect(prospect.id)}
                      className="text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Infos contact */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                  {prospect.phone_national && (
                    <a href={`tel:${prospect.phone_national}`} className="flex items-center gap-1 text-primary font-medium hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {prospect.phone_national}
                    </a>
                  )}
                  {prospect.formatted_address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {prospect.formatted_address}
                    </span>
                  )}
                  {prospect.website_url && (
                    <a href={prospect.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
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
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => saveNotes(prospect.id)} className="rounded-lg bg-primary p-2 text-white hover:bg-primary-hover">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingNotes(null)} className="rounded-lg border border-gray-200 p-2 text-text-muted hover:bg-gray-50">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : prospect.notes ? (
                  <p
                    className="text-sm text-text-secondary bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => { setEditingNotes(prospect.id); setNotesDraft(prospect.notes || ''); }}
                  >
                    📝 {prospect.notes}
                  </p>
                ) : null}

                {/* Statut selector */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
                  {STATUSES.map(s => (
                    <button
                      key={s.key}
                      onClick={() => updateStatus(prospect.id, s.key)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                        prospect.status === s.key
                          ? s.color + ' ring-1 ring-current'
                          : 'bg-white border-gray-200 text-text-muted hover:border-gray-300'
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
