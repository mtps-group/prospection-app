'use client';

import type { SocialProfiles } from '@/types';

interface SocialBadgesProps {
  socials: SocialProfiles | null | undefined;
  size?: 'sm' | 'md';
}

export function SocialBadges({ socials, size = 'sm' }: SocialBadgesProps) {
  if (!socials) return null;
  const { facebook, instagram, linkedin } = socials;
  if (!facebook && !instagram && !linkedin) return null;

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const containerSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          title="Page Facebook"
          className={`${containerSize} rounded-md bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity`}
        >
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
          </svg>
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          title="Compte Instagram"
          className={`${containerSize} rounded-md flex items-center justify-center text-white hover:opacity-80 transition-opacity`}
          style={{
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          }}
        >
          <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
      )}
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          title="Profil LinkedIn"
          className={`${containerSize} rounded-md bg-[#0A66C2] flex items-center justify-center text-white hover:opacity-80 transition-opacity`}
        >
          <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </a>
      )}
    </div>
  );
}
