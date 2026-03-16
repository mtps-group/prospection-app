'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Button } from '@/components/ui/Button';
import { Save, Check, ExternalLink } from 'lucide-react';

export default function ComptePage() {
  const { supabase, profile } = useSupabase();
  const [notionToken, setNotionToken] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNotionToken((profile as Record<string, unknown>).notion_token as string || '');
      setNotionDatabaseId((profile as Record<string, unknown>).notion_database_id as string || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notion_token: notionToken.trim() || null,
          notion_database_id: notionDatabaseId.trim() || null,
        })
        .eq('id', profile?.id);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-text mb-8">Paramètres du compte</h1>

      {/* Section Notion */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-5">
        <div className="flex items-center gap-3">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447z" fill="#000"/>
            <path d="M5.19 6.575v13.682c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V5.414c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.16z" fill="#000"/>
            <path d="M18.45 7.415l-3.41.233v5.603l3.41-.233V7.415z" fill="white"/>
            <path d="M6.777 8.209l.047 1.12 2.567-.14v7.696l1.167-.07V9.19l2.567-.14V7.93l-6.348.28z" fill="white"/>
          </svg>
          <h2 className="text-lg font-semibold text-text">Intégration Notion</h2>
        </div>

        <p className="text-sm text-text-secondary">
          Connectez votre espace Notion pour exporter vos prospects directement dans une base de données.
        </p>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 space-y-2">
          <p className="font-semibold">Comment configurer :</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Allez sur <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-1">notion.so/my-integrations <ExternalLink className="h-3 w-3" /></a></li>
            <li>Créez une nouvelle intégration → copiez le <strong>Token secret</strong></li>
            <li>Dans Notion, ouvrez votre base de données → <strong>⋯ → Connexions → ajoutez votre intégration</strong></li>
            <li>Copiez l&apos;ID de la base (dans l&apos;URL : notion.so/[ID]?v=...)</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Token d&apos;intégration Notion
            </label>
            <input
              type="password"
              value={notionToken}
              onChange={e => setNotionToken(e.target.value)}
              placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              ID de la base de données Notion
            </label>
            <input
              type="text"
              value={notionDatabaseId}
              onChange={e => setNotionDatabaseId(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className="text-xs text-text-muted mt-1">
              L&apos;ID se trouve dans l&apos;URL de votre base : notion.so/<strong>cet-id</strong>?v=...
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saved
            ? <><Check className="h-4 w-4" /> Sauvegardé !</>
            : saving
            ? 'Sauvegarde...'
            : <><Save className="h-4 w-4" /> Sauvegarder</>
          }
        </Button>
      </div>
    </div>
  );
}
