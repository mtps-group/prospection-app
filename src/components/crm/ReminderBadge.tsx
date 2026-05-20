'use client';

import { Calendar, Bell } from 'lucide-react';

interface ReminderBadgeProps {
  meetingDate?: string | null;
  nextFollowupAt?: string | null;
}

function formatMeetingLabel(date: Date): { label: string; tone: 'urgent' | 'soon' | 'future' | 'past' } {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const sameDay = date.toDateString() === now.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (diffMs < 0) {
    return { label: `RDV passé`, tone: 'past' };
  }
  if (sameDay) {
    return { label: `RDV aujourd'hui ${time}`, tone: 'urgent' };
  }
  if (isTomorrow) {
    return { label: `RDV demain ${time}`, tone: 'soon' };
  }
  if (diffDays < 7) {
    return { label: `RDV dans ${diffDays}j ${time}`, tone: 'soon' };
  }
  // Date au format JJ/MM
  const dd = date.getDate().toString().padStart(2, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  return { label: `RDV ${dd}/${mm} ${time}`, tone: 'future' };
}

export function ReminderBadge({ meetingDate, nextFollowupAt }: ReminderBadgeProps) {
  if (meetingDate) {
    const d = new Date(meetingDate);
    const { label, tone } = formatMeetingLabel(d);
    const styles =
      tone === 'urgent' ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' :
      tone === 'soon' ? 'bg-orange-100 text-orange-700 border-orange-200' :
      tone === 'past' ? 'bg-gray-100 text-gray-500 border-gray-200' :
      'bg-violet-50 text-violet-700 border-violet-200';

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles}`}>
        <Calendar className="h-3 w-3" />
        {label}
      </span>
    );
  }

  if (nextFollowupAt) {
    const d = new Date(nextFollowupAt);
    const now = new Date();
    const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const overdue = diffDays < 0;
    const label = overdue
      ? `À relancer (${Math.abs(diffDays)}j en retard)`
      : diffDays === 0
        ? `À relancer aujourd'hui`
        : `À relancer dans ${diffDays}j`;
    const styles = overdue
      ? 'bg-red-100 text-red-700 border-red-200'
      : diffDays <= 1
        ? 'bg-orange-100 text-orange-700 border-orange-200'
        : 'bg-blue-50 text-blue-700 border-blue-200';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${styles}`}>
        <Bell className="h-3 w-3" />
        {label}
      </span>
    );
  }

  return null;
}
