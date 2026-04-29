'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { OffrePrivee } from '@/lib/offres/config';

export function OffreForm({ offre, slug }: { offre: OffrePrivee; slug: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. Créer le compte Supabase
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Cette adresse email est déjà utilisée. Contactez-nous si besoin.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // 2. Créer la session Stripe Checkout
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: offre.priceId,
        successUrl: '/recherche?welcome=true',
        cancelUrl: `/offre/${slug}?canceled=true`,
      }),
    });

    const data = await res.json();

    if (!data.url) {
      setError('Erreur lors de la création du paiement. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    // 3. Rediriger vers Stripe
    window.location.href = data.url;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Adresse email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="vous@entreprise.fr"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-400/50 focus:bg-white/8 transition-all text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="8 caractères minimum"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/20 focus:outline-none focus:border-indigo-400/50 focus:bg-white/8 transition-all text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 rounded-xl py-3.5 font-bold text-white text-base disabled:opacity-60 transition-all flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Création du compte…
          </>
        ) : (
          'Créer mon compte et souscrire →'
        )}
      </button>

      <p className="text-center text-xs text-white/25 pt-1">
        En continuant, vous acceptez nos conditions d&apos;utilisation.
        <br />Résiliation possible à tout moment depuis votre espace.
      </p>
    </form>
  );
}
