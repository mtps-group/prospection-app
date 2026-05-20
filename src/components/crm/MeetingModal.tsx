'use client';

import { useState } from 'react';
import { Calendar, X, Check } from 'lucide-react';

interface MeetingModalProps {
  businessName: string;
  initialDate?: string | null;
  initialNotes?: string | null;
  onSave: (data: { meeting_date: string | null; meeting_notes: string | null }) => void | Promise<void>;
  onSkip: () => void;
  onCancel: () => void;
}

function toLocalDatetime(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingModal({ businessName, initialDate, initialNotes, onSave, onSkip, onCancel }: MeetingModalProps) {
  // Default = demain a 14h00
  const defaultDate = (() => {
    if (initialDate) return toLocalDatetime(new Date(initialDate));
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    return toLocalDatetime(d);
  })();

  const [meetingDate, setMeetingDate] = useState(defaultDate);
  const [meetingNotes, setMeetingNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const iso = meetingDate ? new Date(meetingDate).toISOString() : null;
    await onSave({ meeting_date: iso, meeting_notes: meetingNotes.trim() || null });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">RDV pris !</h3>
              <p className="text-sm text-text-secondary truncate max-w-[260px]">{businessName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Date et heure du RDV</label>
          <input
            type="datetime-local"
            value={meetingDate}
            onChange={e => setMeetingDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Notes (optionnel)</label>
          <textarea
            value={meetingNotes}
            onChange={e => setMeetingNotes(e.target.value)}
            placeholder="Ex: En présentiel, chez lui, préparer une démo"
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onSkip}
            disabled={saving}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
