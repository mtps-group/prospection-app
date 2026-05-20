'use client';

import { useState } from 'react';
import { PartyPopper, X, Check, Euro } from 'lucide-react';

interface SignatureModalProps {
  businessName: string;
  onSave: (data: { deal_value: number | null; notes: string | null }) => void | Promise<void>;
  onSkip: () => void;
  onCancel: () => void;
}

export function SignatureModal({ businessName, onSave, onSkip, onCancel }: SignatureModalProps) {
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const value = dealValue.trim() ? parseFloat(dealValue.replace(',', '.')) : null;
    await onSave({
      deal_value: isNaN(value as number) ? null : value,
      notes: notes.trim() || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <PartyPopper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">Félicitations !</h3>
              <p className="text-sm text-text-secondary truncate max-w-[260px]">{businessName}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-text-muted hover:text-text rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Montant du contrat <span className="text-text-muted font-normal">(optionnel)</span>
          </label>
          <div className="relative">
            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              inputMode="decimal"
              value={dealValue}
              onChange={e => setDealValue(e.target.value)}
              placeholder="1200"
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <p className="text-xs text-text-muted mt-1">Permet de calculer votre CA dans les statistiques</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: Contrat 6 mois renouvelable"
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
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
            className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
