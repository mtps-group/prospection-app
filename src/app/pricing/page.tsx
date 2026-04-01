import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe, Check, X, ArrowLeft, Crown, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tarifs - ProspectWeb | Plans Gratuit, Premium et Ultra',
  description: 'Choisissez le plan ProspectWeb adapte a vos besoins. Gratuit pour tester, Premium pour la prospection illimitee, Ultra pour les fonctionnalites avancees.',
};

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    icon: Globe,
    color: 'text-text-muted',
    features: [
      { text: '2 recherches a vie', included: true },
      { text: '5 resultats visibles', included: true },
      { text: 'Export CSV', included: false },
      { text: 'Export Google Sheets / Notion', included: false },
      { text: 'Fiche entreprise detaillee', included: false },
      { text: 'Fonctionnalites avancees', included: false },
    ],
    cta: 'Commencer gratuitement',
    href: '/signup',
    variant: 'outline' as const,
  },
  {
    name: 'Premium',
    price: '39,99',
    icon: Crown,
    color: 'text-primary',
    popular: true,
    features: [
      { text: 'Recherches illimitees', included: true },
      { text: 'Jusqu\'a 60 resultats', included: true },
      { text: 'Export CSV', included: true },
      { text: 'Export Google Sheets / Notion', included: true },
      { text: 'Historique illimite', included: true },
      { text: 'Fiche entreprise detaillee', included: false },
      { text: 'Fonctionnalites avancees', included: false },
    ],
    cta: 'Passer a Premium',
    href: '/signup',
    variant: 'primary' as const,
  },
  {
    name: 'Ultra',
    price: '79',
    icon: Zap,
    color: 'text-amber-500',
    features: [
      { text: 'Tout Premium inclus', included: true },
      { text: 'Fiche entreprise (photos, avis, horaires)', included: true },
      { text: 'Nom du dirigeant via Pappers.fr', included: true },
      { text: 'Fiche detaillee de l\'entreprise', included: true },
      { text: 'Recherche email automatique', included: true },
      { text: 'Email de prospection personnalise', included: true },
      { text: 'Support prioritaire', included: true },
    ],
    cta: 'Passer a Ultra',
    href: '/signup',
    variant: 'outline' as const,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-text">
              Prospect<span className="text-primary">Web</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
            Des tarifs simples et transparents
          </h1>
          <p className="text-lg text-text-secondary">
            Commencez gratuitement, passez a la vitesse superieure quand vous etes pret.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-surface p-6 ${
                  plan.popular ? 'border-primary shadow-lg' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    Populaire
                  </span>
                )}
                <div className="text-center mb-6">
                  <Icon className={`mx-auto h-10 w-10 mb-3 ${plan.color}`} />
                  <h3 className="text-xl font-bold text-text">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-text">{plan.price}€</span>
                    {plan.price !== '0' && (
                      <span className="text-text-muted">/mois</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? 'text-text' : 'text-text-muted'}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.variant === 'primary'
                      ? 'bg-primary text-white hover:bg-primary-hover'
                      : 'border-2 border-border text-text hover:bg-surface-secondary'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
