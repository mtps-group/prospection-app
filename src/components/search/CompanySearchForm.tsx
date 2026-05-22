'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Building, MapPin, Calendar, Search, Sparkles } from 'lucide-react';

export interface CompanySearchValues {
  businessType: string;
  city: string;
  creationMaxMonths: number | null;
  natureJuridique: string | null;
  nameQuery: string;
}

interface CompanySearchFormProps {
  onSearch: (values: CompanySearchValues) => void;
  loading: boolean;
}

const CREATION_PRESETS = [
  { label: 'Moins de 3 mois', value: 3 },
  { label: 'Moins de 6 mois', value: 6 },
  { label: 'Moins de 12 mois', value: 12 },
  { label: 'Moins de 24 mois', value: 24 },
  { label: 'Toutes', value: 0 },
];

const LEGAL_FORMS = [
  { code: '', label: 'Toutes' },
  { code: '5710', label: 'SAS' },
  { code: '5499', label: 'SARL' },
  { code: '5599', label: 'SA' },
  { code: '1000', label: 'Entrepreneur individuel / Micro' },
  { code: '5485', label: 'EURL' },
  { code: '6540', label: 'SCI' },
];

export function CompanySearchForm({ onSearch, loading }: CompanySearchFormProps) {
  const [businessType, setBusinessType] = useState('');
  const [city, setCity] = useState('');
  const [creationMaxMonths, setCreationMaxMonths] = useState<number>(6);
  const [natureJuridique, setNatureJuridique] = useState<string>('');
  const [nameQuery, setNameQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() && !nameQuery.trim()) return;
    onSearch({
      businessType: businessType.trim(),
      city: city.trim(),
      creationMaxMonths: creationMaxMonths || null,
      natureJuridique: natureJuridique || null,
      nameQuery: nameQuery.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Champs principaux */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Type d'activité"
          placeholder="boulangerie, restaurant, plombier..."
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          icon={<Building className="h-4 w-4" />}
        />
        <Input
          label="Ville ou code postal"
          placeholder="Paris, 75001, ou 75 (département)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          icon={<MapPin className="h-4 w-4" />}
        />
      </div>

      {/* Date de création - le golden filter */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
          <Calendar className="h-3.5 w-3.5 text-violet-500" />
          Date de création
          <span className="ml-1 inline-flex items-center rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
            CLEF
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CREATION_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setCreationMaxMonths(p.value)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                creationMaxMonths === p.value
                  ? 'border-violet-500 bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'border-gray-200 dark:border-violet-500/15 text-text-secondary hover:border-violet-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres avancés (dépliables) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
        >
          {showAdvanced ? '▼' : '▶'} Filtres avancés (forme juridique, recherche par nom)
        </button>
        {showAdvanced && (
          <div className="grid gap-4 sm:grid-cols-2 mt-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-violet-500/15">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Forme juridique</label>
              <select
                value={natureJuridique}
                onChange={(e) => setNatureJuridique(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-violet-500/20 bg-white dark:bg-white/5 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                {LEGAL_FORMS.map(f => (
                  <option key={f.code} value={f.code}>{f.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Recherche par nom (optionnel)"
              placeholder="ex: 'Boulangerie Dupont'"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        )}
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-lg shadow-violet-500/20">
        <Sparkles className="h-4 w-4" />
        Trouver les opportunités
      </Button>
    </form>
  );
}
