'use client';

import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSupabase } from '@/providers/SupabaseProvider';
import { fr } from '@/i18n/fr';
import { Download, FileSpreadsheet, BookOpen, FileText, Info, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ExportsPage() {
  const { profile } = useSupabase();

  const exports = [
    {
      name: 'CSV / Excel',
      desc: 'Téléchargez vos résultats en fichier CSV, compatible avec Excel, Numbers et tous les tableurs',
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
      bgLight: 'from-blue-50 to-cyan-50',
      connected: true,
      connectLabel: 'Prêt',
    },
    {
      name: fr.exports.googleSheets,
      desc: 'Exportez vos résultats directement vers un nouveau Google Sheet en un clic',
      icon: FileSpreadsheet,
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'from-green-50 to-emerald-50',
      connected: !!profile?.google_sheets_refresh_token,
      connectLabel: profile?.google_sheets_refresh_token ? 'Connecté' : 'Auto-connect au 1er export',
    },
    {
      name: fr.exports.notion,
      desc: 'Exportez vos résultats vers une base de données Notion',
      icon: BookOpen,
      gradient: 'from-gray-700 to-gray-900',
      bgLight: 'from-gray-50 to-gray-100',
      connected: !!profile?.notion_token,
      connectLabel: profile?.notion_token ? 'Connecté' : 'À configurer',
      configLink: '/compte',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
            <Download className="h-5 w-5 text-white" />
          </div>
          {fr.exports.titre}
        </h1>
        <p className="text-text-secondary mt-2">{fr.exports.sousTitre}</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 px-5 py-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-text mb-0.5">Exports disponibles pour tous les plans</p>
          <p className="text-sm text-text-secondary">
            Faites une recherche depuis la page <Link href="/recherche" className="text-primary font-semibold hover:underline">Recherche</Link> puis cliquez sur le bouton d&apos;export souhaité.
          </p>
        </div>
      </div>

      {/* Export cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {exports.map((exp) => (
          <div key={exp.name} className="group rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${exp.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <exp.icon className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="mb-1.5">{exp.name}</CardTitle>
            <CardDescription className="mb-4 text-xs leading-relaxed">{exp.desc}</CardDescription>
            <div className="flex items-center gap-2">
              {exp.connected ? (
                <Badge variant="success">{exp.connectLabel}</Badge>
              ) : exp.configLink ? (
                <Link href={exp.configLink} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  Configurer <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <Badge variant="default">{exp.connectLabel}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* How to */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="font-bold text-text mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Comment exporter ?
        </h3>
        <ol className="space-y-3 text-sm text-text-secondary">
          {[
            { step: 'Allez sur la page Recherche', link: '/recherche' },
            { step: 'Lancez une recherche (ex: "plombier Paris")' },
            { step: 'Cliquez sur CSV, Google Sheets ou Notion' },
            { step: 'Google Sheets : autorisez l\'accès Google (une seule fois)' },
            { step: 'Notion : configurez votre token dans Mon compte', link: '/compte' },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {i + 1}
              </span>
              <span>
                {item.link ? (
                  <Link href={item.link} className="text-primary font-medium hover:underline">{item.step}</Link>
                ) : item.step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
