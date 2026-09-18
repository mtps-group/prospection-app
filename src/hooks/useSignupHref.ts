'use client';

import { useEffect, useState } from 'react';
import { signupQuery } from '@/lib/attribution';

/**
 * Lien vers /signup qui transporte la provenance du visiteur (utm_*, ref,
 * domaine referent). Calcule apres le montage : le rendu serveur et le
 * premier rendu client affichent "/signup", donc pas d'ecart d'hydratation.
 */
export function useSignupHref(): string {
  const [href, setHref] = useState('/signup');

  useEffect(() => {
    setHref(`/signup${signupQuery(window.location.search, document.referrer)}`);
  }, []);

  return href;
}
