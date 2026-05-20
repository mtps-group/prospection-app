'use client';

import { useState } from 'react';
import {
  Sparkles,
  Search,
  Users,
  ArrowRight,
  Globe,
  TrendingUp,
  Smartphone,
  Briefcase,
  Star,
  CheckCircle,
  X,
  Zap,
} from 'lucide-react';

export type OnboardingPersona = 'web_design' | 'seo' | 'smm' | 'b2b' | 'autre';

interface PersonaSuggestion {
  key: OnboardingPersona;
  icon: typeof Globe;
  title: string;
  description: string;
  suggestedSearch: string;
  gradient: string;
}

const PERSONAS: PersonaSuggestion[] = [
  {
    key: 'web_design',
    icon: Globe,
    title: 'Sites web',
    description: 'Je vends des sites web / refontes',
    suggestedSearch: 'boulangerie',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'seo',
    icon: TrendingUp,
    title: 'SEO / Marketing',
    description: 'Je vends du SEO ou du marketing digital',
    suggestedSearch: 'restaurant',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    key: 'smm',
    icon: Smartphone,
    title: 'Community Management',
    description: 'Je vends du SMM / gestion réseaux sociaux',
    suggestedSearch: 'salon de coiffure',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    key: 'b2b',
    icon: Briefcase,
    title: 'Services B2B',
    description: 'Je vends d\'autres services pro (compta, ménage, conseil...)',
    suggestedSearch: 'cabinet d\'avocat',
    gradient: 'from-violet-500 to-purple-600',
  },
];

interface OnboardingFlowProps {
  onComplete: (data: { persona: OnboardingPersona | null; suggestedSearch: string | null }) => void;
  userName?: string | null;
}

export function OnboardingFlow({ onComplete, userName }: OnboardingFlowProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [persona, setPersona] = useState<OnboardingPersona | null>(null);
  const [completing, setCompleting] = useState(false);

  const finish = async (selectedPersona: OnboardingPersona | null, suggestedSearch: string | null) => {
    setCompleting(true);
    // Best-effort : si l'API echoue, on close quand meme la modale
    try {
      await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: selectedPersona }),
      });
    } catch {
      // ignore
    }
    onComplete({ persona: selectedPersona, suggestedSearch });
  };

  const skip = () => finish(null, null);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Header avec progress */}
        <div className="relative bg-gradient-to-br from-primary via-indigo-600 to-purple-600 px-8 pt-8 pb-6">
          <button
            onClick={skip}
            disabled={completing}
            className="absolute top-4 right-4 text-white/70 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors text-xs font-semibold flex items-center gap-1"
          >
            Passer
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5 mb-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all flex-1 ${
                  i <= step ? 'bg-white' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="text-white">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-bold mb-3">
              <Sparkles className="h-3 w-3" />
              Bienvenue {userName ? `, ${userName.split(' ')[0]}` : ''}
            </div>
            <h2 className="text-2xl font-extrabold leading-tight">
              {step === 0 && 'Tu vas trouver tes premiers clients en 3 minutes'}
              {step === 1 && 'Comment ça marche ?'}
              {step === 2 && 'Quels prospects tu cherches ?'}
            </h2>
            <p className="text-white/80 mt-1.5 text-sm">
              {step === 0 && 'Laisse-moi te montrer comment ProspectWeb va devenir ta machine à leads.'}
              {step === 1 && '3 étapes simples pour transformer une ville en pipeline commercial.'}
              {step === 2 && 'Choisis ton activité pour qu\'on lance ta première recherche ensemble.'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* STEP 0 : Welcome */}
          {step === 0 && (
            <>
              <div className="grid sm:grid-cols-3 gap-3">
                <ValueCard
                  icon={Search}
                  title="60 prospects"
                  description="par recherche, avec coordonnées complètes"
                  gradient="from-blue-500 to-cyan-500"
                />
                <ValueCard
                  icon={Users}
                  title="CRM intégré"
                  description="suis tes leads de À contacter à Signé"
                  gradient="from-purple-500 to-pink-500"
                />
                <ValueCard
                  icon={TrendingUp}
                  title="Stats temps réel"
                  description="taux closing, CA généré, funnel"
                  gradient="from-green-500 to-emerald-500"
                />
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm text-amber-900">
                  <strong className="font-bold">Bonne nouvelle :</strong> tu as <strong>2 recherches gratuites</strong> pour tester. Pas besoin de carte bleue.
                </p>
              </div>
            </>
          )}

          {/* STEP 1 : Comment ça marche */}
          {step === 1 && (
            <div className="space-y-3">
              <StepCard
                number={1}
                title="Tu tapes ton type d'activité + ta ville"
                description="Ex: « salon de coiffure Lyon » ou « plombier Toulouse »"
                icon={Search}
              />
              <StepCard
                number={2}
                title="Tu récupères jusqu'à 60 prospects qualifiés"
                description="Nom, téléphone, adresse, site web, avis Google, réseaux sociaux..."
                icon={Users}
              />
              <StepCard
                number={3}
                title="Tu les gères dans ton CRM intégré"
                description="6 statuts, RDV, montants des contrats, stats, tags..."
                icon={TrendingUp}
              />
            </div>
          )}

          {/* STEP 2 : Persona */}
          {step === 2 && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                {PERSONAS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPersona(p.key)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md group ${
                      persona === p.key
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <p.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-text text-sm">{p.title}</h4>
                          {persona === p.key && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">{p.description}</p>
                        <p className="text-[10px] text-text-muted mt-1.5 italic">
                          Suggéré : « {p.suggestedSearch} »
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPersona('autre')}
                className={`w-full text-center rounded-2xl border-2 border-dashed p-3 transition-all ${
                  persona === 'autre'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-text-muted hover:border-gray-300 hover:text-text-secondary'
                }`}
              >
                <span className="text-sm font-semibold">✨ Autre / Je ne sais pas encore</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-5 flex items-center justify-between border-t border-gray-100">
          {step > 0 ? (
            <button
              onClick={() => setStep((step - 1) as 0 | 1 | 2)}
              disabled={completing}
              className="text-sm font-semibold text-text-secondary hover:text-text transition-colors"
            >
              ← Retour
            </button>
          ) : <div />}

          {step < 2 ? (
            <button
              onClick={() => setStep((step + 1) as 0 | 1 | 2)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              {step === 0 ? 'Continuer' : 'Suivant'}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                const selected = PERSONAS.find(p => p.key === persona);
                finish(persona, selected?.suggestedSearch ?? null);
              }}
              disabled={!persona || completing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-purple-500 px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completing ? 'C\'est parti...' : 'Lancer ma première recherche'}
              <Zap className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ValueCard({ icon: Icon, title, description, gradient }: { icon: typeof Search; title: string; description: string; gradient: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="font-bold text-text text-sm">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5 leading-snug">{description}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon: Icon }: { number: number; title: string; description: string; icon: typeof Search }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4 bg-white">
      <div className="relative flex-shrink-0">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-[10px] font-black text-white shadow-md">
          {number}
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="font-bold text-text text-sm">{title}</h4>
        <p className="text-xs text-text-secondary mt-0.5">{description}</p>
      </div>
    </div>
  );
}

