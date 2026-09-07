'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock } from 'lucide-react';

// Page d'atterrissage du lien "Mot de passe oublié" : le /callback a déjà
// échangé le code de récupération contre une session, il ne reste qu'à
// définir le nouveau mot de passe.
export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        error.message.includes('should be different')
          ? 'Le nouveau mot de passe doit être différent de l\'ancien.'
          : 'Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — refaites une demande depuis « Mot de passe oublié ».'
      );
      setLoading(false);
      return;
    }

    router.push('/recherche');
    router.refresh();
  };

  return (
    <Card>
      <h1 className="text-2xl font-bold text-text mb-2">Nouveau mot de passe</h1>
      <p className="text-sm text-text-secondary mb-6">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          required
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          required
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer le nouveau mot de passe'}
        </Button>
      </form>
    </Card>
  );
}
