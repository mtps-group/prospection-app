'use client';

import { useState } from 'react';
import { Phone, Globe, Euro } from 'lucide-react';
import { PROSPECT_STATUSES, type Prospect, type ProspectStatusKey } from '@/lib/crm/constants';
import { ReminderBadge } from './ReminderBadge';

interface KanbanViewProps {
  prospects: Prospect[];
  onStatusChange: (prospectId: string, newStatus: ProspectStatusKey) => Promise<void> | void;
  onProspectClick?: (prospect: Prospect) => void;
}

export function KanbanView({ prospects, onStatusChange, onProspectClick }: KanbanViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ProspectStatusKey | null>(null);

  const handleDragStart = (e: React.DragEvent, prospectId: string) => {
    setDraggingId(prospectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', prospectId);
  };

  const handleDragOver = (e: React.DragEvent, status: ProspectStatusKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(status);
  };

  const handleDragLeave = () => {
    setOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, status: ProspectStatusKey) => {
    e.preventDefault();
    const prospectId = e.dataTransfer.getData('text/plain');
    const prospect = prospects.find(p => p.id === prospectId);
    setDraggingId(null);
    setOverColumn(null);
    if (prospect && prospect.status !== status) {
      await onStatusChange(prospectId, status);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverColumn(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PROSPECT_STATUSES.map(status => {
        const items = prospects.filter(p => p.status === status.key);
        const isOver = overColumn === status.key;

        return (
          <div
            key={status.key}
            onDragOver={(e) => handleDragOver(e, status.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status.key)}
            className={`flex-shrink-0 w-72 rounded-2xl border-2 p-3 transition-colors ${
              isOver
                ? 'border-primary bg-primary/5'
                : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            {/* Header colonne */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{status.emoji}</span>
                <span className="text-xs font-bold text-text uppercase tracking-wide">{status.label}</span>
              </div>
              <span className="text-xs font-bold text-text-muted bg-white rounded-full px-2 py-0.5 border border-gray-100">
                {items.length}
              </span>
            </div>

            {/* Cartes */}
            <div className="space-y-2">
              {items.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onProspectClick?.(p)}
                  className={`rounded-xl bg-white border border-gray-100 p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-gray-200 space-y-2 ${
                    draggingId === p.id ? 'opacity-30 rotate-2' : ''
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <h4 className="font-semibold text-text text-sm flex-1 min-w-0 truncate">{p.business_name}</h4>
                  </div>

                  {p.business_type && (
                    <p className="text-xs text-text-muted truncate">{p.business_type}</p>
                  )}

                  {/* Reminder badge prioritaire */}
                  {(p.meeting_date || p.next_followup_at) && (
                    <ReminderBadge meetingDate={p.meeting_date} nextFollowupAt={p.next_followup_at} />
                  )}

                  {/* Deal value pour signés */}
                  {p.status === 'signe' && p.deal_value && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-bold text-green-700">
                      <Euro className="h-3 w-3" />
                      {p.deal_value.toLocaleString('fr-FR')} €
                    </div>
                  )}

                  {/* Tags */}
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {p.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.label}
                        </span>
                      ))}
                      {p.tags.length > 3 && (
                        <span className="text-[10px] text-text-muted">+{p.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Quick contact */}
                  <div className="flex items-center gap-3 text-xs text-text-muted pt-1.5 border-t border-gray-50">
                    {p.phone_national && (
                      <a
                        href={`tel:${p.phone_national}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-primary"
                        title={p.phone_national}
                      >
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                    {p.website_url && (
                      <a
                        href={p.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-primary"
                        title={p.website_url}
                      >
                        <Globe className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center text-xs text-text-muted">
                  Aucun prospect
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
