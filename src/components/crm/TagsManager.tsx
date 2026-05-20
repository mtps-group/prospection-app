'use client';

import { useState, useEffect } from 'react';
import { Tag, X, Plus, Trash2 } from 'lucide-react';
import { TAG_COLORS, type ProspectTag } from '@/lib/crm/constants';

interface TagsManagerProps {
  onClose: () => void;
  onChange?: (tags: ProspectTag[]) => void;
}

export function TagsManager({ onClose, onChange }: TagsManagerProps) {
  const [tags, setTags] = useState<ProspectTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[4].value);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchTags(); }, []);

  async function fetchTags() {
    const res = await fetch('/api/prospects/tags');
    const data = await res.json();
    setTags(data.tags || []);
    setLoading(false);
    if (onChange) onChange(data.tags || []);
  }

  async function createTag() {
    if (!newLabel.trim()) return;
    setCreating(true);
    const res = await fetch('/api/prospects/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim(), color: newColor }),
    });
    if (res.ok) {
      setNewLabel('');
      await fetchTags();
    }
    setCreating(false);
  }

  async function deleteTag(id: string) {
    if (!confirm('Supprimer ce tag ? Il sera retiré de tous les prospects.')) return;
    await fetch(`/api/prospects/tags?id=${id}`, { method: 'DELETE' });
    await fetchTags();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Tag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">Mes tags</h3>
              <p className="text-sm text-text-secondary">Catégorisez vos prospects</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form creation */}
        <div className="rounded-xl border border-gray-200 p-3 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTag()}
              placeholder="Nouveau tag..."
              maxLength={30}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
            <button
              onClick={createTag}
              disabled={!newLabel.trim() || creating}
              className="rounded-lg bg-gradient-to-r from-primary to-purple-500 px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Créer
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted">Couleur :</span>
            {TAG_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setNewColor(c.value)}
                className={`h-6 w-6 rounded-full border-2 transition-all ${newColor === c.value ? 'border-text scale-110' : 'border-gray-200 hover:border-gray-400'}`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-text-muted text-center py-4">Chargement...</p>
          ) : tags.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">Aucun tag pour le moment. Créez-en un ci-dessus.</p>
          ) : (
            tags.map(tag => (
              <div key={tag.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm font-medium text-text truncate">{tag.label}</span>
                </div>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="rounded-lg p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
