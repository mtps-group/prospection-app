/**
 * Constants CRM partagees entre les pages prospects et stats.
 */

export const PROSPECT_STATUSES = [
  {
    key: 'a_contacter',
    label: 'À contacter',
    emoji: '⭕',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    activeColor: 'bg-gray-100 text-gray-800 border-gray-300 ring-2 ring-gray-300/50',
    funnelColor: '#9ca3af',
  },
  {
    key: 'contacte',
    label: 'Contacté',
    emoji: '📞',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    activeColor: 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-300/50',
    funnelColor: '#3b82f6',
  },
  {
    key: 'interesse',
    label: 'Intéressé',
    emoji: '🤝',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    activeColor: 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-300/50',
    funnelColor: '#f59e0b',
  },
  {
    key: 'rdv_pris',
    label: 'RDV pris',
    emoji: '📅',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    activeColor: 'bg-violet-100 text-violet-800 border-violet-300 ring-2 ring-violet-300/50',
    funnelColor: '#8b5cf6',
  },
  {
    key: 'signe',
    label: 'Signé',
    emoji: '✅',
    color: 'bg-green-50 text-green-700 border-green-200',
    activeColor: 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-300/50',
    funnelColor: '#10b981',
  },
  {
    key: 'pas_interesse',
    label: 'Pas intéressé',
    emoji: '❌',
    color: 'bg-red-50 text-red-700 border-red-200',
    activeColor: 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-300/50',
    funnelColor: '#ef4444',
  },
] as const;

export type ProspectStatusKey = typeof PROSPECT_STATUSES[number]['key'];

export const ACTIVE_FUNNEL_STATUSES: ProspectStatusKey[] = [
  'a_contacter', 'contacte', 'interesse', 'rdv_pris', 'signe',
];

export const STATUS_BY_KEY: Record<ProspectStatusKey, typeof PROSPECT_STATUSES[number]> =
  PROSPECT_STATUSES.reduce((acc, s) => ({ ...acc, [s.key]: s }), {} as Record<ProspectStatusKey, typeof PROSPECT_STATUSES[number]>);

// Couleurs disponibles pour creer un tag
export const TAG_COLORS = [
  { label: 'Rouge',  value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber',  value: '#f59e0b' },
  { label: 'Vert',   value: '#10b981' },
  { label: 'Bleu',   value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Rose',   value: '#ec4899' },
  { label: 'Gris',   value: '#6b7280' },
] as const;

export interface ProspectTag {
  id: string;
  user_id: string;
  label: string;
  color: string;
  created_at: string;
}

export interface ProspectEvent {
  id: string;
  user_id: string;
  prospect_id: string;
  event_type: 'created' | 'status_changed' | 'meeting_booked' | 'signed' | 'lost' | 'note_added' | 'tag_added' | 'tag_removed';
  from_status: ProspectStatusKey | null;
  to_status: ProspectStatusKey | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Prospect {
  id: string;
  user_id: string;
  google_place_id: string;
  business_name: string;
  business_type: string | null;
  formatted_address: string | null;
  phone_national: string | null;
  website_url: string | null;
  status: ProspectStatusKey;
  notes: string | null;
  meeting_date: string | null;
  meeting_notes: string | null;
  deal_value: number | null;
  signed_at: string | null;
  lost_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: ProspectTag[];
}
