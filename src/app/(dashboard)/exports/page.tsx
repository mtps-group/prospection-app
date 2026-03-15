'use client';

import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { Download, FileSpreadsheet, BookOpen, ExternalLink, Lock } from 'lucide-react';
import Link from 'next/link';

export default function ExportsPage() {
  const { profile } = useSupabase();
  const isPaid = profile?.plan === 'premium' || profile?.plan === 'ultra';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          {fr.exports.titre}
        </h1>
        <p className="text-text-secondary mt-1">{fr.exports.sousTitre}</p>
      </div>

      {!isPaid && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary-light/30 p-6 text-center">
          <Lock className="mx-auto h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-text mb-1">
            Fonctionnalite Premium
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Les exports sont disponibles a partir du plan Premium.
          </p>
          <Link href="/abonnement">
            <Button>{fr.billing.passerAPremium}</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Google Sheets */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle>{fr.exports.googleSheets}</CardTitle>
              <CardDescription>
                Exportez vos resultats directement vers Google Sheets
              </CardDescription>
              <div className="mt-3">
                {isPaid ? (
                  profile?.google_sheets_token ? (
                    <Badge variant="success">{fr.exports.connecte}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = '/api/integrations/google/connect'}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {fr.exports.connecter}
                    </Button>
                  )
                ) : (
                  <Badge variant="default">Premium requis</Badge>
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
                Exportez vos resultats vers une base Notion
              </CardDescription>
              <div className="mt-3">
                {isPaid ? (
                  profile?.notion_access_token ? (
                    <Badge variant="success">{fr.exports.connecte}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = '/api/integrations/notion/connect'}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {fr.exports.connecter}
                    </Button>
                  )
                ) : (
                  <Badge variant="default">Premium requis</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
