'use client';

import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { Download, FileSpreadsheet, BookOpen, FileText, Info } from 'lucide-react';
import Link from 'next/link';

export default function ExportsPage() {
  const { profile } = useSupabase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          {fr.exports.titre}
        </h1>
        <p className="text-text-secondary mt-1">{fr.exports.sousTitre}</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl bg-primary-light/40 border border-primary/20 px-4 py-3 text-sm text-primary">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          Les exports sont disponibles pour <strong>tous les plans</strong>, y compris le plan gratuit.
          Faites une recherche depuis la page <Link href="/recherche" className="underline font-semibold">Recherche</Link> puis cliquez sur le bouton d&apos;export souhaité.
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">

        {/* CSV */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle>Export CSV</CardTitle>
              <CardDescription>
                Téléchargez vos résultats en fichier CSV, compatible avec Excel
              </CardDescription>
              <div className="mt-3">
                <Badge variant="success">Disponible</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Google Sheets */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle>{fr.exports.googleSheets}</CardTitle>
              <CardDescription>
                Exportez vos résultats directement vers Google Sheets
              </CardDescription>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge variant="success">Disponible</Badge>
                {profile?.google_sheets_refresh_token && (
                  <Badge variant="success">{fr.exports.connecte}</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Notion */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <BookOpen className="h-6 w-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <CardTitle>{fr.exports.notion}</CardTitle>
              <CardDescription>
                Exportez vos résultats vers une base Notion
              </CardDescription>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge variant="success">Disponible</Badge>
                {profile?.notion_token ? (
                  <Badge variant="success">{fr.exports.connecte}</Badge>
                ) : (
                  <Link href="/compte" className="text-xs text-primary underline font-medium">
                    Configurer →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* Comment utiliser */}
      <Card>
        <h3 className="font-semibold text-text mb-3">Comment exporter ?</h3>
        <ol className="space-y-2 text-sm text-text-secondary list-decimal list-inside">
          <li>Allez sur la page <Link href="/recherche" className="text-primary font-medium underline">Recherche</Link></li>
          <li>Lancez une recherche (ex : &quot;plombier Paris&quot;)</li>
          <li>Une fois les résultats affichés, cliquez sur <strong>CSV</strong>, <strong>Google Sheets</strong> ou <strong>Notion</strong></li>
          <li>Pour Google Sheets : autorisez l&apos;accès à votre compte Google (une seule fois)</li>
          <li>Pour Notion : configurez votre token dans <Link href="/compte" className="text-primary font-medium underline">Mon compte</Link></li>
        </ol>
      </Card>

    </div>
  );
}
