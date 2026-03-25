'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fr } from '@/i18n/fr';
import { Search, MapPin, Building } from 'lucide-react';

interface SearchFormProps {
  onSearch: (businessType: string, city: string) => void;
  loading: boolean;
  disabled?: boolean;
  initialBusinessType?: string;
  initialCity?: string;
}

export function SearchForm({ onSearch, loading, disabled, initialBusinessType = '', initialCity = '' }: SearchFormProps) {
  const [businessType, setBusinessType] = useState(initialBusinessType);
  const [city, setCity] = useState(initialCity);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessType.trim() && city.trim()) {
      onSearch(businessType.trim(), city.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={fr.search.typeActivite}
          placeholder={fr.search.typeActivitePlaceholder}
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          icon={<Building className="h-4 w-4" />}
          required
          disabled={disabled}
        />
        <Input
          label={fr.search.ville}
          placeholder={fr.search.villePlaceholder}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          icon={<MapPin className="h-4 w-4" />}
          required
          disabled={disabled}
        />
      </div>
      <Button
        type="submit"
        loading={loading}
        disabled={disabled || !businessType.trim() || !city.trim()}
        size="lg"
        className="w-full sm:w-auto"
      >
        <Search className="h-4 w-4" />
        {loading ? fr.search.recherchEnCours : fr.search.rechercher}
      </Button>
    </form>
  );
}
