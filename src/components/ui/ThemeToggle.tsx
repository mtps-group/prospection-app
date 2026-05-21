'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/providers/ThemeProvider';

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
];

interface ThemeToggleProps {
  variant?: 'pill' | 'compact';
}

export function ThemeToggle({ variant = 'pill' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (variant === 'compact') {
    // Toggle simple Sun/Moon pour la sidebar/topbar
    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text transition-all"
        title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              active
                ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            title={opt.label}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
