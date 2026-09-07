import { redirect } from 'next/navigation';

// Ancienne page tarifs : obsolète (3 plans au lieu de 4, CTA vers /signup
// même connecté). Les tarifs vivent sur la landing, section #tarifs.
export default function PricingPage() {
  redirect('/#tarifs');
}
