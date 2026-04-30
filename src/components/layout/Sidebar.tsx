'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/providers/SupabaseProvider';
import { getPlanConfig } from '@/lib/constants';
import { fr } from '@/i18n/fr';
import {
  Search,
  History,
  Download,
  Settings,
  CreditCard,
  Globe,
  X,
  Crown,
  Zap,
  User,
  Home,
  Users,
  ArrowUpRight,
  Phone,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNav = [
  { name: fr.nav.recherche, href: '/recherche', icon: Search, gradient: 'from-blue-500 to-cyan-500', plan: null },
  { name: 'Mes Prospects', href: '/prospects', icon: Users, gradient: 'from-purple-500 to-pink-500', plan: null },
  { name: fr.nav.historique, href: '/historique', icon: History, gradient: 'from-amber-500 to-orange-500', plan: null },
  { name: fr.nav.exports, href: '/exports', icon: Download, gradient: 'from-green-500 to-emerald-500', plan: null },
  { name: 'Analyse d\'appels', href: '/appels', icon: Phone, gradient: 'from-violet-500 to-purple-600', plan: 'agence' },
];

const bottomNav = [
  { name: fr.nav.parametres, href: '/parametres', icon: Settings },
  { name: fr.nav.abonnement, href: '/abonnement', icon: CreditCard },
  { name: 'Mon compte', href: '/compte', icon: User },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useSupabase();
  const plan = getPlanConfig(profile?.plan || 'free');

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-gray-100 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/recherche" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text">
              Prospect<span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Web</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-4 py-3 space-y-1">
          {/* Page accueil */}
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted hover:bg-gray-50 hover:text-text transition-all mb-3"
          >
            <Home className="h-4.5 w-4.5" />
            Page d&apos;accueil
            <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-50" />
          </Link>

          <div className="h-px bg-gray-100 mb-3" />

          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted/60 mb-2">Prospection</p>

          {mainNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const isLocked = item.plan === 'agence' && profile?.plan !== 'agence';
            return (
              <Link
                key={item.name}
                href={isLocked ? '/abonnement' : item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary shadow-sm'
                    : isLocked
                    ? 'text-text-muted hover:bg-gray-50 opacity-70'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text'
                )}
              >
                <div className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                  isActive
                    ? `bg-gradient-to-br ${item.gradient} shadow-md`
                    : 'bg-gray-100 group-hover:bg-gray-200'
                )}>
                  <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-text-muted group-hover:text-text-secondary')} />
                </div>
                {item.name}
                {isLocked && (
                  <span className="ml-auto rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-600">AGENCE</span>
                )}
                {isActive && !isLocked && <div className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse-glow" />}
              </Link>
            );
          })}

          <div className="h-px bg-gray-100 my-3" />

          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted/60 mb-2">Compte</p>

          {bottomNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gray-100 text-text'
                    : 'text-text-muted hover:bg-gray-50 hover:text-text-secondary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Plan indicator */}
        <div className="p-4">
          {profile?.plan === 'free' ? (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-text">Plan Gratuit</p>
                  <p className="text-[10px] text-text-muted">
                    {profile.total_searches_used}/{plan.maxSearchesLifetime} recherches
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                  style={{
                    width: `${Math.min(
                      (profile.total_searches_used / plan.maxSearchesLifetime) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <Link
                href="/abonnement"
                onClick={onClose}
                className="block w-full rounded-xl bg-gradient-to-r from-primary to-purple-500 py-2.5 text-center text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                {fr.billing.passerAPremium} →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-md">
                {profile?.plan === 'ultra' ? (
                  <Crown className="h-4.5 w-4.5 text-white" />
                ) : (
                  <Zap className="h-4.5 w-4.5 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-text">Plan {plan.name}</p>
                <p className="text-[10px] text-text-muted">
                  {profile?.plan === 'agence' ? 'Analyse d\'appels incluse' : 'Recherches illimitées'}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
