'use client';

import { useState } from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { fr } from '@/i18n/fr';
import { Settings, User, Save } from 'lucide-react';

export default function ParametresPage() {
  const { profile, supabase, refreshProfile } = useSupabase();
  const { addToast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile?.id);

    if (error) {
      addToast('Erreur lors de la sauvegarde', 'error');
    } else {
      addToast('Profil mis a jour', 'success');
      await refreshProfile();
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {fr.settings.titre}
        </h1>
        <p className="text-text-secondary mt-1">{fr.settings.sousTitre}</p>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {fr.settings.profil}
        </CardTitle>
        <CardDescription>Modifiez vos informations personnelles</CardDescription>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <Input
            label={fr.auth.nomComplet}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Votre nom complet"
          />

          <Input
            label={fr.auth.email}
            value={profile?.email || ''}
            disabled
            className="bg-gray-50"
          />

          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Plan :</span>
            <Badge
              variant={
                profile?.plan === 'ultra'
                  ? 'warning'
                  : profile?.plan === 'premium'
                  ? 'primary'
                  : 'default'
              }
            >
              {profile?.plan === 'ultra'
                ? 'Ultra'
                : profile?.plan === 'premium'
                ? 'Premium'
                : 'Gratuit'}
            </Badge>
          </div>

          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" />
            {fr.settings.sauvegarder}
          </Button>
        </form>
      </Card>
    </div>
  );
}
