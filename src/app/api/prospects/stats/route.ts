import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PROSPECT_STATUSES, ACTIVE_FUNNEL_STATUSES, type ProspectStatusKey } from '@/lib/crm/constants';

type PeriodKey = '7d' | '30d' | '90d' | 'all';

function periodToDate(period: PeriodKey): string | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') || '30d') as PeriodKey;
  const since = periodToDate(period);

  // 1. Pipeline actuel (current state des prospects)
  let prospectsQuery = supabase
    .from('prospects')
    .select('status, deal_value, signed_at, created_at')
    .eq('user_id', user.id);

  if (since) prospectsQuery = prospectsQuery.gte('created_at', since);
  const { data: prospects } = await prospectsQuery;

  const byStatus: Record<string, number> = {};
  for (const s of PROSPECT_STATUSES) byStatus[s.key] = 0;
  for (const p of prospects || []) {
    if (p.status in byStatus) byStatus[p.status]++;
  }

  // 2. CA genere (sommes des deal_value des prospects signés dans la période)
  let revenueQuery = supabase
    .from('prospects')
    .select('deal_value, signed_at')
    .eq('user_id', user.id)
    .eq('status', 'signe');

  if (since) revenueQuery = revenueQuery.gte('signed_at', since);
  const { data: signed } = await revenueQuery;
  const totalRevenue = (signed || []).reduce((acc, s) => acc + (Number(s.deal_value) || 0), 0);
  const signedCount = (signed || []).length;
  const avgDealValue = signedCount > 0 ? totalRevenue / signedCount : 0;

  // 3. Events dans la periode (pour activite recente)
  let eventsQuery = supabase
    .from('prospect_events')
    .select('event_type, created_at, prospect_id')
    .eq('user_id', user.id);

  if (since) eventsQuery = eventsQuery.gte('created_at', since);
  const { data: events } = await eventsQuery;

  const eventCounts: Record<string, number> = {
    created: 0,
    status_changed: 0,
    meeting_booked: 0,
    signed: 0,
    lost: 0,
  };
  for (const e of events || []) {
    if (e.event_type in eventCounts) eventCounts[e.event_type]++;
  }

  // 4. Funnel : prospects qui sont passes par chaque etape (current OR past)
  // Pour la simplicité v1 : on regarde le statut actuel cumule (active funnel)
  const funnel: { status: ProspectStatusKey; count: number; label: string; emoji: string; color: string }[] = [];
  let cumul = 0;
  for (let i = ACTIVE_FUNNEL_STATUSES.length - 1; i >= 0; i--) {
    const status = ACTIVE_FUNNEL_STATUSES[i];
    cumul += byStatus[status] || 0;
    const meta = PROSPECT_STATUSES.find(s => s.key === status)!;
    funnel.unshift({
      status,
      count: cumul,
      label: meta.label,
      emoji: meta.emoji,
      color: meta.funnelColor,
    });
  }

  // 5. Taux de conversion entre etapes
  const conversionRates: { from: string; to: string; rate: number }[] = [];
  for (let i = 0; i < funnel.length - 1; i++) {
    const from = funnel[i].count;
    const to = funnel[i + 1].count;
    conversionRates.push({
      from: funnel[i].label,
      to: funnel[i + 1].label,
      rate: from > 0 ? Math.round((to / from) * 100) : 0,
    });
  }

  // 6. Velocite : temps moyen contact -> signature
  let velocityDays: number | null = null;
  if (signedCount > 0) {
    const { data: signedProspects } = await supabase
      .from('prospects')
      .select('created_at, signed_at')
      .eq('user_id', user.id)
      .eq('status', 'signe')
      .not('signed_at', 'is', null);

    if (signedProspects && signedProspects.length > 0) {
      const totalMs = signedProspects.reduce((acc, p) => {
        const start = new Date(p.created_at).getTime();
        const end = new Date(p.signed_at!).getTime();
        return acc + (end - start);
      }, 0);
      velocityDays = Math.round(totalMs / signedProspects.length / (1000 * 60 * 60 * 24));
    }
  }

  // 7. Signatures par mois sur 6 derniers mois (pour graphique)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const { data: signedHistory } = await supabase
    .from('prospects')
    .select('signed_at, deal_value')
    .eq('user_id', user.id)
    .eq('status', 'signe')
    .gte('signed_at', sixMonthsAgo.toISOString())
    .not('signed_at', 'is', null);

  const monthlySignatures: { month: string; count: number; revenue: number }[] = [];
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const count = (signedHistory || []).filter(s => {
      const sd = new Date(s.signed_at!);
      return `${sd.getFullYear()}-${sd.getMonth()}` === key;
    }).length;
    const revenue = (signedHistory || []).filter(s => {
      const sd = new Date(s.signed_at!);
      return `${sd.getFullYear()}-${sd.getMonth()}` === key;
    }).reduce((acc, s) => acc + (Number(s.deal_value) || 0), 0);
    monthlySignatures.push({
      month: monthNames[d.getMonth()],
      count,
      revenue,
    });
  }

  // 8. Conversion globale (created -> signed)
  const created = byStatus['a_contacter'] + byStatus['contacte'] + byStatus['interesse'] + byStatus['rdv_pris'] + byStatus['signe'];
  const conversionRate = created > 0 ? Math.round((byStatus['signe'] / created) * 1000) / 10 : 0;

  // 9. Taux de closing REEL : RDV pris -> Signe (efficacite commerciale en RDV)
  // On regarde les prospects qui sont au moins arrives au statut "RDV pris" :
  // rdv_pris_cumul = ceux actuellement en rdv_pris + ceux qui ont signe (cumulatif)
  const rdvPrisCumul = byStatus['rdv_pris'] + byStatus['signe'];
  const closingRate = rdvPrisCumul > 0
    ? Math.round((byStatus['signe'] / rdvPrisCumul) * 1000) / 10
    : 0;

  return NextResponse.json({
    period,
    byStatus,
    funnel,
    conversionRates,
    activity: eventCounts,
    revenue: {
      total: totalRevenue,
      signedCount,
      avgDeal: Math.round(avgDealValue),
    },
    velocityDays,
    conversionRate,
    closingRate,
    rdvPrisCumul,
    monthlySignatures,
  });
}
