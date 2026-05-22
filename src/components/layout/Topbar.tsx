'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { Menu, User, LogOut, Settings, ChevronDown, Crown, Zap, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { supabase, user, profile } = useSupabase();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    // Brute-force: efface les cookies cote client avant tout
    try {
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
        if (name.startsWith('sb-') || name.includes('supabase')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        }
      });
    } catch {}

    try {
      // 1. Server-side signOut : ecrit les Set-Cookie d'expiration dans la reponse HTTP
      await fetch('/api/auth/signout', { method: 'POST' });
      // 2. Client-side signOut : nettoie le store en memoire
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error:', err);
    }

    // Vide localStorage/sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    // Force une navigation HARD avec cache-busting (timestamp dans l'URL)
    // - location.replace : pas d'entry historique (l'user peut pas faire 'retour' vers etat connecte)
    // - ?t=timestamp : URL unique → bust le cache navigateur, force fresh fetch
    window.location.replace('/login?t=' + Date.now());
  };

  const planBadge = profile?.plan === 'ultra'
    ? { label: 'Ultra', icon: Crown, class: 'bg-gradient-to-r from-amber-400 to-orange-400 text-gray-900' }
    : profile?.plan === 'premium'
    ? { label: 'Premium', icon: Zap, class: 'bg-gradient-to-r from-primary to-purple-500 text-white' }
    : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 dark:border-violet-500/10 bg-white/80 dark:bg-[#15102e]/80 backdrop-blur-md px-4 lg:px-6">
      {/* Hamburger mobile */}
      <button
        onClick={onMenuClick}
        className="rounded-xl p-2.5 text-text-secondary hover:bg-gray-100 dark:hover:bg-violet-500/10 hover:text-text lg:hidden transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Quick search hint */}
      <Link
        href="/recherche"
        className="hidden lg:flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2 border border-gray-100 dark:border-violet-500/20 hover:border-gray-200 dark:hover:border-violet-500/30"
      >
        <Search className="h-4 w-4" />
        <span>Recherche rapide...</span>
        <kbd className="ml-6 text-xs bg-white dark:bg-[#15102e] rounded px-1.5 py-0.5 border border-gray-200 dark:border-violet-500/20 text-text-muted font-mono">Ctrl+K</kbd>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Plan badge */}
        {planBadge && (
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${planBadge.class} shadow-sm`}>
            <planBadge.icon className="h-3.5 w-3.5" />
            {planBadge.label}
          </div>
        )}

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-violet-500/10 transition-all border border-transparent hover:border-gray-100 dark:hover:border-violet-500/20"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="hidden font-semibold text-text sm:block max-w-[120px] truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
            </span>
            <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-gray-100 dark:border-violet-500/20 bg-white dark:bg-[#15102e] py-2 shadow-xl animate-fade-in">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-violet-500/10">
                <p className="text-sm font-bold text-text">
                  {profile?.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    router.push('/parametres');
                    setDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-gray-50 dark:hover:bg-violet-500/10 hover:text-text transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  {fr.nav.parametres}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  {loggingOut ? 'Déconnexion...' : fr.nav.deconnexion}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
