'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Button } from '@/components/ui/Button';
import { Save, Check, ExternalLink, BookOpen, Link2, Key, Database, Sparkles } from 'lucide-react';

export default function ComptePage() {
  const { supabase, profile } = useSupabase();
  const [notionToken, setNotionToken] = useState('');
  const [notionDatabaseId, setNotionDatabaseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNotionToken(profile.notion_token || '');
      setNotionDatabaseId(profile.notion_database_id || '');
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

  const isConnected = !!profile?.notion_token && !!profile?.notion_database_id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-lg">
            <Link2 className="h-5 w-5 text-white" />
          </div>
          Intégrations
        </h1>
        <p className="text-text-secondary mt-2">Connectez vos outils pour exporter vos prospects</p>
      </div>

      {/* Notion Section */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        {/* Notion Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-text">Notion</h2>
              <p className="text-xs text-text-secondary">Exportez vos prospects dans une base Notion</p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700">Connecté</span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Instructions */}
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-bold text-blue-800">Configuration en 4 étapes</p>
            </div>
            <ol className="space-y-2.5">
              {[
                {
                  text: <>Allez sur <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="underline font-semibold inline-flex items-center gap-1 text-blue-700 hover:text-blue-800">notion.so/my-integrations <ExternalLink className="h-3 w-3" /></a></>,
                },
                {
                  text: <>Créez une nouvelle intégration → copiez le <strong>Token secret</strong></>,
                },
                {
                  text: <>Dans Notion, ouvrez votre base de données → <strong>⋯ → Connexions → ajoutez votre intégration</strong></>,
                },
                {
                  text: <>Copiez l&apos;ID de la base (dans l&apos;URL : notion.so/<strong>[ID]</strong>?v=...)</>,
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-blue-800">
                  <span className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text mb-2">
                <Key className="h-3.5 w-3.5 text-text-muted" />
                Token d&apos;intégration Notion
              </label>
              <input
                type="password"
                value={notionToken}
                onChange={e => setNotionToken(e.target.value)}
                placeholder="secret_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-text mb-2">
                <Database className="h-3.5 w-3.5 text-text-muted" />
                ID de la base de données Notion
              </label>
              <input
                type="text"
                value={notionDatabaseId}
                onChange={e => setNotionDatabaseId(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <p className="text-xs text-text-muted mt-1.5 ml-1">
                L&apos;ID se trouve dans l&apos;URL de votre base : notion.so/<strong>cet-id</strong>?v=...
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <span>{error}</span>
            </div>
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

      {/* Google Sheets Section */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="white" fillOpacity="0.3"/>
              <path d="M14 2v6h6" fill="white" fillOpacity="0.2"/>
              <path d="M8 13h8M8 16h8M8 10h3" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-text">Google Sheets</h2>
            <p className="text-xs text-text-secondary">Connexion automatique lors du premier export</p>
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 px-4 py-3">
          <p className="text-sm text-green-800">
            {profile?.google_sheets_refresh_token ? (
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <strong>Connecté</strong> — Vos exports Google Sheets sont prêts
              </span>
            ) : (
              <>Aucune configuration nécessaire ! Lors de votre premier export, Google vous demandera d&apos;autoriser l&apos;accès.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
