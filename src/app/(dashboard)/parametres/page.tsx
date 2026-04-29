'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useToast } from '@/providers/ToastProvider';
import { fr } from '@/i18n/fr';
import { Settings, User, Save, Mail, Shield, Crown, Zap, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
      addToast('Profil mis à jour', 'success');
      await refreshProfile();
    }

    setLoading(false);
  };

  const planInfo = profile?.plan === 'agence'
    ? { label: 'Agence', icon: Crown, gradient: 'from-violet-500 to-purple-600', text: 'text-violet-700', bg: 'from-violet-50 to-purple-50', border: 'border-violet-200' }
    : profile?.plan === 'entreprise'
    ? { label: 'Entreprise', icon: Crown, gradient: 'from-indigo-500 to-purple-600', text: 'text-indigo-700', bg: 'from-indigo-50 to-purple-50', border: 'border-indigo-200' }
    : profile?.plan === 'ultra'
    ? { label: 'Ultra', icon: Crown, gradient: 'from-amber-400 to-orange-400', text: 'text-amber-800', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200' }
    : profile?.plan === 'premium'
    ? { label: 'Premium', icon: Zap, gradient: 'from-primary to-purple-500', text: 'text-purple-700', bg: 'from-purple-50 to-indigo-50', border: 'border-purple-200' }
    : { label: 'Gratuit', icon: CreditCard, gradient: 'from-gray-400 to-gray-500', text: 'text-gray-700', bg: 'from-gray-50 to-gray-100', border: 'border-gray-200' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg shadow-gray-500/20">
            <Settings className="h-5 w-5 text-white" />
          </div>
          {fr.settings.titre}
        </h1>
        <p className="text-text-secondary mt-2">{fr.settings.sousTitre}</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-text">{fr.settings.profil}</h2>
            <p className="text-xs text-text-secondary">Modifiez vos informations personnelles</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={fr.auth.nomComplet}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Votre nom complet"
          />

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-text-muted" />
                {fr.auth.email}
              </span>
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-text-secondary">
              <Shield className="h-3.5 w-3.5 text-text-muted" />
              {profile?.email || ''}
            </div>
            <p className="text-xs text-text-muted mt-1">L&apos;email ne peut pas être modifié</p>
          </div>

          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" />
            {fr.settings.sauvegarder}
          </Button>
        </form>
      </div>

      {/* Plan Card */}
      <div className={`rounded-2xl bg-gradient-to-r ${planInfo.bg} border ${planInfo.border} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${planInfo.gradient} flex items-center justify-center shadow-lg`}>
              <planInfo.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className={`font-bold ${planInfo.text}`}>Plan {planInfo.label}</h3>
              <p className="text-xs text-text-secondary">
                {profile?.plan === 'free'
                  ? `${profile?.total_searches_used || 0}/2 recherches utilisées`
                  : 'Recherches illimitées'}
              </p>
            </div>
          </div>
          <Link
            href="/abonnement"
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              profile?.plan === 'free'
                ? 'bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90 shadow-lg shadow-primary/20'
                : 'bg-white/80 text-text-secondary hover:bg-white border border-gray-200'
            }`}
          >
            {profile?.plan === 'free' ? 'Passer à Premium' : 'Gérer'}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
