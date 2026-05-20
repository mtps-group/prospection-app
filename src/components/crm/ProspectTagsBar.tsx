'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ProspectTag } from '@/lib/crm/constants';

interface ProspectTagsBarProps {
  prospectId: string;
  assignedTags: ProspectTag[];
  allTags: ProspectTag[];
  onChange: () => void;
}

export function ProspectTagsBar({ prospectId, assignedTags, allTags, onChange }: ProspectTagsBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const assignedIds = new Set(assignedTags.map(t => t.id));
  const availableTags = allTags.filter(t => !assignedIds.has(t.id));

  async function assign(tagId: string) {
    await fetch('/api/prospects/tags/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospect_id: prospectId, tag_id: tagId }),
    });
    setShowPicker(false);
    onChange();
  }

  async function unassign(tagId: string) {
    await fetch(`/api/prospects/tags/assign?prospect_id=${prospectId}&tag_id=${tagId}`, {
      method: 'DELETE',
    });
    onChange();
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {assignedTags.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.label}
          <button
            onClick={(e) => { e.stopPropagation(); unassign(tag.id); }}
            className="hover:bg-black/10 rounded-full p-0.5"
            title="Retirer"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {availableTags.length > 0 && (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPicker(v => !v); }}
            className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs font-medium text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-3 w-3" />
            Tag
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowPicker(false)} />
              <div className="absolute top-full mt-1 left-0 z-30 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 min-w-[140px] space-y-0.5 max-h-[200px] overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={(e) => { e.stopPropagation(); assign(tag.id); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="text-xs font-medium text-text truncate">{tag.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
