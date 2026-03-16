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
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: fr.nav.recherche, href: '/recherche', icon: Search },
  { name: fr.nav.historique, href: '/historique', icon: History },
  { name: fr.nav.exports, href: '/exports', icon: Download },
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
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/recherche" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-text">
              Prospect<span className="text-primary">Web</span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Plan indicator */}
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-surface-secondary p-3">
            <div className="flex items-center gap-2 mb-2">
              {profile?.plan === 'ultra' ? (
                <Zap className="h-4 w-4 text-amber-500" />
              ) : profile?.plan === 'premium' ? (
                <Crown className="h-4 w-4 text-primary" />
              ) : (
                <Globe className="h-4 w-4 text-text-muted" />
              )}
              <span className="text-sm font-semibold text-text">
                Plan {plan.name}
              </span>
            </div>

            {profile?.plan === 'free' && (
              <>
                <p className="text-xs text-text-secondary mb-2">
                  {profile.total_searches_used}/{plan.maxSearchesLifetime} {fr.billing.rechercheUtilisees}
                </p>
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
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
                  className="mt-3 block w-full rounded-lg bg-primary py-2 text-center text-xs font-semibold text-white hover:bg-primary-hover transition-colors animate-pulse-glow"
                >
                  {fr.billing.passerAPremium}
                </Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
