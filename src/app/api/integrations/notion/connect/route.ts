import { NextResponse } from 'next/server';

// Route orpheline neutralisee lors de la revue securite du 2026-09-03.
// Ancienne implementation dans l'historique git. Les flux actifs :
// - Notion : token manuel via /compte + /api/notion/export
// - Google Sheets : OAuth via /api/google-sheets/* 
// - Email/dirigeant/SIRET : /api/ai-enrichment
const gone = () => NextResponse.json({ error: 'Route retiree' }, { status: 410 });
export const GET = gone;
export const POST = gone;
