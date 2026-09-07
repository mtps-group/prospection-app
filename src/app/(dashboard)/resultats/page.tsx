import { redirect } from 'next/navigation';

// Page morte (placeholder jamais branché) : les résultats s'affichent sur
// /recherche. On garde l'URL pour d'éventuels vieux liens.
export default function ResultatsPage() {
  redirect('/recherche');
}
