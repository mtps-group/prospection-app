'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fr } from '@/i18n/fr';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback?next=/parametres`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <Card>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Email envoye</h2>
          <p className="text-sm text-text-secondary">
            Si un compte existe avec l&apos;adresse <strong>{email}</strong>,
            vous recevrez un lien de reinitialisation.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la connexion
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-text mb-2">{fr.auth.reinitialiser}</h1>
      <p className="text-sm text-text-secondary mb-6">
        Entrez votre email pour recevoir un lien de reinitialisation
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <Input
          label={fr.auth.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        {error && (
          <p className="text-sm text-error bg-red-50 rounded-lg p-3">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Envoyer le lien
        </Button>
      </form>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a la connexion
        </Link>
      </p>
    </Card>
  );
}
