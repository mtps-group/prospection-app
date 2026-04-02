// Alias pour compatibilité — Stripe appelle /api/webhooks/stripe
// La logique réelle est dans /api/stripe/webhooks
export { POST } from '@/app/api/stripe/webhooks/route';
