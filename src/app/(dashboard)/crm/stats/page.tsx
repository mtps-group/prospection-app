'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, CheckCircle, Euro, Calendar, Clock, ArrowDown, Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

type PeriodKey = '7d' | '30d' | '90d' | 'all';

interface FunnelStep {
  status: string;
  count: number;
  label: string;
  emoji: string;
  color: string;
}

interface StatsResponse {
  period: PeriodKey;
  byStatus: Record<string, number>;
  funnel: FunnelStep[];
  conversionRates: { from: string; to: string; rate: number }[];
  activity: Record<string, number>;
  revenue: { total: number; signedCount: number; avgDeal: number };
  velocityDays: number | null;
  conversionRate: number;
  monthlySignatures: { month: string; count: number; revenue: number }[];
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: 'all', label: 'Tout' },
];

export default function CrmStatsPage() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/prospects/stats?period=${period}`)
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, [period]);

  const maxFunnelCount = stats?.funnel.reduce((max, s) => Math.max(max, s.count), 0) || 1;
  const maxMonthlyRevenue = stats?.monthlySignatures.reduce((max, m) => Math.max(max, m.revenue), 0) || 1;

  return (
    <div className="space-y-6">
      {/* Filter période */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              period === p.key ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : !stats ? (
        <div className="text-center py-12 text-text-muted">Pas de données</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              icon={Users}
              label="Prospects créés"
              value={Object.values(stats.byStatus).reduce((a, b) => a + b, 0).toString()}
              sub="dans la période"
              gradient="from-blue-500 to-cyan-500"
            />
            <KpiCard
              icon={CheckCircle}
              label="Signatures"
              value={stats.revenue.signedCount.toString()}
              sub={stats.revenue.signedCount > 0 ? `${stats.revenue.avgDeal.toLocaleString('fr-FR')} € en moyenne` : 'aucune signature'}
              gradient="from-green-500 to-emerald-500"
            />
            <KpiCard
              icon={TrendingUp}
              label="Taux closing"
              value={`${stats.conversionRate}%`}
              sub="prospects créés → signés"
              gradient="from-amber-500 to-orange-500"
            />
            <KpiCard
              icon={Euro}
              label="CA généré"
              value={`${stats.revenue.total.toLocaleString('fr-FR')} €`}
              sub="dans la période"
              gradient="from-purple-500 to-pink-500"
            />
          </div>

          {/* Funnel + Conversion rates */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <div>
              <h3 className="font-bold text-text">Funnel de conversion</h3>
              <p className="text-xs text-text-muted">Du contact à la signature</p>
            </div>

            <div className="space-y-1">
              {stats.funnel.map((step, i) => {
                const width = Math.max(20, (step.count / maxFunnelCount) * 100);
                const nextRate = stats.conversionRates[i];

                return (
                  <div key={step.status}>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-32 flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-base">{step.emoji}</span>
                        <span className="text-sm font-semibold text-text-secondary">{step.label}</span>
                      </div>
                      <div className="flex-1 relative h-9">
                        <div
                          className="h-full rounded-lg flex items-center justify-end pr-3 transition-all"
                          style={{
                            width: `${width}%`,
                            background: `linear-gradient(90deg, ${step.color}aa 0%, ${step.color} 100%)`,
                          }}
                        >
                          <span className="text-sm font-bold text-white">{step.count}</span>
                        </div>
                      </div>
                    </div>
                    {nextRate && (
                      <div className="flex items-center gap-3 ml-32">
                        <div className="flex items-center gap-1 text-xs text-text-muted">
                          <ArrowDown className="h-3 w-3" />
                          <span className="font-semibold">{nextRate.rate}%</span>
                          <span>convertis</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activité + Vélocité */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
              <div>
                <h3 className="font-bold text-text">Activité dans la période</h3>
                <p className="text-xs text-text-muted">Vos actions sur les prospects</p>
              </div>
              <div className="space-y-3">
                <ActivityRow
                  icon={Phone}
                  label="Changements de statut"
                  value={stats.activity.status_changed || 0}
                  color="text-blue-600 bg-blue-50"
                />
                <ActivityRow
                  icon={Calendar}
                  label="RDV pris"
                  value={stats.activity.meeting_booked || 0}
                  color="text-violet-600 bg-violet-50"
                />
                <ActivityRow
                  icon={CheckCircle}
                  label="Signatures"
                  value={stats.activity.signed || 0}
                  color="text-green-600 bg-green-50"
                />
                <ActivityRow
                  icon={Users}
                  label="Nouveaux prospects"
                  value={stats.activity.created || 0}
                  color="text-purple-600 bg-purple-50"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
              <div>
                <h3 className="font-bold text-text">Performance commerciale</h3>
                <p className="text-xs text-text-muted">Métriques clés</p>
              </div>
              <div className="space-y-4">
                <PerfRow
                  icon={Clock}
                  label="Temps moyen contact → signature"
                  value={stats.velocityDays !== null ? `${stats.velocityDays} jours` : '—'}
                  color="text-amber-600"
                />
                <PerfRow
                  icon={TrendingUp}
                  label="Taux de closing global"
                  value={`${stats.conversionRate}%`}
                  color="text-green-600"
                />
                <PerfRow
                  icon={Euro}
                  label="Panier moyen"
                  value={stats.revenue.avgDeal > 0 ? `${stats.revenue.avgDeal.toLocaleString('fr-FR')} €` : '—'}
                  color="text-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Graphique mensuel */}
          {stats.monthlySignatures.some(m => m.count > 0 || m.revenue > 0) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
              <div>
                <h3 className="font-bold text-text">Évolution sur 6 mois</h3>
                <p className="text-xs text-text-muted">CA généré par mois</p>
              </div>
              <div className="flex items-end gap-3 h-48">
                {stats.monthlySignatures.map(m => {
                  const height = Math.max(4, (m.revenue / maxMonthlyRevenue) * 100);
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-xs font-bold text-text">
                        {m.revenue > 0 ? `${(m.revenue / 1000).toFixed(1)}k €` : ''}
                      </div>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${height}%`,
                            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                            minHeight: m.count > 0 ? '8px' : '4px',
                            opacity: m.count === 0 ? 0.2 : 1,
                          }}
                        />
                      </div>
                      <div className="text-xs text-text-muted font-medium">{m.month}</div>
                      <div className="text-[10px] text-text-muted">{m.count} signé{m.count > 1 ? 's' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, gradient }: { icon: typeof Users; label: string; value: string; sub: string; gradient: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-2">
      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-2xl font-black text-text">{value}</div>
        <div className="text-xs font-semibold text-text-secondary">{label}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

function ActivityRow({ icon: Icon, label, value, color }: { icon: typeof Phone; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <span className="text-lg font-black text-text">{value}</span>
    </div>
  );
}

function PerfRow({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <span className="text-lg font-bold text-text">{value}</span>
    </div>
  );
}
