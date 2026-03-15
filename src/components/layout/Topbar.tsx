'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { Menu, User, LogOut, Settings, ChevronDown } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { supabase, user, profile } = useSupabase();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      {/* Hamburger mobile */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary hover:text-text lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-secondary transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden font-medium text-text sm:block">
            {profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
          </span>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface py-1 shadow-lg animate-fade-in">
            <div className="border-b border-border px-4 py-2">
              <p className="text-sm font-medium text-text">
                {profile?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                router.push('/parametres');
                setDropdownOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text"
            >
              <Settings className="h-4 w-4" />
              {fr.nav.parametres}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              {fr.nav.deconnexion}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
