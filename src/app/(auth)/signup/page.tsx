'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fr } from '@/i18n/fr';
import { Mail, Lock, User } from 'lucide-react';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Si une session est retournée, la confirmation email est désactivée
    // → on redirige directement vers le dashboard
    if (data.session) {
      router.push('/recherche');
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <Card>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Verifiez votre email</h2>
          <p className="text-sm text-text-secondary">
            Un email de confirmation a ete envoye a <strong>{email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Retour a la connexion
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-text mb-2">{fr.auth.inscription}</h1>
      <p className="text-sm text-text-secondary mb-6">
        Creez votre compte et commencez a prospecter gratuitement
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label={fr.auth.nomComplet}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jean Dupont"
          icon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label={fr.auth.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.fr"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        <Input
          label={fr.auth.motDePasse}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 6 caracteres"
          icon={<Lock className="h-4 w-4" />}
          required
        />

        <Input
          label={fr.auth.confirmerMotDePasse}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmez votre mot de passe"
          icon={<Lock className="h-4 w-4" />}
          required
        />

        {error && (
          <p className="text-sm text-error bg-red-50 rounded-lg p-3">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {fr.auth.sInscrire}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {fr.auth.dejaUnCompte}{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
          {fr.auth.seConnecter}
        </Link>
      </p>
    </Card>
  );
}
