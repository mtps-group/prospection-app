'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Users,
  ArrowRight,
  Globe,
  TrendingUp,
  Smartphone,
  Briefcase,
  CheckCircle,
  X,
  Zap,
  Rocket,
  PartyPopper,
  Star,
} from 'lucide-react';

export type OnboardingPersona = 'web_design' | 'seo' | 'smm' | 'b2b' | 'autre';

interface PersonaSuggestion {
  key: OnboardingPersona;
  icon: typeof Globe;
  title: string;
  description: string;
  suggestedSearch: string;
  gradient: string;
  emoji: string;
}

const PERSONAS: PersonaSuggestion[] = [
  {
    key: 'web_design',
    icon: Globe,
    title: 'Sites web',
    description: 'Je vends des sites web / refontes',
    suggestedSearch: 'boulangerie',
    gradient: 'from-blue-500 to-cyan-500',
    emoji: '🌐',
  },
  {
    key: 'seo',
    icon: TrendingUp,
    title: 'SEO & Marketing',
    description: 'Je vends du référencement ou de la pub',
    suggestedSearch: 'restaurant',
    gradient: 'from-amber-500 to-orange-500',
    emoji: '📈',
  },
  {
    key: 'smm',
    icon: Smartphone,
    title: 'Community Management',
    description: 'Je gère les réseaux sociaux',
    suggestedSearch: 'salon de coiffure',
    gradient: 'from-pink-500 to-rose-500',
    emoji: '📱',
  },
  {
    key: 'b2b',
    icon: Briefcase,
    title: 'Services B2B',
    description: 'Conseil, compta, ménage, juridique...',
    suggestedSearch: 'cabinet d\'avocat',
    gradient: 'from-violet-500 to-purple-600',
    emoji: '💼',
  },
];

interface OnboardingFlowProps {
  onComplete: (data: { persona: OnboardingPersona | null; suggestedSearch: string | null }) => void;
  userName?: string | null;
}

export function OnboardingFlow({ onComplete, userName }: OnboardingFlowProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [persona, setPersona] = useState<OnboardingPersona | null>(null);
  const [completing, setCompleting] = useState(false);
  const [stepKey, setStepKey] = useState(0); // force re-render pour relancer les animations

  useEffect(() => {
    setStepKey(k => k + 1);
  }, [step]);

  const finish = async (selectedPersona: OnboardingPersona | null, suggestedSearch: string | null) => {
    setCompleting(true);
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
  const goNext = () => setStep((s) => Math.min(3, s + 1) as 0 | 1 | 2 | 3);
  const goPrev = () => setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2 | 3);

  const handleFinalSubmit = () => {
    const selected = PERSONAS.find((p) => p.key === persona);
    setStep(3);
    setTimeout(() => {
      finish(persona, selected?.suggestedSearch ?? null);
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top left, #1e1b4b 0%, #0f0a2e 50%, #050518 100%)',
      }}
    >
      {/* Background animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] h-[600px] w-[600px] rounded-full opacity-30 blur-3xl animate-blob"
             style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute top-[20%] right-[-200px] h-[500px] w-[500px] rounded-full opacity-25 blur-3xl animate-blob-2"
             style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-200px] left-[30%] h-[700px] w-[700px] rounded-full opacity-20 blur-3xl animate-blob-3"
             style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }} />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* Skip button */}
      {step < 3 && (
        <button
          onClick={skip}
          disabled={completing}
          className="absolute top-6 right-6 z-30 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all"
        >
          Passer le tour
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Logo top-left */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-2.5 animate-slide-up-fade">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">
          Prospect<span className="bg-gradient-to-r from-violet-300 to-pink-300 bg-clip-text text-transparent">Web</span>
        </span>
      </div>

      {/* Progress dots */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i < step
                ? 'w-8 bg-gradient-to-r from-violet-400 to-pink-400'
                : i === step
                ? 'w-12 bg-gradient-to-r from-violet-400 to-pink-400 shadow-lg shadow-violet-500/40'
                : 'w-8 bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Content centered */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 py-20 overflow-y-auto">
        <div key={stepKey} className="w-full max-w-3xl animate-slide-up-fade">
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white/80 animate-stagger-1">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                Bienvenue {userName ? userName.split(' ')[0] : ''}
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.05] animate-stagger-2">
                  Tu vas trouver tes<br />
                  <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent animate-gradient-shift">
                    premiers clients
                  </span>
                  <br />en 3 minutes.
                </h1>
                <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto animate-stagger-3">
                  Laisse-moi te montrer comment ProspectWeb va devenir ta machine à leads.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
                <ValueCard
                  icon={Search}
                  title="60 prospects"
                  description="par recherche, avec téléphone & email"
                  gradient="from-blue-400 to-cyan-400"
                  delay={3}
                />
                <ValueCard
                  icon={Users}
                  title="CRM intégré"
                  description="de À contacter à Signé"
                  gradient="from-purple-400 to-pink-400"
                  delay={4}
                />
                <ValueCard
                  icon={TrendingUp}
                  title="Stats live"
                  description="taux closing, CA, funnel"
                  gradient="from-emerald-400 to-green-400"
                  delay={5}
                />
              </div>

              <div className="pt-2 animate-stagger-5">
                <button
                  onClick={goNext}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-violet-500/30 transition-all hover:scale-105 hover:shadow-violet-500/50"
                >
                  <Rocket className="h-5 w-5 transition-transform group-hover:rotate-[20deg]" />
                  C&apos;est parti
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="text-xs text-white/40 mt-4">
                  ✨ Aucune carte bancaire requise · 2 recherches gratuites incluses
                </p>
              </div>
            </div>
          )}

          {/* STEP 1 — Comment ça marche */}
          {step === 1 && (
            <div className="text-center space-y-10">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white/80 animate-stagger-1">
                  <Star className="h-3.5 w-3.5 text-yellow-300" />
                  Comment ça marche
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight animate-stagger-2">
                  3 étapes pour ton<br />
                  <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                    premier pipeline
                  </span>
                </h2>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <StepCard
                  number={1}
                  icon={Search}
                  title="Tape ton activité + ta ville"
                  description="Ex: « plombier Toulouse » ou « salon de coiffure Lyon »"
                  delay={2}
                />
                <StepCard
                  number={2}
                  icon={Users}
                  title="Récupère 60 prospects qualifiés"
                  description="Téléphone, adresse, site web, avis Google, réseaux sociaux"
                  delay={3}
                />
                <StepCard
                  number={3}
                  icon={TrendingUp}
                  title="Suis-les dans ton CRM intégré"
                  description="6 statuts, RDV, montants signés, kanban, stats temps réel"
                  delay={4}
                />
              </div>

              <div className="pt-2 flex items-center justify-center gap-3 animate-stagger-5">
                <button
                  onClick={goPrev}
                  className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  ← Retour
                </button>
                <button
                  onClick={goNext}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 px-8 py-3.5 text-sm font-bold text-white shadow-2xl shadow-violet-500/30 transition-all hover:scale-105"
                >
                  Continuer
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Persona */}
          {step === 2 && (
            <div className="text-center space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white/80 animate-stagger-1">
                  <Zap className="h-3.5 w-3.5 text-yellow-300" />
                  Personnalise ton expérience
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight animate-stagger-2">
                  Tu vends<br />
                  <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                    quoi exactement ?
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-white/60 max-w-md mx-auto animate-stagger-3">
                  On va te suggérer ta première recherche en fonction.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {PERSONAS.map((p, i) => (
                  <PersonaCard
                    key={p.key}
                    persona={p}
                    selected={persona === p.key}
                    onClick={() => setPersona(p.key)}
                    delay={i + 1}
                  />
                ))}
                <button
                  onClick={() => setPersona('autre')}
                  className={`sm:col-span-2 group rounded-2xl border-2 border-dashed transition-all px-4 py-3 animate-stagger-5 ${
                    persona === 'autre'
                      ? 'border-violet-400 bg-violet-500/10 text-violet-200'
                      : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm font-semibold">✨ Autre / Je ne sais pas encore</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={goPrev}
                  className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md px-6 py-3.5 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={!persona || completing}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-400 hover:to-pink-400 px-8 py-3.5 text-sm font-bold text-white shadow-2xl shadow-violet-500/30 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <Zap className="h-4 w-4" />
                  Lancer ma première recherche
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Success animation */}
          {step === 3 && (
            <div className="text-center space-y-6">
              {/* Confetti */}
              <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {[...Array(40)].map((_, i) => {
                  const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
                  const color = colors[i % colors.length];
                  return (
                    <div
                      key={i}
                      className="absolute h-2 w-2 rounded-full animate-confetti"
                      style={{
                        left: `${Math.random() * 100}%`,
                        backgroundColor: color,
                        animationDelay: `${Math.random() * 1.5}s`,
                        animationDuration: `${2 + Math.random() * 2}s`,
                      }}
                    />
                  );
                })}
              </div>

              <div className="animate-scale-in">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 blur-3xl opacity-50 animate-glow" />
                  <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-violet-500/50">
                    <PartyPopper className="h-12 w-12 text-white animate-float" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 animate-slide-up-fade">
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  Bienvenue à bord ! 🚀
                </h2>
                <p className="text-base sm:text-lg text-white/70 max-w-md mx-auto">
                  Ta première recherche est prête. <br />
                  Ajoute juste ta ville et c&apos;est parti.
                </p>
              </div>

              <div className="pt-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 text-xs text-white/60">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Préparation de ton espace...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ValueCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: typeof Search;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <div className={`group rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all animate-stagger-${delay}`}>
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="font-bold text-white text-sm">{title}</p>
      <p className="text-xs text-white/50 mt-0.5 leading-snug">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  description,
  delay,
}: {
  number: number;
  icon: typeof Search;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <div className={`group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all text-left animate-stagger-${delay}`}>
      <div className="relative flex-shrink-0">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-violet-300" />
        </div>
        <div className="absolute -top-1.5 -left-1.5 h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-violet-500/40">
          {number}
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h4 className="font-bold text-white text-base">{title}</h4>
        <p className="text-sm text-white/55 mt-1">{description}</p>
      </div>
    </div>
  );
}

function PersonaCard({
  persona,
  selected,
  onClick,
  delay,
}: {
  persona: PersonaSuggestion;
  selected: boolean;
  onClick: () => void;
  delay: number;
}) {
  const Icon = persona.icon;
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-all text-left animate-stagger-${delay} ${
        selected
          ? 'border-violet-400 bg-gradient-to-br from-violet-500/20 to-pink-500/15 shadow-2xl shadow-violet-500/20 scale-[1.02]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08] hover:scale-[1.02]'
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center shadow-lg">
          <CheckCircle className="h-4 w-4 text-white" fill="currentColor" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white text-base flex items-center gap-1.5">
            {persona.title}
          </h4>
          <p className="text-xs text-white/50 mt-1 leading-snug">{persona.description}</p>
          <p className="text-[10px] text-violet-300/80 mt-2 italic">
            → suggéré : « {persona.suggestedSearch} »
          </p>
        </div>
      </div>
    </button>
  );
}
